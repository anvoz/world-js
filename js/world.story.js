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
        $ = window.$,

        WorldJS = window.WorldJS,
        Interface = WorldJS.Interface,

        // Create a new world
        world = new WorldJS(),

        Knowledge = world.Knowledge,
        Rules = world.Rules,
        Event = world.Event,
        Guide = world.Guide;

    /** Knowledge setup */
    // Load all knowledge list
    Knowledge.list = WorldJS.KnowledgeData;

    // Start with 1 knowledge (hunting and gathering)
    Knowledge.trending = ['huga'];
    Interface.trendingAdded(Knowledge.list.huga);

    // Update UI
    Knowledge.trendingAdded = Interface.trendingAdded;
    Knowledge.trendingRemoved = function(knowledge) {
        Interface.trendingRemoved(knowledge);

        Guide.show([
            '<div><b>Knowledge Completed</b></div>',
            '<div>', knowledge.name, '</div>'
        ].join(''), 5);
    };

    /** Rule setup */
    Rules.Population.limit = 50;

    /** Event setup */
    // Update game UI with new data of each year
    Event.add('yearPassed', 'updateUI', Interface.yearPassed);

    // Control population in the early stage of the game
    Event.add('yearPassed', 'populationControl', function() {
        var world = this,
            year = world.Statistic.year;

        if (year <= 20) {
            if (year == 20) {
                // Based on the story
                world.addRandomPeople(25, 20, 30, 5);
            }
        } else {
            var Statistic = world.Statistic,
                Rules = world.Rules;

            // Keep the population stable if there is enough food
            if (Statistic.population < 30 && Statistic.food > Rules.Famine.unit) {
                world.addRandomPeople(10, 20, 30, 5);
            }

            if (year > 300) {
                world.Event.remove('yearPassed', 'populationControl');
            }
        }
    });

    // Unlock population limit
    Event.add('yearPassed', 'populationLimitUnlock', function() {
        var world = this,
            Knowledge = world.Knowledge,
            listKnowledge = [
                { id: 'goss', population: 50 },
                { id: 'spir', population: 150 }
            ];

        for (var i = 0; i < listKnowledge.length; i++) {
            var knowledgeId = listKnowledge[i].id;

            // Add new knowledge when the population reached its limit
            if (world.Statistic.population >= listKnowledge[i].population && !Knowledge.list[knowledgeId].added) {
                Knowledge.list[knowledgeId].added = true;
                Knowledge.trending.push(knowledgeId);
                Interface.trendingAdded(Knowledge.list[knowledgeId]);

                world.Guide.show([
                    '<div><b>Knowledge Unlocked</b></div>',
                    '<div>', Knowledge.list[knowledgeId].name, '</div>'
                ].join(''), 5);

                if (knowledgeId == 'spir') {
                    world.Event.remove('yearPassed', 'populationLimitUnlock');
                }

                break;
            }
        }
    });

    // Default behaviors for every year
    Event.add('yearPassed', 'default', function() {
        var world = this,
            Knowledge = world.Knowledge,
            Statistic = world.Statistic,
            Rules = world.Rules;

        Statistic.foodResource = Math.min(Statistic.foodResource, Rules.Food.resourceMax);

        if (Knowledge.completed.length == 8) {
            if (Knowledge.trending.length == 0) {
                // Add coming soon message
                Knowledge.trending.push('coso');
                Interface.trendingAdded(Knowledge.list['coso']);
            }

            if (Statistic.population == 0) {
                $('#world-pause-btn').prop('disabled', 'disabled');
                world.stop();
            }
        }
    });

    /** Guide setup */
    Guide.setContainer($('#world-container .guide'));

    var messages = [
        { year: 5, ytl: 15, html: [
            '<div>About 250,000 years ago, our ancestors begin their lives in East Africa.</div>',
            '<div>They have extraordinary large brains and the ability of walking upright.</div>'
        ].join('') },
        { year: 20, ytl: 15, html: [
            '<div>In trade-off they are less muscular and born prematurely.</div>',
            '<div>Thus they evolve stronger social ties and start living in small bands.</div>'
        ].join('') }
    ];
    for (var i = 0; i < messages.length; i++) {
        (function(message) {
            Event.add('yearPassed', 'message-' + message.year, function() {
                var world = this;

                if (world.Statistic.year == message.year) {
                    world.Guide.show(message.html, message.ytl);
                    world.Event.remove('yearPassed', 'message-' + message.year);
                }
            });
        })(messages[i]);
    }

    /** UI setup */
    $('#world-start-btn').click(function() {
        $('#world-intro').addClass('hide');
        $('#world-pause-btn').prop('disabled', false).click();
    });
    $('#world-pause-btn').click(function() {
        if (world.running) {
            world.stop();
            $(this).html('Play');
        } else {
            world.start();
            $(this).html('Pause');
        }
    });
    (function() {
        var $wrapper = $('#world-intro'),
            items = $wrapper.data('items').split(','),
            $next = $wrapper.find($wrapper.data('next')),
            $prev = $wrapper.find($wrapper.data('prev')),
            currentIndex = 0,
            change = function(num) {
                var index = currentIndex + num;
                if (index >= 0 && index < items.length) {
                    $wrapper.find(items[currentIndex]).addClass('hide');
                    $wrapper.find(items[index]).removeClass('hide');
                    currentIndex = index;
                }
                (index === 0) ? $prev.addClass('disabled') : $prev.removeClass('disabled');
                (index === items.length - 1) ? $next.addClass('disabled') : $next.removeClass('disabled');
            };
            $next.click(function() {
                change(1);
                return false;
            });
            $prev.click(function() {
                change(-1);
                return false;
            });
    })();
    $('#world-display-btns button').click(function() {
        var $this = $(this),
            displayMode = $this.data('display');

        $this.addClass('active').siblings('.active').removeClass('active');
        world.displayMode = displayMode;
    });
    $('#world-speed-btns button').click(function() {
        var $this = $(this),
            speed = $this.data('speed');

        $this.addClass('active').siblings('.active').removeClass('active');
        switch (speed) {
            case 2:
            case 5:
                world.tickPerYear = 60 / speed;
                world.speed = speed;
                break;
            default:
                world.tickPerYear = 60;
                world.speed = 1;
                break;
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

    // Initialize the world
    world.init('world');
    world.padding = 50;

    /**
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

    // Start the world
    // world.start();
})(window);