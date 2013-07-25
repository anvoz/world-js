/*!
 * world.knowledge.data.js
 * Knowledge data of the world
 *
 * World JS: Evolution Simulator
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013 An Vo - anvo4888@gmail.com
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

WorldJS.KnowledgeData = {
    huga: {
        id: 'huga',
        name: 'Hunting and Gathering',
        description: 'Living from edible plants and animals from the wild<ul><li>Adult +1 food / year</li></ul>',
        IQ: { priority: 1, gained: 0, required: 500 },
        following: ['crop', 'cabr'],
        affectedYear: false,
        onAffected: function(world) {
            world.Rules.Food.adult += 1;
        }
    },
    crop: {
        id: 'crop',
        name: 'Plant crops',
        description: 'Start agriculture by planting a few crops<ul><li>Adult +1 food / year</li></ul>',
        IQ: { priority: 1, gained: 0, required: 2000 },
        following: ['agri'],
        affectedYear: false,
        onAffected: function(world) {
            world.Rules.Food.adult += 1;
        }
    },
    cabr: {
        id: 'cabr',
        name: 'Cattle-breeding',
        description: 'Domesticating animals to reduce the need of hunting wild animals for food<ul><li>Adult +1 food / year</li><li>Death rate -10%</li></ul>',
        IQ: { priority: 1, gained: 0, required: 3000 },
        following: [],
        affectedYear: false,
        onAffected: function(world) {
            world.Rules.Food.adult += 1;
            world.Rules.ChanceIncr.death -= 0.1;
        }
    },
    agri: {
        id: 'agri',
        name: 'Agriculture',
        description: 'Developing techniques to produce a large amount of food<ul><li>Adult +2 food / year</li><li>Food spoilage -20%</li></ul>',
        IQ: { priority: 1, gained: 0, required: 5000 },
        following: [],
        affectedYear: false,
        onAffected: function(world) {
            world.Rules.Food.adult += 2;
            world.Rules.FoodSpoilage.foodDecr -= 0.2;
        }
    },
    fire: {
        id: 'fire',
        name: 'Control of fire',
        description: 'Using fire for warmth and cooking<ul><li>Death rate -10%</li></ul>',
        IQ: { priority: 1, gained: 0, required: 1000 },
        following: ['writ'],
        affectedYear: false,
        onAffected: function(world) {
            world.Rules.ChanceIncr.death -= 0.1;
        }
    },
    writ: {
        id: 'writ',
        name: 'Writing',
        description: 'Inventing symbols that stood for things<ul><li>Base IQ +1</li><li>Child -1 food per year</li></ul>',
        IQ: { priority: 1, gained: 0, required: 20000 },
        following: ['coso'],
        affectedYear: false,
        onAffected: function(world) {
            world.Rules.baseIQ += 1;
            world.Rules.Food.child -= 1;
        }
    },
    coso: {
        id: 'coso',
        name: 'Coming soon...',
        description: '<br /><span class="label label-important">tl;dr</span> In the next update you will have the ability to expand the population beyond 7 billion and manage their knowledge to choose the fate of the world.<hr />'
            + 'Without any knowledge to be gained, the world will meet its apocalypse. Thus evolutions are needed in order for the world to progress and maintain its stability.<br /><br />'
            + 'This is the idea behind <b>World JS: Evolution Simulator</b>. '
            + 'Hope you could understand its idea so far and contribute for its growth.<br /><br />'
            + 'There are 10 types of people who can contribute to this open source project:<br />'
            + '<ul>'
                + '<li>For those who understand binary: <a target="_blank" href="https://github.com/anvoz/world-js">Fork me on Github</a>.</li>'
                + '<li>For those who don\'t: Make your own knowledge list. See example in <a href="#" onclick="$(\'#knowledge a[rel=history]\').click(); return false;">knowledge history</a>.</li>'
            + '</ul>'
            + 'For any feedback or ideas, email me at <a href="mailto: anvo4888@gmail.com">anvo4888@gmail.com</a>',
        IQ: { priority: 1, gained: 0, required: 2147483647 },
        following: [],
        affectedYear: false,
        onAffected: function(world) { }
    }
};