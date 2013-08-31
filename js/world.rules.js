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
            adult: -2,      // Consume 2 food per year
            child: -1,      // Consume 1 food per year
            min: -10000     // Minimum food value
        };

        // When famine affected,
        // death chance increase 50% every -1000 food
        rules.Famine = {
            deathChanceIncr: 0.5,
            unit: -1000
        };

        // Food decrease 90% every 100 years
        rules.FoodSpoilage = {
            foodDecr: 0.9,
            interval: 100
        };
    };

    /**
     * Change rules of the world
     */
    Rules.prototype.change = function(world) {
        var Rules = world.Rules,
            Statistic = world.Statistic,
            food = Statistic.food,
            totalAdult = Statistic.men + Statistic.women,
            totalChildren = Statistic.boys + Statistic.girls;

        food += (
            totalAdult * Rules.Food.adult + 
            totalChildren * Rules.Food.child
        );

        if (food < Rules.Food.min) {
            food = Rules.Food.min;
        }

        var deathChance = 0;

        // Famine: increase death chance
        if (food <= Rules.Famine.unit) {
            var delta = Math.floor(food / Rules.Famine.unit);
            deathChance += delta * Rules.Famine.deathChanceIncr;
        }

        // Food spoilage: decrease food
        if (Statistic.year % Rules.FoodSpoilage.interval === 0 && food > 0) {
            food -= Math.round(food * Rules.FoodSpoilage.foodDecr);
        }

        // Apply new changes
        Statistic.food = food;
        Rules.Chance.death = deathChance + Rules.ChanceIncr.death;
    };
})(window);