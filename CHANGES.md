# CHANGES.md

## 2026-01-22: Phase 1 - Nested Toolbox Organization & Chameleon Mixin Fixes

### Summary
Implemented nested toolbox categories for the Scheme Blocks IDE, expanding from 2 built-in procedures to 80+ R7RS procedures organized by domain. Also fixed critical chameleon mixin issues that prevented proper block connection behavior.

### Changes

#### Procedure Block Expansion
- **[procedures.scm](./src/blocks/procedures.scm)**: Expanded `standard-builtins` from 2 to 80+ R7RS procedures:
  - Math: +, -, *, /, abs, quotient, =, <, >, zero?, sqrt, expt...
  - Lists: cons, car, cdr, list-ref, memq, assoc, map, filter...
  - Strings: string-length, substring, string=?, string->list...
  - Vectors: make-vector, vector-ref, vector-set!...
  - Characters: char->integer, char=?...
  - I/O: display, newline, write, read
  - Predicates: eq?, eqv?, equal?, boolean?, procedure?...
  - Logic: not

#### Comprehensive Test Suite
- **[procedures_scheme_test.html](./tests/procedures_scheme_test.html)**: Added verification for all 80+ standard built-in procedures (registration and code generation).
- **[mixin_scheme_test.html](./tests/mixin_scheme_test.html)**: Enhanced to test mixin robustness (overwriting, chaining, null checks).
- **[tests/index.html](./tests/index.html)**: Created a Test Runner Dashboard for easy access to all browser-based tests.

#### Nested Toolbox Implementation
- **[procedures.scm](./src/blocks/procedures.scm)**: New `build-nested-toolbox` function:
  - Parses "Category/Subcategory" paths from procedure metadata
  - Special handling for "I/O" (not split on `/`)
  - Builds hierarchical category structure dynamically
  - Assigns distinct colors per top-level category

#### Procedure Block Refactoring
- **[procedures.scm](./src/blocks/procedures.scm)**: Split `procedure-call-base` into:
  - `specific-procedure-call-block` - for built-in procedures (no mutator)
  - `generic-procedure-call-block` - for dynamic args with mutator
  - Fixes "ARG0 removeInput" error when placing blocks

#### Chameleon Mixin Fixes
- **[mixins.scm](./src/blocks/mixins.scm)**: Fixed three critical issues:
  1. **Null Truthiness**: JS `null` is truthy in Scheme-JS - fixed with `js-null?`/`js-undefined?` checks
  2. **Method Calls**: `getPreviousBlock`, `targetBlock` were read as properties - fixed to call as methods
  3. **Connected Blocks**: `setConnections` tried to remove in-use connections - added `isConnected` checks

#### New Tests
- **[chameleon_test.scm](./tests/chameleon_test.scm) [NEW]**: Comprehensive chameleon mixin tests
- **[chameleon_test.html](./tests/chameleon_test.html) [NEW]**: HTML test runner

### Verification Results

#### Nested Toolbox
- ✅ Build succeeds
- ✅ Nested categories render correctly
- ✅ Subcategories expand on click
- ✅ Blocks appear in correct subcategories
- ✅ I/O displays as single category

#### Chameleon Mixin
- ✅ **Initial**: All connections (output, prev, next)  
- ✅ **Statement mode**: Output removed, prev/next kept
- ✅ **Expression mode**: Prev/next removed, output kept
- ✅ **Re-chameleonize**: All connections restored after disconnect

---

## 2026-01-20: Convert index.js to Scheme-JS and Add unit tests

Converted the Blockly initialization logic from JavaScript (`index.js`) to Scheme-JS (`init.scm`). This aligns with the "Scheme over JS" rule and demonstrates the power of the `scheme-js` interop features.

### Changes

#### Core Initialization
- **[index.js](file:///Users/mark/code/scheme-blocks/src/index.js)**: Stripped down to npm imports and global assignments.
- **[init.scm](file:///Users/mark/code/scheme-blocks/src/init.scm) [NEW]**: Full Blockly setup in Scheme.
- **[index.html](file:///Users/mark/code/scheme-blocks/public/index.html)**: Added script tag for `init.scm`.

#### Unit Tests
- **[init_test.html](file:///Users/mark/code/scheme-blocks/tests/init_test.html) [NEW]**: Verified environment setup (6/6 pass).
- **[flydown_test.scm](file:///Users/mark/code/scheme-blocks/tests/flydown_test.scm) [NEW]**: Unit test for `StandardProcedureNameFlydown` class.

### Verification Results
- ✅ **Initialization Test**: 6/6 passed.
- ✅ **Flydown Class Test**: Passed (verified via console).
- ✅ **Main App**: Blockly workspace successfully injected from `init.scm`.

---


## 2026-01-19: Scheme Code Interop Rewrite

### Summary
Rewrote procedure block definitions from JavaScript to idiomatic Scheme using proper `scheme-js` interoperability features.

### Files Modified
- `src/utils/mixin.scm` - Added JSDoc-style comments, use `vector-length`/`vector-ref` for arrays, `js-set!` for dynamic keys
- `src/blocks/mixins.scm` - Added JSDoc-style comments, use object spread syntax `#{(... obj)}`
- `src/blocks/procedures.scm` - Complete rewrite with proper interop patterns

### Key Interop Patterns Applied

| Issue | Wrong | Correct |
|-------|-------|---------|
| Nested objects in vectors | `#(#{ ... })` | `(vector #{ ... })` |
| Dynamic property set | `(set! (js-ref obj key) val)` | `(js-set! obj key val)` |
| JS constructor calls | `(new Class args)` | `(js-new Class args)` |
| MutatorIcon | `(js-new MutatorIcon quarks)` | `(js-new MutatorIcon quarks this)` |
| Method chaining across lines | `.method` on new line | Use `let*` bindings |
| Extending JS classes | `js-eval` with class syntax | `define-class` with `super` |

### Verification (2026-01-20)
- **11 assertions passed, 0 failed** in `procedures_scheme_test.html`
- End-to-end verification:
  - ✅ Blockly workspace loads
  - ✅ Toolbox categories displayed
  - ✅ Code generation works: `(lambda () #f)`
  - ✅ REPL evaluates correctly: `(+ 1 2)` → `3`
- Bugs fixed during verification:
  - `js-object?` → `(equal? (js-typeof e) "object")` in `app.scm`
  - Added missing `procedures_lambda` code generator to `procedures.scm`

---

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
