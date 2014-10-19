/*!
 * world.knowledge.data.js
 * Define all knowledge data of a world
 *
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013-2014 An Vo - anvo4888@gmail.com
 * Licensed under Creative Commons (http://creativecommons.org/licenses/by-nc/4.0/deed.en_US)
 */

define([ './language/en' ], function(Language) {

  'use strict';


  var KnowledgeData = {

    huga: {
      id:           'huga',
      name:         Language.knowledgeHUGAName,
      message:      Language.knowledgeHUGAMessage,
      description:  [
        {
          text:     Language.knowledgeHUGADescription01,
          code:     ['Adult +1 food / year', 'Food resource +10k']
        }
      ],
      iq:           { priority: 1, gained: 0, required: 500 },
      following:    ['fire', 'hula'],
      affectedYear: 0,
      onAffected: function(world) {
        var worldStatistic = world.statistic;

        world.rules.food.adult      += 1;
        worldStatistic.foodResource += 10000;
        if (worldStatistic.food < 0) {
          worldStatistic.foodResource += worldStatistic.food;
          worldStatistic.food         = 0;
        }

        world.items.meat.enabled  = true;
        world.items.fruit.enabled = true;
      }
    },


    fire: {
      id:           'fire',
      name:         Language.knowledgeFIREName,
      message:      Language.knowledgeFIREMessage,
      description:  [
        {
          text:     Language.knowledgeFIREDescription01,
          code:     ['Death rate -10%']
        },
        {
          text:     Language.knowledgeFIREDescription02,
          code:     ['Base IQ +1']
        },
        {
          text:     Language.knowledgeFIREDescription03,
          code:     ['Food resource recovery -5% / century']
        }
      ],
      iq:           { priority: 0.1, gained: 0, required: 3000 },
      following:    ['cook', 'noma'],
      affectedYear: 0,
      onAffected: function(world) {
        var worldRules = world.rules;

        worldRules.chanceIncr.death -= 0.1;
        worldRules.baseIQ           += 1;

        world.event.add('yearPassed', 'burningForests', function() {
          var world         = this;
          var year          = world.statistic.year;
          var affectedYear  = world.knowledge.list.fire.affectedYear;
          if (year % 100 == affectedYear % 100 && year > affectedYear) {
            world.rules.food.resourceIncr -= 0.1;
          }
        });

        world.items.fire.enabled = true;
      }
    },


    hula: {
      id:           'hula',
      name:         Language.knowledgeHULAName,
      message:      Language.knowledgeHULAMessage,
      description:  [
        {
          text:     Language.knowledgeHULADescription01,
          code:     ['Death rate +10%', 'Adult +2 food / year', 'Food resource +5k']
        },
        {
          text:     Language.knowledgeHULADescription02,
          code:     ['Food resource recovery -5% / century']
        }
      ],
      iq:           { priority: 0.1, gained: 0, required: 20000 },
      following:    [],
      affectedYear: 0,
      onAffected: function(world) {
        var worldRules      = world.rules;
        var worldStatistic  = world.statistic;

        worldRules.chanceIncr.death += 0.1;
        worldRules.food.adult       += 2;
        worldStatistic.foodResource += 5000;
        if (worldStatistic.food < 0) {
          worldStatistic.foodResource += worldStatistic.food;
          worldStatistic.food         = 0;
        }

        world.event.add('yearPassed', 'largeAnimalsDisappearing', function() {
          var world         = this;
          var year          = world.statistic.year;
          var affectedYear  = world.knowledge.list.hula.affectedYear;
          if (year % 100 == affectedYear % 100 && year > affectedYear) {
            world.rules.food.resourceIncr -= 0.1;
          }
        });
      }
    },


    noma: {
      id:           'noma',
      name:         Language.knowledgeNOMAName,
      message:      Language.knowledgeNOMAMessage,
      description:  [
        {
          text:     Language.knowledgeNOMADescription01,
          code:     ['Enable food resource recovery']
        },
        {
          text:     Language.knowledgeNOMADescription02,
          code:     ['Death rate -10%']
        }
      ],
      iq:           { priority: 0.1, gained: 0, required: 50000 },
      following:    ['osea'],
      affectedYear: 0,
      onAffected: function(world) {
        world.event.add('yearPassed', 'foodResourceRecovering', function() {
          var world         = this;
          var year          = world.statistic.year;
          var affectedYear  = world.knowledge.list.noma.affectedYear;
          if (year % 10 == affectedYear % 10 && year > affectedYear) {
            var worldRules    = world.rules;
            var foodResource  = 10 * worldRules.population.limit * worldRules.food.adult;
            foodResource = Math.max(0, foodResource + Math.ceil(foodResource * worldRules.food.resourceIncr));
            world.statistic.foodResource = foodResource;
          }
        });

        world.rules.chanceIncr.death -= 0.1;
      }
    },


    cook: {
      id:           'cook',
      name:         Language.knowledgeCOOKName,
      message:      Language.knowledgeCOOKMessage,
      description:  [
        {
          text:     Language.knowledgeCOOKDescription01,
          code:     ['Adult +1 food / year', 'Food resource +20k']
        },
        {
          text:     Language.knowledgeCOOKDescription02,
          code:     ['Base IQ +1']
        },
        {
          text:     Language.knowledgeCOOKDescription03,
          code:     ['Death rate -10%', 'Food spoilage -10%']
        }
      ],
      iq:           { priority: 0.1, gained: 0, required: 5000 },
      following:    [],
      affectedYear: 0,
      onAffected: function(world) {
        var worldRules      = world.rules;
        var worldStatistic  = world.statistic;

        worldRules.food.adult       += 1;
        worldStatistic.foodResource += 20000;
        if (worldStatistic.food < 0) {
          worldStatistic.foodResource += worldStatistic.food;
          worldStatistic.food         = 0;
        }
        worldRules.baseIQ                 += 1;
        worldRules.chanceIncr.death       -= 0.1;
        worldRules.foodSpoilage.foodDecr  -= 0.1;

        world.items.pot.enabled = true;
      }
    },


    goss: {
      id:           'goss',
      name:         Language.knowledgeGOSSName,
      message:      Language.knowledgeGOSSMessage,
      description:  [
        {
          text:     Language.knowledgeGOSSDescription01,
          code:     ['Population limit 150', 'Base IQ +1', 'Child -1 food / year']
        }
      ],
      iq:           { priority: 0.1, gained: 0, required: 10000 },
      following:    [],
      affectedYear: 0,
      onAffected: function(world) {
        var worldRules = world.rules;

        worldRules.population.limit = 150;
        worldRules.baseIQ           += 1;
        worldRules.food.child       -= 1;

        // Bigger world
        world.padding = 10;
      }
    },


    spir: {
      id:           'spir',
      name:         Language.knowledgeSPIRName,
      message:      Language.knowledgeSPIRMessage,
      description:  [
        {
          text:     Language.knowledgeSPIRDescription01,
          code:     ['Population limit 500', 'Base IQ +1', 'Child -1 food / year']
        },
        {
          text:     Language.knowledgeSPIRDescription02,
          code:     ['Death rate +10%']
        }
      ],
      iq:           { priority: 0.1, gained: 0, required: 50000 },
      following:    [],
      affectedYear: 0,
      onAffected: function(world) {
        var worldRules = world.rules;

        worldRules.population.limit = 500;
        worldRules.baseIQ           += 1;
        worldRules.food.child       -= 1;
        worldRules.chanceIncr.death += 0.1;
      }
    },


    osea: {
      id:           'osea',
      name:         Language.knowledgeOSEAName,
      message:      Language.knowledgeOSEAMessage,
      description:  [
        {
          text:     Language.knowledgeOSEADescription01,
          code:     ['Food resource +10k', 'Food resource recovery +20%']
        },
        {
          text:     Language.knowledgeOSEADescription02,
          code:     ['Death rate +0%']
        }
      ],
      iq:           { priority: 0.1, gained: 0, required: 200000 },
      following:    [],
      affectedYear: 0,
      onAffected: function(world) {
        var worldStatistic = world.statistic;

        worldStatistic.foodResource += 10000;
        if (worldStatistic.food < 0) {
          worldStatistic.foodResource += worldStatistic.food;
          worldStatistic.food         = 0;
        }
        world.rules.food.resourceIncr += 0.2;
      }
    },


    coso: {
      id:           'coso',
      name:         Language.knowledgeCOSOName,
      description:  [
        {
          text:     Language.knowledgeCOSODescription01,
          code:     []
        },
        {
          text:     Language.knowledgeCOSODescription02,
          code:     []
        },
        {
          text:     Language.knowledgeCOSODescription03,
          code:     []
        }
      ],
      iq:           { priority: 0.1, gained: 0, required: 1000000000 },
      following:    [],
      affectedYear: 0,
      onAffected: function() { }
    }
  };


  return KnowledgeData;

});
