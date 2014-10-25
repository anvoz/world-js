/*!
 * world.rules.js (require Statistic module)
 * Define rules that will affect a world and all of its living seeds.
 *
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013-2014 An Vo - anvo4888@gmail.com
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 */

define(function(require) {

  'use strict';

  var Seed = require('./seed');


  // Rules constructor
  // Define default rules of the world
  var Rules = function(world) {
    var worldRules = this;

    // Store reference of a world
    worldRules.world = world;

    worldRules.population = {
      limit: 100
    };

    // Base chances
    worldRules.chance = {
      death:      0,
      marriage:   0,
      childbirth: 0
    };

    // Chances that increase or decrease temporarily
    // based on some specific value
    worldRules.chanceIncr = {
      death:      0,
      marriage:   0,
      childbirth: 0
    };

    worldRules.food = {
      // Produce 1 food per year
      adult: 1,
      // Consume 1 food per year
      child: -1,
      // Percent of food resource increase per 10 years (if enabled)
      // TODO: this should be handled from here instead of in knowledge.data
      resourceIncr: 0,
      // Minimum food value
      min: -10000
    };

    // When famine affected,
    // death chance increase 10% every -100 food
    worldRules.famine = {
      deathChanceIncr: 0.1,
      unit: -100
    };

    // Food decrease 90% every year
    worldRules.foodSpoilage = {
      foodDecr: 0.9,
      interval: 1
    };

    // Death chance increase for each man surpass the population limit
    worldRules.largeCooperation = {
      deathChanceIncr: 0.1,
      unit: 1
    };

    var worldStatistic  = world.statistic;
    worldStatistic.food = 0;
    worldStatistic.foodResource = 500;

    var worldEvent = world.event;
    worldEvent.add('yearPassed', 'rules', function() {
      var world = this;
      world.rules.change();
    });

    var getChance = Seed.prototype.getChance;
    Seed.prototype.getChance = function(type) {
      var seed        = this;
      var world       = seed.world;
      var worldRules  = world.rules;
      var chance      = getChance.call(seed, type);

      if (typeof worldRules.chance[type] !== 'undefined' && worldRules.chance[type] !== 0) {
        // Modify chance based on rule of the world
        chance += chance * worldRules.chance[type];
      }
      return chance;
    };
  };


  // Change rules of the world
  Rules.prototype.change = function() {
      var worldRules      = this;
      var world           = worldRules.world;

      var worldStatistic  = world.statistic;

      var food            = worldStatistic.food;
      var foodResource    = worldStatistic.foodResource;
      var population      = worldStatistic.population;
      var totalAdult      = worldStatistic.men + worldStatistic.women;
      var totalChildren   = worldStatistic.boys + worldStatistic.girls;

      var foodProduce = Math.min(
        foodResource,
        totalAdult * worldRules.food.adult
      );
      var foodConsume = totalChildren * worldRules.food.child;
      var foodDelta   = foodProduce + foodConsume;

      // Obtain food from food resource
      foodResource = Math.max(0, foodResource - foodProduce);
      food += foodDelta;

      if (food < worldRules.food.min) {
        food = worldRules.food.min;
      }

      var deathChance = 0;
      var delta       = 0;

      // Famine: increase death chance
      if (food <= worldRules.famine.unit) {
        delta = Math.floor(food / worldRules.famine.unit);
        deathChance += delta * worldRules.famine.deathChanceIncr;
      }

      // Food spoilage: decrease food
      if (worldStatistic.year % worldRules.foodSpoilage.interval === 0 && food > 0) {
        food -= Math.floor(food * worldRules.foodSpoilage.foodDecr);
      }

      // Population limit: increase death chance
      if (population > worldRules.population.limit) {
        delta = population - worldRules.population.limit;
        delta = Math.floor(delta / worldRules.largeCooperation.unit);
        deathChance += delta * worldRules.largeCooperation.deathChanceIncr;
      }

      // Apply new changes
      worldStatistic.food         = food;
      worldStatistic.foodResource = foodResource;
      worldRules.chance.death     = deathChance + worldRules.chanceIncr.death;
  };


  return Rules;

});
