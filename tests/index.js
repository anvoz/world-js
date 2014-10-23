(function() {

  require.config({
    baseUrl: "../scripts",
  });

  var testModules = [
    'test.core.js',
    'test.event.js',
    'test.female.js',
    'test.guide.js',
    'test.knowledge.data.js',
    'test.knowledge.js',
    'test.male.js',
    'test.rules.js',
    'test.seed.js',
    'test.statistic.js',
    'test.tile.js'
  ];

  require(testModules, function() {
    QUnit.load();
    QUnit.start();
  });

})();
