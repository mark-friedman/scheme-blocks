/**
 * @fileoverview Test runner for all automated tests.
 * Run with: node tests/run_tests.js
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// List of test files to run
const testFiles = [
    'mixin_test.js',
];

async function runTest(testFile) {
    return new Promise((resolve) => {
        const testPath = join(__dirname, testFile);
        const child = spawn('node', [testPath], {
            stdio: 'inherit',
            cwd: join(__dirname, '..')
        });

        child.on('close', (code) => {
            resolve({ file: testFile, exitCode: code });
        });
    });
}

async function main() {
    console.log('\n🧪 Running Scheme Blocks Test Suite\n');
    console.log('═'.repeat(50));

    let totalPassed = 0;
    let totalFailed = 0;

    for (const testFile of testFiles) {
        const result = await runTest(testFile);
        if (result.exitCode === 0) {
            totalPassed++;
        } else {
            totalFailed++;
        }
    }

    console.log('\n' + '═'.repeat(50));
    console.log(`\n📊 Test Suite Summary: ${totalPassed} passed, ${totalFailed} failed\n`);

    process.exit(totalFailed > 0 ? 1 : 0);
}

main();
