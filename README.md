World JS: History Simulation [![Build Status](https://travis-ci.org/anvoz/world-js.png?branch=master)](https://travis-ci.org/anvoz/world-js)
========

`World JS` is an attempt to show you a brief history of humankind via a simulation game.

This project was inspired from what I have learned from [A Brief History of Humankind](https://www.coursera.org/course/humankind) by Dr. Yuval Noah Harari.

![Screenshot of version 2.4 on medium screen size](https://f.cloud.github.com/assets/4688035/1744790/b787836c-6423-11e3-8762-4b4f6f482324.PNG "Screenshot of version 2.4 on medium screen size")

## Developer Guidelines

### Getting Started
Read this [wiki page about how it works](https://github.com/anvoz/world-js/wiki) before you do anything else.

* [Code conventions](https://github.com/anvoz/world-js/wiki/Code-Conventions)
* [Change log](https://github.com/anvoz/world-js/wiki/Change-Log)
* [Benchmark](https://github.com/anvoz/world-js/wiki/Benchmark)

### Modules
* World JS: Create a world where people live and reproduce.
 * Core: Define a world and manage its main loop.
 * Tile: Divide a world into tiles. Each tile holds references to all seeds (objects) that currently stay in it.
 * Event: Register behaviors to take effect when an event occurs.
 * Seed (base class), Male and Female (extend Seed): Define an object that will be added to a world to live and interact with other objects.
* World History: Create culture of a world.
 * Statistic: Track statistic data of a world.
 * Rules: Define rules that will affect a world and all of its living creatures.
 * Knowledge: Add IQ to humans so they can learn knowledge to survive.
 * Language: Define language of a world.
 * Knowledge.data: Define all knowledge data of a world.
* Presentation
 * Guide: Queue up messages that will be displayed on the main screen.
 * Interface: Bind a world and its properties to UI. Define some basic UI interactions.
 * Story: Initialize a world and define the `History Simulation` story.

### Sample code

_Require `World JS`_
```
// Create a new world
var world = new WorldJS();

// Add the world to a HTML wrapper
world.init('world-wrapper-id');

// Add 50 random people to the world
world.addSeeds(50, {
    types: [world.Male, world.Female]
});

// Start the world
world.start();

// Add another woman to the world
world.addSeed(world.Female, {age: 25});
```

## License

Copyright An Vo [@an_voz](https://twitter.com/an_voz), 2013-2014.

Licensed under [MIT](http://www.opensource.org/licenses/mit-license.php).
