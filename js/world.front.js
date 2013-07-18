/*!
 * World JS: Evolution Simulator
 * https://github.com/anvoz/world-js
 *
 * World JS Front View 1.0
 * Require: World JS Core Library 1.0, World JS Knowledge List 1.0 and jQuery
 *
 * Copyright (c) 2013 An Vo - anvo4888@gmail.com
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

(function(window, $, undefined) {
    'use strict';

    var WorldJS = window.WorldJS,
        WorldJSKnowledge = window.WorldJSKnowledge,
        // Create a new world
        world = new WorldJS();

    // Cache all property containers
    var Cache = {
            Statistic: {
                props: [ 'year', 'population', 'food',
                         'men', 'women', 'family', 'boy', 'girl',
                         'IQ', 'maxIQ', 'yearMaxIQ',
                         'maxAge', 'yearMaxAge',
                         'avgIQ', 'avgAge', 'avgChildren'
                    ],
                elements: {}
            },
            Rules: {
                props: ['adultFoodChange', 'childFoodChange', 'foodSpoilage'],
                elements: {}
            },
            Knowledge: {
                props: ['knowledgeTrending', 'knowledgeHistory'],
                elements: {}
            }
        };
    for (var key in Cache) {
        if (Cache.hasOwnProperty(key)) {
            var cache = Cache[key],
                props = cache.props;

            for (var i = 0, len = props.length; i < len; i++) {
                var propName = props[i];
                cache.elements[propName] = {
                    container: $('#world-' + propName),
                    value: 0
                };
            }
        }
    }

    Cache.Elements = {};
    Cache.Elements.labelFamine = {
        container: $('#world-labelFamine'),
        value: false
    };

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
                Cache.Knowledge.elements.knowledgeTrending.container.removeClass('hide');
                Cache.Knowledge.elements.knowledgeHistory.container.addClass('hide');
            } else {
                Cache.Knowledge.elements.knowledgeTrending.container.addClass('hide');
                Cache.Knowledge.elements.knowledgeHistory.container.removeClass('hide');
            }
            return false;
        });
    });

    // Define knowledge of the world
    world.Knowledge.list = WorldJSKnowledge;

    var trendingAdded = function(knowledge) {
        // Add knowledge HTML
        var id = 'world-knowledge-' + knowledge.id,
            html = [
                '<div id="world-knowledge-', knowledge.id, '" class="knowledge clearfix">',
                    '<div class="pull-right btn-group knowledgePriority">',
                        '<a class="btn btn-mini" href="#" title="forbid" onclick="return WorldJSGod.setKnowledgePriority(this, \'', knowledge.id, '\', 0.1);">&or;</a>',
                        '<a class="btn btn-mini active" href="#" title="free" onclick="return WorldJSGod.setKnowledgePriority(this, \'', knowledge.id, '\', 1);">&bull;</a>',
                        '<a class="btn btn-mini" href="#" title="encourage" onclick="return WorldJSGod.setKnowledgePriority(this, \'', knowledge.id, '\', 2);">&and;</a>',
                    '</div>',
                    '<div class="name">+ ', knowledge.name, '</div>',
                    '<div class="description">', knowledge.description, '</div>',
                    '<div class="progress progress-info"><div class="bar"></div></div>',
                    '<div class="IQ"><span class="world-IQ">0</span> / ', knowledge.IQ.required, ' IQ</div>',
                '</div>'
            ],
            elementsCache = Cache.Knowledge.elements;
        elementsCache.knowledgeTrending.container.append(html.join(''));

        // Cache knowledge container
        var container = $('#' + id);
        elementsCache[knowledge.id] = {
            container: container,
            IQContainer: container.find('.world-IQ'),
            barContainer: container.find('.bar')
        };
    };

    // Start with a knowledge
    world.Knowledge.trending = ['huga', 'fire'];
    trendingAdded(world.Knowledge.list.huga);
    trendingAdded(world.Knowledge.list.fire);

    // Add callback
    world.Knowledge.trendingAdded = trendingAdded;
    world.Knowledge.trendingRemoved = function(knowledge) {
        // Remove knowledge HTML
        var knowledgeCache = Cache.Knowledge.elements[knowledge.id];
        knowledgeCache.IQContainer.html(knowledge.IQ.required);
        knowledgeCache.barContainer.width('100%');
        knowledgeCache.container.remove();

        // Remove knowledge container cache
        delete Cache.Knowledge.elements[knowledge.id];

        // Add completed knowledge to knowledge history
        var html = [
                '<div class="knowledge">',
                    '<div class="name">', world.Statistic.year, ': ', knowledge.name, '</div>',
                    '<div class="description">', knowledge.description, '</div>',
                '</div>'
            ];
        Cache.Knowledge.elements.knowledgeHistory.container.prepend(html.join(''));
    };

    // Start the world with 100 random people
    // Update information (Statistic, Rules, Knowledge) every year
    world.init('world').addRandomPeople(100).setEachYearCallback(function() {
        var i, len;

        var Statistic = this.Statistic,
            statisticCache = Cache.Statistic;
        for (i = 0, props = statisticCache.props, len = props.length - 3; i < len; i++) {
            var propName = props[i];
            Cache.set(statisticCache.elements[propName], Statistic[propName]);
        }
        Cache.set(statisticCache.elements.avgIQ, Math.round(Statistic.IQ / Statistic.population));
        Cache.set(statisticCache.elements.avgAge, Math.round(Statistic.sumAge / Statistic.die));
        Cache.set(statisticCache.elements.avgChildren, Math.round(Statistic.sumChildren / Statistic.dieMarriedFemale));

        var Rules = this.Rules,
            rulesCache = Cache.Rules;
        Cache.set(rulesCache.elements.adultFoodChange, Rules.Food.adult);
        Cache.set(rulesCache.elements.childFoodChange, Rules.Food.child);
        Cache.set(rulesCache.elements.foodSpoilage, Rules.FoodSpoilage.foodDecr * 100);

        var Knowledge = this.Knowledge;
        for (i = 0, len = Knowledge.trending.length; i < len; i++) {
            var knowledge = Knowledge.list[Knowledge.trending[i]],
                knowledgeCache = Cache.Knowledge.elements[knowledge.id];

            knowledgeCache.IQContainer.html(knowledge.IQ.gained);
            knowledgeCache.barContainer.width(Math.round(knowledge.IQ.gained / knowledge.IQ.required * 100) + '%');
        }

        var labelFamine = Cache.Elements.labelFamine,
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

    var WorldJSGod = window.WorldJSGod = {
        run: function() {
            var $btn = $('#world-run-btn');
            if (world.running) {
                world.stop();
                $btn.html('Unfreeze');
            } else {
                world.start();
                $btn.html('Freeze');
            }
            return false;
        },
        setKnowledgePriority: function(element, id, priority) {
            world.Knowledge.list[id].IQ.priority = priority;

            var cls;
            if (priority > 1) {
                cls = 'progress';
            } else if (priority < 1) {
                cls = 'progress progress-danger';
            } else {
                cls = 'progress progress-info';
            }
            $(element).addClass('active').siblings().removeClass('active')
                .parent().parent().find('.progress').attr('class', cls);
            return false;
        },
        addRandomPeople: function(count) {
            var isDead = world.Statistic.population == 0;
            world.addRandomPeople(count);
            if (isDead || !world.running) {
                world.start();
                $('#world-run-btn').html('Freeze');
            }
            return false;
        },
        kill: function(percent) {
            if (!world.running) {
                world.start();
            }
            world.stop(function() {
                var seeds = world.seeds,
                    random = Math.random,
                    rate = percent / 100;
                for (var id in seeds) {
                    if (seeds.hasOwnProperty(id) && random() < rate) {
                        world.remove(seeds[id]);
                    }
                }
                world.start();
                $('#world-run-btn').html('Freeze');
            });
            return false;
        },
        giveFood: function(food) {
            world.Statistic.food += food;
            return false;
        }
    };
})(window, $, WorldJS);