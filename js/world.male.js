/*!
 * world.male.js
 * Male class extends Seed
 *
 * World JS: Evolution Simulator
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013 An Vo - anvo4888@gmail.com
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

(function(window, undefined) {
    'use strict';

    var WorldJS = window.WorldJS,
        Seed = WorldJS.prototype.Seed,
        Male;

    /**
     * Male constructor
     * data (optional)
     */
    Male = WorldJS.prototype.Male = function(data) {
        var male = this;

        data.appearance = {
            x: 0,
            y: 0,
            width: 13,
            height: 20,
            child: { // must define maxChildAge
                x: 26,
                y: 0,
                width: 11,
                height: 10
            }
        };

        Seed.call(male, data);

        male.IQ = (data.IQ || 0) + WorldJS.Helper.random(0, 3);

        male.age = data.age || 0;
        male.maxChildAge = 15;
        male.married = false;

        male.chances = data.chances || {
            death: [
                { range: [1, 5], from: 0.001, to: 0.005 },
                { range: [5, 15], from: 0.005, to: 0.01 },
                { range: [15, 25], from: 0.01, to: 0.025 }
            ],
            marriage: [
                { range: [15, 30], from: 0.1, to: 0.5 },
                { range: [30, 50], from: 0.5, to: 0.1 },
                { range: [50, 80], from: 0.1, to: 0.01 }
            ]
        };
    };
    Male.prototype = Object.create(Seed.prototype);
    Male.prototype.contructor = Male;

    /**
     * Male action in every frame (tick)
     */
    Male.prototype.tick = function() {
        var male = this;

        male.tickCount++;

        var actionInterval = male.actionInterval;
        if (male.tickCount % actionInterval === actionInterval - 1) {
            // Trigger every <actionInterval> ticks
            var world = male.world;

            var deathChance = male.getChance(male, 'death');
            if (deathChance > 0 && Math.random() < deathChance) {
                world.remove(male);
            }

            if (!male.married && male.age >= male.chances.marriage[0].range[0]) {
                // Seeking for female
                var marriageChance = male.getChance(male, 'marriage');
                if (marriageChance > 0) {
                    var failureChance = Math.random();
                    if (failureChance < marriageChance) {
                        var female = male.seek(function(candidate) {
                            return (candidate instanceof world.Female &&
                                !candidate.married &&
                                candidate.age >= candidate.chances.childbirth[0].range[0] &&
                                // failure chance increase (every 10 age difference) if male is younger than female
                                (candidate.age <= male.age || (failureChance * (Math.ceil((candidate.age - male.age) / 10))) < marriageChance)
                            );
                        });
                        if (female !== false) {
                            // Make a family
                            male.married = true;
                            female.married = true;

                            if (WorldJS.Helper.is(female.totalChildren, 'undefined')) {
                                // Start record all children of this female
                                female.totalChildren = 0;
                            }

                            // 2-way references
                            male.relationSeed = female;
                            female.relationSeed = male;

                            world.Statistic.married(world);
                        }
                    }
                }
            }
        } else {
            // Men will follow his wife
            var beforeMoveCallback = (!male.married) ?
                undefined :
                function() {
                    var male = this;
                    var female = male.relationSeed;

                    male.moveTo.x = Math.max(0, female.x - 10);
                    male.moveTo.y = female.y;
                };
            male.move(beforeMoveCallback);
        }
    };
})(window);