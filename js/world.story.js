/*!
 * world.story.js (require jQuery)
 * Initialize a world and define the 'History Simulation' story.
 *
 * World JS
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

        Event = world.Event,
        Knowledge = world.Knowledge = new WorldJS.Knowledge(world),
        Rules = world.Rules = new WorldJS.Rules(world),
        Statistic = world.Statistic = new WorldJS.Statistic(world),
        Guide = world.Guide = new WorldJS.Guide(world);

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

        // Show message that includes the knowledge's message
        // and list of new appeared knowledge
        var messageArray = [
            '<div><b>✓ ' + knowledge.name + '</b></div>',
            '<div>' + knowledge.message + '</div>',
        ];
        if (knowledge.following.length > 0) {
            messageArray.push('<hr>');
            messageArray.push('<div class="knowledge-trending">');
            for (var i = 0; i < knowledge.following.length; i++) {
                var newKnowledge = Knowledge.list[knowledge.following[i]];
                messageArray.push([
                    '<div class="knowledge-clone">',
                        '<div><b>' + newKnowledge.name + '</b></div>',
                        '<div class="knowledge-priority">',
                            '&bull; Priority: ',
                            Interface.knowledgePriorityHTML(newKnowledge, true),
                        '</div>',
                    '</div>'
                ].join(''));
            }
            messageArray.push('</div>');
        }
        Guide.show(messageArray.join(''), 15);

        switch (knowledge.id) {
            case 'noma':
                $('#world-foodResourceRecovery').parent().removeClass('text-muted');
                break;
        }
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

        if (year <= 30) {
            if (year == 20) {
                // Based on the story
                world.addSeeds(10, {
                    minAge: 20,
                    maxAge: 30,
                    fromBorder: 'random',
                    types: [world.Male, world.Female]
                });
            }
        } else {
            var worldStatistic = world.Statistic,
                worldRules = world.Rules;

            // Keep the population stable if there is enough food
            if (worldStatistic.population < 30 && worldStatistic.food > worldRules.Famine.unit) {
                world.addSeeds(10, {
                    minAge: 20,
                    maxAge: 30,
                    fromBorder: 'random',
                    types: [world.Male, world.Female]
                });
            }

            if (year > 300) {
                world.Event.remove('yearPassed', 'populationControl');
            }
        }
    });

    // Unlock population limit
    Event.add('yearPassed', 'populationLimitUnlock', function() {
        var world = this,
            worldKnowledge = world.Knowledge;

        if (worldKnowledge.completed.length < 1) {
            return;
        }

        var listKnowledge = [
                {
                    id: 'goss',
                    population: 50,
                    message: 'Without gossip, it is very hard to cooperate effectively with other people.'
                },
                {
                    id: 'spir',
                    population: 150,
                    message: 'The stability of larger band is broken easily, people can not intimately know too many individuals.'
                }
            ];
        for (var i = 0; i < listKnowledge.length; i++) {
            var knowledgeId = listKnowledge[i].id,
                newKnowledge = worldKnowledge.list[knowledgeId];

            // Add new knowledge when the population reached its limit
            if (world.Statistic.population >= listKnowledge[i].population
                    && !newKnowledge.added) {
                newKnowledge.added = true;
                worldKnowledge.trending.push(knowledgeId);
                Interface.trendingAdded(newKnowledge);

                world.Guide.show([
                    '<div class="knowledge-trending">',
                        '<div class="knowledge-clone">',
                            '<div><b>' + newKnowledge.name + '</b></div>',
                            '<div class="knowledge-priority">',
                                '&bull; Priority: ',
                                Interface.knowledgePriorityHTML(newKnowledge, true),
                            '</div>',
                        '</div>',
                    '</div>',
                    '<div>' + listKnowledge[i].message + '</div>'
                ].join(''), 15);

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
            worldKnowledge = world.Knowledge,
            worldRules = world.Rules,
            worldStatistic = world.Statistic;

        worldKnowledge.gain();

        // Add coming soon message
        if (worldKnowledge.completed.length == 8) {
            if (worldKnowledge.trending.length == 0) {
                worldKnowledge.trending.push('coso');
                Interface.trendingAdded(worldKnowledge.list['coso']);
            }
        }

        if (worldStatistic.year == 750) {
            world.Guide.show([
                '<div>Humans simply destroy everything that stands on their paths.</div>',
                '<div>They drive to the extinction of most large species long before the invention of writing.</div>'
            ].join(''), 500);
        }

        if (worldStatistic.population == 0) {
            $('#world-pause-btn').prop('disabled', 'disabled');
            world.stop();

            world.Guide.show([
                '<div>When the decline in the availability of wild foods becomes critical, humans could do better than</div>',
                '<div>what you\'ve just seen. They would gain new knowledge to live in equilibrium or to produce food.</div>'
            ].join(''), 1000);
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
        $('.opacity').animate({ opacity: 1 }, 'fast');
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
    $('#world-intro').on('slid.bs.carousel', function () {
        var $carousel = $(this),
            $content = $carousel.find('.content'),
            $prev = $carousel.find('.prev'),
            $next = $carousel.find('.next');

        if ($content.find('.item:first').hasClass('active')) {
            $prev.addClass('disabled');
        } else {
            $prev.removeClass('disabled');
        }

        if ($content.find('.item:last').hasClass('active')) {
            $next.addClass('disabled');
            $('.opacity').animate({ opacity: 1 }, 'fast');
        } else {
            $next.removeClass('disabled');
        }
    });
    $(document).on('change', '.priority-radio', function() {
        var $this = $(this),
            knowledgeId = $this.attr('name'),
            priority = $this.val(),

            // Default priority:
            // value = normal, rawValue = 1, progressBarClass = info
            priorityValue = 1,
            progressBarClass = 'progress-bar progress-bar-info';

        switch (priority) {
            case 'high':
                priorityValue = 2;
                progressBarClass = 'progress-bar';
                break;
            case 'low':
                priorityValue = 0.1;
                progressBarClass = 'progress-bar progress-bar-danger';
                break;
        }

        // Change progress bar class base on knowledge priority
        $this
            .closest('.knowledge')
            .find('.progress-bar')
            .attr('class', progressBarClass);
        // Sync to clone control
        $('.priority-radio-clone.' + knowledgeId + '-' + priority)
            .prop('checked', true);

        // Change knowledge priority
        world.Knowledge.list[knowledgeId].IQ.priority = priorityValue;
    });
    $(document).on('change', '.priority-radio-clone', function() {
        var $this = $(this),
            knowledgeId = $this.attr('name').split('-').shift(),
            priority = $this.val();

        // Trigger action of the original control
        $('.priority-radio.' + knowledgeId + '-' + priority)
            .click();
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
    world.addSeed(world.Male, {
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
    world.addSeed(world.Female, {
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
})(window);