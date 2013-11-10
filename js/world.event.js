/*!
 * world.event.js
 * Register behaviors to take effect when an event occurs
 *
 * World JS: Evolution Simulator
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013 An Vo - anvo4888@gmail.com
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

(function(window, undefined) {
    'use strict';

    var WorldJS = window.WorldJS,
        Event;

    /**
     * Event constructor
     * Initialize events list for a world
     */
    Event = WorldJS.Event = function(world) {
        var worldEvent = this;

        // Store reference of a world
        worldEvent.world = world;

        // All of the available events must be declared here
        worldEvent.list = {
            // One event can have many actions that are registered by action names
            // Unused actions must be removed manually
            yearPassed: {
                // action: handler
            }
        };
    };

    /**
     * Add a handler function to an event
     * event: event name
     * action: action name
     * handler: handler function
     */
    Event.prototype.add = function(event, action, handler) {
        this.list[event][action] = handler;
    };

    /**
     * Remove a handler function from an event
     * event: event name
     * action: action name
     */
    Event.prototype.remove = function(event, action) {
        delete this.list[event][action];
    };

    /**
     * Trigger an event
     * world: the world that takes effects
     * event: event name
     */
    Event.prototype.trigger = function(event) {
        var worldEvent = this,
            world = worldEvent.world,

            actions = worldEvent.list[event];
        for (var actionName in actions) {
            if (actions.hasOwnProperty(actionName)) {
                actions[actionName].call(world);
            }
        }
    };
})(window);