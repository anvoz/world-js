/*!
 * world.knowledge.data.js
 * Knowledge data of the world
 *
 * World JS: Evolution Simulator
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
                '<ul><li>Adult +1 food / year</li><li>Food resource +50,000</li></ul>'
            ].join(''),
            IQ: { priority: 1, gained: 0, required: 100 },
            following: ['fire', 'hula'],
            affectedYear: 0,
            onAffected: function(world) {
                world.Rules.Food.adult += 1;
                world.Statistic.foodResource += 50000;
                if (world.Statistic.food < 0) {
                    world.Statistic.foodResource += world.Statistic.food;
                    world.Statistic.food = 0;
                }
            }
        },
        fire: {
            id: 'fire',
            name: 'Controlling of fire',
            description: [
                'Provide protection from predators and insects.',
                '<ul><li>Death rate -20%</li></ul>',
                'Expand human activity into the dark and colder hours of the night.',
                '<ul><li>Base IQ +1</li></ul>',
                'Be able to burn down forests for food that could also start changing the environment.',
                '<ul><li>Food resource -1% / year</li></ul>'
            ].join(''),
            IQ: { priority: 1, gained: 0, required: 3000 },
            following: ['cook', 'noma'],
            affectedYear: 0,
            onAffected: function(world) {
                world.Rules.ChanceIncr.death -= 0.2;
                world.Rules.baseIQ += 1;
                world.Rules.Food.resourceIncr -= 0.01;
            }
        },
        hula: {
            id: 'hula',
            name: 'Hunting large animals',
            description: [
                'Take more risks in hunting larger animals for more food.',
                '<ul><li>Death rate +10%</li><li>Adult +2 food / year</li><li>Food resource +200,000</li></ul>',
                'The extinction of large animals, which is very likely to happen because of their long pregnancy, ',
                'could completely change the ecological system.',
                '<ul><li>Food resource -1% / year</li></ul>'
            ].join(''),
            IQ: { priority: 0.1, gained: 0, required: 20000 },
            following: [],
            affectedYear: 0,
            onAffected: function(world) {
                world.Rules.ChanceIncr.death += 0.1;
                world.Rules.Food.adult += 2;
                world.Statistic.foodResource += 200000;
                world.Rules.Food.resourceIncr -= 0.01;
                if (world.Statistic.food < 0) {
                    world.Statistic.foodResource += world.Statistic.food;
                    world.Statistic.food = 0;
                }
            }
        },
        noma: {
            id: 'noma',
            name: 'Living a nomadic lifestyle',
            description: [
                'Follow the annual migration of animals and the growth cycles of plants to obtain food.',
                '<ul><li>Food resource +2% / year</li></ul>',
                'Prevent infectious diseases to take hold and spread.',
                '<ul><li>Death rate -10%</li></ul>'
            ].join(''),
            IQ: { priority: 1, gained: 0, required: 50000 },
            following: ['osea'],
            affectedYear: 0,
            onAffected: function(world) {
                world.Rules.Food.resourceIncr += 0.02;
                world.Rules.ChanceIncr.death -= 0.1;
            }
        },
        cook: {
            id: 'cook',
            name: 'Cooking',
            description: [
                'Start eating many new things that could not be digested earlier, such as wheat, rice and potatoes.',
                '<ul><li>Adult +1 food / year</li><li>Food resource +100,000</li></ul>',
                'Improve nutrition by cooked proteins.',
                '<ul><li>Base IQ +1</li></ul>',
                'Kill germs and parasites that infest food.',
                '<ul><li>Death rate -20%</li><li>Food spoilage -10%</li></ul>'
            ].join(''),
            IQ: { priority: 1, gained: 0, required: 5000 },
            following: [],
            affectedYear: 0,
            onAffected: function(world) {
                world.Rules.Food.adult += 1;
                world.Statistic.foodResource += 100000;
                world.Rules.baseIQ += 1;
                world.Rules.ChanceIncr.death -= 0.2;
                world.Rules.FoodSpoilage.foodDecr -= 0.1;
                if (world.Statistic.food < 0) {
                    world.Statistic.foodResource += world.Statistic.food;
                    world.Statistic.food = 0;
                }
            }
        },
        goss: {
            id: 'goss',
            name: 'Gossiping',
            description: [
                'Exchange information about what other people are doing and thinking ',
                'to help them understand each other and could start living in larger bands.',
                '<ul><li>Population limit: 150</li><li>Base IQ +1</li><li>Child -1 food / year</li></ul>'
            ].join(''),
            IQ: { priority: 1, gained: 0, required: 10000 },
            following: [],
            affectedYear: 0,
            onAffected: function(world) {
                world.Rules.Population.limit = 150;
                world.padding = 10;
                world.Rules.baseIQ += 1;
                world.Rules.Food.child -= 1;
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
                world.Rules.Population.limit = 500;
                world.Rules.baseIQ += 1;
                world.Rules.Food.child -= 1;
                world.Rules.ChanceIncr.death += 0.1;
            }
        },
        osea: {
            id: 'osea',
            name: 'Crossing the open sea',
            description: [
                'Develop sailing crafts and boats to cross large stretches of open sea and start living ',
                'in new remote islands or Continent.',
                '<ul><li>Food resource +500,000</li></ul>',
                'Humans were able to adapt almost over a night to a completely new ecosystem ',
                'based on what knowledge they have gained.',
                '<ul><li>Death rate +0%</li></ul>'
            ].join(''),
            IQ: { priority: 0.1, gained: 0, required: 200000 },
            following: [],
            affectedYear: 0,
            onAffected: function(world) {
                world.Statistic.foodResource += 500000;
                if (world.Statistic.food < 0) {
                    world.Statistic.foodResource += world.Statistic.food;
                    world.Statistic.food = 0;
                }
            }
        },
        coso: {
            id: 'coso',
            name: 'Coming soon...',
            description: [
                '<p>You have been watching the ancient world from the first appearance of our ancestors ',
                'to <b>the cognitive revolution</b>. ',
                'During this time, humans gained some remarkable knowledge not only to spread all over the world ',
                'but also to adapt to completely new ecological conditions within a very short time.</p>',
                '<p>For any feedback or ideas, email me at <a href="mailto: anvo4888@gmail.com">anvo4888@gmail.com</a></p>'
            ].join(''),
            IQ: { priority: 0.1, gained: 0, required: 1000000000 },
            following: [],
            affectedYear: 0,
            onAffected: function() { }
        }
    };
})(window);