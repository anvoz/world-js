/*!
 * world.tile.js
 * Tile class
 *
 * World JS: Evolution Simulator
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
    Tile = WorldJS.Tile = function() {
        var tile = this;

        tile.list = [];   // List of tiles
        tile.size = 20;   // 20 x 20 pixels per tile

        // Only draw 10 seeds each tile
        tile.maxDisplayedSeeds = 10;

        // Need to calculate base on size of the world
        tile.totalTiles = false;
        tile.tilesPerRow = false;
        tile.tilesPerCol = false;
    };

    /**
     * Divide the world into smaller tiles
     * Each tile contains a list of seeds that are currently inside the tile
     */
    Tile.prototype.init = function(world, width, height) {
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
        this.list[seed.tileIndex][seed.id] = seed;
    };

    /**
     * Remove seed from tile list
     */
    Tile.prototype.rem = function(seed) {
        delete this.list[seed.tileIndex][seed.id];
    };
})(window);