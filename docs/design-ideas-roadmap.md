# Design Ideas Roadmap

This roadmap tracks the implementation of ideas from [design-ideas.md](./design-ideas.md) to make Scheme Blocks more intuitive while preserving Scheme's first-class procedure semantics.

**Guiding Principle:** *Make the easy things easy and the hard things possible!*

---

## Status Legend

- ⬜ Not started
- 🔄 In progress  
- ✅ Complete
- ⏸️ Blocked/Waiting

---

## Phase 1: Nested Toolbox Organization ✅

*Reorganize existing manually-defined procedures into nested categories.*

### Tasks

- [x] Expand `standard-builtins` with more R7RS procedures (80+ added)
- [x] Restructure `standard-procedure-toolbox-json` with nested categories
- [x] Group by domain: String, List, Math, Vector, I/O, Control
- [x] Add colors for visual distinction between categories
- [ ] Create special forms blocks (if, cond, let, etc.) with custom handling
- [ ] Add tests for nested toolbox rendering

### Notes

- Does NOT require Phase 5 (dynamic import) - just manual expansion
- Special forms need individual block definitions (not auto-generated)

---

## Phase 2: Generic Call Block Foundation ⬜

*Unify procedure calls with first-class procedure values using compact grey call blocks.*

### Design

- Grey color (`#888`) like SNAP!
- Compact inline layout
- Procedure slot accepts shadow block with flydown
- Visual distinction: grey call vs purple procedure value

### Tasks

- [ ] Modify `procedure-call-base` to use PROC value input
- [ ] Create `procedure_name_shadow` block type
- [ ] Implement flydown for shadow blocks (getter, setter)
- [ ] Apply grey styling and inline layout
- [ ] Update chameleon mixin for call vs getter styles
- [ ] Create `procedure-shadows.scm` file
- [ ] Add tests for shadow block creation and code generation

---

## Phase 3: User-Defined Procedure Flydowns ⬜

*Extend flydown pattern to user-defined procedures with full lexical scope.*

### Design

- Track procedures defined in `let`, `letrec`, local `define`
- Flydowns show caller (with correct parameters), getter, setter
- Scope-aware: only show procedures visible at current block location

### Tasks

- [ ] Create procedure registry in workspace
- [ ] Implement scope detection for `let`/`letrec`/`define` bindings
- [ ] Create `UserProcedureNameFlydown` class
- [ ] Generate caller XML with correct parameter names
- [ ] Register event handlers for BLOCK_CREATE/CHANGE
- [ ] Add tests for scope-aware flydown population

---

## Phase 4: UI Complexity Levels ⬜

*Progressive disclosure: training wheels for beginners, power for experts.*

### Levels

1. **Beginner** - Explicit "get", "call" labels
2. **Intermediate** - Remove training wheels
3. **Advanced** - Text/blocks hybrid (future)

### Tasks

- [ ] Create `ui-level.scm` with level constants and localStorage persistence
- [ ] Modify block definitions for conditional label display
- [ ] Add UI level selector to `index.html`
- [ ] Wire up selector to `set-ui-level` function
- [ ] Implement `refresh-block-labels` for level changes
- [ ] Add tests for label visibility per level

---

## Phase 5: Dynamic Library Import ⬜

*Generate blocks automatically from imported Scheme libraries.*

### Prerequisites

- [ ] **scheme-js: `procedure-arity`** - Returns `#{ (min n) (max n-or-#f) (rest #t/#f) }`
- [ ] **scheme-js: `procedure-parameters`** - Returns parameter names or `#f`
- [ ] **scheme-js: `library-exports`** - Returns list of export info with types
- [ ] **scheme-js: `syntax?`** - Predicate for special forms

### Tasks

- [ ] Create `library-introspect.scm` using scheme-js APIs
- [ ] Create `library-blocks.scm` for dynamic block generation
- [ ] Handle variadic procedures (mutator with min required args)
- [ ] Skip syntax forms (require manual block definitions)
- [ ] Add "Libraries" category with import button
- [ ] Implement library picker dialog
- [ ] Add tests for dynamic block generation

---

## Scheme-JS Introspection Spec

Features needed in scheme-js for Phase 5:

```scheme
;; Arity: #{ (min n) (max n-or-#f) (rest #t/#f) }
(procedure-arity +)  => #{ (min 0) (max #f) (rest #t) }
(procedure-arity cons) => #{ (min 2) (max 2) (rest #f) }

;; Parameters: list of symbols or #f
(procedure-parameters (lambda (a b) ...)) => (a b)
(procedure-parameters cons) => #f

;; Library exports
(library-exports '(scheme base)) => (list #{ (name "+") (type procedure) ... } ...)

;; Syntax predicate
(syntax? if) => #t
```

---

## Dependencies

```
Phase 2 ──► Phase 3
    │
    └────► Phase 5 (also needs scheme-js enhancements)

Phase 1 ◄── independent
Phase 4 ◄── independent
```

---

## Completed Items

*Move items here as they are finished.*

(none yet)

---

## Change Log

| Date | Change |
|------|--------|
| 2026-01-22 | Initial roadmap created from implementation plan |
| 2026-01-22 | **Phase 1 core tasks complete**: Expanded standard-builtins to 80+ procedures, implemented nested categories with `build-nested-toolbox`, added category colors |
