/*!
 * world.tile.js
 * Divide a world into tiles.
 * Each tile holds references to all seeds (objects) that currently stay in it.
 *
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013-2014 An Vo - anvo4888@gmail.com
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 */

(function(window, undefined) {
  'use strict';


  var WorldJS = window.WorldJS;
  var Tile;


  // Tile constructor
  // world: instance of WorldJS
  Tile = WorldJS.Tile = function(world) {
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

})(window);
