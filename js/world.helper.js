/*!
 * world.helper.js
 * Helper functions
 *
 * World JS: Evolution Simulator
 * https://github.com/anvoz/world-js
 * Copyright (c) 2013 An Vo - anvo4888@gmail.com
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

(function(window, undefined) {
    'use strict';

    var WorldJS = window.WorldJS;

    WorldJS.Helper = {
        is: function(obj, type) {
            return typeof obj === type;
        },

        has: function(obj, prop) {
            return obj.hasOwnProperty(prop);
        },

        random: function(min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        }
    };
})(window);