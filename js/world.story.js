/*!
 * world.story.js
 * Initialize a world and define its main plot.
 *
 * World JS: Evolution Simulator
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013 An Vo - anvo4888@gmail.com
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

(function(window, undefined) {
    'use strict';

    var WorldJS = window.WorldJS,
        Interface = WorldJS.Interface,

        // Create a new world
        world = new WorldJS(),
        Knowledge = world.Knowledge;

    WorldJS.God.setWorldInstance(world);

    // Define knowledge of the world
    Knowledge.list = WorldJS.KnowledgeData;

    // Start with some knowledge
    Knowledge.trending = ['huga', 'fire'];
    Interface.trendingAdded(Knowledge.list.huga);
    Interface.trendingAdded(Knowledge.list.fire);

    // Bind callback
    Knowledge.trendingAdded = Interface.trendingAdded;
    Knowledge.trendingRemoved = Interface.trendingRemoved;
    world.yearPassedCallback = Interface.yearPassed;

    world.init('world');

    /*
     * Create the first man and woman of the world.
     * They will move from the corner to the center of the world.
     * They are guaranteed to mate and produce offspring
     * then die at the intended age.
     */
    var firstMenMaxAge = 30;
    world.add(world.Male, {
        x: 10,
        y: 10,
        moveTo: { x: 320, y: 180 },
        age: 13,
        moveUntilStep: 9999, // Always move
        chances: {
            // Guarantee to live at least <firstMenMaxAge> age
            death: [
                { range: [1, firstMenMaxAge - 1], from: 0, to: 0 },
                { range: [firstMenMaxAge - 1, firstMenMaxAge], from: 1, to: 1 }
            ],
            // 100% marriage success chance
            marriage: [
                { range: [1, firstMenMaxAge], from: 1, to: 1 }
            ]
        }
    });
    world.add(world.Female, {
        x: 630,
        y: 350,
        moveTo: { x: 320, y: 180 },
        age: 13,
        moveUntilStep: 9999, // Always move
        chances: {
            // Guarantee to live at least <firstMenMaxAge> age
            death: [
                { range: [1, firstMenMaxAge - 1], from: 0, to: 0 },
                { range: [firstMenMaxAge - 1, firstMenMaxAge], from: 1, to: 1 }
            ],
            // 100% childbirth success chance
            childbirth: [
                { range: [1, firstMenMaxAge], from: 1, to: 1 }
            ]
        }
    });

    world.start();
})(window);