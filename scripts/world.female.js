/*!
 * world.female.js
 * Female extends Seed class.
 *
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013-2014 An Vo - anvo4888@gmail.com
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 */

(function(window, undefined) {
  'use strict';


  var WorldJS = window.WorldJS;
  var Seed    = WorldJS.prototype.Seed;
  var Female;


  // Female constructor
  // data (optional): seed data, age, chances
  Female = WorldJS.prototype.Female = function(data) {
    var female = this;

    data.icon = {
      x: 13, y: 0,
      width:  13, height: 20,
      child: { // must define maxChildAge
        x: 26, y: 10,
        width: 11, height: 10
      }
    };

    Seed.call(female, data);

    female.maxChildAge = 15;

    // Total children that she gave birth
    // Need to be set from undefined to 0 right after her first marriage
    female.totalChildren = undefined;
    // The age when she bears her youngest child
    female.ageLastBear = 0;

    female.chances = data.chances || {
      death: [
        { range: [1, 25],   from: 0.02, to: 0.01 },
        { range: [25, 65],  from: 0.01, to: 0.02 },
        { range: [65, 85],  from: 0.02, to: 0.05 },
        { range: [85, 105], from: 0.05, to: 0.9 }
      ],
      childbirth: [
        { range: [15, 25],  from: 0.1, to: 0.25 },
        { range: [25, 50],  from: 0.25, to: 0.1 },
        { range: [50, 70],  from: 0.1, to: 0.001 }
      ]
    };
  };
  Female.prototype = Object.create(Seed.prototype);
  Female.prototype.contructor = Female;


  // Female action in every frame (tick)
  // speed: speed of the world
  Female.prototype.tick = function(speed) {
    var female  = this;
    var world   = female.world;

    female.tickCount++;

    var actionInterval = female.actionInterval / speed;
    if (female.tickCount % actionInterval === actionInterval - 1) {
      // Trigger every <actionInterval> ticks
      var age = female.age;

      var deathChance = female.getChance('death');
      if (deathChance > 0 && Math.random() < deathChance) {
        world.removeSeed(female);
        return;
      }

      if (female.relationSeed !== false && // Is married
        // Enough age to give birth
        age >= female.chances.childbirth[0].range[0] &&
        // Not give birth in the same year
        age > female.ageLastBear
      ) {
        var childBirthChance = female.getChance('childbirth');
        if (childBirthChance > 0 && Math.random() < childBirthChance) {
          // +1 because she has more than 1 chance to give birth every year
          // depended on actionInterval
          female.ageLastBear = age + 1;
          female.totalChildren++;

          var data = {
            x: female.x,
            y: Math.min(
              world.height - 1 - world.padding,
              female.y + Math.floor(female.icon.height / 2)
            ),
            mother: female
          };

          if (Math.random() < 0.5) {
            world.addSeed(world.Male, data);
          } else {
            world.addSeed(world.Female, data);
          }
        }
      }
    }

    female.move(speed, false);

    if (female.carrying === false && typeof world.items !== 'undefined') {
      if (Math.random() < 0.2) {
        if (female.age > female.maxChildAge) {
          var who  = (female.relationSeed === false) ? 'woman' : 'wife';
          var when = (female.isMoving) ? 'moving' : 'standing';
          female.carrying = female.getCarryingItem(who, when);
        }
      } else {
        female.carrying = 'none';
      }
    }
  };

})(window);
