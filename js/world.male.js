/*!
 * world.male.js
 * Male class extends Seed.
 *
 * World JS
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
     * data (optional): seed data, IQ, age, chances
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

        male.iq = (data.iq || 0) + Math.floor(Math.random() * 4); // Random [0, 3]

        male.maxChildAge = 15;

        male.chances = data.chances || {
            death: [
                { range: [1, 20], from: 0.02, to: 0.01 },
                { range: [20, 60], from: 0.01, to: 0.02 },
                { range: [60, 80], from: 0.02, to: 0.05 },
                { range: [80, 100], from: 0.05, to: 0.9 }
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
     * speed: speed of the world
     */
    Male.prototype.tick = function(speed) {
        var male = this;

        male.tickCount++;

        var actionInterval = male.actionInterval / speed;
        if (male.tickCount % actionInterval === actionInterval - 1) {
            // Trigger every <actionInterval> ticks
            var world = male.world;

            var deathChance = male.getChance(male, 'death');
            if (deathChance > 0 && Math.random() < deathChance) {
                world.removeSeed(male);
                return;
            }

            if (male.relationSeed === false &&
                male.age >= male.chances.marriage[0].range[0]
            ) {
                // Seeking for female
                var marriageChance = male.getChance(male, 'marriage');
                if (marriageChance > 0) {
                    var failureChance = Math.random();
                    if (failureChance < marriageChance) {
                        var female = male.seek(function(candidate) {
                            var male = this,
                                world = male.world;
                            return (
                                candidate instanceof world.Female &&
                                candidate.relationSeed === false &&
                                // Enough age to give birth
                                candidate.age >= candidate.chances.childbirth[0].range[0] &&
                                // Failure chance increase (every 10 age difference) if male is younger than female
                                (candidate.age <= male.age ||
                                        (failureChance * (Math.ceil((candidate.age - male.age) / 10))) < marriageChance)
                            );
                        });
                        if (female !== false) {
                            male.relationSeed = female;
                            female.relationSeed = male;

                            if (typeof female.totalChildren === 'undefined') {
                                // Start record all children of this female
                                female.totalChildren = 0;
                            }

                            // Prevent having children right after married
                            female.ageLastBear = female.age + 1;
                        }
                    }
                }
            }
        }

        if (male.relationSeed !== false) {
            if (male.x === Math.max(0, male.relationSeed.x - 10) &&
                    male.y === male.relationSeed.y) {
                return;
            }
            male.move(speed, function() {
                // Men will follow his wife
                var male = this,
                    female = male.relationSeed;

                male.moveTo.x = Math.max(0, female.x - 10);
                male.moveTo.y = female.y;
            });
        } else {
            male.move(speed, false);
        }
    };
})(window);