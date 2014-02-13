/*!
 * Gruntfile.js
 * WorldJS's Gruntfile
 *
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013-2014 An Vo - anvo4888@gmail.com
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 */

module.exports = function (grunt) {
    'use strict';

    // Force use of Unix newlines
    grunt.util.linefeed = '\n';

    // Project configuration
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
                ' * Code released under <%= pkg.license.mit.name %> (<%= pkg.license.mit.url %>)\n' +
                ' * Knowledge data and language released under <%= pkg.license.cc.name %> (<%= pkg.license.cc.url %>)\n' +
                ' */\n'
        },

        // Task configuration
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
                    'js/world.core.js',
                    'js/world.tile.js',
                    'js/world.event.js',
                    'js/world.seed.js',
                    'js/world.male.js',
                    'js/world.female.js'
                ],
                dest: 'dist/js/world.js'
            },
            // World JS: History Simulation
            wjs_hs: {
                src: [
                    'dist/js/world.js',
                    'js/world.statistic.js',
                    'js/world.rules.js',
                    'js/world.knowledge.js',
                    'js/language/world.language.en.js',
                    'js/world.knowledge.data.js',
                    'js/world.guide.js',
                    'js/world.interface.js',
                    'js/world.story.js'
                ],
                dest: 'dist/js/world.history.js'
            }
        },
        csslint: {
            options: {
                'adjoining-classes': false,
                'box-model': false,
                ids: false,
                important: false,
                'regex-selectors': false,
                'star-property-hack': false,
                'unqualified-attributes': false
            },
            src: 'css/style.css'
        },
        cssmin: {
            compress: {
                options: {
                    banner: '<%= banner.wjs_hs %>',
                    keepSpecialComments: 0,
                    report: 'min'
                },
                src: 'css/style.css',
                dest: 'dist/css/style.min.css'
            }
        },
        jshint: {
            options: {
                expr: true,
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
                    '-W043': true,
                    quotmark: 'double'
                },
                files: {
                    src: 'js/language/*.js'
                }
            },
            src: {
                src: 'js/*.js'
            },
            test: {
                src: 'tests/*.js'
            },
        },
        qunit: {
            files: 'tests.html'
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
                src: '<%= concat.wjs.dest %>',
                dest: 'dist/js/world.min.js'
            },
            // World JS: History Simulation
            wjs_hs: {
                options: {
                    banner: '<%= banner.wjs_hs %>'
                },
                src: '<%= concat.wjs_hs.dest %>',
                dest: 'dist/js/world.history.min.js'
            }
        }
    });

    // Load plugins
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-csslint');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // Test task
    grunt.registerTask('test', ['jshint', 'qunit', 'csslint']);

    // JS distribution task
    grunt.registerTask('dist-js', ['concat', 'uglify']);

    // CSS distribution task
    grunt.registerTask('dist-css', ['cssmin']);

    // Full distribution task
    grunt.registerTask('dist', ['clean', 'dist-js', 'dist-css']);

    // Default task
    grunt.registerTask('default', ['test', 'dist']);
};