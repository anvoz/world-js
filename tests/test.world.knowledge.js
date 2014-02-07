module('knowledge');

asyncTest('knowledge.seedAdded', function() {
    var world = new WorldJS();
    world.init('qunit-fixture');

    var worldStatistic = world.statistic = new WorldJS.Statistic(world),
        worldRules = world.rules = new WorldJS.Rules(world),
        worldKnowledge = world.knowledge = new WorldJS.Knowledge(world);

    world.random = function(min, max) {
        return max;
    };
    worldStatistic.year = 10;
    worldRules.baseIQ = 1;

    world.event.add('seedAdded', 'test', function(data) {
        deepEqual(data.seed.iq, 4, 'Seed has IQ value (3 + 1)');
        deepEqual(data.seed.world.statistic.maxIQ, 4, 'Max IQ');
        deepEqual(data.seed.world.statistic.yearMaxIQ, 10, 'Year of max IQ');
        start();
    });

    world.addSeed(world.Seed);
});

asyncTest('knowledge.seedAdded from parent', function() {
    var world = new WorldJS();
    world.init('qunit-fixture');
    world.speed = 5;

    var worldStatistic = world.statistic = new WorldJS.Statistic(world),
        worldRules = world.rules = new WorldJS.Rules(world),
        worldKnowledge = world.knowledge = new WorldJS.Knowledge(world);

    world.random = function(min, max) {
        return max;
    };
    worldStatistic.year = 10;
    worldRules.baseIQ = 1;

    // Add a man and a woman (both have IQ 4)
    var male = world.addSeed(world.Male, {
            age: 20,
                chances: {
                // 0% death rate
                death: [{range: [1, 100], from: 0, to: 0}],
                // 100% childbirth success chance
                marriage: [{range: [1, 100], from: 1, to: 1}]
            }
        }),
        female = world.addSeed(world.Female, {
            age: 20,
            chances: {
                // 0% death rate
                death: [{range: [1, 100], from: 0, to: 0}],
                // 100% childbirth success chance
                childbirth: [{range: [1, 100], from: 1, to: 1}]
            }
        });
    // They get married
    male.tickCount += world.speed - 1;
    male.tick(world.speed);

    world.event.add('seedAdded', 'test', function(data) {
        deepEqual(data.seed.iq, 8, 'Average IQ of parent + random IQ + base IQ');
        deepEqual(data.seed.world.statistic.maxIQ, 8, 'Max IQ');
        deepEqual(data.seed.world.statistic.yearMaxIQ, 10, 'Year of max IQ');
        start();
    });
    // And have a child
    female.age += 2;
    female.tickCount += world.speed - 2;
    female.tick(world.speed);
});

test('total IQ', function() {
    var world = new WorldJS();
    world.init('qunit-fixture');

    var worldStatistic = world.statistic = new WorldJS.Statistic(world),
        worldRules = world.rules = new WorldJS.Rules(world),
        worldKnowledge = world.knowledge = new WorldJS.Knowledge(world);

    world.random = function(min, max) {
        return max;
    };

    deepEqual(worldStatistic.iq, 0, 'Total IQ: 0');

    var seed1 = world.addSeed(world.Seed);
    deepEqual(worldStatistic.iq, 3, 'Total IQ: 3');
    var seed2 = world.addSeed(world.Seed);
    deepEqual(worldStatistic.iq, 6, 'Total IQ: 6');

    world.removeSeed(seed1);
    deepEqual(worldStatistic.iq, 3, 'Total IQ: 3');
    world.removeSeed(seed2);
    deepEqual(worldStatistic.iq, 0, 'Total IQ: 0');
});
/*
test('knowledge.gain', function() {
    var world = new WorldJS();
    world.init('qunit-fixture');

    var worldStatistic = world.statistic = new WorldJS.Statistic(world),
        worldKnowledge = world.knowledge = new WorldJS.Knowledge(world);

    world.random = function(min, max) {
        return max;
    };
    worldStatistic.year = 10;
    worldStatistic.iq = 100;

    // No knowledge has been added yet
    worldKnowledge.gain();
    deepEqual(worldKnowledge.trending.length, 0, 'No trending knowledge');
    deepEqual(worldKnowledge.completed.length, 0, 'No completed knowledge');

    // Define 4 knowledge
    worldKnowledge.list = {
        kno1: {id: 'kno1', iq: {priority: 0.1, gained: 0, required: 1000}},
        kno2: {id: 'kno2', iq: {priority: 1, gained: 0, required: 1000}},
        kno3: {id: 'kno3', iq: {priority: 2, gained: 0, required: 1000}, following: ['kno4']},
        kno4: {id: 'kno4', iq: {priority: 2, gained: 0, required: 1000}}
    };
    // Add 3 knowledge
    worldKnowledge.trending.push('kno1');
    worldKnowledge.trending.push('kno2');
    worldKnowledge.trending.push('kno3');

    worldKnowledge.gain();
    // IQ for kno1: 100 * 10  / 410 = 2.4
    // IQ for kno2: 100 * 100 / 410 = 24.4
    // IQ for kno2: 100 * 200 / 410 = 48.8
    // Wasted IQ:   100 * 100 / 410 = 24.4
    deepEqual(worldKnowledge.list.kno1.iq.gained, 2, 'Low priority knowledge');
    deepEqual(worldKnowledge.list.kno2.iq.gained, 24, 'Normal priority knowledge');
    deepEqual(worldKnowledge.list.kno3.iq.gained, 48, 'High priority knowledge');

    // Modify the required IQ of 3 knowledge
    // to check the max value that can be gained
    worldKnowledge.list.kno1.iq.required = 100;
    worldKnowledge.list.kno2.iq.required = 100;
    worldKnowledge.list.kno3.iq.required = 100;
    worldKnowledge.gain();
    deepEqual(worldKnowledge.list.kno1.iq.gained, 3, 'Low priority knowledge: 2 + 1');
    deepEqual(worldKnowledge.list.kno2.iq.gained, 29, 'Normal priority knowledge: 24 + 5');
    deepEqual(worldKnowledge.list.kno3.iq.gained, 58, 'High priority knowledge: 48 + 10');

    // Complete some knowledge
    worldKnowledge.list.kno1.iq.gained = 99;
    worldKnowledge.list.kno2.iq.gained = 35;
    worldKnowledge.list.kno3.iq.gained = 95;
    worldKnowledge.gain();
    deepEqual(worldKnowledge.list.kno1.iq.gained, 100, 'Knowledge 1 is completed');
    deepEqual(worldKnowledge.list.kno1.affectedYear, 10, 'Affected year of knowledge 1');
    deepEqual(worldKnowledge.list.kno2.iq.gained, 40, 'Knowledge 2 is not completed');
    deepEqual(worldKnowledge.list.kno3.iq.gained, 100, 'Knowledge 3 is completed');
    deepEqual(worldKnowledge.list.kno3.affectedYear, 10, 'Affected year of knowledge 3');
    deepEqual(worldKnowledge.trending.length, 2, 'Contains knowledge 2 & 4');
    deepEqual(worldKnowledge.completed.length, 2, 'Knowledge 1 & 3 are completed');
});

asyncTest('knowledge.gain', function() {
    var world = new WorldJS();
    world.init('qunit-fixture');

    var worldStatistic = world.statistic = new WorldJS.Statistic(world),
        worldKnowledge = world.knowledge = new WorldJS.Knowledge(world);

    world.random = function(min, max) {
        return max;
    };
    worldStatistic.year = 10;
    worldStatistic.iq = 100;

    worldKnowledge.list = {
        know: {
            id: 'know',
            iq: {priority: 1, gained: 95, required: 100},
            onAffected: function(world) {
                deepEqual(
                    world.knowledge.list.know.affectedYear,
                    10,
                    'Access this knowledge from callback function'
                );
                start();
            }
        }
    };
    worldKnowledge.trending.push('know');
    worldKnowledge.gain();
});*/