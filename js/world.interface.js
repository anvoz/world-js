/*!
 * world.interface.js (require jQuery)
 * Bind a world and its properties to UI.
 * Define UI interactions.
 *
 * World JS
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
                adultFoodChange: 0, childFoodChange: 0, foodResourceRecovery: 100, foodSpoilage: 0,
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

                    // Some properties are displayed in 2 different places of the UI
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
    };

    /**
     * HTML for knowledge priority buttons group
     */
    Interface.knowledgePriorityHTML = function(knowledge) {
        var priorityList = [
                { name: 'low', value: 0.1 },
                { name: 'normal', value: 1 },
                { name: 'high', value: 2 }
            ],
            htmlArray = ['<span class="no-wrap">'];
        for (var i = 0; i < priorityList.length; i++) {
            var priority = priorityList[i],
                checked = (knowledge.IQ.priority === priority.value) ?
                    ' checked' : '';
            htmlArray.push([
                '<label class="radio-inline">',
                    '<input class="knowledge-priority-radio" type="radio" ',
                        'value="' + priority.name + '" name="' + knowledge.id + '"' + checked + '>',
                    priority.name,
                '</label>'
            ].join(''));
        }
        htmlArray.push('</span>');
        return htmlArray.join('');
    };

    /**
     * HTML for knowledge description
     */
    Interface.knowledgeDescriptionHTML = function(knowledge) {
        var description = knowledge.description,
            htmlArray = [];
        for (var i = 0; i < description.length; i++) {
            var line = description[i];
            htmlArray.push('<p>&bull; ' + line.text);
            if (line.code.length > 0) {
                htmlArray.push(' <code>' + line.code.join('</code> <code>') + '</code>');
            }
            htmlArray.push('</p>');
        }
        return htmlArray.join('');
    };

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
        var knowledgeCache = Cache.Knowledge,
            $trendingContainer = knowledgeCache.knowledgeTrending.container,
            collapsedToggle = ' collapsed',
            collapsedPanel = ' collapse';
        if ($trendingContainer.find('.knowledge-detail').filter('.in,.collapsing').length === 0) {
            collapsedToggle = '';
            collapsedPanel = ' in';
        }
        var id = 'world-knowledge-' + knowledge.id,
            html = [
                '<div class="knowledge panel">',
                    '<a class="knowledge-name' + collapsedToggle + '" href="#' + id + '" ',
                            'data-parent="#world-knowledgeTrending" data-toggle="collapse">',
                        knowledge.name,
                        '<span class="caret"></span>',
                    '</a>',
                    '<div class="knowledge-progress progress">',
                        '<div class="' + progressBarClass + '"></div>',
                    '</div>',
                    '<div class="knowledge-detail panel-collapse' + collapsedPanel + '" id="' + id + '">',
                        '<div class="knowledge-IQ">',
                            '&bull; Require: ',
                            '<span class="no-wrap">',
                                '<span class="knowledge-progress-IQ">0</span> / ',
                                knowledge.IQ.required + ' IQ',
                            '</span>',
                        '</div>',
                        '<div class="knowledge-priority">',
                            '&bull; Priority: ',
                            Interface.knowledgePriorityHTML(knowledge),
                        '</div>',
                        '<div class="knowledge-description">',
                            Interface.knowledgeDescriptionHTML(knowledge),
                        '</div>',
                    '</div>',
                '</div>',
            ].join('');
        $trendingContainer.append(html);

        // Cache knowledge container
        var $container = $('#' + id);
        knowledgeCache[knowledge.id] = {
            // Main container
            container: $container,
            // Required IQ container
            IQContainer: $container.find('.knowledge-progress-IQ'),
            // Progress bar container
            barContainer: $container.siblings('.knowledge-progress').find('.progress-bar')
        };
    };

    /**
     * Callback when a knowledge removed from trending
     */
    Interface.trendingRemoved = function(knowledge) {
        // Remove completed knowledge from knowledge trending container
        var Cached = Cache,
            knowledgeCache = Cached.Knowledge[knowledge.id];
        knowledgeCache.IQContainer.html(knowledge.IQ.required);
        knowledgeCache.barContainer.width('100%');
        knowledgeCache.container.closest('.knowledge').remove();

        // Remove knowledge container cache
        delete Cached.Knowledge[knowledge.id];

        // Add completed knowledge to knowledge history container
        var html = [
                '<div class="knowledge">',
                    '<div class="name">', (Cached.Statistic.year.value + 1), ': ', knowledge.name, '</div>',
                    '<div class="description">', knowledge.description, '</div>',
                '</div>'
            ].join('');
        Cached.Knowledge.knowledgeHistory.container.prepend(html);
    };

    /**
     * Update information (Statistic, Rules, Knowledge) every year
     */
    Interface.yearPassed = function() {
        var world = this,
            Cached = Cache,

            Statistic = world.Statistic,
            statisticCache = Cached.Statistic;
        for (var propName in statisticCache) {
            if (statisticCache.hasOwnProperty(propName)) {
                switch (propName) {
                    case 'avgIQ':
                        var avgIQ = (Statistic.population == 0) ?
                            0 : Math.round(Statistic.IQ / Statistic.population);
                        Cached.set(statisticCache.avgIQ, avgIQ);
                        break;
                    case 'avgAge':
                        var avgAge = (Statistic.die == 0) ?
                            0 : Math.round(Statistic.sumAge / Statistic.die);
                        Cached.set(statisticCache.avgAge, avgAge);
                        break;
                    case 'avgChildren':
                        var avgChildren = (Statistic.dieMarriedFemale == 0) ?
                            0 : Math.round(Statistic.sumChildren / Statistic.dieMarriedFemale);
                        Cached.set(statisticCache.avgChildren, avgChildren);
                        break;
                    default:
                        Cached.set(statisticCache[propName], Statistic[propName]);
                        if ($.inArray(propName, ['men', 'women', 'families', 'boys', 'girls']) != -1) {
                            Cached.set(statisticCache[propName + '-ex'], Statistic[propName]);
                        }
                        break;
                }
            }
        }

        var Rules = world.Rules,
            rulesCache = Cached.Rules;
        Cached.set(rulesCache.deathChance, (Rules.Chance.death * 100).toFixed());
        Cached.set(rulesCache.adultFoodChange, Rules.Food.adult);
        Cached.set(rulesCache.childFoodChange, Rules.Food.child);
        Cached.set(rulesCache.foodSpoilage, (Rules.FoodSpoilage.foodDecr * 100).toFixed());
        Cached.set(rulesCache.foodResourceRecovery, (100 + Rules.Food.resourceIncr * 100).toFixed());

        var Knowledge = world.Knowledge;
        for (var i = 0, len = Knowledge.trending.length; i < len; i++) {
            var knowledge = Knowledge.list[Knowledge.trending[i]],
                knowledgeCache = Cached.Knowledge[knowledge.id];

            knowledgeCache.IQContainer.html(knowledge.IQ.gained);
            knowledgeCache.barContainer.width(Math.round(knowledge.IQ.gained / knowledge.IQ.required * 100) + '%');
        }

        var miscCache = Cached.Misc;
        Cached.toggleLabel(miscCache.labelPopulationLimit, (Statistic.population >= Rules.Population.limit));
        Cached.toggleLabel(miscCache.labelNotEnoughResource, (Statistic.foodResource < 75));
        Cached.toggleLabel(miscCache.labelFamine, (Statistic.food <= Rules.Famine.unit));
    };

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