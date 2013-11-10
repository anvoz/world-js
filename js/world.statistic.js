/*!
 * world.statistic.js
 * Track statistic of a world via function callback.
 *
 * World JS: Evolution Simulator
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013 An Vo - anvo4888@gmail.com
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

(function(window, undefined) {
    'use strict';

    var WorldJS = window.WorldJS,
        Statistic;

    /**
     * Statistic constructor
     */
    Statistic = WorldJS.Statistic = function(world) {
        var worldStatistic = this;

        // Store reference of a world
        worldStatistic.world = world;

        worldStatistic.year = 0;
        worldStatistic.food = 0;
        worldStatistic.foodResource = 500;

        // Re-calculate every year
        worldStatistic.population = 0;
        worldStatistic.IQ = 0;
        worldStatistic.men = 0;          // adult male
        worldStatistic.women = 0;        // adult female
        worldStatistic.boys = 0;         // young male
        worldStatistic.girls = 0;        // young female
        worldStatistic.families = 0;

        // Record when someone was born
        // Max IQ of a person and the year when he/she was born
        worldStatistic.maxIQ = 0;
        worldStatistic.yearMaxIQ = 0;
        // Max age of a person and the year when he/she died
        worldStatistic.maxAge = 0;
        worldStatistic.yearMaxAge = 0;

        // Record when someone died
        // Used for calculating average age
        worldStatistic.die = 0;                  // Number of dead people
        worldStatistic.sumAge = 0;               // and total age of them
        // Used for calculating average children of each family
        worldStatistic.dieMarriedFemale = 0;     // Number of dead married female
        worldStatistic.sumChildren = 0;          // and total children of them
    };

    /**
     * Calculate when a seed is added to the world
     */
    Statistic.prototype.seedAdded = function(seed) {
        var worldStatistic = this;

        // Max IQ of a person and the year when he/she was born
        if (seed.IQ > worldStatistic.maxIQ) {
            worldStatistic.maxIQ = seed.IQ;
            worldStatistic.yearMaxIQ = worldStatistic.year;
        }
    };

    /**
     * Calculate when a seed is removed from the world
     */
    Statistic.prototype.seedRemoved = function(seed) {
        var worldStatistic = this;

        worldStatistic.die++;

        // Max age of a person and the year when he/she died
        var age = seed.age;
        if (age > worldStatistic.maxAge) {
            worldStatistic.maxAge = age;
            worldStatistic.yearMaxAge = worldStatistic.year;
        }
        worldStatistic.sumAge += age;

        // Not check married because married will be set to false if her husband die
        if (typeof seed.totalChildren !== 'undefined') {
            worldStatistic.dieMarriedFemale++;
            worldStatistic.sumChildren += seed.totalChildren;
        }
    };

    /**
     * Calculate when a year is passed
     */
    Statistic.prototype.yearPassed = function(data) {
        var worldStatistic = this;

        worldStatistic.year++;

        worldStatistic.population = data.population;

        worldStatistic.IQ = data.IQ;

        worldStatistic.men = data.men;
        worldStatistic.women = data.women;
        worldStatistic.boys = data.boys;
        worldStatistic.girls = data.girls;

        worldStatistic.families = data.families;
    };
})(window);