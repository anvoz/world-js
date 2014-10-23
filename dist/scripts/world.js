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
