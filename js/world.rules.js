/*!
 * world.rules.js
 * Rules class
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
     */
    Rules = WorldJS.Rules = function() {
        var rules = this;

        rules.baseIQ = 0;

        // Base chance
        rules.Chance = {
            death: 0,
            marriage: 0,
            childbirth: 0
        };
        // Chance that incr/decr base on some specific value
        // See the Rules.Famine below for example
        rules.ChanceIncr = {
            death: 0,
            marriage: 0,
            childbirth: 0
        };

        rules.Food = {
            adult: -2,      // Consume 2 food per year
            child: -1,
            min: -5000      // Food of the world cannot < this value
        };

        // Death chance increase 50%
        // and childbirth decrease 50%
        // every -1000 food
        rules.Famine = {
            deathChanceIncr: 0.5,
            childbirthChanceIncr: -0.5,
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
            deathChance = 0,
            childbirthChange = 0;

        var totalChildren = Statistic.boy + Statistic.girl,
            totalAdult = Statistic.population - totalChildren;
        food += (
            totalAdult * Rules.Food.adult + 
            totalChildren * Rules.Food.child
        );

        if (food < Rules.Food.min) {
            food = Rules.Food.min;
        }

        // Famine: increase death chance, decrease childbirth chance
        if (food <= Rules.Famine.unit) {
            var delta = Math.floor(food / Rules.Famine.unit);
            deathChance += delta * Rules.Famine.deathChanceIncr;
            childbirthChange += delta * Rules.Famine.childbirthChanceIncr;
        }

        // Food spoilage: decrease food
        if (Statistic.year % Rules.FoodSpoilage.interval === 0 && food > 0) {
            food -= Math.round(food * Rules.FoodSpoilage.foodDecr);
        }

        Statistic.food = food;
        Rules.Chance.death = deathChance + Rules.ChanceIncr.death;
        Rules.Chance.childbirth = childbirthChange + Rules.ChanceIncr.childbirth;
    };
})(window);