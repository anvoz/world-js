/*!
 * world.story.js
 * Initialize a world and define its main plot.
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

        // Show message that includes the knowledge's message
        // and list of new appeared knowledge
        var messageArray = [knowledge.message];
        if (knowledge.following.length > 0) {
            messageArray.push('<hr>');
            messageArray.push('<div><b>New trending knowledge appeared:</b></div>');
            for (var i = 0; i < knowledge.following.length; i++) {
                messageArray.push([
                    '<div>',
                        Knowledge.list[knowledge.following[i]].name,
                    '</div>'
                ].join(''));
            }
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
                world.addRandomPeople(10, 20, 30, 5);
            }
        } else {
            var worldStatistic = world.Statistic,
                worldRules = world.Rules;

            // Keep the population stable if there is enough food
            if (worldStatistic.population < 30 && worldStatistic.food > worldRules.Famine.unit) {
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
            var knowledgeId = listKnowledge[i].id;

            // Add new knowledge when the population reached its limit
            if (world.Statistic.population >= listKnowledge[i].population
                    && !worldKnowledge.list[knowledgeId].added) {
                worldKnowledge.list[knowledgeId].added = true;
                worldKnowledge.trending.push(knowledgeId);
                Interface.trendingAdded(worldKnowledge.list[knowledgeId]);

                world.Guide.show([
                    '<div>', listKnowledge[i].message, '</div>',
                    '<hr>',
                    '<div><b>New trending knowledge appeared:</b></div>',
                    '<div>', worldKnowledge.list[knowledgeId].name, '</div>'
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
            worldStatistic = world.Statistic;

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
    $(document).on('click', '.world-knowledge-priority', function() {
        var $this = $(this),

            // Default priority:
            // value = normal, rawValue = 1, progressBarClass = info
            priorityValue = 1,
            progressBarClass = 'progress-bar progress-bar-info';

        switch ($this.data('value')) {
            case 'high':
                priorityValue = 2;
                progressBarClass = 'progress-bar';
                break;
            case 'low':
                priorityValue = 0.1;
                progressBarClass = 'progress-bar progress-bar-danger';
                break;
        }

        $this.addClass('active')
            .siblings('.active').removeClass('active');
        $this.parents('.knowledge')
            .find('.progress-bar').attr('class', progressBarClass);

        world.Knowledge.list[$this.parent().data('id')].IQ.priority = priorityValue;
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
})(window);