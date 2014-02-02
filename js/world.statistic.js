/*!
 * world.statistic.js
 * Track statistic of a world via function callback.
 *
 * World JS
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

        var worldEvent = world.Event;
        worldEvent.add('yearPassed', 'statistic', function() {
            this.Statistic.yearPassed();
        });
        worldEvent.add('seedAdded', 'statistic', function(data) {
            this.Statistic.seedAdded(data.seed);
        });
        worldEvent.add('seedRemoved', 'statistic', function(data) {
            this.Statistic.seedRemoved(data.seed);
        });
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
    Statistic.prototype.yearPassed = function() {
        var worldStatistic = this,
            world = worldStatistic.world,
            listTile = world.Tile.list,

            population = 0,
            totalIQ = 0,
            men = 0, women = 0,
            boys = 0, girls = 0,
            families = 0;

        for (var i = 0, len = listTile.length; i < len; i++) {
            var seeds = listTile[i];
            for (var j = 0, len2 = seeds.length; j < len2; j++) {
                if (seeds[j]) {
                    var seed = seeds[j];

                    population++;
                    totalIQ += seed.IQ;
                    if (seed instanceof world.Male) {
                        if (seed.age <= seed.maxChildAge) {
                            boys++;
                        } else {
                            men++;
                            if (seed.relationSeed !== false) {
                                families++;
                            }
                        }
                    } else {
                        if (seed.age <= seed.maxChildAge) {
                            girls++;
                        } else {
                            women++;
                        }
                    }
                }
            }
        }

        worldStatistic.year++;

        worldStatistic.population = population;

        worldStatistic.IQ = totalIQ;

        worldStatistic.men = men;
        worldStatistic.women = women;
        worldStatistic.boys = boys;
        worldStatistic.girls = girls;

        worldStatistic.families = families;
    };
})(window);