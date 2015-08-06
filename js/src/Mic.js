/*!
*  Mic.js 0.0.0
*
*  (c) 65c02
*
*  MIT license
*
*  https://bitbucket.org/65c02/mic_js
*/

/*jshint browser: true, bitwise: true, nomen: true, plusplus: true, indent: 4, expr: false, -W030 */
/*global define*/

define([
    "module", "Mxr", "In"
], function(module, Mxr, In) {
    "use strict";

    function _s_copy(dst, src) {
        var member;
        for (member in src) {
            if (src.hasOwnProperty(member)) {
                dst[member] = src[member];
            }
        }
    }

    /**
    This is the collection of static methods exposed by Mic.js

    @class Mic
    @static
    */
    var Mic = {};
    module.config.In = In;          //we force In.js mixing
    Mxr.configure(module.config);   //we mix In.js before using it
    _s_copy(Mic, Mxr);              //we mix Mxr.js and In.js in Mic.js

    /**
    Configures the library.
    It expects a JSON like the following:

        {
            "assert" : callback,
            "disableContractChecks": boolean
        }

    It is called at load time by require.js passing as `config` the config of the module.
    Anyway, you can call it again anytime.
    It calls `In.configure()` and `Mxr.configure()` internally.

    Fields description:

    `assert`:
    Optional. The signature is `void assert(boolean, String)`.
    Replaces the default implementation of `Mic.assert` with your own.
    If you pass `null` then assertions are disabled.
    If you pass `undefined` then the default implementation is used.

    `disableContractChecks`:
    Optional. If true then pre and post conditions are not injected and therefore checked.
    This is useful when the code is ready for production and speed matters.

    @method configure
    @static
    @param config {Object} the configuration object
    @throws {Error} if `config` is null or undefined or not an Object
    */
    //We replace the configure copied from Mxr with our own.
    Mic.configure = function (config) {
        Mic.assert && Mic.assert(config, "config is null or undefined");
        Mic.assert && Mic.assert(config instanceof Object, "config is not an Object");

        if (config.assert) {
            Mic.assert && Mic.assert(typeof config.assert === "function", "assert is not a function");
            Mic.assert = config.assert;
        } else if (config.assert === null) {
            Mic.assert = null;
        } else {
            Mic.assert = _defaultAssert;
        }

        if (config.disableContractChecks) {
            Mic._DISABLE_CONTRACTS_CHECKS = true;
        }

        Mxr.configure(config);
    };

    Mic.configure(module.config());

    Mic._IS_SEALED = Mic._UTL_PFX + "_isSealed";
    Mic._COVARIANCE_VIOLATION__MSG = "covariance violated";
    Mic._CONTRAVARIANCE_VIOLATION_MSG = "contravariance violated";
    Mic._PRE = "pre";
    Mic._POST = "post";
    Mic._DISABLE_CONTRACTS_CHECKS = false;

    var _defaultAssert = function(trueish, message) {
        if (!trueish) {
            throw new Error(message || "Mic.assert violated ...");
        }
    };

    /**
    If `trueish` is not true then it throws an Error.

    @method assert
    @static
    @param trueish {boolean} the predicate
    @param [message] {String} the message to pass in the Error
    @throws {Error} if `trueish` is false
    */
    Mic.assert = _defaultAssert;

    /**
    Declares you don't use variable and shuts up Jslint & Co.

        function f(x, y) {
            Mic.unused(x & y);
        }

    @method unused
    @static
    @param x {anything} a variable
    */
    Mic.unused = function (x) { x = x && 0; };

    /**
    Declares a block is empty by purpose and shuts up Jslint & Co.

        {
            Mic.empty();
        }

    @method empty
    @static
    */
    Mic.empty = function() { Mic.unused(0); };

    /**
    Seals the contract of `clazz`.
    Must be called after all the methods, pre-conditions, post-conditions, mixins and inheritance have been declared.
    @method seal
    @static
    @param clazz {Function} the class with contract.
    @throws {Error} if `clazz` is already sealed
    @throws {Error} if `clazz` contains an abstract method
    */
    Mic.seal = function (clazz) {
        Mic._seal(clazz, false);
    };

    /**
    Like `seal` but it doesn't throw an Error if the class contains abstract methods.
    @method sealAsAbstract
    @static
    @param clazz {Function} the class with contract.
    @throws {Error} if `clazz` is already sealed
    */
    Mic.sealAsAbstract = function (clazz) {
        Mic._seal(clazz, true);
    };

    Mic._seal = function (clazz, isAbstractClass) {
        Mic.assert && Mic.assert(clazz, "clazz is null or undefined");
        Mic.assert && Mic.assert(clazz instanceof Function, "clazz is not a class, more specifically it is not of type Function.");
        Mic.assert && Mic.assert(!Mic.isSealed(clazz), "clazz is already sealed.");
        var cp = clazz.prototype;
        var memberName;
        var member;
        var synth;
        var conditions;
        if (!Mic._DISABLE_CONTRACTS_CHECKS) {
            for (memberName in cp) {
                if (cp.hasOwnProperty(memberName)) {
                    member = cp[memberName];
                    if (member instanceof Function) {
                        if (!Mic.isAbstract(member)) {
                            conditions = Mic._findConditions(cp, memberName);
                            synth = Mic._synthetize(member, conditions);
                            cp[memberName] = synth;
                        } else {
                            Mic.assert && Mic.assert(
                                isAbstractClass,
                                "Found an abstract method on a not abstract class. Class " + clazz.name + " Method " + memberName
                            );
                        }
                    }
                }
            }
        }
        cp[Mic._IS_SEALED] = true;
    };

    /**
    Return true if `seal` or `sealAsAbstract` have been invoked on `clazz`.
    @method isSealed
    @static
    @param clazz {Function} the class to check.
    @throws {Error} if `clazz` is null or undefined or not a Function
    */
    Mic.isSealed = function (clazz) {
        Mic.assert && Mic.assert(clazz, "clazz is null or undefined");
        Mic.assert && Mic.assert(clazz instanceof Function, "clazz is not a class, more specifically it is not of type Function.");
        return clazz.prototype.hasOwnProperty(Mic._IS_SEALED);
    };

    Mic._findConditions = function (prototype, memberName) {
        var member;
        var result = { pre: [], post: [] };
        var pre;
        var post;
        while (prototype) {
            member = prototype[memberName];
            if (member) {
                pre = member[Mic._PRE];
                post = member[Mic._POST];
                if (pre) {
                    result.pre.push(pre);
                }
                if (post) {
                    result.post.push(post);
                }
            }
            prototype = Object.getPrototypeOf(prototype);
        }
        return result;
    };

    //This method is needed in order to avoid creation of false closures in the for cycle
    Mic._synthetize = function (member, conditions) {
        var synthType = 0;
        var preconditions = conditions.pre;
        var postconditions = conditions.post;
        if (preconditions.length > 0) { synthType += 1; }
        if (postconditions.length > 0) { synthType += 2; }
        var synth;
        switch (synthType) {
        case 0:
            return member;
        case 1:
            synth = function Mic_check1() {
                Mic._callPreConditions(preconditions, this, arguments);
                var result = member.apply(this, arguments);
                return result;
            };
            synth[Mic._PRE] = member[Mic._PRE];
            delete member[Mic._PRE];
            break;
        case 2:
            synth = function Mic_check2() {
                var result = member.apply(this, arguments);
                Mic._callPostConditions(postconditions, this, result, arguments);
                return result;
            };
            synth[Mic._POST] = member[Mic._POST];
            delete member[Mic._POST];
            break;
        case 3:
            synth = function Mic_check3() {
                Mic._callPreConditions(preconditions, this, arguments);
                var result = member.apply(this, arguments);
                Mic._callPostConditions(postconditions, this, result, arguments);
                return result;
            };
            synth[Mic._PRE] = member[Mic._PRE];
            delete member[Mic._PRE];
            synth[Mic._POST] = member[Mic._POST];
            delete member[Mic._POST];
            break;
        }
        Mic.assert && Mic.assert(synth, "Internal error: not able to synthetize a conditions wrapper for member " + member);
        return synth;
    };

    Mic._callPreConditions = function (preconditions, instance, args) {
        //Covariance: precondition can only be relaxed.
        //
        //The first consequence is you do not want to add preconditions
        //to existing ones. You want to replace existing ones with a new
        //one with relaxed constraints.
        //
        //Therefore a new precondition replace the old one.
        //
        //It could happen the new one is stricter than the old one.
        //The covariance check verify this in this way:
        //If the new precondition fails, the old preconditions are failing too.
        //If it is not true then it means the new one is stricter than the old
        //ones and the covariance rule is violated.
        //
        // P = pass, F = fail
        //
        // 1 [OK] PPPPPPPP
        // 2 [OK] PPPPFFFF
        // 3 [OK] FFFFFFFF
        // 4 [KO] FFFP****
        // 5 [KO] PPFFP***
        //
        //So **FP** means violation.
        //We don't check case 5 (and 2) because it would slow down the system.
        //For cases 3 and 4 we don't care since this is an exceptional case anyway.
        //If first pre pass we assume it is case 1 even if it could have been case 2 or 5.
        var i;
        var n = preconditions.length;
        var exception;
        //we check them from the leaf of the hierarchy to the root.
        for (i = 0; i < n; ++i) {
            try {
                preconditions[i].apply(instance, args);
                //The most current precodition passed. No further checks.
                // OR
                //One of the previous precoditions failed but now we
                //encountered one which doesn't fail.
                break;
            } catch (e) {
                if (!exception) {
                    exception = e; //store the first
                }
            }
        }
        if (i === 0) {
            //First precondition passed
            Mic.assert && Mic.assert(!exception, "Internal error: unexpected state.");
        } else if (i === n) {
            //All the preconditions failed
            Mic.assert && Mic.assert(exception, "Internal error: unexpected state.");
            throw exception;
        } else {
            //After the first preconditions failed some started to pass
            //Covariance violated
            throw new Error(Mic._COVARIANCE_VIOLATION__MSG);
        }
    };

    Mic._callPostConditions = function (postconditions, instance, result, args) {
        //Countervariance: postcondition can only be restricted.
        //
        //One approach could have been to execute all the postconditions.
        //Anyway this would be complex to master and different from preconditions.
        //
        //Therefore a new postcondition replace the old one.
        //
        //From there the reasoning is the dual of precondition.
        //
        // P = pass, F = fail
        //
        // 1 [OK] FFFFFFFF
        // 2 [OK] FFFFPPPP
        // 3 [OK] PPPPPPPP
        // 4 [KO] PPPF****
        // 5 [KO] FFPPF***
        //
        //So **PF** means violation.
        //For sake of speed we check cases 1, 2, 5.
        //If the first postcondition passes we assume we are in case 3 (even if was 4).
        args = [].slice.apply(args); //shallow copy
        args.unshift(result);
        var i;
        var n = postconditions.length;
        var exception;
        var fp;
        //we check them from the leaf of the hierarchy to the root.
        for (i = 0; i < n; ++i) {
            try {
                postconditions[i].apply(instance, args);
                if (i === 0) {
                    //The most current precodition passed. No further checks.
                    break;
                }
                if (exception) {
                    //One of the previous precoditions failed but now we
                    //encountered one which doesn't fail.
                    fp = true;
                }
            } catch (e) {
                if (!exception) {
                    exception = e; //store the first
                }
                if (fp) {
                    //fpf case
                    break;
                }
            }
        }
        if (i === 0) {
            //case 3 or 4
            Mic.assert && Mic.assert(!exception, "Internal error: unexpected state.");
        } else if (i === n) {
            //case 1 (!fp) or 2 (fp)
            Mic.assert && Mic.assert(exception, "Internal error: unexpected state.");
            throw exception;
        } else {
            //case 5
            Mic.assert && Mic.assert(fp, "Internal error: unexpected state.");
            Mic.assert && Mic.assert(exception, "Internal error: unexpected state.");
            throw new Error(Mic._CONTRAVARIANCE_VIOLATION_MSG);
        }
    };

    return Mic;
});