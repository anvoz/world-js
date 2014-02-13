module('male');

test('male.tick', function() {
    var world = new WorldJS();
    world.init('qunit-fixture');
    world.speed = 5;

    // Add a man
    var male = world.addSeed(world.Male, {
        x: 20, y: 20,
        moveTo: {x: 70, y: 70},
        age: 20,
        moveUntilStep: 9999, // Always move
        chances: {
            // 0% death rate
            death: [{range: [1, 100], from: 0, to: 0}],
            // 0% marriage success chance
            marriage: [{range: [1, 100], from: 0, to: 0}]
        }
    });

    // Just move, nothing for him to do now
    male.tickCount += world.speed - 1;
    male.tick(world.speed);
    deepEqual({
        x: male.x, y: male.y
    }, {
        x: 25, y: 25
    }, '1st: He moves to moveTo position');

    // Add a woman
    var female = world.addSeed(world.Female, {x: 0, y: 20, age: 20});
    // He see a woman but can not do anthing
    male.tickCount += world.speed;
    male.tick(world.speed);
    deepEqual({
        x: male.x, y: male.y
    }, {
        x: 30, y: 30
    }, '2nd: See a woman but can not do anything (0% marriage success chance)');
    deepEqual(male.relationSeed, false, 'Still single');

    // Ready to get married
    male.chances.marriage = [{range: [1, 100], from: 1, to: 1}];
    // But the women turns old
    female.age = 99999;
    // Too old for him
    male.tickCount += world.speed;
    male.tick(world.speed);
    deepEqual({
        x: male.x, y: male.y
    }, {
        x: 35, y: 35
    }, '3rd: Ready to get married (100% chance) but she is too old');
    deepEqual(male.relationSeed, false, 'Still single');

    // Add another woman
    var female2 = world.addSeed(world.Female, {x: 55, y: 35, age: 20});
    // The man get married with her
    // and start moving to her (already same y)
    male.tickCount += world.speed;
    male.tick(world.speed);
    deepEqual({
        x: male.x, y: male.y
    }, {
        x: 40, y: 35
    }, '4th: Find another woman and get married');
    deepEqual(male.relationSeed, female2, 'Married');

    // Still move to his wife
    male.tickCount += world.speed;
    male.tick(world.speed);
    deepEqual({
        x: male.x, y: male.y
    }, {
        x: 45, y: 35
    }, '5th: Follow his wife');

    // Still move to his wife after she changed her location
    female2.x = 65;
    female2.y = 55;
    male.tickCount += world.speed;
    male.tick(world.speed);
    deepEqual({
        x: male.x, y: male.y
    }, {
        x: 50, y: 40
    }, '6th: Still follow his wife');

    // Add another woman but he's already got married
    var female3 = world.addSeed(world.Female, {x: 50, y: 50, age: 20});
    male.tickCount += world.speed;
    male.tick(world.speed);
    deepEqual({
        x: male.x, y: male.y
    }, {
        x: 55, y: 45
    }, '7th: Another women appeared but he does not care');
    deepEqual(male.relationSeed, female2, 'Still married with the same woman');

    // His wife dies
    world.removeSeed(female2);
    deepEqual(male.relationSeed, false, 'His wife is dead - Single again');
    // Find another woman
    male.tickCount += world.speed;
    male.tick(world.speed);
    deepEqual(male.relationSeed, female3, '8th: But not too long - Married again');

    // He dies
    male.chances.death = [{range: [1, 100], from: 1, to: 1}];
    male.tickCount += world.speed;
    male.tick(world.speed);
    deepEqual(female3.relationSeed, false, '9th: He dies - His wife is single again');
});