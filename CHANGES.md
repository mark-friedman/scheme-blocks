# CHANGES.md

## 2026-01-18: Blockly Test Environment & Dependency Updates

### Summary
Established comprehensive automated testing suite and updated Blockly dependencies to version 11.

### Dependency Updates
- `blockly`: `^9.0.0` → `^11.2.2`
- `@mit-app-inventor/blockly-block-lexical-variables`: `^0.0.12` → `^11.0.3`

### API Migration Fixes

#### Blockly 11 API Changes
Updated `src/blocks/procedures.js` for Blockly v11 API:
- `Blockly.Mutator` → `Blockly.icons.MutatorIcon`
- `Blockly.ALIGN_RIGHT` → `Blockly.inputs.Align.RIGHT`
- `Blockly.Mutator.reconnect()` → direct connection API

#### Lexical Variables Plugin API Change
The plugin now exports a named `LexicalVariablesPlugin` instead of the previous module structure:

```javascript
// Before (v0.0.12)
import * as LexicalVariables from '@mit-app-inventor/blockly-block-lexical-variables';
LexicalVariables.init(workspace);

// After (v11.0.3)
import {LexicalVariablesPlugin} from '@mit-app-inventor/blockly-block-lexical-variables';
LexicalVariablesPlugin.init(workspace);
```

Files updated:
- `src/index.js`
- `src/blocks/procedures.js`

### Test Infrastructure Created

#### Node.js Tests
- `tests/test_harness.js` - Reusable test harness
- `tests/mixin_test.js` - 6 tests for mixin utilities
- `tests/run_tests.js` - Test runner script
- Added `npm test` script to `package.json`

#### Browser-Based Tests
- `tests/blocks_test.html` - 12 Blockly tests (block registration, workspace creation, code generation)
- `tests/index.html` - Test suite overview page

### Test Results
- **Node.js tests**: 6/6 pass
- **Browser tests**: 12/12 pass
- **Total**: 18/18 pass

### Files Modified
- `package.json` - Updated dependencies, added test script
- `src/index.js` - Updated lexical-variables import
- `src/blocks/procedures.js` - Updated Blockly v11 APIs and lexical-variables import
- `webpack.config.js` - Added src/ and tests/ to static serving

### Files Added
- `tests/test_harness.js`
- `tests/run_tests.js`
- `tests/mixin_test.js`
- `tests/blocks_test.html`
- `tests/index.html`
