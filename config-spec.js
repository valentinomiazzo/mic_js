/*jslint browser: true, bitwise: true, nomen: true, todo: true, vars: true, indent: 4 */
/*global require */
(function() {
    'use strict';

    var allTestFiles = [];
    var TEST_REGEXP = /^.+\/spec\/.+\.js$/i;

    Object.keys(window.__karma__.files).forEach(function(file) {
        if (TEST_REGEXP.test(file)) {
            allTestFiles.push(file);
        }
    });

    // This overides what defined in config.js
    require.config({
        // Karma serves files under /base, which is the basePath from your config file
        baseUrl: '/base/js/src',

        paths: {
            spec: '../spec',
            "In": "../../bower_components/in_js/js/src/In",
            "Mxr": "../../bower_components/mxr_js/js/src/Mxr"
        },

        // dynamically load all test files
        deps: allTestFiles,

        config: {
        },

        // we have to kickoff jasmine, as it is asynchronous
        callback: window.__karma__.start
    });
})();