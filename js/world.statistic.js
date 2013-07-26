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

        // Record when people was born or died
        statistic.population = 0;
        statistic.male = 0;
        statistic.female = 0;
        statistic.IQ = 0;

        // ++ when they married
        // -- if husband or wife died
        statistic.family = 0;

        // Re-calculate every year
        // Data base on age of people
        statistic.men = 0;     // adult male
        statistic.women = 0;   // adult female
        statistic.boy = 0;     // young male
        statistic.girl = 0;    // young female

        // Record when someone was born
        // Max IQ of a person and the year when he/she was born
        statistic.maxIQ = 0;
        statistic.yearMaxIQ = 0;
        // Max age of a person and the year when he/she died
        statistic.maxAge = 0;
        statistic.yearMaxAge = 0;

        // Record when someone died
        // Used for calculating average age
        statistic.die = 0;     // Number of dead people
        statistic.sumAge = 0;  // and total age of them
        // Used for calculating average children of each family
        statistic.dieMarriedFemale = 0;    // Number of dead married female
        statistic.sumChildren = 0;          // and total children of them
    };

    /**
     * Calculate when a seed is added to the world
     */
    Statistic.prototype.seedAdded = function(world, seed) {
        var Statistic = world.Statistic;

        Statistic.population++;
        if (seed instanceof world.Male) {
            Statistic.male++;
        } else {
            Statistic.female++;
        }

        var IQ = seed.IQ;
        Statistic.IQ += IQ;
        // Max IQ of a person and the year when he/she was born
        if (IQ > Statistic.maxIQ) {
            Statistic.maxIQ = IQ;
            Statistic.yearMaxIQ = Statistic.year;
        }
    };

    /**
     * Calculate when a seed is removed from the world
     */
    Statistic.prototype.seedRemoved = function(world, seed) {
        var Statistic = world.Statistic;

        Statistic.population--;
        if (seed instanceof world.Male) {
            Statistic.male--;
        } else {
            Statistic.female--;
        }
        Statistic.die++;

        Statistic.IQ -= seed.IQ;

        if (seed.married) {
            Statistic.family--;
        }

        // Max age of a person and the year when he/she died
        var age = seed.age;
        if (age > Statistic.maxAge) {
            Statistic.maxAge = age;
            Statistic.yearMaxAge = Statistic.year;
        }
        Statistic.sumAge += age;

        // Not check married because married will be set to false if her husband die
        if (!WorldJS.Helper.is(seed.totalChildren, 'undefined')) {
            Statistic.dieMarriedFemale++;
            Statistic.sumChildren += seed.totalChildren;
        }
    };

    /**
     * Calculate when a year is passed
     */
    Statistic.prototype.yearPassed = function(world, data) {
        var Statistic = world.Statistic;

        Statistic.year++;

        Statistic.men = Statistic.male - data.sumBoy;
        Statistic.women = Statistic.female - data.sumGirl;
        Statistic.boy = data.sumBoy;
        Statistic.girl = data.sumGirl;
    };

    /**
     * A new couple is married
     */
    Statistic.prototype.married = function(world) {
        world.Statistic.family++;
    };
})(window);