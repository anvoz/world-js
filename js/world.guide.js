/*!
 * world.guide.js
 * Display guide messages on the main screen in queued order
 *
 * World JS: Evolution Simulator
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
    Guide = WorldJS.Guide = function() {
        var guide = this;

        guide.$container = undefined;
        guide.queue = [];
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
        var world = this,
            Guide = world.Guide;

        if (typeof message !== 'undefined') {
            // Add message to queue
            Guide.queue.push({ message: message, ytl: ytl });
            if (Guide.queue.length == 1) {
                Guide.show.call(world);
            }
        } else {
            // Show first message in queue
            if (Guide.queue.length > 0) {
                var item = Guide.queue[0],
                    hiddenYear = world.Statistic.year + item.ytl;

                Guide.$container.html(item.message).animate({ bottom: 0 }, 400);

                world.Event.add('yearPassed', 'guide', function() {
                    var world = this;
                    if (world.Statistic.year >= hiddenYear) {
                        world.Guide.hide.call(world);
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
        var world = this,
            guide = world.Guide;

        guide.$container.animate({ bottom: -60 }, 400, 'swing', function() {
            // Remove from queue
            guide.queue.shift();
            // Show next item in queue
            guide.show.call(world);
        });
    };
})(window);