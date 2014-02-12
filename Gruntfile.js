module.exports = function (grunt) {
    'use strict';

    // Project configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        qunit: {
            files: 'tests.html'
        }
    });

    // Load plugin
    grunt.loadNpmTasks('grunt-contrib-qunit');

    // Default task
    grunt.registerTask('default', ['qunit']);
};