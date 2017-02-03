# Mic.js #

`Mic.js` (from _M_ ixins _I_ nerithance _C_ ontracts) is a library that provides a form of [Design By Contract](https://en.wikipedia.org/wiki/Design_by_contract). It extends [`Mxr.js`](https://github.com/valentinomiazzo/mxr_js) and [`In.js`](https://github.com/valentinomiazzo/in_js) providing easy access to inheritance and mixin concepts. `Mic.js` is under MIT license.

## Example ##

```javascript
// We assume you know what Design By Contract is and why it is useful.

// Let's define our interface ...
function Computable() {}
Computable.prototype.compute = Mic.anAbstract();

// Now, let's define pre-conditions and post-condition for our method.

// The pre-condition takes the same parameters of the method.
// In this case the pre-condition asserts that the passed parameter must be a number.
Computable.prototype.compute.pre = function (x) {
    Mic.assert(typeof x === "number");
};

// The post-condition takes an additional parameter which is the returned value.
// In this case the post-condition asserts that returned value is not null or undefined.
Computable.prototype.compute.post = function (result, x) {
    Mic.unused(x);                  // This optional statement documents x is not used.
                                    // It also avoids warnings from tools like JSlint.
    Mic.assert(result !== null);
    Mic.assert(result !== undefined);
};

// After defining all the pre and post conditions we have to seal the contract.
// This is where the library does its magic by injecting code.
Mic.sealAsAbstract(Computable);

// Now, another developer implements the interface

function Len() {}
Len.prototype.compute = function (x) {
    // Let's pretend this is a complex piece of code
    if (x > 0) { return x*x; }
}
Mic.inheritFrom(Len, Computable);
Mic.seal(Len);

// Now, a third developer uses Len

var len = new Len();
len.compute(2);       // Returns 4.
len.compute("hello"); // Returns an exception that shows a violation of the pre-condition.
                      // This is useful to the 3rd developer. It clarifies how to use the interface.
len.compute(-1);      // Returns an exception that shows a violation of the post-condition.
                      // This is useful to the 2nd developer. It clarifies how to implement the interface.
```

## What problem solves? ##

Javascript is a scripting language, it was not designed for large code bases. Nevertheless every conceivable API is making its way in browsers making them the perfect playground for new generations. Node.js  has broken the wall and made possible to use Javascript outside browsers. As Atwood's Law says 'any application that can be written in JavaScript will eventually be written in JavaScript'.

`Mic.js` tries to address the problem of the large scale Javascript programming by introducing the Design by Contract in the toolbox of the developer.

`Mic.js` allows to attach pre and post conditions to instance methods of a class. These pre and post conditions are checked at runtime when the method is invoked.

With this simple mechanism the developer can properly communicate the contract bound to a method. For example, by checking the type of each parameter it is possible to define the signature of a method.

But there is more. Contracts aren't declarative, they're imperative. In other words pre and post conditions contains code. Complex constraints can be implemented like those around variadic methods.

`Mic.js` is very helpful when writing frameworks. We can attach pre and post conditions to abstract methods, in other words we can enforce a contract on a interface. The contract is inherited by the classes implementing the interface and, thanks to mix-ins, a class can implement multiple interfaces. This is really powerful.

`Mic.js` watches your back doing some checks under the hoods. For example it warns when you try to instantiate a class with abstract methods or when it finds that you are violating the covariance and contravariance rules.

## Docs and examples ##

Docs are available [here](https://rawgit.com/valentinomiazzo/mic_js/master/build/docs/classes/Mic.html). Anyway, since it extends `In.js` and `Mxr.js`, you may want to read [here](https://rawgit.com/valentinomiazzo/in_js/master/build/docs/classes/In.html) and [here](https://rawgit.com/valentinomiazzo/mxr_js/master/build/docs/classes/Mxr.html).
As examples you can use the [spec](js/spec/Mic.js) file used for unit testing. [Coverage reports](https://rawgit.com/valentinomiazzo/mic_js/master/build/coverage/PhantomJS%202.1.1%20(Windows%208%200.0.0)/src/Mic.js.html) are available too.

## How do I get set up? ##

* How to use the lib
    * The lib is a [Bower](http://bower.io) component.
        * You have to add it to `bower.json` in your project.
        ```javascript
        {
            ...
            "dependencies": {
                "mic_js": "https://github.com/valentinomiazzo/mic_js.git"
            },
            ...
        }
        ```
        * After that, Bower will install it and its dependencies in the folder defined by `.bowerrc` in your project.
    * The lib is a [Require.js](http://require.js) module.
        * You have to add it and its dependencies to your `require.config()`
        ```javascript
        require.config({
            baseUrl: ".",
            paths: {
                "Mic": "bower_components/mic_js/js/src/Mic",
                "Mxr": "bower_components/mxr_js/js/src/Mxr",
                "In": "bower_components/in_js/js/src/In"
            },
            ...
        });
        ```
        * From code you can use it in this way
        ```javascript
        define([
            "Mic"
        ], function(Mic) {
            //your code
        };
        ```
    * If you use [Karma](http://karma-runner.github.io/) for testing then don't forget to load the lib files
    ```javascript
    config.set({
        basePath: '',

        files: [{
            pattern: 'bower_components/in_js/js/src/In.js',
            included: false
        }, {
            pattern: 'bower_components/mxr_js/js/src/Mxr.js',
            included: false
        }, {
            pattern: 'bower_components/mic_js/js/src/Mic.js',
            included: false
        },
        ... ],

        ...
    });
    ```
* How to modify the lib, run tests, etc...
    * Prerequisites
        * install [Node.js](http://nodejs.org/) (tested with 0.10.31, 4.2.6 and 6.2.1)
        * install [Npm](https://www.npmjs.com/) (tested with 2.8.3, 3.5.2 and 3.9.5)
        * `npm install grunt-cli -g`
    * Install
        * clone this repository
        * in the root of the cloned repo, type (on Windows you may need to disable antivirus if you get strange issues during the install):
        * `npm install`
        * On some platforms you may need to install `apt-get install nodejs-legacy` if the command above doesn't work.
    * Build
        * `grunt`
        * docs are generated in `build/docs`
    * Test
        * [Jasmine](https://jasmine.github.io/) it is used for testing.
        * tests are in `js/spec`
        * tests reports are in `build/tests`
        * coverage reports are in `build/coverage`

## Contribution guidelines ##

* For pull requests
    * go [here](../../pulls)
* For issues
    * go [here](../../issues)

## Limitations ##

These are some limitation of the current implementation of `Mic.js`.

1. class invariants are not supported
1. pre and postconditions on static methods are not supported
1. there is not a pre-processor for removing contracts (e.g. before minification)
