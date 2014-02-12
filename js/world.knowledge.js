/*!
 * world.knowledge.js (require Statistic and Rules module)
 * Add IQ to humans so they can learn knowledge to survive.
 *
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013-2014 An Vo - anvo4888@gmail.com
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 */

(function(window, undefined) {
    'use strict';

    var WorldJS = window.WorldJS,
        Knowledge;

    /**
     * Knowledge constructor
     */
    Knowledge = WorldJS.Knowledge = function(world) {
        var worldKnowledge = this;

        // Store reference of a world
        worldKnowledge.world = world;

        // List of all knowledge
        worldKnowledge.list = {
            /*
             * samp: {
             *      // Knowledge id
             *      id: 'samp',
             *      // Display name
             *      name: 'Sample knowledge',
             *      description: '',
             *      iq: {
             *          // Priority factor: 0.1 (low), 1 (normal), 2 (high)
             *          priority: 1,
             *          // Gained IQ
             *          // Need 1000 IQ to start to affect the world
             *          gained: 0,
             *          required: 1000
             *      },
             *      // List of following knowledge that will be started
             *      // after this one completed
             *      following: ['samp2', 'samp3'],
             *      // The year when this knowledge started to affect the world
             *      affectedYear: false,
             *      // Callback
             *      onAffected: function(world) { }
             * }
             */
        };

        // Trending knowledge id list
        worldKnowledge.trending = [];

        worldKnowledge.trendingAdded = function() {};
        worldKnowledge.trendingRemoved = function() {};

        // Completed knowledge list
        worldKnowledge.completed = [];

        var worldStatistic = world.statistic;
        // Total IQ
        worldStatistic.iq = 0;
        // Max IQ of a person and the year when he/she was born
        worldStatistic.maxIQ = 0;
        worldStatistic.yearMaxIQ = 0;

        var worldRules = world.rules;
        worldRules.baseIQ = 0;

        var worldEvent = world.event;
        worldEvent.add('seedAdded', 'knowledge', function(data) {
            this.knowledge.seedAdded(data);
        });
        worldEvent.add('seedRemoved', 'knowledge', function(data) {
            this.knowledge.seedRemoved(data);
        });
        worldEvent.add('yearPassed', 'knowledge', function() {
            this.knowledge.gain();
        });
    };

    /**
     * Seed added event for Knowledge module
     */
    Knowledge.prototype.seedAdded = function(data) {
        var seed = data.seed,
            world = seed.world;

        // Add IQ to seed
        if (typeof data.mother !== 'undefined') {
            // Inherit IQ from its parent
            seed.iq = Math.round(
                (data.mother.relationSeed.iq + data.mother.iq) / 2
            );
        }

        seed.iq = seed.iq || 0;
        seed.iq += world.random(0, 3);

        seed.iq += world.rules.baseIQ;

        // Statistic
        var worldStatistic = world.statistic;
        worldStatistic.iq += seed.iq;
        if (seed.iq > worldStatistic.maxIQ) {
            worldStatistic.maxIQ = seed.iq;
            worldStatistic.yearMaxIQ = worldStatistic.year;
        }
    };

    /**
     * Seed removed event for Knowledge module
     */
    Knowledge.prototype.seedRemoved = function(data) {
        var seed = data.seed,
            world = seed.world;

        world.statistic.iq -= seed.iq;
    };

    /**
     * Gain knowledge
     */
    Knowledge.prototype.gain = function() {
        var worldKnowledge = this,
            world = worldKnowledge.world,

            year = world.statistic.year,
            totalIQ = world.statistic.iq,
            distributedIQList = [],
            totalDistributedUnit = 0,

            knowledge = false,
            i = 0, len = 0;

        /*
         * Create distributed IQ list.
         * All IQ will be randomly distributed to trending knowledge
         * and 1 fake knowledge each year.
         * Distributing to a fake knowledge is represented
         * as wasted IQ every year.
         */
        for (i = 0, len = worldKnowledge.trending.length; i <= len; i++) {
            distributedIQList[i] = world.random(0, 100);
            if (i < len) {
                knowledge = worldKnowledge.list[worldKnowledge.trending[i]];
                if (knowledge.iq.priority != 1) {
                    distributedIQList[i] *= knowledge.iq.priority;
                }
            }
            // Store the total to calculate percent later
            totalDistributedUnit += distributedIQList[i];
        }

        var maxDistributedValues = { '0.1': 0.01, '1': 0.05, '2': 0.1 },
            tmpTrending = [],
            tmpFollowing = [],
            tmpCompleted = [];
        for (i = 0, len = worldKnowledge.trending.length; i < len; i++) {
            knowledge = worldKnowledge.list[worldKnowledge.trending[i]];
            var distributedIQ = totalIQ * distributedIQList[i] / totalDistributedUnit,
                gainedIQ = knowledge.iq.gained;

            // Prevent to gain too much IQ a year
            gainedIQ += Math.floor(Math.min(
                knowledge.iq.required * maxDistributedValues[knowledge.iq.priority],
                distributedIQ
            ));
            if (isNaN(gainedIQ)) {
                gainedIQ = knowledge.iq.gained;
            }

            if (gainedIQ >= knowledge.iq.required) {
                // Completed knowledge
                knowledge.iq.gained = knowledge.iq.required;

                // Merge 2 arrays
                tmpFollowing.push.apply(tmpFollowing, knowledge.following);

                // Start to affect the world
                knowledge.affectedYear = year;
                if (typeof knowledge.onAffected === 'function') {
                    knowledge.onAffected(world);
                }

                tmpCompleted.push(knowledge);
            } else {
                knowledge.iq.gained = gainedIQ;
                tmpTrending.push(knowledge.id);
            }
        }

        if (tmpCompleted.length > 0) {
            // Move completed trending knowledge to completed knowledge list
            for (i = 0; i < tmpCompleted.length; i++) {
                worldKnowledge.trendingRemoved(tmpCompleted[i]);
                worldKnowledge.completed.push(tmpCompleted[i]);
            }

            // Add new knowledge to trending
            for (i = 0; i < tmpFollowing.length; i++) {
                worldKnowledge.trendingAdded(worldKnowledge.list[tmpFollowing[i]]);
                tmpTrending.push(tmpFollowing[i]);
            }
            worldKnowledge.trending = tmpTrending;
        }
    };
})(window);