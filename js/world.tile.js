/*!
 * world.tile.js
 * Manage position of seeds.
 * Each tile holds references to all seeds that currently stay in it.
 *
 * World JS
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013 An Vo - anvo4888@gmail.com
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

(function(window, undefined) {
    'use strict';

    var WorldJS = window.WorldJS,
        Tile;

    /**
     * Tile constructor
     * world: instance of world
     */
    Tile = WorldJS.Tile = function(world) {
        var worldTile = this;

        // Store reference of a world
        worldTile.world = world;

        /*
         * Old storage structure:
         * An array contains tiles, each tile is a hashmap
         * list = [
         *      { seedId1: seed1, seedId2: seed2, ... },
         *      { ... }, { ... }, ...
         * ]
         * - Pros: Simple add & remove operations
         * - Cons: Iterating large hashmap is much slower than large array
         * http://jsperf.com/fetch-array-vs-object
         *
         * New storage structure:
         * An array contains tiles, each tile is also an array
         * list = [
         *      0: [ 0: seed1, 1: seed2, ... ],
         *      1: [ ... ], 2: [ ... ], ... 
         * ]
         * Require a new property (seed.tileArrayIndex) to store
         * the location (array index) of the seed in a tile array
         *
         * For example, base on the list above:
         * seed1.tileArrayIndex = 0, seed2.tileArrayIndex = 1, ...
         * If a seed is removed from a tile, that array index is available for a new seed
         * Tile.rem(seed1);
         * => list = [ 0: [ 0: false, 1: seed2, ... ], 1: [ ... ], 2: [ ... ], ... ]
         * => availableArrayIndexes = [0: [0], 1: [], ...] // can insert a new seed into index 0
         * Tile.add(seed3);
         * => list = [ 0: [ 0: seed3, 1: seed2, ... ], 1: [ ... ], 2: [ ... ], ... ]
         * => availableArrayIndexes = [ 0: [], 1: [], ...] // all index are used, must push (insert into new index) instead of insert
         */

        // List of tiles
        worldTile.list = [];
        // List of available indexes to insert
        worldTile.availableArrayIndexes = [];

        // 20 x 20 pixels per tile
        worldTile.size = 20;

        // Only draw 7 seeds each tile
        worldTile.maxDisplayedSeeds = 7;

        // Need to calculate base on size of the world
        worldTile.totalTiles = false;
        worldTile.tilesPerRow = false;
        worldTile.tilesPerCol = false;
    };

    /**
     * Divide the world into smaller tiles
     * Each tile contains a list of seeds that are currently inside the tile
     */
    Tile.prototype.init = function(width, height) {
        var worldTile = this,
            tileSize = worldTile.size,
            totalTiles = Math.ceil(width / tileSize) * Math.ceil(height / tileSize);

        worldTile.totalTiles = totalTiles;
        worldTile.tilesPerRow = Math.ceil(width / tileSize);
        worldTile.tilesPerCol = Math.ceil(height / tileSize);

        // Initialize tiles with an array of empty objects
        var listTiles = worldTile.list,
            availableArrayIndexes = worldTile.availableArrayIndexes;
        for (var i = 0; i < totalTiles; i++) {
            listTiles.push([]);
            availableArrayIndexes.push([]);
        }
    };

    /**
     * Get tile index
     * seed: instance of seed
     */
    Tile.prototype.getIndex = function(seed) {
        return Math.floor(seed.x / this.size) + (Math.floor(seed.y / this.size) * this.tilesPerRow);
    };

    /**
     * Add seed to a tile based on seed.tileIndex
     * A new tileIndex value of the seed must be calculated
     * before call this function
     * seed: instance of seed
     */
    Tile.prototype.set = function(seed) {
        var worldTile = this,
            tileIndex = seed.tileIndex,
            tile = worldTile.list[tileIndex],
            availableArrayIndexes = worldTile.availableArrayIndexes[tileIndex];

        if (availableArrayIndexes.length > 0) {
            // Add seed to tile by
            // inserting it into the available array index
            seed.tileArrayIndex = availableArrayIndexes.pop();
            tile[seed.tileArrayIndex] = seed;
        } else {
            // Add seed to tile
            seed.tileArrayIndex = tile.length;
            tile.push(seed);
        }
    };

    /**
     * Remove seed from the tile where it is currently in
     * seed: instance of seed
     */
    Tile.prototype.rem = function(seed) {
        var worldTile = this,
            tileIndex = seed.tileIndex,
            tileArrayIndex = seed.tileArrayIndex;

        /*
         * Set to false instead of delete an array element
         * to avoid holey array which is much slower to access
         * than packed array
         * http://jsperf.com/packed-vs-holey-arrays/10
         */
        worldTile.list[tileIndex][tileArrayIndex] = false;

        /*
         * Store new available array index
         * to indicate that it can be inserted later
         */
        worldTile.availableArrayIndexes[tileIndex].push(tileArrayIndex);
    };
})(window);