/*global module, require */

module.exports = function(config) {
    "use strict";

    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine', 'requirejs', 'phantomjs-shim'],

        // list of files / patterns to load in the browser
        files: [{
            pattern: 'config.js',
            included: true
        }, {
            pattern: 'config-spec.js',
            included: true
        }, {
            pattern: 'js/spec/*.js',
            included: false
        }, {
            pattern: 'js/src/*.js',
            included: false
        }, {
            pattern: 'bower_components/in_js/js/src/In.js',
            included: false
        }, {
            pattern: 'bower_components/mxr_js/js/src/Mxr.js',
            included: false
        } ],

        // list of files to exclude
        exclude: [],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        // I'm excluding ext folders because they contain 3rd party code.
        preprocessors: {},

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: [
            'progress'
        ],

        // web server port
        port: 8888,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Chrome', 'Firefox', 'PhantomJS'/*, 'IE'*/ ],

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false

    });

};
