/*!
 * world.female.js
 * Female extends Seed
 *
 * World JS: Evolution Simulator
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013 An Vo - anvo4888@gmail.com
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

(function(window, undefined) {
    'use strict';

    var WorldJS = window.WorldJS,
        Seed = WorldJS.prototype.Seed;

    /**
     * Female constructor
     * data (optional)
     */
    var Female = WorldJS.prototype.Female = function(data) {
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

        female.IQ = (data.IQ || 0) + WorldJS.Helper.random(0, 5);

        female.age = 0;
        female.maxChildAge = 15;
        female.married = false;
        female.totalChildren = undefined; // Need to be set 0 on her first marriage
        // Last age when she bears a child
        female.ageLastBear = 0;

        female.chances = {
            death: [
                { range: [1, 5], from: 0.001, to: 0.005 },
                { range: [5, 20], from: 0.005, to: 0.01 },
                { range: [20, 30], from: 0.01, to: 0.05 }
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
     */
    Female.prototype.tick = function() {
        var female = this;

        female.tickCount++;

        var actionInterval = female.actionInterval;
        if (female.tickCount % actionInterval === actionInterval - 1) {
            // Trigger every <actionInterval> ticks
            var world = female.world,
                age = female.age;

            var deathChance = female.getChance(female, 'death');
            if (deathChance > 0 && Math.random() < deathChance) {
                world.remove(female);
            }

            // Bear a child (once a year)
            if (female.married && female.ageLastBear < age) {
                var childBirthChance = female.getChance(female, 'childbirth');
                if (childBirthChance > 0 && Math.random() < childBirthChance) {
                    female.ageLastBear = age;
                    female.totalChildren++;

                    var data = {
                            x: female.x,
                            y: Math.min(world.height - 1 - world.padding, female.y + Math.floor(female.appearance.height / 2)),
                            IQ: Math.round((female.relationSeed.IQ + female.IQ) / 2) // inherit IQ from parent
                        };

                    if (Math.random() < 0.5) {
                        world.add(world.Male, data);
                    } else {
                        world.add(world.Female, data);
                    }
                }
            }
        } else {
            female.move();
        }
    };
})(window);