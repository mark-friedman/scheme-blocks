/**
 * @fileoverview Simple test harness for Node.js-based tests.
 */

/**
 * Test harness class for organizing and running tests.
 */
class TestHarness {
    constructor(name) {
        this.name = name;
        this.tests = [];
        this.results = { passed: 0, failed: 0, errors: [] };
    }

    /**
     * Register a test.
     * @param {string} description - Test description
     * @param {Function} testFn - Test function (can be async)
     */
    test(description, testFn) {
        this.tests.push({ description, testFn });
    }

    /**
     * Assert helper - throws if condition is false.
     * @param {boolean} condition - Condition to check
     * @param {string} [message] - Optional failure message
     */
    assert(condition, message = 'Assertion failed') {
        if (!condition) {
            throw new Error(message);
        }
    }

    /**
     * Assert equality helper.
     * @param {*} actual - Actual value
     * @param {*} expected - Expected value
     * @param {string} [message] - Optional failure message
     */
    assertEqual(actual, expected, message) {
        const msg = message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`;
        this.assert(actual === expected, msg);
    }

    /**
     * Assert that actual contains expected substring.
     * @param {string} actual - Actual string
     * @param {string} expected - Expected substring
     * @param {string} [message] - Optional failure message
     */
    assertContains(actual, expected, message) {
        const msg = message || `Expected "${actual}" to contain "${expected}"`;
        this.assert(actual.includes(expected), msg);
    }

    /**
     * Assert that value is truthy.
     * @param {*} value - Value to check
     * @param {string} [message] - Optional failure message
     */
    assertTruthy(value, message) {
        const msg = message || `Expected truthy value, got ${JSON.stringify(value)}`;
        this.assert(!!value, msg);
    }

    /**
     * Assert that value is a function.
     * @param {*} value - Value to check
     * @param {string} [message] - Optional failure message
     */
    assertFunction(value, message) {
        const msg = message || `Expected function, got ${typeof value}`;
        this.assert(typeof value === 'function', msg);
    }

    /**
     * Run all registered tests and return results.
     */
    async run() {
        console.log(`\n🧪 ${this.name}`);
        console.log('─'.repeat(50));

        for (const { description, testFn } of this.tests) {
            try {
                await testFn(this);
                this.results.passed++;
                console.log(`  ✅ ${description}`);
            } catch (error) {
                this.results.failed++;
                this.results.errors.push({ description, error });
                console.log(`  ❌ ${description}`);
                console.log(`     Error: ${error.message}`);
            }
        }

        console.log('─'.repeat(50));
        const summary = `📊 ${this.results.passed} passed, ${this.results.failed} failed`;
        console.log(summary);

        return this.results;
    }
}

export { TestHarness };
