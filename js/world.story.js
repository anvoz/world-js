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

    var document = window.document,
        WorldJS = window.WorldJS,
        Interface = WorldJS.Interface,

        // Create a new world
        world = new WorldJS(),
        Knowledge = world.Knowledge;

    // Define knowledge of the world
    Knowledge.list = WorldJS.KnowledgeData;

    // Start with some knowledge
    Knowledge.trending = ['huga'];
    Interface.trendingAdded(Knowledge.list.huga);

    // Bind callback
    Knowledge.trendingAdded = Interface.trendingAdded;
    Knowledge.trendingRemoved = Interface.trendingRemoved;
    world.yearPassedCallback = Interface.yearPassed;

    // Bind UI
    $('#world-freeze-btn').click(function() {
        if (world.running) {
            world.stop();
            $(this).html('Unfreeze');
        } else {
            world.start();
            $(this).html('Freeze');
        }
    });
    $(document).on('change', '.priority', function() {
        var $this = $(this),
            id = $this.data('id'),
            priority = $this.find('option:selected').attr('value'),
            priorityValue = 0,
            progressBarClass = '';

        switch (priority) {
            case 'high':
                priorityValue = 2;
                progressBarClass = 'progress-bar';
                break;
            case 'low':
                priorityValue = 0.1;
                progressBarClass = 'progress-bar progress-bar-danger';
                break;
            default:
                priorityValue = 1;
                progressBarClass = 'progress-bar progress-bar-info';
                break;
        }

        world.Knowledge.list[id].IQ.priority = priorityValue;
        $this.parents('.knowledge').find('.progress').find('.progress-bar').attr('class', progressBarClass);
    });

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
                { range: [1, firstMenMaxAge], from: 0, to: 0 },
                { range: [firstMenMaxAge, 60], from: 0.01, to: 0.02 },
                { range: [60, 80], from: 0.02, to: 0.05 },
                { range: [80, 100], from: 0.05, to: 0.5 }
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
                { range: [1, firstMenMaxAge], from: 0, to: 0 },
                { range: [firstMenMaxAge, 65], from: 0.01, to: 0.02 },
                { range: [65, 85], from: 0.02, to: 0.05 },
                { range: [85, 105], from: 0.05, to: 0.5 }
            ],
            // 100% childbirth success chance
            childbirth: [
                { range: [1, firstMenMaxAge], from: 1, to: 1 }
            ]
        }
    });

    world.Rules.Population.limit = 50;
    world.padding = 50;

    world.start();
})(window);