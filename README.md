World JS: History Simulation
========

`World JS` is an attempt to show you a brief history of humankind via a game in 4 parts: the cognitive revolution, the agricultural revolution, the scientific revolution and the future.

![Screenshot of version 2.4 on medium screen size](https://f.cloud.github.com/assets/4688035/1744790/b787836c-6423-11e3-8762-4b4f6f482324.PNG "Screenshot of version 2.4 on medium screen size")

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
 * Event: Register behaviors to take effect when an event occurs.
 * Guide: Display guide messages on the main screen in queued order.
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
