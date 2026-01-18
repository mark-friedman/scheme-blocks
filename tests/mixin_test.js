/**
 * @fileoverview Tests for mixin utility functions.
 * Run with: node tests/mixin_test.js
 */

import { mixin, blocklyMixin } from '../src/utils/mixin.js';
import { TestHarness } from './test_harness.js';

const harness = new TestHarness('Mixin Utilities');

// Test: Non-function properties are copied directly
harness.test('Non-function properties are copied directly', (t) => {
    const mixinObj = { name: 'test', value: 42 };
    const target = {};
    mixin(mixinObj, target);
    t.assertEqual(target.name, 'test');
    t.assertEqual(target.value, 42);
});

// Test: Function properties are bound with original as first arg
harness.test('Function properties receive original as first arg', (t) => {
    let receivedOrig = null;
    const mixinObj = {
        myMethod: function (orig, arg) {
            receivedOrig = orig;
            return arg * 2;
        }
    };
    const target = {
        myMethod: function (x) { return x + 1; }
    };
    mixin(mixinObj, target);
    const result = target.myMethod(5);
    t.assertEqual(result, 10);
    t.assertFunction(receivedOrig, 'Original function should be passed');
});

// Test: Mixin function can call original function
harness.test('Mixin function can call original function', (t) => {
    const mixinObj = {
        getValue: function (orig) {
            return orig() + 100;
        }
    };
    const target = {
        getValue: function () { return 5; }
    };
    mixin(mixinObj, target);
    t.assertEqual(target.getValue(), 105);
});

// Test: When target has no matching property, orig is undefined
harness.test('When target has no matching property, orig is undefined', (t) => {
    let receivedOrig = 'not-set';
    const mixinObj = {
        newMethod: function (orig) {
            receivedOrig = orig;
            return 'new';
        }
    };
    const target = {};
    mixin(mixinObj, target);
    target.newMethod();
    t.assertEqual(receivedOrig, undefined);
});

// Test: blocklyMixin calls init if present
harness.test('blocklyMixin calls mixin init function', (t) => {
    let initCalled = false;
    const mixinObj = {
        init: function (orig) {
            initCalled = true;
        }
    };
    const target = {};
    blocklyMixin(mixinObj, target);
    t.assert(initCalled, 'init should have been called');
});

// Test: Original functions are bound to target context
harness.test('Original functions are bound to target context', (t) => {
    const mixinObj = {
        getThis: function (orig) {
            return orig();
        }
    };
    const target = {
        name: 'target-obj',
        getThis: function () { return this.name; }
    };
    mixin(mixinObj, target);
    t.assertEqual(target.getThis(), 'target-obj');
});

// Run the tests
const results = await harness.run();
process.exit(results.failed > 0 ? 1 : 0);
