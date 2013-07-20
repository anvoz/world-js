World JS: Evolution Simulator
========

In World JS, people move around, find their partner and have children. As they grow smarter with every generation, greater knowledge will be gained. You watch the world, have some god powers to lead it and choose the fate of the world yourself.

http://anvoz.github.io/world-js/

## Links
* [Wiki](https://github.com/anvoz/world-js/wiki)
* [Discussion in r/codetogether](http://www.reddit.com/r/codetogether/comments/1in075/game_project_world_js_evolution_simulator_looking/)

## Developer Guidelines

### Getting Started
Require js/world.core.js and images/seeds.png

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

### TODO

#### Current version
* Improve game performance
* Support more browsers including mobile browsers

#### Next version
* Game mechanic to reach 7 billion people
* Completed knowledge list
