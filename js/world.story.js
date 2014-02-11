/*!
 * world.story.js (require jQuery)
 * Initialize a world and define the `History Simulation` story.
 *
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013-2014 An Vo - anvo4888@gmail.com
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 */

(function(window, undefined) {
    'use strict';

    var document = window.document,
        $ = window.$,

        WorldJS = window.WorldJS,
        Interface = WorldJS.Interface,
        Language = WorldJS.Language,

        // Create a new world
        world = new WorldJS(),

        // World's components
        worldEvent = world.event,
        worldStatistic = world.statistic = new WorldJS.Statistic(world),
        worldRules = world.rules = new WorldJS.Rules(world),
        worldKnowledge = world.knowledge = new WorldJS.Knowledge(world),
        worldGuide = world.guide = new WorldJS.Guide(world);

    // Define all functions that are needed to be used to setup the world
    var worldStory = world.story = {
        knowledge: {
            addList: function(list) {
                worldKnowledge.list = list;
            },
            addTrending: function(knowledge) {
                worldKnowledge.trending = [knowledge.id];
                Interface.trendingAdded(knowledge);
            }
        },
        ui: {
            bindKnowledge: function() {
                worldKnowledge.trendingAdded = Interface.trendingAdded;
                worldKnowledge.trendingRemoved = function(knowledge) {
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
                            var newKnowledge = worldKnowledge.list[knowledge.following[i]];
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
                    worldGuide.show(messageArray.join(''), 15);

                    switch (knowledge.id) {
                        case 'noma':
                            $('#world-foodResourceRecovery').parent().removeClass('text-muted');
                            break;
                    }
                };
            },
            bindKnowledgePriorityRadio: function() {
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
                    world.knowledge.list[knowledgeId].iq.priority = priorityValue;
                });
                $(document).on('change', '.priority-radio-clone', function() {
                    var $this = $(this),
                        knowledgeId = $this.attr('name').split('-').shift(),
                        priority = $this.val();

                    // Trigger action of the original control
                    $('.priority-radio.' + knowledgeId + '-' + priority)
                        .click();
                });
            },
            bindStartButton: function() {
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
            },
            bindDisplayButton: function() {
                $('#world-display-btns button').click(function() {
                    var $this = $(this),
                        displayMode = $this.data('display');

                    $this.addClass('active').siblings('.active').removeClass('active');
                    world.displayMode = displayMode;
                });
            },
            bindSpeedButton: function() {
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
            }
        },
        event: {
            populationControl: function() {
                worldEvent.add('yearPassed', 'populationControl', function() {
                    var world = this,
                        year = world.statistic.year;

                    if (year <= 30) {
                        if (year == 20) {
                            // Based on the story
                            world.addSeeds(30, {
                                minAge: 10,
                                maxAge: 30,
                                fromBorder: 'random',
                                types: [world.Male, world.Female]
                            });
                        }
                    } else {
                        var worldStatistic = world.statistic,
                            worldRules = world.rules;

                        // Keep the population stable if there is enough food
                        worldRules.chance.childbirth = 0;
                        if (worldStatistic.population < 150 &&
                            worldStatistic.food > worldRules.famine.unit
                        ) {
                            var delta = Math.min(150, worldRules.population.limit) -
                                worldStatistic.population;
                            if (delta > 0) {
                                worldRules.chance.childbirth = Math.ceil(delta / 10);
                            }
                        }

                        if (year > 1000) {
                            world.event.remove('yearPassed', 'populationControl');
                        }
                    }
                });
            },
            populationLimitUnlock: function() {
                worldEvent.add('yearPassed', 'populationLimitUnlock', function() {
                    var world = this,
                        worldKnowledge = world.knowledge;

                    if (worldKnowledge.completed.length < 1) {
                        return;
                    }

                    var listKnowledge = [
                            {
                                id: 'goss',
                                population: 50,
                                message: Language.knowledgeGOSSUnlock
                            },
                            {
                                id: 'spir',
                                population: 150,
                                message: Language.knowledgeSPIRUnlock
                            }
                        ];
                    for (var i = 0; i < listKnowledge.length; i++) {
                        var knowledgeId = listKnowledge[i].id,
                            newKnowledge = worldKnowledge.list[knowledgeId];

                        // Add new knowledge when the population reached its limit
                        if (world.statistic.population >= listKnowledge[i].population
                                && !newKnowledge.added) {
                            newKnowledge.added = true;
                            worldKnowledge.trending.push(knowledgeId);
                            Interface.trendingAdded(newKnowledge);

                            world.guide.show([
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
                                world.event.remove('yearPassed', 'populationLimitUnlock');
                            }

                            break;
                        }
                    }
                });
            },
            yearPassed: function() {
                worldEvent.add('yearPassed', 'default', function() {
                    var world = this,
                        worldKnowledge = world.knowledge,
                        worldStatistic = world.statistic;

                    // Add coming soon message
                    if (worldKnowledge.completed.length == 8) {
                        if (worldKnowledge.trending.length == 0) {
                            worldKnowledge.trending.push('coso');
                            Interface.trendingAdded(worldKnowledge.list['coso']);
                        }
                    }

                    if (worldStatistic.year == 500) {
                        world.guide.show(Language.storyEnd01, 250);
                    }

                    if (worldStatistic.population == 0) {
                        $('#world-pause-btn').prop('disabled', 'disabled');
                        world.stop();

                        world.guide.show(Language.storyEnd02, 1000);
                    }
                });
            }
        },
        guide: {
            setup: function() {
                worldGuide.setContainer($('#world-container .guide'));

                var messages = [
                    {year: 5, ytl: 15, html: Language.storyBegin01},
                    {year: 20, ytl: 15, html: Language.storyBegin02}
                ];
                for (var i = 0; i < messages.length; i++) {
                    (function(message) {
                        worldEvent.add('yearPassed', 'message-' + message.year, function() {
                            var world = this;

                            if (world.statistic.year == message.year) {
                                world.guide.show(message.html, message.ytl);
                                world.event.remove('yearPassed', 'message-' + message.year);
                            }
                        });
                    })(messages[i]);
                }
            }
        },
        world: {
            addFirstMen: function() {
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
            },
            addItems: function() {
                world.items = {
                    meat: {
                        enabled: false,
                        who: 'man',
                        when: 'moving',
                        icon: {
                            x: 37, y: 0,
                            dx: 5, dy: 8,
                            width: 11, height: 10
                        }
                    },
                    fruit: {
                        enabled: false,
                        who: 'woman',
                        when: 'moving',
                        icon: {
                            x: 37, y: 10,
                            dx: 5, dy: 8,
                            width: 11, height: 10
                        }
                    },
                    fire: {
                        enabled: false,
                        who: 'man',
                        when: 'standing',
                        icon: {
                            x: 48, y: 0,
                            dx: 12, dy: 12,
                            width: 11, height: 10
                        }
                    },
                    pot: {
                        enabled: false,
                        who: 'wife',
                        when: 'standing',
                        icon: {
                            x: 48, y: 10,
                            dx: -2, dy: 12,
                            width: 11, height: 10
                        }
                    }
                };
            }
        }
    };

    /** Event setup */
    // Display all properties of the world and its components to the UI,
    // refresh every year
    worldEvent.add('yearPassed', 'updateUI', Interface.yearPassed);
    // Control world population in the early stage of the game,
    // add more people if needed
    worldStory.event.populationControl();
    // Increase the population limit
    // if the condition is met
    worldStory.event.populationLimitUnlock();
    // Other functions that will be executed every year
    worldStory.event.yearPassed();

    /** Rules setup */
    worldRules.population.limit = 50;

    /** Knowledge setup */
    // Load all knowledge list
    worldStory.knowledge.addList(WorldJS.KnowledgeData);
    // Start with 1 knowledge (hunting and gathering)
    worldStory.knowledge.addTrending(worldKnowledge.list.huga);
    // UI binding
    worldStory.ui.bindKnowledge();
    worldStory.ui.bindKnowledgePriorityRadio();

    /** Guide setup */
    worldStory.guide.setup();

    /** World setup */
    // UI binding
    worldStory.ui.bindStartButton();
    worldStory.ui.bindDisplayButton();
    worldStory.ui.bindSpeedButton();
    // Initialize the world
    world.init('world');
    world.padding = 50;
    /*
     * Create the first man and woman of the world.
     * They will move from the corner to the center of the world.
     * They are guaranteed to mate and produce offspring
     * then die at the intended age.
     */
    worldStory.world.addFirstMen();
    worldStory.world.addItems();
})(window);