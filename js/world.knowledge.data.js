/*!
 * world.knowledge.data.js
 * Knowledge data of the world
 *
 * World JS
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013 An Vo - anvo4888@gmail.com
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

(function(window, undefined) {
    'use strict';

    var WorldJS = window.WorldJS;

    WorldJS.KnowledgeData = {
        huga: {
            id: 'huga',
            name: 'Hunting and gathering',
            message: [
                'They are foraging edible plants and animals from the wild.<br>',
                'This activity is occupying at least 90 percent of human history.'
            ].join(''),
            description: [
                {
                    text: 'Live a hand-to-mouth existence by collecting food from the wild.',
                    code: ['Adult +1 food / year', 'Food resource +10k']
                }
            ],
            iq: { priority: 1, gained: 0, required: 500 },
            following: ['fire', 'hula'],
            affectedYear: 0,
            onAffected: function(world) {
                var worldStatistic = world.statistic;

                world.rules.food.adult += 1;
                worldStatistic.foodResource += 10000;
                if (worldStatistic.food < 0) {
                    worldStatistic.foodResource += worldStatistic.food;
                    worldStatistic.food = 0;
                }

                world.items.meat.enabled = true;
                world.items.fruit.enabled = true;
            }
        },
        fire: {
            id: 'fire',
            name: 'Controlling of fire',
            message: [
                '<div>Controlling of fire is an important step in the evolution of our ancestors.</div>',
                '<div>They gain new source of light, warmth and power to start changing their behaviors.</div>'
            ].join(''),
            description: [
                {
                    text: 'Provide protection from predators and insects.',
                    code: ['Death rate -10%']
                },
                {
                    text: 'Expand human activity into the dark and colder hours of the night.',
                    code: ['Base IQ +1']
                },
                {
                    text: 'Be able to burn down forests for food that can also start changing the environment.',
                    code: ['Food resource recovery -5% / century']
                }
            ],
            iq: { priority: 0.1, gained: 0, required: 3000 },
            following: ['cook', 'noma'],
            affectedYear: 0,
            onAffected: function(world) {
                var worldRules = world.rules;

                worldRules.chanceIncr.death -= 0.1;
                worldRules.baseIQ += 1;

                world.event.add('yearPassed', 'burningForests', function() {
                    var world = this,
                        year = world.statistic.year,
                        affectedYear = world.knowledge.list['fire'].affectedYear;
                    if (year % 100 == affectedYear % 100 &&
                            year > affectedYear) {
                        world.rules.food.resourceIncr -= 0.1;
                    }
                });

                world.items.fire.enabled = true;
            }
        },
        hula: {
            id: 'hula',
            name: 'Hunting large animals',
            message: [
                '<div>Lions and sharks evolved to fill the position of top predator over millions of years.</div>',
                '<div>But humans ascend to this position almost immediately so they are not well adapted to it.</div>'
            ].join(''),
            description: [
                {
                    text: 'Take more risks in hunting larger animals for more food.',
                    code: ['Death rate +10%', 'Adult +2 food / year', 'Food resource +5k']
                },
                {
                    text: [
                        'The extinction of large animals, which is very likely to happen because of their long pregnancy, ',
                        'can completely change the ecological system.'
                    ].join(''),
                    code: ['Food resource recovery -5% / century']
                }
            ],
            iq: { priority: 0.1, gained: 0, required: 20000 },
            following: [],
            affectedYear: 0,
            onAffected: function(world) {
                var worldRules = world.rules,
                    worldStatistic = world.statistic;

                worldRules.chanceIncr.death += 0.1;
                worldRules.food.adult += 2;
                worldStatistic.foodResource += 5000;
                if (worldStatistic.food < 0) {
                    worldStatistic.foodResource += worldStatistic.food;
                    worldStatistic.food = 0;
                }

                world.event.add('yearPassed', 'largeAnimalsDisappearing', function() {
                    var world = this,
                        year = world.statistic.year,
                        affectedYear = world.knowledge.list['hula'].affectedYear;
                    if (year % 100 == affectedYear % 100 &&
                            year > affectedYear) {
                        world.rules.food.resourceIncr -= 0.1;
                    }
                });
            }
        },
        noma: {
            id: 'noma',
            name: 'Living a nomadic lifestyle',
            message: [
                '<div>They are roaming around in a large area to reach new food resources.</div>',
                '<div>Nomadic hunting and gathering is the oldest human subsistence method.</div>'
            ].join(''),
            description: [
                {
                    text: 'Follow the annual migration of animals and the growth cycles of plants to obtain food.',
                    code: ['Enable food resource recovery']
                },
                {
                    text: 'Prevent infectious diseases to take hold and spread.',
                    code: ['Death rate -10%']
                }
            ],
            iq: { priority: 0.1, gained: 0, required: 50000 },
            following: ['osea'],
            affectedYear: 0,
            onAffected: function(world) {
                world.event.add('yearPassed', 'foodResourceRecovering', function() {
                    var world = this,
                        year = world.statistic.year,
                        affectedYear = world.knowledge.list['noma'].affectedYear;
                    if (year % 10 == affectedYear % 10 &&
                            year > affectedYear) {
                        var worldRules = world.rules,
                            foodResource = 10 *
                                worldRules.population.limit *
                                worldRules.food.adult;
                        foodResource = Math.max(0, foodResource + Math.ceil(foodResource * worldRules.food.resourceIncr));
                        world.statistic.foodResource = foodResource;
                    }
                });

                world.rules.chanceIncr.death -= 0.1;
            }
        },
        cook: {
            id: 'cook',
            name: 'Cooking',
            message: [
                '<div>After the domestication of fire, our ancestors start cooking food.</div>',
                '<div>Cooking provides better diet to support their hunter-gatherer lifestyle.</div>'
            ].join(''),
            description: [
                {
                    text: 'Start eating many new things that could not be digested earlier, such as wheat, rice and potatoes.',
                    code: ['Adult +1 food / year', 'Food resource +20k']
                },
                {
                    text: 'Improve nutrition by cooked proteins.',
                    code: ['Base IQ +1']
                },
                {
                    text: 'Kill germs and parasites that infest food.',
                    code: ['Death rate -10%', 'Food spoilage -10%']
                }
            ],
            iq: { priority: 0.1, gained: 0, required: 5000 },
            following: [],
            affectedYear: 0,
            onAffected: function(world) {
                var worldRules = world.rules,
                    worldStatistic = world.statistic;

                worldRules.food.adult += 1;
                worldStatistic.foodResource += 20000;
                if (worldStatistic.food < 0) {
                    worldStatistic.foodResource += worldStatistic.food;
                    worldStatistic.food = 0;
                }
                worldRules.baseIQ += 1;
                worldRules.chanceIncr.death -= 0.1;
                worldRules.foodSpoilage.foodDecr -= 0.1;

                world.items.pot.enabled = true;
            }
        },
        goss: {
            id: 'goss',
            name: 'Gossiping',
            message: [
                '<div>The ability to gossip helps humans to form larger and more stable bands.</div>',
                '<div>They are now gaining information without spending all day watching other people around.</div>'
            ].join(''),
            description: [
                {
                    text: [
                        'Exchange information about what other people are doing and thinking ',
                        'to help them understand each other and start living in larger bands.'
                    ].join(''),
                    code: ['Population limit 150', 'Base IQ +1', 'Child -1 food / year']
                }
            ],
            iq: { priority: 0.1, gained: 0, required: 10000 },
            following: [],
            affectedYear: 0,
            onAffected: function(world) {
                var worldRules = world.rules;

                worldRules.population.limit = 150;
                worldRules.baseIQ += 1;
                worldRules.food.child -= 1;

                // Bigger world
                world.padding = 10;
            }
        },
        spir: {
            id: 'spir',
            name: 'Speaking about gods',
            message: [
                '<div>The secret that enables humans to go beyond the threshold of 150 individuals is fictive language.</div>',
                '<div>By believing in common gods, larger numbers of strangers can cooperate successfully.</div>'
            ].join(''),
            description: [
                {
                    text: [
                        'Unlike ants that know how to cooperate with large numbers of individuals ',
                        'based on their genetic code, humans don\'t really know how to create larger corporation ',
                        'effectively without basing it on imaginary stories that exist only in their minds.'
                    ].join(''),
                    code: ['Population limit 500', 'Base IQ +1', 'Child -1 food / year']
                },
                {
                    text: 'Suffer more from infectious diseases.',
                    code: ['Death rate +10%']
                }
            ],
            iq: { priority: 0.1, gained: 0, required: 50000 },
            following: [],
            affectedYear: 0,
            onAffected: function(world) {
                var worldRules = world.rules;

                worldRules.population.limit = 500;
                worldRules.baseIQ += 1;
                worldRules.food.child -= 1;
                worldRules.chanceIncr.death += 0.1;
            }
        },
        osea: {
            id: 'osea',
            name: 'Crossing the open sea',
            message: [
                '<div>Without any significant genetic evolution, humans can live in almost everywhere.</div>',
                '<div>They soon make the biggest ecological disasters that ever befall the animal kingdom.</div>'
            ].join(''),
            description: [
                {
                    text: [
                        'Develop sailing crafts and boats to cross large stretches of open sea and start living ',
                        'in new remote islands or Continent.'
                    ].join(''),
                    code: ['Food resource +10k', 'Food resource recovery +20%']
                },
                {
                    text: [
                        'Humans are able to adapt almost over a night to a completely new ecosystem ',
                        'based on all knowledge they have gained.'
                    ].join(''),
                    code: ['Death rate +0%']
                }
            ],
            iq: { priority: 0.1, gained: 0, required: 200000 },
            following: [],
            affectedYear: 0,
            onAffected: function(world) {
                var worldStatistic = world.statistic;

                worldStatistic.foodResource += 10000;
                if (worldStatistic.food < 0) {
                    worldStatistic.foodResource += worldStatistic.food;
                    worldStatistic.food = 0;
                }
                world.rules.food.resourceIncr += 0.2;
            }
        },
        coso: {
            id: 'coso',
            name: 'Coming soon...',
            description: [
                {
                    text: [
                        'You have been watching the ancient world from the first appearance of our ancestors ',
                        'to <b>the cognitive revolution</b>.'
                    ].join(''),
                    code: []
                },
                {
                    text: [
                        'During this time, humans gain some remarkable knowledge not only to spread all over the world ',
                        'but also to adapt to completely new ecological conditions within a very short time.'
                    ].join(''),
                    code: []
                },
                {
                    text: [
                        'The next part of the game which is simulated <b>the agricultural revolution</b> ',
                        'will be released soon.'
                    ].join(''),
                    code: []
                }
            ],
            iq: { priority: 0.1, gained: 0, required: 1000000000 },
            following: [],
            affectedYear: 0,
            onAffected: function() { }
        }
    };
})(window);