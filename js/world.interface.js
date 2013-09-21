/*!
 * world.interface.js (require jQuery)
 * Bind a world and its properties to UI.
 * Define UI interactions.
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
        Interface = WorldJS.Interface = {},
        Cache = {
            Statistic: {
                year: 0, population: 0, food: 0, foodResource: 0,
                men: 0, women: 0, families: 0, boys: 0, girls: 0,
                IQ: 0, maxIQ: 0, yearMaxIQ: 0,
                maxAge: 0, yearMaxAge: 0,
                avgIQ: 0, avgAge: 0, avgChildren: 0
            },
            Rules: {
                adultFoodChange: 0, childFoodChange: 0, resourceIncr: 0, foodSpoilage: 0,
                deathChance: 0
            },
            Knowledge: {
                knowledgeTrending: 0, knowledgeHistory: 0
            },
            Misc: {
                labelPopulationLimit: false,
                labelNotEnoughResource: false,
                labelFamine: false
            }
        };

    // Init: Store container of all properties of a world
    // Extra methods must be added to Cache object after this init
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
                    if ($.inArray(propName, ['men', 'women', 'families', 'boys', 'girls']) != -1) {
                        cache[propName + '-ex'] = {
                            container: $('#world-' + propName + '-ex'),
                            value: defaultValue
                        };
                    }
                }
            }
        }
    }

    /**
     * Set new value to a cached container element
     * Only set if the value change
     */
    Cache.set = function(element, value) {
        if (value != element.value) {
            element.value = value;
            element.container.html(value);
        }
    };

    /**
     * Show or hide an element
     */
    Cache.toggleLabel = function(element, state) {
        if (state != element.value) {
            element.value = state;
            if (state) {
                element.container.removeClass('hide');
            } else {
                element.container.addClass('hide');
            }
        }
    }

    /**
     * Callback when a knowledge added to trending
     */
    Interface.trendingAdded = function(knowledge) {
        // Get css class for display based on default priority of a knowledge
        var progressBarClass;
        switch (knowledge.IQ.priority) {
            case 0.1:
                progressBarClass = 'progress-bar progress-bar-danger';
                break;
            case 2:
                progressBarClass = 'progress-bar';
                break;
            default:
                progressBarClass = 'progress-bar progress-bar-info';
                break;
        }

        // Add new knowledge to knowledge trending (learning) container
        var id = 'world-knowledge-' + knowledge.id,
            html = [
                '<div id="world-knowledge-', knowledge.id, '" class="knowledge">',
                    '<div class="name">', knowledge.name, '</div>',
                    '<div class="description">', knowledge.description, '</div>',
                    '<div class="progress">',
                        '<div class="', progressBarClass, '"></div>',
                        '<div class="IQ"><span>&nbsp;<span class="progress-IQ">0</span> / ', knowledge.IQ.required, ' IQ&nbsp;</span></div>',
                    '</div>',
                    '<div>',
                        '<select class="priority form-control input-sm" data-id="', knowledge.id, '">',
                            '<option value="low" ', ((knowledge.IQ.priority == 0.1) ? 'selected' : ''), '>Low priority</option>',
                            '<option value="normal" ', ((knowledge.IQ.priority == 1) ? 'selected' : ''), '>Normal priority</option>',
                            '<option value="high" ', ((knowledge.IQ.priority == 2) ? 'selected' : ''), '>High priority</option>',
                        '</select>',
                    '</div>',
                '</div>'
            ].join(''),
            knowledgeCache = Cache.Knowledge;
        knowledgeCache.knowledgeTrending.container.append(html);

        // Cache knowledge container
        var container = $('#' + id);
        knowledgeCache[knowledge.id] = {
            container: container,                           // Main container
            IQContainer: container.find('.progress-IQ'),    // Required IQ container
            barContainer: container.find('.progress-bar')   // Progress bar container
        };
    };

    /**
     * Callback when a knowledge removed from trending
     */
    Interface.trendingRemoved = function(knowledge) {
        // Remove completed knowledge from knowledge trending container
        var knowledgeCache = Cache.Knowledge[knowledge.id];
        knowledgeCache.IQContainer.html(knowledge.IQ.required);
        knowledgeCache.barContainer.width('100%');
        knowledgeCache.container.remove();

        // Remove knowledge container cache
        delete Cache.Knowledge[knowledge.id];

        // Add completed knowledge to knowledge history container
        var html = [
                '<div class="knowledge">',
                    '<div class="name">', Cache.Statistic.year.value, ': ', knowledge.name, '</div>',
                    '<div class="description">', knowledge.description, '</div>',
                '</div>'
            ].join('');
        Cache.Knowledge.knowledgeHistory.container.prepend(html);
    };

    /**
     * Update information (Statistic, Rules, Knowledge) every year
     */
    Interface.yearPassed = function() {
        var world = this,
            Statistic = world.Statistic,
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
                        if ($.inArray(propName, ['men', 'women', 'families', 'boys', 'girls']) != -1) {
                            Cache.set(statisticCache[propName + '-ex'], Statistic[propName]);
                        }
                        break;
                }
            }
        }

        var Rules = world.Rules,
            rulesCache = Cache.Rules;
        Cache.set(rulesCache.deathChance, (Rules.Chance.death * 100).toFixed());
        Cache.set(rulesCache.adultFoodChange, Rules.Food.adult);
        Cache.set(rulesCache.childFoodChange, Rules.Food.child);
        Cache.set(rulesCache.foodSpoilage, (Rules.FoodSpoilage.foodDecr * 100).toFixed());
        Cache.set(rulesCache.resourceIncr, (Rules.Food.resourceIncr * 100).toFixed());

        var Knowledge = world.Knowledge;
        for (var i = 0, len = Knowledge.trending.length; i < len; i++) {
            var knowledge = Knowledge.list[Knowledge.trending[i]],
                knowledgeCache = Cache.Knowledge[knowledge.id];

            knowledgeCache.IQContainer.html(knowledge.IQ.gained);
            knowledgeCache.barContainer.width(Math.round(knowledge.IQ.gained / knowledge.IQ.required * 100) + '%');
        }

        var miscCache = Cache.Misc;
        Cache.toggleLabel(miscCache.labelPopulationLimit, (Statistic.population >= Rules.Population.limit));
        Cache.toggleLabel(miscCache.labelNotEnoughResource, (Statistic.foodResource < 75 || Knowledge.completed.length == 8));
        Cache.toggleLabel(miscCache.labelFamine, (Statistic.food <= Rules.Famine.unit));
    };

    // Basic UI: switch between tabs
    $('.js-tab').each(function() {
        $(this).click(function() {
            $(this).parent().addClass('active').siblings('li').removeClass('active');
            $(this).parents('.js-tabs').find('.js-tab-content').addClass('hide');
            $($(this).data('target')).removeClass('hide');
            return false;
        });
    });

    // Basic UI: toggle navbar in small screen
    $('.js-navbar-toggle').each(function() {
        $(this).click(function() {
            var $target = $($(this).data('target'));
            if ($target.hasClass('in')) {
                $target.removeClass('in');
            } else {
                $target.addClass('in');
            }
        });
    });

    // Basic UI: toggle statistic container
    $('.js-statistic-toggle').each(function() {
        $(this).click(function() {
            var $target = $('#world-statistic-container');
            if ($target.is(':visible')) {
                $target.addClass('visible-lg');
            } else {
                $target.removeClass('visible-lg');
            }
        });
    });
})(window);