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
     */
    Tile = WorldJS.Tile = function(world) {
        var worldTile = this;

        // Store reference of a world
        worldTile.world = world;

        /*
         * Old storage structure:
         * An array contains tiles, each tile is a hashmap
         * list = [ { seedId1: seedData1, seedId2: seedData2, ... }, {}, ... ]
         * - Pros: Simple set / remove operations
         * - Cons: Iterating large hashmap is really slow compared to array
         * http://jsperf.com/fetch-array-vs-object
         *
         * New storage structure:
         * An array contains tiles, each tile is also an array
         * list = [ [ 0: seedData1, 1: seedData2, ... ], [], ... ]
         * Need a new property (seed.tileArrayIndex) to store the array index
         * Ex: seedData1.tileArrayIndex = 0, seedData2.tileArrayIndex = 1...
         * If a seed is removed from a tile, that array index is available for a new seed
         * Ex: 1: remove seedData1
         * list = [ [ undefined, 1: seedData2, ... ], [], ... ]
         * availableArrayIndexes = [[0], [], ...] // can insert a new seed into index 0
         * 2: add seedData3
         * list = [ [ 0: seedData3, 1: seedData2, ... ], [], ... ]
         * availableArrayIndexes = [[], [], ...] // all index are used, must push (insert into new index) instead of insert
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
     */
    Tile.prototype.getIndex = function(seed) {
        return Math.floor(seed.x / this.size) + (Math.floor(seed.y / this.size) * this.tilesPerRow);
    };

    /**
     * Add seed to tile list
     */
    Tile.prototype.set = function(seed) {
        var worldTile = this,
            tile = worldTile.list[seed.tileIndex],
            availableArrayIndexes = worldTile.availableArrayIndexes[seed.tileIndex];

        if (availableArrayIndexes.length > 0) {
            seed.tileArrayIndex = availableArrayIndexes.pop();
            tile[seed.tileArrayIndex] = seed;
        } else {
            seed.tileArrayIndex = tile.length;
            tile.push(seed);
        }
    };

    /**
     * Remove seed from tile list
     */
    Tile.prototype.rem = function(seed) {
        var worldTile = this;

        /*
         * Set false instead of delete the array element
         * to avoid holey array which is much slower to access than packed array
         * http://jsperf.com/packed-vs-holey-arrays/10
         */
        worldTile.list[seed.tileIndex][seed.tileArrayIndex] = false;
        worldTile.availableArrayIndexes[seed.tileIndex].push(seed.tileArrayIndex);
    };
})(window);