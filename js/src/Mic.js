/*jslint browser: true, bitwise: true, nomen: true, todo: true, vars: true, plusplus: true, indent: 4 */
/*global define */

/*
MIC stands for Mixins Inheritance Contracts

Idea: Dbc alternative name Ctrct (joke about contracting the for contract)

DESIGN NOTE:
- There are not mixins and classes, every 'type' is a class.
- The focal point is how types are combined. Dynamically (inheritance) or statically (mix).
- There are not classes and interfaces, there are abstract methods.
- There are not contract, there are methods annotted with pre and post conditions.

    If A defines myMethod then:
    - Pre-existing Dbc.post is added to current.
      Since this is applied to every inheritance step then we can find the array of post-s
      in the super class.
      This allows to implement countervariance where a subclass can restrict its postconditions.
    - Dbc.pre is defined here and a pre-existing Dbc.pre is found in the inheritance chain then
      a special logic is applied because covariance imposes that precondition can only be relaxed by sublcasses.
        If pre fails, in addition to throwing an exception,  we check all the inherited pre-s.
        If they don't fail then we show an additional error because it means that current pre was stricter
        than previous ones therefore violating the covariance. This has negligble impact on performance
        since it is done only if current pre fails and therefore outside the normal flow of the code.
    - Pre and post conditions of super methods are checked even if we already checked the current pre-s.
      This is useful becuase a method could have not passed the original arguments to the super method.
      This is obtained automatically.

        a.m(-1);

        //A inherits B

        //B.m requires x>0

        A.m = function(x) {
          A.parent.m(complexFunction(x));
        }

    If both A and B define myMethod then
    - Dbc.post-s are accumulated
    - If Dbc.pre is defined then all Dbc.pre-s are checked when it fails and if any of them doesn't
      fail then an covariance error is generated in addition.

    If A and B define a method m that is not defined in the subclass
    - an error is generated because the multi-inheritance is not clear and the subclass
      developer needs to supply his m that dispatches to the multiple m super methods as required.

    Invariants
    - no support

    Implementation:
    - inside Dbc.inherit
    -- the inherited pre-s and post-s are discovered
    -- the original method is replaced with a wrapper that calls pre-s and post-s
    -- pre-s and post-s logic is applied
    -- multi inheritance ambiguities are discovered and signaled



*/



define([
    "Mxr", "In"
], function(Mxr, In) {
    "use strict";

    function _s_copy(dst, src) {
        var member;
        for (member in src) {
            if (src.hasOwnProperty(member)) {
                dst[member] = src[member];
            }
        }
    }

    var Mic = {};

    //TODO: leave merge decision to the user. For now merge all together.
    Mxr.configure({ "In": In });
    _s_copy(Mic, Mxr);

    Mic._IS_SEALED = Mic._UTL_PFX + "_isSealed";
    Mic._COVARIANCE_VIOLATION__MSG = "covariance violated";
    Mic._COUNTERVARIANCE_VIOLATION_MSG = "countervariance violated";
    Mic._PRE = "pre";
    Mic._POST = "post";

    //Declares you not use variable and shuts up Jslint & Co.
    Mic.unused = function (x) { x = x && 0; };

    //Declares a block is empty by purpose
    Mic.empty = function() { Mic.unused(0); };

    Mic.seal = function (clazz) {
        Mic._seal(clazz, false);
    };

    Mic.assert = function(trueish, message) {
        if (!trueish) {
            //TODO: add more details about the failure, like stack trace
            throw new Error(message || "Mic.assert violated ...");
        }
    };

    Mic.sealAbstract = function (clazz) {
        Mic._seal(clazz, true);
    };

    Mic._seal = function (clazz, isAbstractClass) {
        Mic.assert(clazz);
        Mic.assert(clazz instanceof Function);
        Mic.assert(!Mic.isSealed(clazz));
        var cp = clazz.prototype;
        var memberName;
        var member;
        var synth;
        var conditions;
        for (memberName in cp) {
            if (cp.hasOwnProperty(memberName)) {
                member = cp[memberName];
                if (member instanceof Function) {
                    if (!Mic.isAbstract(member)) {
                        conditions = Mic._findConditions(cp, memberName);
                        synth = Mic._synthetize(member, conditions);
                        cp[memberName] = synth;
                    } else {
                        Mic.assert(
                            isAbstractClass,
                            "Found an abstract method on a not abstract class. Class " + clazz.name + " Method " + memberName
                        );
                    }
                }
            }
        }
        cp[Mic._IS_SEALED] = true;
    };

    Mic.isSealed = function (clazz) {
        Mic.assert(clazz);
        Mic.assert(clazz instanceof Function);
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
        Mic.assert(synth);
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
            Mic.assert(!exception);
        } else if (i === n) {
            //All the preconditions failed
            Mic.assert(exception);
            throw exception;
        } else {
            //After the first preconditions failed some started to pass
            //Covariance violated
            throw new Error(Mic._COVARIANCE_VIOLATION__MSG);
            //TODO: implement a custom excpetion with a cause and pass exception as cause
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
            Mic.assert(!exception);
        } else if (i === n) {
            //case 1 (!fp) or 2 (fp)
            Mic.assert(exception);
            throw exception;
        } else {
            //case 5
            Mic.assert(fp);
            Mic.assert(exception);
            throw new Error(Mic._COUNTERVARIANCE_VIOLATION_MSG);
            //TODO: implement a custom excpetion with a cause and pass exception as cause
        }
    };

    return Mic;
});