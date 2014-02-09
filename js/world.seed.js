/*!
 * world.seed.js
 * Define an object that will be added to a world to live and interact with other objects.
 *
 * World JS
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
     * data (optional): x, y, icon, relationSeed, tickCount, actionInterval, moveTo
     */
    Seed = WorldJS.prototype.Seed = function(data) {
        // The value of this refers to a newly created seed
        var seed = this;

        // Only be set when the seed was successfully added to a world
        seed.world = false;
        seed.id = false;
        seed.tileIndex = false;
        seed.tickIndex = false;
        seed.tickMod = false;

        seed.age = data.age || 0;

        // Seed coordinate (top, left)
        seed.x = (typeof data.x === 'undefined') ? false : data.x;
        seed.y = (typeof data.y === 'undefined') ? false : data.y;

        // Define how to draw the seed
        seed.icon = data.icon || {
            width: 1, height: 1
        };
        seed.carrying = data.carrying || false;

        // Relationship of the seed
        seed.relationSeed = data.relationSeed || false;

        /*
         * Be default, seed moves around every frame (tickCount++ each frame).
         * Its main actions such as seeking partner or giving birth
         * only trigger every <actionInterval> interval.
         */
        seed.tickCount = data.tickCount || 0;
        seed.actionInterval = data.actionInterval || 30;

        /*
         * stepCount++ only in every tick the seed moves.
         * Seed will move then stop based on the following rule:
         * Keep moving until the <moveUntilStep>th step, then stopped.
         * After stopped, wait until <ageToMoveAgain> age to move around again.
         *
         * jumpInterval: make an animation like jumping when seed moves.
         * A seed only stops after it finished a full jump (landing).
         */
        seed.stepCount = seed.tickCount;
        seed.jumpInterval = 20;
        seed.moveUntilStep = data.moveUntilStep || 0;
        seed.ageToMoveAgain = 0;
        seed.isMoving = false;

        // Destination coordinate for seed to move to
        seed.moveTo = data.moveTo || false;
    };

    /**
     * Display the seed in the world
     */
    Seed.prototype.draw = function(context, spriteImage) {
        var seed = this;

        if (spriteImage === false || seed.icon.width === 1) {
            var width = (spriteImage !== false) ? seed.icon.width : 1,
                height = (spriteImage !== false) ? seed.icon.height : 1;
            context.fillRect(seed.x, seed.y, width, height);
        } else {
            // Handle child-state of the seed
            var icon = (seed.age <= seed.maxChildAge) ?
                seed.icon.child :
                seed.icon;

            /*
             * Jump instead of slide when seed moves
             * Example:   jumpInterval = 10
             * jumpIndex: 0 1 2 3 4 5 6 7 8 9
             * jumpY:     1 2 3 4 5 4 3 2 1 0
             */
            var jumpInterval = seed.jumpInterval,
                halfInterval = 10,
                jumpIndex = seed.stepCount % jumpInterval,
                jumpY = (jumpIndex < halfInterval) ?
                    jumpIndex + 1 :
                    halfInterval - (jumpIndex % halfInterval) - 1;

            context.drawImage(
                spriteImage,
                icon.x, icon.y, icon.width, icon.height,
                seed.x, seed.y - jumpY, icon.width, icon.height
            );
            if (seed.carrying !== false && seed.carrying !== 'none') {
                var carrying = seed.carrying;
                context.drawImage(
                    spriteImage,
                    carrying.x, carrying.y, carrying.width, carrying.height,
                    seed.x + carrying.dx, seed.y - jumpY + carrying.dy, carrying.width, carrying.height
                );
            }
        }
    };

    /**
     * Get carrying item
     */
    Seed.prototype.getCarryingItem = function(who, when) {
        var seed = this,
            world = seed.world;

        if (typeof world.items !== 'undefined') {
            var items = world.items,
                availableItems = [];
            for (var type in items) {
                var item = items[type];
                if (item.enabled === true &&
                    item.who === who &&
                    item.when === when
                ) {
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

    /**
     * Update new coordinate of the seed in the world
     * speed: speed of the world
     * beforeMoveCallback: callback function or false
     */
    Seed.prototype.move = function(speed, beforeMoveCallback) {
        var seed = this,
            world = seed.world,
            random = world.random;

        // By default, seed keeps moving around the world
        seed.isMoving = true;
        if ( ! beforeMoveCallback) {
            // Read the comment on seed's constructor for more info
            if (seed.stepCount >= seed.moveUntilStep) {
                if (seed.ageToMoveAgain == 0 ||
                    seed.ageToMoveAgain > seed.age
                ) {
                    if (seed.ageToMoveAgain == 0) {
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

    /**
     * Seek neighbour tiles and return the first seed that matches the condition
     * condition: function(candidate) { if (...) return true; } or false
     */
    Seed.prototype.seek = function(condition) {
        var seed = this,
            tile = seed.world.tile,
            direction = [
                [0, 0],                                 // current tile
                [-1, 0], [1, 0], [0, -1], [0, 1],       // w, e, n, s tile
                [-1, -1], [-1, 1], [1, -1], [1, 1]      // nw, sw, ne, se tile
            ];

        if ( ! condition) {
            // No filter, return first seed of the current tile
            condition = function(candidate) {
                return (candidate.id != seed.id);
            };
        }

        var tilesPerRow = tile.tilesPerRow,
            tilesPerCol = tile.tilesPerCol;
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

    /**
     * Move around every frame (tick)
     * speed: speed of the world
     */
    Seed.prototype.tick = function(speed) {
        var seed = this;
        seed.tickCount++;
        seed.move(speed);
    };

    /**
     * Get chance base on age of the seed
     * Example: { range: [1, 5], from: 0.01, to: 0.05 }
     * Age:     1   2   3   4   5
     * Chance:  1%  2%  3%  4%  5%
     */
    Seed.prototype.getChance = function(type) {
        var seed = this,
            base = seed.chances[type],
            age = seed.age,

            i = 0,
            fromAge = 0,
            fromChance = 0,
            delta = 0;
        while (base[i] && age >= base[i].range[0]) {
            var thisBase = base[i];
            fromAge = thisBase.range[0];
            fromChance = thisBase.from;
            delta = (thisBase.to - thisBase.from) / (thisBase.range[1] - thisBase.range[0]);
            i++;
        }

        return fromChance + (age - fromAge) * delta;
    };
})(window);