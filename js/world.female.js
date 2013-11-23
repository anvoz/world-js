/*!
 * world.female.js
 * Female class extends Seed.
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
        Female;

    /**
     * Female constructor
     * data (optional): seed data, IQ, age, chances
     */
    Female = WorldJS.prototype.Female = function(data) {
        var female = this;

        data.appearance = {
            x: 13,
            y: 0,
            width: 13,
            height: 20,
            child: { // must define maxChildAge
                x: 26,
                y: 10,
                width: 11,
                height: 10
            }
        };

        Seed.call(female, data);

        female.IQ = (data.IQ || 0) + Math.floor(Math.random() * 4); // Random [0, 3]

        female.maxChildAge = 15;

        female.married = false;
        // Total children that she gave birth
        // Need to be set from undefined to 0 right after her first marriage
        female.totalChildren = undefined;
        // The age when she bears her youngest child
        female.ageLastBear = 0;

        female.chances = data.chances || {
            death: [
                { range: [1, 25], from: 0.02, to: 0.01 },
                { range: [25, 65], from: 0.01, to: 0.02 },
                { range: [65, 85], from: 0.02, to: 0.05 },
                { range: [85, 105], from: 0.05, to: 0.9 }
            ],
            childbirth: [
                { range: [15, 25], from: 0.1, to: 0.25 },
                { range: [25, 50], from: 0.25, to: 0.1 },
                { range: [50, 70], from: 0.1, to: 0.001 }
            ]
        };
    };
    Female.prototype = Object.create(Seed.prototype);
    Female.prototype.contructor = Female;

    /**
     * Female action in every frame (tick)
     * speed: speed of the world
     */
    Female.prototype.tick = function(speed) {
        var female = this;

        female.tickCount++;

        var actionInterval = female.actionInterval / speed;
        if (female.tickCount % actionInterval === actionInterval - 1) {
            // Trigger every <actionInterval> ticks
            var world = female.world,
                age = female.age;

            var deathChance = female.getChance(female, 'death');
            if (deathChance > 0 && Math.random() < deathChance) {
                world.remove(female);
                return;
            }

            if (female.married &&                                       // Is married
                    age >= female.chances.childbirth[0].range[0] &&     // Enough age to give birth
                    age > female.ageLastBear) {                         // Not give birth in the same year
                var childBirthChance = female.getChance(female, 'childbirth');
                if (childBirthChance > 0 && Math.random() < childBirthChance) {
                    // +1 because she has more than 1 chance to give birth every year
                    // depended on actionInterval
                    female.ageLastBear = age + 1;
                    female.totalChildren++;

                    var data = {
                            x: female.x,
                            y: Math.min(
                                world.height - 1 - world.padding,
                                female.y + Math.floor(female.appearance.height / 2)
                            ),
                            IQ: Math.round((female.relationSeed.IQ + female.IQ) / 2) // inherit IQ from parent
                        };

                    if (Math.random() < 0.5) {
                        world.add(world.Male, data);
                    } else {
                        world.add(world.Female, data);
                    }
                }
            }
        }

        female.move(speed, false);
    };
})(window);