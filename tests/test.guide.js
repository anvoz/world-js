define(function(require) {

  module('guide');

  var Guide     = require('./guide');
  var Statistic = require('./statistic');
  var WorldJS   = require('./core');


  asyncTest('guide.show & guide.hide', function() {
    var DOMElement = function() {
      this.data = {};
    };
    DOMElement.prototype.html = function(html) {
      var self = this;
      if (typeof html !== 'undefined') {
        self.data.html = html;
        return self;
      }
      return self.data.html;
    };
    DOMElement.prototype.animate = function(data, time, type, callback) {
      var self = this;
      self.data.bottom = data.bottom;
      if (typeof callback === 'function') {
        callback();
      }
      return self;
    };
    DOMElement.prototype.outerHeight = function() {
      return 50;
    };

    var $container      = new DOMElement();
    var world           = new WorldJS();
    var worldEvent      = world.event;
    var worldStatistic  = world.statistic = new Statistic(world);
    var worldGuide      = world.guide = new Guide(world);

    worldGuide.setContainer($container);
    worldGuide.show('test', 10);
    // Unable to test this yet
    // worldGuide.show('test2', 10);

    worldEvent.add('yearPassed', 'test', function() {
      var world = this;
      switch (world.statistic.year) {
        case 1:
          deepEqual($container.html(),      'test', 'Show the guide');
          deepEqual($container.data.bottom, 0,      'The guide is showing');
          break;
        case 10:
          deepEqual($container.html(),      'test', 'Still hold the value');
          deepEqual($container.data.bottom, -50,    'The guide is hidden');
          start();
          break;
      }
    });

    worldEvent.trigger('yearPassed');
    worldStatistic.year = 9;
    worldEvent.trigger('yearPassed');
  });

});
