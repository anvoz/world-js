/*!
 * World JS: Evolution Simulator
 * https://github.com/anvoz/world-js
 *
 * World JS Core Library 1.0
 *
 * Copyright (c) 2013 An Vo - anvo4888@gmail.com
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

(function(window, undefined) {
    'use strict';

    var
        // Localise globals
        document = window.document,
        requestAnimationFrame = (function() {
            // Use requestAnimationFrame for better animation
            return (
                window.requestAnimationFrame       ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame    ||
                window.oRequestAnimationFrame      ||
                window.msRequestAnimationFrame     ||
                function(callback) {
                    window.setTimeout(callback, 1000 / 50);
                }
            );
        })();

    // Helper Functions
    function is(obj, type) {
        return typeof obj === type;
    }

    function has(obj, prop) {
        return obj.hasOwnProperty(prop);
    }

    function random(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    // WorldJS constructor
    // Define default properties of a world
    var WorldJS = window.WorldJS = function() {
        // The value of this refers to a newly created world
        var world = this;

        // The world is currently not running
        world.running = false;
        // Trigger once after the world animation was stopped
        world.stopCallback = function() {};

        // Size of the world in pixels
        world.width = 640;
        world.height = 360;
        // Prevent objects from drawing outside the world
        world.padding = 10; // 10 pixels from border

        // TODO: support WebGL and SVG
        world.canvas = {
            wrapper: false, // DOM element that wraps the canvas
            context: false  // HTML5 drawing context
        };
        // TODO: support multi sprites
        world.sprite = {
            src: 'images/seeds.png',
            image: false    // DOM image object of sprite
        };

        // World contains seeds
        // Each seed has an unique id
        world.nextSeedId = 1;
        // List of seeds, indexed by seedId
        world.seeds = {};
        // Don't draw every frame (tick) if total seeds > this value
        world.maxSafeSeedsForDisplay = 1000;

        // Used for calculating age of a seed
        world.tickPerYear = 50;
        // Used for indicating a year, +1 every frame (tick)
        world.tickMod = -1;
        // Example: tickPerYear = 50
        // tickMod: 0   50  100 150 ...
        // year:    0   1   2   3   ...

        // Divide the world into smaller tiles
        // Each tile contains a list of seeds that are currently inside the tile
        world.Tile = {
            list: [],   // List of tiles
            size: 20,   // 20 x 20 pixels per tile

            // Only draw 10 seeds each tile
            maxDisplayedSeeds: 10,

            // Need to calculate base on size of the world
            totalTiles: false,
            tilesPerRow: false,
            tilesPerCol: false,

            // Tile methods
            getIndex: function(seed) {
                return Math.floor(seed.x / this.size) + (Math.floor(seed.y / this.size) * this.tilesPerRow);
            },
            set: function(seed) {
                this.list[seed.tileIndex][seed.id] = seed;
            },
            rem: function(seed) {
                delete this.list[seed.tileIndex][seed.id];
            }
        };

        // Used for a separate Statistic module
        // Disabled because calling functions thousands time from
        // an external module every frame will slow down the process significantly
        // TODO: revisit this issue
        // world.Callback = {};

        // Using internal statistic record for better performance
        // Replace generic terms with more specific words
        // Example: 'totalSeeds' replace with 'population' so the world contains 'people' instead of 'seeds'
        world.Statistic = {
            year: 0,
            food: 10000,

            // Record when people was born or died
            population: 0,
            male: 0,
            female: 0,
            IQ: 0,

            // ++ when they married
            // -- if husband or wife died
            family: 0,

            // Re-calculate every year
            // Data base on age of people
            men: 0,     // adult male
            women: 0,   // adult female
            boy: 0,     // young male
            girl: 0,    // young female

            // Record when someone was born
            // Max IQ of a person and the year when he/she was born
            maxIQ: 0,
            yearMaxIQ: 0,
            // Max age of a person and the year when he/she died
            maxAge: 0,
            yearMaxAge: 0,

            // Record when someone died
            // Used for calculating average age
            die: 0,     // Number of dead people
            sumAge: 0,  // and total age of them
            // Used for calculating average children of each family
            dieMarriedFemale: 0,    // Number of dead married female
            sumChildren: 0          // and total children of them
        };

        world.Rules = {
            baseIQ: 0,

            Chance: {
                death: 0,
                marriage: 0,
                childbirth: 0
            },
            ChanceIncr: {
                death: 0,
                marriage: 0,
                childbirth: 0
            },

            Food: {
                adult: -2,      // Consume 2 food per year
                child: -1,
                min: -2000      // Food of the world cannot < this value
            },

            // Death chance increase 50%
            // and childbirth decrease 50%
            // every -1000 food
            Famine: {
                deathChanceIncr: 0.5,
                childbirthChanceIncr: -0.5,
                unit: -1000
            },

            // Food decrease 90% every 10 years
            FoodSpoilage: {
                foodDecr: 0.9,
                interval: 10
            }
        };

        world.Knowledge = {
            list: { // List of all knowledge
                /* samp: {                              // Knowledge id
                    name: 'Sample knowledge',           // Display name
                    description: '',
                    IQ: {
                        priority: 1,                    // Priority factor: 0.5 (half), 1 (normal), 2 (double)
                        gained: 0,                      // Gained IQ so far
                        required: 1000                  // Need 1000 IQ to start to affect the world
                    },
                    following: ['samp2', 'samp3'],      // List of following knowledge that will be started after this one completes
                    affectedYear: false,                // The year when this knowledge starts to affect the world
                    onAffected: function(world) { }     // Callback
                } */
            },

            // Trending knowledge id list
            trending: [],
            trendingAdded: function(knowledge) {},
            trendingRemoved: function(knowledge) {},

            // Completed knowledge list
            completed: [],

            gain: function(world) {
                var Knowledge = this,
                    year = world.Statistic.year,
                    totalIQ = world.Statistic.IQ,
                    distributedIQList = [],
                    totalDistributedUnit = 0;

                // Create distributed IQ list
                // All IQ will be randomly distributed to trending knowledge + 1 fake knowledge
                // Distributing to a fake knowledge is represented as wasted IQ every year
                for (var i = 0, len = Knowledge.trending.length; i <= len; i++) {
                    distributedIQList[i] = random(0, 100);
                    if (i < len) {
                        var knowledge = Knowledge.list[Knowledge.trending[i]];
                        if (knowledge.IQ.priority != 1) {
                            distributedIQList[i] *= knowledge.IQ.priority;
                        }
                    }
                    // Store the total to calculate percent later
                    totalDistributedUnit += distributedIQList[i];
                }

                var tmpTrending = [],
                    tmpFollowing = [],
                    tmpCompleted = [];
                for (var i = 0, len = Knowledge.trending.length; i < len; i++) {
                    var knowledge = Knowledge.list[Knowledge.trending[i]],
                        distributedIQ = totalIQ * distributedIQList[i] / totalDistributedUnit,
                        gainedIQ = Math.floor(knowledge.IQ.gained + distributedIQ);

                    if (gainedIQ >= knowledge.IQ.required) { // Completed
                        knowledge.IQ.gained = knowledge.IQ.required;

                        tmpFollowing.push.apply(tmpFollowing, knowledge.following);

                        // Start to affect the world
                        knowledge.affectedYear = year;
                        knowledge.onAffected(world);

                        tmpCompleted.push(knowledge);
                    } else {
                        knowledge.IQ.gained = gainedIQ;
                        tmpTrending.push(knowledge.id);
                    }
                }

                if (tmpCompleted.length > 0) {
                    // Move completed trending knowledge to completed knowledge list
                    for (var i = 0; i < tmpCompleted.length; i++) {
                        Knowledge.trendingRemoved(tmpCompleted[i]);
                        Knowledge.completed.push(tmpCompleted[i]);
                    }

                    for (var i = 0; i < tmpFollowing.length; i++) {
                        Knowledge.trendingAdded(Knowledge.list[tmpFollowing[i]]);
                        tmpTrending.push(tmpFollowing[i]);
                    }
                    Knowledge.trending = tmpTrending;
                }
            }
        };

        // Call once every <tickPerYear> ticks
        world.eachYearCallback = function() {};
    };

    WorldJS.prototype.setEachYearCallback = function(callback) {
        var world = this;
        world.eachYearCallback = callback;
        return world;
    };

    // Insert the world into a HTML wrapper
    // wrapperId: id of an HTML wrapper element
    WorldJS.prototype.init = function(wrapperId) {
        var world = this;

        // Add a canvas that fits size of its wrapper
        var canvas = document.createElement('canvas'),
            wrapper = world.canvas.wrapper = document.getElementById(wrapperId),
            // Size of the wrapper is also size of the world
            width = world.width = canvas.width = wrapper.clientWidth || world.width,
            height = world.height = canvas.height = wrapper.clientHeight || world.height;
        wrapper.appendChild(canvas);

        world.canvas.context = canvas.getContext('2d');

        // Load and cache sprite
        var sprite = new Image();
        sprite.src = world.sprite.src;
        world.sprite.image = sprite;

        // Initialize Tile object base on size of the world
        var Tile = world.Tile,
            tileSize = Tile.size,
            totalTiles = Math.ceil(width / tileSize) * Math.ceil(height / tileSize);
        Tile.totalTiles = totalTiles;
        Tile.tilesPerRow = Math.ceil(width / tileSize);
        Tile.tilesPerCol = Math.ceil(height / tileSize);
        // Initialize tiles with an array of empty objects
        var listTiles = Tile.list;
        for (var i = 0; i < totalTiles; i++) {
            listTiles.push({});
        }

        return world;
    };

    // Seed: seed-based class
    // data: properties of seed
    WorldJS.prototype.add = function(Seed, data) {
        var world = this,
            seed = new Seed(data);

        // Save a reference of the world where the seed belongs
        seed.world = world;

        seed.id = world.nextSeedId++;   // Set an unique id
        world.seeds[seed.id] = seed;    // and cache the seed

        seed.IQ += world.Rules.baseIQ;

        // Randomly set coordinate of the seed
        if (seed.x === false) {
            seed.x = random(0, world.width - 1 - Math.max(seed.appearance.width, world.padding));
        }
        if (seed.y === false) {
            seed.y = random(0, world.height - 1 - seed.appearance.height - world.padding);
        }

        seed.tileIndex = world.Tile.getIndex(seed); // Calculate tile index
        world.Tile.set(seed);                       // and cache the seed

        /* if (is(world.Callback.add, 'function')) {
            world.Callback.add.call(world, seed, data);
        } */

        // Statistic: population+, male/female+, IQ+
        var Statistic = world.Statistic;

        Statistic.population++;
        if (seed instanceof world.Male) {
            Statistic.male++;
        } else {
            Statistic.female++;
        }

        var IQ = seed.IQ;
        Statistic.IQ += IQ;
        // Max IQ of a person and the year when he/she was born
        if (IQ > Statistic.maxIQ) {
            Statistic.maxIQ = IQ;
            Statistic.yearMaxIQ = Statistic.year;
        }

        return world;
    };

    WorldJS.prototype.remove = function(seed) {
        var world = this;

        if (seed.married) {
            seed.married = false;
            seed.relationSeed.married = false;

            // Remove the references
            seed.relationSeed.relationSeed = false;
            seed.relationSeed = false;

            // Statistic: family-
            world.Statistic.family--;
        }

        delete world.seeds[seed.id];
        world.Tile.rem(seed);

        // TODO: 101 ways to leave the world

        /* if (is(world.Callback.remove, 'function')) {
            world.Callback.remove.call(world, seed);
        } */

        // Statistic: population-, male/female-, die+, IQ-
        // if is married female: dieMarriedFemale+, totalChildren+
        var Statistic = world.Statistic;

        Statistic.population--;
        if (seed instanceof world.Male) {
            Statistic.male--;
        } else {
            Statistic.female--;
        }
        Statistic.die++;

        Statistic.IQ -= seed.IQ;

        // Max age of a person and the year when he/she died
        var age = seed.age;
        if (age > Statistic.maxAge) {
            Statistic.maxAge = age;
            Statistic.yearMaxAge = Statistic.year;
        }
        Statistic.sumAge += age;

        // Not check married because married will be set to false if her husband die
        if (!is(seed.totalChildren, 'undefined')) {
            Statistic.dieMarriedFemale++;
            Statistic.sumChildren += seed.totalChildren;
        }

        return world;
    }

    // count: number of people to add
    // minAge, maxAge: optional
    WorldJS.prototype.addRandomPeople = function(count, minAge, maxAge) {
        var world = this,
            minAge = is(minAge, 'undefined') ? 15 : minAge,
            maxAge = is(maxAge, 'undefined') ? 20 : maxAge,
            tickPerYear = world.tickPerYear;

        // Add people to the world
        for (var i = 0; i < count; i++) {
            // Random age
            var age = random(minAge, maxAge),
                data = { tickCount: age * tickPerYear };

            if (i < count / 2) {
                world.add(world.Male, data);
            } else {
                world.add(world.Female, data);
            }
        }

        return world;
    };

    // Start the world
    WorldJS.prototype.run = function() {
        var world = this,
            Statistic = world.Statistic;

        // Used for indicating a year
        // tickMod == 0 -> a year
        world.tickMod = (++world.tickMod) % world.tickPerYear;

        // Draw the world every year instead of every frame if total seeds is too large
        var reDraw = (Statistic.population <= world.maxSafeSeedsForDisplay || world.tickMod === 0);

        // Clear canvas
        if (reDraw) {
            world.canvas.context.clearRect(0, 0, world.width, world.height);
        }

        // Use world.Tile.list instead of world.seeds
        // to reduce the seeds need to be drawn in each tile
        var listTile = world.Tile.list,
            maxDisplayedSeeds = world.Tile.maxDisplayedSeeds,
            sumBoy = 0, sumGirl = 0;
        for (var i = 0, len = listTile.length; i < len; i++) {
            var seeds = listTile[i],
                displayedSeeds = 0;
            for (var seedId in seeds) {
                if (has(seeds, seedId)) {
                    var seed = seeds[seedId],
                        oldTileIndex = seed.tileIndex;

                    // Re-calculate age every frame (tick)
                    seed.age = seed.getAge();

                    if (reDraw) {
                        // Not draw all seeds in a tile
                        if (displayedSeeds < maxDisplayedSeeds) {
                            seed.draw();        // Draw current state of the seed
                            displayedSeeds++;
                        }
                    }
                    seed.tick();                // Seed moves around or triggers some actions

                    // Update tiles if seed moves
                    var newTileIndex = world.Tile.getIndex(seed);
                    if (newTileIndex !== oldTileIndex) {
                        // Remove seed reference from old tile
                        world.Tile.rem(seed);

                        // Add seed reference to new tile
                        seed.tileIndex = newTileIndex;
                        world.Tile.set(seed);
                    }

                    // Once a year
                    if (world.tickMod === 0) {
                        /* if (is(world.Callback.eachSeed, 'function')) {
                            world.Callback.eachSeed.call(world, seed);
                        } */

                        // Statistic: total of young male/female need to be calculated
                        // base on their age every year
                        if (seed.age <= seed.maxChildAge) {
                            if (seed instanceof world.Male) {
                                sumBoy++;
                            } else {
                                sumGirl++;
                            }
                        }
                    }
                }
            }
        }

        // Once a year
        if (world.tickMod === 0) {
            /* if (is(world.Callback.run, 'function')) {
                world.Callback.run.call(world);
            } */

            // Statistic: year+; count men, women, boy, girl
            Statistic.year++;

            Statistic.men = Statistic.male - sumBoy;
            Statistic.women = Statistic.female - sumGirl;
            Statistic.boy = sumBoy;
            Statistic.girl = sumGirl;

            // Change statistic, rules and knowledge every year
            world.change();

            // Execute asynchronous callback
            setTimeout(function() {
                // Do HTML DOM manipulation in the callback
                world.eachYearCallback.call(world);
            }, 1);

            if (Statistic.population === 0) {
                // Stop the world
                world.running = false;
                return;
            }
        }

        // loop animation
        if (world.running) {
            requestAnimationFrame(world.run.bind(world));
        } else {
            // Trigger once
            world.stopCallback.call(world);
            world.stopCallback = function() {};
        }

        return world;
    };

    WorldJS.prototype.start = function() {
        this.running = true;
        this.run();
    }

    WorldJS.prototype.stop = function(callback) {
        this.running = false;
        if (!is(callback, 'undefined')) {
            this.stopCallback = callback;
        }
    }

    WorldJS.prototype.change = function() {
        var world = this,
            Rules = world.Rules,
            Statistic = world.Statistic,
            food = Statistic.food,
            deathChance = 0,
            childbirthChange = 0;

        var totalChildren = Statistic.boy + Statistic.girl,
            totalAdult = Statistic.population - totalChildren;
        food += (
            totalAdult * Rules.Food.adult + 
            totalChildren * Rules.Food.child
        );

        if (food < Rules.minFood) {
            food = Rules.minFood;
        }

        // Famine: increase death chance, decrease childbirth chance
        if (food <= Rules.Famine.unit) {
            var delta = Math.floor(food / Rules.Famine.unit);
            deathChance += delta * Rules.Famine.deathChanceIncr;
            childbirthChange += delta * Rules.Famine.childbirthChanceIncr;
        }

        // Food spoilage: decrease food
        if (Statistic.year % Rules.FoodSpoilage.interval === 0 && food > 0) {
            food -= Math.round(food * Rules.FoodSpoilage.foodDecr);
        }

        Statistic.food = food;
        Rules.Chance.death = deathChance + Rules.ChanceIncr.death;
        Rules.Chance.childbirth = childbirthChange + Rules.ChanceIncr.childbirth;

        world.Knowledge.gain(world);
    };

    // Seed constructor
    // Primary object of the world
    var Seed = WorldJS.prototype.Seed = function(data) {
        var seed = this;

        // Only be set when the seed was successfully added to a world
        seed.world = false;
        seed.id = false;
        seed.tileIndex = false;

        // Seed coordinate (top, left)
        seed.x = is(data.x, 'undefined') ? false : data.x;
        seed.y = is(data.y, 'undefined') ? false : data.y;

        // Define how to draw the seed
        seed.appearance = data.appearance || false;
        // Relationship of the seed
        seed.relationSeed = data.relationSeed || false;

        // Be default, seed moves around every frame
        // tickCount++ each frame
        // Initialize with a random number to make asynchronous action with other seeds
        // Also used for calculating age of seed
        seed.tickCount = (data.tickCount || 0) + random(0, 50);
        // Seed doesn't trigger action every frame
        seed.actionInterval = data.actionInterval || 20; // 20 frames per action

        // Destination coordinate for seed to move to
        seed.moveTo = data.moveTo || false;
    };

    Seed.prototype.getAge = function() {
        var seed = this;
        seed.age = Math.ceil(seed.tickCount / seed.world.tickPerYear);
        return seed.age;
    };

    Seed.prototype.draw = function() {
        var seed = this,
            context = seed.world.canvas.context;

        if (seed.appearance === false) {
            context.fillRect(seed.x, seed.y, 10, 10);
        } else {
            var appearance;
            // Handle child-state of the seed
            if (!is(seed.appearance.child, 'undefined') && seed.age <= seed.maxChildAge) {
                appearance = seed.appearance.child;
            } else {
                appearance = seed.appearance;
            }

            // Jump instead of slide when seed moves
            var jumpInterval = 20,
                jumpIndex = seed.tickCount % jumpInterval,
                halfInterval = Math.ceil(jumpInterval / 2),
                jumpY = (jumpIndex < halfInterval) ?
                    jumpIndex + 1 :
                    halfInterval - (jumpIndex % halfInterval) - 1;
            // Example:   jumpInterval = 10
            // jumpIndex: 0 1 2 3 4 5 6 7 8 9
            // jumpY:     1 2 3 4 5 4 3 2 1 0

            context.drawImage(
                seed.world.sprite.image,
                appearance.x, appearance.y, appearance.width, appearance.height,
                seed.x, seed.y - jumpY, appearance.width, appearance.height
            );
        }
    };

    Seed.prototype.move = function(beforeMoveCallback) {
        var seed = this;

        // By default, seed keeps moving around the world
        if (!is(beforeMoveCallback, 'function')) {
            if (seed.moveTo === false || (seed.moveTo.x === seed.x && seed.moveTo.y === seed.y)) {
                // Make another moveTo coordinate
                var world = seed.world;
                seed.moveTo = {
                    x: random(0, world.width - 1 - Math.max(seed.appearance.width, world.padding)),
                    y: random(world.padding, world.height - 1 - seed.appearance.height - world.padding)
                };
            }
        } else {
            beforeMoveCallback.call(seed);
        }

        // Move in 8-direction to reach moveTo coordinate, one step per frame (tick)
        if (seed.x < seed.moveTo.x) {
            seed.x++;
        } else if (seed.x > seed.moveTo.x) {
            seed.x--;
        }

        if (seed.y < seed.moveTo.y) {
            seed.y++;
        } else if (seed.y > seed.moveTo.y) {
            seed.y--;
        }
    };

    // Seek neighbour tiles and return the first seed that matches the condition
    // condition: function(candidate) { if (...) return true; }
    Seed.prototype.seek = function(condition) {
        var seed = this,
            Tile = seed.world.Tile,
            direction = [
                [0, 0],                                 // current tile
                [-1, 0], [1, 0], [0, -1], [0, 1],       // w, e, n, s tile
                [-1, -1], [-1, 1], [1, -1], [1, 1]      // nw, sw, ne, se tile
            ];

        if (!is(condition, 'function')) {
            // No filter, return first seed of the current tile
            condition = function(candidate) {
                return (candidate.id != seed.id);
            };
        }

        var tilesPerRow = Tile.tilesPerRow,
            tilesPerCol = Tile.tilesPerCol;
        for (var i = 0, len = direction.length; i < len; i++) {
            var thisTileIndex;
            if (i === 0) {
                thisTileIndex = seed.tileIndex;
            } else {
                // Get the neighbour tile
                var row = (seed.tileIndex % tilesPerRow) + direction[i][0],
                    col = Math.floor(seed.tileIndex / tilesPerRow) + direction[i][1];
                if (row >= 0 && row < tilesPerRow && col >= 0 && col < tilesPerCol) {
                    thisTileIndex = row + col * tilesPerRow;
                } else {
                    // Invalid tile
                    continue;
                }
            }

            var seeds = Tile.list[thisTileIndex];
            for (var seedId in seeds) {
                // seed.id is number, seedId is string...
                if (has(seeds, seedId) && seed.id != seedId) {
                    var candidateSeed = seeds[seedId];
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
    Seed.prototype.tick = function() {
        var seed = this;
        seed.tickCount++;
        seed.move();
    };

    Seed.prototype.getChance = function(seed, type) {
        var world = seed.world,
            base = seed.chances[type],
            age = seed.age;

        var i = 0,
            fromAge = 0,
            fromChance = 0,
            delta = 0;
        while (!is(base[i], 'undefined') && age > base[i].range[0]) {
            var thisBase = base[i];
            fromAge = thisBase.range[0];
            fromChance = thisBase.from;
            delta = (thisBase.to - thisBase.from) / (thisBase.range[1] - thisBase.range[0]);
            i++;
        }

        var chance = fromChance + (age - fromAge) * delta;
        if (world.Rules.Chance[type] != 0) {
            chance += chance * world.Rules.Chance[type];
        }
        return chance;
    };

    // Male extends Seed
    var Male = WorldJS.prototype.Male = function(data) {
        var male = this;

        data.appearance = {
            x: 0,
            y: 0,
            width: 13,
            height: 20,
            child: { // must define maxChildAge
                x: 26,
                y: 0,
                width: 11,
                height: 10
            }
        };

        Seed.call(male, data);

        male.IQ = (data.IQ || 0) + random(0, 5);

        male.age = 0;
        male.maxChildAge = 15;
        male.married = false;

        male.chances = {
            death: [
                { range: [1, 5], from: 0.001, to: 0.005 },
                { range: [5, 15], from: 0.005, to: 0.01 },
                { range: [15, 25], from: 0.01, to: 0.05 }
            ],
            marriage: [
                { range: [15, 30], from: 0.1, to: 0.5 },
                { range: [30, 50], from: 0.5, to: 0.1 },
                { range: [50, 80], from: 0.1, to: 0.01 }
            ]
        };
    };
    Male.prototype = Object.create(Seed.prototype);
    Male.prototype.contructor = Male;

    Male.prototype.tick = function() {
        var male = this;

        male.tickCount++;

        var actionInterval = male.actionInterval;
        if (male.tickCount % actionInterval === actionInterval - 1) {
            // Trigger every <actionInterval> ticks
            var world = male.world,
                age = male.age;

            var deathChance = male.getChance(male, 'death');
            if (deathChance > 0 && Math.random() < deathChance) {
                world.remove(male);
            }

            if (!male.married) {
                // Seeking for female
                var marriageChance = male.getChance(male, 'marriage');
                if (marriageChance > 0) {
                    var failureChance = Math.random();
                    if (failureChance < marriageChance) {
                        var female = male.seek(function(candidate) {
                            return (candidate instanceof world.Female &&
                                !candidate.married &&
                                candidate.age >= 15 && // TODO: not use fixed value
                                // failure chance increase (every 10 age difference) if male is younger than female
                                (candidate.age <= male.age || (failureChance * (Math.ceil((candidate.age - male.age) / 10))) < marriageChance)
                            );
                        });
                        if (female !== false) {
                            // Make a family
                            male.married = true;
                            female.married = true;

                            if (is(female.totalChildren, 'undefined')) {
                                // Start record all children of this female
                                female.totalChildren = 0;
                            }

                            // 2-way references
                            male.relationSeed = female;
                            female.relationSeed = male;

                            // Statistic: family+
                            world.Statistic.family++;
                        }
                    }
                }
            }
        } else {
            // Men will follow his wife
            var beforeMoveCallback = (!male.married) ?
                undefined :
                function() {
                    var male = this;
                    var female = male.relationSeed;

                    male.moveTo.x = Math.max(0, female.x - 10);
                    male.moveTo.y = female.y;
                };
            male.move(beforeMoveCallback);
        }
    };

    // Female extends Seed
    var Female = WorldJS.prototype.Female = function(data) {
        var female = this;

        data.appearance = {
            x: 13,
            y: 0,
            width: 13,
            height: 20,
            child: { // must define maxChildAge
                x: 26,
                y: 10,
                width: 11,
                height: 10
            }
        };

        Seed.call(female, data);

        female.IQ = (data.IQ || 0) + random(0, 5);

        female.age = 0;
        female.maxChildAge = 15;
        female.married = false;
        female.totalChildren = undefined; // Need to be set 0 on her first marriage
        // Last age when she bears a child
        female.ageLastBear = 0;

        female.chances = {
            death: [
                { range: [1, 5], from: 0.001, to: 0.005 },
                { range: [5, 20], from: 0.005, to: 0.01 },
                { range: [20, 30], from: 0.01, to: 0.05 }
            ],
            childbirth: [
                { range: [15, 25], from: 0.1, to: 0.25 },
                { range: [25, 50], from: 0.25, to: 0.1 },
                { range: [50, 70], from: 0.1, to: 0.001 }
            ]
        };
    };
    Female.prototype = Object.create(Seed.prototype);
    Female.prototype.contructor = Female;

    Female.prototype.tick = function() {
        var female = this;

        female.tickCount++;

        var actionInterval = female.actionInterval;
        if (female.tickCount % actionInterval === actionInterval - 1) {
            // Trigger every <actionInterval> ticks
            var world = female.world,
                age = female.age;

            var deathChance = female.getChance(female, 'death');
            if (deathChance > 0 && Math.random() < deathChance) {
                world.remove(female);
            }

            // Bear a child (once a year)
            if (female.married && female.ageLastBear < age) {
                var childBirthChance = female.getChance(female, 'childbirth');
                if (childBirthChance > 0 && Math.random() < childBirthChance) {
                    female.ageLastBear = age;
                    female.totalChildren++;

                    var data = {
                            x: female.x,
                            y: Math.min(world.height - 1 - world.padding, female.y + Math.floor(female.appearance.height / 2)),
                            IQ: Math.round((female.relationSeed.IQ + female.IQ) / 2) // inherit IQ from parent
                        };

                    if (Math.random() < 0.5) {
                        world.add(world.Male, data);
                    } else {
                        world.add(world.Female, data);
                    }
                }
            }
        } else {
            female.move();
        }
    };
})(window);