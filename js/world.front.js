/*!
 * world.front.js (require WorldJS and jQuery)
 * Create and bind the world to the user interface
 *
 * World JS: Evolution Simulator
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013 An Vo - anvo4888@gmail.com
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

(function(window, undefined) {
    'use strict';

    var $ = window.$,
        WorldJS = window.WorldJS,

        // Create a new world
        world = new WorldJS(),

        Cache = {
            Statistic: {
                year: 0, population: 0, food: 0,
                men: 0, women: 0, family: 0, boy: 0, girl: 0,
                IQ: 0, maxIQ: 0, yearMaxIQ: 0,
                maxAge: 0, yearMaxAge: 0,
                avgIQ: 0, avgAge: 0, avgChildren: 0
            },
            Rules: {
                adultFoodChange: 0, childFoodChange: 0, foodSpoilage: 0
            },
            Knowledge: {
                knowledgeTrending: 0, knowledgeHistory: 0
            },
            Misc: {
                labelFamine: false
            }
        };

    // Cache all property containers first
    for (var key in Cache) {
        if (Cache.hasOwnProperty(key)) {
            var cache = Cache[key];
            for (var propName in cache) {
                if (cache.hasOwnProperty(propName)) {
                    var defaultValue = cache[propName];
                    cache[propName] = {
                        container: $('#world-' + propName),
                        value: defaultValue
                    };
                }
            }
        }
    }

    // Add more functions after cache all containers
    Cache.set = function(element, value) {
        // Only set if the value change
        if (value != element.value) {
            element.value = value;
            element.container.html(value);
        }
    };

    // Switch between knowledge trending and history tab
    $('#knowledge .header a').each(function() {
        $(this).click(function() {
            var type = $(this).attr('rel');
            $(this).addClass('label').siblings('a').removeClass('label');
            if (type === 'trending') {
                Cache.Knowledge.knowledgeTrending.container.removeClass('hide');
                Cache.Knowledge.knowledgeHistory.container.addClass('hide');
            } else {
                Cache.Knowledge.knowledgeTrending.container.addClass('hide');
                Cache.Knowledge.knowledgeHistory.container.removeClass('hide');
            }
            return false;
        });
    });

    // Define knowledge of the world
    world.Knowledge.list = WorldJS.KnowledgeData;

    // Callback when a knowledge added to trending
    var trendingAdded = function(knowledge) {
        // Add knowledge HTML
        var id = 'world-knowledge-' + knowledge.id,
            html = [
                '<div id="world-knowledge-', knowledge.id, '" class="knowledge clearfix">',
                    '<div class="pull-right btn-group knowledgePriority">',
                        '<a class="btn btn-mini" href="#" title="forbid" onclick="return WorldJS.God.setKnowledgePriority(this, \'', knowledge.id, '\', 0.1);">&or;</a>',
                        '<a class="btn btn-mini active" href="#" title="free" onclick="return WorldJS.God.setKnowledgePriority(this, \'', knowledge.id, '\', 1);">&bull;</a>',
                        '<a class="btn btn-mini" href="#" title="encourage" onclick="return WorldJS.God.setKnowledgePriority(this, \'', knowledge.id, '\', 2);">&and;</a>',
                    '</div>',
                    '<div class="name">+ ', knowledge.name, '</div>',
                    '<div class="description">', knowledge.description, '</div>',
                    '<div class="progress progress-info"><div class="bar"></div></div>',
                    '<div class="IQ"><span class="world-IQ">0</span> / ', knowledge.IQ.required, ' IQ</div>',
                '</div>'
            ].join(''),
            knowledgeCache = Cache.Knowledge;
        knowledgeCache.knowledgeTrending.container.append(html);

        // Cache knowledge container
        var container = $('#' + id);
        knowledgeCache[knowledge.id] = {
            container: container,                       // Main container
            IQContainer: container.find('.world-IQ'),   // Required IQ container
            barContainer: container.find('.bar')        // Progress bar container
        };
    };

    // Start with some knowledge
    world.Knowledge.trending = ['huga', 'fire'];
    trendingAdded(world.Knowledge.list.huga);
    trendingAdded(world.Knowledge.list.fire);

    // Bind callback
    world.Knowledge.trendingAdded = trendingAdded;
    world.Knowledge.trendingRemoved = function(knowledge) {
        // Remove knowledge HTML
        var knowledgeCache = Cache.Knowledge[knowledge.id];
        knowledgeCache.IQContainer.html(knowledge.IQ.required);
        knowledgeCache.barContainer.width('100%');
        knowledgeCache.container.remove();

        // Remove knowledge container cache
        delete Cache.Knowledge[knowledge.id];

        // Add completed knowledge to knowledge history
        var html = [
                '<div class="knowledge">',
                    '<div class="name">', world.Statistic.year, ': ', knowledge.name, '</div>',
                    '<div class="description">', knowledge.description, '</div>',
                '</div>'
            ].join('');
        Cache.Knowledge.knowledgeHistory.container.prepend(html);
    };

    // Start the world with 100 random people
    // Update information (Statistic, Rules, Knowledge) every year
    world.init('world').addRandomPeople(100, 1, 20).setEachYearCallback(function() {
        var Statistic = this.Statistic,
            statisticCache = Cache.Statistic;
        for (var propName in statisticCache) {
            if (statisticCache.hasOwnProperty(propName)) {
                switch (propName) {
                    case 'avgIQ':
                        var avgIQ = (Statistic.population == 0) ?
                            0 : Math.round(Statistic.IQ / Statistic.population);
                        Cache.set(statisticCache.avgIQ, avgIQ);
                        break;
                    case 'avgAge':
                        var avgAge = (Statistic.die == 0) ?
                            0 : Math.round(Statistic.sumAge / Statistic.die);
                        Cache.set(statisticCache.avgAge, avgAge);
                        break;
                    case 'avgChildren':
                        var avgChildren = (Statistic.dieMarriedFemale == 0) ?
                            0 : Math.round(Statistic.sumChildren / Statistic.dieMarriedFemale);
                        Cache.set(statisticCache.avgChildren, avgChildren);
                        break;
                    default:
                        Cache.set(statisticCache[propName], Statistic[propName]);
                        break;
                }
            }
        }

        var Rules = this.Rules,
            rulesCache = Cache.Rules;
        Cache.set(rulesCache.adultFoodChange, Rules.Food.adult);
        Cache.set(rulesCache.childFoodChange, Rules.Food.child);
        Cache.set(rulesCache.foodSpoilage, Rules.FoodSpoilage.foodDecr * 100);

        var Knowledge = this.Knowledge;
        for (var i = 0, len = Knowledge.trending.length; i < len; i++) {
            var knowledge = Knowledge.list[Knowledge.trending[i]],
                knowledgeCache = Cache.Knowledge[knowledge.id];

            knowledgeCache.IQContainer.html(knowledge.IQ.gained);
            knowledgeCache.barContainer.width(Math.round(knowledge.IQ.gained / knowledge.IQ.required * 100) + '%');
        }

        var labelFamine = Cache.Misc.labelFamine,
            isFamine = (Statistic.food <= Rules.Famine.unit);
        if (isFamine != labelFamine.value) {
            labelFamine.value = isFamine;
            if (isFamine) {
                labelFamine.container.removeClass('hide');
            } else {
                labelFamine.container.addClass('hide');
            }
        }
    }).start();

    WorldJS.God.setWorldInstance(world);
})(window);