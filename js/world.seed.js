/*!
 * world.seed.js
 * Seed class
 *
 * World JS: Evolution Simulator
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013 An Vo - anvo4888@gmail.com
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

(function(window, undefined) {
    'use strict';

    var WorldJS = window.WorldJS,
        Seed;

    /**
     * Seed constructor
     * data (optional): x, y, appearance, relationSeed, tickCount, actionInterval, moveTo
     */
    Seed = WorldJS.prototype.Seed = function(data) {
        // The value of this refers to a newly created seed
        var seed = this;

        // Only be set when the seed was successfully added to a world
        seed.world = false;
        seed.id = false;
        seed.tileIndex = false;

        // Seed coordinate (top, left)
        seed.x = WorldJS.Helper.is(data.x, 'undefined') ? false : data.x;
        seed.y = WorldJS.Helper.is(data.y, 'undefined') ? false : data.y;

        // Define how to draw the seed
        seed.appearance = data.appearance || false;
        // Relationship of the seed
        seed.relationSeed = data.relationSeed || false;

        /*
         * Be default, seed moves around every frame
         * tickCount++ each frame
         * Initialize with a random number to make asynchronous action with other seeds
         * Also used for calculating age of seed
         */
        seed.tickCount = (data.tickCount || 0) + WorldJS.Helper.random(0, 50);

        // Seed doesn't trigger action every frame
        seed.actionInterval = data.actionInterval || 30; // 30 frames per action

        // Destination coordinate for seed to move to
        seed.moveTo = data.moveTo || false;
    };

    /**
     * Calculate age of seed
     */
    Seed.prototype.getAge = function() {
        var seed = this;
        seed.age = Math.ceil(seed.tickCount / seed.world.tickPerYear);
        return seed.age;
    };

    /**
     * Display the seed in the world
     */
    Seed.prototype.draw = function() {
        var seed = this,
            context = seed.world.canvas.context;

        if (seed.appearance === false) {
            context.fillRect(seed.x, seed.y, 10, 10);
        } else {
            var appearance;
            // Handle child-state of the seed
            if (!WorldJS.Helper.is(seed.appearance.child, 'undefined') && seed.age <= seed.maxChildAge) {
                appearance = seed.appearance.child;
            } else {
                appearance = seed.appearance;
            }

            /*
             * Jump instead of slide when seed moves
             * Example:   jumpInterval = 10
             * jumpIndex: 0 1 2 3 4 5 6 7 8 9
             * jumpY:     1 2 3 4 5 4 3 2 1 0
             */
            var jumpInterval = 20,
                jumpIndex = seed.tickCount % jumpInterval,
                halfInterval = Math.ceil(jumpInterval / 2),
                jumpY = (jumpIndex < halfInterval) ?
                    jumpIndex + 1 :
                    halfInterval - (jumpIndex % halfInterval) - 1;

            context.drawImage(
                seed.world.sprite.image,
                appearance.x, appearance.y, appearance.width, appearance.height,
                seed.x, seed.y - jumpY, appearance.width, appearance.height
            );
        }
    };

    /**
     * Update new coordinate of the seed in the world
     * beforeMoveCallback (optional): callback function
     */
    Seed.prototype.move = function(beforeMoveCallback) {
        var seed = this;

        // By default, seed keeps moving around the world
        if (!WorldJS.Helper.is(beforeMoveCallback, 'function')) {
            if (seed.moveTo === false || (seed.moveTo.x === seed.x && seed.moveTo.y === seed.y)) {
                // Make another moveTo coordinate
                var world = seed.world;
                seed.moveTo = {
                    x: WorldJS.Helper.random(0, world.width - 1 - Math.max(seed.appearance.width, world.padding)),
                    y: WorldJS.Helper.random(world.padding, world.height - 1 - seed.appearance.height - world.padding)
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

    /**
     * Seek neighbour tiles and return the first seed that matches the condition
     * condition (optional): function(candidate) { if (...) return true; }
     */
    Seed.prototype.seek = function(condition) {
        var seed = this,
            Tile = seed.world.Tile,
            direction = [
                [0, 0],                                 // current tile
                [-1, 0], [1, 0], [0, -1], [0, 1],       // w, e, n, s tile
                [-1, -1], [-1, 1], [1, -1], [1, 1]      // nw, sw, ne, se tile
            ];

        if (!WorldJS.Helper.is(condition, 'function')) {
            // No filter, return first seed of the current tile
            condition = function(candidate) {
                return (candidate.id != seed.id);
            };
        }

        var tilesPerRow = Tile.tilesPerRow,
            tilesPerCol = Tile.tilesPerCol,
            is = WorldJS.Helper.is;
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
            for (var j = 0, len2 = seeds.length; j < len2; j++) {
                if (!is(seeds[j], 'undefined') && seed.id != seeds[j].id) {
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

    /**
     * Move around every frame (tick)
     */
    Seed.prototype.tick = function() {
        var seed = this;
        seed.tickCount++;
        seed.move();
    };

    /**
     * Get chance base on age of the seed
     */
    Seed.prototype.getChance = function(seed, type) {
        var world = seed.world,
            base = seed.chances[type],
            age = seed.age;

        var i = 0,
            fromAge = 0,
            fromChance = 0,
            delta = 0;
        while (!WorldJS.Helper.is(base[i], 'undefined') && age > base[i].range[0]) {
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
})(window);