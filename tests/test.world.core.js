module('core');

test('new WorldJS()', function() {
    var world = new WorldJS();

    // Check some important properties
    deepEqual(world.running, false, 'The world is currently not running');
    deepEqual(world.totalSeeds, 0, 'Use totalSeeds to track total seeds');
    deepEqual(world.distributedTicks.length, world.tickPerYear - 1, 'Have an array of distributed ticks');
    ok(world.tile instanceof WorldJS.Tile, 'new WorldJS.Tile');
    ok(world.event instanceof WorldJS.Event, 'new WorldJS.Event');
});

test('world.init', function() {
    var world = new WorldJS();
    world.init('qunit-fixture');

    ok(world.width > 0 && world.height > 0, 'Valid world size');
    ok(world.canvas.context, 'Valid canvas context');
    deepEqual(world.sprite.image.nodeName.toLowerCase(), 'img', 'Valid sprite');
});

test('world.addSeed', function() {
    var world = new WorldJS();
    world.init('qunit-fixture');

    // Add first seed
    var seed1 = world.addSeed(world.Seed);
    deepEqual(world.totalSeeds, 1, 'totalSeeds: 1');
    deepEqual(seed1.id, 1, 'seed.id: 1');
    deepEqual(seed1.age, 0, 'seed.age: 0');

    // Add second seed
    var seed2 = world.addSeed(world.Seed, {age: 10});
    deepEqual(world.totalSeeds, 2, 'totalSeeds: 2');
    deepEqual(seed2.id, 2, 'seed.id: 2');
    deepEqual(seed2.age, 10, 'seed.age: 10');
});

test('world.getTickIndex', function() {
    var world = new WorldJS();
    world.init('qunit-fixture');

    var tickIndex = world.getTickIndex();
    deepEqual(tickIndex, 0, 'First tick index');
    world.distributedTicks[tickIndex]++;

    tickIndex = world.getTickIndex();
    deepEqual(tickIndex, 1, 'Second tick index');
    world.distributedTicks[tickIndex]++;

    tickIndex = world.getTickIndex();
    deepEqual(tickIndex, 2, 'Third tick index');
    world.distributedTicks[tickIndex]++;

    world.distributedTicks[1] = 0;
    tickIndex = world.getTickIndex();
    deepEqual(tickIndex, 1, 'Second tick index again');
    world.distributedTicks[tickIndex]++;

    for (var i = 0; i < world.distributedTicks.length; i++) {
        world.distributedTicks[world.getTickIndex()]++;
    }
    ok(world.distributedTicks[0] === 2 &&
        world.distributedTicks[1] === 2 &&
        world.distributedTicks[2] === 2 &&
    world.distributedTicks[3] === 1, 'Check all distributed ticks');
});

test('seed.tickIndex vs seed.tickCount', function() {
    var world = new WorldJS();
    world.init('qunit-fixture');

    world.tickPerYear = 60;
    world.tickMod = 0;

    // Add first seed
    var seed1 = world.addSeed(world.Seed);
    deepEqual(seed1.tickIndex, 0, 'First tick index');

    // Add second seed
    var seed2 = world.addSeed(world.Seed, {age: 10});
    deepEqual(seed2.tickIndex, 1, 'Second tick index');
    deepEqual(seed2.tickCount, 601, 'seed2.tickCount');

    // The world processed 1 tick
    world.tickMod++;
    // Add third seed
    var seed3 = world.addSeed(world.Seed, {age: 20});
    deepEqual(seed3.tickIndex, 2, 'Third tick index');
    deepEqual(seed3.tickCount, 1203, 'seed3.tickCount');
});

test('world.getRandomPosition', function() {
    var world = new WorldJS();
    world.init('qunit-fixture');

    var width = world.width,
        height = world.height,
        padding = world.padding;

    // Make random function always returns min value
    world.random = function(min, max) {
        return min;
    };
    deepEqual(world.getRandomPosition({
        x: false, y: false, appearance: {width: 1, height: 1}
    }), {
        x: padding, y: padding
    }, 'Check min position');

    // Make random function always returns max value
    world.random = function(min, max) {
        return max;
    };
    deepEqual(world.getRandomPosition({
        x: false, y: false, appearance: {width: 1, height: 1}
    }), {
        x: width - 1 - padding,
        y: height - 1 - padding
    }, 'Check max position');

    var seed = {x: 1, y: 2};
    deepEqual(world.getRandomPosition(
        seed
    ), seed, 'Not affect seed that already had position');
});

test('world.removeSeed', function() {
    var world = new WorldJS();
    world.init('qunit-fixture');

    // Add 3 seeds
    var seed1 = world.addSeed(world.Seed),
        seed2 = world.addSeed(world.Seed),
        seed3 = world.addSeed(world.Seed);
    deepEqual(world.totalSeeds, 3, 'totalSeeds: 3');

    // Add relationship for seed1 and seed2
    seed1.relationSeed = seed2;
    seed2.relationSeed = seed1;
    deepEqual(seed1.relationSeed, seed2, 'seed1 is in a relationship with seed2');

    world.removeSeed(seed2);
    deepEqual(world.totalSeeds, 2, 'totalSeeds after removed 1 seed');
    deepEqual(seed1.relationSeed, false, 'seed1 is no longer in a relationship');
});

test('world.addSeeds', function() {
    var world = new WorldJS();
    world.init('qunit-fixture');

    // Add 10 seeds
    world.addSeeds(10);
    deepEqual(world.totalSeeds, 10, 'totalSeeds after added 10 seeds');

    // Add some male and female
    var worldStatistic = world.statistic = new WorldJS.Statistic(world);
    world.addSeeds(5, {minAge: 20, maxAge: 30, types: [world.Male]});
    world.addSeeds(5, {minAge: 20, maxAge: 30, types: [world.Female]});
    world.addSeeds(10, {minAge: 5, maxAge: 10, types: [world.Male, world.Female]});
    deepEqual(world.totalSeeds, 30, 'totalSeeds after added 20 more seeds');
    worldStatistic.yearPassed();
    deepEqual(worldStatistic.men, 5, 'Total men');
    deepEqual(worldStatistic.women, 15, 'Total women (5 + 10 seeds)');
    deepEqual(worldStatistic.boys + worldStatistic.girls, 10, 'Total children');

    // TODO: Add tests to check the fromBorder property
});

asyncTest('world.run', function() {
    var world = new WorldJS();
    world.init('qunit-fixture');

    // Add seed
    var seed = world.addSeed(world.Seed);
    deepEqual(seed.age, 0, '0 year old');

    world.event.add('yearPassed', 'stopTheWorld', function() {
        // Check with different speeds
        switch (seed.age) {
            case 1:
                deepEqual(seed.age, 1, '1 year old');
                deepEqual(seed.tickCount, 60, 'tickCount in 1 year');
                world.tickPerYear = 30;
                world.speed = 2;
                break;
            case 2:
                deepEqual(seed.age, 2, '2 years old');
                deepEqual(seed.tickCount, 90, 'tickCount in 2 years');
                world.tickPerYear = 12;
                world.speed = 5;
                break;
            case 3:
                deepEqual(seed.age, 3, '3 years old');
                deepEqual(seed.tickCount, 102, 'tickCount in 3 years');
                this.stop();
                start();
                break;
        }
    });
    world.start();
});