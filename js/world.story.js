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
    world.yearPassedCallback = function() {
        var world = this,
            Knowledge = world.Knowledge,
            Statistic = world.Statistic,
            Rules = world.Rules,
            year = Statistic.year;

        // Update UI
        Interface.yearPassed.call(world);

        if (year <= 30) {
            switch (year) {
                case 10:
                    // Show guide in year 10
                    var guide = [
                        '<div>About 250,000 years ago, our ancestors began their lives in East Africa.</div>',
                        '<div>They had extraordinary large brains and the ability of walking upright.</div>'
                    ].join('');
                    $('#world-container .guide').html(guide);
                    setTimeout(function() {
                        $('#world-container .guide').empty();
                    }, 15000);
                    break;
                case 30:
                    // Show guide and add more people in year 30
                    var guide = [
                        '<div>In trade-off they were less muscular and born prematurely.</div>',
                        '<div>Thus they evolved stronger social ties and started living in small bands.</div>'
                    ].join('');
                    $('#world-container .guide').html(guide);
                    setTimeout(function() {
                        $('#world-container .guide').empty();
                    }, 30000);
                    world.addRandomPeople(25, 20, 30, 5);
                    break;
            }
        } else {
            // Prevent the population < 30 people if there is enough food
            if (Statistic.population < 30 && Statistic.food > Rules.Famine.unit) {
                world.addRandomPeople(10, 20, 30, 5);
            }
        }

        // Add new knowledge when the population reached its limit
        var populationKnowledge = [
            { key: 'goss', value: 50 },
            { key: 'spir', value: 150 },
        ];
        for (var i = 0, len = populationKnowledge.length; i < len; i++) {
            var knowledgeId = populationKnowledge[i].key;
            if (Statistic.population >= populationKnowledge[i].value && !Knowledge.list[knowledgeId].added) {
                Knowledge.trending.push(knowledgeId);
                Interface.trendingAdded(Knowledge.list[knowledgeId]);
                Knowledge.list[knowledgeId].added = true;
                break;
            }
        }

        if (Knowledge.completed.length == 8) {
            if (Knowledge.trending.length == 0) {
                Knowledge.trending.push('coso');
                Interface.trendingAdded(Knowledge.list['coso']);

                Rules.Population.limit = 50000;
            }
            if (Statistic.population == 0) {
                $('#world-freeze-btn').prop('disabled', 'disabled');
                world.stop();

                var guide = [
                    '<div class="lead">Thank you for playing until the very end of this game</div>',
                    '<div>Humans have never really managed to live in harmony with nature. ',
                    'Food resources in the wild have their limit. ',
                    'In order to survive, our ancestors need to be able to self-produce food ',
                    'by planting crops and domesticating wild animals.</div>',
                    '<div class="top-padding">It was how <b>the agricultural revolution</b> began and will be simulated</div>',
                    '<div>in the next part of <b>World JS: Evolution Simulator</b>.</div>'
                ].join('');
                $('#world-container .guide').html(guide).css({ bottom: 90 });
            }
        }
    };

    // Bind UI
    $('#world-pause-btn').click(function() {
        if (world.running) {
            world.stop();
            $(this).html('Play');
        } else {
            world.start();
            $(this).html('Pause');
        }
    });
    $('#world-display-mode-btns button').click(function() {
        var $this = $(this),
            displayMode = $this.data('mode');

        $this.addClass('active').siblings('.active').removeClass('active');
        world.displayMode = displayMode;
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