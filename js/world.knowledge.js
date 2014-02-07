/*!
 * world.knowledge.js (require Statistic module)
 * Manage knowledge of a world.
 * Distribute IQ of the world over trending knowledge and apply completed knowledge effects to the world.
 *
 * World JS
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013 An Vo - anvo4888@gmail.com
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
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
            totalDistributedUnit = 0;

        /*
         * Create distributed IQ list.
         * All IQ will be randomly distributed to trending knowledge
         * and 1 fake knowledge each year.
         * Distributing to a fake knowledge is represented
         * as wasted IQ every year.
         */
        for (var i = 0, len = worldKnowledge.trending.length; i <= len; i++) {
            distributedIQList[i] = world.random(0, 100);
            if (i < len) {
                var knowledge = worldKnowledge.list[worldKnowledge.trending[i]];
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
        for (var i = 0, len = worldKnowledge.trending.length; i < len; i++) {
            var knowledge = worldKnowledge.list[worldKnowledge.trending[i]],
                distributedIQ = totalIQ * distributedIQList[i] / totalDistributedUnit,
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
            for (var i = 0; i < tmpCompleted.length; i++) {
                worldKnowledge.trendingRemoved(tmpCompleted[i]);
                worldKnowledge.completed.push(tmpCompleted[i]);
            }

            // Add new knowledge to trending
            for (var i = 0; i < tmpFollowing.length; i++) {
                worldKnowledge.trendingAdded(worldKnowledge.list[tmpFollowing[i]]);
                tmpTrending.push(tmpFollowing[i]);
            }
            worldKnowledge.trending = tmpTrending;
        }
    };
})(window);