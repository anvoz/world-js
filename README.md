World JS: Evolution Simulator
========

In World JS, people move around, find their partner and have children. As they grow smarter with every generation, greater knowledge will be gained. You watch the world, have some god powers to lead it and choose the fate of the world yourself.

**Live Demo:** http://anvoz.github.io/world-js/

## Links
* [Wiki](https://github.com/anvoz/world-js/wiki)
* [Discussion in r/codetogether](http://www.reddit.com/r/codetogether/comments/1in075/game_project_world_js_evolution_simulator_looking/)

## Developer Guidelines

### Getting Started
Read this [wiki page about how it works](https://github.com/anvoz/world-js/wiki) before you do anything else.

_Require `js/world.core.js` and `images/seeds.png`_

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

* Separate `world.core.js` into smaller parts.
* Review the IQ increase of the world. It is not intended that a new highest IQ child is born in just a few years.
* People will not move in the same direction too far to make the movement of the world feels more random.
* Support WebGL and SVG.
* Disaster animation.
* More infomation will be added to the live demo page of this game to help people understand it.
* Population limit mechanic: Need a lot of works to do to expand the population smoothly so this mechanic must be a temporary solution to keep the game from crashed.
* Finish a full list of world knowledge.
* Add Facebook, Google+ and Twitter.
