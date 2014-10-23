/*!
 * world.core.js
 * Define a world and manage its main loop.
 *
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013-2014 An Vo - anvo4888@gmail.com
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 */

define(function(require) {

  'use strict';

  var Event   = require('./event');
  var Female  = require('./female');
  var Male    = require('./male');
  var Seed    = require('./seed');
  var Tile    = require('./tile');


  var requestAnimationFrame = (function() {
    // Use requestAnimationFrame for better animation
    return (
      window.requestAnimationFrame       ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame    ||
      window.oRequestAnimationFrame      ||
      window.msRequestAnimationFrame     ||
      function(callback, element) {
        window.setTimeout(function() {
          callback(+new Date());
        }, 1000 / 60);
      }
    );
  })();


  // WorldJS constructor
  // Define default properties of a world
  var WorldJS = function() {
    // The value of this refers to a newly created world
    var world = this;

    // The world is currently not running
    world.running = false;
    // Trigger once after the world animation was stopped
    world.stopCallback = function() {};

    // Size of the world in pixels
    world.width   = 640;
    world.height  = 360;
    // Prevent objects from drawing outside the world
    world.padding = 10; // 10 pixels from border

    world.canvas = {
      wrapper: false,  // DOM element that wraps the canvas
      context: false   // HTML5 drawing context
    };
    world.sprite = {
      src:   'images/icons.png',
      image: false   // DOM image object of sprite
    };

    // Display mode:
    // - full:  draw seeds based on sprite image
    // - dot:   only draw a single pixel per seed
    // - none:  not draw anything
    world.displayMode = 'full';

    // World contains seeds
    // but only hold a number of total seeds.
    // Data of all seeds will be stored by the Tile module.
    world.totalSeeds = 0;
    // Each seed has an unique id
    world.nextSeedId = 1;

    // Don't draw every frame (tick) if total seeds > this value
    world.maxSafeSeedsForDisplay = 30000;

    // tickPerYear:     indicate one year passed.
    // speed:           running speed of the world,
    //                  affects moving speed and actionInterval of a seed.
    // actionInterval:  indicate how often a seed triggers its main action.
    // By default, actionInterval is as half as tickPerYear,
    // which means a seed triggers its main action twice a year.
    //
    // tickPerYear and speed must be set manually together.
    // Example:
    // tickPerYear      60  30  20  12  10  6
    // speed            1   2   3   5   6   10
    // actionInterval   30  15  10  6   5   3
    //
    // All 3 values are divisibility to avoid extra implements.
    world.tickPerYear = 60;
    world.speed       = 1;
    // actionInterval: see Seed module

    // Used for indicating a year, +1 every frame (tick)
    // Example: tickPerYear = 60
    // tickMod: 0   60  120 180 ...
    // year:    0   1   2   3   ...
    //
    // If tickPerYear is changed to 30:
    // tickMod: 210 240 ...
    // year:    4   5   ...
    world.tickMod = 0;

    // Seeds don't trigger their main actions every frame.
    // Example: In 60 frames, a male only seeks for female twice
    // in 30th frame and 60th frame (actionInterval = 30).
    // To make it's more efficient,
    // main actions of all seeds will be distributed over all frames.
    // Example: male_1 will seek for female in 30th frame, 60th frame...
    //          male_2 will seek for female in 31th frame, 61th frame...
    //
    // distributedTicks has its length equals <tickPerYear - 1>, which means:
    // In every <tickPerYear> frames
    // <tickPerYear - 1> frames are used to trigger main actions of seeds.
    // Last frame is used for other calculations such as statistic
    // or user interface update.
    world.distributedTicks = [];
    for (var i = 0; i < world.tickPerYear - 1; i++) {
      world.distributedTicks.push(0);
    }

    // Used for calculating frames per second
    world.lastTickTime = 0;
    world.fps = 0;

    world.event   = new Event(world);
    world.Female  = Female;
    world.Male    = Male;
    world.tile    = new Tile(world);
  };


  // Insert the world into a HTML wrapper
  // wrapperId: id of an HTML wrapper element
  WorldJS.prototype.init = function(wrapperId) {
    var world = this;

    // Add a canvas that fits size of its wrapper
    var canvas  = document.createElement('canvas');
    var wrapper = document.getElementById(wrapperId);
    // Size of the wrapper is also size of the world
    var width   = wrapper.clientWidth  || world.width;
    var height  = wrapper.clientHeight || world.height;

    world.canvas.wrapper = wrapper;
    world.width  = canvas.width  = width;
    world.height = canvas.height = height;

    wrapper.appendChild(canvas);

    world.canvas.context = canvas.getContext('2d');

    // Load and cache sprite
    var sprite = new Image();
    sprite.src = world.sprite.src;
    world.sprite.image = sprite;

    world.tile.init(width, height);

    return world;
  };


  // Add a seed to the world
  // Seed: seed-based class
  // data: properties of seed
  // return seed
  WorldJS.prototype.addSeed = function(Seed, data) {
    data = data || {};
    var world = this;
    var seed  = new Seed(data);

    world.totalSeeds++;

    // Save a reference of the world where this seed belongs
    seed.world = world;
    // Set an unique id
    seed.id = world.nextSeedId++;

    seed.age = data.age || 0;
    seed.tickCount = (seed.age > 0) ? seed.age * world.tickPerYear : seed.tickCount;

    // Put this seed in a frame which has the lowest number of occupied seeds
    // to avoid a single frame that needs to trigger too many main actions
    var tickIndex = world.getTickIndex();
    world.distributedTicks[tickIndex]++;
    seed.tickIndex = tickIndex;

    seed.tickMod = world.tickMod;
    // By modulusing actionInterval which is as half as tickPerYear by default
    // we have two lowest frames index: 30th (half year passed) and 60th (full year passed)
    // TODO: review the distributed ticks mechanic in different speed
    seed.tickCount += (world.tickMod + seed.tickCount + seed.tickIndex) % seed.actionInterval;
    // stepCount also need to base on seed.tickCount to avoid synchronized jumping
    // among all seeds that appeared in the same time
    seed.stepCount = seed.tickCount;
    seed.moveUntilStep = seed.moveUntilStep ||
      // Move until 2-10 more jumps
      seed.tickCount + world.random(2, 10) * seed.jumpInterval;

    // Set random position
    var position = world.getRandomPosition(seed);
    seed.x = position.x;
    seed.y = position.y;

    // Calculate tile index
    seed.tileIndex = world.tile.getIndex(seed);
    // and cache data of this seed
    world.tile.set(seed);

    world.event.trigger('seedAdded', {
      seed:   seed,
      mother: data.mother || undefined
    });

    return seed;
  };


  // Find the best tick index for this seed
  // return tick index
  WorldJS.prototype.getTickIndex = function() {
    var world = this;
    var distributedTicks = world.distributedTicks;
    var minIndex = 0;
    var minValue = distributedTicks[minIndex];
    for (var i = 0, len = distributedTicks.length; i < len; i++) {
      if (distributedTicks[i] < minValue) {
        minIndex = i;
        minValue = distributedTicks[i];
      }
    }
    return minIndex;
  };


  // Get random position in the world
  // seed:    seed-based instance
  // forced:  always get new value of x and y
  // return   {x, y}
  WorldJS.prototype.getRandomPosition = function(seed, forced) {
    forced = forced || false;
    var world = this;

    var x = (seed.x === false || forced) ?
      world.random(world.padding, world.width - seed.icon.width - world.padding) :
      seed.x;
    var y = (seed.y === false || forced) ?
      world.random(world.padding, world.height - seed.icon.height - world.padding) :
      seed.y;

    return { x: x, y: y };
  };


  // Remove a seed from the world
  // seed: seed-based instance
  WorldJS.prototype.removeSeed = function(seed) {
    var world = this;

    world.totalSeeds--;

    world.event.trigger('seedRemoved', { seed: seed });

    if (seed.relationSeed !== false) {
      // Remove the references
      seed.relationSeed.relationSeed = false;
      seed.relationSeed = false;
    }

    world.tile.rem(seed);

    world.distributedTicks[seed.tickIndex]--;

    return world;
  };


  // Add random seeds to the world
  // count: number of seeds to add
  // data:
  //        minAge, maxAge
  //        types:      array of world.Seed, world.Male, world.Female...
  //        fromBorder: determine which border seeds will appear
  WorldJS.prototype.addSeeds = function(count, data) {
    data = data || {};
    var world   = this;
    var types   = (typeof data.types !== 'undefined')  ? data.types  : [Seed];
    var minAge  = (typeof data.minAge !== 'undefined') ? data.minAge : 15;
    var maxAge  = (typeof data.maxAge !== 'undefined') ? data.maxAge : 20;

    // Add seeds to the world
    for (var i = 0; i < count; i++) {
      // Random age
      var age = world.random(minAge, maxAge);
      var seedData = { x: false, y: false, age: age };

      if (typeof data.fromBorder !== 'undefined') {
        var borders = ['top', 'bottom', 'left', 'right'];
        var border  = (data.fromBorder === 'random') ?
          borders[world.random(0, 3)] : data.fromBorder;
        // Used random number to avoid people appeared in the same edge
        switch (border) {
          case 'top':
            seedData.y = world.random(0, world.padding);
            break;
          case 'bottom':
            seedData.y = world.random(
              world.height - world.padding - 1,
              world.height - 1
            );
            break;
          case 'left':
            seedData.x = world.random(0, world.padding);
            break;
          case 'right':
            seedData.x = world.random(
              world.width - world.padding - 1,
              world.width - 1
            );
            break;
        }
      }
      world.addSeed(types[i % types.length], seedData);
    }

    return world;
  };


  // World process loop
  WorldJS.prototype.run = function(time) {
    var world       = this;
    var context     = world.canvas.context;
    var spriteImage = world.sprite.image;

    // Modulus tickMod by tickPerYear to avoid its value grows too large
    world.tickMod   = (++world.tickMod) % world.tickPerYear;
    var yearPassed  = (world.tickMod === 0);

    // Only draw the world every year instead of every frame if total seeds is too large
    var reDraw = (world.totalSeeds <= world.maxSafeSeedsForDisplay || yearPassed);
    if (reDraw) {
      // Clear canvas
      context.clearRect(0, 0, world.width, world.height);
    }

    var listTile = world.tile.list;
    var maxDisplayedSeeds = world.tile.maxDisplayedSeeds;
    var speed = world.speed;
    for (var i = 0, len = listTile.length; i < len; i++) {
      var seeds = listTile[i];
      var displayedSeeds = 0;
      for (var j = 0, len2 = seeds.length; j < len2; j++) {
        if (seeds[j]) {
          var seed = seeds[j];
          var oldTileIndex = seed.tileIndex;

          // When a seed moves to a different tile, its reference may be inserted into
          // an empty spot of tile array instead of just appending to the array.
          // That reference will possibly be available on next pass of the current loop
          // which could cause a seed ticks twice.
          //
          // Used tickMod to indicate a seed is already ticked in the current loop.
          if (seed.tickMod == world.tickMod) {
            continue;
          }
          seed.tickMod = world.tickMod;

          if (yearPassed) {
            seed.age++;
          }

          if (reDraw) {
            // Don't need to draw too many seeds in a small area of a single tile
            if (displayedSeeds < maxDisplayedSeeds) {
              // Draw current state of the seed
              switch (world.displayMode) {
                case 'full':
                  seed.draw(context, spriteImage);
                  break;
                case 'dot':
                  seed.draw(context, false);
                  break;
                case 'none':
                  break;
              }
              displayedSeeds++;
            }
          }
          // Seed moves around or triggers some actions
          seed.tick(speed);

          // Update tiles if seed moves
          var newTileIndex = world.tile.getIndex(seed);
          if (newTileIndex !== oldTileIndex) {
            // Remove seed reference from old tile
            world.tile.rem(seed);

            // Add seed reference to new tile
            seed.tileIndex = newTileIndex;
            world.tile.set(seed);
          }
        }
      }
    }

    if (yearPassed) {
      world.event.trigger('yearPassed');

      if (world.totalSeeds === 0) {
        // Stop the world
        world.running = false;
        return;
      }
    }

    // Loop animation
    if (world.running) {
      world.fps = 1000 / (time - world.lastTickTime);
      world.lastTickTime = time;

      // Don't know why bind() doesn't work with Grunt/PhantomJS/QUnit
      // requestAnimationFrame(world.run.bind(world));
      requestAnimationFrame(function() { world.run.call(world); });
    } else {
      // Trigger once
      world.stopCallback.call(world);
      world.stopCallback = function() {};
    }

    return world;
  };


  // Start the world
  WorldJS.prototype.start = function() {
    var world = this;

    world.running = true;
    world.run();

    return world;
  };


  // Stop the world
  // callback (optional): callback trigger after the world stopped
  WorldJS.prototype.stop = function(callback) {
    var world = this;

    world.running = false;
    if (typeof callback === 'function') {
      world.stopCallback = callback;
    }

    return world;
  };


  // Generate random number X: min <= X <= max
  // min: min number
  // max: max number
  WorldJS.prototype.random = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };


  return WorldJS;

});


/*!
 * world.tile.js
 * Divide a world into tiles.
 * Each tile holds references to all seeds (objects) that currently stay in it.
 *
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013-2014 An Vo - anvo4888@gmail.com
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 */

define(function() {

  'use strict';


  // Tile constructor
  // world: instance of WorldJS
  var Tile = function(world) {
    var worldTile = this;

    // Store reference of a world
    worldTile.world = world;

    // Old storage structure:
    // An array contains tiles, each tile is a hashmap:
    // list = [
    //    0: { seedId1: seed1, seedId2: seed2 },  // 1st tile
    //    1: { ... }                              // 2nd tile
    // ]
    // - Pros: Simple add & remove operations
    // - Cons: Iterating large hashmap is much slower than large array
    // http://jsperf.com/fetch-array-vs-object
    //
    // New storage structure:
    // An array contains tiles, each tile is also an array:
    // list = [
    //    0: [ 0: seed1, 1: seed2 ],              // 1st tile
    //    1: [ ... ]                              // 2nd tile
    // ]
    // Retrieve seed by array index.
    // Require new property - seed.tileArrayIndex - to store
    // the location (array index) of the seed in a tile array.
    //
    // For example, base on the list above:
    // seed1.tileArrayIndex = 0, seed2.tileArrayIndex = 1
    // When a seed is removed from tile, that tile's array index is
    // available for inserting a new seed:
    // Tile.rem(seed1);
    // => list = [ 0: [ 0: false, 1: seed2 ], 1: [ ... ] ]
    // The first tile has 1 available array index which is at 0 index.
    // => availableArrayIndexes = [ 0: [0], 1: [] ]
    // Tile.add(seed3);
    // => list = [ 0: [ 0: seed3, 1: seed2 ], 1: [ ... ] ]
    // The first tile doesn't have any available array index
    // => availableArrayIndexes = [ 0: [], 1: [] ]

    // List of tiles,
    // each tile is an array of seeds
    worldTile.list = [];
    // List of available indexes
    // where a new seed can be inserted into
    worldTile.availableArrayIndexes = [];

    // 20 x 20 pixels per tile
    worldTile.size = 20;

    // Only draw 7 seeds each tile
    worldTile.maxDisplayedSeeds = 7;

    // Need to be calculated base on the size of the world
    worldTile.totalTiles  = false;
    worldTile.tilesPerRow = false;
    worldTile.tilesPerCol = false;
  };


  // Divide the world into smaller tiles.
  // Each tile contains a list of seeds that are currently inside.
  // width:   width of the world in pixel
  // height:  height of the world in pixel
  Tile.prototype.init = function(width, height) {
    var worldTile   = this;
    var tileSize    = worldTile.size;
    var tilesPerRow = Math.ceil(height / tileSize);
    var tilesPerCol = Math.ceil(width / tileSize);
    var totalTiles  = tilesPerRow * tilesPerCol;

    worldTile.tilesPerRow = tilesPerRow;
    worldTile.tilesPerCol = tilesPerCol;
    worldTile.totalTiles  = totalTiles;

    // Initialize tiles with an array of empty arrays
    var listTiles = worldTile.list;
    var availableArrayIndexes = worldTile.availableArrayIndexes;
    for (var i = 0; i < totalTiles; i++) {
      listTiles.push([]);
      availableArrayIndexes.push([]);
    }
  };


  // Get tile index
  // seed: instance of Seed
  Tile.prototype.getIndex = function(seed) {
    var tileSize = this.size;
    var x = Math.floor(seed.x / tileSize);
    var y = Math.floor(seed.y / tileSize);
    return x + (y * this.tilesPerCol);
  };


  // Add seed to a tile based on seed.tileIndex.
  // A new tileIndex value of the seed must be calculated
  // before call this function.
  // seed: instance of Seed
  Tile.prototype.set = function(seed) {
    var worldTile = this;
    var tileIndex = seed.tileIndex;
    var tile      = worldTile.list[tileIndex];
    var availableArrayIndexes = worldTile.availableArrayIndexes[tileIndex];

    if (availableArrayIndexes.length > 0) {
      // Add seed to the tile by
      // inserting it into the available array index
      seed.tileArrayIndex = availableArrayIndexes.pop();
      tile[seed.tileArrayIndex] = seed;
    } else {
      // Add seed to the tail of tile array
      seed.tileArrayIndex = tile.length;
      tile.push(seed);
    }
  };


  // Remove seed from the tile where it is currently in
  // seed: instance of Seed
  Tile.prototype.rem = function(seed) {
    var worldTile = this;
    var tileIndex = seed.tileIndex;
    var tileArrayIndex = seed.tileArrayIndex;

    // Set to false instead of delete an array element
    // to avoid holey array which is much slower to access
    // than packed array
    // http://jsperf.com/packed-vs-holey-arrays/10
    worldTile.list[tileIndex][tileArrayIndex] = false;

    // Store new available array index
    // to indicate where new seed can be inserted into later
    worldTile.availableArrayIndexes[tileIndex].push(tileArrayIndex);
  };


  return Tile;

});


/*!
 * world.event.js
 * Register behaviors to take effect when an event occurs
 *
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013-2014 An Vo - anvo4888@gmail.com
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 */

define(function() {

  'use strict';


  // Event constructor
  // Initialize events list for a world
  var Event = function(world) {
    var worldEvent = this;

    // Store reference of a world
    worldEvent.world = world;

    // All of the available events must be declared here
    worldEvent.list = {
      // One event can have many actions that are registered by action names
      // Unused actions must be removed manually
      yearPassed:   { /* action: handler */ },
      seedAdded:    {},
      seedRemoved:  {}
    };
  };


  // Add a handler function to an event
  // event:   event name
  // action:  action name
  // handler: handler function
  Event.prototype.add = function(event, action, handler) {
    this.list[event][action] = handler;
  };


  // Remove a handler function from an event
  // event:   event name
  // action:  action name
  Event.prototype.remove = function(event, action) {
    delete this.list[event][action];
  };


  // Trigger an event
  // world: the world that takes effects
  // event: event name
  Event.prototype.trigger = function(event, data) {
    var worldEvent  = this;
    var world       = worldEvent.world;
    var actions     = worldEvent.list[event];

    for (var actionName in actions) {
      if (actions.hasOwnProperty(actionName)) {
        actions[actionName].call(world, data);
      }
    }
  };


  return Event;

});


/*!
 * world.seed.js
 * Define an object that will be added to a world
 * to live and interact with other objects.
 *
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013-2014 An Vo - anvo4888@gmail.com
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 */

define(function() {

  'use strict';


  // Seed constructor
  // data (optional): x, y, icon, relationSeed, tickCount, actionInterval, moveTo
  var Seed = function(data) {
    // The value of this refers to a newly created seed
    var seed = this;

    // Only be set when the seed was successfully added to a world
    seed.world      = false;
    seed.id         = false;
    seed.tileIndex  = false;
    seed.tickIndex  = false;
    seed.tickMod    = false;

    seed.age = data.age || 0;

    // Seed coordinate (top, left)
    seed.x = (typeof data.x === 'undefined') ? false : data.x;
    seed.y = (typeof data.y === 'undefined') ? false : data.y;

    // Define how to draw the seed
    seed.icon = data.icon || { width: 1, height: 1 };
    seed.carrying = data.carrying || false;

    // Relationship of the seed
    seed.relationSeed = data.relationSeed || false;

    // Be default, seed moves around every frame (tickCount++ each frame).
    // Its main actions such as seeking partner or giving birth
    // only trigger every <actionInterval> interval.
    seed.tickCount      = data.tickCount || 0;
    seed.actionInterval = data.actionInterval || 30;

    // stepCount++ only in every tick the seed moves.
    // Seed will move then stop based on the following rule:
    // Keep moving until the <moveUntilStep>th step, then stopped.
    // After stopped, wait until <ageToMoveAgain> age to move around again.
    //
    // jumpInterval: make an animation like jumping when seed moves.
    // A seed only stops after it finished a full jump (landing).
    seed.stepCount      = seed.tickCount;
    seed.jumpInterval   = 20;
    seed.moveUntilStep  = data.moveUntilStep || 0;
    seed.ageToMoveAgain = 0;
    seed.isMoving       = false;

    // Destination coordinate for seed to move to
    seed.moveTo = data.moveTo || false;
  };


  // Display the seed in the world
  Seed.prototype.draw = function(context, spriteImage) {
    var seed = this;

    if (spriteImage === false || seed.icon.width === 1) {
      var width   = (spriteImage !== false) ? seed.icon.width :  1;
      var height  = (spriteImage !== false) ? seed.icon.height : 1;
      context.fillRect(seed.x, seed.y, width, height);
    } else {
      // Handle child-state of the seed
      var icon = (seed.age <= seed.maxChildAge) ? seed.icon.child : seed.icon;

      // Jump instead of slide when seed moves
      // Example:   jumpInterval = 10
      // jumpIndex: 0 1 2 3 4 5 6 7 8 9
      // jumpY:     1 2 3 4 5 4 3 2 1 0
      var jumpInterval  = seed.jumpInterval;
      var halfInterval  = 10;
      var jumpIndex     = seed.stepCount % jumpInterval;
      var jumpY         = (jumpIndex < halfInterval) ?
        jumpIndex + 1 : halfInterval - (jumpIndex % halfInterval) - 1;

      context.drawImage(
        spriteImage,
        icon.x, icon.y,         icon.width, icon.height,
        seed.x, seed.y - jumpY, icon.width, icon.height
      );
      if (seed.carrying !== false && seed.carrying !== 'none') {
        var carrying = seed.carrying;
        context.drawImage(
          spriteImage,
          carrying.x,           carrying.y,                   carrying.width, carrying.height,
          seed.x + carrying.dx, seed.y - jumpY + carrying.dy, carrying.width, carrying.height
        );
      }
    }
  };


  // Get carrying item
  Seed.prototype.getCarryingItem = function(who, when) {
    var seed  = this;
    var world = seed.world;

    if (typeof world.items !== 'undefined') {
      var items = world.items;
      var availableItems = [];
      for (var type in items) {
        var item = items[type];
        if (item.enabled === true && item.who === who && item.when === when) {
          availableItems.push(item.icon);
        }
      }

      var totalAvailableItems = availableItems.length;
      if (totalAvailableItems === 1) {
        return availableItems[0];
      } else if (totalAvailableItems > 1) {
        return availableItems[world.random(0, totalAvailableItems - 1)];
      }
    }

    return false;
  };


  // Update new coordinate of the seed in the world
  // speed: speed of the world
  // beforeMoveCallback: callback function or false
  Seed.prototype.move = function(speed, beforeMoveCallback) {
    var seed    = this;
    var world   = seed.world;
    var random  = world.random;

    // By default, seed keeps moving around the world
    seed.isMoving = true;
    if (!beforeMoveCallback) {
      // Read the comment on seed's constructor for more info
      if (seed.stepCount >= seed.moveUntilStep) {
        if (seed.ageToMoveAgain === 0 || seed.ageToMoveAgain > seed.age) {
          if (seed.ageToMoveAgain === 0) {
            // Don't move much when getting old
            seed.ageToMoveAgain = seed.age + random(2, seed.age);
            seed.carrying = false;
          }
          seed.isMoving = false;
          return;
        } else {
          seed.ageToMoveAgain = 0;
          // Move until 2-10 more jumps
          seed.moveUntilStep = seed.stepCount + random(2, 10) * seed.jumpInterval;
          seed.carrying = false;
        }
      }
    } else {
      beforeMoveCallback.call(seed);
    }

    if (seed.moveTo === false ||
      (seed.moveTo.x === seed.x && seed.moveTo.y === seed.y)
    ) {
      // Make another moveTo coordinate
      seed.moveTo = world.getRandomPosition(seed, true);
    }

    seed.stepCount++;

    // Move in 8-direction to reach moveTo coordinate,
    // <speed> pixels per frame (tick)
    if (seed.x < seed.moveTo.x) {
      seed.x = Math.min(seed.x + speed, seed.moveTo.x);
    } else if (seed.x > seed.moveTo.x) {
      seed.x = Math.max(seed.x - speed, 0);
    }

    if (seed.y < seed.moveTo.y) {
      seed.y = Math.min(seed.y + speed, seed.moveTo.y);
    } else if (seed.y > seed.moveTo.y) {
      seed.y = Math.max(seed.y - speed, 0);
    }
  };


  // Seek neighbour tiles and return the first seed that matches the condition
  // condition: function(candidate) { if (...) return true; } or false
  Seed.prototype.seek = function(condition) {
    var seed = this;
    var tile = seed.world.tile;
    var direction = [
      [0, 0],                             // current tile
      [-1, 0], [1, 0], [0, -1], [0, 1],   // w, e, n, s tile
      [-1, -1], [-1, 1], [1, -1], [1, 1]  // nw, sw, ne, se tile
    ];

    if (!condition) {
      // No filter, return first seed of the current tile
      condition = function(candidate) {
        return (candidate.id != seed.id);
      };
    }

    var tilesPerRow = tile.tilesPerRow;
    var tilesPerCol = tile.tilesPerCol;
    for (var i = 0, len = direction.length; i < len; i++) {
      var thisTileIndex;
      if (i === 0) {
        thisTileIndex = seed.tileIndex;
      } else {
        // Get the neighbour tile
        var row = (seed.tileIndex % tilesPerRow) + direction[i][0];
        var col = Math.floor(seed.tileIndex / tilesPerRow) + direction[i][1];
        if (row >= 0 && row < tilesPerRow && col >= 0 && col < tilesPerCol) {
          thisTileIndex = row + col * tilesPerRow;
        } else {
          // Invalid tile
          continue;
        }
      }
      var seeds = tile.list[thisTileIndex];
      for (var j = 0, len2 = seeds.length; j < len2; j++) {
        if (seeds[j] && seed.id != seeds[j].id) {
          var candidateSeed = seeds[j];
          if (condition.call(seed, candidateSeed)) {
            // Matched candidate
            return candidateSeed;
          }
        }
      }
    }
    return false;
  };


  // Move around every frame (tick)
  // speed: speed of the world
  Seed.prototype.tick = function(speed) {
    var seed = this;
    seed.tickCount++;
    seed.move(speed);
  };


  // Get chance base on age of the seed
  // Example: { range: [1, 5], from: 0.01, to: 0.05 }
  // Age:     1   2   3   4   5
  // Chance:  1%  2%  3%  4%  5%
  Seed.prototype.getChance = function(type) {
    var seed  = this;
    var base  = seed.chances[type];
    var age   = seed.age;

    var i           = 0;
    var fromAge     = 0;
    var fromChance  = 0;
    var delta       = 0;
    while (base[i] && age >= base[i].range[0]) {
      var thisBase  = base[i];
      fromAge       = thisBase.range[0];
      fromChance    = thisBase.from;
      delta = (thisBase.to - thisBase.from) / (thisBase.range[1] - thisBase.range[0]);
      i++;
    }

    return fromChance + (age - fromAge) * delta;
  };


  return Seed;

});


/*!
 * world.male.js
 * Male extends Seed class.
 *
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013-2014 An Vo - anvo4888@gmail.com
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 */

define(function(require) {

  'use strict';

  var Seed = require('./seed');


  // Male constructor
  // data (optional): seed data, age, chances
  var Male = function(data) {
    var male = this;

    data.icon = {
      x: 0, y: 0,
      width: 13, height: 20,
      child: { // must define maxChildAge
        x: 26, y: 0,
        width: 11, height: 10
      }
    };

    Seed.call(male, data);

    male.maxChildAge = 15;

    male.chances = data.chances || {
      death: [
        { range: [1, 20],   from: 0.02, to: 0.01 },
        { range: [20, 60],  from: 0.01, to: 0.02 },
        { range: [60, 80],  from: 0.02, to: 0.05 },
        { range: [80, 100], from: 0.05, to: 0.9 }
      ],
      marriage: [
        { range: [15, 30],  from: 0.1,  to: 0.5 },
        { range: [30, 50],  from: 0.5,  to: 0.1 },
        { range: [50, 80],  from: 0.1,  to: 0.01 }
      ]
    };
  };
  Male.prototype = Object.create(Seed.prototype);
  Male.prototype.contructor = Male;


  // Male action in every frame (tick)
  // speed: speed of the world
  Male.prototype.tick = function(speed) {
    var male  = this;
    var world = male.world;

    male.tickCount++;

    var actionInterval = male.actionInterval / speed;
    if (male.tickCount % actionInterval === actionInterval - 1) {
      // Trigger every <actionInterval> ticks
      var deathChance = male.getChance('death');
      if (deathChance > 0 && Math.random() < deathChance) {
        world.removeSeed(male);
        return;
      }

      if (male.relationSeed === false && male.age >= male.chances.marriage[0].range[0]) {
        // Seeking for female
        var marriageChance = male.getChance('marriage');
        if (marriageChance > 0) {
          var failureChance = Math.random();
          if (failureChance < marriageChance) {
            var female = male.seek(function(candidate) {
              var male  = this;
              var world = male.world;
              return (
                candidate instanceof world.Female &&
                candidate.relationSeed === false &&
                // Enough age to give birth
                candidate.age >= candidate.chances.childbirth[0].range[0] &&
                // Failure chance increase (every 10 age difference)
                // if male is younger than female
                (candidate.age <= male.age ||
                  (failureChance * (Math.ceil((candidate.age - male.age) / 10))) < marriageChance)
              );
            });
            if (female !== false) {
              male.relationSeed   = female;
              female.relationSeed = male;

              if (typeof female.totalChildren === 'undefined') {
                // Start record all children of this female
                female.totalChildren = 0;
              }

              // Prevent having children right after married
              female.ageLastBear = female.age + 1;

              male.carrying   = false;
              female.carrying = false;
            }
          }
        }
      }
    }

    if (male.relationSeed !== false) {
      if (male.x === Math.max(0, male.relationSeed.x - 10) && male.y === male.relationSeed.y) {
        return;
      }
      male.move(speed, function() {
        // Men will follow his wife
        var male   = this;
        var female = male.relationSeed;

        male.moveTo.x = Math.max(male.world.padding, female.x - 10);
        male.moveTo.y = female.y;
      });
    } else {
      male.move(speed, false);
    }

    if (male.carrying === false && typeof world.items !== 'undefined') {
      if (Math.random() < 0.2) {
        if (male.age > male.maxChildAge) {
          var who  = (male.relationSeed === false) ? 'man' : 'husband';
          var when = (male.isMoving) ? 'moving' : 'standing';
          male.carrying = male.getCarryingItem(who, when);
        }
      } else {
        male.carrying = 'none';
      }
    }
  };


  return Male;

});


/*!
 * world.female.js
 * Female extends Seed class.
 *
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013-2014 An Vo - anvo4888@gmail.com
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 */

define(function(require) {

  'use strict';

  var Seed = require('./seed');


  // Female constructor
  // data (optional): seed data, age, chances
  var Female = function(data) {
    var female = this;

    data.icon = {
      x: 13, y: 0,
      width:  13, height: 20,
      child: { // must define maxChildAge
        x: 26, y: 10,
        width: 11, height: 10
      }
    };

    Seed.call(female, data);

    female.maxChildAge = 15;

    // Total children that she gave birth
    // Need to be set from undefined to 0 right after her first marriage
    female.totalChildren = undefined;
    // The age when she bears her youngest child
    female.ageLastBear = 0;

    female.chances = data.chances || {
      death: [
        { range: [1, 25],   from: 0.02, to: 0.01 },
        { range: [25, 65],  from: 0.01, to: 0.02 },
        { range: [65, 85],  from: 0.02, to: 0.05 },
        { range: [85, 105], from: 0.05, to: 0.9 }
      ],
      childbirth: [
        { range: [15, 25],  from: 0.1, to: 0.25 },
        { range: [25, 50],  from: 0.25, to: 0.1 },
        { range: [50, 70],  from: 0.1, to: 0.001 }
      ]
    };
  };
  Female.prototype = Object.create(Seed.prototype);
  Female.prototype.contructor = Female;


  // Female action in every frame (tick)
  // speed: speed of the world
  Female.prototype.tick = function(speed) {
    var female  = this;
    var world   = female.world;

    female.tickCount++;

    var actionInterval = female.actionInterval / speed;
    if (female.tickCount % actionInterval === actionInterval - 1) {
      // Trigger every <actionInterval> ticks
      var age = female.age;

      var deathChance = female.getChance('death');
      if (deathChance > 0 && Math.random() < deathChance) {
        world.removeSeed(female);
        return;
      }

      if (female.relationSeed !== false && // Is married
        // Enough age to give birth
        age >= female.chances.childbirth[0].range[0] &&
        // Not give birth in the same year
        age > female.ageLastBear
      ) {
        var childBirthChance = female.getChance('childbirth');
        if (childBirthChance > 0 && Math.random() < childBirthChance) {
          // +1 because she has more than 1 chance to give birth every year
          // depended on actionInterval
          female.ageLastBear = age + 1;
          female.totalChildren++;

          var data = {
            x: female.x,
            y: Math.min(
              world.height - 1 - world.padding,
              female.y + Math.floor(female.icon.height / 2)
            ),
            mother: female
          };

          if (Math.random() < 0.5) {
            world.addSeed(world.Male, data);
          } else {
            world.addSeed(world.Female, data);
          }
        }
      }
    }

    female.move(speed, false);

    if (female.carrying === false && typeof world.items !== 'undefined') {
      if (Math.random() < 0.2) {
        if (female.age > female.maxChildAge) {
          var who  = (female.relationSeed === false) ? 'woman' : 'wife';
          var when = (female.isMoving) ? 'moving' : 'standing';
          female.carrying = female.getCarryingItem(who, when);
        }
      } else {
        female.carrying = 'none';
      }
    }
  };


  return Female;

});


/*!
 * world.statistic.js
 * Track more statistic data of a world.
 *
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013-2014 An Vo - anvo4888@gmail.com
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 */

define(function() {

  'use strict';


  // Statistic constructor
  var Statistic = function(world) {
    var worldStatistic = this;

    // Store reference of a world
    worldStatistic.world = world;

    worldStatistic.year = 0;

    // Re-calculate every year
    worldStatistic.population = 0;
    worldStatistic.men        = 0;  // adult male
    worldStatistic.women      = 0;  // adult female
    worldStatistic.boys       = 0;  // young male
    worldStatistic.girls      = 0;  // young female
    worldStatistic.families   = 0;

    // Record when someone was born
    // Max age of a person and the year when he/she died
    worldStatistic.maxAge     = 0;
    worldStatistic.yearMaxAge = 0;

    // Record when someone died
    // Used for calculating average age
    worldStatistic.die    = 0;  // Number of dead people
    worldStatistic.sumAge = 0;  // and total age of them

    worldStatistic.avgChildren = 0;

    var worldEvent = world.event;
    worldEvent.add('yearPassed', 'statistic', function() {
      this.statistic.yearPassed();
    });
    worldEvent.add('seedRemoved', 'statistic', function(data) {
      this.statistic.seedRemoved(data.seed);
    });
  };


  // Calculate when a seed is removed from the world
  Statistic.prototype.seedRemoved = function(seed) {
    var worldStatistic = this;

    worldStatistic.die++;

    // Max age of a person and the year when he/she died
    var age = seed.age;
    if (age > worldStatistic.maxAge) {
      worldStatistic.maxAge = age;
      worldStatistic.yearMaxAge = worldStatistic.year;
    }
    worldStatistic.sumAge += age;
  };


  // Calculate when a year is passed
  Statistic.prototype.yearPassed = function() {
    var worldStatistic = this;
    var world     = worldStatistic.world;
    var listTile  = world.tile.list;

    var population  = 0;
    var totalIQ     = 0;
    var men         = 0;
    var women       = 0;
    var boys        = 0;
    var girls       = 0;
    var families    = 0;
    var children    = 0;

    for (var i = 0, len = listTile.length; i < len; i++) {
      var seeds = listTile[i];
      for (var j = 0, len2 = seeds.length; j < len2; j++) {
        if (seeds[j]) {
          var seed = seeds[j];

          population++;
          if (seed instanceof world.Male) {
            if (seed.age <= seed.maxChildAge) {
              boys++;
            } else {
              men++;
              if (seed.relationSeed !== false) {
                families++;
              }
            }
          } else {
            if (seed.age <= seed.maxChildAge) {
              girls++;
            } else {
              women++;
              if (typeof seed.totalChildren !== 'undefined') {
                children += seed.totalChildren;
              }
            }
          }
        }
      }
    }

    worldStatistic.year++;

    worldStatistic.population = population;
    worldStatistic.men        = men;
    worldStatistic.women      = women;
    worldStatistic.boys       = boys;
    worldStatistic.girls      = girls;
    worldStatistic.families   = families;

    worldStatistic.avgChildren = Math.floor(children / women) || 0;
  };


  return Statistic;

});


/*!
 * world.rules.js (require Statistic module)
 * Define rules that will affect a world and all of its living seeds.
 *
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013-2014 An Vo - anvo4888@gmail.com
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 */

define(function(require) {

  'use strict';

  var Seed = require('./seed');


  // Rules constructor
  // Define default rules of the world
  var Rules = function(world) {
    var worldRules = this;

    // Store reference of a world
    worldRules.world = world;

    worldRules.population = {
      limit: 100
    };

    // Base chances
    worldRules.chance = {
      death:      0,
      marriage:   0,
      childbirth: 0
    };

    // Chances that increase or decrease temporarily
    // based on some specific value
    worldRules.chanceIncr = {
      death:      0,
      marriage:   0,
      childbirth: 0
    };

    worldRules.food = {
      // Produce 1 food per year
      adult: 1,
      // Consume 1 food per year
      child: -1,
      // Percent of food resource increase per 10 years (if enabled)
      // TODO: this should be handled from here instead of in knowledge.data
      resourceIncr: 0,
      // Minimum food value
      min: -10000
    };

    // When famine affected,
    // death chance increase 10% every -100 food
    worldRules.famine = {
      deathChanceIncr: 0.1,
      unit: -100
    };

    // Food decrease 90% every year
    worldRules.foodSpoilage = {
      foodDecr: 0.9,
      interval: 1
    };

    // Death chance increase for each man surpass the population limit
    worldRules.largeCooperation = {
      deathChanceIncr: 0.1,
      unit: 1
    };

    var worldStatistic  = world.statistic;
    worldStatistic.food = 0;
    worldStatistic.foodResource = 500;

    var worldEvent = world.event;
    worldEvent.add('yearPassed', 'rules', function() {
      var world = this;
      world.rules.change();
    });

    // Something's wrong with the Seed.prototype when using QUnit
    /*if (typeof Seed.prototype.getChanceInjected === 'undefined') {
      Seed.prototype.getChanceInjected = function() {};

      var getChance = Seed.prototype.getChance;
      Seed.prototype.getChance = function(type) {
        var seed        = this;
        var world       = seed.world;
        var worldRules  = world.rules;
        var chance      = getChance.call(seed, type);

        if (typeof worldRules.chance[type] !== 'undefined' && worldRules.chance[type] !== 0) {
          // Modify chance based on rule of the world
          chance += chance * worldRules.chance[type];
        }
        return chance;
      };
    }*/
  };


  // Change rules of the world
  Rules.prototype.change = function() {
      var worldRules      = this;
      var world           = worldRules.world;

      var worldStatistic  = world.statistic;

      var food            = worldStatistic.food;
      var foodResource    = worldStatistic.foodResource;
      var population      = worldStatistic.population;
      var totalAdult      = worldStatistic.men + worldStatistic.women;
      var totalChildren   = worldStatistic.boys + worldStatistic.girls;

      var foodProduce = Math.min(
        foodResource,
        totalAdult * worldRules.food.adult
      );
      var foodConsume = totalChildren * worldRules.food.child;
      var foodDelta   = foodProduce + foodConsume;

      // Obtain food from food resource
      foodResource = Math.max(0, foodResource - foodProduce);
      food += foodDelta;

      if (food < worldRules.food.min) {
        food = worldRules.food.min;
      }

      var deathChance = 0;
      var delta       = 0;

      // Famine: increase death chance
      if (food <= worldRules.famine.unit) {
        delta = Math.floor(food / worldRules.famine.unit);
        deathChance += delta * worldRules.famine.deathChanceIncr;
      }

      // Food spoilage: decrease food
      if (worldStatistic.year % worldRules.foodSpoilage.interval === 0 && food > 0) {
        food -= Math.floor(food * worldRules.foodSpoilage.foodDecr);
      }

      // Population limit: increase death chance
      if (population > worldRules.population.limit) {
        delta = population - worldRules.population.limit;
        delta = Math.floor(delta / worldRules.largeCooperation.unit);
        deathChance += delta * worldRules.largeCooperation.deathChanceIncr;
      }

      // Apply new changes
      worldStatistic.food         = food;
      worldStatistic.foodResource = foodResource;
      worldRules.chance.death     = deathChance + worldRules.chanceIncr.death;
  };


  return Rules;

});


/*!
 * world.knowledge.js (require Statistic and Rules module)
 * Add IQ to humans so they can learn knowledge to survive.
 *
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013-2014 An Vo - anvo4888@gmail.com
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 */

define(function() {

  'use strict';


  // Knowledge constructor
  var Knowledge = function(world) {
    var worldKnowledge = this;

    // Store reference of a world
    worldKnowledge.world = world;

    // List of all knowledge
    worldKnowledge.list = {
      // samp: {
      //    // Knowledge id
      //    id: 'samp',
      //    // Display name
      //    name: 'Sample knowledge',
      //    description: '',
      //    iq: {
      //      // Priority factor: 0.1 (low), 1 (normal), 2 (high)
      //      priority: 1,
      //      // Gained IQ
      //      // Need 1000 IQ to start to affect the world
      //      gained: 0,
      //      required: 1000
      //    },
      //    // List of following knowledge that will be started
      //    // after this one completed
      //    following: ['samp2', 'samp3'],
      //    // The year when this knowledge started to affect the world
      //    affectedYear: false,
      //    // Callback
      //    onAffected: function(world) { }
      // }
    };

    // Trending knowledge id list
    worldKnowledge.trending = [];

    worldKnowledge.trendingAdded    = function() {};
    worldKnowledge.trendingRemoved  = function() {};

    // Completed knowledge list
    worldKnowledge.completed = [];

    var worldStatistic = world.statistic;
    // Total IQ
    worldStatistic.iq = 0;
    // Max IQ of a person and the year when he/she was born
    worldStatistic.maxIQ      = 0;
    worldStatistic.yearMaxIQ  = 0;

    var worldRules = world.rules;
    worldRules.baseIQ = 0;

    var worldEvent = world.event;
    worldEvent.add('seedAdded', 'knowledge', function(data) {
      this.knowledge.seedAdded(data);
    });
    worldEvent.add('seedRemoved', 'knowledge', function(data) {
      this.knowledge.seedRemoved(data);
    });
    worldEvent.add('yearPassed', 'knowledge', function() {
      this.knowledge.gain();
    });
  };


  // Seed added event for Knowledge module
  Knowledge.prototype.seedAdded = function(data) {
    var seed  = data.seed;
    var world = seed.world;

    // Add IQ to seed
    if (typeof data.mother !== 'undefined') {
      // Inherit IQ from its parent
      seed.iq = Math.round((data.mother.relationSeed.iq + data.mother.iq) / 2);
    }

    seed.iq = seed.iq || 0;
    seed.iq += world.random(0, 3);

    seed.iq += world.rules.baseIQ;

    // Statistic
    var worldStatistic = world.statistic;
    worldStatistic.iq += seed.iq;
    if (seed.iq > worldStatistic.maxIQ) {
      worldStatistic.maxIQ      = seed.iq;
      worldStatistic.yearMaxIQ  = worldStatistic.year;
    }
  };


  // Seed removed event for Knowledge module
  Knowledge.prototype.seedRemoved = function(data) {
    var seed  = data.seed;
    var world = seed.world;

    world.statistic.iq -= seed.iq;
  };


  // Gain knowledge
  Knowledge.prototype.gain = function() {
    var worldKnowledge = this;
    var world = worldKnowledge.world;

    var year    = world.statistic.year;
    var totalIQ = world.statistic.iq;
    var distributedIQList     = [];
    var totalDistributedUnit  = 0;

    var knowledge = false;
    var i, len;

    // Create distributed IQ list.
    // All IQ will be randomly distributed to trending knowledge
    // and 1 fake knowledge each year.
    // Distributing to a fake knowledge is represented
    // as wasted IQ every year.
    for (i = 0, len = worldKnowledge.trending.length; i <= len; i++) {
      distributedIQList[i] = world.random(0, 100);
      if (i < len) {
        knowledge = worldKnowledge.list[worldKnowledge.trending[i]];
        if (knowledge.iq.priority != 1) {
          distributedIQList[i] *= knowledge.iq.priority;
        }
      }
      // Store the total to calculate percent later
      totalDistributedUnit += distributedIQList[i];
    }

    var maxDistributedValues = { '0.1': 0.01, '1': 0.05, '2': 0.1 };
    var tmpTrending   = [];
    var tmpFollowing  = [];
    var tmpCompleted  = [];
    for (i = 0, len = worldKnowledge.trending.length; i < len; i++) {
      knowledge = worldKnowledge.list[worldKnowledge.trending[i]];
      var distributedIQ = totalIQ * distributedIQList[i] / totalDistributedUnit;
      var gainedIQ      = knowledge.iq.gained;

      // Prevent to gain too much IQ a year
      gainedIQ += Math.floor(Math.min(
        knowledge.iq.required * maxDistributedValues[knowledge.iq.priority],
        distributedIQ
      ));
      if (isNaN(gainedIQ)) {
        gainedIQ = knowledge.iq.gained;
      }

      if (gainedIQ >= knowledge.iq.required) {
        // Completed knowledge
        knowledge.iq.gained = knowledge.iq.required;

        // Merge 2 arrays
        tmpFollowing.push.apply(tmpFollowing, knowledge.following);

        // Start to affect the world
        knowledge.affectedYear = year;
        if (typeof knowledge.onAffected === 'function') {
          knowledge.onAffected(world);
        }

        tmpCompleted.push(knowledge);
      } else {
        knowledge.iq.gained = gainedIQ;
        tmpTrending.push(knowledge.id);
      }
    }

    if (tmpCompleted.length > 0) {
      // Move completed trending knowledge to completed knowledge list
      for (i = 0; i < tmpCompleted.length; i++) {
        worldKnowledge.trendingRemoved(tmpCompleted[i]);
        worldKnowledge.completed.push(tmpCompleted[i]);
      }

      // Add new knowledge to trending
      for (i = 0; i < tmpFollowing.length; i++) {
        worldKnowledge.trendingAdded(worldKnowledge.list[tmpFollowing[i]]);
        tmpTrending.push(tmpFollowing[i]);
      }
      worldKnowledge.trending = tmpTrending;
    }
  };


  return Knowledge;

});


/*!
 * world.knowledge.data.js
 * Define all knowledge data of a world
 *
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013-2014 An Vo - anvo4888@gmail.com
 * Licensed under Creative Commons (http://creativecommons.org/licenses/by-nc/4.0/deed.en_US)
 */

define(function(require) {

  'use strict';

  var Language = require('./language/en');


  var KnowledgeData = {

    huga: {
      id:           'huga',
      name:         Language.knowledgeHUGAName,
      message:      Language.knowledgeHUGAMessage,
      description:  [
        {
          text:     Language.knowledgeHUGADescription01,
          code:     ['Adult +1 food / year', 'Food resource +10k']
        }
      ],
      iq:           { priority: 1, gained: 0, required: 500 },
      following:    ['fire', 'hula'],
      affectedYear: 0,
      onAffected: function(world) {
        var worldStatistic = world.statistic;

        world.rules.food.adult      += 1;
        worldStatistic.foodResource += 10000;
        if (worldStatistic.food < 0) {
          worldStatistic.foodResource += worldStatistic.food;
          worldStatistic.food         = 0;
        }

        world.items.meat.enabled  = true;
        world.items.fruit.enabled = true;
      }
    },


    fire: {
      id:           'fire',
      name:         Language.knowledgeFIREName,
      message:      Language.knowledgeFIREMessage,
      description:  [
        {
          text:     Language.knowledgeFIREDescription01,
          code:     ['Death rate -10%']
        },
        {
          text:     Language.knowledgeFIREDescription02,
          code:     ['Base IQ +1']
        },
        {
          text:     Language.knowledgeFIREDescription03,
          code:     ['Food resource recovery -5% / century']
        }
      ],
      iq:           { priority: 0.1, gained: 0, required: 3000 },
      following:    ['cook', 'noma'],
      affectedYear: 0,
      onAffected: function(world) {
        var worldRules = world.rules;

        worldRules.chanceIncr.death -= 0.1;
        worldRules.baseIQ           += 1;

        world.event.add('yearPassed', 'burningForests', function() {
          var world         = this;
          var year          = world.statistic.year;
          var affectedYear  = world.knowledge.list.fire.affectedYear;
          if (year % 100 == affectedYear % 100 && year > affectedYear) {
            world.rules.food.resourceIncr -= 0.1;
          }
        });

        world.items.fire.enabled = true;
      }
    },


    hula: {
      id:           'hula',
      name:         Language.knowledgeHULAName,
      message:      Language.knowledgeHULAMessage,
      description:  [
        {
          text:     Language.knowledgeHULADescription01,
          code:     ['Death rate +10%', 'Adult +2 food / year', 'Food resource +5k']
        },
        {
          text:     Language.knowledgeHULADescription02,
          code:     ['Food resource recovery -5% / century']
        }
      ],
      iq:           { priority: 0.1, gained: 0, required: 20000 },
      following:    [],
      affectedYear: 0,
      onAffected: function(world) {
        var worldRules      = world.rules;
        var worldStatistic  = world.statistic;

        worldRules.chanceIncr.death += 0.1;
        worldRules.food.adult       += 2;
        worldStatistic.foodResource += 5000;
        if (worldStatistic.food < 0) {
          worldStatistic.foodResource += worldStatistic.food;
          worldStatistic.food         = 0;
        }

        world.event.add('yearPassed', 'largeAnimalsDisappearing', function() {
          var world         = this;
          var year          = world.statistic.year;
          var affectedYear  = world.knowledge.list.hula.affectedYear;
          if (year % 100 == affectedYear % 100 && year > affectedYear) {
            world.rules.food.resourceIncr -= 0.1;
          }
        });
      }
    },


    noma: {
      id:           'noma',
      name:         Language.knowledgeNOMAName,
      message:      Language.knowledgeNOMAMessage,
      description:  [
        {
          text:     Language.knowledgeNOMADescription01,
          code:     ['Enable food resource recovery']
        },
        {
          text:     Language.knowledgeNOMADescription02,
          code:     ['Death rate -10%']
        }
      ],
      iq:           { priority: 0.1, gained: 0, required: 50000 },
      following:    ['osea'],
      affectedYear: 0,
      onAffected: function(world) {
        world.event.add('yearPassed', 'foodResourceRecovering', function() {
          var world         = this;
          var year          = world.statistic.year;
          var affectedYear  = world.knowledge.list.noma.affectedYear;
          if (year % 10 == affectedYear % 10 && year > affectedYear) {
            var worldRules    = world.rules;
            var foodResource  = 10 * worldRules.population.limit * worldRules.food.adult;
            foodResource = Math.max(0, foodResource + Math.ceil(foodResource * worldRules.food.resourceIncr));
            world.statistic.foodResource = foodResource;
          }
        });

        world.rules.chanceIncr.death -= 0.1;
      }
    },


    cook: {
      id:           'cook',
      name:         Language.knowledgeCOOKName,
      message:      Language.knowledgeCOOKMessage,
      description:  [
        {
          text:     Language.knowledgeCOOKDescription01,
          code:     ['Adult +1 food / year', 'Food resource +20k']
        },
        {
          text:     Language.knowledgeCOOKDescription02,
          code:     ['Base IQ +1']
        },
        {
          text:     Language.knowledgeCOOKDescription03,
          code:     ['Death rate -10%', 'Food spoilage -10%']
        }
      ],
      iq:           { priority: 0.1, gained: 0, required: 5000 },
      following:    [],
      affectedYear: 0,
      onAffected: function(world) {
        var worldRules      = world.rules;
        var worldStatistic  = world.statistic;

        worldRules.food.adult       += 1;
        worldStatistic.foodResource += 20000;
        if (worldStatistic.food < 0) {
          worldStatistic.foodResource += worldStatistic.food;
          worldStatistic.food         = 0;
        }
        worldRules.baseIQ                 += 1;
        worldRules.chanceIncr.death       -= 0.1;
        worldRules.foodSpoilage.foodDecr  -= 0.1;

        world.items.pot.enabled = true;
      }
    },


    goss: {
      id:           'goss',
      name:         Language.knowledgeGOSSName,
      message:      Language.knowledgeGOSSMessage,
      description:  [
        {
          text:     Language.knowledgeGOSSDescription01,
          code:     ['Population limit 150', 'Base IQ +1', 'Child -1 food / year']
        }
      ],
      iq:           { priority: 0.1, gained: 0, required: 10000 },
      following:    [],
      affectedYear: 0,
      onAffected: function(world) {
        var worldRules = world.rules;

        worldRules.population.limit = 150;
        worldRules.baseIQ           += 1;
        worldRules.food.child       -= 1;

        // Bigger world
        world.padding = 10;
      }
    },


    spir: {
      id:           'spir',
      name:         Language.knowledgeSPIRName,
      message:      Language.knowledgeSPIRMessage,
      description:  [
        {
          text:     Language.knowledgeSPIRDescription01,
          code:     ['Population limit 500', 'Base IQ +1', 'Child -1 food / year']
        },
        {
          text:     Language.knowledgeSPIRDescription02,
          code:     ['Death rate +10%']
        }
      ],
      iq:           { priority: 0.1, gained: 0, required: 50000 },
      following:    [],
      affectedYear: 0,
      onAffected: function(world) {
        var worldRules = world.rules;

        worldRules.population.limit = 500;
        worldRules.baseIQ           += 1;
        worldRules.food.child       -= 1;
        worldRules.chanceIncr.death += 0.1;
      }
    },


    osea: {
      id:           'osea',
      name:         Language.knowledgeOSEAName,
      message:      Language.knowledgeOSEAMessage,
      description:  [
        {
          text:     Language.knowledgeOSEADescription01,
          code:     ['Food resource +10k', 'Food resource recovery +20%']
        },
        {
          text:     Language.knowledgeOSEADescription02,
          code:     ['Death rate +0%']
        }
      ],
      iq:           { priority: 0.1, gained: 0, required: 200000 },
      following:    [],
      affectedYear: 0,
      onAffected: function(world) {
        var worldStatistic = world.statistic;

        worldStatistic.foodResource += 10000;
        if (worldStatistic.food < 0) {
          worldStatistic.foodResource += worldStatistic.food;
          worldStatistic.food         = 0;
        }
        world.rules.food.resourceIncr += 0.2;
      }
    },


    coso: {
      id:           'coso',
      name:         Language.knowledgeCOSOName,
      description:  [
        {
          text:     Language.knowledgeCOSODescription01,
          code:     []
        },
        {
          text:     Language.knowledgeCOSODescription02,
          code:     []
        },
        {
          text:     Language.knowledgeCOSODescription03,
          code:     []
        }
      ],
      iq:           { priority: 0.1, gained: 0, required: 1000000000 },
      following:    [],
      affectedYear: 0,
      onAffected: function() { }
    }
  };


  return KnowledgeData;

});


/*!
 * world.guide.js
 * Queue up messages that will be displayed on the main screen.
 *
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013-2014 An Vo - anvo4888@gmail.com
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 */

define(function() {

  'use strict';


  // Guide constructor
  var Guide = function(world) {
    var worldGuide = this;

    // Store reference of a world
    worldGuide.world = world;

    worldGuide.$container = undefined;
    worldGuide.queue      = [];
  };


  // Set guide container
  // $container: jQuery element
  Guide.prototype.setContainer = function($container) {
    this.$container = $container;
  };


  // Show guide message
  // message: message content
  // ytl:     message's year to live
  Guide.prototype.show = function(message, ytl) {
    var worldGuide  = this;
    var world       = worldGuide.world;

    if (typeof message !== 'undefined') {
      // Add message to queue
      worldGuide.queue.push({ message: message, ytl: ytl });
      if (worldGuide.queue.length == 1) {
        worldGuide.show();
      }
    } else {
      // Show first message in queue
      if (worldGuide.queue.length > 0) {
        var item        = worldGuide.queue[0];
        var hiddenYear  = world.statistic.year + item.ytl;

        worldGuide.$container.html(item.message).animate({ bottom: 0 }, 400);

        world.event.add('yearPassed', 'guide', function() {
          var world = this;
          if (world.statistic.year >= hiddenYear) {
            world.guide.hide();
            world.event.remove('yearPassed', 'guide');
          }
        });
      }
    }
  };


  // Hide guide message
  Guide.prototype.hide = function() {
    var worldGuide  = this;
    var world       = worldGuide.world;
    var $container  = worldGuide.$container;

    $container.animate({ bottom: -$container.outerHeight() }, 400, 'swing', function() {
      // Remove from queue
      worldGuide.queue.shift();
      // Show next item in queue
      worldGuide.show();
    });
  };


  return Guide;

});


/*!
 * world.interface.js (require jQuery & TW Bootstrap UI)
 * Bind a world and its properties to UI.
 * Define some basic UI interactions.
 *
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013-2014 An Vo - anvo4888@gmail.com
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 */

define(function(require) {

  'use strict';

  var Language = require('./language/en');


  var Interface = {};
  var cache     = {
    statistic: {
      year: 0,
      population: 0,
      men: 0, women: 0, boys: 0, girls: 0,
      families: 0,
      food: 0, foodResource: 0,
      iq: 0, maxIQ: 0, yearMaxIQ: 0,
      maxAge: 0, yearMaxAge: 0,
      avgIQ: 0, avgAge: 0, avgChildren: 0
    },
    rules: {
      adultFoodChange: 0, childFoodChange: 0,
      foodResourceRecovery: 100,
      foodSpoilage: 0,
      deathChance: 0
    },
    knowledge: {
      knowledgeTrending: 0, knowledgeHistory: 0
    },
    misc: {
      labelPopulationLimit: false,
      labelNotEnoughResource: false,
      labelFamine: false
    }
  };


  // Init: Store container of all properties of a world
  // Extra methods must be added to Cache object after this init
  for (var key in cache) {
    if (cache.hasOwnProperty(key)) {
      var cacheData = cache[key];
      for (var propName in cacheData) {
        if (cacheData.hasOwnProperty(propName)) {
          var defaultValue    = cacheData[propName];
          cacheData[propName] = {
            container:  $('#world-' + propName),
            value:      defaultValue
          };

          // Some properties are displayed in 2 different places of the UI
          if ($.inArray(propName, ['men', 'women', 'families', 'boys', 'girls']) != -1) {
            cacheData[propName + '-ex'] = {
              container:  $('#world-' + propName + '-ex'),
              value:      defaultValue
            };
          }
        }
      }
    }
  }


  // Set new value to a cached container element
  // Only set if the value changes
  cache.set = function(element, value) {
    if (value != element.value) {
      element.value = value;
      element.container.html(value);
    }
  };


  // Show or hide an element
  cache.toggleLabel = function(element, state) {
    if (state != element.value) {
      element.value = state;
      if (state) {
        element.container.removeClass('hide');
      } else {
        element.container.addClass('hide');
      }
    }
  };


  // HTML for knowledge priority buttons group
  Interface.knowledgePriorityHTML = function(knowledge, isClone) {
    isClone = isClone || false;
    var priorityList = [
      { name: 'low',    value: 0.1 },
      { name: 'normal', value: 1 },
      { name: 'high',   value: 2 }
    ];
    var htmlArray = ['<span class="no-wrap">'];
    for (var i = 0; i < priorityList.length; i++) {
      var priority    = priorityList[i];
      var checked     = (knowledge.iq.priority === priority.value) ? 'checked ' : '';
      var radioClass  = (!isClone) ? 'priority-radio' : 'priority-radio-clone';
      var valueClass  = knowledge.id + '-' + priority.name;
      var name        = (!isClone) ? knowledge.id : knowledge.id + '-clone';

      htmlArray.push([
        '<label class="radio-inline">',
          '<input type="radio" ' + checked,
            'class="' + radioClass + ' ' + valueClass + '" ',
            'value="' + priority.name + '" ',
            'name="' + name + '">',
          priority.name,
        '</label>'
      ].join(''));
    }
    htmlArray.push('</span>');
    return htmlArray.join('');
  };


  // HTML for knowledge description
  Interface.knowledgeDescriptionHTML = function(knowledge) {
    var description = knowledge.description;
    var htmlArray   = [];
    for (var i = 0; i < description.length; i++) {
      var line = description[i];
      htmlArray.push('<p>&bull; ' + line.text);
      if (line.code.length > 0) {
        htmlArray.push(' <code>' + line.code.join('</code> <code>') + '</code>');
      }
      htmlArray.push('</p>');
    }
    return htmlArray.join('');
  };


  // Callback when a knowledge added to trending
  Interface.trendingAdded = function(knowledge) {
    // Get css class for display based on default priority of a knowledge
    var progressBarClass;
    switch (knowledge.iq.priority) {
      case 0.1:
        progressBarClass = 'progress-bar progress-bar-danger';
        break;
      case 2:
        progressBarClass = 'progress-bar';
        break;
      default:
        progressBarClass = 'progress-bar progress-bar-info';
        break;
    }

    // Add new knowledge to knowledge trending (learning) container
    var cacheKnowledge      = cache.knowledge;
    var $trendingContainer  = cacheKnowledge.knowledgeTrending.container;
    var collapsedToggle     = ' collapsed';
    var collapsedPanel      = ' collapse';
    if ($trendingContainer.find('.knowledge-detail').filter('.in,.collapsing').length === 0) {
      collapsedToggle = '';
      collapsedPanel  = ' in';
    }
    var id    = 'world-knowledge-' + knowledge.id;
    var html  = [
      '<div class="knowledge panel">',
        '<a class="knowledge-name' + collapsedToggle + '" href="#' + id + '" ',
            'data-parent="#world-knowledgeTrending" data-toggle="collapse">',
          knowledge.name,
          '<span class="caret"></span>',
        '</a>',
        '<div class="knowledge-progress progress">',
          '<div class="' + progressBarClass + '"></div>',
        '</div>',
        '<div class="knowledge-detail panel-collapse' + collapsedPanel + '" id="' + id + '">',
          '<div class="knowledge-iq">',
            '&bull; Require: ',
            '<span class="no-wrap">',
              '<span class="knowledge-progress-iq">0</span> / ',
              knowledge.iq.required + ' IQ',
            '</span>',
          '</div>',
          '<div class="knowledge-priority">',
            '&bull; Priority: ',
            Interface.knowledgePriorityHTML(knowledge),
          '</div>',
          '<div class="knowledge-description">',
            Interface.knowledgeDescriptionHTML(knowledge),
          '</div>',
        '</div>',
      '</div>',
    ].join('');
    $trendingContainer.append(html);

    // Cache knowledge container
    var $container = $('#' + id);
    cacheKnowledge[knowledge.id] = {
      // Main container
      container:    $container,
      // Required IQ container
      IQContainer:  $container.find('.knowledge-progress-iq'),
      // Progress bar container
      barContainer: $container.siblings('.knowledge-progress').find('.progress-bar')
    };
  };


  // Callback when a knowledge removed from trending
  Interface.trendingRemoved = function(knowledge) {
    // Remove completed knowledge from knowledge trending container
    var cached          = cache;
    var cacheKnowledge  = cached.knowledge[knowledge.id];
    cacheKnowledge.IQContainer.html(knowledge.iq.required);
    cacheKnowledge.barContainer.width('100%');
    cacheKnowledge.container.closest('.knowledge').remove();

    // Remove knowledge container cache
    delete cached.knowledge[knowledge.id];

    // Add completed knowledge to knowledge history container
    var html = [
      '<div class="knowledge">',
        '<div class="knowledge-name">',
          (cached.statistic.year.value + 1) + ': ' + knowledge.name,
        '</div>',
        '<div class="knowledge-detail">',
          '<div class="knowledge-description">',
            Interface.knowledgeDescriptionHTML(knowledge),
          '</div>',
        '</div>',
      '</div>'
    ].join('');
    cached.knowledge.knowledgeHistory.container.prepend(html);
  };


  // Update information (statistic, rules, knowledge) every year
  Interface.yearPassed = function() {
    var world   = this;
    var cached  = cache;

    var worldStatistic = world.statistic;
    var cacheStatistic = cached.statistic;
    for (var propName in cacheStatistic) {
      if (cacheStatistic.hasOwnProperty(propName)) {
        switch (propName) {
          case 'avgIQ':
            var avgIQ = (worldStatistic.population === 0) ?
              0 : Math.round(worldStatistic.iq / worldStatistic.population);
            cached.set(cacheStatistic.avgIQ, avgIQ);
            break;
          case 'avgAge':
            var avgAge = (worldStatistic.die === 0) ?
              0 : Math.round(worldStatistic.sumAge / worldStatistic.die);
            cached.set(cacheStatistic.avgAge, avgAge);
            break;
          default:
            cached.set(cacheStatistic[propName], worldStatistic[propName]);
            if ($.inArray(propName, ['men', 'women', 'families', 'boys', 'girls']) != -1) {
              cached.set(cacheStatistic[propName + '-ex'], worldStatistic[propName]);
            }
            break;
        }
      }
    }

    var worldRules = world.rules;
    var cacheRules = cached.rules;
    cached.set(cacheRules.deathChance, (worldRules.chance.death * 100).toFixed());
    cached.set(cacheRules.adultFoodChange, worldRules.food.adult);
    cached.set(cacheRules.childFoodChange, worldRules.food.child);
    cached.set(cacheRules.foodSpoilage, (worldRules.foodSpoilage.foodDecr * 100).toFixed());
    cached.set(cacheRules.foodResourceRecovery, (100 + worldRules.food.resourceIncr * 100).toFixed());

    var worldKnowledge = world.knowledge;
    for (var i = 0, len = worldKnowledge.trending.length; i < len; i++) {
      var knowledge       = worldKnowledge.list[worldKnowledge.trending[i]];
      var cacheKnowledge  = cached.knowledge[knowledge.id];

      cacheKnowledge.IQContainer.html(knowledge.iq.gained);
      cacheKnowledge.barContainer.width(Math.round(knowledge.iq.gained / knowledge.iq.required * 100) + '%');
    }

    var cacheMisc = cached.misc;
    cached.toggleLabel(cacheMisc.labelPopulationLimit, (worldStatistic.population >= worldRules.population.limit));
    cached.toggleLabel(cacheMisc.labelNotEnoughResource, (worldStatistic.foodResource < 75));
    cached.toggleLabel(cacheMisc.labelFamine, (worldStatistic.food <= worldRules.famine.unit));
  };


  // Statistic container toggle
  $('.js-statistic-toggle').each(function() {
    $(this).click(function() {
      var $target = $('#world-statistic-container');
      if ($target.is(':visible')) {
        $target.addClass('visible-lg');
      } else {
        $target.removeClass('visible-lg');
      }
    });
  });


  // World history introduction carousel
  $('#world-intro .item').each(function(index) {
    var $this = $(this);
    switch (index) {
      case 0:
        $this.find('blockquote').html(
          Language.introPhysicsQuote +
          '<footer>' + Language.introPhysicsAuthor + '</footer>'
        );
        $this.find('p:first').html(Language.introPhysics01.replace(
          'Big Bang',
          '<span class="label label-danger">Big Bang</span>'
        ));
        $this.find('p:last').html(Language.introPhysics02.replace(
          'Physics',
          '<span class="label label-info">Physics</span>'
        ));
        break;
      case 1:
        $this.find('blockquote').html(
          Language.introChemistryQuote +
          '<footer>' + Language.introChemistryAuthor + '</footer>'
        );
        $this.find('p:first').html(Language.introChemistry01);
        $this.find('p:last').html(Language.introChemistry02.replace(
          'Chemistry',
          '<span class="label label-info">Chemistry</span>'
        ));
        break;
      case 2:
        $this.find('blockquote').html(
          Language.introBiologyQuote +
          '<footer>' + Language.introBiologyAuthor + '</footer>'
        );
        $this.find('p:first').html(Language.introBiology01);
        $this.find('p:last').html(Language.introBiology02.replace(
          'Biology',
          '<span class="label label-info">Biology</span>'
        ));
        break;
      case 3:
        $this.find('blockquote').html(
          Language.introHistoryQuote +
          '<footer>' + Language.introHistoryAuthor + '</footer>'
        );
        $this.find('p:first').html(Language.introHistory01.replace(
          'Homo sapiens',
          '<span class="label label-danger">Homo sapiens</span>'
        ));
        $this.find('p:last').html(Language.introHistory02.replace(
          'History',
          '<span class="label label-info">History</span>'
        ));
        break;
      case 4:
        $this.find('p:first').html(Language.introGame01.replace(
          'World JS',
          '<span class="label label-danger">World JS</span>'
        ));
        $this.find('p:first').next().html(Language.introGame02.replace(
          'the cognitive revolution',
          '<span class="label label-info">the cognitive revolution</span>'
        ));
        $this.find('p:last').html(Language.introGame03.replace(
          'anvo4888@gmail.com',
          '<a href="mailto: anvo4888@gmail.com">anvo4888@gmail.com</a>'
        ));
        break;
    }
  });


  $('#world-intro').removeClass('hide').on('slid.bs.carousel', function () {
    var $carousel = $(this);
    var $content  = $carousel.find('.content');
    var $prev     = $carousel.find('.prev');
    var $next     = $carousel.find('.next');

    if ($content.find('.item:first').hasClass('active')) {
      $prev.addClass('disabled');
    } else {
      $prev.removeClass('disabled');
    }

    if ($content.find('.item:last').hasClass('active')) {
      $next.addClass('disabled');
      $('.opacity').animate({ opacity: 1 }, 'fast');
    } else {
      $next.removeClass('disabled');
    }
  });


  return Interface;

});


/*!
 * world.story.js (require jQuery)
 * Initialize a world and define the `History Simulation` story.
 *
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013-2014 An Vo - anvo4888@gmail.com
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 */

define(function(require) {

  'use strict';

  var Guide         = require('./guide');
  var Interface     = require('./interface');
  var Knowledge     = require('./knowledge');
  var KnowledgeData = require('./knowledge.data');
  var Language      = require('./language/en');
  var Rules         = require('./rules');
  var Statistic     = require('./statistic');
  var WorldJS       = require('./core');


  // Create a new world
  var world           = new WorldJS();

  // World's components
  var worldEvent      = world.event;
  var worldStatistic  = world.statistic = new Statistic(world);
  var worldRules      = world.rules     = new Rules(world);
  var worldKnowledge  = world.knowledge = new Knowledge(world);
  var worldGuide      = world.guide     = new Guide(world);

  // Define all functions that are needed to be used to setup the world
  var worldStory = world.story = {

    knowledge: {

      addList: function(list) {
        worldKnowledge.list = list;
      },

      addTrending: function(knowledge) {
        worldKnowledge.trending = [knowledge.id];
        Interface.trendingAdded(knowledge);
      }

    },


    ui: {

      bindKnowledge: function() {
        worldKnowledge.trendingAdded    = Interface.trendingAdded;
        worldKnowledge.trendingRemoved  = function(knowledge) {
          Interface.trendingRemoved(knowledge);

          // Show message that includes the knowledge's message
          // and list of new appeared knowledge
          var messageArray = [
            '<div><b>✓ ' + knowledge.name + '</b></div>',
            '<div>' + knowledge.message + '</div>',
          ];
          if (knowledge.following.length > 0) {
            messageArray.push('<hr>');
            messageArray.push('<div class="knowledge-trending">');
            for (var i = 0; i < knowledge.following.length; i++) {
              var newKnowledge = worldKnowledge.list[knowledge.following[i]];
              messageArray.push([
                '<div class="knowledge-clone">',
                  '<div><b>' + newKnowledge.name + '</b></div>',
                  '<div class="knowledge-priority">',
                    '&bull; Priority: ',
                    Interface.knowledgePriorityHTML(newKnowledge, true),
                  '</div>',
                '</div>'
              ].join(''));
            }
            messageArray.push('</div>');
          }
          worldGuide.show(messageArray.join(''), 15);

          switch (knowledge.id) {
            case 'noma':
              $('#world-foodResourceRecovery').parent().removeClass('text-muted');
              break;
          }
        };
      },

      bindKnowledgePriorityRadio: function() {
        $(document).on('change', '.priority-radio', function() {
          var $this       = $(this);
          var knowledgeId = $this.attr('name');
          var priority    = $this.val();

          // Default priority:
          // value = normal, rawValue = 1, progressBarClass = info
          var priorityValue     = 1;
          var progressBarClass  = 'progress-bar progress-bar-info';

          switch (priority) {
            case 'high':
              priorityValue     = 2;
              progressBarClass  = 'progress-bar';
              break;
            case 'low':
              priorityValue     = 0.1;
              progressBarClass  = 'progress-bar progress-bar-danger';
              break;
          }

          // Change progress bar class base on knowledge priority
          $this
            .closest('.knowledge')
            .find('.progress-bar')
            .attr('class', progressBarClass);
          // Sync to clone control
          $('.priority-radio-clone.' + knowledgeId + '-' + priority)
            .prop('checked', true);

          // Change knowledge priority
          world.knowledge.list[knowledgeId].iq.priority = priorityValue;
        });
        $(document).on('change', '.priority-radio-clone', function() {
          var $this       = $(this);
          var knowledgeId = $this.attr('name').split('-').shift();
          var priority    = $this.val();

          // Trigger action of the original control
          $('.priority-radio.' + knowledgeId + '-' + priority).click();
        });
      },

      bindStartButton: function() {
        $('#world-start-btn').click(function() {
          $('#world-intro').addClass('hide');
          $('.opacity').animate({ opacity: 1 }, 'fast');
          $('#world-pause-btn').prop('disabled', false).click();
        });
        $('#world-pause-btn').click(function() {
          if (world.running) {
            world.stop();
            $(this).html('Play');
          } else {
            world.start();
            $(this).html('Pause');
          }
        });
      },

      bindDisplayButton: function() {
        $('#world-display-btns button').click(function() {
          var $this       = $(this);
          var displayMode = $this.data('display');

          $this.addClass('active').siblings('.active').removeClass('active');
          world.displayMode = displayMode;
        });
      },

      bindSpeedButton: function() {
        $('#world-speed-btns button').click(function() {
          var $this = $(this);
          var speed = $this.data('speed');

          $this.addClass('active').siblings('.active').removeClass('active');
          switch (speed) {
            case 2:
            case 5:
              world.tickPerYear = 60 / speed;
              world.speed       = speed;
              break;
            default:
              world.tickPerYear = 60;
              world.speed       = 1;
              break;
          }
        });
      }

    },


    event: {

      populationControl: function() {
        worldEvent.add('yearPassed', 'populationControl', function() {
          var world = this;
          var year  = world.statistic.year;

          if (year <= 30) {
            if (year == 20) {
              // Based on the story
              world.addSeeds(30, {
                minAge:     10,
                maxAge:     30,
                fromBorder: 'random',
                types:      [world.Male, world.Female]
              });
            }
          } else {
            var worldStatistic  = world.statistic;
            var worldRules      = world.rules;

            // Keep the population stable if there is enough food
            worldRules.chance.childbirth = 0;
            if (worldStatistic.population < 150 && worldStatistic.food > worldRules.famine.unit) {
              var delta = Math.min(150, worldRules.population.limit) - worldStatistic.population;
              if (delta > 0) {
                worldRules.chance.childbirth = Math.ceil(delta / 10);
              }
            }

            if (year > 1000) {
              world.event.remove('yearPassed', 'populationControl');
            }
          }
        });
      },

      populationLimitUnlock: function() {
        worldEvent.add('yearPassed', 'populationLimitUnlock', function() {
          var world           = this;
          var worldKnowledge  = world.knowledge;

          if (worldKnowledge.completed.length < 1) {
            return;
          }

          var listKnowledge = [
            {
              id:         'goss',
              population: 50,
              message:    Language.knowledgeGOSSUnlock
            },
            {
              id:         'spir',
              population: 150,
              message:    Language.knowledgeSPIRUnlock
            }
          ];
          for (var i = 0; i < listKnowledge.length; i++) {
            var knowledgeId   = listKnowledge[i].id;
            var newKnowledge  = worldKnowledge.list[knowledgeId];

            // Add new knowledge when the population reached its limit
            if (world.statistic.population >= listKnowledge[i].population && !newKnowledge.added) {
              newKnowledge.added = true;
              worldKnowledge.trending.push(knowledgeId);
              Interface.trendingAdded(newKnowledge);

              world.guide.show([
                '<div class="knowledge-trending">',
                  '<div class="knowledge-clone">',
                    '<div><b>' + newKnowledge.name + '</b></div>',
                    '<div class="knowledge-priority">',
                      '&bull; Priority: ',
                      Interface.knowledgePriorityHTML(newKnowledge, true),
                    '</div>',
                  '</div>',
                '</div>',
                '<div>' + listKnowledge[i].message + '</div>'
              ].join(''), 15);

              if (knowledgeId == 'spir') {
                world.event.remove('yearPassed', 'populationLimitUnlock');
              }

              break;
            }
          }
        });
      },

      yearPassed: function() {
        worldEvent.add('yearPassed', 'default', function() {
          var world           = this;
          var worldKnowledge  = world.knowledge;
          var worldStatistic  = world.statistic;

          // Add coming soon message
          if (worldKnowledge.completed.length == 8) {
            if (worldKnowledge.trending.length === 0) {
              var comingSoonId = 'coso';
              worldKnowledge.trending.push(comingSoonId);
              Interface.trendingAdded(worldKnowledge.list[comingSoonId]);
            }
          }

          if (worldStatistic.year == 500) {
            world.guide.show(Language.storyEnd01, 250);
          }

          if (worldStatistic.population === 0) {
            $('#world-pause-btn').prop('disabled', 'disabled');
            world.stop();

            world.guide.show(Language.storyEnd02, 1000);
          }
        });
      }

    },


    guide: {

      setup: function() {
        worldGuide.setContainer($('#world-container .guide'));

        var messages = [
          {year: 5,   ytl: 15, html: Language.storyBegin01},
          {year: 20,  ytl: 15, html: Language.storyBegin02}
        ];
        for (var i = 0; i < messages.length; i++) {
          (function(message) {
            worldEvent.add('yearPassed', 'message-' + message.year, function() {
              var world = this;

              if (world.statistic.year == message.year) {
                world.guide.show(message.html, message.ytl);
                world.event.remove('yearPassed', 'message-' + message.year);
              }
            });
          })(messages[i]);
        }
      }

    },


    world: {

      addFirstMen: function() {
        var firstMenMaxAge = 30;
        world.addSeed(world.Male, {
          x: 10, y: 10,
          moveTo: { x: 320, y: 180 },
          age: 13,
          moveUntilStep: 9999, // Always move
          chances: {
            // Guarantee to live at least <firstMenMaxAge> age
            death: [
              { range: [1, firstMenMaxAge],   from: 0,    to: 0 },
              { range: [firstMenMaxAge, 60],  from: 0.01, to: 0.02 },
              { range: [60, 80],              from: 0.02, to: 0.05 },
              { range: [80, 100],             from: 0.05, to: 0.5 }
            ],
            // 100% marriage success chance
            marriage: [
              { range: [1, firstMenMaxAge],   from: 1,    to: 1 }
            ]
          }
        });
        world.addSeed(world.Female, {
          x:              630,
          y:              350,
          moveTo:         { x: 320, y: 180 },
          age:            13,
          moveUntilStep:  9999, // Always move
          chances: {
            // Guarantee to live at least <firstMenMaxAge> age
            death: [
              { range: [1, firstMenMaxAge],   from: 0,    to: 0 },
              { range: [firstMenMaxAge, 65],  from: 0.01, to: 0.02 },
              { range: [65, 85],              from: 0.02, to: 0.05 },
              { range: [85, 105],             from: 0.05, to: 0.5 }
            ],
            // 100% childbirth success chance
            childbirth: [
              { range: [1, firstMenMaxAge],   from: 1,    to: 1 }
            ]
          }
        });
      },

      addItems: function() {
        world.items = {
          meat: {
            enabled:  false,
            who:      'man',
            when:     'moving',
            icon: {
              x: 37, y: 0,
              dx: 5, dy: 8,
              width: 11, height: 10
            }
          },
          fruit: {
            enabled:  false,
            who:      'woman',
            when:     'moving',
            icon: {
              x: 37, y: 10,
              dx: 5, dy: 8,
              width: 11, height: 10
            }
          },
          fire: {
            enabled:  false,
            who:      'man',
            when:     'standing',
            icon: {
              x: 48, y: 0,
              dx: 12, dy: 12,
              width: 11, height: 10
            }
          },
          pot: {
            enabled:  false,
            who:      'wife',
            when:     'standing',
            icon: {
              x: 48, y: 10,
              dx: -2, dy: 12,
              width: 11, height: 10
            }
          }
        };
      }

    }

  };

  // Event setup
  // ======================
  // Display all properties of the world and its components to the UI,
  // refresh every year
  worldEvent.add('yearPassed', 'updateUI', Interface.yearPassed);
  // Control world population in the early stage of the game,
  // add more people if needed
  worldStory.event.populationControl();
  // Increase the population limit
  // if the condition is met
  worldStory.event.populationLimitUnlock();
  // Other functions that will be executed every year
  worldStory.event.yearPassed();

  // Rules setup
  // ======================
  worldRules.population.limit = 50;

  // Knowledge setup
  // ======================
  // Load all knowledge list
  worldStory.knowledge.addList(KnowledgeData);
  // Start with 1 knowledge (hunting and gathering)
  worldStory.knowledge.addTrending(worldKnowledge.list.huga);
  // UI binding
  worldStory.ui.bindKnowledge();
  worldStory.ui.bindKnowledgePriorityRadio();

  // Guide setup
  // ======================
  worldStory.guide.setup();

  // World setup
  // ======================
  // UI binding
  worldStory.ui.bindStartButton();
  worldStory.ui.bindDisplayButton();
  worldStory.ui.bindSpeedButton();
  // Initialize the world
  world.init('world');
  world.padding = 50;
  // Create the first man and woman of the world.
  // They will move from the corner to the center of the world.
  // They are guaranteed to mate and produce offspring
  // then die at the intended age.
  worldStory.world.addFirstMen();
  worldStory.world.addItems();

});
