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
            description: [
                'Live a hand-to-mouth existence by collecting food from the wild.',
                '<ul><li>Adult +1 food / year</li><li>Food resource +10,000</li></ul>'
            ].join(''),
            IQ: { priority: 1, gained: 0, required: 500 },
            following: ['fire', 'hula'],
            affectedYear: 0,
            onAffected: function(world) {
                var worldStatistic = world.Statistic;

                world.Rules.Food.adult += 1;
                worldStatistic.foodResource += 10000;
                if (worldStatistic.food < 0) {
                    worldStatistic.foodResource += worldStatistic.food;
                    worldStatistic.food = 0;
                }
            }
        },
        fire: {
            id: 'fire',
            name: 'Controlling of fire',
            description: [
                'Provide protection from predators and insects.',
                '<ul><li>Death rate -10%</li></ul>',
                'Expand human activity into the dark and colder hours of the night.',
                '<ul><li>Base IQ +1</li></ul>',
                'Be able to burn down forests for food that can also start changing the environment.',
                '<ul><li>Food resource recovery -5% / century</li></ul>'
            ].join(''),
            IQ: { priority: 1, gained: 0, required: 3000 },
            following: ['cook', 'noma'],
            affectedYear: 0,
            onAffected: function(world) {
                var worldRules = world.Rules;

                worldRules.ChanceIncr.death -= 0.1;
                worldRules.baseIQ += 1;

                world.Event.add('yearPassed', 'burningForests', function() {
                    var world = this,
                        year = world.Statistic.year,
                        affectedYear = world.Knowledge.list['fire'].affectedYear;
                    if (year % 100 == affectedYear % 100 &&
                            year > affectedYear) {
                        world.Rules.Food.resourceIncr -= 0.05;
                    }
                });
            }
        },
        hula: {
            id: 'hula',
            name: 'Hunting large animals',
            description: [
                'Take more risks in hunting larger animals for more food.',
                '<ul><li>Death rate +10%</li><li>Adult +2 food / year</li><li>Food resource +5,000</li></ul>',
                'The extinction of large animals, which is very likely to happen because of their long pregnancy, ',
                'can completely change the ecological system.',
                '<ul><li>Food resource recovery -5% / century</li></ul>'
            ].join(''),
            IQ: { priority: 0.1, gained: 0, required: 20000 },
            following: [],
            affectedYear: 0,
            onAffected: function(world) {
                var worldRules = world.Rules,
                    worldStatistic = world.Statistic;

                worldRules.ChanceIncr.death += 0.1;
                worldRules.Food.adult += 2;
                worldStatistic.foodResource += 5000;
                if (worldStatistic.food < 0) {
                    worldStatistic.foodResource += worldStatistic.food;
                    worldStatistic.food = 0;
                }

                world.Event.add('yearPassed', 'largeAnimalsDisappearing', function() {
                    var world = this,
                        year = world.Statistic.year,
                        affectedYear = world.Knowledge.list['hula'].affectedYear;
                    if (year % 100 == affectedYear % 100 &&
                            year > affectedYear) {
                        world.Rules.Food.resourceIncr -= 0.05;
                    }
                });
            }
        },
        noma: {
            id: 'noma',
            name: 'Living a nomadic lifestyle',
            description: [
                'Follow the annual migration of animals and the growth cycles of plants to obtain food.',
                '<ul><li>Enable food resource recovery</li></ul>',
                'Prevent infectious diseases to take hold and spread.',
                '<ul><li>Death rate -10%</li></ul>'
            ].join(''),
            IQ: { priority: 1, gained: 0, required: 50000 },
            following: ['osea'],
            affectedYear: 0,
            onAffected: function(world) {
                world.Event.add('yearPassed', 'foodResourceRecovering', function() {
                    var world = this,
                        year = world.Statistic.year,
                        affectedYear = world.Knowledge.list['noma'].affectedYear;
                    if (year % 10 == affectedYear % 10 &&
                            year > affectedYear) {
                        var worldRules = world.Rules,
                            foodResource = 10 *
                                worldRules.Population.limit *
                                worldRules.Food.adult;
                        foodResource = Math.max(0, foodResource + Math.ceil(foodResource * worldRules.Food.resourceIncr));
                        world.Statistic.foodResource = foodResource;
                    }
                });

                world.Rules.ChanceIncr.death -= 0.1;
            }
        },
        cook: {
            id: 'cook',
            name: 'Cooking',
            description: [
                'Start eating many new things that could not be digested earlier, such as wheat, rice and potatoes.',
                '<ul><li>Adult +1 food / year</li><li>Food resource +20,000</li></ul>',
                'Improve nutrition by cooked proteins.',
                '<ul><li>Base IQ +1</li></ul>',
                'Kill germs and parasites that infest food.',
                '<ul><li>Death rate -10%</li><li>Food spoilage -10%</li></ul>'
            ].join(''),
            IQ: { priority: 1, gained: 0, required: 5000 },
            following: [],
            affectedYear: 0,
            onAffected: function(world) {
                var worldRules = world.Rules,
                    worldStatistic = world.Statistic;

                worldRules.Food.adult += 1;
                worldStatistic.foodResource += 20000;
                if (worldStatistic.food < 0) {
                    worldStatistic.foodResource += worldStatistic.food;
                    worldStatistic.food = 0;
                }
                worldRules.baseIQ += 1;
                worldRules.ChanceIncr.death -= 0.1;
                worldRules.FoodSpoilage.foodDecr -= 0.1;
            }
        },
        goss: {
            id: 'goss',
            name: 'Gossiping',
            description: [
                'Exchange information about what other people are doing and thinking ',
                'to help them understand each other and start living in larger bands.',
                '<ul><li>Population limit: 150</li><li>Base IQ +1</li><li>Child -1 food / year</li></ul>'
            ].join(''),
            IQ: { priority: 1, gained: 0, required: 10000 },
            following: [],
            affectedYear: 0,
            onAffected: function(world) {
                var worldRules = world.Rules;

                worldRules.Population.limit = 150;
                worldRules.baseIQ += 1;
                worldRules.Food.child -= 1;

                // More people come
                world.padding = 10;
                world.addRandomPeople(50, 20, 30, 5);
            }
        },
        spir: {
            id: 'spir',
            name: 'Speaking about guardian spirits of the tribe',
            description: [
                'Unlike ants that know how to cooperate with large numbers of individuals ',
                'based on their genetic code, humans don\'t really know how to create larger corporation ',
                'effectively without basing it on imaginary stories that exist only in their minds.',
                '<ul><li>Population limit 500</li><li>Base IQ +1</li><li>Child -1 food / year</li></ul>',
                'Suffer more from infectious diseases.',
                '<ul><li>Death rate +10%</li></ul>'
            ].join(''),
            IQ: { priority: 1, gained: 0, required: 50000 },
            following: [],
            affectedYear: 0,
            onAffected: function(world) {
                var worldRules = world.Rules;

                worldRules.Population.limit = 500;
                worldRules.baseIQ += 1;
                worldRules.Food.child -= 1;
                worldRules.ChanceIncr.death += 0.1;
            }
        },
        osea: {
            id: 'osea',
            name: 'Crossing the open sea',
            description: [
                'Develop sailing crafts and boats to cross large stretches of open sea and start living ',
                'in new remote islands or Continent.',
                '<ul><li>Food resource +10,000</li><li>Food resource recovery +20%</li></ul>',
                'Humans are able to adapt almost over a night to a completely new ecosystem ',
                'based on all knowledge they have gained.',
                '<ul><li>Death rate +0%</li></ul>'
            ].join(''),
            IQ: { priority: 0.1, gained: 0, required: 200000 },
            following: [],
            affectedYear: 0,
            onAffected: function(world) {
                var worldStatistic = world.Statistic;

                worldStatistic.foodResource += 10000;
                if (worldStatistic.food < 0) {
                    worldStatistic.foodResource += worldStatistic.food;
                    worldStatistic.food = 0;
                }
                world.Rules.Food.resourceIncr += 0.2;
            }
        },
        coso: {
            id: 'coso',
            name: 'Coming soon...',
            description: [
                '<p>You have been watching the ancient world from the first appearance of our ancestors ',
                'to <b>the cognitive revolution</b>.</p>',
                '<p>During this time, humans gain some remarkable knowledge not only to spread all over the world ',
                'but also to adapt to completely new ecological conditions within a very short time.</p>',
                '<p>The next part of the game which is simulated <b>the agricultural revolution</b> ',
                'will be released soon.</p>'
            ].join(''),
            IQ: { priority: 0.1, gained: 0, required: 1000000000 },
            following: [],
            affectedYear: 0,
            onAffected: function() { }
        }
    };
})(window);