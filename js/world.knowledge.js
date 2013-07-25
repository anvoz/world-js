/*!
 * world.knowledge.js
 * Knowledge class
 *
 * World JS: Evolution Simulator
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
    Knowledge = WorldJS.Knowledge = function() {
        var knowledge = this;

        knowledge.list = { // List of all knowledge
            /* samp: {
                id: 'samp',                         // Knowledge id
                name: 'Sample knowledge',           // Display name
                description: '',
                IQ: {
                    priority: 1,                    // Priority factor: 0.5 (half), 1 (normal), 2 (double)
                    gained: 0,                      // Gained IQ so far
                    required: 1000                  // Need 1000 IQ to start to affect the world
                },
                following: ['samp2', 'samp3'],      // List of following knowledge that will be started after this one completes
                affectedYear: false,                // The year when this knowledge starts to affect the world
                onAffected: function(world) { }     // Callback
            } */
        };

        // Trending knowledge id list
        knowledge.trending = [];
        knowledge.trendingAdded = function() {};
        knowledge.trendingRemoved = function() {};

        // Completed knowledge list
        knowledge.completed = [];
    };

    /**
     * Gain knowledge
     */
    Knowledge.prototype.gain = function(world) {
        var Knowledge = this,
            year = world.Statistic.year,
            totalIQ = world.Statistic.IQ,
            distributedIQList = [],
            totalDistributedUnit = 0;

        // Create distributed IQ list
        // All IQ will be randomly distributed to trending knowledge + 1 fake knowledge
        // Distributing to a fake knowledge is represented as wasted IQ every year
        for (var i = 0, len = Knowledge.trending.length; i <= len; i++) {
            distributedIQList[i] = WorldJS.Helper.random(0, 100);
            if (i < len) {
                var knowledge = Knowledge.list[Knowledge.trending[i]];
                if (knowledge.IQ.priority != 1) {
                    distributedIQList[i] *= knowledge.IQ.priority;
                }
            }
            // Store the total to calculate percent later
            totalDistributedUnit += distributedIQList[i];
        }

        var tmpTrending = [],
            tmpFollowing = [],
            tmpCompleted = [];
        for (var i = 0, len = Knowledge.trending.length; i < len; i++) {
            var knowledge = Knowledge.list[Knowledge.trending[i]],
                distributedIQ = totalIQ * distributedIQList[i] / totalDistributedUnit,
                gainedIQ = Math.floor(knowledge.IQ.gained + distributedIQ);

            if (gainedIQ >= knowledge.IQ.required) { // Completed
                knowledge.IQ.gained = knowledge.IQ.required;

                tmpFollowing.push.apply(tmpFollowing, knowledge.following);

                // Start to affect the world
                knowledge.affectedYear = year;
                knowledge.onAffected(world);

                tmpCompleted.push(knowledge);
            } else {
                knowledge.IQ.gained = gainedIQ;
                tmpTrending.push(knowledge.id);
            }
        }

        if (tmpCompleted.length > 0) {
            // Move completed trending knowledge to completed knowledge list
            for (var i = 0; i < tmpCompleted.length; i++) {
                Knowledge.trendingRemoved(tmpCompleted[i]);
                Knowledge.completed.push(tmpCompleted[i]);
            }

            for (var i = 0; i < tmpFollowing.length; i++) {
                Knowledge.trendingAdded(Knowledge.list[tmpFollowing[i]]);
                tmpTrending.push(tmpFollowing[i]);
            }
            Knowledge.trending = tmpTrending;
        }
    };
})(window);