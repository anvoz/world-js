/*!
 * world.guide.js
 * Display guide messages on the main screen in queued order
 *
 * World JS
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013 An Vo - anvo4888@gmail.com
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

(function(window, undefined) {
    'use strict';

    var WorldJS = window.WorldJS,
        Guide;

    /**
     * Guide constructor
     */
    Guide = WorldJS.Guide = function(world) {
        var worldGuide = this;

        // Store reference of a world
        worldGuide.world = world;

        worldGuide.$container = undefined;
        worldGuide.queue = [];
    };

    /**
     * Set guide container
     * $container: jQuery element
     */
    Guide.prototype.setContainer = function($container) {
        this.$container = $container;
    };

    /**
     * Show guide message
     * message: message content
     * ytl: message's year to live
     */
    Guide.prototype.show = function(message, ytl) {
        var worldGuide = this,
            world = worldGuide.world;

        if (typeof message !== 'undefined') {
            // Add message to queue
            worldGuide.queue.push({ message: message, ytl: ytl });
            if (worldGuide.queue.length == 1) {
                worldGuide.show();
            }
        } else {
            // Show first message in queue
            if (worldGuide.queue.length > 0) {
                var item = worldGuide.queue[0],
                    hiddenYear = world.Statistic.year + item.ytl;

                worldGuide.$container.html(item.message).animate({ bottom: 0 }, 400);

                world.Event.add('yearPassed', 'guide', function() {
                    var world = this;
                    if (world.Statistic.year >= hiddenYear) {
                        world.Guide.hide();
                        world.Event.remove('yearPassed', 'guide');
                    }
                });
            }
        }
    };

    /**
     * Hide guide message
     */
    Guide.prototype.hide = function() {
        var worldGuide = this,
            world = worldGuide.world;

        worldGuide.$container.animate({ bottom: -60 }, 400, 'swing', function() {
            // Remove from queue
            worldGuide.queue.shift();
            // Show next item in queue
            worldGuide.show();
        });
    };
})(window);