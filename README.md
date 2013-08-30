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
* WorldJS Core: Define a world and manage its main loop.
 * Seed (base class); Male and Female (extend Seed): Define living objects that will be added in a world to interact with each other.
 * Tile: Manage position of seeds of a world. Each tile holds references to all seeds that currently belong to it.
 * Knowledge: Manage knowledge of a world. Distribute IQ of all seeds over trending knowledge and apply their effects to the world.
 * Rules: Manage rules of a world. Apply new rules to the world every year.
 * Statistic: Manage statistic of a world via function callback.
 * Helper (will be removed soon): Helper functions like `is()`, `has()` and `random()`. 
* Interface: Bind a world and its properties to UI. Define UI interactions.
* Story: Initialize a world and define its main plot.
* God (most functions will be removed in final release): Functions that modify a world instance directly. Use as developer tools to debug the game.

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
