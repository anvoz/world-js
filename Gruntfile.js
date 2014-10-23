/*!
 * Gruntfile.js
 * WorldJS's Gruntfile
 *
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013-2014 An Vo - anvo4888@gmail.com
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 */


module.exports = function(grunt) {
  'use strict';


  // Force use of Unix newlines
  grunt.util.linefeed = '\n';


  // Project configuration
  // ======================
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    banner: {
      wjs: '/*!\n' +
        ' * World JS\n' +
        ' * Version <%= pkg.version %>\n' +
        ' *\n' +
        ' * <%= pkg.homepage %>\n' +
        ' * Copyright (c) 2013-<%= grunt.template.today("yyyy") %> <%= pkg.author.name %> - <%= pkg.author.email %>\n' +
        ' * Licensed under <%= pkg.license.mit.name %> (<%= pkg.license.mit.url %>)\n' +
        ' */\n',
      wjs_hs: '/*!\n' +
        ' * World JS: History Simulation\n' +
        ' * Version <%= pkg.version %>\n' +
        ' *\n' +
        ' * <%= pkg.homepage %>\n' +
        ' * Copyright (c) 2013-<%= grunt.template.today("yyyy") %> <%= pkg.author.name %> - <%= pkg.author.email %>\n' +
        ' * Licensed under <%= pkg.license.mit.name %> (<%= pkg.license.mit.url %>)\n' +
        ' */\n'
    },


    // Task configuration
    // ======================

    clean: {
      dist: 'dist'
    },

    concat: {
      options: {
        separator: '\n\n'
      },

      // World JS
      wjs: {
        src: [
          'scripts/core.js',
          'scripts/tile.js',
          'scripts/event.js',
          'scripts/seed.js',
          'scripts/male.js',
          'scripts/female.js'
        ],
        dest: 'dist/scripts/world.js'
      },
      // World JS: History Simulation
      wjs_hs: {
        src: [
          'dist/scripts/world.js',
          'scripts/statistic.js',
          'scripts/rules.js',
          'scripts/knowledge.js',
          'scripts/language/language.en.js',
          'scripts/knowledge.data.js',
          'scripts/guide.js',
          'scripts/interface.js',
          'scripts/story.js'
        ],
        dest: 'dist/scripts/world.history.js'
      }
    },

    csslint: {
      options: {
        'adjoining-classes':      false,
        'box-model':              false,
        ids:                      false,
        important:                false,
        'regex-selectors':        false,
        'star-property-hack':     false,
        'unqualified-attributes': false
      },
      src: 'stylesheets/style.css'
    },

    cssmin: {
      compress: {
        options: {
          banner:               '<%= banner.wjs_hs %>',
          keepSpecialComments:  0,
          report:               'min'
        },
        src:  'stylesheets/style.css',
        dest: 'dist/stylesheets/style.min.css'
      }
    },

    jshint: {
      options: {
        expr:     true,
        loopfunc: true,
        quotmark: 'single'
      },

      // Files
      grunt: {
        src: 'Gruntfile.js'
      },
      language: {
        options: {
          // Suppress warning about bad escaping of EOL
          '-W043':  true,
          quotmark: 'double'
        },
        files: {
          src: 'scripts/language/*.js'
        }
      },
      src: {
        src: 'scripts/*.js'
      },
      test: {
        src: 'tests/*.js'
      }
    },

    qunit: {
      files: 'tests/index.html'
    },

    uglify: {
      options: {
        report: 'min'
      },

      // World JS
      wjs: {
        options: {
          banner: '<%= banner.wjs %>'
        },
        src:  '<%= concat.wjs.dest %>',
        dest: 'dist/scripts/world.min.js'
      },
      // World JS: History Simulation
      wjs_hs: {
        options: {
          banner: '<%= banner.wjs_hs %>'
        },
        src:  '<%= concat.wjs_hs.dest %>',
        dest: 'dist/scripts/world.history.min.js'
      }
    },

    validation: {
      options: {
        charset:  'utf-8',
        doctype:  'HTML5',
        failHard: true,
        reset:    true,
        relaxerror: [
          'Attribute autocomplete not allowed on element button at this point.',
          'Bad value X-UA-Compatible for attribute http-equiv on element meta.'
        ]
      },
      files: {
        src: '*.html'
      }
    }
  });

  // These plugins provide necessary tasks
  require('load-grunt-tasks')(grunt);

  // HTML validation task
  grunt.registerTask('validate-html', ['validation']);

  // Test task
  grunt.registerTask('test', ['jshint', 'qunit', 'csslint', 'validate-html']);

  // JS distribution task
  grunt.registerTask('dist-js', ['concat', 'uglify']);

  // CSS distribution task
  grunt.registerTask('dist-css', ['cssmin']);

  // Full distribution task
  grunt.registerTask('dist', ['clean', 'dist-js', 'dist-css']);

  // Default task
  grunt.registerTask('default', ['test', 'dist']);
};
