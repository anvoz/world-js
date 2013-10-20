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
        Knowledge = world.Knowledge,

        Guide = {
            queue: [],
            show: function(message, duration) {
                var self = this;

                if (typeof message !== 'undefined') {
                    self.queue.push({ message: message, duration: duration });
                    if (self.queue.length == 1) {
                        self.show();
                    }
                } else {
                    if (self.queue.length > 0) {
                        var $guide = $('#world-container .guide'),
                            item = self.queue[0];

                        $guide.html(item.message.join('')).animate({ bottom: 0 }, 400);

                        setTimeout(function() {
                            $guide.animate({ bottom: -60 }, 400, 'swing', function() {
                                self.queue.shift();
                                self.show();
                            });
                        }, item.duration);
                    }
                }
            }
        };

    // Define knowledge of the world
    Knowledge.list = WorldJS.KnowledgeData;

    // Start with some knowledge
    Knowledge.trending = ['huga'];
    Interface.trendingAdded(Knowledge.list.huga);

    // Bind callback
    Knowledge.trendingAdded = Interface.trendingAdded;
    Knowledge.trendingRemoved = function(knowledge) {
        Interface.trendingRemoved(knowledge);

        Guide.show([
            '<div><b>Knowledge Completed</b></div>',
            '<div>', knowledge.name, '</div>'
        ], 10000 / world.speed);
    };
    world.Event.add('yearPassed', 'updateUI', Interface.yearPassed);

    world.Event.add('yearPassed', 'tellStory', function() {
        var world = this,
            Knowledge = world.Knowledge,
            Statistic = world.Statistic,
            Rules = world.Rules,
            year = Statistic.year;

        Statistic.foodResource = Math.min(Statistic.foodResource, Rules.Food.resourceMax);

        if (year <= 25) {
            switch (year) {
                case 10:
                    // Show guide in year 10
                    Guide.show([
                        '<div>About 250,000 years ago, our ancestors began their lives in East Africa.</div>',
                        '<div>They had extraordinary large brains and the ability of walking upright.</div>'
                    ], 15000 / world.speed);
                    break;
                case 25:
                    // Show guide and add more people in year 30
                    Guide.show([
                        '<div>In trade-off they were less muscular and born prematurely.</div>',
                        '<div>Thus they evolved stronger social ties and started living in small bands.</div>'
                    ], 15000 / world.speed);
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

                Guide.show([
                    '<div><b>Knowledge Unlocked</b></div>',
                    '<div>', Knowledge.list[knowledgeId].name, '</div>'
                ], 5000 / world.speed);
                break;
            }
        }

        if (Knowledge.completed.length == 8) {
            if (Knowledge.trending.length == 0) {
                Knowledge.trending.push('coso');
                Interface.trendingAdded(Knowledge.list['coso']);

                $('<button class="btn btn-default btn-xs">Unlock</button>').css({
                    fontSize: '75%',
                    lineHeight: 1,
                    padding: '0.2em 0.6em',
                    margin: '1px 5px 0 0'
                }).click(function() {
                    var msg = 'This is a free play mode, not based on the story of the game.\nDo you want to unlock the population limit?';
                    if (window.confirm(msg)) {
                        $(this).remove();
                        Rules.Population.limit = 500000;
                        Rules.Food.resourceMax = 99999999;
                    }
                }).insertBefore($('#world-labelPopulationLimit'));
            }
            if (Statistic.population == 0) {
                $('#world-pause-btn').prop('disabled', 'disabled');
                world.stop();
            }
        }
    });

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