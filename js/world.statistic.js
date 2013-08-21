/*!
 * world.statistic.js
 * Statistic class
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
    Statistic = WorldJS.Statistic = function() {
        var statistic = this;

        statistic.year = 0;
        statistic.food = 10000;

        // Re-calculate every year
        statistic.population = 0;
        statistic.IQ = 0;
        statistic.men = 0;          // adult male
        statistic.women = 0;        // adult female
        statistic.boys = 0;         // young male
        statistic.girls = 0;        // young female
        statistic.families = 0;

        // Record when someone was born
        // Max IQ of a person and the year when he/she was born
        statistic.maxIQ = 0;
        statistic.yearMaxIQ = 0;
        // Max age of a person and the year when he/she died
        statistic.maxAge = 0;
        statistic.yearMaxAge = 0;

        // Record when someone died
        // Used for calculating average age
        statistic.die = 0;                  // Number of dead people
        statistic.sumAge = 0;               // and total age of them
        // Used for calculating average children of each family
        statistic.dieMarriedFemale = 0;     // Number of dead married female
        statistic.sumChildren = 0;          // and total children of them
    };

    /**
     * Calculate when a seed is added to the world
     */
    Statistic.prototype.seedAdded = function(seed) {
        var statistic = this;

        // Max IQ of a person and the year when he/she was born
        if (seed.IQ > statistic.maxIQ) {
            statistic.maxIQ = seed.IQ;
            statistic.yearMaxIQ = statistic.year;
        }
    };

    /**
     * Calculate when a seed is removed from the world
     */
    Statistic.prototype.seedRemoved = function(seed) {
        var statistic = this;

        statistic.die++;

        // Max age of a person and the year when he/she died
        var age = seed.age;
        if (age > statistic.maxAge) {
            statistic.maxAge = age;
            statistic.yearMaxAge = statistic.year;
        }
        statistic.sumAge += age;

        // Not check married because married will be set to false if her husband die
        if (!WorldJS.Helper.is(seed.totalChildren, 'undefined')) {
            statistic.dieMarriedFemale++;
            statistic.sumChildren += seed.totalChildren;
        }
    };

    /**
     * Calculate when a year is passed
     */
    Statistic.prototype.yearPassed = function(data) {
        var statistic = this;

        statistic.year++;

        statistic.population = data.population;

        statistic.IQ = data.IQ;

        statistic.men = data.men;
        statistic.women = data.women;
        statistic.boys = data.boys;
        statistic.girls = data.girls;

        statistic.families = data.families;
    };
})(window);