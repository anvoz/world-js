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

        // Re-calculate every year
        worldStatistic.population = 0;
        worldStatistic.men = 0;         // adult male
        worldStatistic.women = 0;       // adult female
        worldStatistic.boys = 0;        // young male
        worldStatistic.girls = 0;       // young female
        worldStatistic.families = 0;

        // Record when someone was born
        // Max age of a person and the year when he/she died
        worldStatistic.maxAge = 0;
        worldStatistic.yearMaxAge = 0;

        // Record when someone died
        // Used for calculating average age
        worldStatistic.die = 0;     // Number of dead people
        worldStatistic.sumAge = 0;  // and total age of them

        worldStatistic.avgChildren = 0;

        var worldEvent = world.event;
        worldEvent.add('yearPassed', 'statistic', function() {
            this.statistic.yearPassed();
        });
        worldEvent.add('seedRemoved', 'statistic', function(data) {
            this.statistic.seedRemoved(data.seed);
        });
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
    };

    /**
     * Calculate when a year is passed
     */
    Statistic.prototype.yearPassed = function() {
        var worldStatistic = this,
            world = worldStatistic.world,
            listTile = world.tile.list,

            population = 0,
            totalIQ = 0,
            men = 0, women = 0,
            boys = 0, girls = 0,
            families = 0,
            children = 0;

        for (var i = 0, len = listTile.length; i < len; i++) {
            var seeds = listTile[i];
            for (var j = 0, len2 = seeds.length; j < len2; j++) {
                if (seeds[j]) {
                    var seed = seeds[j];

                    population++;
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
                            if (typeof seed.totalChildren !== 'undefined') {
                                children += seed.totalChildren;
                            }
                        }
                    }
                }
            }
        }

        worldStatistic.year++;

        worldStatistic.population = population;
        worldStatistic.men = men;
        worldStatistic.women = women;
        worldStatistic.boys = boys;
        worldStatistic.girls = girls;
        worldStatistic.families = families;

        worldStatistic.avgChildren = Math.floor(children / women) || 0;
    };
})(window);