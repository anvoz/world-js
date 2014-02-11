module('event');

test('event.add & event.remove', function() {
    var event = new WorldJS.Event();

    event.add('seedAdded', 'test1', 'foo');
    event.add('seedAdded', 'test2', 'bar');
    deepEqual(event.list.seedAdded.test1, 'foo', 'An event was added');
    deepEqual(event.list.seedAdded.test2, 'bar', 'An event was added');

    event.remove('seedAdded', 'test1');
    deepEqual(event.list.seedAdded.test1, undefined, 'An event was removed');
});

asyncTest('event.add & event.remove & event.trigger', function() {
    expect(2);

    var world = new WorldJS();
    world.init('qunit-fixture');
    world.tickPerYear = 12;
    world.speed = 5;

    var seedData = {x: 15, y: 12};
    world.event.add('seedAdded', 'checkSeed', function(data) {
        deepEqual({
            x: data.seed.x, y: data.seed.y
        }, seedData, 'Check the seed from seedAdded event');
    });

    world.event.add('seedAdded', 'toBeRemoved', function(data) {
        ok(false, 'This function will be removed.');
    });
    world.event.remove('seedAdded', 'toBeRemoved');

    world.event.add('seedAdded', 'checkMore', function(data) {
        ok(true, 'Just another function that should be called when a seed was added.');
        start();
    });

    seed = world.addSeed(world.Seed, seedData);
});