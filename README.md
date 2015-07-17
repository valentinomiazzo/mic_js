# Mic.js #

`Mic.js` (from _M_ ixins _I_ nerithance _C_ ontracts) is a library that provides a form of [Design By Contract](https://en.wikipedia.org/wiki/Design_by_contract). It extends [`Mxr.js`](https://github.com/valentinomiazzo/mxr_js) and [`In.js`](https://github.com/valentinomiazzo/in_js) providing easy access to inheritance and mixin concepts.

## Example ##

```javascript
// We assume you know what Design By Contract is and why it is useful.

// Let's define our interface ...
function Computable() {}
Computable.prototype.compute = Mic.anAbstract();

// Now, let's define pre-conditions and post-condition for our method.

// The pre-condition takes the same parameters of compute() and
// asserts that the passed parameter must be a number.
Computable.prototype.compute.pre = function (x) {
    Mic.assert(typeof x === "number");
};

// The post-condition takes an additional parameter which is the returned value.
// In this case the post-condition asserts that returned value is not null or undefined.
Computable.prototype.compute.post = function (result, x) {
    Mic.unused(x);                  // This optional statement documents x is not used.
                                    // It also avoids warnings from tools like JSlint.
    Mic.assert(result != null);
    Mic.assert(result != undefined);
};

// After defining all the pre and post conditions we have to seal the contract.
// This is where the library does its magic injecting code.
Mic.sealAbstract(Computable);

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
len.compute("hello"); // Returns an exception that clearly shows a violation of the pre-condition.
                      // This is useful to the third developer clarifying how to use the interface.
len.compute(-1);      // Returns an exception that clearly shows a violation of the post-condition.
                      // This is useful to the second developer clarifying how to implement the interface.
```

## Docs and examples ##

Docs are available [here](build/docs/classes/Mic.html).
As examples you can use the [spec](js/spec/Mic.js) file used for unit testing. [Coverage reports](build/coverage/PhantomJS%201.9.8%20(Windows%207%200.0.0)/js/src/Mic.js.html) are available too.

## How do I get set up? ##

* How to use the lib
    * The lib is a [Require.js](http://require.js) compatible module.
    * How to add it to a project ....
* Summary of set up
    * install [Node.js](http://nodejs.org/)
    * install [Npm](https://www.npmjs.com/)
    * `npm install grunt-cli -g`
    * clone this repository
    * in the root of the cloned repo, type (on Windows you may need to disable antivirus if you get strange issues during the install):
        * `npm install`
* How to run tests and generate docs
    * in the root of the cloned repo, type:
        * `grunt`
        * tests reports are in `build/tests`
        * coverage reports are in `build/coverage`
        * docs are generated in `build/docs`

## Contribution guidelines ##

* Writing tests
    * [Jasmine](https://jasmine.github.io/) it is used for testing.
    * tests are in `js/spec`
* For pull requests
    * go [here](../../pulls)
* For issues
    * go [here](../../issues)

## What problem solves? ##

...

## Advanced concepts ##

...