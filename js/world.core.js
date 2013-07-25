/*!
 * World JS: Evolution Simulator
 * https://github.com/anvoz/world-js
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

    /**
     * WorldJS constructor
     * Define default properties of a world
     */
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

        world.Tile = new WorldJS.Tile();
        world.Knowledge = new WorldJS.Knowledge();
        world.Statistic = new WorldJS.Statistic();
        world.Rules = new WorldJS.Rules();

        // Call once every <tickPerYear> ticks
        world.eachYearCallback = function() {};
    };

    /**
     * Set callback that trigger once every year
     * callback: function
     */
    WorldJS.prototype.setEachYearCallback = function(callback) {
        var world = this;
        world.eachYearCallback = callback;
        return world;
    };

    /**
     * Insert the world into a HTML wrapper
     * wrapperId: id of an HTML wrapper element
     */
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

        world.Tile.init(world, width, height);

        return world;
    };

    /**
     * Add a seed to the world
     * Seed: seed-based class
     * data: properties of seed
     */
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
            seed.x = WorldJS.Helper.random(0, world.width - 1 - Math.max(seed.appearance.width, world.padding));
        }
        if (seed.y === false) {
            seed.y = WorldJS.Helper.random(0, world.height - 1 - seed.appearance.height - world.padding);
        }

        seed.tileIndex = world.Tile.getIndex(seed); // Calculate tile index
        world.Tile.set(seed);                       // and cache the seed

        world.Statistic.seedAdded(world, seed);

        return world;
    };

    /**
     * Remove a seed from the world
     * seed: seed-based instance
     */
    WorldJS.prototype.remove = function(seed) {
        var world = this;

        world.Statistic.seedRemoved(world, seed);

        if (seed.married) {
            seed.married = false;
            seed.relationSeed.married = false;

            // Remove the references
            seed.relationSeed.relationSeed = false;
            seed.relationSeed = false;
        }

        delete world.seeds[seed.id];
        world.Tile.rem(seed);

        return world;
    }

    /**
     * Add random people to the world
     * count: number of people to add
     * minAge, maxAge (optional)
     */
    WorldJS.prototype.addRandomPeople = function(count, minAge, maxAge) {
        var world = this,
            minAge = WorldJS.Helper.is(minAge, 'undefined') ? 15 : minAge,
            maxAge = WorldJS.Helper.is(maxAge, 'undefined') ? 20 : maxAge,
            tickPerYear = world.tickPerYear;

        // Add people to the world
        for (var i = 0; i < count; i++) {
            // Random age
            var age = WorldJS.Helper.random(minAge, maxAge),
                data = { tickCount: age * tickPerYear };

            if (i < count / 2) {
                world.add(world.Male, data);
            } else {
                world.add(world.Female, data);
            }
        }

        return world;
    };

    /**
     * World process loop
     */
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
            sumBoy = 0, sumGirl = 0,
            has = WorldJS.Helper.has;
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
            Statistic.yearPassed(world, {
                sumBoy: sumBoy,
                sumGirl: sumGirl
            });

            world.Rules.change(world);
            world.Knowledge.gain(world);

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

    /**
     * Start the world
     */
    WorldJS.prototype.start = function() {
        this.running = true;
        this.run();
    }

    /**
     * Stop the world
     * callback (optional): callback trigger after the world stopped
     */
    WorldJS.prototype.stop = function(callback) {
        this.running = false;
        if (!WorldJS.Helper.is(callback, 'undefined')) {
            this.stopCallback = callback;
        }
    }
})(window);