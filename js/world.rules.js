/*!
 * world.rules.js
 * Manage rules of a world.
 * Apply new rules to the world every year.
 *
 * World JS: Evolution Simulator
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
    Rules = WorldJS.Rules = function() {
        var rules = this;

        rules.Population = {
            limit: 100
        };

        rules.baseIQ = 0;

        // Base chances
        rules.Chance = {
            death: 0,
            marriage: 0,
            childbirth: 0
        };

        // Chances that increase or decrease temporarily
        // based on some specific value
        rules.ChanceIncr = {
            death: 0,
            marriage: 0,
            childbirth: 0
        };

        rules.Food = {
            adult: 1,           // Produce 1 food per year
            child: -1,          // Consume 1 food per year
            resourceIncr: 0,    // Percent of food resource increase per year
            min: -10000         // Minimum food value
        };

        // When famine affected,
        // death chance increase 10% every -100 food
        rules.Famine = {
            deathChanceIncr: 0.1,
            unit: -100
        };

        // Food decrease 90% every 100 years
        rules.FoodSpoilage = {
            foodDecr: 0.9,
            interval: 1
        };

        // Death chance increase for each man surpass the population limit
        rules.LargeCooperation = {
            deathChanceIncr: 0.1,
            unit: 1
        };
    };

    /**
     * Change rules of the world
     */
    Rules.prototype.change = function(world) {
        var Rules = world.Rules,
            Statistic = world.Statistic,

            food = Statistic.food,
            foodResource = Statistic.foodResource,
            population = Statistic.population,

            totalAdult = Statistic.men + Statistic.women,
            totalChildren = Statistic.boys + Statistic.girls;

        // Food resource increase / decrease per year
        if (foodResource > 0) {
            foodResource = Math.max(0, foodResource + Math.ceil(foodResource * Rules.Food.resourceIncr));
        }

        var foodProduce = Math.min(foodResource, totalAdult * Rules.Food.adult),
            foodConsume = totalChildren * Rules.Food.child,
            foodDelta = foodProduce + foodConsume;

        // Obtain food from food resource
        foodResource = Math.max(0, foodResource - foodProduce);
        food += foodDelta;

        if (food < Rules.Food.min) {
            food = Rules.Food.min;
        }

        var deathChance = 0,
            delta = 0;

        // Famine: increase death chance
        if (food <= Rules.Famine.unit) {
            delta = Math.floor(food / Rules.Famine.unit);
            deathChance += delta * Rules.Famine.deathChanceIncr;
        }

        // Food spoilage: decrease food
        if (Statistic.year % Rules.FoodSpoilage.interval === 0 && food > 0) {
            food -= Math.floor(food * Rules.FoodSpoilage.foodDecr);
        }

        // Population limit: increase death chance
        if (population > Rules.Population.limit) {
            delta = population - Rules.Population.limit;
            deathChance += delta * Rules.LargeCooperation.deathChanceIncr;
        }

        // Apply new changes
        Statistic.food = food;
        Statistic.foodResource = foodResource;
        Rules.Chance.death = deathChance + Rules.ChanceIncr.death;
    };
})(window);