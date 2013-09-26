World JS: Evolution Simulator
========

**Live Demo:** http://anvoz.github.io/world-js/
![Version 2.1 screenshot on medium screen size](https://f.cloud.github.com/assets/4688035/1219134/f2a1be04-26c5-11e3-8a8b-84505d67ce3d.png "Version 2.1 screenshot on medium screen size")

## Links
* [Wiki](https://github.com/anvoz/world-js/wiki)
* [Discussion in r/codetogether](http://www.reddit.com/r/codetogether/comments/1in075/game_project_world_js_evolution_simulator_looking/)
* [Discussion in r/webgames](http://www.reddit.com/r/WebGames/comments/1mfl6t/world_js_evolution_simulator/)

## Developer Guidelines

### Getting Started
Read this [wiki page about how it works](https://github.com/anvoz/world-js/wiki) before you do anything else.

* [Code conventions](https://github.com/anvoz/world-js/wiki/Code-Conventions)
* [Change log](https://github.com/anvoz/world-js/wiki/Change-Log)
* [Benchmark](https://github.com/anvoz/world-js/wiki/Benchmark)

### Modules
* WorldJS Core: Define a world and manage its main loop.
 * Seed (base class); Male and Female (extend Seed): Define an object that will be added to a world to live and interact with other objects.
 * Tile: Manage position of seeds. Each tile holds references to all seeds that currently stay in it.
 * Knowledge: Manage knowledge of a world. Distribute IQ of the world over trending knowledge and apply completed knowledge effects to the world.
 * Rules: Manage rules of a world. Apply new rules to the world every year.
 * Statistic: Track statistic of a world via function callback.
* Interface: Bind a world and its properties to UI. Define UI interactions.
* Story: Initialize a world and define its main plot.

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

// Add another woman to the world
world.add(world.Female, { age: 25 });
```
