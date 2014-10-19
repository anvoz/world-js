/*!
 * world.event.js
 * Register behaviors to take effect when an event occurs
 *
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013-2014 An Vo - anvo4888@gmail.com
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 */

define(function() {

  'use strict';


  // Event constructor
  // Initialize events list for a world
  var Event = function(world) {
    var worldEvent = this;

    // Store reference of a world
    worldEvent.world = world;

    // All of the available events must be declared here
    worldEvent.list = {
      // One event can have many actions that are registered by action names
      // Unused actions must be removed manually
      yearPassed:   { /* action: handler */ },
      seedAdded:    {},
      seedRemoved:  {}
    };
  };


  // Add a handler function to an event
  // event:   event name
  // action:  action name
  // handler: handler function
  Event.prototype.add = function(event, action, handler) {
    this.list[event][action] = handler;
  };


  // Remove a handler function from an event
  // event:   event name
  // action:  action name
  Event.prototype.remove = function(event, action) {
    delete this.list[event][action];
  };


  // Trigger an event
  // world: the world that takes effects
  // event: event name
  Event.prototype.trigger = function(event, data) {
    var worldEvent  = this;
    var world       = worldEvent.world;
    var actions     = worldEvent.list[event];

    for (var actionName in actions) {
      if (actions.hasOwnProperty(actionName)) {
        actions[actionName].call(world, data);
      }
    }
  };


  return Event;

});
