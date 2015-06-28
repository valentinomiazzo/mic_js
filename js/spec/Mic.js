/*jslint browser: true, bitwise: true, nomen: true, todo: true, vars: true, plusplus: true, indent: 4 */
/*global define, describe, it, expect */

define([
    "Mic"
], function(Mic) {
    "use strict";

    function K(y) {
        var self = this;
        self.y = y;
    }
    K.prototype.k = function (x) {
        return x * x + this.y;
    };
    K.prototype.k.pre = function (x) {
        Mic.assert(typeof x === "number");
    };
    K.prototype.k.post = function (result, x) {
        Mic.unused(x);
        Mic.assert(result >= 0);
    };
    Mic.seal(K);

    function P(y) {
        var self = this;
        self.z = y;
        K.call(self, y);
    }
    P.prototype.p = function (x) {
        var self = this;
        return x * self.z;
    };
    Mic.inheritFrom(P, K);
    Mic.seal(P);

    describe("The Mic module", function() {

        it("can apply pre and post conditions", function() {
            var i = new K(1);
            expect(i.k(2)).toBe(5);
            expect(i.k.bind(i, 2)()).toBe(5);
            expect(i.k.bind(i, null)).toThrow();
        });

        it("doesn't throw an Error when calling 'sealAbstract' on a class with abstract methods", function() {
            function P() { Mic.empty(); }
            P.prototype.p = Mic.anAbstract();
            expect(Mic.sealAbstract.bind(null, P)).not.toThrow();
        });

        it("throws an Error when calling 'seal' on a class with abstract methods", function() {
            function P() { Mic.empty(); }
            P.prototype.p = Mic.anAbstract();
            expect(Mic.seal.bind(null, P)).toThrow();
        });

        it("supports dynamic inheritance from a class with pre and post conditions", function() {
            var i = new P(2);
            expect(i.p(3)).toBe(6);
            expect(i.k(2)).toBe(6);
            expect(i instanceof P).toBe(true);
            expect(i instanceof K).toBe(true);
            expect(Mic.isA(i, P)).toBe(true);
            expect(Mic.isA(i, K)).toBe(true);
            expect(i.k.bind(i, null)).toThrow();
        });

        it("supports inheritance of an abstract method with pre and post conditions", function() {
            function Q() { Mic.empty(); }
            Q.prototype.q = Mic.anAbstract();
            Q.prototype.q.pre = function (x) {
                Mic.assert(typeof x === "number");
            };
            Q.prototype.q.post = function (result, x) {
                Mic.unused(x);
                Mic.assert(result >= 0);
            };

            function R(y) {
                var self = this;
                self.z = y;
                Q.call(self);
            }
            R.prototype.q = function (x) {
                var self = this;
                return x * x + self.z;
            };
            Mic.inheritFrom(R, Q);
            Mic.seal(R);

            var i = new R(0);
            expect(i.q(-3)).toBe(9);
            expect(i instanceof R).toBe(true);
            expect(i instanceof Q).toBe(true);
            expect(Mic.isA(i, R)).toBe(true);
            expect(Mic.isA(i, Q)).toBe(true);
            expect(i.q.bind(i, null)).toThrow();
        });

        it("supports mixing of an abstract method with pre and post conditions", function() {
            function Q() { Mic.empty(); }
            Q.prototype.q = Mic.anAbstract();
            Q.prototype.q.pre = function (x) {
                Mic.assert(typeof x === "number");
            };
            Q.prototype.q.post = function (result, x) {
                Mic.unused(x);
                Mic.assert(result >= 0);
            };

            function R(y) {
                var self = this;
                self.z = y;
                Q.call(self);
            }
            R.prototype.q = function (x) {
                var self = this;
                return x * x + self.z;
            };
            Mic.mixWith(R, Q);
            Mic.seal(R);

            var i = new R(0);
            expect(i.q(-3)).toBe(9);
            expect(i instanceof R).toBe(true);
            expect(Mic.isA(i, R)).toBe(true);
            expect(Mic.isA(i, Q)).toBe(true);
            expect(i.q.bind(i, null)).toThrow();
        });

        it("can detect some violations of the covariance rule", function() {
            function Base() { Mic.empty(); }
            Base.prototype.f = function (x) {
                Mic.unused(x);
                return 0;
            };
            Base.prototype.f.pre = function (x) {
                Mic.assert(x > 0 && x < 10);
            };
            Mic.seal(Base);

            var b = new Base();
            expect(b.f.bind(b, 0)).toThrow();
            expect(b.f(1)).toBe(0);
            expect(b.f.bind(b, 10)).toThrow();

            function Good() {
                var self = this;
                Base.call(self);
            }
            Good.prototype.f = function (x) {
                Mic.unused(x);
                return 1;
            };
            Good.prototype.f.pre = function (x) {
                //sub classes can relax pre conditions
                Mic.assert(x > 0 && x < 100);
            };
            Mic.inheritFrom(Good, Base);
            Mic.seal(Good);

            var g = new Good();
            expect(g.f.bind(g, 0)).toThrow();
            expect(g.f(1)).toBe(1);
            expect(g.f(10)).toBe(1);
            expect(g.f.bind(g, 100)).toThrow();

            function NotGood() {
                var self = this;
                Base.call(self);
            }
            NotGood.prototype.f = function (x) {
                Mic.unused(x);
                return 1;
            };
            NotGood.prototype.f.pre = function (x) {
                //sub classes *cannot* restrict pre conditions
                Mic.assert(x > 0 && x < 2);
            };
            Mic.inheritFrom(NotGood, Base);
            Mic.seal(NotGood);

            var n = new NotGood();
            //This is OK for all the pres
            expect(n.f(1)).toBe(1);
            //This is not OK for all the pres
            try {
                expect(n.f(0)).toBe('shouldNotGoHere');
            } catch (e) {
                expect(e.message).not.toBe(Mic._COVARIANCE_VIOLATION__MSG);
            }
            //This is !OK only for the Bad.f.pre --> violation
            try {
                expect(n.f(2)).toBe('shouldNotGoHere');
            } catch (e) {
                expect(e.message).toBe(Mic._COVARIANCE_VIOLATION__MSG);
            }
        });

        it("can detect some violations of the countervariance rule", function() {
            function Base() { Mic.empty(); }
            Base.prototype.f = function (x) { return x; };
            Base.prototype.f.post = function (result, x) {
                Mic.unused(x);
                Mic.assert(result > 0 && result < 10);
            };
            Mic.seal(Base);

            var b = new Base();
            try {
                expect(b.f(0)).toBe('shouldNotGoHere');
            } catch (e) {
                expect(e.message).not.toBe(Mic._COUNTERVARIANCE_VIOLATION__MSG);
            }
            expect(b.f(1)).toBe(1);
            expect(b.f(2)).toBe(2);
            try {
                expect(b.f(10)).toBe('shouldNotGoHere');
            } catch (e) {
                expect(e.message).not.toBe(Mic._COUNTERVARIANCE_VIOLATION__MSG);
            }

            function Good() {
                var self = this;
                Base.call(self);
            }
            Good.prototype.f = function (x) {
                //we don't call Base.prototype.f otherwise we'll hit its postconditions
                return x;
            };
            Good.prototype.f.post = function (result, x) {
                Mic.unused(x);
                //sub classes can restrict post conditions
                Mic.assert(result > 0 && result < 2);
            };
            Mic.inheritFrom(Good, Base);
            Mic.seal(Good);

            var g = new Good();
            try {
                expect(g.f(0)).toBe('shouldNotGoHere');
            } catch (e) {
                expect(e.message).not.toBe(Mic._COUNTERVARIANCE_VIOLATION__MSG);
            }
            expect(g.f(1)).toBe(1);
            try {
                expect(g.f(2)).toBe('shouldNotGoHere');
            } catch (e) {
                expect(e.message).not.toBe(Mic._COUNTERVARIANCE_VIOLATION__MSG);
            }

            function NotGood() {
                var self = this;
                Base.call(self);
            }
            NotGood.prototype.f = function (x) {
                //we don't call Base.prototype.f otherwise we'll hit its postconditions
                return x;
            };
            NotGood.prototype.f.post = function (result, x) {
                Mic.unused(x);
                //sub classes *cannot* relaxe post conditions
                Mic.assert(result > 0 && result < 100);
            };
            Mic.inheritFrom(NotGood, Base);
            Mic.seal(NotGood);

            var n = new NotGood();
            try {
                expect(n.f(0)).toBe('shouldNotGoHere');
            } catch (e) {
                expect(e.message).not.toBe(Mic._COUNTERVARIANCE_VIOLATION__MSG);
            }
            expect(n.f(1)).toBe(1);
            expect(n.f(2)).toBe(2);
            expect(n.f(10)).toBe(10);
            try {
                expect(n.f(100)).toBe('shouldNotGoHere');
            } catch (e) {
                expect(e.message).not.toBe(Mic._COUNTERVARIANCE_VIOLATION__MSG);
            }

            function Violator() {
                var self = this;
                NotGood.call(self);
            }
            Violator.prototype.f = function (x) {
                //we don't call Base.prototype.f otherwise we'll hit its postconditions
                return x;
            };
            Violator.prototype.f.post = function (result, x) {
                Mic.unused(x);
                //sub classes *cannot* relaxe post conditions
                Mic.assert(result > 0 && result < 50);
            };
            Mic.inheritFrom(Violator, NotGood);
            Mic.seal(Violator);

            var v = new Violator();
            try {
                expect(v.f(50)).toBe('shouldNotGoHere');
            } catch (e) {
                expect(e.message).toBe(Mic._COUNTERVARIANCE_VIOLATION_MSG);
            }
        });

        it("doesn't propagate sealing at mix time", function() {
            function Mixin1() { Mic.empty(); }
            Mixin1.prototype.f = function() { return 0; };
            expect(Mic.isSealed(Mixin1)).toBe(false);
            Mic.seal(Mixin1);
            expect(Mic.isSealed(Mixin1)).toBe(true);

            function Stuff() { Mic.empty(); }
            Mic.mixWith(Stuff, Mixin1);
            expect(Mic.isSealed(Stuff)).toBe(false);
        });

        it(", when overriding via inheritance a not abstract method, attaches pre-post conditions to the overrider", function() {
            function Base() {}
            Base.prototype.f = function () { return 0; };
            Base.prototype.f.pre = function () {
                this.preCalled = true;
            };
            Mic.seal(Base);

            function Derived() {
                Base.call(this);
            }
            Derived.prototype.f = function () {
                //not calling super.f() by purpose
                return 1;
            };
            Mic.inheritFrom(Derived, Base);
            Mic.seal(Derived);

            var d = new Derived();

            expect(d.f()).toBe(1);
            expect(d.preCalled).toBe(true);
        });

        it("assumes pre-post conditions are without sidefx and can be execute multiple times for each call", function() {
            //TODO: ...
        });

    });

    return null;
});