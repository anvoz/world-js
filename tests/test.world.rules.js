module('rules');


test('population limit', function() {
  var world = new WorldJS();
  world.init('qunit-fixture');

  var worldStatistic  = world.statistic = new WorldJS.Statistic(world);
  var worldRules      = world.rules     = new WorldJS.Rules(world);

  worldRules.chance.death     = 0;
  worldRules.chanceIncr.death = 0;

  worldRules.population.limit = 10;
  worldRules.largeCooperation = {
    deathChanceIncr: 0.1,
    unit: 1
  };

  world.addSeeds(10);
  worldStatistic.yearPassed();
  worldRules.change();
  deepEqual(worldRules.chance.death, 0, 'Still in the limit');

  world.addSeeds(1);
  worldStatistic.yearPassed();
  worldRules.change();
  deepEqual(worldRules.chance.death.toFixed(1), '0.1', 'Population limit penalty');

  worldRules.largeCooperation.deathChanceIncr = 0.2;
  world.addSeeds(3); // having 4 now
  worldStatistic.yearPassed();
  worldRules.change();
  deepEqual(worldRules.chance.death.toFixed(1), '0.8', 'Double deathChanceIncr value');

  worldRules.largeCooperation.unit = 2;
  worldRules.change();
  deepEqual(worldRules.chance.death.toFixed(1), '0.4', 'Double unit value');

  worldRules.population.limit = 100;
  worldRules.change();
  deepEqual(worldRules.chance.death, 0, 'Back to normal');
});


test('food', function() {
  var world = new WorldJS();
  world.init('qunit-fixture');

  var worldStatistic  = world.statistic = new WorldJS.Statistic(world);
  var worldRules      = world.rules     = new WorldJS.Rules(world);

  // Add people
  var men   = 12;
  var women = 8;
  var boys  = 4;
  var girls = 6;
  world.addSeeds(men,   { minAge: 20, maxAge: 30, types: [world.Male] });
  world.addSeeds(women, { minAge: 20, maxAge: 30, types: [world.Female] });
  world.addSeeds(boys,  { minAge: 5,  maxAge: 10, types: [world.Male] });
  world.addSeeds(girls, { minAge: 5,  maxAge: 10, types: [world.Female] });

  // Check statistic
  worldStatistic.yearPassed();
  deepEqual(worldStatistic.men,   men,    'Total men');
  deepEqual(worldStatistic.women, women,  'Total women');
  deepEqual(worldStatistic.boys,  boys,   'Total boys');
  deepEqual(worldStatistic.girls, girls,  'Total girls');

  // Check food system
  worldStatistic.foodResource       = 60;
  worldRules.foodSpoilage.foodDecr  = 0;
  worldRules.food.adult             = 2;
  worldRules.food.child             = -1;
  worldRules.change();
  deepEqual(worldStatistic.food,          30,   'Food produce (40) - food consume (10)');
  deepEqual(worldStatistic.foodResource,  20,   'Food resource (60) - food produce (40)');

  worldRules.change();
  deepEqual(worldStatistic.food,          40,   'Only get 20 from food resource then -10 from food consume)');
  deepEqual(worldStatistic.foodResource,  0,    'Food resource 0');

  worldRules.change();
  deepEqual(worldStatistic.food,          30,   'Can not produce more food');

  // Children consume more food
  worldRules.food.child = -2;
  worldRules.change();
  deepEqual(worldStatistic.food,          10,   'Consume more food');
  worldRules.change();
  deepEqual(worldStatistic.food,          -10,  'Negative food value');
  worldRules.food.min = -20;
  worldRules.change();
  deepEqual(worldStatistic.food,          -20,  'Min food value');
  worldRules.change();
  deepEqual(worldStatistic.food,          -20,  'Still hold that value');

  // Gain some food resource again
  // and adult can produce more food
  worldStatistic.foodResource = 100;
  worldRules.food.adult       = 3;
  worldRules.change();
  deepEqual(worldStatistic.food,          20,   'Gain food again');
  deepEqual(worldStatistic.foodResource,  40,   'Food resource 40');
});


test('famine', function() {
  var world = new WorldJS();
  world.init('qunit-fixture');

  var worldStatistic  = world.statistic = new WorldJS.Statistic(world);
  var worldRules      = world.rules     = new WorldJS.Rules(world);

  worldRules.chance.death = 0;

  worldStatistic.food = -10;
  worldRules.famine = {
    deathChanceIncr: 0.1,
    unit: -100
  };

  worldRules.change();
  deepEqual(worldRules.chance.death, 0, 'Not be affected by famine yet');

  worldStatistic.food = -100;
  worldRules.change();
  deepEqual(worldRules.chance.death.toFixed(1), '0.1', 'Begin to be affected by famine');

  worldStatistic.food = -150;
  worldRules.change();
  deepEqual(worldRules.chance.death.toFixed(1), '0.1', 'Same death rate');

  worldStatistic.food = -200;
  worldRules.change();
  deepEqual(worldRules.chance.death.toFixed(1), '0.2', 'Increase death rate');

  worldStatistic.food = 1000;
  worldRules.change();
  deepEqual(worldRules.chance.death, 0, 'Back to normal');
});


test('food spoilage', function() {
  var world = new WorldJS();
  world.init('qunit-fixture');

  var worldStatistic  = world.statistic = new WorldJS.Statistic(world);
  var worldRules      = world.rules     = new WorldJS.Rules(world);

  worldRules.chance.death = 0;

  worldStatistic.food = 100;
  worldRules.foodSpoilage = {
    foodDecr: 0.9,
    interval: 10
  };

  worldStatistic.year = 9;
  worldRules.change();
  deepEqual(worldStatistic.food, 100,   'Only be affected in exact interval');

  worldStatistic.year = 10;
  worldRules.change();
  deepEqual(worldStatistic.food, 10,    'Be affected by food spoilage');

  worldRules.foodSpoilage.foodDecr = 0.8;
  worldRules.change();
  deepEqual(worldStatistic.food, 2,     'Be affected by food spoilage again');

  worldStatistic.food = -100;
  worldRules.change();
  deepEqual(worldStatistic.food, -100,  'Not affect negative food');
});


test('population limit & famine', function() {
  var world = new WorldJS();
  world.init('qunit-fixture');

  var worldStatistic  = world.statistic = new WorldJS.Statistic(world);
  var worldRules      = world.rules     = new WorldJS.Rules(world);

  worldRules.chance.death     = 0;
  worldRules.chanceIncr.death = 0;
  worldRules.food.adult       = 0;
  worldRules.food.child       = 0;

  worldRules.population.limit = 10;
  worldRules.largeCooperation = {
    deathChanceIncr: 0.1,
    unit: 1
  };

  worldStatistic.food = -200;
  worldRules.famine = {
    deathChanceIncr: 0.1,
    unit: -100
  };

  world.addSeeds(12);
  worldStatistic.yearPassed();
  worldRules.change();

  deepEqual(worldRules.chance.death.toFixed(1), '0.4', 'Be affected by both population limit and famine');
});


test('rule/seed.getChance', function() {
  var world = new WorldJS();
  world.init('qunit-fixture');

  world.statistic = new WorldJS.Statistic(world);
  var worldRules  = world.rules = new WorldJS.Rules(world);
  var male        = world.addSeed(world.Male, { age: 20 });
  var female      = world.addSeed(world.Female, { age: 20 });

  worldRules.chance = {
    death:      1,    // 100%
    marriage:   0,
    childbirth: -0.5  // -50%
  };
  male.chances = {
    death: [{ range: [1, 100], from: 0.1, to: 0.1 }],
    marriage: [{ range: [1, 100], from: 0.1, to: 0.1 }]
  };
  female.chances = {
    death: [{ range: [1, 100], from: 0.1, to: 0.1 }],
    childbirth: [{ range: [1, 100], from: 0.1, to: 0.1 }]
  };

  deepEqual(male.getChance('death'),        0.2,  'Male death chance');
  deepEqual(male.getChance('marriage'),     0.1,  'Male marriage chance');

  deepEqual(female.getChance('death'),      0.2,  'Female death chance');
  deepEqual(female.getChance('childbirth'), 0.05, 'Female childbirth chance');
});
