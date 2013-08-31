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
 * Seed (base class); Male and Female (extend Seed): Define an object that will be added to a world to live and interact with other objects.
 * Tile: Manage position of seeds. Each tile holds references to all seeds that currently stay in it.
 * Knowledge: Manage knowledge of a world. Distribute IQ of the world over trending knowledge and apply completed knowledge effects to the world.
 * Rules: Manage rules of a world. Apply new rules to the world every year.
 * Statistic: Track statistic of a world via function callback.
 * Helper (will be removed soon): Helper functions like `is()`, `has()` and `random()`. 
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

### To do
#### Version 1.3
* Re-design layout: focus on mobile-friendly and responsive layout, upgrade to Bootstrap 3.0.
* [DONE] Remove Helper sub module: use inline functions instead of call them from Helper sub module.
* People stand still sometimes instead always move around.
* People will be harder to reach to 20 years old. But if they can make it, they will live much older.

#### Version 2.0
* Things: other objects of the world beside human.
* Talking: people will be able to talk to share what they see.
* Unknown knowledge: only be unlocked by specific conditions.
* Population limit: population is only expanded by the game story or some knowledge.
* Finish the first part of the game story: simulated the Stone Age.

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