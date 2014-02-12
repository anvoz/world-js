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

    // Project configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // Task configuration
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
        }
    });

    // Load plugins
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');

    // Default tasks
    grunt.registerTask('default', ['jshint', 'qunit']);
};