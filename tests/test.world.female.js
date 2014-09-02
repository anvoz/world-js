module('female');


test('female.tick', function() {
  var world = new WorldJS();
  world.init('qunit-fixture');
  world.speed = 5;

  // Add a woman
  var female = world.addSeed(world.Female, {
    x:   50,
    y:   50,
    age: 20,
    ageToMoveAgain: 100, // Stand still
    chances: {
      // 0% death rate
      death: [{ range: [1, 100], from: 0, to: 0 }],
      // 0% childbirth success chance
      childbirth: [{ range: [1, 100], from: 0, to: 0 }]
    }
  });
  // Not move anywhere
  female.moveUntilStep = female.stepCount;

  // Add a man
  var male = world.addSeed(world.Male, {
    x:   50,
    y:   50,
    age: 20,
    chances: {
      // 0% death rate
      death: [{ range: [1, 100], from: 0, to: 0 }],
      // 100% marriage success chance
      marriage: [{ range: [1, 100], from: 1, to: 1 }]
    }
  });

  // They are married to each other
  male.tickCount += 3;
  male.tick(world.speed);
  deepEqual(female.relationSeed, male, 'The man and the woman get married to each other');

  // Not give birth yet
  female.tickCount += world.speed - 1;
  female.tick(world.speed);
  deepEqual(female.totalChildren, 0, '1st: Married but the wife does not give birth yet (0% chance)');

  // 100% childbirth success chance
  female.chances.childbirth = [{ range: [1, 100], from: 1, to: 1 }];
  // But still not give birth right after married
  female.tickCount += world.speed;
  female.tick(world.speed);
  deepEqual(female.totalChildren, 0, '2nd: 100% chance now but does not give birth right after married');

  // Ready to give birth
  female.age       += 2;
  female.tickCount += world.speed;
  female.tick(world.speed);
  deepEqual(female.totalChildren, 1, '3rd: She gives birth after 2 year of marriage');

  // Next year
  female.age       += 1;
  female.tickCount += world.speed;
  female.tick(world.speed);
  deepEqual(female.totalChildren, 1, '4th: None for the next year');

  // Another year
  female.age       += 1;
  female.tickCount += world.speed;
  female.tick(world.speed);
  deepEqual(female.totalChildren, 2, '5th: Another child is born 2 year after the first one');

  // Her husband dies
  world.removeSeed(male);
  deepEqual(female.relationSeed, false, 'Her husband is dead - Single again');
  female.age       += 5;
  female.tickCount += world.speed;
  female.tick(world.speed);
  deepEqual(female.totalChildren, 2, '6th: Not give birth anymore because she is single now');

  // Add another man
  var male2 = world.addSeed(world.Male, {
    x:   50,
    y:   50,
    age: 30,
    chances: {
      // 0% death rate
      death: [{ range: [1, 100], from: 0, to: 0 }],
      // 100% marriage success chance
      marriage: [{ range: [1, 100], from: 1, to: 1 }]
    }
  });
  male2.tickCount += 3;
  male2.tick(world.speed);
  deepEqual(female.relationSeed, male2, 'The new man get married to her');

  // Again, not give birth right after married
  female.tickCount += world.speed;
  female.tick(world.speed);
  deepEqual(female.totalChildren, 2, '7th: Again, does not give birth right after married');

  // Give birth again
  female.age       += 2;
  female.tickCount += world.speed;
  female.tick(world.speed);
  deepEqual(female.totalChildren, 3, '8th: She gives birth again after 2 year of marriage');

  // She dies
  female.chances.death = [{ range: [1, 100], from: 1, to: 1 }];
  female.tickCount     += world.speed;
  female.tick(world.speed);
  deepEqual(male2.relationSeed, false, '9th: She dies - Her husband is single again');
  deepEqual(world.totalSeeds,   4,     'Her husband and 3 children still live in the world');
});
