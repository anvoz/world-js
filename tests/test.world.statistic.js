module('statistic');

test('statistic.seedRemoved', function() {
    var world = new WorldJS();
    world.init('qunit-fixture');

    var worldStatistic = world.statistic = new WorldJS.Statistic(world);

    deepEqual(worldStatistic.die, 0, 'die: 0');
    deepEqual(worldStatistic.maxAge, 0, 'maxAge: 0');
    deepEqual(worldStatistic.yearMaxAge, 0, 'yearMaxAge: 0');
    deepEqual(worldStatistic.sumAge, 0, 'sumAge: 0');

    world.statistic.year = 5;
    world.removeSeed(world.addSeed(world.Seed, {age: 10}));
    deepEqual(worldStatistic.maxAge, 10, 'maxAge: 10');
    deepEqual(worldStatistic.yearMaxAge, 5, 'yearMaxAge: 5');
    deepEqual(worldStatistic.sumAge, 10, 'sumAge: 10');

    world.statistic.year = 10;
    world.removeSeed(world.addSeed(world.Seed, {age: 15}));
    deepEqual(worldStatistic.maxAge, 15, 'maxAge: 15');
    deepEqual(worldStatistic.yearMaxAge, 10, 'yearMaxAge: 10');
    deepEqual(worldStatistic.sumAge, 25, 'sumAge: 25');

    world.statistic.year = 15;
    world.removeSeed(world.addSeed(world.Seed, {age: 5}));
    deepEqual(worldStatistic.maxAge, 15, 'maxAge: 15');
    deepEqual(worldStatistic.yearMaxAge, 10, 'yearMaxAge: 10');
    deepEqual(worldStatistic.sumAge, 30, 'sumAge: 30');
});

test('statistic.yearPassed', function() {
    var world = new WorldJS();
    world.init('qunit-fixture');

    var worldStatistic = world.statistic = new WorldJS.Statistic(world);

    deepEqual(worldStatistic.year, 0, 'year: 0');
    deepEqual(worldStatistic.population, 0, 'population: 0');
    deepEqual(worldStatistic.men, 0, 'men: 0');
    deepEqual(worldStatistic.women, 0, 'women: 0');
    deepEqual(worldStatistic.boys, 0, 'boys: 0');
    deepEqual(worldStatistic.girls, 0, 'girls: 0');
    deepEqual(worldStatistic.families, 0, 'families: 0');

    var male = world.addSeed(world.Male, {age: 20});
    world.statistic.yearPassed();
    deepEqual(worldStatistic.year, 1, 'year: 1');
    deepEqual(worldStatistic.men, 1, 'men: 1');

    var female = world.addSeed(world.Female, {age: 18});
    world.statistic.yearPassed();
    deepEqual(worldStatistic.year, 2, 'year: 2');
    deepEqual(worldStatistic.women, 1, 'women: 1');

    male.relationSeed = female;
    female.relationSeed = male;
    world.addSeed(world.Male);
    world.addSeed(world.Female);
    world.statistic.yearPassed();
    deepEqual(worldStatistic.year, 3, 'year: 3');
    deepEqual(worldStatistic.population, 4, 'population: 4');
    deepEqual(worldStatistic.families, 1, 'families: 1');
    deepEqual(worldStatistic.boys, 1, 'boys: 1');
    deepEqual(worldStatistic.girls, 1, 'girls: 1');
});