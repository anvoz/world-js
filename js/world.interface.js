/*!
 * world.interface.js (require jQuery & TW Bootstrap UI)
 * Bind a world and its properties to UI.
 * Define some basic UI interactions.
 *
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013-2014 An Vo - anvo4888@gmail.com
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 */

(function(window, undefined) {
    'use strict';

    var $ = window.$,
        WorldJS = window.WorldJS,
        Interface = WorldJS.Interface = {},
        cache = {
            statistic: {
                year: 0,
                population: 0,
                men: 0, women: 0, boys: 0, girls: 0,
                families: 0,
                food: 0, foodResource: 0,
                iq: 0, maxIQ: 0, yearMaxIQ: 0,
                maxAge: 0, yearMaxAge: 0,
                avgIQ: 0, avgAge: 0, avgChildren: 0
            },
            rules: {
                adultFoodChange: 0, childFoodChange: 0,
                foodResourceRecovery: 100,
                foodSpoilage: 0,
                deathChance: 0
            },
            knowledge: {
                knowledgeTrending: 0, knowledgeHistory: 0
            },
            misc: {
                labelPopulationLimit: false,
                labelNotEnoughResource: false,
                labelFamine: false
            }
        };

    // Init: Store container of all properties of a world
    // Extra methods must be added to Cache object after this init
    for (var key in cache) {
        if (cache.hasOwnProperty(key)) {
            var cacheData = cache[key];
            for (var propName in cacheData) {
                if (cacheData.hasOwnProperty(propName)) {
                    var defaultValue = cacheData[propName];
                    cacheData[propName] = {
                        container: $('#world-' + propName),
                        value: defaultValue
                    };

                    // Some properties are displayed in 2 different places of the UI
                    if ($.inArray(propName, [
                            'men', 'women', 'families', 'boys', 'girls'
                        ]) != -1
                    ) {
                        cacheData[propName + '-ex'] = {
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
     * Only set if the value changes
     */
    cache.set = function(element, value) {
        if (value != element.value) {
            element.value = value;
            element.container.html(value);
        }
    };

    /**
     * Show or hide an element
     */
    cache.toggleLabel = function(element, state) {
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
    Interface.knowledgePriorityHTML = function(knowledge, isClone) {
        isClone = isClone || false;
        var priorityList = [
                { name: 'low', value: 0.1 },
                { name: 'normal', value: 1 },
                { name: 'high', value: 2 }
            ],
            htmlArray = ['<span class="no-wrap">'];
        for (var i = 0; i < priorityList.length; i++) {
            var priority = priorityList[i],
                checked = (knowledge.iq.priority === priority.value) ?
                    'checked ' : '',
                radioClass = ( ! isClone) ?
                    'priority-radio' :
                    'priority-radio-clone',
                valueClass = knowledge.id + '-' + priority.name,
                name = ( ! isClone) ?
                    knowledge.id :
                    knowledge.id + '-clone';

            htmlArray.push([
                '<label class="radio-inline">',
                    '<input type="radio" ' + checked,
                        'class="' + radioClass + ' ' + valueClass + '" ',
                        'value="' + priority.name + '" ',
                        'name="' + name + '">',
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
        switch (knowledge.iq.priority) {
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
        var cacheKnowledge = cache.knowledge,
            $trendingContainer = cacheKnowledge.knowledgeTrending.container,
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
                        '<div class="knowledge-iq">',
                            '&bull; Require: ',
                            '<span class="no-wrap">',
                                '<span class="knowledge-progress-iq">0</span> / ',
                                knowledge.iq.required + ' IQ',
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
        cacheKnowledge[knowledge.id] = {
            // Main container
            container: $container,
            // Required IQ container
            IQContainer: $container.find('.knowledge-progress-iq'),
            // Progress bar container
            barContainer: $container.siblings('.knowledge-progress').find('.progress-bar')
        };
    };

    /**
     * Callback when a knowledge removed from trending
     */
    Interface.trendingRemoved = function(knowledge) {
        // Remove completed knowledge from knowledge trending container
        var cached = cache,
            cacheKnowledge = cached.knowledge[knowledge.id];
        cacheKnowledge.IQContainer.html(knowledge.iq.required);
        cacheKnowledge.barContainer.width('100%');
        cacheKnowledge.container.closest('.knowledge').remove();

        // Remove knowledge container cache
        delete cached.knowledge[knowledge.id];

        // Add completed knowledge to knowledge history container
        var html = [
                '<div class="knowledge">',
                    '<div class="knowledge-name">',
                        (cached.statistic.year.value + 1) + ': ' + knowledge.name,
                    '</div>',
                    '<div class="knowledge-detail">',
                        '<div class="knowledge-description">',
                            Interface.knowledgeDescriptionHTML(knowledge),
                        '</div>',
                    '</div>',
                '</div>'
            ].join('');
        cached.knowledge.knowledgeHistory.container.prepend(html);
    };

    /**
     * Update information (statistic, rules, knowledge) every year
     */
    Interface.yearPassed = function() {
        var world = this,
            cached = cache,

            worldStatistic = world.statistic,
            cacheStatistic = cached.statistic;
        for (var propName in cacheStatistic) {
            if (cacheStatistic.hasOwnProperty(propName)) {
                switch (propName) {
                    case 'avgIQ':
                        var avgIQ = (worldStatistic.population === 0) ?
                            0 : Math.round(worldStatistic.iq / worldStatistic.population);
                        cached.set(cacheStatistic.avgIQ, avgIQ);
                        break;
                    case 'avgAge':
                        var avgAge = (worldStatistic.die === 0) ?
                            0 : Math.round(worldStatistic.sumAge / worldStatistic.die);
                        cached.set(cacheStatistic.avgAge, avgAge);
                        break;
                    default:
                        cached.set(cacheStatistic[propName], worldStatistic[propName]);
                        if ($.inArray(propName, [
                                'men', 'women', 'families', 'boys', 'girls'
                            ]) != -1
                        ) {
                            cached.set(cacheStatistic[propName + '-ex'], worldStatistic[propName]);
                        }
                        break;
                }
            }
        }

        var worldRules = world.rules,
            cacheRules = cached.rules;
        cached.set(cacheRules.deathChance, (worldRules.chance.death * 100).toFixed());
        cached.set(cacheRules.adultFoodChange, worldRules.food.adult);
        cached.set(cacheRules.childFoodChange, worldRules.food.child);
        cached.set(cacheRules.foodSpoilage, (worldRules.foodSpoilage.foodDecr * 100).toFixed());
        cached.set(cacheRules.foodResourceRecovery, (100 + worldRules.food.resourceIncr * 100).toFixed());

        var worldKnowledge = world.knowledge;
        for (var i = 0, len = worldKnowledge.trending.length; i < len; i++) {
            var knowledge = worldKnowledge.list[worldKnowledge.trending[i]],
                cacheKnowledge = cached.knowledge[knowledge.id];

            cacheKnowledge.IQContainer.html(knowledge.iq.gained);
            cacheKnowledge.barContainer.width(Math.round(knowledge.iq.gained / knowledge.iq.required * 100) + '%');
        }

        var cacheMisc = cached.misc;
        cached.toggleLabel(cacheMisc.labelPopulationLimit, (worldStatistic.population >= worldRules.population.limit));
        cached.toggleLabel(cacheMisc.labelNotEnoughResource, (worldStatistic.foodResource < 75));
        cached.toggleLabel(cacheMisc.labelFamine, (worldStatistic.food <= worldRules.famine.unit));
    };

    // Statistic container toggle
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
    // World history introduction carousel
    var Language = WorldJS.Language;
    $('#world-intro .item').each(function(index) {
        var $this = $(this);
        switch (index) {
            case 0:
                $this.find('blockquote').html(
                    Language.introPhysicsQuote +
                    '<small>' + Language.introPhysicsAuthor + '</small>'
                );
                $this.find('p:first').html(Language.introPhysics01.replace(
                    'Big Bang',
                    '<span class="label label-danger">Big Bang</span>'
                ));
                $this.find('p:last').html(Language.introPhysics02.replace(
                    'Physics',
                    '<span class="label label-info">Physics</span>'
                ));
                break;
            case 1:
                $this.find('blockquote').html(
                    Language.introChemistryQuote +
                    '<small>' + Language.introChemistryAuthor + '</small>'
                );
                $this.find('p:first').html(Language.introChemistry01);
                $this.find('p:last').html(Language.introChemistry02.replace(
                    'Chemistry',
                    '<span class="label label-info">Chemistry</span>'
                ));
                break;
            case 2:
                $this.find('blockquote').html(
                    Language.introBiologyQuote +
                    '<small>' + Language.introBiologyAuthor + '</small>'
                );
                $this.find('p:first').html(Language.introBiology01);
                $this.find('p:last').html(Language.introBiology02.replace(
                    'Biology',
                    '<span class="label label-info">Biology</span>'
                ));
                break;
            case 3:
                $this.find('blockquote').html(
                    Language.introHistoryQuote +
                    '<small>' + Language.introHistoryAuthor + '</small>'
                );
                $this.find('p:first').html(Language.introHistory01.replace(
                    'Homo sapiens',
                    '<span class="label label-danger">Homo sapiens</span>'
                ));
                $this.find('p:last').html(Language.introHistory02.replace(
                    'History',
                    '<span class="label label-info">History</span>'
                ));
                break;
            case 4:
                $this.find('p:first').html(Language.introGame01.replace(
                    'World JS',
                    '<span class="label label-danger">World JS</span>'
                ));
                $this.find('p:first').next().html(Language.introGame02.replace(
                    'the cognitive revolution',
                    '<span class="label label-info">the cognitive revolution</span>'
                ));
                $this.find('p:last').html(Language.introGame03.replace(
                    'anvo4888@gmail.com',
                    '<a href="mailto: anvo4888@gmail.com">anvo4888@gmail.com</a>'
                ));
                break;
        }
    });
    $('#world-intro').removeClass('hide').on('slid.bs.carousel', function () {
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
})(window);