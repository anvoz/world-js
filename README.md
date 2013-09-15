World JS: Evolution Simulator
========

In World JS, people move around, find their partner and have children. As they grow smarter with every generation, greater knowledge will be gained. You watch the world, have some god powers to lead it and choose the fate of the world yourself.

**Update:** In version 2.0, I removed the term **God powers** from this game. Some available user interactions are now categorized as **human decisions**. You can let the game process by itself until you are forced to touch it in order to keep it alive.

**Live Demo:** http://anvoz.github.io/world-js/
![Version 1.3 screenshot on medium screen size](https://f.cloud.github.com/assets/4688035/1095554/9e323b28-16e9-11e3-9942-75688aba55e2.png "Version 1.3 screenshot on medium screen size")

## Links
* [Wiki](https://github.com/anvoz/world-js/wiki)
* [Discussion in r/codetogether](http://www.reddit.com/r/codetogether/comments/1in075/game_project_world_js_evolution_simulator_looking/)

## Developer Guidelines

### Getting Started
Read this [wiki page about how it works](https://github.com/anvoz/world-js/wiki) before you do anything else.

### Modules
* WorldJS Core: Define a world and manage its main loop.
 * Seed (base class); Male and Female (extend Seed): Define an object that will be added to a world to live and interact with other objects.
 * Tile: Manage position of seeds. Each tile holds references to all seeds that currently stay in it.
 * Knowledge: Manage knowledge of a world. Distribute IQ of the world over trending knowledge and apply completed knowledge effects to the world.
 * Rules: Manage rules of a world. Apply new rules to the world every year.
 * Statistic: Track statistic of a world via function callback.
* Interface: Bind a world and its properties to UI. Define UI interactions.
* Story: Initialize a world and define its main plot.
* God: Functions that modify a world instance directly. Use as developer tools to debug the game. Most functions will be removed in final release.

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

### Change Log
#### Version 2.0
* Completed 1st part of the game: simulated the world from the first appearance of our ancestors to the cognitive revolution.
* Food resources mechanic: People obtain food from limited food resources.
* Population limit mechanic: You have to unlock a specific knowledge to expand the population limit.
* Layout: Separated Statistic box on left column into 2 tabs.

#### Version 1.3
* New layout: focus on mobile-friendly and responsive design, upgrade to Bootstrap 3.0.
* People standing mechanic: move X steps then stop until Y age then move again.
* Game mechanic: changed death rate and Famine rule.
* Removed Helper sub module: use inline functions instead of call them from Helper sub module.

#### Version 1.2
* Replaced `Front` sub module with `Interface` and `Story` sub modules.
* Distributed ticks mechanic: prevented a tick that has too many actions to trigger that make the game feels janky.
* Prevented holey tile array: set the reference to `false` instead of `delete` it.
* Renamed `eachYearCallback` to `yearPassedCallback`.
* Moved most statistic tracking to `yearPassedCallback`.
* Be able to set age of a seed when it added to a world.
* Removed `Seed.prototype.getAge` function.
* Added option to make random people come from border instead of randomly appear in the world.
* Seed now move and trigger actions instead of move-or-trigger-actions.
* Prevented having children right after married.
* Edited Famine rule: removed childbirth chance decrease.

#### Version 1.1
* Separated source code into smaller sub modules.
* Improved Tile management mechanic: used array instead of hash map.

## Benchmark

### Setup
* Not draw more than 7 seeds each tile (default game mechanic).
* Min food = 0 to prevent Famine effect.
* No trending knowledge.
* Every seed added to the world is 20 years old.
* Women don't bear children (no more people are added to the world during benchmark) but they still have childbirth chance checking (game mechanic remains unchanged).
* People don't die (no people will be removed from the world during benchmark) but they still have death chance checking (game mechanic remains unchanged).

### Results
Tested in Chrome 29 with "Show FPS meter" option enabled. The game must be jank-free in 50 FPS.
```
                Max             Max population
                population      (without drawing)

Version 1.0     2000            8000
Version 1.1     3000            17000
Version 1.2     4500            27000
```
