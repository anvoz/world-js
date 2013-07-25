/*!
 * world.god.js (require jQuery)
 * Functions that modify the world instance directly
 *
 * World JS: Evolution Simulator
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013 An Vo - anvo4888@gmail.com
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

(function(window, undefined) {
    'use strict';

    var $ = window.$,
        WorldJS = window.WorldJS,
        freezeBtnId = '#world-freeze-btn',
        // God only takes control one world (instance) at the same time
        world;

    WorldJS.God = {
        /**
         * Set the world instance to take control
         * worldInstance: world instance
         */
        setWorldInstance: function(worldInstance) {
            world = worldInstance;
        },

        /**
         * Freeze / unfreeze the world
         */
        freeze: function() {
            var $btn = $(freezeBtnId);

            if (world.running) {
                world.stop();
                $btn.html('Unfreeze');
            } else {
                world.start();
                $btn.html('Freeze');
            }

            return false;
        },

        /**
         * Set knowledge priority
         * element: DOM element to change the visual effect
         * id: knowledge id
         * priority: the priority needs to be set (0, 0.1, 1, 2...)
         */
        setKnowledgePriority: function(element, id, priority) {
            world.Knowledge.list[id].IQ.priority = priority;

            var cls;
            if (priority > 1) {
                cls = 'progress';
            } else if (priority < 1) {
                cls = 'progress progress-danger';
            } else {
                cls = 'progress progress-info';
            }
            $(element).addClass('active').siblings().removeClass('active')
                .parent().parent().find('.progress').attr('class', cls);

            return false;
        },

        /**
         * Add random people to the world
         * count: number of people to add
         */
        addRandomPeople: function(count) {
            var isDead = world.Statistic.population == 0;

            world.addRandomPeople(count);
            if (isDead || !world.running) {
                // Start the world to re-draw
                world.start();
                $(freezeBtnId).html('Freeze');
            }

            return false;
        },

        /**
         * Kill some people in the world
         * percent: the percent of people to kill
         */
        kill: function(percent) {
            if (!world.running) {
                world.start();
            }

            world.stop(function() {
                var seeds = world.seeds,
                    random = Math.random,
                    rate = percent / 100;

                for (var id in seeds) {
                    if (seeds.hasOwnProperty(id) && random() < rate) {
                        world.remove(seeds[id]);
                    }
                }

                // Force start the world to re-draw
                world.start();
                $(freezeBtnId).html('Freeze');
            });

            return false;
        },

        /**
         * Give the world food
         * food: the amount of food to give
         */
        giveFood: function(food) {
            world.Statistic.food += food;

            return false;
        }
    };
})(window);