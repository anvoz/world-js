define(function(require) {

  module('knowledge.data');

  var Knowledge     = require('./knowledge');
  var KnowledgeData = require('./knowledge.data');
  var Rules         = require('./rules');
  var Statistic     = require('./statistic');
  var WorldJS       = require('./core');


  test('burningForests', function() {
    var world           = new WorldJS();
    var worldEvent      = world.event;
    var worldStatistic  = world.statistic = new Statistic(world);
    var worldRules      = world.rules     = new Rules(world);
    var worldKnowledge  = world.knowledge = new Knowledge(world);

    world.items                   = { fire: { enabled: false } };
    worldStatistic.year           = 10;
    worldRules.food.resourceIncr  = 0;
    worldKnowledge.list           = KnowledgeData;
    worldKnowledge.list.fire.onAffected(world);
    worldKnowledge.list.fire.affectedYear = 10;

    worldStatistic.year = 108;
    worldEvent.trigger('yearPassed');
    deepEqual(worldRules.food.resourceIncr, 0,    'About to burn');

    worldEvent.trigger('yearPassed');
    deepEqual(worldRules.food.resourceIncr, -0.1, 'Burning');

    worldStatistic.year = 208;
    worldEvent.trigger('yearPassed');
    deepEqual(worldRules.food.resourceIncr, -0.1, 'About to burn more');

    worldEvent.trigger('yearPassed');
    deepEqual(worldRules.food.resourceIncr, -0.2, 'Burning more');
  });


  test('largeAnimalsDisappearing', function() {
    var world           = new WorldJS();
    var worldEvent      = world.event;
    var worldStatistic  = world.statistic = new Statistic(world);
    var worldRules      = world.rules     = new Rules(world);
    var worldKnowledge  = world.knowledge = new Knowledge(world);

    worldStatistic.year           = 10;
    worldRules.food.resourceIncr  = 0;
    worldKnowledge.list           = KnowledgeData;
    worldKnowledge.list.hula.onAffected(world);
    worldKnowledge.list.hula.affectedYear = 10;

    worldStatistic.year = 108;
    worldEvent.trigger('yearPassed');
    deepEqual(worldRules.food.resourceIncr, 0,    'About to decrease');

    worldEvent.trigger('yearPassed');
    deepEqual(worldRules.food.resourceIncr, -0.1, 'Decreasing');

    worldStatistic.year = 208;
    worldEvent.trigger('yearPassed');
    deepEqual(worldRules.food.resourceIncr, -0.1, 'About to decrease more');

    worldEvent.trigger('yearPassed');
    deepEqual(worldRules.food.resourceIncr, -0.2, 'Decreasing more');
  });


  test('foodResourceRecovering', function() {
    var world           = new WorldJS();
    var worldEvent      = world.event;
    var worldStatistic  = world.statistic = new Statistic(world);
    var worldRules      = world.rules     = new Rules(world);
    var worldKnowledge  = world.knowledge = new Knowledge(world);

    worldStatistic.year           = 10;
    worldStatistic.foodResource   = 0;
    worldRules.food.resourceIncr  = 0;
    worldRules.population.limit   = 100;
    worldRules.food.adult         = 2;
    worldKnowledge.list           = KnowledgeData;
    worldKnowledge.list.noma.onAffected(world);
    worldKnowledge.list.noma.affectedYear = 10;

    worldStatistic.year = 18;
    worldEvent.trigger('yearPassed');
    deepEqual(worldStatistic.foodResource, 0,    'Not recover any food resources');

    worldEvent.trigger('yearPassed');
    deepEqual(worldStatistic.foodResource, 2000, 'Recover food resources');

    worldRules.food.resourceIncr = -0.2;

    worldStatistic.year = 28;
    worldEvent.trigger('yearPassed');
    deepEqual(worldStatistic.foodResource, 2000, 'Not in time to recover');

    worldEvent.trigger('yearPassed');
    deepEqual(worldStatistic.foodResource, 1600, 'Recover food resources again');
  });

});
