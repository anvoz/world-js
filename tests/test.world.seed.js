module('seed');

test('seed.draw', function() {
    var dots = [],
        jumps = [],
        context = {
            fillRect: function(x, y, width, height) {
                dots.push([x, y, width, height]);
            },
            drawImage: function(img, x1, y1, w1, h1, x2, y2, w2, h2) {
                jumps.push(y2);
            }
        },
        world = new WorldJS();

    // Draw the first seed (1px)
    var seed1 = new world.Seed({x: 1, y: 2});
    seed1.draw(context, true);

    // Draw the second seed (forced dot)
    var seed2 = new world.Seed({
        x: 3, y: 4,
        icon: {width: 10, height: 10}
    });
    seed2.draw(context, false);

    // Draw the third seed - a jump-able seed
    var seed3 = new world.Seed({
        x: 10, y: 10,
        icon: {width: 10, height: 10}
    });
    for (var i = 0; i < 25; i++) {
        seed3.draw(context, true);
        seed3.stepCount++;
    }

    deepEqual(dots, [
        [1, 2, 1, 1],
        [3, 4, 1, 1]
    ], 'Check all dots');
    deepEqual(jumps, [
        9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
        9, 8, 7, 6, 5
    ], 'Check all y-pos when seed jump');
});

test('seed.move', function() {
    var world = new WorldJS(),
        padding = world.padding,
        speed = 5,
        pos = padding + speed;

    // Force random function to return min value
    world.random = function(min, max) {
        return min;
    };

    var seed = new world.Seed({
        x: pos, y: pos,
        tickCount: 10,
        moveUntilStep: 10
    });
    seed.world = world;

    // Seed doesn't move because stepCount == moveUntilStep
    seed.move(speed);
    deepEqual({
        x: seed.x, y: seed.y, moveTo: false
    }, {
        x: pos, y: pos, moveTo: false
    }, 'Seed stayed');
    deepEqual(seed.ageToMoveAgain, 2, 'Age to move again');

    // Still not enough age to move
    seed.age = 1;
    seed.move(speed);
    deepEqual({
        x: seed.x, y: seed.y, moveTo: false
    }, {
        x: pos, y: pos, moveTo: false
    }, 'Seed stayed again');
    deepEqual(seed.ageToMoveAgain, 2, 'Age to move again');

    // Enough age to move
    seed.age = 2;
    seed.move(speed);
    deepEqual({
        x: seed.x, y: seed.y, moveTo: {x: padding, y: padding}
    }, {
        x: pos - speed, y: pos - speed, moveTo: {x: padding, y: padding}
    }, 'Seed moved');
    deepEqual(seed.ageToMoveAgain, 0, 'Age to move again');
    ok(seed.moveUntilStep > 10, 'New moveUntilStep value')
});

test('seed.seek', function() {
    var world = new WorldJS();
    world.init('qunit-fixture');

    var seed = world.addSeed(world.Seed, {x: 50, y: 50});
    deepEqual(seed.seek(), false, 'Not seek itself');

    // Add seeds to all 8 directions
    var pos = {
            center: 50,
            top: 30,
            bottom: 70,
            left: 30,
            right: 70
        },
        seedC = world.addSeed(world.Seed, {x: pos.center, y: pos.center}),
        seedT = world.addSeed(world.Seed, {x: pos.center, y: pos.top}),
        seedB = world.addSeed(world.Seed, {x: pos.center, y: pos.bottom}),
        seedL = world.addSeed(world.Seed, {x: pos.left, y: pos.center}),
        seedR = world.addSeed(world.Seed, {x: pos.right, y: pos.center}),
        seedTL = world.addSeed(world.Seed, {x: pos.left, y: pos.top}),
        seedTR = world.addSeed(world.Seed, {x: pos.right, y: pos.top}),
        seedBL = world.addSeed(world.Seed, {x: pos.left, y: pos.bottom}),
        seedBR = world.addSeed(world.Seed, {x: pos.right, y: pos.bottom});

    // Seek seeds in all 8 directions
    deepEqual(seed.seek(), seedC, 'Seek center tile');
    deepEqual(seed.seek(function(candidate) {
        return candidate.x == pos.center && candidate.y == pos.top;
    }), seedT, 'Seek top tile');
    deepEqual(seed.seek(function(candidate) {
        return candidate.x == pos.center && candidate.y == pos.bottom;
    }), seedB, 'Seek bottom tile');
    deepEqual(seed.seek(function(candidate) {
        return candidate.x == pos.left && candidate.y == pos.center;
    }), seedL, 'Seek left tile');
    deepEqual(seed.seek(function(candidate) {
        return candidate.x == pos.right && candidate.y == pos.center;
    }), seedR, 'Seek right tile');
    deepEqual(seed.seek(function(candidate) {
        return candidate.x == pos.left && candidate.y == pos.top;
    }), seedTL, 'Seek top left tile');
    deepEqual(seed.seek(function(candidate) {
        return candidate.x == pos.right && candidate.y == pos.top;
    }), seedTR, 'Seek top right tile');
    deepEqual(seed.seek(function(candidate) {
        return candidate.x == pos.left && candidate.y == pos.bottom;
    }), seedBL, 'Seek bottom left tile');
    deepEqual(seed.seek(function(candidate) {
        return candidate.x == pos.right && candidate.y == pos.bottom;
    }), seedBR, 'Seek bottom right tile');
});

test('seed.getChance', function() {
    var world = new WorldJS();
    world.init('qunit-fixture');

    var seed = world.addSeed(world.Seed);
    seed.chances = {
        test: [
            { range: [10, 30], from: 10, to: 40 },
            { range: [50, 70], from: 60, to: 50 },
            { range: [70, 90], from: 50, to: 30 }
        ]
    };

    // Not in any range
    seed.age = 0;
    deepEqual(seed.getChance('test'), 0, 'age: 0');
    seed.age = 9;
    deepEqual(seed.getChance('test'), 0, 'age: 9');

    // First range: (40 - 10) / (30 - 10) = 1.5
    seed.age = 10;
    deepEqual(seed.getChance('test'), 10, 'age: 10');
    seed.age = 11;
    deepEqual(seed.getChance('test'), 11.5, 'age: 11');
    seed.age = 20;
    deepEqual(seed.getChance('test'), 25, 'age: 20');
    seed.age = 29;
    deepEqual(seed.getChance('test'), 38.5, 'age: 29');
    seed.age = 30;
    deepEqual(seed.getChance('test'), 40, 'age: 30');

    // Still keep the adjustment value as the first range
    seed.age = 31;
    deepEqual(seed.getChance('test'), 41.5, 'age: 31');
    seed.age = 49;
    deepEqual(seed.getChance('test'), 68.5, 'age: 49');

    // Second range: (50 - 60) / (70 - 50) = -0.5
    seed.age = 50;
    deepEqual(seed.getChance('test'), 60, 'age: 50');
    seed.age = 51;
    deepEqual(seed.getChance('test'), 59.5, 'age: 51');
    seed.age = 60;
    deepEqual(seed.getChance('test'), 55, 'age: 60');
    seed.age = 69;
    deepEqual(seed.getChance('test'), 50.5, 'age: 69');
    seed.age = 70;
    deepEqual(seed.getChance('test'), 50, 'age: 70');

    // Third range: (30 - 50) / (90 - 70) = -1
    seed.age = 71;
    deepEqual(seed.getChance('test'), 49, 'age: 71');
    seed.age = 80;
    deepEqual(seed.getChance('test'), 40, 'age: 80');
    seed.age = 89;
    deepEqual(seed.getChance('test'), 31, 'age: 89');
    seed.age = 90;
    deepEqual(seed.getChance('test'), 30, 'age: 90');

    // Still keep the adjustment value as the third range
    seed.age = 91;
    deepEqual(seed.getChance('test'), 29, 'age: 91');
    seed.age = 100;
    deepEqual(seed.getChance('test'), 20, 'age: 100');
});

test('seed.getCarryingItem', function() {
    var world = new WorldJS();
    world.init('qunit-fixture');
    world.items = {
        meat: {
            enabled: false,
            who: 'man',
            when: 'moving',
            icon: {name: 'meat'}
        },
        fruit: {
            enabled: true,
            who: 'woman',
            when: 'moving',
            icon: {name: 'fruit'}
        },
        fire: {
            enabled: false,
            who: 'man',
            when: 'standing',
            icon: {name: 'fire'}
        },
        rock: {
            enabled: true,
            who: 'man',
            when: 'standing',
            icon: {name: 'rock'}
        },
        pot: {
            enabled: true,
            who: 'wife',
            when: 'standing',
            icon: {name: 'pot'}
        },
        basket: {
            enabled: true,
            who: 'wife',
            when: 'standing',
            icon: {name: 'basket'}
        }
    };

    var seed = world.addSeed(world.Seed);

    // Check false case
    deepEqual(seed.getCarryingItem('husband', 'moving'), false, 'Not existed');
    deepEqual(seed.getCarryingItem('man', 'moving'), false, 'Disabled');

    // Only 1 available item
    deepEqual(seed.getCarryingItem('woman', 'moving'), {name: 'fruit'}, '1 item');
    deepEqual(seed.getCarryingItem('man', 'standing'), {name: 'rock'}, 'Still 1 item');

    // Choose one of two available items
    world.random = function(min, max) {
        return max;
    };
    deepEqual(seed.getCarryingItem('wife', 'standing'), {name: 'basket'}, 'Choose 1 of 2 item');
});