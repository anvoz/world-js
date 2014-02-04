module('tile');

test('tile.init', function() {
    var tile = new WorldJS.Tile(false),
        tileSize = tile.size,
        tilesPerRow = 5,
        tilesPerCol = 10,
        totalTiles = tilesPerRow * tilesPerCol,
        width = tilesPerCol * tileSize,
        height = tilesPerRow * tileSize;

    tile.init(width, height);
    deepEqual(tile.tilesPerRow, tilesPerRow, 'tiles per row');
    deepEqual(tile.tilesPerCol, tilesPerCol, 'tiles per column');
    deepEqual(tile.list.length, totalTiles, 'total tiles');
    deepEqual(
        tile.availableArrayIndexes.length,
        totalTiles,
        'total available array indexes'
    );
});

test('tile.getIndex', function() {
    var tile = new WorldJS.Tile(false),
        tileSize = tile.size,
        width = 200,
        height = 100,
        tilesPerCol = width / tileSize;
    tile.init(width, height);

    deepEqual(tile.getIndex({x: 0, y: 0}), 0, 'index: 0');

    var x2 = tileSize / 2,
        y2 = tileSize / 2;
    deepEqual(tile.getIndex({x: x2, y: y2}), 0, 'index: 0');

    var x3 = tileSize + tileSize / 2,
        y3 = tileSize / 2;
    deepEqual(tile.getIndex({x: x3, y: y3}), 1, 'index: 1');

    var x4 = tileSize / 2,
        y4 = tileSize + tileSize / 2;
    deepEqual(tile.getIndex({x: x4, y: y4}), tilesPerCol, 'index: tilesPerCol');
});

test('tile.set & tile.rem', function() {
    var tile = new WorldJS.Tile(false);
    tile.init(200, 100);

    // Add the first seed
    var seed1 = {x: 40, y: 80};
    seed1.tileIndex = tile.getIndex(seed1);
    tile.set(seed1);
    deepEqual(seed1.tileArrayIndex, 0, 'First tile array index');
    deepEqual(
        tile.list[seed1.tileIndex][seed1.tileArrayIndex],
        seed1,
        'seed1 was added to tile.list'
    );

    // Add the second seed
    var seed2 = {x: 51, y: 21};
    seed2.tileIndex = tile.getIndex(seed2);
    tile.set(seed2);
    deepEqual(seed2.tileArrayIndex, 0, 'First tile array index');
    deepEqual(
        tile.list[seed2.tileIndex][seed2.tileArrayIndex],
        seed2,
        'seed2 was added to tile.list'
    );

    // Add the third seed (same position as the second seed)
    var seed3 = {x: 55, y: 25};
    seed3.tileIndex = tile.getIndex(seed3);
    tile.set(seed3);
    deepEqual(seed3.tileArrayIndex, 1, 'Second tile array index');
    deepEqual(
        tile.list[seed3.tileIndex][seed3.tileArrayIndex],
        seed3,
        'seed3 was added to tile.list'
    );

    // Remove the second seed
    tile.rem(seed2);
    deepEqual(
        tile.list[seed2.tileIndex][seed2.tileArrayIndex],
        false,
        'seed2 was removed from tile.list'
    );
    deepEqual(
        tile.availableArrayIndexes[seed2.tileIndex][0],
        0,
        'availableArrayIndexes[seed2.tileIndex] = [0]'
    );

    // Add the second seed again
    var tileArrayIndex = tile.availableArrayIndexes[seed2.tileIndex][0];
    tile.set(seed2);
    deepEqual(
        tile.list[seed2.tileIndex][tileArrayIndex],
        seed2,
        'seed2 was added to tile.list again'
    );

    // Remove the third seed
    tile.rem(seed3);
    deepEqual(
        tile.list[seed3.tileIndex][seed3.tileArrayIndex],
        false,
        'seed3 was removed from tile.list'
    );
    deepEqual(
        tile.availableArrayIndexes[seed3.tileIndex][0],
        1,
        'availableArrayIndexes[seed3.tileIndex] = [1]'
    );

    // Add the third seed again
    var tileArrayIndex = tile.availableArrayIndexes[seed3.tileIndex][0];
    tile.set(seed3);
    deepEqual(
        tile.list[seed3.tileIndex][tileArrayIndex],
        seed3,
        'seed3 was added to tile.list again'
    );
});

asyncTest('tile.set & tile.rem with world.run', function() {
    var world = new WorldJS();
    world.init('qunit-fixture');
    world.tickPerYear = 12;
    world.speed = 5;

    var x1 = 0, y1 = 0,
        x2 = 60, y2 = 60,
        seed = world.addSeed(world.Seed, {
            x: x1, y: y1,
            moveTo: {x: x2, y: y2}
        });

    world.event.add('yearPassed', 'stopTheWorld', function() {
        // The seed should reach to the moveTo position
        deepEqual(x2, seed.x, 'seed.x after 1 year');
        deepEqual(y2, seed.y, 'seed.y after 1 year');
        deepEqual(
            world.tile.list[seed.tileIndex][seed.tileArrayIndex],
            seed,
            'seed was added to tile.list'
        );

        // Check seed's moving path
        for (var i = 0; i < x2; i += world.speed * 3) {
            var dx = dy = i,
                tileIndex = world.tile.getIndex({x: dx, y: dy});
            deepEqual(
                world.tile.list[tileIndex][0],
                false,
                'tile where the seed was in should be false instead of undefined'
            );
            deepEqual(
                world.tile.availableArrayIndexes[tileIndex][0],
                0,
                'available array index of tile where the seed was in should be 0'
            );
        }

        this.stop();
        start();
    });
    world.start();
});