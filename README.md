World JS: Evolution Simulator
========

In World JS, people move around, find their partner and have children. As they grow smarter with every generation, greater knowledge will be gained. You watch the world, have some god powers to lead it and choose the fate of the world yourself.

**Live Demo:** http://anvoz.github.io/world-js/
![Version 1.1 screenshot](https://f.cloud.github.com/assets/4688035/887848/f6802384-fa02-11e2-81cc-a839cca329d5.png "Version 1.1 screenshot")

## Links
* [Wiki](https://github.com/anvoz/world-js/wiki)
* [Discussion in r/codetogether](http://www.reddit.com/r/codetogether/comments/1in075/game_project_world_js_evolution_simulator_looking/)

## Developer Guidelines

### Getting Started
Read this [wiki page about how it works](https://github.com/anvoz/world-js/wiki) before you do anything else.

### Modules
* WorldJS Core
 * Tile: Manage the position of a seed in the world.
 * Knowledge: Manage knowledge of a world.
 * Rules: Manage rules of a world like death rate, food spoilage...
 * Statistic: Manage statistic of a world like population, total IQ...
 * Seed (base class), Male, Female (extend Seed): Main object that live in the world.
 * Helper: Helper functions like `is()`, `has()` and `random()`.
* Front: Create and bind the world to the user interface.
* God: Functions that modify the world instance directly. Used for interaction between user and a world instance.

### Sample code

_Require `WorldJS Core`_
```
// Create a new world
var world = new WorldJS();

// Add the world to a HTML wrapper
world.init('world-wrapper-id');

// Add 50 random people to the world
world.addRandomPeople(50);

// Start the world
world.start();

// Add a woman to the world
world.add(world.Female, { age: 25 });
```

### Change Log
#### Version 1.1
* Separated the source code into smaller sub modules.
* Improved the Tile management mechanic. The population could expand from 1000 to 5000 smoothly.

### TODO

* [Issues](https://github.com/anvoz/world-js/issues?state=open)
* Finish a full list of world knowledge.
* Add Facebook, Google+ and Twitter.
