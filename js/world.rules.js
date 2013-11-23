/*!
 * world.rules.js
 * Manage rules of a world.
 * Apply new rules to the world every year.
 *
 * World JS
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013 An Vo - anvo4888@gmail.com
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

(function(window, undefined) {
    'use strict';

    var WorldJS = window.WorldJS,
        Rules;

    /**
     * Rules constructor
     * Define default rules of the world
     */
    Rules = WorldJS.Rules = function(world) {
        var worldRules = this;

        // Store reference of a world
        worldRules.world = world;

        worldRules.Population = {
            limit: 100
        };

        worldRules.baseIQ = 0;

        // Base chances
        worldRules.Chance = {
            death: 0,
            marriage: 0,
            childbirth: 0
        };

        // Chances that increase or decrease temporarily
        // based on some specific value
        worldRules.ChanceIncr = {
            death: 0,
            marriage: 0,
            childbirth: 0
        };

        worldRules.Food = {
            adult: 1,               // Produce 1 food per year
            child: -1,              // Consume 1 food per year
            resourceIncr: 0,        // Percent of food resource increase per 10 years (if enabled)
            min: -10000             // Minimum food value
        };

        // When famine affected,
        // death chance increase 10% every -100 food
        worldRules.Famine = {
            deathChanceIncr: 0.1,
            unit: -100
        };

        // Food decrease 90% every 100 years
        worldRules.FoodSpoilage = {
            foodDecr: 0.9,
            interval: 1
        };

        // Death chance increase for each man surpass the population limit
        worldRules.LargeCooperation = {
            deathChanceIncr: 0.1,
            unit: 1
        };
    };

    /**
     * Change rules of the world
     */
    Rules.prototype.change = function() {
        var worldRules = this,
            world = worldRules.world,

            Statistic = world.Statistic,

            food = Statistic.food,
            foodResource = Statistic.foodResource,
            population = Statistic.population,

            totalAdult = Statistic.men + Statistic.women,
            totalChildren = Statistic.boys + Statistic.girls;

        var foodProduce = Math.min(foodResource, totalAdult * worldRules.Food.adult),
            foodConsume = totalChildren * worldRules.Food.child,
            foodDelta = foodProduce + foodConsume;

        // Obtain food from food resource
        foodResource = Math.max(0, foodResource - foodProduce);
        food += foodDelta;

        if (food < worldRules.Food.min) {
            food = worldRules.Food.min;
        }

        var deathChance = 0,
            delta = 0;

        // Famine: increase death chance
        if (food <= worldRules.Famine.unit) {
            delta = Math.floor(food / worldRules.Famine.unit);
            deathChance += delta * worldRules.Famine.deathChanceIncr;
        }

        // Food spoilage: decrease food
        if (Statistic.year % worldRules.FoodSpoilage.interval === 0 && food > 0) {
            food -= Math.floor(food * worldRules.FoodSpoilage.foodDecr);
        }

        // Population limit: increase death chance
        if (population > worldRules.Population.limit) {
            delta = population - worldRules.Population.limit;
            deathChance += delta * worldRules.LargeCooperation.deathChanceIncr;
        }

        // Apply new changes
        Statistic.food = food;
        Statistic.foodResource = foodResource;
        worldRules.Chance.death = deathChance + worldRules.ChanceIncr.death;
    };
})(window);