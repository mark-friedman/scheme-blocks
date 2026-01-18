/**
 * Stepables Base Module
 * 
 * Contains the foundational elements shared by all stepable objects:
 * - Register constants (ANS, CTL, ENV, FSTACK)
 * - Executable base class
 * - ensureExecutable helper
 * 
 * This module is imported by both ast_nodes.js and frames.js.
 */

// =============================================================================
// Register Constants
// =============================================================================

/** Answer register - holds result of last computation */
const ANS = 0;
/** Control register - holds next AST node or Frame to execute */
const CTL = 1;
/** Environment register - holds current lexical environment */
const ENV = 2;
/** Frame stack register - holds continuation frames */
const FSTACK = 3;
/** This context register - holds current JavaScript 'this' context */
const THIS = 4;

/**
 * @typedef {[any, Executable, Environment, Array<Executable>]} Registers
 * The register array: [ans, ctl, env, fstack]
 */

// =============================================================================
// Base Class
// =============================================================================

/**
 * Base class for all executable objects (AST nodes and Frames).
 * All must have a `step` method.
 */
class Executable {
    /**
     * Executes a single step of this node's computation.
     * @param {Registers} registers - The [ans, ctl, env, fstack] registers array.
     * @param {Interpreter} interpreter - The interpreter instance.
     * @returns {boolean} `true` to continue trampoline, `false` to halt.
     */
    step(registers, interpreter) {
        throw new Error("step() must be implemented in subclasses");
    }
}

// Note: ensureExecutable is defined in ast_nodes.js because it depends on Literal

/**
 * Frame Registry - Factory functions to break circular dependencies.
 * 
 * This module provides factory functions for creating frame instances.
 * It acts as an indirection layer to avoid circular imports within
 * stepables.js during module initialization.
 */

// Frame classes are registered here by stepables.js
let IfFrame$1, SetFrame$1, DefineFrame$1;
let AppFrame$1, BeginFrame$1, DynamicWindSetupFrame$1, WindFrame$1;
let CallWithValuesFrame$1, ExceptionHandlerFrame$1, RaiseContinuableResumeFrame$1;

/**
 * Registers frame classes. Called by stepables.js during module initialization.
 * @param {Object} frames - Object containing all frame classes.
 */
function registerFrames(frames) {
    IfFrame$1 = frames.IfFrame;
    SetFrame$1 = frames.SetFrame;
    DefineFrame$1 = frames.DefineFrame;
    AppFrame$1 = frames.AppFrame;
    BeginFrame$1 = frames.BeginFrame;
    DynamicWindSetupFrame$1 = frames.DynamicWindSetupFrame;
    WindFrame$1 = frames.WindFrame;
    CallWithValuesFrame$1 = frames.CallWithValuesFrame;
    ExceptionHandlerFrame$1 = frames.ExceptionHandlerFrame;
    RaiseContinuableResumeFrame$1 = frames.RaiseContinuableResumeFrame;
}

/**
 * Creates an IfFrame instance.
 */
function createIfFrame(consequent, alternative, env) {
    return new IfFrame$1(consequent, alternative, env);
}

/**
 * Creates a SetFrame instance.
 */
function createSetFrame(name, env) {
    return new SetFrame$1(name, env);
}

/**
 * Creates a DefineFrame instance.
 */
function createDefineFrame(name, env) {
    return new DefineFrame$1(name, env);
}

/**
 * Creates an AppFrame instance.
 */
function createAppFrame(argExprs, argValues, env) {
    return new AppFrame$1(argExprs, argValues, env);
}

/**
 * Creates a BeginFrame instance.
 */
function createBeginFrame(remainingExprs, env) {
    return new BeginFrame$1(remainingExprs, env);
}

/**
 * Creates a DynamicWindSetupFrame instance.
 */
function createDynamicWindSetupFrame(before, thunk, after, env) {
    return new DynamicWindSetupFrame$1(before, thunk, after, env);
}

/**
 * Gets the WindFrame class (for instanceof checks).
 */
function getWindFrameClass() {
    return WindFrame$1;
}

/**
 * Creates a CallWithValuesFrame instance.
 */
function createCallWithValuesFrame(consumer, env) {
    return new CallWithValuesFrame$1(consumer, env);
}

/**
 * Creates an ExceptionHandlerFrame instance.
 */
function createExceptionHandlerFrame(handler, env) {
    return new ExceptionHandlerFrame$1(handler, env);
}

/**
 * Creates a RaiseContinuableResumeFrame instance.
 */
function createRaiseContinuableResumeFrame(savedFrames, env) {
    return new RaiseContinuableResumeFrame$1(savedFrames, env);
}

/**
 * Gets the ExceptionHandlerFrame class (for instanceof checks).
 */
function getExceptionHandlerFrameClass() {
    return ExceptionHandlerFrame$1;
}

/**
 * Represents a Scheme symbol.
 * Symbols are unique objects identified by their name.
 */
let Symbol$1 = class Symbol {
    constructor(name) {
        this.name = name;
    }

    toString() {
        return this.name;
    }
};

class SymbolRegistry {
    constructor() {
        this.symbols = new Map();
    }

    intern(name) {
        if (!this.symbols.has(name)) {
            this.symbols.set(name, new Symbol$1(name));
        }
        return this.symbols.get(name);
    }
}

const globalSymbolRegistry = new SymbolRegistry();

/**
 * Helper to get an interned symbol.
 */
function intern(name) {
    return globalSymbolRegistry.intern(name);
}

/**
 * Scheme Error Classes
 * 
 * Provides structured exception types for the Scheme interpreter.
 * All Scheme exceptions inherit from SchemeError.
 */


/**
 * Returns a human-readable type name for a value.
 * @param {*} value - Any value
 * @returns {string} Type description
 */
function getTypeName(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'function') return 'procedure';
    if (value instanceof Symbol$1) return 'symbol';
    if (value instanceof Cons) return 'pair';
    if (Array.isArray(value)) return 'vector';
    if (value.constructor && value.constructor.name) {
        return value.constructor.name.toLowerCase();
    }
    return typeof value;
}

/**
 * Base class for all Scheme exceptions.
 * Captures stack trace and supports R7RS "irritants" concept.
 */
class SchemeError extends Error {
    /**
     * @param {string} message - Error message
     * @param {Array} irritants - R7RS irritants (additional values related to error)
     * @param {string} [procName] - Name of procedure that raised the error
     */
    constructor(message, irritants = [], procName = null) {
        super(message);
        this.name = 'SchemeError';
        this.irritants = irritants;
        this.procName = procName;
        this.schemeStack = []; // Populated by interpreter when raised

        // Capture JS stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    /**
     * Returns the irritants as a Scheme list.
     * @returns {Cons|null}
     */
    getIrritantsList() {
        return list(...this.irritants);
    }

    /**
     * Formats the complete error with Scheme stack if available.
     * @returns {string}
     */
    toSchemeString() {
        let result = this.message;
        if (this.schemeStack && this.schemeStack.length > 0) {
            result += '\n  Scheme stack:';
            for (const frame of this.schemeStack) {
                result += `\n    at ${frame}`;
            }
        }
        return result;
    }
}

/**
 * Error for type mismatches in procedure arguments.
 */
class SchemeTypeError extends SchemeError {
    /**
     * @param {string} procName - Procedure name
     * @param {number} argPos - Argument position (1-indexed)
     * @param {string} expectedType - Expected type name
     * @param {*} actualValue - The actual value received
     */
    constructor(procName, argPos, expectedType, actualValue) {
        const actualType = getTypeName(actualValue);
        const message = `${procName}: expected ${expectedType} at argument ${argPos}, got ${actualType}`;
        super(message, [actualValue], procName);
        this.name = 'SchemeTypeError';
        this.argPos = argPos;
        this.expectedType = expectedType;
        this.actualValue = actualValue;
    }
}

/**
 * Error for wrong number of arguments.
 */
class SchemeArityError extends SchemeError {
    /**
     * @param {string} procName - Procedure name
     * @param {number} expectedMin - Minimum expected arguments
     * @param {number} expectedMax - Maximum expected arguments (Infinity for variadic)
     * @param {number} actualCount - Actual argument count
     */
    constructor(procName, expectedMin, expectedMax, actualCount) {
        let expected;
        if (expectedMin === expectedMax) {
            expected = `${expectedMin}`;
        } else if (expectedMax === Infinity) {
            expected = `at least ${expectedMin}`;
        } else {
            expected = `${expectedMin}-${expectedMax}`;
        }
        const message = `${procName}: wrong number of arguments (expected ${expected}, got ${actualCount})`;
        super(message, [], procName);
        this.name = 'SchemeArityError';
        this.expectedMin = expectedMin;
        this.expectedMax = expectedMax;
        this.actualCount = actualCount;
    }
}

/**
 * Error for index or value out of range.
 */
class SchemeRangeError extends SchemeError {
    /**
     * @param {string} procName - Procedure name
     * @param {string} argName - Argument or parameter name
     * @param {number} minVal - Minimum valid value
     * @param {number} maxVal - Maximum valid value
     * @param {number} actualVal - Actual value received
     */
    constructor(procName, argName, minVal, maxVal, actualVal) {
        const message = `${procName}: ${argName} out of range [${minVal}, ${maxVal}], got ${actualVal}`;
        super(message, [actualVal], procName);
        this.name = 'SchemeRangeError';
        this.argName = argName;
        this.minVal = minVal;
        this.maxVal = maxVal;
        this.actualVal = actualVal;
    }
}

/**
 * Error during reading/parsing of Scheme code.
 */
class SchemeReadError extends SchemeError {
    /**
     * @param {string} message - Error description
     * @param {string} [context] - What was being read (e.g., "list", "string")
     * @param {number} [line] - Line number if available
     * @param {number} [column] - Column number if available
     */
    constructor(message, context = null, line = null, column = null) {
        const location = line !== null ? ` at line ${line}` : '';
        const fullMessage = context
            ? `read: ${message} (while reading ${context})${location}`
            : `read: ${message}${location}`;
        super(fullMessage, [], 'read');
        this.name = 'SchemeReadError';
        this.context = context;
        this.line = line;
        this.column = column;
    }
}

/**
 * Error for syntax violations in Scheme code.
 */
class SchemeSyntaxError extends SchemeError {
    /**
     * @param {string} message - Error description
     * @param {*} form - The problematic form (for display)
     * @param {string} [context] - What special form or macro was being analyzed
     */
    constructor(message, form = null, context = null) {
        const prefix = context ? `${context}: ` : '';
        super(`${prefix}${message}`, form ? [form] : [], context);
        this.name = 'SchemeSyntaxError';
        this.form = form;
        this.context = context;
    }
}

/**
 * Error for unbound variables.
 */
class SchemeUnboundError extends SchemeError {
    /**
     * @param {string} varName - The unbound variable name
     * @param {boolean} [isSet] - True if this was a set! operation
     */
    constructor(varName, isSet = false) {
        const operation = isSet ? 'set!' : 'reference';
        const message = `${operation}: unbound variable: ${varName}`;
        super(message, [varName], isSet ? 'set!' : null);
        this.name = 'SchemeUnboundError';
        this.varName = varName;
        this.isSet = isSet;
    }
}

/**
 * Error for library loading issues.
 */
class SchemeLibraryError extends SchemeError {
    /**
     * @param {string} message - Error description
     * @param {string} libraryName - Library identifier (e.g., "(scheme base)")
     */
    constructor(message, libraryName = null) {
        const prefix = libraryName ? `library ${libraryName}: ` : 'library: ';
        super(`${prefix}${message}`, libraryName ? [libraryName] : []);
        this.name = 'SchemeLibraryError';
        this.libraryName = libraryName;
    }
}

/**
 * Error for applying non-procedures.
 */
class SchemeApplicationError extends SchemeError {
    /**
     * @param {*} notAProc - The value that was attempted to be called
     */
    constructor(notAProc) {
        const typeName = getTypeName(notAProc);
        super(`application: not a procedure: ${typeName}`, [notAProc]);
        this.name = 'SchemeApplicationError';
        this.notAProc = notAProc;
    }
}

/**
 * Cons Cell and List Utilities for Scheme.
 * 
 * This module provides the fundamental Cons pair type and list operations.
 */


/**
 * Represents a Scheme pair (cons cell).
 */
class Cons {
    /**
     * @param {*} car - The first element.
     * @param {*} cdr - The second element.
     */
    constructor(car, cdr) {
        this.car = car;
        this.cdr = cdr;
    }

    toString() {
        return `(${this.toArray().join(' ')})`;
    }

    /**
     * Converts a proper list to a JS array.
     * For improper lists, includes a '.' Symbol and the final cdr.
     * @returns {Array} Array representation of the list.
     */
    toArray() {
        const arr = [];
        let current = this;
        while (current instanceof Cons) {
            arr.push(current.car);
            current = current.cdr;
        }
        if (current !== null) {
            // Improper list: include dot notation
            arr.push(new Symbol$1('.'));
            arr.push(current);
        }
        return arr;
    }
}

// =============================================================================
// Constructors
// =============================================================================

/**
 * Creates a cons cell.
 * @param {*} car - The first element.
 * @param {*} cdr - The second element.
 * @returns {Cons}
 */
function cons(car, cdr) {
    return new Cons(car, cdr);
}

/**
 * Creates a proper list from arguments.
 * @param {...*} args - Elements of the list.
 * @returns {Cons|null} A proper list, or null for empty.
 */
function list(...args) {
    let head = null;
    for (let i = args.length - 1; i >= 0; i--) {
        head = new Cons(args[i], head);
    }
    return head;
}

// =============================================================================
// Basic Accessors
// =============================================================================

/**
 * Returns the car of a pair, or null if given null.
 * @param {Cons|null} pair
 * @returns {*}
 */
function car(pair) {
    return pair === null ? null : pair.car;
}

/**
 * Returns the cdr of a pair, or null if given null.
 * @param {Cons|null} pair
 * @returns {*}
 */
function cdr(pair) {
    return pair === null ? null : pair.cdr;
}

// =============================================================================
// Compound Accessors (cadr, cddr, etc.)
// =============================================================================

/** @param {Cons} cons - (car (cdr cons)) */
function cadr(cons) { return cons.cdr.car; }

/** @param {Cons} cons - (cdr (cdr cons)) */
function cddr(cons) { return cons.cdr.cdr; }

/** @param {Cons} cons - (car (cdr (cdr cons))) */
function caddr(cons) { return cons.cdr.cdr.car; }

/** @param {Cons} cons - (cdr (cdr (cdr cons))) */
function cdddr(cons) { return cons.cdr.cdr.cdr; }

// =============================================================================
// List Utilities
// =============================================================================

/**
 * Converts a Scheme list to a JavaScript array.
 * @param {Cons|null} list - A proper Scheme list.
 * @returns {Array} JavaScript array of the list elements.
 * @throws {Error} If input is not a proper list.
 */
function toArray(list) {
    if (list === null) return [];
    if (!(list instanceof Cons)) {
        throw new SchemeTypeError('toArray', 1, 'list', list);
    }
    return list.toArray();
}

/**
 * Registry for macro transformers.
 * Maps symbol names to transformer functions.
 */
class MacroRegistry {
    constructor(parent = null) {
        this.macros = new Map();
        this.parent = parent;
    }

    /**
     * Registers a macro transformer.
     * @param {string} name - The name of the macro.
     * @param {Function} transformer - The transformer function.
     */
    define(name, transformer) {
        this.macros.set(name, transformer);
    }

    /**
     * Checks if a name is bound to a macro.
     * @param {string} name
     * @returns {boolean}
     */
    isMacro(name) {
        if (this.macros.has(name)) return true;
        if (this.parent) return this.parent.isMacro(name);
        return false;
    }

    /**
     * Retrieves the transformer for a macro.
     * @param {string} name
     * @returns {Function | undefined}
     */
    lookup(name) {
        if (this.macros.has(name)) return this.macros.get(name);
        if (this.parent) return this.parent.lookup(name);
        return undefined;
    }

    /**
     * Clears all macros (useful for testing).
     */
    clear() {
        this.macros.clear();
        this.parent = null;
    }
}
const globalMacroRegistry = new MacroRegistry();

/**
 * Interpreter Context
 * 
 * Encapsulates all mutable state for a single interpreter instance.
 * This enables multiple isolated interpreters to coexist without
 * sharing global state, which is essential for:
 * - Parallel test execution
 * - Multi-tenant REPL environments
 * - Sandboxed evaluation
 */


// =============================================================================
// Scope Binding Registry (moved from syntax_object.js)
// =============================================================================

/**
 * Maps (name, scopes) → binding information within a context.
 * When resolving an identifier:
 * 1. Find all bindings for that name
 * 2. Find the binding whose scopes are a maximal subset of the identifier's scopes
 * 3. Return that binding, or null if none found
 */
let ScopeBindingRegistry$1 = class ScopeBindingRegistry {
    constructor() {
        /** @type {Map<string, Map<string, { scopes: Set<number>, value: * }>>} */
        this.bindings = new Map();
    }

    /**
     * Registers a binding for a name with given scopes.
     * @param {string} name 
     * @param {Set<number>} scopes 
     * @param {*} value 
     */
    register(name, scopes, value) {
        if (!this.bindings.has(name)) {
            this.bindings.set(name, new Map());
        }
        const scopeKey = [...scopes].sort((a, b) => a - b).join(',');
        this.bindings.get(name).set(scopeKey, { scopes: new Set(scopes), value });
    }

    /**
     * Resolves a binding for a name given the identifier's scopes.
     * Uses maximal subset matching.
     * @param {string} name 
     * @param {Set<number>} identifierScopes 
     * @returns {* | null}
     */
    resolve(name, identifierScopes) {
        const nameBindings = this.bindings.get(name);
        if (!nameBindings) return null;

        let bestMatch = null;
        let bestSize = -1;

        for (const [, binding] of nameBindings) {
            // Check if binding.scopes is a subset of identifierScopes
            let isSubset = true;
            for (const scope of binding.scopes) {
                if (!identifierScopes.has(scope)) {
                    isSubset = false;
                    break;
                }
            }
            if (isSubset && binding.scopes.size > bestSize) {
                bestMatch = binding.value;
                bestSize = binding.scopes.size;
            }
        }
        return bestMatch;
    }

    /**
     * Clears all bindings.
     */
    clear() {
        this.bindings.clear();
    }
};

// =============================================================================
// Interpreter Context
// =============================================================================

/**
 * Holds all mutable state for a single interpreter instance.
 * 
 * When creating interpreters that should be isolated from each other,
 * each should have its own InterpreterContext instance.
 */
class InterpreterContext {
    constructor() {
        // Counters
        /** Scope ID counter for unique scope marks */
        this.scopeCounter = 0;
        /** Unique ID counter for analyzed variables */
        this.uniqueIdCounter = 0;

        // Caches and Registries
        /** Interned SyntaxObjects: key → SyntaxObject */
        this.syntaxInternCache = new Map();
        /** Scope → Binding registry */
        this.scopeRegistry = new ScopeBindingRegistry$1();
        /** Library scope → Environment map */
        this.libraryScopeEnvMap = new Map();
        /** Macro transformer registry (global for this context) - isolated but sees global macros */
        this.macroRegistry = new MacroRegistry(globalMacroRegistry);
        /** Current macro registry stack for scoped expansion (transient during analysis) */
        this.currentMacroRegistry = this.macroRegistry;
        /** Loaded libraries: key → { exports, env } */
        this.libraryRegistry = new Map();
        /** Feature flags for cond-expand */
        this.features = new Set(['r7rs', 'scheme-js', 'ratios', 'exact-complex']);

        // Detect environment
        const isNode = typeof process !== 'undefined' &&
            process.versions != null &&
            process.versions.node != null;
        this.features.add(isNode ? 'node' : 'browser');

        /** File resolver for loading library files */
        this.fileResolver = null;

        /** Baseline macro names for reset */
        this.baselineMacroNames = null;

        /** Stack of currently active defining scopes (for library loading) */
        this.definingScopes = [];
    }

    // =========================================================================
    // Scope Management
    // =========================================================================

    /**
     * Creates a fresh scope identifier.
     * @returns {number} A unique scope ID
     */
    freshScope() {
        return this.scopeCounter++;
    }

    /**
     * Resets the scope counter. (For testing)
     */
    resetScopeCounter() {
        this.scopeCounter = 0;
    }

    // =========================================================================
    // Unique ID Management
    // =========================================================================

    /**
     * Creates a fresh unique ID for analyzed variables.
     * @returns {number}
     */
    freshUniqueId() {
        return this.uniqueIdCounter++;
    }

    /**
     * Resets the unique ID counter. (For testing)
     */
    resetUniqueIdCounter() {
        this.uniqueIdCounter = 0;
    }

    // =========================================================================
    // Syntax Interning
    // =========================================================================

    /**
     * Generates a cache key for a syntax object.
     * @param {string} name 
     * @param {Set<number>} scopes 
     * @returns {string}
     */
    getSyntaxKey(name, scopes) {
        const sortedScopes = [...scopes].sort((a, b) => a - b).join(',');
        return `${name}|${sortedScopes}`;
    }

    /**
     * Clears the syntax intern cache. (For testing)
     */
    resetSyntaxCache() {
        this.syntaxInternCache.clear();
    }

    // =========================================================================
    // Macro Registry
    // =========================================================================

    /**
     * Takes a snapshot of the current macro registry state as the baseline.
     */
    snapshotMacroRegistry() {
        this.baselineMacroNames = new Set(this.macroRegistry.macros.keys());
    }

    /**
     * Resets the macro registry to the baseline state.
     */
    resetMacroRegistry() {
        if (this.baselineMacroNames === null) {
            this.macroRegistry.macros.clear();
        } else {
            for (const name of this.macroRegistry.macros.keys()) {
                if (!this.baselineMacroNames.has(name)) {
                    this.macroRegistry.macros.delete(name);
                }
            }
        }
    }

    // =========================================================================
    // Library Registry
    // =========================================================================

    /**
     * Converts a library name to a string key.
     * @param {Array} name - Library name as list or array
     * @returns {string}
     */
    libraryNameToKey(name) {
        if (Array.isArray(name)) {
            return name.join('.');
        }
        // Assume it's a Cons list - convert to array first
        const parts = [];
        let current = name;
        while (current !== null && current.car !== undefined) {
            const part = current.car;
            parts.push(typeof part === 'object' && part.name ? part.name : String(part));
            current = current.cdr;
        }
        return parts.join('.');
    }

    /**
     * Checks if a library is loaded.
     * @param {string} key 
     * @returns {boolean}
     */
    isLibraryLoaded(key) {
        return this.libraryRegistry.has(key);
    }

    /**
     * Gets a library's exports.
     * @param {string|Array} library 
     * @returns {Map|null}
     */
    getLibraryExports(library) {
        const key = Array.isArray(library) ? library.join('.') : library;
        const entry = this.libraryRegistry.get(key);
        return entry ? entry.exports : null;
    }

    /**
     * Registers a library.
     * @param {string} key 
     * @param {Map} exports 
     * @param {*} env 
     */
    registerLibrary(key, exports$1, env) {
        this.libraryRegistry.set(key, { exports: exports$1, env });
    }

    /**
     * Clears the library registry. (For testing)
     */
    clearLibraryRegistry() {
        this.libraryRegistry.clear();
    }

    // =========================================================================
    // Feature Detection
    // =========================================================================

    /**
     * Checks if a feature is supported.
     * @param {string} featureName 
     * @returns {boolean}
     */
    hasFeature(featureName) {
        return this.features.has(featureName);
    }

    /**
     * Adds a feature.
     * @param {string} featureName 
     */
    addFeature(featureName) {
        this.features.add(featureName);
    }

    // =========================================================================
    // Full Reset (For Testing)
    // =========================================================================

    /**
     * Resets all state in this context to initial values.
     * Useful for test isolation.
     */
    reset() {
        this.scopeCounter = 0;
        this.uniqueIdCounter = 0;
        this.syntaxInternCache.clear();
        this.scopeRegistry.clear();
        this.libraryScopeEnvMap.clear();
        this.resetMacroRegistry();
        this.libraryRegistry.clear();
        this.definingScopes = [];
    }

    // =========================================================================
    // Defining Scope Stack (for library loading)
    // =========================================================================

    /**
     * Push a defining scope onto the stack.
     * Call this when entering a library or module context.
     * @param {number} scope - The scope ID
     */
    pushDefiningScope(scope) {
        this.definingScopes.push(scope);
    }

    /**
     * Pop the current defining scope from the stack.
     * Call this when exiting a library or module context.
     * @returns {number|undefined} The popped scope ID
     */
    popDefiningScope() {
        return this.definingScopes.pop();
    }

    /**
     * Get all currently active defining scopes.
     * @returns {number[]} Array of scope IDs
     */
    getDefiningScopes() {
        return [...this.definingScopes];
    }

    /**
     * Register a library scope with its environment.
     * @param {number} scope - The scope ID
     * @param {Environment} env - The library's environment
     */
    registerLibraryScope(scope, env) {
        this.libraryScopeEnvMap.set(scope, env);
    }

    /**
     * Look up the environment for a library scope.
     * @param {number} scope - The scope ID
     * @returns {Environment|undefined}
     */
    lookupLibraryEnv(scope) {
        return this.libraryScopeEnvMap.get(scope);
    }
}

// =============================================================================
// Default Global Context (for backwards compatibility)
// =============================================================================

/**
 * The default global context, used when no explicit context is provided.
 * This maintains backwards compatibility with existing code.
 */
const globalContext = new InterpreterContext();
globalContext.macroRegistry = globalMacroRegistry;
globalContext.currentMacroRegistry = globalMacroRegistry;

/**
 * Syntax Objects for Hygienic Macros
 * 
 * Implements Dybvig-style hygiene using marks (scopes).
 * Each identifier carries a set of scope marks that determine how it resolves.
 * 
 * Key concepts:
 * - A "scope" represents a lexical context (macro definition, expansion, binding form)
 * - Each identifier tracks which scopes it's been through via "marks"
 * - Resolution finds the binding whose scopes are a subset of the identifier's scopes
 * 
 * All mutable state is delegated to the globalContext from context.js for proper isolation.
 */


// =============================================================================
// Syntax Object Interning (delegated to globalContext)
// =============================================================================

/**
 * Generates a cache key for a syntax object.
 * @param {string} name 
 * @param {Set<number>} scopes 
 * @returns {string}
 */
function getSyntaxKey(name, scopes) {
    if (scopes.size === 0) return name;
    // Sort scopes for canonical key
    const sortedScopes = [...scopes].sort((a, b) => a - b);
    return `${name}|${sortedScopes.join(',')}`;
}

/**
 * Returns a canonical (interned) SyntaxObject for the given name and scopes.
 * This ensures that identifiers with the same name and scopes are object-identical,
 * which is required for using them as keys in Map-based environments.
 * 
 * Delegates to globalContext's syntaxInternCache for isolation.
 * 
 * @param {string} name 
 * @param {Set<number>|Array<number>} scopes 
 * @param {Object} context - Source location info (optional, for error messages)
 * @returns {SyntaxObject}
 */
function internSyntax(name, scopes, context = null) {
    const scopeSet = scopes instanceof Set ? scopes : new Set(scopes);
    const key = getSyntaxKey(name, scopeSet);

    if (globalContext.syntaxInternCache.has(key)) {
        return globalContext.syntaxInternCache.get(key);
    }

    // Note: We use the constructor directly here.
    // The constructor does NOT intern automatically to allow temporary objects if needed,
    // but typically internSyntax should be used.
    const obj = new SyntaxObject$1(name, scopeSet, context);
    globalContext.syntaxInternCache.set(key, obj);
    return obj;
}

/**
 * The global scope ID, used for top-level bindings.
 * @type {number}
 */
const GLOBAL_SCOPE_ID = 0;

// =============================================================================
// Library Scope Environment Map (delegated to globalContext)
// =============================================================================

/**
 * Alias to globalContext.libraryScopeEnvMap for backwards compatibility.
 * @type {Map<number, Environment>}
 */
globalContext.libraryScopeEnvMap;

// =============================================================================
// SyntaxObject Class
// =============================================================================

/**
 * A syntax object wraps an identifier with scope information.
 * 
 * Two identifiers are considered the same binding if:
 * - They have the same name
 * - Their scope marks resolve to the same binding
 */
let SyntaxObject$1 = class SyntaxObject {
    /**
     * @param {string} name - The identifier name
     * @param {Set<number>} scopes - Set of scope marks
     * @param {Object} context - Source location info (optional, for error messages)
     */
    constructor(name, scopes = new Set(), context = null) {
        this.name = name;
        this.scopes = scopes instanceof Set ? scopes : new Set(scopes);
        this.context = context;
    }

    /**
     * Create a copy with an additional scope mark.
     * @param {number} scope - The scope to add
     * @returns {SyntaxObject} New syntax object with the mark
     */
    addScope(scope) {
        const newScopes = new Set(this.scopes);
        newScopes.add(scope);
        return internSyntax(this.name, newScopes, this.context);
    }

    /**
     * Create a copy with a scope mark removed (for crossing binding boundaries).
     * @param {number} scope - The scope to remove
     * @returns {SyntaxObject} New syntax object without the mark
     */
    removeScope(scope) {
        const newScopes = new Set(this.scopes);
        newScopes.delete(scope);
        return internSyntax(this.name, newScopes, this.context);
    }

    /**
     * Create a copy that flips a scope mark (add if absent, remove if present).
     * This is used in anti-mark hygiene implementations.
     * When all scopes cancel out (empty set), returns a plain Symbol.
     * @param {number} scope - The scope to flip
     * @returns {SyntaxObject|Symbol} New syntax object with flipped mark, or Symbol if empty
     */
    flipScope(scope) {
        const newScopes = new Set(this.scopes);
        if (newScopes.has(scope)) {
            newScopes.delete(scope);
        } else {
            newScopes.add(scope);
        }
        // If all scopes cancelled, return a plain Symbol instead of empty-scoped SyntaxObject
        // This ensures proper equal? behavior after anti-mark + mark cancellation
        if (newScopes.size === 0) {
            return intern(this.name);
        }
        return internSyntax(this.name, newScopes, this.context);
    }

    /**
     * bound-identifier=? : Two identifiers that would bind the same if
     * used in binding position at the same point.
     * @param {SyntaxObject} other 
     * @returns {boolean}
     */
    boundIdentifierEquals(other) {
        if (!(other instanceof SyntaxObject)) return false;
        if (this.name !== other.name) return false;
        if (this.scopes.size !== other.scopes.size) return false;
        for (const s of this.scopes) {
            if (!other.scopes.has(s)) return false;
        }
        return true;
    }

    /**
     * Convert to a plain Symbol for backward compatibility with existing code.
     * @returns {Symbol}
     */
    toSymbol() {
        return intern(this.name);
    }

    toString() {
        const scopeStr = this.scopes.size > 0
            ? `{${[...this.scopes].sort().join(',')}}`
            : '';
        return `#<syntax ${this.name}${scopeStr}>`;
    }
};

// =============================================================================
// Scope Binding Registry
// =============================================================================

/**
 * The ScopeBindingRegistry maps (name, scopes) → binding information.
 * 
 * When resolving an identifier:
 * 1. Find all bindings for that name
 * 2. Find the binding whose scopes are a maximal subset of the identifier's scopes
 * 3. Return that binding, or null if none found
 */
class ScopeBindingRegistry {
    constructor() {
        /**
         * Map from name to list of {scopes: Set, binding: any}
         * @type {Map<string, Array<{scopes: Set<number>, binding: any}>>}
         */
        this.bindings = new Map();
    }

    /**
     * Register a binding for a name with specific scopes.
     * @param {string} name - The identifier name
     * @param {Set<number>} scopes - The scopes where this binding is visible
     * @param {any} binding - The binding information (value, type, etc.)
     */
    bind(name, scopes, binding) {
        if (!this.bindings.has(name)) {
            this.bindings.set(name, []);
        }
        this.bindings.get(name).push({ scopes: new Set(scopes), binding });
    }

    /**
     * Resolve an identifier to its binding.
     * 
     * Finds the binding with the largest scope set that is a subset of
     * the identifier's scopes. This implements the "most specific binding" rule.
     * 
     * @param {SyntaxObject} syntaxObj - The identifier to resolve
     * @returns {any|null} The binding, or null if not found in registry
     */
    resolve(syntaxObj) {
        const name = syntaxObj instanceof SyntaxObject$1 ? syntaxObj.name : syntaxObj.name;
        const idScopes = syntaxObj instanceof SyntaxObject$1 ? syntaxObj.scopes : new Set();

        if (!this.bindings.has(name)) {
            return null;
        }

        let bestBinding = null;
        let bestSize = -1;

        for (const { scopes, binding } of this.bindings.get(name)) {
            // Check if binding's scopes are a subset of identifier's scopes
            let isSubset = true;
            for (const s of scopes) {
                if (!idScopes.has(s)) {
                    isSubset = false;
                    break;
                }
            }

            if (isSubset && scopes.size >= bestSize) {
                bestBinding = binding;
                bestSize = scopes.size;
            }
        }

        return bestBinding;
    }

    /**
     * Check if a name has any bindings registered.
     * @param {string} name 
     * @returns {boolean}
     */
    hasBindings(name) {
        return this.bindings.has(name) && this.bindings.get(name).length > 0;
    }

    /**
     * Clear all bindings. Used for testing.
     */
    clear() {
        this.bindings.clear();
    }
}

// =============================================================================
// Global Scope Registry
// =============================================================================

/**
 * The global scope binding registry, used for macro-introduced bindings
 * and referential transparency.
 */
const globalScopeRegistry = new ScopeBindingRegistry();

/**
 * Check if an object is a SyntaxObject.
 * @param {any} obj 
 * @returns {boolean}
 */
function isSyntaxObject(obj) {
    return obj instanceof SyntaxObject$1;
}

/**
 * Get the name from a symbol or syntax object.
 * @param {Symbol|SyntaxObject} obj 
 * @returns {string}
 */
function syntaxName(obj) {
    if (obj instanceof SyntaxObject$1) return obj.name;
    if (obj instanceof Symbol$1) return obj.name;
    throw new SchemeTypeError('syntaxName', 1, 'symbol or syntax object', obj);
}

/**
 * Reference to a global variable (dynamic lookup).
 * Can optionally carry the defining scope ID to locate the correct library environment.
 */
class GlobalRef {
    /**
     * @param {string} name 
     * @param {number|null} scope - The defining scope ID (if inside a library)
     */
    constructor(name, scope = null) {
        this.name = name;
        this.scope = scope;
    }
}

/**
 * Compares two identifiers for equality (same name and scopes).
 * Handles both Symbols and SyntaxObjects.
 * @param {Symbol|SyntaxObject} id1 
 * @param {Symbol|SyntaxObject} id2 
 * @returns {boolean}
 */
function identifierEquals(id1, id2) {
    if (id1 instanceof SyntaxObject$1) {
        if (id2 instanceof SyntaxObject$1) {
            return id1.boundIdentifierEquals(id2);
        } else if (id2 instanceof Symbol$1) {
            // Compare syntax object with symbol (treat symbol as empty scope)
            return id1.scopes.size === 0 && id1.name === id2.name;
        }
    } else if (id1 instanceof Symbol$1) {
        if (id2 instanceof SyntaxObject$1) {
            return id2.scopes.size === 0 && id2.name === id1.name;
        } else if (id2 instanceof Symbol$1) {
            return id1.name === id2.name;
        }
    }
    return false;
}

/**
 * Unwrap a syntax object to get the underlying symbol/value.
 * If strictly a symbol is needed, use toSymbol().
 * @param {any} obj 
 * @returns {any}
 */
function unwrapSyntax(obj) {
    if (obj instanceof SyntaxObject$1) {
        // recursively unwrap the content
        // If the content is a string, it's an identifier name -> Symbol
        if (typeof obj.name === 'string') {
            return intern(obj.name);
        }
        return unwrapSyntax(obj.name);
    }
    // Recursively unwrap Cons structures
    if (obj instanceof Cons) {
        const car = unwrapSyntax(obj.car);
        const cdr = unwrapSyntax(obj.cdr);
        return new Cons(car, cdr);
    }
    // Handle arrays (vectors)
    if (Array.isArray(obj)) {
        return obj.map(unwrapSyntax);
    }
    // Base case: return as is (Symbol, Number, String, etc)
    return obj;
}

/**
 * Get scope set from an object (empty if not syntax object).
 * @param {any} obj
 * @returns {Set<number>}
 */
function syntaxScopes(obj) {
    if (obj instanceof SyntaxObject$1) {
        return obj.scopes;
    }
    return new Set();
}

/**
 * Flip a scope mark on all identifiers in an expression.
 * Used for Dybvig anti-mark hygiene.
 * 
 * @param {any} exp - The expression to process
 * @param {number} scope - The scope ID to flip
 * @returns {any} Expression with scope marks flipped on all identifiers
 */
function flipScopeInExpression(exp, scope) {
    // Handle Symbol - wrap as SyntaxObject with scope (flip on empty = add)
    if (exp instanceof Symbol$1) {
        return internSyntax(exp.name, new Set([scope]));
    }

    // Handle SyntaxObject - flip scope on existing
    if (exp instanceof SyntaxObject$1) {
        return exp.flipScope(scope);
    }

    // Handle Cons - recurse on car and cdr
    if (exp instanceof Cons) {
        const car = flipScopeInExpression(exp.car, scope);
        const cdr = flipScopeInExpression(exp.cdr, scope);
        return new Cons(car, cdr);
    }

    // Handle arrays (vectors)
    if (Array.isArray(exp)) {
        return exp.map(e => flipScopeInExpression(e, scope));
    }

    // Primitives pass through unchanged
    return exp;
}

/**
 * AST Node Classes for the Scheme interpreter.
 * 
 * This module contains all AST (Abstract Syntax Tree) node classes.
 * AST nodes are produced by the Analyzer and represent program structure.
 * All nodes extend Executable and implement a step() method.
 */


// =============================================================================
// Helper Function
// =============================================================================

/**
 * Helper to ensure a value is an Executable AST node.
 * If it's already an Executable, returns it as-is.
 * Otherwise, wraps it in a Literal.
 * @param {*} obj 
 * @returns {Executable}
 */
function ensureExecutable(obj) {
    if (obj instanceof Executable) return obj;
    return new LiteralNode(obj);
}

// =============================================================================
// AST Nodes - Atomic
// =============================================================================

/**
 * A literal value (number, string, boolean).
 * This is an atomic expression that returns immediately.
 */
class LiteralNode extends Executable {
    /**
     * @param {*} value - The literal value.
     */
    constructor(value) {
        super();
        this.value = value;
    }

    step(registers, interpreter) {
        registers[ANS] = this.value;
        return false;
    }

    toString() { return `(Literal ${this.value})`; }
}

/**
 * A variable lookup.
 * This is an atomic expression that looks up a name in the environment.
 */
class VariableNode extends Executable {
    /**
     * @param {string} name - The variable name to look up.
     */
    constructor(name) {
        super();
        this.name = name;
    }

    step(registers, interpreter) {
        const env = registers[ENV];
        registers[ANS] = env.lookup(this.name);
        return false;
    }

    toString() { return `(Variable ${this.name})`; }
}

/**
 * A scoped variable lookup.
 * This is used for macro free variables that carry scope marks.
 * It first checks the scope binding registry, then falls back to the environment.
 */
class ScopedVariable extends Executable {
    /**
     * @param {string} name - The variable name to look up.
     * @param {Set<number>} scopes - The scope marks for this identifier.
     * @param {ScopeBindingRegistry} scopeRegistry - The registry to check first.
     */
    constructor(name, scopes, scopeRegistry) {
        super();
        this.name = name;
        this.scopes = scopes;
        this.scopeRegistry = scopeRegistry;
    }

    step(registers, interpreter) {
        // First, check scope registry for a marked binding
        if (this.scopeRegistry) {
            const resolved = this.scopeRegistry.resolve({ name: this.name, scopes: this.scopes });
            if (resolved !== null) {
                if (resolved instanceof GlobalRef) {
                    // Global/Dynamic lookup (for user defined globals or library internals)
                    // If the ref carries a scope, try to find the specific library environment
                    let envVal;
                    let found = false;

                    if (resolved.scope) {
                        const libEnv = globalContext.lookupLibraryEnv(resolved.scope);
                        if (libEnv) {
                            // Try to lookup in library env (findEnv avoids throwing if missing)
                            if (libEnv.findEnv(resolved.name)) {
                                envVal = libEnv.lookup(resolved.name);
                                found = true;
                            }
                        }
                    }

                    if (!found) {
                        // Fall back to current runtime environment
                        // This handles macro-introduced bindings that are local, not global
                        const env = registers[ENV];
                        envVal = env.lookup(resolved.name);
                    }
                    registers[ANS] = envVal;
                } else {
                    // Constant/Macro binding
                    registers[ANS] = resolved;
                }
                return false;
            }
        }

        // Fall back to regular environment lookup
        const env = registers[ENV];
        registers[ANS] = env.lookup(this.name);
        return false;
    }

    toString() { return `(ScopedVariable ${this.name} {${[...this.scopes].join(',')}})`; }
}

/**
 * A lambda expression.
 * Creates a closure capturing the current environment.
 */
class LambdaNode extends Executable {
    /**
     * @param {Array<string>} params - Array of parameter names.
     * @param {Executable} body - The body expression.
     * @param {string|null} restParam - Name of rest parameter, or null if none.
     */
    constructor(params, body, restParam = null) {
        super();
        this.params = params;
        this.body = body;
        this.restParam = restParam;
    }

    step(registers, interpreter) {
        registers[ANS] = createClosure(this.params, this.body, registers[ENV], this.restParam, interpreter);
        return false;
    }

    toString() { return `(Lambda (${this.params.join(' ')}${this.restParam ? ' . ' + this.restParam : ''}) ...`; }
}

/**
 * An 'if' expression.
 * Evaluates the test, then one of the branches.
 */
class IfNode extends Executable {
    /**
     * @param {Executable} test - The test expression.
     * @param {Executable} consequent - The 'then' branch.
     * @param {Executable} alternative - The 'else' branch.
     */
    constructor(test, consequent, alternative) {
        super();
        this.test = test;
        this.consequent = consequent;
        this.alternative = alternative;
    }

    step(registers, interpreter) {
        registers[FSTACK].push(createIfFrame(
            this.consequent,
            this.alternative,
            registers[ENV]
        ));
        registers[CTL] = this.test;
        return true;
    }
}

/**
 * A variable assignment (set!).
 * Evaluates the expression, then updates the binding.
 */
class SetNode extends Executable {
    /**
     * @param {string} name - The variable name to set.
     * @param {Executable} valueExpr - The expression to evaluate.
     */
    constructor(name, valueExpr) {
        super();
        this.name = name;
        this.valueExpr = valueExpr;
    }

    step(registers, interpreter) {
        registers[FSTACK].push(createSetFrame(
            this.name,
            registers[ENV]
        ));
        registers[CTL] = this.valueExpr;
        return true;
    }
}

/**
 * A variable definition (define).
 * Evaluates the expression, then creates a binding in the current scope.
 */
class DefineNode extends Executable {
    /**
     * @param {string} name - The variable name to define.
     * @param {Executable} valueExpr - The expression to evaluate.
     */
    constructor(name, valueExpr) {
        super();
        this.name = name;
        this.valueExpr = valueExpr;
    }

    step(registers, interpreter) {
        registers[FSTACK].push(createDefineFrame(
            this.name,
            registers[ENV]
        ));
        registers[CTL] = this.valueExpr;
        return true;
    }
}

/**
 * A tail-call application.
 * This is the only complex node that doesn't push its own frame first,
 * because it's in tail position.
 */
class TailAppNode extends Executable {
    /**
     * @param {Executable} funcExpr - The function expression.
     * @param {Array<Executable>} argExprs - The argument expressions.
     */
    constructor(funcExpr, argExprs) {
        super();
        this.funcExpr = funcExpr;
        this.argExprs = argExprs;
    }

    step(registers, interpreter) {
        const allExprs = [this.funcExpr, ...this.argExprs];
        const firstExpr = allExprs[0];
        const remainingExprs = allExprs.slice(1);

        registers[FSTACK].push(createAppFrame(
            remainingExprs,
            [],
            registers[ENV]
        ));

        registers[CTL] = firstExpr;
        return true;
    }
}

/**
 * call-with-current-continuation.
 * Captures the current continuation and passes it to the lambda.
 */
class CallCCNode extends Executable {
    /**
     * @param {Executable} lambdaExpr - Should be a (lambda (k) ...) expression.
     */
    constructor(lambdaExpr) {
        super();
        this.lambdaExpr = lambdaExpr;
    }

    step(registers, interpreter) {
        const continuation = createContinuation(registers[FSTACK], interpreter);

        registers[CTL] = new TailAppNode(
            this.lambdaExpr,
            [new LiteralNode(continuation)]
        );
        return true;
    }
}

/**
 * A 'begin' expression.
 * Evaluates a sequence of expressions, returning the last.
 */
class BeginNode extends Executable {
    /**
     * @param {Array<Executable>} expressions - The expressions to evaluate.
     */
    constructor(expressions) {
        super();
        this.expressions = expressions;
    }

    step(registers, interpreter) {
        if (this.expressions.length === 0) {
            registers[ANS] = null;
            return false;
        }

        const firstExpr = this.expressions[0];
        const remainingExprs = this.expressions.slice(1);

        if (remainingExprs.length > 0) {
            registers[FSTACK].push(createBeginFrame(
                remainingExprs,
                registers[ENV]
            ));
        }

        registers[CTL] = firstExpr;
        return true;
    }
}

/**
 * AST Node for top-level import.
 * Populates the environment with exports from a loaded library.
 * Libraries must be loaded into the registry first.
 */
class ImportNode extends Executable {
    /**
     * @param {Array<object>} importSpecs - Array of { libraryName, only, except, rename, prefix }
     * @param {Function} loadLibrary - Function to load a library recursively (sync or async depending on usage)
     * @param {Function} applyImports - Function to apply imports to an environment
     * @param {Function} analyze - Analyze function for loading libraries
     */
    constructor(importSpecs, loadLibrary, applyImports, analyze) {
        super();
        this.importSpecs = importSpecs;
        this.loadLibrary = loadLibrary;
        this.applyImports = applyImports;
        this.analyze = analyze;
    }

    step(registers, interpreter) {
        const env = registers[ENV];
        for (const spec of this.importSpecs) {
            // Load the library (synchronously if loadLibrary is sync)
            const exports$1 = this.loadLibrary(spec.libraryName, this.analyze, interpreter, env);
            this.applyImports(env, exports$1, spec);
        }
        registers[ANS] = true;
        return false;
    }
}

/**
 * AST Node for define-library.
 * Registers a new library definition at runtime.
 */
class DefineLibraryNode extends Executable {
    /**
     * @param {Object} libDef - Parsed library definition
     * @param {Function} evaluateLibraryDefinition - Function to evaluate and register library
     * @param {Function} analyze - Analyze function
     */
    constructor(libDef, evaluateLibraryDefinition, analyze) {
        super();
        this.libDef = libDef;
        this.evaluateLibraryDefinition = evaluateLibraryDefinition;
        this.analyze = analyze;
    }

    step(registers, interpreter) {
        const env = registers[ENV];
        // Evaluate the library (synchronously if evaluateLibraryDefinition is sync)
        this.evaluateLibraryDefinition(this.libDef, this.analyze, interpreter, env);
        registers[ANS] = true; // Returns true/unspecified
        return false;
    }
}

// =============================================================================
// AST Nodes - Dynamic Wind
// =============================================================================

/**
 * AST Node to initialize 'dynamic-wind'.
 * Primitives cannot touch the stack, so they return this node to do it.
 */
class DynamicWindInit extends Executable {
    /**
     * @param {Closure} before - The 'before' thunk.
     * @param {Closure} thunk - The main thunk.
     * @param {Closure} after - The 'after' thunk.
     */
    constructor(before, thunk, after) {
        super();
        this.before = before;
        this.thunk = thunk;
        this.after = after;
    }

    step(registers, interpreter) {
        registers[FSTACK].push(createDynamicWindSetupFrame(
            this.before,
            this.thunk,
            this.after,
            registers[ENV]
        ));

        registers[CTL] = new TailAppNode(ensureExecutable(this.before), []);
        return true;
    }
}

/**
 * Special AST node to restore a continuation's stack and value.
 * Used as the final step in a dynamic-wind sequence.
 */
class RestoreContinuation extends Executable {
    /**
     * @param {Array} targetStack - The stack to restore.
     * @param {*} value - The value to restore.
     */
    constructor(targetStack, value) {
        super();
        this.targetStack = targetStack;
        this.value = value;
    }

    step(registers, interpreter) {
        registers[FSTACK] = [...this.targetStack];
        registers[ANS] = this.value;
        return false;
    }
}

// =============================================================================
// AST Nodes - Multiple Values
// =============================================================================

/**
 * AST node for call-with-values.
 * Calls producer with no arguments, then applies consumer to the result(s).
 */
class CallWithValuesNode extends Executable {
    /**
     * @param {Closure} producer - Zero-argument procedure that produces values
     * @param {Closure} consumer - Procedure that consumes the values
     */
    constructor(producer, consumer) {
        super();
        this.producer = producer;
        this.consumer = consumer;
    }

    step(registers, interpreter) {
        registers[FSTACK].push(createCallWithValuesFrame(
            this.consumer,
            registers[ENV]
        ));

        registers[CTL] = new TailAppNode(ensureExecutable(this.producer), []);
        return true;
    }

    toString() { return "(CallWithValues ...)"; }
}

// =============================================================================
// AST Nodes - Exceptions
// =============================================================================

/**
 * AST node to set up with-exception-handler.
 * Pushes ExceptionHandlerFrame, then executes thunk.
 */
class WithExceptionHandlerInit extends Executable {
    /**
     * @param {Closure|Function} handler - Exception handler procedure
     * @param {Closure|Function} thunk - Zero-argument procedure to execute
     */
    constructor(handler, thunk) {
        super();
        this.handler = handler;
        this.thunk = thunk;
    }

    step(registers, interpreter) {
        // Push handler frame onto stack (using factory to avoid circular dep)
        registers[FSTACK].push(createExceptionHandlerFrame(
            this.handler,
            registers[ENV]
        ));

        // Execute thunk
        registers[CTL] = new TailAppNode(ensureExecutable(this.thunk), []);
        return true;
    }
}

/**
 * AST node to raise an exception.
 * Searches the stack for ExceptionHandlerFrame, then invokes it.
 */
class RaiseNode extends Executable {
    /**
     * @param {*} exception - The exception value to raise
     * @param {boolean} continuable - Whether this is a continuable exception
     */
    constructor(exception, continuable = false) {
        super();
        this.exception = exception;
        this.continuable = continuable;
    }

    step(registers, interpreter) {
        const fstack = registers[FSTACK];

        // Search for the nearest ExceptionHandlerFrame
        const ExceptionHandlerFrame = getExceptionHandlerFrameClass();
        let handlerIndex = -1;
        for (let i = fstack.length - 1; i >= 0; i--) {
            if (fstack[i] instanceof ExceptionHandlerFrame) {
                handlerIndex = i;
                break;
            }
        }

        if (handlerIndex === -1) {
            // No handler found - propagate as JS error
            const exc = this.exception;
            if (exc instanceof Error) {
                throw exc;
            }
            throw new SchemeError(`Unhandled exception: ${exc}`, [exc]);
        }

        // Get the handler
        const handlerFrame = fstack[handlerIndex];
        const handler = handlerFrame.handler;

        // Find WindFrames between current position and handler that need unwinding
        const WindFrameClass = getWindFrameClass();
        const framesToUnwind = fstack.slice(handlerIndex + 1).reverse()
            .filter(f => f instanceof WindFrameClass);

        // Build the action sequence: unwind frames, then invoke handler
        const actions = [];

        // Add 'after' thunks for each WindFrame to unwind
        for (const frame of framesToUnwind) {
            actions.push(new TailAppNode(ensureExecutable(frame.after), []));
        }

        // The final action is to invoke the handler
        // We create an InvokeExceptionHandler to handle the actual invocation
        // after unwinding is complete
        actions.push(new InvokeExceptionHandler(
            handler,
            this.exception,
            handlerIndex,
            this.continuable,
            fstack.slice(handlerIndex + 1) // Save frames for continuable
        ));

        // Truncate stack to handler (keeping handler for now, InvokeExceptionHandler will remove it)
        fstack.length = handlerIndex + 1;

        // Execute via Begin mechanism
        if (actions.length === 1) {
            registers[CTL] = actions[0];
        } else {
            const firstAction = actions[0];
            const remainingActions = actions.slice(1);
            if (remainingActions.length > 0) {
                registers[FSTACK].push(createBeginFrame(remainingActions, registers[ENV]));
            }
            registers[CTL] = firstAction;
        }
        return true;
    }
}

/**
 * AST node to invoke exception handler after unwinding is complete.
 * This is the final step after all 'after' thunks have run.
 */
class InvokeExceptionHandler extends Executable {
    constructor(handler, exception, handlerIndex, continuable, savedFrames) {
        super();
        this.handler = handler;
        this.exception = exception;
        this.handlerIndex = handlerIndex;
        this.continuable = continuable;
        this.savedFrames = savedFrames;
    }

    step(registers, interpreter) {
        const fstack = registers[FSTACK];

        // Remove the handler frame
        fstack.pop(); // Pop the ExceptionHandlerFrame

        // For continuable: push a resume frame that allows handler return value
        if (this.continuable) {
            fstack.push(createRaiseContinuableResumeFrame(
                this.savedFrames,
                registers[ENV]
            ));
        } else {
            // For non-continuable: if handler returns, R7RS requires raising a secondary exception.
            fstack.push(new NonContinuableFrame());
        }

        // Invoke handler with the exception
        registers[CTL] = new TailAppNode(ensureExecutable(this.handler), [new LiteralNode(this.exception)]);
        return true;
    }
}

/**
 * Frame that traps return from a non-continuable exception handler.
 * Raises a secondary exception.
 */
class NonContinuableFrame {
    step(registers, interpreter) {
        // If we reached here, the handler returned, which is forbidden for 'raise'
        throw new SchemeError("non-continuable exception: handler returned");
    }
}

/**
 * Scheme Runtime Value Types
 * 
 * These classes and factory functions represent first-class values in the Scheme runtime
 * that are not primitive JavaScript values. They are used for closures, continuations,
 * and multiple return values.
 * 
 * IMPORTANT: Closures and Continuations are now created as callable JavaScript functions
 * with marker properties. This allows them to be called directly from JavaScript code
 * anywhere they appear (in variables, arrays, objects, Maps, etc.).
 */


// =============================================================================
// Marker Symbols for Type Identification
// =============================================================================

/**
 * Symbol used to mark callable functions as Scheme closures.
 * @type {symbol}
 */
const SCHEME_CLOSURE = Symbol.for('scheme.closure');

/**
 * Symbol used to mark callable functions as Scheme continuations.
 * @type {symbol}
 */
const SCHEME_CONTINUATION = Symbol.for('scheme.continuation');

// =============================================================================
// Type Checking Functions
// =============================================================================

/**
 * Checks if a value is a Scheme closure (callable function with closure marker).
 * @param {*} x - Value to check
 * @returns {boolean}
 */
function isSchemeClosure(x) {
    return typeof x === 'function' && x[SCHEME_CLOSURE] === true;
}

/**
 * Checks if a value is a Scheme continuation (callable function with continuation marker).
 * @param {*} x - Value to check
 * @returns {boolean}
 */
function isSchemeContinuation(x) {
    return typeof x === 'function' && x[SCHEME_CONTINUATION] === true;
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Creates a callable Scheme closure.
 * 
 * The returned function can be called directly from JavaScript and will
 * invoke the Scheme interpreter to execute the closure body.
 * 
 * @param {Array<string>} params - Parameter names.
 * @param {Executable} body - The body AST node.
 * @param {Environment} env - The captured lexical environment.
 * @param {string|null} restParam - Name of rest parameter, or null if none.
 * @param {Interpreter} interpreter - The interpreter instance.
 * @returns {Function} A callable function representing the Scheme closure.
 */
function createClosure(params, body, env, restParam, interpreter) {
    // Create the callable wrapper
    const closure = function (...jsArgs) {
        // Build the invocation AST: apply this closure to the given args
        const argLiterals = jsArgs.map(val => new LiteralNode(val));
        const ast = new TailAppNode(new LiteralNode(closure), argLiterals);

        // Run through the interpreter with a sentinel frame to capture result
        return interpreter.runWithSentinel(ast, this);
    };

    // Attach marker and closure data
    closure[SCHEME_CLOSURE] = true;
    closure.params = params;
    closure.body = body;
    closure.env = env;
    closure.restParam = restParam;

    // Custom toString for pretty-printing
    closure.toString = () => '#<procedure>';

    return closure;
}

/**
 * Creates a callable Scheme continuation.
 * 
 * The returned function can be called directly from JavaScript and will
 * invoke the continuation, rewinding the Scheme stack appropriately.
 * 
 * @param {Array} fstack - The captured frame stack (will be copied).
 * @param {Interpreter} interpreter - The interpreter instance.
 * @returns {Function} A callable function representing the Scheme continuation.
 */
function createContinuation(fstack, interpreter) {
    // Create the callable wrapper
    const continuation = function (...jsArgs) {
        // Handle multiple values: wrap 2+ args in Values
        let value;
        if (jsArgs.length === 0) {
            value = null;
        } else if (jsArgs.length === 1) {
            value = jsArgs[0];
        } else {
            value = new Values(jsArgs);
        }

        // Invoke the continuation through the interpreter
        return interpreter.invokeContinuation(continuation, value, this);
    };

    // Attach marker and continuation data
    continuation[SCHEME_CONTINUATION] = true;
    continuation.fstack = [...fstack];  // Store a copy

    // Custom toString for pretty-printing
    continuation.toString = () => '#<continuation>';

    return continuation;
}

// =============================================================================
// Legacy Classes (Kept for reference and internal data access)
// =============================================================================

/**
 * Base class for all procedures.
 * @deprecated Use isSchemeClosure/isSchemeContinuation for type checking
 */
class Procedure { }

/**
 * Closure data class - kept for backward compatibility and documentation.
 * 
 * @deprecated Closures are now created via createClosure() and are callable functions.
 *             Use isSchemeClosure() to check if a value is a Scheme closure.
 */
class Closure extends Procedure {
    /**
     * @param {Array<string>} params - Parameter names.
     * @param {Executable} body - The body AST node.
     * @param {Environment} env - The captured lexical environment.
     * @param {string|null} restParam - Name of rest parameter, or null if none.
     */
    constructor(params, body, env, restParam = null) {
        super();
        this.params = params;
        this.body = body;
        this.env = env;
        this.restParam = restParam;
    }

    toString() {
        return "#<procedure>";
    }
}

/**
 * Continuation data class - kept for backward compatibility and documentation.
 * 
 * @deprecated Continuations are now created via createContinuation() and are callable functions.
 *             Use isSchemeContinuation() to check if a value is a Scheme continuation.
 */
class Continuation {
    /**
     * @param {Array} fstack - The captured frame stack (copied).
     */
    constructor(fstack) {
        this.fstack = [...fstack];
    }

    toString() {
        return "#<continuation>";
    }
}

// =============================================================================
// Other Value Types
// =============================================================================

/**
 * TailCall "Thunk" for trampoline control flow.
 * Returned by primitives to request the interpreter to perform a tail call.
 */
class TailCall {
    /**
     * @param {*} func - The target (Closure, AST node, etc.)
     * @param {Array} args - Arguments for the call.
     */
    constructor(func, args) {
        this.func = func;
        this.args = args;
    }
}

/**
 * Error thrown to unwind the JavaScript stack when invoking a Continuation.
 * This allows jumping across JS boundaries (e.g. inside js-eval).
 */
class ContinuationUnwind extends Error {
    /**
     * @param {Array} registers - The register state to restore.
     * @param {boolean} isReturn - True if this is a value return, false for tail call.
     */
    constructor(registers, isReturn = false) {
        super("Continuation Unwind");
        this.registers = registers;
        this.isReturn = isReturn;
    }
}

/**
 * Multiple Values wrapper.
 * Used by `values` and `call-with-values` to pass multiple return values.
 * 
 * In R7RS, (values 1 2 3) returns a "multiple values" object.
 * call-with-values unpacks it and applies to the consumer.
 */
class Values {
    /**
     * @param {Array} values - The array of values being returned.
     */
    constructor(values) {
        this.values = values;
    }

    /**
     * Get the first value (used in single-value contexts and JS interop).
     * @returns {*} The first value, or undefined if empty.
     */
    first() {
        return this.values[0];
    }

    /**
     * Get all values as an array.
     * @returns {Array}
     */
    toArray() {
        return this.values;
    }

    toString() {
        return `#<values: ${this.values.length} values>`;
    }
}

/**
 * Frame Classes for the Scheme interpreter.
 * 
 * This module contains all Frame classes. Frames represent "the rest of the
 * computation" and are pushed onto the frame stack (fstack). They are popped
 * and executed after AST nodes complete their immediate work.
 * 
 * All frames extend Executable and implement a step() method.
 */


// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Register a binding with all currently active scopes.
 * Called when a define is evaluated during library loading.
 * Uses globalContext for scope tracking.
 * 
 * @param {string} name - The binding name
 * @param {any} [value] - The bound value (unused if GlobalRef is preferred)
 */
function registerBindingWithCurrentScopes(name, value) {
    const definingScopes = globalContext.getDefiningScopes();
    // Determine scope set (default to GLOBAL_SCOPE_ID if empty)
    const scopes = definingScopes.length > 0
        ? new Set(definingScopes)
        : new Set([GLOBAL_SCOPE_ID]);

    // Determine the specific defining scope (for Environment resolution)
    const definingScope = definingScopes.length > 0
        ? definingScopes[definingScopes.length - 1]
        : null;

    // Always bind as a GlobalRef to ensure dynamic lookup in the environment
    globalScopeRegistry.bind(name, scopes, new GlobalRef(name, definingScope));
}

/**
 * Filters out SentinelFrames from a stack.
 * SentinelFrames are JS boundary markers that should not be executed
 * when restoring a continuation.
 * @param {Array} stack - The stack to filter
 * @returns {Array} Stack with SentinelFrames removed
 */
function filterSentinelFrames(stack) {
    return stack.filter(f => f.constructor.name !== 'SentinelFrame');
}

// =============================================================================
// Frames - Control Flow
// =============================================================================

/**
 * Frame for an 'if' expression.
 * Waits for the test result, then evaluates appropriate branch.
 */
class IfFrame extends Executable {
    /**
     * @param {Executable} consequent - The 'then' branch.
     * @param {Executable} alternative - The 'else' branch.
     * @param {Environment} env - The captured environment.
     */
    constructor(consequent, alternative, env) {
        super();
        this.consequent = consequent;
        this.alternative = alternative;
        this.env = env;
    }

    step(registers, interpreter) {
        const testResult = registers[ANS];

        if (testResult !== false) {
            registers[CTL] = this.consequent;
        } else {
            registers[CTL] = this.alternative;
        }
        registers[ENV] = this.env;
        return true;
    }
}

/**
 * Frame for a 'set!' expression.
 * Waits for the value, then updates the binding.
 */
class SetFrame extends Executable {
    /**
     * @param {string} name - The variable name to set.
     * @param {Environment} env - The captured environment.
     */
    constructor(name, env) {
        super();
        this.name = name;
        this.env = env;
    }

    step(registers, interpreter) {
        const value = registers[ANS];
        this.env.set(this.name, value);
        registers[ANS] = undefined;
        return false;
    }
}

/**
 * Frame for a 'define' expression.
 * Waits for the value, then creates a binding in the current scope.
 * Also registers the binding with any active defining scopes (for macro hygiene).
 */
class DefineFrame extends Executable {
    /**
     * @param {string} name - The variable name to define.
     * @param {Environment} env - The captured environment.
     */
    constructor(name, env) {
        super();
        this.name = name;
        this.env = env;
    }

    step(registers, interpreter) {
        const value = registers[ANS];
        this.env.define(this.name, value);

        // Register binding with current defining scopes for macro referential transparency
        registerBindingWithCurrentScopes(this.name);

        registers[ANS] = undefined;
        return false;
    }
}

/**
 * Frame for a 'begin' expression.
 * Evaluates remaining expressions in sequence, returns the last.
 */
class BeginFrame extends Executable {
    /**
     * @param {Array<Executable>} remainingExprs - Expressions left to evaluate.
     * @param {Environment} env - The captured environment.
     */
    constructor(remainingExprs, env) {
        super();
        this.remainingExprs = remainingExprs;
        this.env = env;
    }

    step(registers, interpreter) {
        if (this.remainingExprs.length === 0) {
            return false;
        }

        const nextExpr = this.remainingExprs[0];
        const rest = this.remainingExprs.slice(1);

        registers[FSTACK].push(new BeginFrame(rest, this.env));

        registers[CTL] = nextExpr;
        registers[ENV] = this.env;
        return true;
    }
}

// =============================================================================
// Frames - Application
// =============================================================================

/**
 * Frame for a function application.
 * Accumulates evaluated arguments, then performs the application.
 */
class AppFrame extends Executable {
    /**
     * @param {Array<Executable>} argExprs - Remaining argument expressions.
     * @param {Array<*>} argValues - Already-evaluated argument values.
     * @param {Environment} env - The captured environment.
     */
    constructor(argExprs, argValues, env) {
        super();
        this.argExprs = argExprs;
        this.argValues = argValues;
        this.env = env;
    }

    step(registers, interpreter) {
        const value = registers[ANS];
        const newArgValues = [...this.argValues, value];

        if (this.argExprs.length > 0) {
            const nextArgExpr = this.argExprs[0];
            const remainingArgExprs = this.argExprs.slice(1);

            registers[FSTACK].push(new AppFrame(
                remainingArgExprs,
                newArgValues,
                this.env
            ));

            registers[CTL] = nextArgExpr;
            registers[ENV] = this.env;
            return true;
        }

        // All arguments evaluated, ready to apply
        const func = newArgValues[0];
        const args = newArgValues.slice(1);

        // 1. SCHEME CLOSURE APPLICATION
        // Check for callable Scheme closures first (they are typeof 'function')
        if (isSchemeClosure(func)) {
            registers[CTL] = func.body;

            // Handle rest parameter if present
            if (func.restParam) {
                // Required params get their args, rest param gets remaining as list
                const requiredCount = func.params.length;
                const requiredArgs = args.slice(0, requiredCount);
                const restArgs = args.slice(requiredCount);

                // Build a Scheme list from rest args
                let restList = null;
                for (let i = restArgs.length - 1; i >= 0; i--) {
                    restList = new Cons(restArgs[i], restList);
                }

                // Extend environment with required params + rest param
                const allParams = [...func.params, func.restParam];
                const allArgs = [...requiredArgs, restList];
                let newEnv = func.env.extendMany(allParams, allArgs);
                // Bind 'this' pseudo-variable if available (method call)
                if (registers[THIS] !== undefined) {
                    registers[ENV] = newEnv.extend('this', registers[THIS]);
                } else {
                    registers[ENV] = newEnv;
                }
            } else {
                let newEnv = func.env.extendMany(func.params, args);
                // Bind 'this' pseudo-variable if available (method call)
                if (registers[THIS] !== undefined) {
                    registers[ENV] = newEnv.extend('this', registers[THIS]);
                } else {
                    registers[ENV] = newEnv;
                }
            }
            return true;
        }

        // 2. SCHEME CONTINUATION INVOCATION
        // Check for callable Scheme continuations (they are also typeof 'function')
        if (isSchemeContinuation(func)) {
            return this.invokeContinuation(func, args, registers, interpreter);
        }

        // 3. JS FUNCTION APPLICATION
        // Regular JavaScript functions (including callable closures passed to JS)
        if (typeof func === 'function') {
            // CRITICAL: Push the current Scheme context before calling JS.
            // This allows callable closures/continuations invoked by JS to
            // properly track dynamic-wind frames for unwinding/rewinding.
            interpreter.pushJsContext(registers[FSTACK]);

            let result;
            try {
                result = func(...args);
            } finally {
                // Pop the context after JS returns (or throws)
                interpreter.popJsContext();
            }

            if (result instanceof TailCall) {
                const target = result.func;
                if (isSchemeClosure(target) || isSchemeContinuation(target) || typeof target === 'function') {
                    const tailArgs = result.args || [];
                    const argLiterals = tailArgs.map(a => new LiteralNode(a));
                    registers[CTL] = new TailAppNode(new LiteralNode(target), argLiterals);
                    return true;
                }
                registers[CTL] = target;
                return true;
            }

            registers[ANS] = result;
            return false;
        }

        throw new SchemeApplicationError(func);
    }

    /**
     * Invokes a captured continuation with proper dynamic-wind handling.
     * @private
     */
    invokeContinuation(func, args, registers, interpreter) {
        const currentStack = registers[FSTACK];
        const targetStack = func.fstack;

        // Handle multiple values: wrap 2+ args in Values, like `values` primitive
        let value;
        if (args.length === 0) {
            value = null;
        } else if (args.length === 1) {
            value = args[0];
        } else {
            value = new Values(args);
        }

        // Get WindFrame class for instanceof check
        const WindFrameClass = getWindFrameClass();

        // 1. Find common ancestor
        let i = 0;
        while (i < currentStack.length && i < targetStack.length && currentStack[i] === targetStack[i]) {
            i++;
        }
        const ancestorIndex = i;

        // 2. Identify WindFrames to unwind
        const toUnwind = currentStack.slice(ancestorIndex).reverse().filter(f => f instanceof WindFrameClass);

        // 3. Identify WindFrames to rewind
        const toRewind = targetStack.slice(ancestorIndex).filter(f => f instanceof WindFrameClass);

        // 4. Construct sequence of operations
        const actions = [];

        for (const frame of toUnwind) {
            actions.push(new TailAppNode(new LiteralNode(frame.after), []));
        }
        for (const frame of toRewind) {
            actions.push(new TailAppNode(new LiteralNode(frame.before), []));
        }

        // CRITICAL: Unwind JS stack (Return Value Mode)
        if (actions.length === 0) {
            const filteredStack = filterSentinelFrames(targetStack);
            registers[FSTACK] = [...filteredStack];
            registers[ANS] = value;

            if (interpreter.depth > 1) {
                throw new ContinuationUnwind(registers, true);
            }
            return false;
        }

        // Append the final restoration (with SentinelFrames filtered out)
        const filteredStack = filterSentinelFrames(targetStack);
        actions.push(new RestoreContinuation(filteredStack, value));

        // Execute via BeginFrame mechanism
        const firstAction = actions[0];
        const remainingActions = actions.slice(1);

        if (remainingActions.length > 0) {
            registers[FSTACK].push(new BeginFrame(remainingActions, this.env));
        }

        registers[CTL] = firstAction;

        // CRITICAL: Unwind JS stack (Tail Call Mode)
        if (interpreter.depth > 1) {
            throw new ContinuationUnwind(registers, false);
        }

        return true;
    }
}

// =============================================================================
// Frames - Dynamic Wind
// =============================================================================

/**
 * Frame used to set up 'dynamic-wind' after 'before' thunk runs.
 */
class DynamicWindSetupFrame extends Executable {
    /**
     * @param {Closure} before - The 'before' thunk.
     * @param {Closure} thunk - The main thunk.
     * @param {Closure} after - The 'after' thunk.
     * @param {Environment} env - The captured environment.
     */
    constructor(before, thunk, after, env) {
        super();
        this.before = before;
        this.thunk = thunk;
        this.after = after;
        this.env = env;
    }

    step(registers, interpreter) {
        // 'before' has completed. 'ans' is ignored.
        registers[FSTACK].push(new WindFrame(
            this.before,
            this.after,
            this.env
        ));

        registers[CTL] = new TailAppNode(new LiteralNode(this.thunk), []);
        registers[ENV] = this.env;
        return true;
    }
}

/**
 * Frame for 'dynamic-wind' execution.
 * Represents an active dynamic extent.
 * When we return through this frame normally, we run 'after'.
 */
class WindFrame extends Executable {
    /**
     * @param {Closure} before - The 'before' thunk.
     * @param {Closure} after - The 'after' thunk.
     * @param {Environment} env - The captured environment.
     */
    constructor(before, after, env) {
        super();
        this.before = before;
        this.after = after;
        this.env = env;
    }

    step(registers, interpreter) {
        const result = registers[ANS];

        registers[FSTACK].push(new RestoreValueFrame(result));

        registers[CTL] = new TailAppNode(new LiteralNode(this.after), []);
        return true;
    }
}

/**
 * Frame for 'dynamic-wind' to restore a value after the 'after' thunk runs.
 */
class RestoreValueFrame extends Executable {
    /**
     * @param {*} savedValue - The value to restore to 'ans'.
     */
    constructor(savedValue) {
        super();
        this.savedValue = savedValue;
    }

    step(registers, interpreter) {
        registers[ANS] = this.savedValue;
        return false;
    }
}

// =============================================================================
// Frames - Multiple Values
// =============================================================================

/**
 * Frame for call-with-values.
 * Waits for producer result, unpacks Values if present, then applies consumer.
 */
class CallWithValuesFrame extends Executable {
    /**
     * @param {Closure} consumer - The consumer procedure
     * @param {Environment} env - The captured environment
     */
    constructor(consumer, env) {
        super();
        this.consumer = consumer;
        this.env = env;
    }

    step(registers, interpreter) {
        const result = registers[ANS];

        // Unpack Values object, or treat single value as 1-element array
        let args;
        if (result instanceof Values) {
            args = result.toArray();
        } else {
            args = [result];
        }

        // Create argument Literals for TailApp
        const argLiterals = args.map(a => new LiteralNode(a));

        // Invoke consumer with the values
        registers[CTL] = new TailAppNode(new LiteralNode(this.consumer), argLiterals);
        registers[ENV] = this.env;
        return true;
    }
}

// =============================================================================
// Frames - Exceptions
// =============================================================================

/**
 * Frame representing an active exception handler.
 * Installed by with-exception-handler, searched by raise.
 * When control returns normally through this frame, it just passes through.
 */
class ExceptionHandlerFrame extends Executable {
    /**
     * @param {Closure|Function} handler - Exception handler procedure
     * @param {Environment} env - The captured environment
     */
    constructor(handler, env) {
        super();
        this.handler = handler;
        this.env = env;
    }

    step(registers, interpreter) {
        // Handler frame is popped normally - just pass through
        // The value in ANS is the result of the thunk
        return false;
    }
}

/**
 * Frame for resuming after a continuable exception.
 * If the handler returns, this frame restores the saved frames
 * and continues with the handler's return value.
 */
class RaiseContinuableResumeFrame extends Executable {
    /**
     * @param {Array} savedFrames - Frames to restore on resumption
     * @param {Environment} env - The captured environment
     */
    constructor(savedFrames, env) {
        super();
        this.savedFrames = savedFrames;
        this.env = env;
    }

    step(registers, interpreter) {
        // Handler returned with a value - resume with that value
        // The saved frames expect the handler's return value in ANS
        // Push them back onto the stack
        for (const frame of this.savedFrames) {
            registers[FSTACK].push(frame);
        }

        // ANS already contains the handler's return value
        // Pop the next frame to continue execution
        return false;
    }
}

// =============================================================================
// Frame Registration
// =============================================================================

registerFrames({
    IfFrame,
    SetFrame,
    DefineFrame,
    AppFrame,
    BeginFrame,
    DynamicWindSetupFrame,
    WindFrame,
    CallWithValuesFrame,
    ExceptionHandlerFrame,
    RaiseContinuableResumeFrame});

/**
 * Finds the nearest ExceptionHandlerFrame on the stack.
 * @param {Array} fstack - The frame stack
 * @returns {number} Index of handler or -1 if not found
 */
function findExceptionHandler(fstack) {
  for (let i = fstack.length - 1; i >= 0; i--) {
    if (fstack[i] instanceof ExceptionHandlerFrame) {
      return i;
    }
  }
  return -1;
}

/**
 * Wraps a JS Error as a SchemeError if not already one.
 * @param {Error} e - The error to wrap
 * @returns {SchemeError} A SchemeError instance
 */
function wrapJsError(e) {
  if (e instanceof SchemeError) {
    return e;
  }
  // Wrap generic JS errors
  return new SchemeError(e.message, [], e.name);
}

/**
 * Unpacks a Values object to its first value for JS interop.
 * @param {*} result - The result to unpack
 * @returns {*} First value if Values, otherwise unchanged
 */
function unpackForJs(result) {
  if (result instanceof Values) {
    return result.first();
  }
  return result;
}

/**
 * SentinelFrame - Boundary Marker for JavaScript ↔ Scheme Transitions
 * 
 * ## Purpose
 * SentinelFrame is pushed onto the frame stack when JavaScript code calls back
 * into Scheme (e.g., when JS invokes a Scheme closure that was passed as a callback).
 * It serves as a "stop marker" that tells the interpreter when to exit the nested
 * `run()` call and return control to JavaScript.
 * 
 * ## The Problem It Solves
 * Consider this scenario:
 * ```scheme
 * (js-call "array.map" my-scheme-function)
 * ```
 * Here, Scheme calls JS, which then calls back into Scheme for each element.
 * Without SentinelFrame, when `my-scheme-function` completes, the interpreter
 * would keep running frames from the *outer* Scheme computation, which is wrong.
 * 
 * ## How It Works
 * 1. When JS calls a Scheme closure via `runWithSentinel()`:
 *    - A new SentinelFrame is pushed onto the stack
 *    - The inner `run()` loop starts executing
 * 
 * 2. When the closure's body completes:
 *    - The interpreter pops frames until it reaches SentinelFrame
 *    - SentinelFrame's `step()` throws `SentinelResult` with the answer
 * 
 * 3. The outer `run()` catches `SentinelResult`:
 *    - Returns the wrapped value to JavaScript
 *    - Execution continues in JS land
 * 
 * ## Relationship with jsContextStack
 * SentinelFrame works together with `jsContextStack` for proper `dynamic-wind`
 * handling. See `pushJsContext()` and `getParentContext()`.
 * 
 * @see runWithSentinel - Creates the stack with a SentinelFrame
 * @see SentinelResult - The exception thrown to terminate the nested run
 * @see frames.js filterSentinelFrames - Removes SentinelFrames from continuation copies
 */
class SentinelFrame {
  /**
   * Executes when the interpreter reaches this frame.
   * This means the nested Scheme computation has completed.
   * We throw SentinelResult to break out of the inner run() loop.
   * 
   * @param {Array} registers - The interpreter registers [ans, ctl, env, fstack, this]
   * @param {Interpreter} interpreter - The interpreter instance
   * @throws {SentinelResult} Always throws to signal completion
   */
  step(registers, interpreter) {
    // We have reached the bottom of the inner run's stack.
    // The result is in registers[ANS].
    // We throw a special signal to break out of interpreter.run immediately.
    throw new SentinelResult(registers[ANS]);
  }
}

/**
 * SentinelResult - Control Flow Exception for Nested Run Termination
 * 
 * This is thrown by SentinelFrame to signal that a nested `run()` call
 * has completed successfully. It's caught in the trampoline loop (line ~225)
 * and causes the run to return the wrapped value to its JavaScript caller.
 * 
 * Note: This is NOT an error. It's a control flow mechanism similar to
 * how some systems use exceptions for non-local returns.
 * 
 * @see SentinelFrame - The frame that throws this
 */
class SentinelResult {
  /**
   * @param {*} value - The result value from the nested computation
   */
  constructor(value) {
    this.value = value;
  }
}

/**
 * The core Scheme interpreter.
 * Manages the top-level trampoline loop and register state.
 */
class Interpreter {
  /**
   * Creates a new interpreter instance.
   * @param {InterpreterContext} [context] - Optional context for state isolation.
   *   If not provided, uses the global shared context.
   */
  constructor(context = null) {
    /**
     * The interpreter context containing all mutable state.
     * @type {InterpreterContext}
     */
    this.context = context || globalContext;

    /**
     * The global environment for the interpreter.
     * @type {Environment | null}
     */
    this.globalEnv = null;
    this.depth = 0;

    /**
     * Stack of frame stacks representing the Scheme context at JS boundary crossings.
     * When Scheme calls a JS function, we push the current fstack here.
     * When JS calls back into Scheme (via a callable closure/continuation),
     * we use the top of this stack as the parent context.
     * @type {Array<Array>}
     */
    this.jsContextStack = [];
  }


  /**
   * Pushes the current Scheme context before calling into JS.
   * @param {Array} fstack - The current frame stack.
   */
  pushJsContext(fstack) {
    this.jsContextStack.push([...fstack]);
  }

  /**
   * Pops the Scheme context after returning from JS.
   */
  popJsContext() {
    this.jsContextStack.pop();
  }

  /**
   * Gets the current parent context (if any) for re-entering Scheme from JS.
   * @returns {Array} The parent frame stack, or empty array if none.
   */
  getParentContext() {
    if (this.jsContextStack.length > 0) {
      return this.jsContextStack[this.jsContextStack.length - 1];
    }
    return [];
  }

  /**
   * Sets the global environment. Required before running.
   * @param {Environment} env The global environment, pre-filled with primitives.
   */
  setGlobalEnv(env) {
    this.globalEnv = env;
  }

  /**
   * Runs a piece of Scheme code (as an AST).
   * @param {Executable} ast - The AST node to execute.
   * @param {Environment} [env] - The environment to run in. Defaults to globalEnv.
   * @param {Array} [initialStack] - Initial frame stack.
   * @param {*} [thisContext] - The JavaScript 'this' context.
   * @returns {*} The final result of the computation.
   */
  run(ast, env = this.globalEnv, initialStack = [], thisContext = undefined) {
    if (!this.globalEnv) {
      throw new SchemeError("Interpreter global environment is not set. Call setGlobalEnv() first.");
    }

    // The "CPU registers" - see stepables.js for constant definitions
    // ANS (0): answer - holds result of last computation
    // CTL (1): control - holds next AST node or Frame to execute
    // ENV (2): environment - holds current lexical environment
    // FSTACK (3): frame stack - holds continuation frames
    // THIS (4): this context - holds current JS 'this' context
    // We use a COPY of the initialStack to avoid mutating the parent's record of it,
    // although frames themselves are shared.
    const registers = [null, ast, env, [...initialStack], thisContext];

    // Track recursion depth
    this.depth++;

    // The Top-Level Trampoline
    try {
      while (true) {
        try {
          // The `step` method returns `true` to continue the trampoline
          // (a tail call) or `false` to halt (a value return).
          if (this.step(registers)) {
            continue;
          }

          // --- `step` returned false ---
          // This means a value is in `ans` and `ctl` is "done".
          // We must now check the frame stack.
          const fstack = registers[FSTACK];

          if (fstack.length === 0) {
            // --- Fate #1: Normal Termination ---
            // Stack is empty, computation is done.
            // Closures are now callable functions, no wrapping needed.
            return unpackForJs(registers[ANS]);
          }

          // --- Fate #2: Restore a Frame ---
          // The stack is not empty. Pop the next frame.
          const frame = fstack.pop();

          // Set the frame as the new 'ctl'
          registers[CTL] = frame;

          // The 'ans' register already contains the value this frame was waiting for.
          // The 'env' register is restored by the frame itself in its `step` method.

          // Loop again to execute the frame's `step`
          continue;

        } catch (e) {
          // Check for Continuation Unwind
          // We check the constructor name to avoid circular dependency imports if possible.
          if (e.constructor.name === 'ContinuationUnwind') {
            // If we are nested (depth > 1), strictly propagate up to the top level
            if (this.depth > 1) {
              throw e;
            }

            // Top Level (depth == 1): Adopt the hijacked state
            const newRegisters = e.registers;

            registers[ANS] = newRegisters[ANS];
            // CTL is only meaningful if !isReturn.
            registers[ENV] = newRegisters[ENV];
            registers[FSTACK] = newRegisters[FSTACK];

            if (e.isReturn) {
              // Mimic "step returned false" (Value Return)
              // We must check if stack is empty, or pop the next frame.

              const fstack = registers[FSTACK];
              if (fstack.length === 0) {
                // Done - closures are callable, no wrapping needed
                return unpackForJs(registers[ANS]);
              }

              // Pop next frame and continue
              const frame = fstack.pop();
              registers[CTL] = frame;
              continue;
            } else {
              // Mimic "step returned true" (Tail Call)
              // ctl must be valid.
              registers[CTL] = newRegisters[CTL];
              continue;
            }
          }

          // Check for SentinelResult (Control Flow for JS Interop)
          if (e instanceof SentinelResult) {
            return unpackForJs(e.value);
          }

          // Check if there's an ExceptionHandlerFrame on the stack
          // If so, route the JS error through Scheme's exception system
          const handlerIndex = findExceptionHandler(registers[FSTACK]);
          if (handlerIndex !== -1) {
            // Wrap JS error as SchemeError if needed
            const schemeError = wrapJsError(e);
            // Use RaiseNode to properly unwind and invoke handler
            // This ensures dynamic-wind 'after' thunks are called
            registers[CTL] = new RaiseNode(schemeError, false);
            continue;
          }

          // No handler found - propagate to JS caller
          console.info("Native JavaScript error caught in interpreter:", e);
          throw e;
        }
      }
    } finally {
      this.depth--;
    }
  }

  /**
   * Runs an AST with a sentinel frame on the stack.
   * Used when JavaScript code calls a Scheme closure.
   * The sentinel ensures the nested run terminates properly.
   * Uses the parent context from jsContextStack for proper dynamic-wind handling.
   * 
   * @param {Executable} ast - The AST to execute.
   * @param {*} [thisContext] - The value for the 'this' register.
   * @returns {*} The result of the computation.
   */
  runWithSentinel(ast, thisContext = undefined) {
    // Get the parent context (the Scheme stack at the point where we entered JS)
    const parentContext = this.getParentContext();
    const stackWithSentinel = [...parentContext, new SentinelFrame()];
    return this.run(ast, this.globalEnv, stackWithSentinel, thisContext);
  }

  /**
   * Invokes a captured continuation from JavaScript.
   * This is called when JS code invokes a callable continuation.
   * 
   * @param {Function} continuation - The callable continuation (with fstack attached).
   * @param {*} value - The value to pass to the continuation.
   * @param {*} [thisContext] - The value for the 'this' register.
   * @returns {*} The result of invoking the continuation.
   */
  invokeContinuation(continuation, value, thisContext = undefined) {
    // Build an AST that invokes the continuation
    const ast = new TailAppNode(
      new LiteralNode(continuation),
      [new LiteralNode(value)]
    );

    // Run with sentinel and parent context
    return this.runWithSentinel(ast, thisContext);
  }

  /**
   * Creates a JS-callable wrapper for a Scheme closure.
   * 
   * @deprecated Closures are now created as callable functions directly.
   *             This method is kept for backward compatibility.
   * @param {Function} closure - A Scheme closure (callable function with marker).
   * @param {Array} parentStack - The parent frame stack for context.
   * @returns {Function} A callable wrapper (or the closure itself if already callable).
   */
  createJsBridge(closure, parentStack = []) {
    // If it's already a callable Scheme closure, it can be called directly.
    // This method is now essentially a passthrough for new-style closures.
    if (isSchemeClosure(closure)) {
      return closure;
    }

    // Legacy path for old-style Closure instances (during migration)
    return (...jsArgs) => {
      const argLiterals = jsArgs.map(val => new LiteralNode(val));
      const ast = new TailAppNode(new LiteralNode(closure), argLiterals);
      const stackWithSentinel = [...parentStack, new SentinelFrame()];
      return this.run(ast, this.globalEnv, stackWithSentinel);
    };
  }

  /**
   * Executes a single step of the computation.
   * This polymorphically calls the `step` method on the `ctl` object.
   * @param {Array} registers - The [ans, ctl, env, fstack] registers array.
   * @returns {boolean} `true` to continue the trampoline, `false` to halt.
   */
  step(registers) {
    const ctl = registers[CTL];
    return ctl.step(registers, this);
  }
}

/**
 * Manages lexical scope via a chain of maps.
 */
class Environment {
    /**
     * @param {Environment | null} parent - The parent environment.
     * @param {Map<string, *>} [bindings] - Local bindings for this frame.
     */
    constructor(parent = null, bindings = new Map()) {
        this.parent = parent;
        this.bindings = bindings;
    }

    /**
     * Creates a new child environment.
     * @param {string} name - The variable name to bind.
     * @param {*} value - The value to bind.
     * @returns {Environment} A new child environment.
     */
    extend(name, value) {
        return new Environment(this, new Map([[name, value]]));
    }

    /**
     * Creates a new child environment with multiple bindings.
     * @param {Array<string>} names - The variable names.
     * @param {Array<*>} values - The corresponding values.
     * @returns {Environment} A new child environment.
     */
    extendMany(names, values) {
        const newBindings = new Map();
        for (let i = 0; i < names.length; i++) {
            newBindings.set(names[i], values[i]);
        }
        return new Environment(this, newBindings);
    }

    /**
     * Finds a variable's value by searching up the scope chain.
     * @param {string} name - The variable name to look up.
     * @returns {*} The bound value.
     * @throws {SchemeUnboundError} If the variable is not bound.
     */
    lookup(name) {
        if (this.bindings.has(name)) {
            return this.bindings.get(name);
        }
        if (this.parent) {
            return this.parent.lookup(name);
        }
        // Fallback to JS global environment
        if (Reflect.has(globalThis, name)) {
            return globalThis[name];
        }
        throw new SchemeUnboundError(name);
    }

    /**
     * Finds the environment where a variable is defined.
     * @param {string} name - The variable name.
     * @returns {Environment | null} The environment, or null if not found.
     */
    findEnv(name) {
        if (this.bindings.has(name)) {
            return this;
        }
        if (this.parent) {
            return this.parent.findEnv(name);
        }
        return null;
    }

    /**
   * Updates an existing variable in the scope chain.
   * Throws an error if the variable is not bound.
   * @param {string} name - The variable name.
   * @param {*} value - The new value.
   * @returns {*} The new value.
   * @throws {SchemeUnboundError} If the variable is not bound.
   */
    set(name, value) {
        const env = this.findEnv(name);
        if (!env) {
            // Check JS global environment
            if (Reflect.has(globalThis, name)) {
                globalThis[name] = value;
                return value;
            }
            throw new SchemeUnboundError(name, true);
        }
        env.bindings.set(name, value);
        return value;
    }

    /**
     * Defines a variable in the *current* environment frame.
     * Shadows any outer bindings of the same name.
     * @param {string} name - The variable name.
     * @param {*} value - The value to bind.
     * @returns {*} The value.
     */
    define(name, value) {
        this.bindings.set(name, value);
        return value;
    }
}

/**
 * Type Checking Utilities for Scheme Primitives
 * 
 * Provides reusable type predicates and assertion functions
 * that throw structured SchemeError instances.
 */


// =============================================================================
// Type Predicates
// =============================================================================

/**
 * Checks if value is a pair (Cons cell).
 * @param {*} x - Value to check
 * @returns {boolean}
 */
function isPair(x) {
    return x instanceof Cons;
}

/**
 * Checks if value is a proper list (null-terminated chain of pairs).
 * @param {*} x - Value to check
 * @returns {boolean}
 */
function isList(x) {
    if (x === null) return true;
    if (!(x instanceof Cons)) return false;
    // Use tortoise-hare algorithm to detect cycles
    let slow = x;
    let fast = x;
    while (fast !== null && fast instanceof Cons) {
        slow = slow.cdr;
        fast = fast.cdr;
        if (fast instanceof Cons) {
            fast = fast.cdr;
        }
        if (slow === fast && fast !== null) {
            return false; // Cycle detected
        }
    }
    return fast === null;
}

/**
 * Checks if value looks like a Rational (duck typing to avoid circular deps).
 * @param {*} x 
 * @returns {boolean}
 */
function isRationalLike(x) {
    return x && typeof x === 'object' && typeof x.numerator === 'number' && typeof x.denominator === 'number';
}

/**
 * Checks if value looks like a Complex (duck typing to avoid circular deps).
 * @param {*} x 
 * @returns {boolean}
 */
function isComplexLike(x) {
    // Note: Rational also matches object with properties, but Complex has real/imag
    return x && typeof x === 'object' && typeof x.real === 'number' && typeof x.imag === 'number';
}

/**
 * Checks if value is a number (primitive or Scheme numeric object).
 * @param {*} x - Value to check
 * @returns {boolean}
 */
function isNumber(x) {
    return typeof x === 'number' || isRationalLike(x) || isComplexLike(x);
}

/**
 * Checks if value is an integer.
 * @param {*} x - Value to check
 * @returns {boolean}
 */
function isInteger(x) {
    if (typeof x === 'number') return Number.isInteger(x);
    if (isRationalLike(x)) return x.denominator === 1;
    if (isComplexLike(x)) return x.imag === 0 && Number.isInteger(x.real);
    return false;
}

/**
 * Checks if value is a string.
 * @param {*} x - Value to check
 * @returns {boolean}
 */
function isString(x) {
    return typeof x === 'string';
}

/**
 * Checks if value is a symbol.
 * @param {*} x - Value to check
 * @returns {boolean}
 */
function isSymbol(x) {
    return x instanceof Symbol$1;
}

/**
 * Checks if value is a boolean.
 * @param {*} x - Value to check
 * @returns {boolean}
 */
function isBoolean(x) {
    return typeof x === 'boolean';
}

/**
 * Checks if value is a vector.
 * @param {*} x - Value to check
 * @returns {boolean}
 */
function isVector(x) {
    return Array.isArray(x);
}

/**
 * Checks if value is a procedure (closure, continuation, or JS function).
 * @param {*} x - Value to check
 * @returns {boolean}
 */
function isProcedure(x) {
    // All callable functions are procedures
    // This includes Scheme closures/continuations (which are now callable functions)
    // and regular JS functions
    return typeof x === 'function' || x instanceof Closure || x instanceof Continuation;
}

/**
 * Checks if value is a character (single-character string for now).
 * @param {*} x - Value to check
 * @returns {boolean}
 */
function isChar(x) {
    // For now, characters are single-char strings
    // This may change if we add a dedicated Char type
    return typeof x === 'string' && x.length === 1;
}

// =============================================================================
// Assertion Helpers
// =============================================================================

/**
 * Asserts that a value satisfies a predicate, throwing SchemeTypeError if not.
 * @param {string} procName - Procedure name for error messages
 * @param {number} argPos - Argument position (1-indexed)
 * @param {*} value - Value to check
 * @param {Function} predicate - Predicate function
 * @param {string} typeName - Expected type name for error message
 * @returns {*} The value if valid
 * @throws {SchemeTypeError} If predicate fails
 */
function assertType(procName, argPos, value, predicate, typeName) {
    if (!predicate(value)) {
        throw new SchemeTypeError(procName, argPos, typeName, value);
    }
    return value;
}

/**
 * Asserts value is a pair.
 * @param {string} procName - Procedure name
 * @param {number} argPos - Argument position (1-indexed)
 * @param {*} value - Value to check
 * @returns {Cons} The pair
 * @throws {SchemeTypeError}
 */
function assertPair(procName, argPos, value) {
    return assertType(procName, argPos, value, isPair, 'pair');
}

/**
 * Asserts value is a number.
 * @param {string} procName - Procedure name
 * @param {number} argPos - Argument position (1-indexed)
 * @param {*} value - Value to check
 * @returns {number} The number
 * @throws {SchemeTypeError}
 */
function assertNumber(procName, argPos, value) {
    return assertType(procName, argPos, value, isNumber, 'number');
}

/**
 * Asserts value is an integer.
 * @param {string} procName - Procedure name
 * @param {number} argPos - Argument position (1-indexed)
 * @param {*} value - Value to check
 * @returns {number} The integer
 * @throws {SchemeTypeError}
 */
function assertInteger(procName, argPos, value) {
    return assertType(procName, argPos, value, isInteger, 'integer');
}

/**
 * Asserts value is a string.
 * @param {string} procName - Procedure name
 * @param {number} argPos - Argument position (1-indexed)
 * @param {*} value - Value to check
 * @returns {string} The string
 * @throws {SchemeTypeError}
 */
function assertString(procName, argPos, value) {
    return assertType(procName, argPos, value, isString, 'string');
}

/**
 * Asserts value is a symbol.
 * @param {string} procName - Procedure name
 * @param {number} argPos - Argument position (1-indexed)
 * @param {*} value - Value to check
 * @returns {Symbol} The symbol
 * @throws {SchemeTypeError}
 */
function assertSymbol(procName, argPos, value) {
    return assertType(procName, argPos, value, isSymbol, 'symbol');
}

/**
 * Asserts value is a vector.
 * @param {string} procName - Procedure name
 * @param {number} argPos - Argument position (1-indexed)
 * @param {*} value - Value to check
 * @returns {Vector} The vector
 * @throws {SchemeTypeError}
 */
function assertVector(procName, argPos, value) {
    return assertType(procName, argPos, value, isVector, 'vector');
}

/**
 * Asserts value is a procedure.
 * @param {string} procName - Procedure name
 * @param {number} argPos - Argument position (1-indexed)
 * @param {*} value - Value to check
 * @returns {Function|Closure|Continuation} The procedure
 * @throws {SchemeTypeError}
 */
function assertProcedure(procName, argPos, value) {
    return assertType(procName, argPos, value, isProcedure, 'procedure');
}

/**
 * Asserts value is a boolean.
 * @param {string} procName - Procedure name
 * @param {number} argPos - Argument position (1-indexed)
 * @param {*} value - Value to check
 * @returns {boolean} The boolean
 * @throws {SchemeTypeError}
 */
function assertBoolean(procName, argPos, value) {
    return assertType(procName, argPos, value, isBoolean, 'boolean');
}

/**
 * Asserts value is a character (single-character string).
 * @param {string} procName - Procedure name
 * @param {number} argPos - Argument position (1-indexed)
 * @param {*} value - Value to check
 * @returns {string} The character
 * @throws {SchemeTypeError}
 */
function assertChar(procName, argPos, value) {
    return assertType(procName, argPos, value, isChar, 'character');
}

/**
 * Asserts correct number of arguments.
 * @param {string} procName - Procedure name
 * @param {Array} args - Arguments array
 * @param {number} min - Minimum required arguments
 * @param {number} [max=min] - Maximum allowed arguments (Infinity for variadic)
 * @throws {SchemeArityError}
 */
function assertArity(procName, args, min, max = min) {
    const count = args.length;
    if (count < min || count > max) {
        throw new SchemeArityError(procName, min, max, count);
    }
}

/**
 * Asserts a valid index for a sized collection.
 * @param {string} procName - Procedure name
 * @param {number} index - Index to check
 * @param {number} size - Size of collection
 * @throws {SchemeRangeError}
 */
function assertIndex(procName, index, size) {
    if (!Number.isInteger(index)) {
        throw new SchemeTypeError(procName, 2, 'exact integer', index);
    }
    if (index < 0 || index >= size) {
        throw new SchemeRangeError(procName, 'index', 0, size - 1, index);
    }
    return index;
}

/**
 * Rational Number Support for Scheme.
 * 
 * Implements exact rational numbers (fractions) per R7RS §6.2.
 * Rationals are represented as numerator/denominator pairs, always reduced.
 */


// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Computes the greatest common divisor using Euclidean algorithm.
 * @param {bigint|number} a 
 * @param {bigint|number} b 
 * @returns {bigint|number}
 */
function gcdNum(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
        const t = b;
        b = a % b;
        a = t;
    }
    return a;
}

// =============================================================================
// Rational Class
// =============================================================================

/**
 * Represents an exact rational number (fraction).
 * 
 * Invariants:
 * - denominator is always positive
 * - numerator and denominator are always coprime (reduced form)
 * - denominator is never zero
 */
class Rational {
    /**
     * Creates a new Rational number.
     * @param {number} numerator - The numerator (integer)
     * @param {number} denominator - The denominator (positive integer)
     */
    constructor(numerator, denominator = 1) {
        if (!Number.isInteger(numerator)) {
            throw new SchemeTypeError('Rational', 1, 'integer', numerator);
        }
        if (!Number.isInteger(denominator)) {
            throw new SchemeTypeError('Rational', 2, 'integer', denominator);
        }
        if (denominator === 0) {
            throw new SchemeRangeError('Rational', 'denominator', 1, Infinity, denominator);
        }

        // Ensure denominator is positive
        if (denominator < 0) {
            numerator = -numerator;
            denominator = -denominator;
        }

        // Reduce to lowest terms
        const g = gcdNum(numerator, denominator);
        this.numerator = numerator / g;
        this.denominator = denominator / g;
    }

    /**
     * Creates a Rational from a number (if exact integer).
     * @param {number} n 
     * @returns {Rational}
     */
    static fromNumber(n) {
        if (Number.isInteger(n)) {
            return new Rational(n, 1);
        }
        throw new SchemeTypeError('Rational.fromNumber', 1, 'exact integer', n);
    }

    /**
     * Returns true if this rational represents an integer.
     * @returns {boolean}
     */
    isInteger() {
        return this.denominator === 1;
    }

    /**
     * Converts to JavaScript number (may lose precision).
     * @returns {number}
     */
    toNumber() {
        return this.numerator / this.denominator;
    }

    /**
     * Returns the rational's string representation.
     * @returns {string}
     */
    toString() {
        if (this.denominator === 1) {
            return String(this.numerator);
        }
        return `${this.numerator}/${this.denominator}`;
    }

    /**
     * Adds two rationals.
     * @param {Rational} other 
     * @returns {Rational}
     */
    add(other) {
        const num = this.numerator * other.denominator + other.numerator * this.denominator;
        const den = this.denominator * other.denominator;
        return new Rational(num, den);
    }

    /**
     * Subtracts another rational from this one.
     * @param {Rational} other 
     * @returns {Rational}
     */
    subtract(other) {
        const num = this.numerator * other.denominator - other.numerator * this.denominator;
        const den = this.denominator * other.denominator;
        return new Rational(num, den);
    }

    /**
     * Multiplies two rationals.
     * @param {Rational} other 
     * @returns {Rational}
     */
    multiply(other) {
        return new Rational(
            this.numerator * other.numerator,
            this.denominator * other.denominator
        );
    }

    /**
     * Divides this rational by another.
     * @param {Rational} other 
     * @returns {Rational}
     */
    divide(other) {
        if (other.numerator === 0) {
            throw new SchemeRangeError('Rational.divide', 'divisor', -Infinity, -1, 0);
        }
        return new Rational(
            this.numerator * other.denominator,
            this.denominator * other.numerator
        );
    }

    /**
     * Returns the negation of this rational.
     * @returns {Rational}
     */
    negate() {
        return new Rational(-this.numerator, this.denominator);
    }

    /**
     * Returns the absolute value.
     * @returns {Rational}
     */
    abs() {
        return new Rational(Math.abs(this.numerator), this.denominator);
    }

    /**
     * Compares this rational to another.
     * @param {Rational} other 
     * @returns {number} -1, 0, or 1
     */
    compareTo(other) {
        const diff = this.numerator * other.denominator - other.numerator * this.denominator;
        if (diff < 0) return -1;
        if (diff > 0) return 1;
        return 0;
    }

    /**
     * Checks equality with another rational.
     * @param {Rational} other 
     * @returns {boolean}
     */
    equals(other) {
        return this.numerator === other.numerator &&
            this.denominator === other.denominator;
    }
}

/**
 * Checks if a value is a Rational.
 * @param {*} val 
 * @returns {boolean}
 */
function isRational(val) {
    return val instanceof Rational;
}

/**
 * Complex Number Support for Scheme.
 * 
 * Implements complex numbers per R7RS §6.2 and (scheme complex) library.
 * Complex numbers have real and imaginary parts.
 */


// Helper for component arithmetic (Number/Rational)
function add(a, b) {
    if (a instanceof Rational) return a.add(b);
    if (b instanceof Rational) return b.add(a);
    return a + b;
}

function sub(a, b) {
    if (a instanceof Rational) return a.subtract(b);
    if (b instanceof Rational) return b.negate().add(a);
    return a - b;
}

function mul(a, b) {
    if (a instanceof Rational) return a.multiply(b);
    if (b instanceof Rational) return b.multiply(a);
    return a * b;
}

function div(a, b) {
    if (a instanceof Rational) return a.divide(b);
    if (b instanceof Rational) return Rational.fromNumber(a).divide(b); // a is number
    return a / b;
}

function toNum(n) {
    if (n instanceof Rational) return n.toNumber();
    return n;
}

// =============================================================================
// Complex Class
// =============================================================================

/**
 * Represents a complex number with real and imaginary parts.
 */
class Complex {
    /**
     * Creates a new Complex number.
     * @param {number} real - The real part
     * @param {number} imag - The imaginary part
     */
    constructor(real, imag) {
        if ((typeof real !== 'number' && !(real instanceof Rational)) ||
            (typeof imag !== 'number' && !(imag instanceof Rational))) {
            throw new SchemeTypeError('Complex', 1, 'number or Rational', typeof real !== 'number' && !(real instanceof Rational) ? real : imag);
        }
        this.real = real;
        this.imag = imag;
    }

    /**
     * Creates a Complex from rectangular coordinates.
     * @param {number} x - Real part
     * @param {number} y - Imaginary part
     * @returns {Complex}
     */
    static fromRectangular(x, y) {
        return new Complex(x, y);
    }

    /**
     * Creates a Complex from polar coordinates.
     * @param {number} magnitude - Magnitude (r)
     * @param {number} angle - Angle in radians (θ)
     * @returns {Complex}
     */
    static fromPolar(magnitude, angle) {
        return new Complex(
            magnitude * Math.cos(angle),
            magnitude * Math.sin(angle)
        );
    }

    /**
     * Returns true if this is a real number (imaginary part is 0).
     * @returns {boolean}
     */
    isReal() {
        return this.imag === 0 || (this.imag instanceof Rational && this.imag.numerator === 0);
    }

    isImaginary() {
        const rZero = this.real === 0 || (this.real instanceof Rational && this.real.numerator === 0);
        const iZero = this.imag === 0 || (this.imag instanceof Rational && this.imag.numerator === 0);
        return rZero && !iZero;
    }

    /**
     * Returns the real part.
     * @returns {number}
     */
    realPart() {
        return this.real;
    }

    /**
     * Returns the imaginary part.
     * @returns {number}
     */
    imagPart() {
        return this.imag;
    }

    /**
     * Returns the magnitude (absolute value).
     * @returns {number}
     */
    magnitude() {
        const r = toNum(this.real); // Convert exact components to float if needed
        const i = toNum(this.imag);
        return Math.sqrt(r * r + i * i);
    }

    angle() {
        return Math.atan2(toNum(this.imag), toNum(this.real));
    }

    toNumber() {
        const iZero = this.imag === 0 || (this.imag instanceof Rational && this.imag.numerator === 0);
        if (iZero) {
            return toNum(this.real);
        }
        throw new SchemeError('Complex.toNumber: cannot convert complex with non-zero imaginary part to real', [this], 'Complex.toNumber');
    }

    /**
     * Returns the string representation with R7RS formatting for special values.
     * @param {number} [radix=10]
     * @returns {string}
     */
    toString(radix = 10) {
        // Format a component with R7RS special value formatting
        const formatComp = (n, includeSign = true) => {
            if (typeof n === 'number') {
                if (n === Infinity) return includeSign ? '+inf.0' : 'inf.0';
                if (n === -Infinity) return '-inf.0';
                if (Number.isNaN(n)) return includeSign ? '+nan.0' : 'nan.0';
                if (n >= 0 && includeSign) return '+' + n.toString(radix);
                return n.toString(radix);
            }
            if (n instanceof Rational) {
                const str = n.toString(radix);
                // Rational toString is "n/d" or "-n/d"
                if (!str.startsWith('-') && includeSign) return '+' + str;
                return str;
            }
            return String(n);
        };

        // For the real part, we force the sign if it's a special value (inf/nan),
        // because R7RS requires +inf.0 / +nan.0, but formatComp(..., false) gives inf.0
        const realIsSpecial = typeof this.real === 'number' && !Number.isFinite(this.real);
        const realStr = formatComp(this.real, realIsSpecial);

        // For imaginary part, we calculate the sign separate from the magnitude
        // so we don't want formatComp to include the sign for the magnitude.

        let imagVal = this.imag;
        let signStr = '+';

        // Normalize sign for imaginary part
        if (typeof imagVal === 'number') {
            if (imagVal < 0) {
                imagVal = -imagVal;
                signStr = '-';
            }
        } else if (imagVal instanceof Rational) {
            if (imagVal.numerator < 0) {
                imagVal = imagVal.negate();
                signStr = '-';
            }
        }

        // Handle pure imaginary unit 'i'
        let imagStr = formatComp(imagVal, false);

        // If the magnitude is 1, suppress the '1' before 'i'
        // But be careful: '1' vs '1.0' vs '1/1'
        // R7RS: 1i -> +i. 1.0i -> +1.0i (retains exactness/precision marking if we had it)
        // With Rational(1,1), toString says "1".
        // With Number 1, toString says "1".
        // With Number 1.0, toString says "1" (JS limitation).

        if (imagStr === '1') {
            imagStr = '';
        }

        return `${realStr}${signStr}${imagStr}i`;
    }


    /**
     * Returns the complex conjugate.
     * @returns {Complex}
     */
    conjugate() {
        // -imag
        let negImag;
        if (this.imag instanceof Rational) negImag = this.imag.negate();
        else negImag = -this.imag;

        return new Complex(this.real, negImag);
    }

    add(other) {
        if (other instanceof Complex) {
            return new Complex(add(this.real, other.real), add(this.imag, other.imag));
        }
        return new Complex(add(this.real, other), this.imag);
    }

    subtract(other) {
        if (other instanceof Complex) {
            return new Complex(sub(this.real, other.real), sub(this.imag, other.imag));
        }
        return new Complex(sub(this.real, other), this.imag);
    }

    multiply(other) {
        if (other instanceof Complex) {
            // (a+bi)(c+di) = (ac-bd) + (ad+bc)i
            const ac = mul(this.real, other.real);
            const bd = mul(this.imag, other.imag);
            const ad = mul(this.real, other.imag);
            const bc = mul(this.imag, other.real);
            return new Complex(sub(ac, bd), add(ad, bc));
        }
        return new Complex(mul(this.real, other), mul(this.imag, other));
    }

    divide(other) {
        if (other instanceof Complex) {
            // (a+bi)/(c+di) = [(ac+bd) + (bc-ad)i] / (c^2+d^2)
            const ac = mul(this.real, other.real);
            const bd = mul(this.imag, other.imag);
            const bc = mul(this.imag, other.real);
            const ad = mul(this.real, other.imag);
            const den = add(mul(other.real, other.real), mul(other.imag, other.imag));
            return new Complex(
                div(add(ac, bd), den),
                div(sub(bc, ad), den)
            );
        }
        return new Complex(div(this.real, other), div(this.imag, other));
    }

    negate() {
        let nr, ni;
        if (this.real instanceof Rational) nr = this.real.negate(); else nr = -this.real;
        if (this.imag instanceof Rational) ni = this.imag.negate(); else ni = -this.imag;
        return new Complex(nr, ni);
    }

    equals(other) {
        if (!(other instanceof Complex)) return false;
        const eq = (a, b) => {
            if (a instanceof Rational && b instanceof Rational) return a.equals(b);
            if (a instanceof Rational) return a.equals(Rational.fromNumber(b));
            if (b instanceof Rational) return Rational.fromNumber(a).equals(b);
            return a === b;
        };
        return eq(this.real, other.real) && eq(this.imag, other.imag);
    }
}

/**
 * Checks if a value is a Complex number.
 * @param {*} val 
 * @returns {boolean}
 */
function isComplex(val) {
    return val instanceof Complex;
}

/**
 * Creates a Complex from rectangular coordinates (make-rectangular).
 * @param {number} x - Real part
 * @param {number} y - Imaginary part
 * @returns {Complex}
 */
function makeRectangular(x, y) {
    // If imaginary part is 0, could return just the real number
    // but R7RS says make-rectangular always returns a complex
    return new Complex(x, y);
}

/**
 * Creates a Complex from polar coordinates (make-polar).
 * @param {number} magnitude 
 * @param {number} angle - In radians
 * @returns {Complex}
 */
function makePolar(magnitude, angle) {
    return Complex.fromPolar(magnitude, angle);
}

/**
 * Math Primitives for Scheme.
 * 
 * Provides arithmetic and comparison operations for the Scheme runtime.
 * Implements R7RS §6.2 numeric operations.
 * 
 * NOTE: Only primitives that REQUIRE JavaScript are implemented here.
 * Higher-level numeric procedures are in core.scm.
 */


// =============================================================================
// Generic Arithmetic Helpers
// =============================================================================

function toComplex(n) {
    if (isComplex(n)) return n;
    if (isRational(n)) return makeRectangular(n.toNumber(), 0);
    return makeRectangular(n, 0);
}

function toRational(n) {
    if (isRational(n)) return n;
    if (Number.isInteger(n)) return Rational.fromNumber(n);
    throw new SchemeTypeError('toRational', 1, 'exact integer', n);
}

function genericAdd(a, b) {
    // If either is complex, result is complex (inexact in our implementation)
    if (isComplex(a) || isComplex(b)) {
        return toComplex(a).add(toComplex(b));
    }
    // If either is rational or both are integers
    if (isRational(a) || isRational(b)) {
        // If any is inexact float, result is float
        if ((typeof a === 'number' && !Number.isInteger(a)) ||
            (typeof b === 'number' && !Number.isInteger(b))) {
            return (isRational(a) ? a.toNumber() : a) + (isRational(b) ? b.toNumber() : b);
        }
        // Exact arithmetic
        const res = toRational(a).add(toRational(b));
        return res.denominator === 1 ? res.numerator : res;
    }
    // Primitive numbers
    return a + b;
}

function genericSub(a, b) {
    if (isComplex(a) || isComplex(b)) {
        return toComplex(a).subtract(toComplex(b));
    }
    if (isRational(a) || isRational(b)) {
        if ((typeof a === 'number' && !Number.isInteger(a)) ||
            (typeof b === 'number' && !Number.isInteger(b))) {
            return (isRational(a) ? a.toNumber() : a) - (isRational(b) ? b.toNumber() : b);
        }
        const res = toRational(a).subtract(toRational(b));
        return res.denominator === 1 ? res.numerator : res;
    }
    return a - b;
}

function genericMul(a, b) {
    if (isComplex(a) || isComplex(b)) {
        return toComplex(a).multiply(toComplex(b));
    }
    if (isRational(a) || isRational(b)) {
        if ((typeof a === 'number' && !Number.isInteger(a)) ||
            (typeof b === 'number' && !Number.isInteger(b))) {
            return (isRational(a) ? a.toNumber() : a) * (isRational(b) ? b.toNumber() : b);
        }
        const res = toRational(a).multiply(toRational(b));
        return res.denominator === 1 ? res.numerator : res;
    }
    return a * b;
}

function genericDiv(a, b) {
    if (isComplex(a) || isComplex(b)) {
        return toComplex(a).divide(toComplex(b));
    }
    // Division involves rationals if explicit or if both are integers (and result not integer)
    // Actually standard division of integers implies Rational result in Scheme unless Inexact
    if ((typeof a === 'number' && !Number.isInteger(a)) ||
        (typeof b === 'number' && !Number.isInteger(b))) {
        // Floating point division
        const va = isRational(a) ? a.toNumber() : a;
        const vb = isRational(b) ? b.toNumber() : b;
        return va / vb;
    }
    // Exact division (Integers or Rationals)
    const res = toRational(a).divide(toRational(b));
    return res.denominator === 1 ? res.numerator : res;
}

/**
 * Math primitives exported to Scheme.
 */
const mathPrimitives = {
    // =========================================================================
    // Arithmetic Operations
    // =========================================================================

    /**
     * Addition. Returns the sum of all arguments.
     * @param {...number} args - Numbers to add.
     * @returns {number} Sum of all arguments.
     */
    '+': (...args) => {
        args.forEach((arg, i) => assertNumber('+', i + 1, arg));
        return args.reduce((a, b) => genericAdd(a, b), 0);
    },

    /**
     * Subtraction. With one argument, returns negation.
     * With multiple, subtracts rest from first.
     * @param {number} first - First number.
     * @param {...number} rest - Numbers to subtract.
     * @returns {number} Difference.
     */
    '-': (first, ...rest) => {
        assertArity('-', [first, ...rest], 1, Infinity);
        assertNumber('-', 1, first);
        rest.forEach((arg, i) => assertNumber('-', i + 2, arg));
        if (rest.length === 0) {
            // Negation
            return genericSub(0, first);
        }
        return rest.reduce((a, b) => genericSub(a, b), first);
    },

    /**
     * Multiplication. Returns the product of all arguments.
     * @param {...number} args - Numbers to multiply.
     * @returns {number} Product of all arguments.
     */
    '*': (...args) => {
        args.forEach((arg, i) => assertNumber('*', i + 1, arg));
        return args.reduce((a, b) => genericMul(a, b), 1);
    },

    /**
     * Division. With one argument, returns reciprocal.
     * With multiple, divides first by rest.
     * @param {number} first - First number.
     * @param {...number} rest - Divisors.
     * @returns {number} Quotient.
     */
    '/': (first, ...rest) => {
        assertArity('/', [first, ...rest], 1, Infinity);
        assertNumber('/', 1, first);
        rest.forEach((arg, i) => assertNumber('/', i + 2, arg));
        let res;
        if (rest.length === 0) {
            // Reciprocal
            res = genericDiv(1, first);
        } else {
            res = rest.reduce((a, b) => genericDiv(a, b), first);
        }
        if (res instanceof Rational) return res;
        return res;
    },

    // =========================================================================
    // Binary Comparison Operations (variadic versions in Scheme)
    // =========================================================================

    /**
     * Binary numeric equality.
     * @param {number} a - First number.
     * @param {number} b - Second number.
     * @returns {boolean} True if equal.
     */
    '%num=': (a, b) => {
        assertNumber('%num=', 1, a);
        assertNumber('%num=', 2, b);
        return a === b;
    },

    /**
     * Binary less than.
     * @param {number} a - First number.
     * @param {number} b - Second number.
     * @returns {boolean} True if a < b.
     */
    '%num<': (a, b) => {
        assertNumber('%num<', 1, a);
        assertNumber('%num<', 2, b);
        return a < b;
    },

    /**
     * Binary greater than.
     * @param {number} a - First number.
     * @param {number} b - Second number.
     * @returns {boolean} True if a > b.
     */
    '%num>': (a, b) => {
        assertNumber('%num>', 1, a);
        assertNumber('%num>', 2, b);
        return a > b;
    },

    /**
     * Binary less than or equal.
     * @param {number} a - First number.
     * @param {number} b - Second number.
     * @returns {boolean} True if a <= b.
     */
    '%num<=': (a, b) => {
        assertNumber('%num<=', 1, a);
        assertNumber('%num<=', 2, b);
        return a <= b;
    },

    /**
     * Binary greater than or equal.
     * @param {number} a - First number.
     * @param {number} b - Second number.
     * @returns {boolean} True if a >= b.
     */
    '%num>=': (a, b) => {
        assertNumber('%num>=', 1, a);
        assertNumber('%num>=', 2, b);
        return a >= b;
    },

    // =========================================================================
    // Integer Division
    // =========================================================================

    /**
     * Modulo operation (result has same sign as divisor).
     * @param {number} a - Dividend.
     * @param {number} b - Divisor.
     * @returns {number} Modulo.
     */
    'modulo': (a, b) => {
        assertArity('modulo', [a, b], 2, 2);
        assertInteger('modulo', 1, a);
        assertInteger('modulo', 2, b);
        // JavaScript % gives remainder with sign of dividend
        // modulo should have sign of divisor
        const rem = a % b;
        if (rem === 0) return 0;
        return (rem > 0) === (b > 0) ? rem : rem + b;
    },

    /**
     * Quotient (integer division, truncates toward zero).
     * @param {number} a - Dividend.
     * @param {number} b - Divisor.
     * @returns {number} Integer quotient.
     */
    'quotient': (a, b) => {
        assertArity('quotient', [a, b], 2, 2);
        assertInteger('quotient', 1, a);
        assertInteger('quotient', 2, b);
        return Math.trunc(a / b);
    },

    /**
     * Remainder (result has same sign as dividend).
     * @param {number} a - Dividend.
     * @param {number} b - Divisor.
     * @returns {number} Remainder.
     */
    'remainder': (a, b) => {
        assertArity('remainder', [a, b], 2, 2);
        assertInteger('remainder', 1, a);
        assertInteger('remainder', 2, b);
        return a % b;
    },

    // =========================================================================
    // Type Predicates (require JavaScript typeof)
    // =========================================================================

    /**
     * Number type predicate.
     * @param {*} obj - Value to check.
     * @returns {boolean} True if obj is a number.
     */
    'number?': (obj) => typeof obj === 'number' || isRational(obj) || isComplex(obj),

    /**
     * Complex number type predicate.
     * In R7RS, all numbers are complex.
     * @param {*} obj - Value to check.
     * @returns {boolean} True if obj is a complex number.
     */
    'complex?': (obj) => typeof obj === 'number' || isRational(obj) || isComplex(obj),

    /**
     * Real number type predicate.
     * @param {*} obj - Value to check.
     * @returns {boolean} True if obj is a real number.
     */
    'real?': (obj) => {
        if (typeof obj === 'number') return true;
        if (isRational(obj)) return true;
        if (isComplex(obj)) return obj.imag === 0;
        return false;
    },

    /**
     * Rational number type predicate.
     * @param {*} obj - Value to check.
     * @returns {boolean} True if obj is a rational number.
     */
    'rational?': (obj) => {
        if (isRational(obj)) return true;
        if (typeof obj === 'number') return Number.isFinite(obj);
        if (isComplex(obj)) return obj.imag === 0 && Number.isFinite(obj.real);
        return false;
    },

    /**
     * Integer type predicate.
     * @param {*} obj - Value to check.
     * @returns {boolean} True if obj is an integer.
     */
    'integer?': (obj) => {
        if (typeof obj === 'number') return Number.isInteger(obj);
        if (isRational(obj)) return obj.denominator === 1;
        if (isComplex(obj)) return obj.imag === 0 && Number.isInteger(obj.real);
        return false;
    },

    /**
     * Exact integer type predicate.
     * In our implementation, all integers are "exact".
     * @param {*} obj - Value to check.
     * @returns {boolean} True if obj is an exact integer.
     */
    'exact-integer?': (obj) => {
        if (typeof obj === 'number') return Number.isInteger(obj);
        if (isRational(obj)) return obj.denominator === 1;
        return false;
    },

    /**
     * Exact number type predicate.
     * Rationals are exact, JS numbers are inexact.
     * @param {*} obj - Value to check.
     * @returns {boolean} True if obj is exact.
     */
    'exact?': (obj) => {
        if (isRational(obj)) return true;
        if (typeof obj === 'number') return Number.isInteger(obj);
        return false;
    },

    /**
     * Inexact number type predicate.
     * JS floats are inexact.
     * @param {*} obj - Value to check.
     * @returns {boolean} True if obj is inexact.
     */
    'inexact?': (obj) => {
        if (typeof obj === 'number') return !Number.isInteger(obj);
        if (isComplex(obj)) return true; // Complex uses floats
        return false;
    },

    /**
     * Finite predicate.
     * @param {number} x - Number to check.
     * @returns {boolean} True if x is finite.
     */
    'finite?': (x) => {
        if (typeof x === 'number') return Number.isFinite(x);
        if (isRational(x)) return true;
        if (isComplex(x)) return Number.isFinite(x.real) && Number.isFinite(x.imag);
        throw new SchemeTypeError('finite?', 1, 'number', x);
    },

    /**
     * Infinite predicate.
     * @param {number} x - Number to check.
     * @returns {boolean} True if x is infinite.
     */
    'infinite?': (x) => {
        if (typeof x === 'number') return !Number.isFinite(x) && !Number.isNaN(x);
        if (isRational(x)) return false;
        if (isComplex(x)) return !Number.isFinite(x.real) || !Number.isFinite(x.imag);
        throw new SchemeTypeError('infinite?', 1, 'number', x);
    },

    /**
     * NaN predicate.
     * @param {number} x - Number to check.
     * @returns {boolean} True if x is NaN.
     */
    'nan?': (x) => {
        if (typeof x === 'number') return Number.isNaN(x);
        if (isRational(x)) return false;
        if (isComplex(x)) return Number.isNaN(x.real) || Number.isNaN(x.imag);
        throw new SchemeTypeError('nan?', 1, 'number', x);
    },

    // =========================================================================
    // Rational Number Procedures
    // =========================================================================

    /**
     * Returns the numerator of a rational.
     * @param {Rational|number} q - Rational number.
     * @returns {number} Numerator.
     */
    'numerator': (q) => {
        if (isRational(q)) return q.numerator;
        if (typeof q === 'number' && Number.isInteger(q)) return q;
        throw new SchemeTypeError('numerator', 1, 'rational number', q);
    },

    /**
     * Returns the denominator of a rational.
     * @param {Rational|number} q - Rational number.
     * @returns {number} Denominator.
     */
    'denominator': (q) => {
        if (isRational(q)) return q.denominator;
        if (typeof q === 'number' && Number.isInteger(q)) return 1;
        throw new SchemeTypeError('denominator', 1, 'rational number', q);
    },

    // =========================================================================
    // Complex Number Procedures (scheme complex)
    // =========================================================================

    /**
     * Creates a complex from rectangular coordinates.
     * @param {number} x - Real part.
     * @param {number} y - Imaginary part.
     * @returns {Complex}
     */
    'make-rectangular': (x, y) => {
        assertNumber('make-rectangular', 1, x);
        assertNumber('make-rectangular', 2, y);
        return makeRectangular(x, y);
    },

    /**
     * Creates a complex from polar coordinates.
     * @param {number} r - Magnitude.
     * @param {number} theta - Angle in radians.
     * @returns {Complex}
     */
    'make-polar': (r, theta) => {
        assertNumber('make-polar', 1, r);
        assertNumber('make-polar', 2, theta);
        const mag = typeof r === 'number' ? r : r.toNumber();
        const ang = typeof theta === 'number' ? theta : theta.toNumber();
        return makePolar(mag, ang);
    },

    /**
     * Returns the real part of a complex number.
     * @param {Complex|number} z - Complex number.
     * @returns {number}
     */
    'real-part': (z) => {
        if (isComplex(z)) return z.real;
        if (typeof z === 'number') return z;
        if (isRational(z)) return z.toNumber();
        throw new SchemeTypeError('real-part', 1, 'number', z);
    },

    /**
     * Returns the imaginary part of a complex number.
     * @param {Complex|number} z - Complex number.
     * @returns {number}
     */
    'imag-part': (z) => {
        if (isComplex(z)) return z.imag;
        if (typeof z === 'number') return 0;
        if (isRational(z)) return 0;
        throw new SchemeTypeError('imag-part', 1, 'number', z);
    },

    /**
     * Returns the magnitude of a complex number.
     * @param {Complex|number} z - Complex number.
     * @returns {number}
     */
    'magnitude': (z) => {
        if (isComplex(z)) return z.magnitude();
        if (typeof z === 'number') return Math.abs(z);
        if (isRational(z)) return Math.abs(z.toNumber());
        throw new SchemeTypeError('magnitude', 1, 'number', z);
    },

    /**
     * Returns the angle (argument) of a complex number.
     * @param {Complex|number} z - Complex number.
     * @returns {number}
     */
    'angle': (z) => {
        if (isComplex(z)) return z.angle();
        if (typeof z === 'number') return z >= 0 ? 0 : Math.PI;
        if (isRational(z)) return z.toNumber() >= 0 ? 0 : Math.PI;
        throw new SchemeTypeError('angle', 1, 'number', z);
    },

    // =========================================================================
    // Math.* Functions (require JavaScript Math object)
    // =========================================================================

    /**
     * Absolute value.
     * @param {number} x - Number.
     * @returns {number} Absolute value.
     */
    'abs': (x) => {
        assertNumber('abs', 1, x);
        if (isComplex(x)) return x.magnitude();
        if (isRational(x)) return x.abs();
        return Math.abs(x);
    },

    /**
     * Floor (largest integer <= x).
     * @param {number} x - Number.
     * @returns {number} Floor of x.
     */
    'floor': (x) => {
        // Handle Rational numbers
        if (isRational(x)) {
            x = x.toNumber();
        }
        assertNumber('floor', 1, x);
        return Math.floor(x);
    },

    /**
     * Ceiling (smallest integer >= x).
     * @param {number} x - Number.
     * @returns {number} Ceiling of x.
     */
    'ceiling': (x) => {
        // Handle Rational numbers
        if (isRational(x)) {
            x = x.toNumber();
        }
        assertNumber('ceiling', 1, x);
        return Math.ceil(x);
    },

    /**
     * Truncate (integer part, toward zero).
     * @param {number} x - Number.
     * @returns {number} Truncated value.
     */
    'truncate': (x) => {
        // Handle Rational numbers
        if (isRational(x)) {
            x = x.toNumber();
        }
        assertNumber('truncate', 1, x);
        return Math.trunc(x);
    },

    /**
     * Exponentiation.
     * @param {number} base - Base.
     * @param {number} exponent - Exponent.
     * @returns {number} base^exponent.
     */
    'expt': (base, exponent) => {
        assertArity('expt', [base, exponent], 2, 2);
        assertNumber('expt', 1, base);
        assertNumber('expt', 2, exponent);

        // Convert to floats for now unless we implement exact expt
        const b = isRational(base) ? base.toNumber() : (isComplex(base) ? base.toNumber() : base); // Complex toNumber throws if not real
        const e = isRational(exponent) ? exponent.toNumber() : (isComplex(exponent) ? exponent.toNumber() : exponent);

        return Math.pow(b, e);
    },

    /**
     * Square root.
     * @param {number} x - Number.
     * @returns {number} Square root.
     */
    'sqrt': (x) => {
        assertNumber('sqrt', 1, x);
        // TODO: Complex sqrt
        if (isComplex(x)) throw new SchemeError('sqrt: complex not fully supported', [x], 'sqrt');
        const val = isRational(x) ? x.toNumber() : x; // Returns inexact
        return Math.sqrt(val);
    },

    /**
     * Sine.
     * @param {number} x - Angle in radians.
     * @returns {number} Sine of x.
     */
    'sin': (x) => {
        assertNumber('sin', 1, x);
        if (isComplex(x)) throw new SchemeError('sin: complex not fully supported', [x], 'sin');
        const val = isRational(x) ? x.toNumber() : x;
        return Math.sin(val);
    },

    /**
     * Cosine.
     * @param {number} x - Angle in radians.
     * @returns {number} Cosine of x.
     */
    'cos': (x) => {
        assertNumber('cos', 1, x);
        if (isComplex(x)) throw new SchemeError('cos: complex not fully supported', [x], 'cos');
        const val = isRational(x) ? x.toNumber() : x;
        return Math.cos(val);
    },

    /**
     * Tangent.
     * @param {number} x - Angle in radians.
     * @returns {number} Tangent of x.
     */
    'tan': (x) => {
        assertNumber('tan', 1, x);
        if (isComplex(x)) throw new SchemeError('tan: complex not fully supported', [x], 'tan');
        const val = isRational(x) ? x.toNumber() : x;
        return Math.tan(val);
    },

    /**
     * Arcsine.
     * @param {number} x - Value.
     * @returns {number} Arcsine in radians.
     */
    'asin': (x) => {
        assertNumber('asin', 1, x);
        const val = isRational(x) ? x.toNumber() : x;
        return Math.asin(val);
    },

    /**
     * Arccosine.
     * @param {number} x - Value.
     * @returns {number} Arccosine in radians.
     */
    'acos': (x) => {
        assertNumber('acos', 1, x);
        const val = isRational(x) ? x.toNumber() : x;
        return Math.acos(val);
    },

    /**
     * Arctangent. With two arguments, returns atan2(y, x).
     * @param {number} y - Y value (or angle if single arg).
     * @param {number} [x] - X value (optional).
     * @returns {number} Arctangent in radians.
     */
    'atan': (y, x) => {
        assertNumber('atan', 1, y);
        const vy = isRational(y) ? y.toNumber() : y;

        if (x === undefined) {
            return Math.atan(vy);
        }
        assertNumber('atan', 2, x);
        const vx = isRational(x) ? x.toNumber() : x;
        return Math.atan2(vy, vx);
    },

    /**
     * Natural logarithm.
     * @param {number} x - Number.
     * @returns {number} Natural log of x.
     */
    'log': (x) => {
        assertNumber('log', 1, x);
        if (isComplex(x)) throw new SchemeError('log: complex not fully supported', [x], 'log');
        const val = isRational(x) ? x.toNumber() : x;
        return Math.log(val);
    },

    /**
     * Exponential function (e^x).
     * @param {number} x - Exponent.
     * @returns {number} e^x.
     */
    'exp': (x) => {
        assertNumber('exp', 1, x);
        if (isComplex(x)) throw new SchemeError('exp: complex not fully supported', [x], 'exp');
        const val = isRational(x) ? x.toNumber() : x;
        return Math.exp(val);
    },

    // =========================================================================
    // Multiple-Value Returning Procedures (R7RS §6.2.6)
    // =========================================================================

    /**
     * Exact integer square root.
     * Returns two values: the root and remainder such that k = s^2 + r
     * @param {number} k - Non-negative exact integer
     * @returns {Values} Two values: root and remainder
     */
    'exact-integer-sqrt': (k) => {
        assertInteger('exact-integer-sqrt', 1, k);
        if (k < 0) {
            throw new SchemeRangeError('exact-integer-sqrt', 'k', 0, Infinity, k);
        }
        const s = Math.floor(Math.sqrt(k));
        const r = k - s * s;
        return new Values([s, r]);
    },

    /**
     * Floor division.
     * Returns two values: quotient and remainder such that
     * n1 = n2 * quotient + remainder, with remainder having same sign as n2.
     * @param {number} n1 - Dividend
     * @param {number} n2 - Divisor
     * @returns {Values} Two values: quotient and remainder
     */
    'floor/': (n1, n2) => {
        assertArity('floor/', [n1, n2], 2, 2);
        assertInteger('floor/', 1, n1);
        assertInteger('floor/', 2, n2);
        if (n2 === 0) {
            throw new SchemeRangeError('floor/', 'divisor', -Infinity, -1, 0);
        }
        const q = Math.floor(n1 / n2);
        const r = n1 - n2 * q;
        return new Values([q, r]);
    },

    /**
     * Truncate division.
     * Returns two values: quotient and remainder such that
     * n1 = n2 * quotient + remainder, with remainder having same sign as n1.
     * @param {number} n1 - Dividend
     * @param {number} n2 - Divisor
     * @returns {Values} Two values: quotient and remainder
     */
    'truncate/': (n1, n2) => {
        assertArity('truncate/', [n1, n2], 2, 2);
        assertInteger('truncate/', 1, n1);
        assertInteger('truncate/', 2, n2);
        if (n2 === 0) {
            throw new SchemeRangeError('truncate/', 'divisor', -Infinity, -1, 0);
        }
        const q = Math.trunc(n1 / n2);
        const r = n1 - n2 * q;
        return new Values([q, r]);
    },

    /**
     * Floor quotient (single value).
     * @param {number} n1 - Dividend
     * @param {number} n2 - Divisor
     * @returns {number} Floor quotient
     */
    'floor-quotient': (n1, n2) => {
        assertArity('floor-quotient', [n1, n2], 2, 2);
        assertInteger('floor-quotient', 1, n1);
        assertInteger('floor-quotient', 2, n2);
        if (n2 === 0) {
            throw new SchemeRangeError('floor-quotient', 'divisor', -Infinity, -1, 0);
        }
        return Math.floor(n1 / n2);
    },

    /**
     * Floor remainder (single value).
     * @param {number} n1 - Dividend
     * @param {number} n2 - Divisor
     * @returns {number} Floor remainder
     */
    'floor-remainder': (n1, n2) => {
        assertArity('floor-remainder', [n1, n2], 2, 2);
        assertInteger('floor-remainder', 1, n1);
        assertInteger('floor-remainder', 2, n2);
        if (n2 === 0) {
            throw new SchemeRangeError('floor-remainder', 'divisor', -Infinity, -1, 0);
        }
        const q = Math.floor(n1 / n2);
        return n1 - n2 * q;
    },

    /**
     * Truncate quotient (single value).
     * @param {number} n1 - Dividend
     * @param {number} n2 - Divisor
     * @returns {number} Truncate quotient
     */
    'truncate-quotient': (n1, n2) => {
        assertArity('truncate-quotient', [n1, n2], 2, 2);
        assertInteger('truncate-quotient', 1, n1);
        assertInteger('truncate-quotient', 2, n2);
        if (n2 === 0) {
            throw new SchemeRangeError('truncate-quotient', 'divisor', -Infinity, -1, 0);
        }
        return Math.trunc(n1 / n2);
    },

    /**
     * Truncate remainder (single value).
     * @param {number} n1 - Dividend
     * @param {number} n2 - Divisor
     * @returns {number} Truncate remainder
     */
    'truncate-remainder': (n1, n2) => {
        assertArity('truncate-remainder', [n1, n2], 2, 2);
        assertInteger('truncate-remainder', 1, n1);
        assertInteger('truncate-remainder', 2, n2);
        if (n2 === 0) {
            throw new SchemeRangeError('truncate-remainder', 'divisor', -Infinity, -1, 0);
        }
        return n1 % n2;
    },

    /**
     * Returns the square of a number.
     * @param {number} z - Number to square.
     * @returns {number} z * z
     */
    'square': (z) => {
        assertNumber('square', 1, z);
        if (isComplex(z)) {
            // (a+bi)^2 = a^2 - b^2 + 2abi
            const a = z.real, b = z.imag;
            return makeRectangular(a * a - b * b, 2 * a * b);
        }
        return z * z;
    },

    /**
     * Converts a number to its inexact equivalent.
     * @param {number|Rational} z - Number to convert.
     * @returns {number} Inexact equivalent.
     */
    'inexact': (z) => {
        // Handle Rational before assertNumber (which only accepts JS numbers)
        if (isRational(z)) return z.toNumber();
        assertNumber('inexact', 1, z);
        if (typeof z === 'number') return z + 0.0; // Force float
        if (isComplex(z)) return z; // Already inexact
        return z;
    },

    /**
     * Converts a number to its exact equivalent if possible.
     * @param {number} z - Number to convert.
     * @returns {number|Rational} Exact equivalent.
     */
    'exact': (z) => {
        assertNumber('exact', 1, z);
        if (typeof z === 'number') {
            if (Number.isInteger(z)) return z;
            // Try to convert to rational if possible
            // For now just return integer part for non-integers
            return Math.round(z);
        }
        if (isRational(z)) return z; // Already exact
        if (isComplex(z)) {
            throw new SchemeTypeError('exact', 1, 'real number', z);
        }
        return z;
    },
};

/**
 * Port Base Classes and Utilities
 * 
 * Defines the base Port class, EOF object, and helper predicates.
 */

// ============================================================================
// EOF Object
// ============================================================================

/**
 * Unique EOF object.
 * In R7RS, (eof-object) returns a unique object that satisfies eof-object?.
 */
const EOF_OBJECT = Object.freeze({ type: 'eof-object', toString: () => '#<eof>' });

// ============================================================================
// Port Classes
// ============================================================================

/**
 * Base class for all ports.
 */
class Port {
    /**
     * @param {string} direction - 'input', 'output', or 'input/output'
     */
    constructor(direction) {
        this.direction = direction;
        this._open = true;
    }

    /** @returns {boolean} Whether this port is open. */
    get isOpen() { return this._open; }

    /** @returns {boolean} Whether this is an input port. */
    get isInput() { return this.direction.includes('input'); }

    /** @returns {boolean} Whether this is an output port. */
    get isOutput() { return this.direction.includes('output'); }

    /** @returns {boolean} Whether this is a textual port. */
    get isTextual() { return true; }

    /** @returns {boolean} Whether this is a binary port. */
    get isBinary() { return false; }

    /** Closes the port. */
    close() { this._open = false; }

    toString() {
        const status = this._open ? 'open' : 'closed';
        return `#<${this.direction}-port:${status}>`;
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Checks if a value is a Port.
 * @param {*} val
 * @returns {boolean}
 */
function isPort(val) {
    return val instanceof Port;
}

/**
 * Checks if a value is an input port.
 * @param {*} val
 * @returns {boolean}
 */
function isInputPort(val) {
    return val instanceof Port && val.isInput;
}

/**
 * Checks if a value is an output port.
 * @param {*} val
 * @returns {boolean}
 */
function isOutputPort(val) {
    return val instanceof Port && val.isOutput;
}

/**
 * Validates that a value is an open input port.
 * @param {*} port
 * @param {string} procName
 */
function requireOpenInputPort(port, procName) {
    if (!isInputPort(port)) {
        throw new Error(`${procName}: expected input port, got ${typeof port}`);
    }
    if (!port.isOpen) {
        throw new Error(`${procName}: port is closed`);
    }
}

/**
 * Validates that a value is an open output port.
 * @param {*} port
 * @param {string} procName
 */
function requireOpenOutputPort(port, procName) {
    if (!isOutputPort(port)) {
        throw new Error(`${procName}: expected output port, got ${typeof port}`);
    }
    if (!port.isOpen) {
        throw new Error(`${procName}: port is closed`);
    }
}

/**
 * String input port - reads from a string.
 */
class StringInputPort extends Port {
    /**
     * @param {string} str - The string to read from.
     */
    constructor(str) {
        super('input');
        this._string = str;
        this._pos = 0;
    }

    /** @returns {boolean} Whether there's more to read. */
    hasMore() { return this._pos < this._string.length; }

    /**
     * Reads the next character.
     * @returns {string|object} The character or EOF_OBJECT.
     */
    readChar() {
        if (!this._open) {
            throw new Error('read-char: port is closed');
        }
        if (this._pos >= this._string.length) {
            return EOF_OBJECT;
        }
        return this._string[this._pos++];
    }

    /**
     * Peeks at the next character without consuming it.
     * @returns {string|object} The character or EOF_OBJECT.
     */
    peekChar() {
        if (!this._open) {
            throw new Error('peek-char: port is closed');
        }
        if (this._pos >= this._string.length) {
            return EOF_OBJECT;
        }
        return this._string[this._pos];
    }

    /**
     * Reads a line (up to newline or EOF).
     * @returns {string|object} The line or EOF_OBJECT.
     */
    readLine() {
        if (!this._open) {
            throw new Error('read-line: port is closed');
        }
        if (this._pos >= this._string.length) {
            return EOF_OBJECT;
        }
        let line = '';
        while (this._pos < this._string.length) {
            const ch = this._string[this._pos++];
            if (ch === '\n') {
                return line;
            }
            if (ch === '\r') {
                // Handle \r\n
                if (this._pos < this._string.length && this._string[this._pos] === '\n') {
                    this._pos++;
                }
                return line;
            }
            line += ch;
        }
        return line;
    }

    /**
     * Reads up to k characters.
     * @param {number} k - Maximum characters to read.
     * @returns {string|object} The string or EOF_OBJECT.
     */
    readString(k) {
        if (!this._open) {
            throw new Error('read-string: port is closed');
        }
        if (this._pos >= this._string.length) {
            return EOF_OBJECT;
        }
        const end = Math.min(this._pos + k, this._string.length);
        const result = this._string.slice(this._pos, end);
        this._pos = end;
        return result;
    }

    /**
     * Checks if a character is ready.
     * @returns {boolean} Always true for string ports.
     */
    charReady() {
        return this._open && this._pos < this._string.length;
    }

    toString() {
        return `#<string-input-port:${this._open ? 'open' : 'closed'}>`;
    }
}

/**
 * String output port - writes to an accumulator.
 */
class StringOutputPort extends Port {
    constructor() {
        super('output');
        this._buffer = '';
    }

    /**
     * Writes a character.
     * @param {string} ch - The character to write.
     */
    writeChar(ch) {
        if (!this._open) {
            throw new Error('write-char: port is closed');
        }
        this._buffer += ch;
    }

    /**
     * Writes a string.
     * @param {string} str - The string to write.
     * @param {number} start - Optional start index.
     * @param {number} end - Optional end index.
     */
    writeString(str, start = 0, end = str.length) {
        if (!this._open) {
            throw new Error('write-string: port is closed');
        }
        this._buffer += str.slice(start, end);
    }

    /**
     * Gets the accumulated string.
     * @returns {string} The output string.
     */
    getString() {
        return this._buffer;
    }

    toString() {
        return `#<string-output-port:${this._open ? 'open' : 'closed'}>`;
    }
}

/**
 * Bytevector input port - reads bytes from a bytevector.
 */
class BytevectorInputPort extends Port {
    /**
     * @param {Uint8Array} bytevector - The bytevector to read from.
     */
    constructor(bytevector) {
        super('input');
        this._bytevector = bytevector;
        this._pos = 0;
    }

    /** @returns {boolean} Whether this is a binary port. */
    get isBinary() { return true; }

    /** @returns {boolean} Whether this is a textual port. */
    get isTextual() { return false; }

    /** @returns {boolean} Whether there's more to read. */
    hasMore() { return this._pos < this._bytevector.length; }

    /**
     * Reads the next byte.
     * @returns {number|object} The byte (0-255) or EOF_OBJECT.
     */
    readU8() {
        if (!this._open) {
            throw new Error('read-u8: port is closed');
        }
        if (this._pos >= this._bytevector.length) {
            return EOF_OBJECT;
        }
        return this._bytevector[this._pos++];
    }

    /**
     * Peeks at the next byte without consuming it.
     * @returns {number|object} The byte or EOF_OBJECT.
     */
    peekU8() {
        if (!this._open) {
            throw new Error('peek-u8: port is closed');
        }
        if (this._pos >= this._bytevector.length) {
            return EOF_OBJECT;
        }
        return this._bytevector[this._pos];
    }

    /**
     * Checks if a byte is ready.
     * @returns {boolean} Always true for bytevector ports.
     */
    u8Ready() {
        return this._open && this._pos < this._bytevector.length;
    }

    /**
     * Reads up to k bytes into a new bytevector.
     * @param {number} k - Maximum bytes to read.
     * @returns {Uint8Array|object} Bytevector or EOF_OBJECT.
     */
    readBytevector(k) {
        if (!this._open) {
            throw new Error('read-bytevector: port is closed');
        }
        if (this._pos >= this._bytevector.length) {
            return EOF_OBJECT;
        }
        const end = Math.min(this._pos + k, this._bytevector.length);
        const result = this._bytevector.slice(this._pos, end);
        this._pos = end;
        return result;
    }

    toString() {
        return `#<bytevector-input-port:${this._open ? 'open' : 'closed'}>`;
    }
}

/**
 * Bytevector output port - writes bytes to an accumulator.
 */
class BytevectorOutputPort extends Port {
    constructor() {
        super('output');
        this._buffer = [];
    }

    /** @returns {boolean} Whether this is a binary port. */
    get isBinary() { return true; }

    /** @returns {boolean} Whether this is a textual port. */
    get isTextual() { return false; }

    /**
     * Writes a byte.
     * @param {number} byte - The byte to write (0-255).
     */
    writeU8(byte) {
        if (!this._open) {
            throw new Error('write-u8: port is closed');
        }
        if (!Number.isInteger(byte) || byte < 0 || byte > 255) {
            throw new Error('write-u8: expected byte (0-255)');
        }
        this._buffer.push(byte);
    }

    /**
     * Writes bytes from a bytevector.
     * @param {Uint8Array} bv - Bytevector to write from.
     * @param {number} [start] - Start index.
     * @param {number} [end] - End index.
     */
    writeBytevector(bv, start = 0, end = bv.length) {
        if (!this._open) {
            throw new Error('write-bytevector: port is closed');
        }
        for (let i = start; i < end; i++) {
            this._buffer.push(bv[i]);
        }
    }

    /**
     * Gets the accumulated bytevector.
     * @returns {Uint8Array} The output bytevector.
     */
    getBytevector() {
        return new Uint8Array(this._buffer);
    }

    toString() {
        return `#<bytevector-output-port:${this._open ? 'open' : 'closed'}>`;
    }
}

// ============================================================================
// Environment Detection
// ============================================================================

/**
 * Detect if running in Node.js (vs browser).
 */
const isNode$2 = typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null;

/**
 * Node.js fs module (loaded dynamically to avoid browser errors).
 * @type {Object|null}
 */
let fs = null;
if (isNode$2) {
    // Dynamic import for Node.js only
    try {
        fs = await import('node:fs');
    } catch (e) {
        // Fallback for older Node versions
        try {
            fs = await import('fs');
        } catch (e2) {
            console.warn('Failed to load fs module in Node.js environment');
        }
    }
}

// ============================================================================
// File Port Classes (Node.js Only)
// ============================================================================

/**
 * File input port - reads from a file (Node.js only).
 */
class FileInputPort extends Port {
    /**
     * @param {string} filename - Path to the file.
     */
    constructor(filename) {
        super('input');
        if (!isNode$2 || !fs) {
            throw new Error('open-input-file: file I/O not supported in browser');
        }
        this._filename = filename;
        try {
            this._content = fs.readFileSync(filename, 'utf8');
        } catch (e) {
            throw new Error(`open-input-file: cannot open file ${filename}: ${e.message}`);
        }
        this._pos = 0;
    }

    /** @returns {boolean} Whether there's more to read. */
    hasMore() { return this._pos < this._content.length; }

    readChar() {
        if (!this._open) throw new Error('read-char: port is closed');
        if (this._pos >= this._content.length) return EOF_OBJECT;
        return this._content[this._pos++];
    }

    peekChar() {
        if (!this._open) throw new Error('peek-char: port is closed');
        if (this._pos >= this._content.length) return EOF_OBJECT;
        return this._content[this._pos];
    }

    readLine() {
        if (!this._open) throw new Error('read-line: port is closed');
        if (this._pos >= this._content.length) return EOF_OBJECT;
        let line = '';
        while (this._pos < this._content.length) {
            const ch = this._content[this._pos++];
            if (ch === '\n') return line;
            if (ch === '\r') {
                if (this._pos < this._content.length && this._content[this._pos] === '\n') {
                    this._pos++;
                }
                return line;
            }
            line += ch;
        }
        return line;
    }

    readString(k) {
        if (!this._open) throw new Error('read-string: port is closed');
        if (this._pos >= this._content.length) return EOF_OBJECT;
        const end = Math.min(this._pos + k, this._content.length);
        const result = this._content.slice(this._pos, end);
        this._pos = end;
        return result;
    }

    charReady() {
        return this._open && this._pos < this._content.length;
    }

    toString() {
        return `#<file-input-port:${this._filename}:${this._open ? 'open' : 'closed'}>`;
    }
}

/**
 * File output port - writes to a file (Node.js only).
 */
class FileOutputPort extends Port {
    /**
     * @param {string} filename - Path to the file.
     */
    constructor(filename) {
        super('output');
        if (!isNode$2 || !fs) {
            throw new Error('open-output-file: file I/O not supported in browser');
        }
        this._filename = filename;
        this._buffer = '';
        // Clear file initially
        try {
            fs.writeFileSync(filename, '');
        } catch (e) {
            throw new Error(`open-output-file: cannot open file ${filename}: ${e.message}`);
        }
    }

    writeChar(ch) {
        if (!this._open) throw new Error('write-char: port is closed');
        this._buffer += ch;
    }

    writeString(str, start = 0, end = str.length) {
        if (!this._open) throw new Error('write-string: port is closed');
        this._buffer += str.slice(start, end);
    }

    /**
     * Flushes buffer to file.
     */
    flush() {
        if (this._buffer.length > 0) {
            try {
                fs.appendFileSync(this._filename, this._buffer);
                this._buffer = '';
            } catch (e) {
                console.error(`Error flushing file port ${this._filename}: ${e.message}`);
            }
        }
    }

    /**
     * Closes the port and writes remaining buffer.
     */
    close() {
        if (this._open) {
            this.flush();
            this._open = false;
        }
    }

    toString() {
        return `#<file-output-port:${this._filename}:${this._open ? 'open' : 'closed'}>`;
    }
}

/**
 * Checks if a file exists.
 * @param {string} filename
 * @returns {boolean}
 */
function fileExists(filename) {
    if (!isNode$2 || !fs) return false;
    try {
        return fs.existsSync(filename);
    } catch (e) {
        return false;
    }
}

/**
 * Deletes a file.
 * @param {string} filename
 */
function deleteFile(filename) {
    if (!isNode$2 || !fs) {
        throw new Error('delete-file: file I/O not supported in browser');
    }
    try {
        fs.unlinkSync(filename);
    } catch (e) {
        throw new Error(`delete-file: cannot delete file ${filename}: ${e.message}`);
    }
}

/**
 * Console output port - writes to console.log (for default ports).
 */
class ConsoleOutputPort extends Port {
    constructor(name = 'stdout') {
        super('output');
        this._name = name;
        this._lineBuffer = '';
    }

    writeChar(ch) {
        if (!this._open) {
            throw new Error('write-char: port is closed');
        }
        if (ch === '\n') {
            console.log(this._lineBuffer);
            this._lineBuffer = '';
        } else {
            this._lineBuffer += ch;
        }
    }

    writeString(str, start = 0, end = str.length) {
        if (!this._open) {
            throw new Error('write-string: port is closed');
        }
        const slice = str.slice(start, end);
        for (const ch of slice) {
            this.writeChar(ch);
        }
    }

    /**
     * Flushes any remaining buffered output.
     */
    flush() {
        if (this._lineBuffer.length > 0) {
            console.log(this._lineBuffer);
            this._lineBuffer = '';
        }
    }

    toString() {
        return `#<console-${this._name}-port>`;
    }
}

// ============================================================================
// Printer Logic (Display/Write)
// ============================================================================

/**
 * Converts a Scheme value to its display representation.
 * @param {*} val
 * @returns {string}
 */
function displayString(val) {
    if (typeof val === 'function' || val && val.constructor && val.constructor.name === 'Closure') {
        const name = val.constructor ? val.constructor.name : 'Unknown';
        if (name === 'Closure') return val.toString();
        return `#<procedure ${name}>`;
    }
    if (val === null) return '()';
    if (val === true) return '#t';
    if (val === false) return '#f';
    if (typeof val === 'string') return val;  // display doesn't quote strings
    if (typeof val === 'number') {
        // R7RS special value formatting
        if (val === Infinity) return '+inf.0';
        if (val === -Infinity) return '-inf.0';
        if (Number.isNaN(val)) return '+nan.0';
        return String(val);
    }
    if (val instanceof Cons) return consToString(val, displayString);
    if (Array.isArray(val)) return vectorToString(val, displayString);
    if (val instanceof Uint8Array) return bytevectorToString(val);
    if (val instanceof Symbol$1) return val.name; // Symbol - display doesn't wrap
    if (val === EOF_OBJECT) return '#<eof>';
    if (val instanceof Port) return val.toString();
    if (typeof val === 'function') {
        const name = val.constructor ? val.constructor.name : 'Unknown';
        if (name === 'Closure') return val.toString();
        return `#<procedure ${name}>`;
    }
    if (val && val.type === 'record') {
        return `#<${val.typeDescriptor.name}>`;
    }
    return String(val);
}

/**
 * Converts a Scheme value to its write (machine-readable) representation.
 * @param {*} val
 * @returns {string}
 */
function writeString(val) {
    if (val === null) return '()';
    if (val === true) return '#t';
    if (val === false) return '#f';
    if (typeof val === 'string') {
        // Escape and quote strings
        return '"' + val
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t') + '"';
    }
    if (typeof val === 'number') {
        // R7RS special value formatting
        if (val === Infinity) return '+inf.0';
        if (val === -Infinity) return '-inf.0';
        if (Number.isNaN(val)) return '+nan.0';
        return String(val);
    }
    if (val instanceof Cons) return consToString(val, writeString);
    if (Array.isArray(val)) return vectorToString(val, writeString);
    if (val instanceof Uint8Array) return bytevectorToString(val);
    if (val instanceof Symbol$1) {
        // Symbol - check if it needs |...| escaping
        return writeSymbol(val.name);
    }
    if (val === EOF_OBJECT) return '#<eof>';
    if (val instanceof Port) return val.toString();
    if (typeof val === 'function') {
        const name = val.constructor ? val.constructor.name : 'Unknown';
        if (name === 'Closure') return val.toString();
        return `#<procedure ${name}>`;
    }
    if (val && typeof val === 'object' && val.type === 'char') {
        // Character representation
        const ch = val.value;
        if (ch === ' ') return '#\\space';
        if (ch === '\n') return '#\\newline';
        if (ch === '\t') return '#\\tab';
        if (ch === '\r') return '#\\return';
        return '#\\' + ch;
    }
    // If it's just a single character string representing a char
    if (typeof val === 'string' && val.length === 1) {
        // This is called from write context - but strings should be quoted
        // Character objects would be handled separately
        return '"' + val + '"';
    }
    if (val && val.type === 'record') {
        return `#<${val.typeDescriptor.name}>`;
    }
    return String(val);
}

/**
 * Writes a symbol, escaping with |...| if needed per R7RS.
 * Symbols that look like numbers, start with special chars, contain whitespace
 * or special characters, or are empty need to be wrapped in |...|.
 * @param {string} name - Symbol name
 * @returns {string} Properly escaped symbol representation
 */
function writeSymbol(name) {
    // Empty symbol
    if (name === '') {
        return '||';
    }

    // Check if the symbol needs escaping
    if (symbolNeedsEscaping(name)) {
        // Escape backslashes and vertical bars, then wrap in |...|
        const escaped = name
            .replace(/\\/g, '\\\\')
            .replace(/\|/g, '\\|');
        return '|' + escaped + '|';
    }

    return name;
}

/**
 * Checks if a symbol name needs |...| escaping.
 * @param {string} name - Symbol name
 * @returns {boolean} True if escaping is needed
 */
function symbolNeedsEscaping(name) {
    // Empty string always needs escaping
    if (name === '') return true;

    // Single dot needs escaping
    if (name === '.') return true;

    // Contains whitespace or special characters
    if (/[\s"'`,;()[\]{}|\\]/.test(name)) return true;

    // Looks like it could be parsed as a number
    // This includes: starts with digit, +digit, -digit, ., +., -.
    // Also +i, -i, +nan.0, -nan.0, +inf.0, -inf.0

    // Check if it looks like a numeric literal
    const lowerName = name.toLowerCase();

    // Pure numeric forms
    if (/^[+-]?\.?\d/.test(name)) return true;

    // +i, -i
    if (lowerName === '+i' || lowerName === '-i') return true;

    // +nan.0, -nan.0, +inf.0, -inf.0
    if (/^[+-]?(nan|inf)\.0/i.test(name)) return true;

    // Starts with # (could look like numeric prefix)
    if (name.startsWith('#')) return true;

    return false;
}


/**
 * Converts a Scheme value to its write representation with shared structure detection.
 * Uses datum labels (#n= and #n#) for cycles and shared objects.
 * @param {*} val
 * @returns {string}
 */
function writeStringShared(val) {
    // First pass: find shared/cyclic objects
    const seen = new Map();  // object -> { count: number, id: number|null }
    let nextId = 0;

    function countOccurrences(obj) {
        if (obj === null || typeof obj !== 'object') return;
        if (typeof obj === 'function') return;

        // Skip non-compound types
        if (!(obj instanceof Cons) && !Array.isArray(obj)) return;

        if (seen.has(obj)) {
            const info = seen.get(obj);
            info.count++;
            if (info.id === null) {
                info.id = nextId++;
            }
        } else {
            seen.set(obj, { count: 1, id: null });
            if (obj instanceof Cons) {
                countOccurrences(obj.car);
                countOccurrences(obj.cdr);
            } else if (Array.isArray(obj)) {
                for (const elem of obj) {
                    countOccurrences(elem);
                }
            }
        }
    }

    countOccurrences(val);

    // Second pass: build output with datum labels
    const emitted = new Set();  // objects that have been output with #n=

    function emit(obj) {
        // Handle primitives
        if (obj === null) return '()';
        if (obj === true) return '#t';
        if (obj === false) return '#f';
        if (typeof obj === 'string') {
            return '"' + obj
                .replace(/\\/g, '\\\\')
                .replace(/"/g, '\\"')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t') + '"';
        }
        if (typeof obj === 'number') return String(obj);
        if (obj && obj.name && obj.description === undefined) return obj.name; // Symbol
        if (obj === EOF_OBJECT) return '#<eof>';
        if (obj instanceof Port) return obj.toString();
        if (typeof obj === 'function') {
            const name = obj.constructor ? obj.constructor.name : 'Unknown';
            if (name === 'Closure') return obj.toString();
            return `#<procedure ${name}>`;
        }
        if (obj && obj.type === 'record') {
            return `#<${obj.typeDescriptor.name}>`;
        }

        // Handle compound types with sharing detection
        if (obj instanceof Cons || Array.isArray(obj)) {
            const info = seen.get(obj);
            if (info && info.id !== null) {
                if (emitted.has(obj)) {
                    // Already emitted - use reference
                    return `#${info.id}#`;
                } else {
                    // First emission - add label
                    emitted.add(obj);
                    if (obj instanceof Cons) {
                        return `#${info.id}=${consToStringShared(obj, emit)}`;
                    } else {
                        return `#${info.id}=${vectorToStringShared(obj, emit)}`;
                    }
                }
            } else {
                // Not shared - normal output
                if (obj instanceof Cons) {
                    return consToStringShared(obj, emit);
                } else {
                    return vectorToStringShared(obj, emit);
                }
            }
        }

        if (obj instanceof Uint8Array) return bytevectorToString(obj);

        return String(obj);
    }

    function consToStringShared(cons, emitFn) {
        const parts = [];
        let current = cons;
        const visitedInChain = new Set();

        while (current instanceof Cons) {
            // Check if this cons is shared and already referenced
            const info = seen.get(current);
            if (info && info.id !== null && emitted.has(current) &&
                (current !== cons || parts.length > 0)) {
                // Terminate with improper tail reference
                return '(' + parts.join(' ') + ' . #' + info.id + '#)';
            }

            // Detect cycle within same chain (not via datum labels)
            if (visitedInChain.has(current)) {
                return '(' + parts.join(' ') + ' . ...)';
            }
            visitedInChain.add(current);

            parts.push(emitFn(current.car));
            current = current.cdr;
        }

        if (current === null) {
            return '(' + parts.join(' ') + ')';
        } else {
            return '(' + parts.join(' ') + ' . ' + emitFn(current) + ')';
        }
    }

    function vectorToStringShared(vec, emitFn) {
        return '#(' + vec.map(emitFn).join(' ') + ')';
    }

    return emit(val);
}

/**
 * Converts a cons cell to a string.
 * @param {Cons} cons
 * @param {Function} elemFn - Function to convert elements.
 * @returns {string}
 */
function consToString(cons, elemFn) {
    const parts = [];
    let current = cons;
    while (current instanceof Cons) {
        parts.push(elemFn(current.car));
        current = current.cdr;
    }
    if (current === null) {
        return '(' + parts.join(' ') + ')';
    } else {
        // Improper list
        return '(' + parts.join(' ') + ' . ' + elemFn(current) + ')';
    }
}

/**
 * Converts a vector to a string.
 * @param {Array} vec
 * @param {Function} elemFn
 * @returns {string}
 */
function vectorToString(vec, elemFn) {
    return '#(' + vec.map(elemFn).join(' ') + ')';
}

function bytevectorToString(bv) {
    return '#u8(' + Array.from(bv).join(' ') + ')';
}

/**
 * @fileoverview Tokenizer for Scheme S-expressions.
 * Handles lexical analysis including block comments and whitespace tracking.
 */

/**
 * Strips block comments #|...|# from input, including nested ones.
 * @param {string} input - Source code
 * @returns {string} Input with block comments removed
 */
function stripBlockComments(input) {
    let result = '';
    let i = 0;

    while (i < input.length) {
        if (i + 1 < input.length && input[i] === '#' && input[i + 1] === '|') {
            // Start of block comment - find matching end
            let depth = 1;
            i += 2;
            while (i < input.length && depth > 0) {
                if (i + 1 < input.length && input[i] === '#' && input[i + 1] === '|') {
                    depth++;
                    i += 2;
                } else if (i + 1 < input.length && input[i] === '|' && input[i + 1] === '#') {
                    depth--;
                    i += 2;
                } else {
                    i++;
                }
            }
            // Replace with space to preserve token boundaries
            result += ' ';
        } else {
            result += input[i];
            i++;
        }
    }
    return result;
}

/**
 * Tokenizes Scheme source code into an array of token objects.
 * Each token has a `value` string and `hasPrecedingSpace` boolean.
 * 
 * @param {string} input - Source code (after block comment stripping)
 * @returns {Array<{value: string, hasPrecedingSpace: boolean}>} Token array
 */
function tokenize(input) {
    // Regex based tokenizer
    // Matches (order matters - longer/more specific matches first):
    // 1. #\ followed by character name or single char (character literals)
    // 2. #u8( - Bytevector start
    // 3. #{ - JS object literal start
    // 4. #( - Vector start
    // 5. #; - Datum comment
    // 6. #!fold-case, #!no-fold-case - Case folding directives
    // 7. ( or ) or } - List/object delimiters
    // 8. ' ` ,@ , - Quote/Quasiquote
    // 9. Strings
    // 10. |...| - Vertical bar delimited symbols
    // 11. Line comments (;...)
    // 12. Complex numbers with inf/nan (e.g., +inf.0+inf.0i, -nan.0+inf.0i)
    // 13. Single special numbers (+nan.0, +inf.0, etc.)
    // 14. Atoms (anything else, stops at whitespace, parens, or semicolon)
    // Note: Updated to capture leading whitespace in group 1
    const regex = /^(\s*)(#\\(?:x[0-9a-fA-F]+|[a-zA-Z]+|.)|#u8\(|#\{|#\(|#;|#!fold-case|#!no-fold-case|'|`|,@|,|[(){}]|"(?:\\.|[^"])*"|\|(?:[^|\\]|\\.)*\||;[^\n]*|[+-]?(?:nan|inf)\.0[+-](?:nan|inf)\.0i|[+-]?(?:nan|inf)\.0|[^\s(){};]+)(.*)/si;

    const tokens = [];
    let current = input;

    // Track if we are at the very beginning of the input
    let isStart = true;

    while (current.length > 0) {
        const match = current.match(regex);
        if (!match) {
            // If we can't match a token but have content, it might be just whitespace at EOF or invalid input
            // Skip one char and try again (fallback, though regex should cover whitespace)
            if (current.trim() === '') break;
            current = current.slice(1);
            continue;
        }

        const whitespace = match[1];
        const tokenStr = match[2];
        current = match[3]; // Rest of string

        if (tokenStr.startsWith(';')) {
            // Comments act as whitespace separator effectively, but we don't count them as "space" for adjacency.
            // Actually, standard behavior: `(a) ;comment\n.prop` -> separate line, effectively separate.
            // We will count comments as breaking adjacency.
            isStart = false;
            continue;
        }

        // hasPrecedingSpace is true if there was whitespace OR we are at start of input
        const hasSpace = (whitespace.length > 0) || isStart;

        tokens.push({ value: tokenStr, hasPrecedingSpace: hasSpace });
        isStart = false; // After first token, not start anymore
    }
    return tokens;
}

/**
 * @fileoverview Dot notation property access for Scheme reader.
 * Handles JavaScript-style property access syntax (e.g., obj.prop.nested).
 */


/**
 * Handles dot property access chains after an expression.
 * Transforms `expr.prop1.prop2` into `(js-ref (js-ref expr "prop1") "prop2")`.
 * 
 * @param {*} expr - The base expression
 * @param {Array} tokens - Remaining tokens (may be consumed)
 * @returns {*} The expression with property accesses chained
 */
function handleDotAccess(expr, tokens) {
    let currentExpr = expr;

    while (tokens.length > 0) {
        const nextToken = tokens[0];

        // Check if next token is a dot property access:
        // 1. Starts with dot
        // 2. Not just "." (improper list delimiter)
        // 3. NO preceding space (adjacent)
        if (nextToken.value.startsWith('.') &&
            nextToken.value !== '.' &&
            !nextToken.hasPrecedingSpace) {

            // Consume token
            tokens.shift();

            // Split property chain (e.g. .a.b -> ["", "a", "b"])
            const parts = nextToken.value.split('.');

            for (let i = 1; i < parts.length; i++) {
                const prop = parts[i];
                if (prop.length === 0) {
                    // Skip empty parts (consecutive dots or trailing dot)
                    continue;
                }
                currentExpr = list(intern('js-ref'), currentExpr, prop);
            }
        } else {
            break;
        }
    }
    return currentExpr;
}

/**
 * Builds a nested property access form from a chain like ["obj", "prop1", "prop2"].
 * Returns: (js-ref (js-ref obj "prop1") "prop2")
 * @param {string[]} parts - Array of property path segments
 * @returns {Cons|Symbol} The nested js-ref form
 */
function buildPropertyAccessForm(parts) {
    // Start with the base object (first part as a symbol)
    let result = intern(parts[0]);

    // Chain property accesses for remaining parts
    for (let i = 1; i < parts.length; i++) {
        result = list(intern('js-ref'), result, parts[i]);
    }

    return result;
}

/**
 * @fileoverview String and symbol escape processing for Scheme reader.
 */

/**
 * Process escape sequences in vertical bar delimited symbols.
 * @param {string} str - Inner content of |...|
 * @returns {string} Processed string
 */
function processSymbolEscapes(str) {
    let result = '';
    let i = 0;
    while (i < str.length) {
        if (str[i] === '\\' && i + 1 < str.length) {
            const next = str[i + 1];
            if (next === '|') {
                result += '|';
                i += 2;
            } else if (next === '\\') {
                result += '\\';
                i += 2;
            } else if (next === 'x') {
                // Hex escape: \xNN; or \xNNNN;
                const semicolonIdx = str.indexOf(';', i + 2);
                if (semicolonIdx !== -1) {
                    const hexStr = str.slice(i + 2, semicolonIdx);
                    const codePoint = parseInt(hexStr, 16);
                    if (!isNaN(codePoint)) {
                        result += String.fromCodePoint(codePoint);
                        i = semicolonIdx + 1;
                        continue;
                    }
                }
                // Invalid hex escape - keep as-is
                result += str[i];
                i++;
            } else {
                // Other escapes - keep the character after backslash
                result += next;
                i += 2;
            }
        } else {
            result += str[i];
            i++;
        }
    }
    return result;
}

/**
 * Process R7RS string escape sequences.
 * \a - alarm (bell)
 * \b - backspace
 * \t - tab
 * \n - newline
 * \r - return
 * \" - double quote
 * \\ - backslash
 * \| - vertical bar
 * \xN...N; - hex escape
 * \<newline><intraline-whitespace> - line continuation
 * @param {string} str - String content without quotes
 * @returns {string} Processed string
 */
function processStringEscapes(str) {
    let result = '';
    let i = 0;
    while (i < str.length) {
        if (str[i] === '\\' && i + 1 < str.length) {
            const next = str[i + 1];
            switch (next) {
                case 'a':
                    result += '\x07'; // alarm (bell)
                    i += 2;
                    break;
                case 'b':
                    result += '\x08'; // backspace
                    i += 2;
                    break;
                case 't':
                    result += '\t';
                    i += 2;
                    break;
                case 'n':
                    result += '\n';
                    i += 2;
                    break;
                case 'r':
                    result += '\r';
                    i += 2;
                    break;
                case '"':
                    result += '"';
                    i += 2;
                    break;
                case '\\':
                    result += '\\';
                    i += 2;
                    break;
                case '|':
                    result += '|';
                    i += 2;
                    break;
                case 'x':
                    // Hex escape: \xN...N;
                    const semicolonIdx = str.indexOf(';', i + 2);
                    if (semicolonIdx !== -1) {
                        const hexStr = str.slice(i + 2, semicolonIdx);
                        const codePoint = parseInt(hexStr, 16);
                        if (!isNaN(codePoint)) {
                            result += String.fromCodePoint(codePoint);
                            i = semicolonIdx + 1;
                            break;
                        }
                    }
                    // Invalid hex escape - keep as-is
                    result += str[i];
                    i++;
                    break;
                case '\n':
                case '\r':
                case ' ':
                case '\t':
                    // Line continuation: skip backslash, skip whitespace including newline
                    i += 1; // skip backslash
                    // Skip leading whitespace before newline
                    while (i < str.length && (str[i] === ' ' || str[i] === '\t')) {
                        i++;
                    }
                    // Skip newline (could be \n, \r, or \r\n)
                    if (i < str.length && str[i] === '\r') {
                        i++;
                    }
                    if (i < str.length && str[i] === '\n') {
                        i++;
                    }
                    // Skip trailing whitespace after newline
                    while (i < str.length && (str[i] === ' ' || str[i] === '\t')) {
                        i++;
                    }
                    break;
                default:
                    // Unknown escape - keep the character
                    result += next;
                    i += 2;
            }
        } else {
            result += str[i];
            i++;
        }
    }
    return result;
}

/**
 * @fileoverview Number parsing for Scheme reader.
 * Handles integers, decimals, rationals, complex numbers, and R7RS prefixes.
 */


/**
 * Parses a numeric literal (integers, rationals, complex, with optional prefixes)
 * R7RS supports prefixes: #b (binary), #o (octal), #d (decimal), #x (hex), #e (exact), #i (inexact)
 * @param {string} token 
 * @returns {number|Rational|Complex|null}
 */
function parseNumber(token, exactness) {
    // Normalize R7RS exponent markers (s, f, d, l) to 'e' globally before parsing
    // This handles 1s2 -> 1e2, 1s2+3d4i -> 1e2+3e4i, etc.
    // Use lookahead to ensure we only replace exponent markers followed by a sign or digit,
    // preventing "inf.0" from becoming "ine.0"
    if (/[sSfFdDlL]/.test(token) && !token.startsWith('#')) {
        token = token.replace(/[sSfFdDlL](?=[+-]?\d)/g, 'e');
    }

    // Handle prefixed numbers (#x, #o, #b, #d, #e, #i)
    if (token.startsWith('#')) {
        return parsePrefixedNumber(token);
    }

    // Helper to parse a real component string into a number or Rational
    const parseRealStr = (str) => {
        if (!str) return 0;
        const lower = str.toLowerCase();
        if (lower.endsWith('inf.0')) {
            const val = lower.startsWith('-') ? -Infinity : Infinity;
            return val;
        }
        if (lower.endsWith('nan.0')) {
            return NaN;
        }
        // Handle rational components (e.g. 1/2) - return Rational if exact components
        if (str.includes('/')) {
            const parts = str.split('/');
            // If either part is decimal/scientific, it's inexact float division
            if (parts[0].includes('.') || parts[0].toLowerCase().includes('e') ||
                parts[1].includes('.') || parts[1].toLowerCase().includes('e')) {
                return parseFloat(parts[0]) / parseFloat(parts[1]);
            }
            return new Rational(parseInt(parts[0], 10), parseInt(parts[1], 10));
        }
        return parseFloat(str);
    };

    // Handle immediate special values
    if (/^[+-]?inf\.0$/i.test(token)) return parseRealStr(token);
    if (/^[+-]?nan\.0$/i.test(token)) return NaN;

    // Pattern for unsigned real numbers: rationals, integers, decimals, scientific notation, inf.0, nan.0
    const UNSIGNED_REAL = '(?:\\d+/\\d+|(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?|inf\\.0|nan\\.0)';

    // Pattern for signed real numbers (capturing group 1)
    const REAL_PATTERN = `([+-]?${UNSIGNED_REAL})`;

    // Complex: real+imag (e.g., 1+2i, 1e2+3e4i, +inf.0+inf.0i)
    // The regex captures: 1:real, 2:sign, 3:imag(unsigned)
    const complexRegex = new RegExp(`^${REAL_PATTERN}([+-])(${UNSIGNED_REAL})?i$`, 'i');
    const complexMatch = token.match(complexRegex);

    if (complexMatch) {
        const real = parseRealStr(complexMatch[1]);
        const sign = complexMatch[2] === '-' ? -1 : 1;
        const imagStr = complexMatch[3];

        let imagVal = imagStr ? parseRealStr(imagStr) : 1;
        // Apply sign
        if (sign === -1) {
            if (imagVal instanceof Rational) imagVal = imagVal.negate();
            else imagVal = -imagVal;
        }

        return new Complex(real, imagVal);
    }

    // Pure imaginary: +i, -i, 3i, +inf.0i
    // Captures: 1:real(signed) or sign
    const pureImagRegex = new RegExp(`^(${REAL_PATTERN}|[+-])i$`, 'i');
    const pureImagMatch = token.match(pureImagRegex);

    if (pureImagMatch) {
        const part = pureImagMatch[1];
        if (part === '+' || part === '') return new Complex(0, 1);
        if (part === '-') return new Complex(0, -1);

        return new Complex(0, parseRealStr(part));
    }

    // Check for rational: 1/2, -3/4, etc.
    const rationalMatch = token.match(/^([+-]?\d+)\/(\d+)$/);
    if (rationalMatch) {
        const num = parseInt(rationalMatch[1], 10);
        const den = parseInt(rationalMatch[2], 10);
        if (den === 0) {
            throw new SchemeReadError('division by zero', 'rational');
        }
        return new Rational(num, den);
    }

    // Regular number (integer or decimal)
    let num = Number(token);
    if (!isNaN(num)) {
        return num;
    }

    return null; // Not a number
}

/**
 * Parses a number with R7RS prefix notation.
 * Handles #x (hex), #o (octal), #b (binary), #d (decimal), #e (exact), #i (inexact)
 * and combinations like #e#x10 or #x#e10
 * @param {string} token - Token starting with #
 * @returns {number|Rational|null}
 */
function parsePrefixedNumber(token) {
    let exactness = null; // 'exact', 'inexact', or null
    let radix = 10;
    let rest = token;

    // Parse up to 2 prefixes (one exactness, one radix)
    for (let i = 0; i < 2 && rest.startsWith('#'); i++) {
        const prefix = rest.substring(0, 2).toLowerCase();
        switch (prefix) {
            case '#e':
                exactness = 'exact';
                rest = rest.substring(2);
                break;
            case '#i':
                exactness = 'inexact';
                rest = rest.substring(2);
                break;
            case '#b':
                radix = 2;
                rest = rest.substring(2);
                break;
            case '#o':
                radix = 8;
                rest = rest.substring(2);
                break;
            case '#d':
                radix = 10;
                rest = rest.substring(2);
                break;
            case '#x':
                radix = 16;
                rest = rest.substring(2);
                break;
            default:
                return null; // Not a numeric prefix
        }
    }

    // If still starts with #, it's not a valid number
    if (rest.startsWith('#')) {
        return null;
    }

    // Normalize alternative exponent markers for decimal numbers
    if (radix === 10 && /^[+-]?(\d+\.?\d*|\.\d+)[sSfFdDlL][+-]?\d+$/.test(rest)) {
        rest = rest.replace(/[sSfFdDlL]/, 'e');
    }

    // Handle rational with radix: #x10/2 means 16/2 = 8
    const rationalMatch = rest.match(/^([+-]?[0-9a-fA-F]+)\/([0-9a-fA-F]+)$/);
    if (rationalMatch) {
        const num = parseInt(rationalMatch[1], radix);
        const den = parseInt(rationalMatch[2], radix);
        if (isNaN(num) || isNaN(den)) return null;
        if (den === 0) throw new SchemeReadError('division by zero', 'rational');

        if (exactness === 'inexact') {
            return num / den;
        }
        const rat = new Rational(num, den);
        return rat;
    }

    // Handle complex with radix: #d10+11i
    const complexMatch = rest.match(/^([+-]?[0-9a-fA-F.]+)([+-])([0-9a-fA-F.]+)?i$/);
    if (complexMatch) {
        const real = radix === 10 ? parseFloat(complexMatch[1]) : parseInt(complexMatch[1], radix);
        const sign = complexMatch[2] === '-' ? -1 : 1;
        const imagPart = complexMatch[3] || '1';
        const imag = sign * (radix === 10 ? parseFloat(imagPart) : parseInt(imagPart, radix));
        return new Complex(real, imag);
    }

    // Parse as integer in the given radix
    let result;

    // Handle special values: +inf.0, -inf.0, +nan.0, -nan.0 (case-insensitive)
    const lowerRest = rest.toLowerCase();
    if (/^[+-]?inf\.0$/.test(lowerRest)) {
        return lowerRest.startsWith('-') ? -Infinity : Infinity;
    }
    if (/^[+-]?nan\.0$/.test(lowerRest)) {
        return NaN;
    }

    if (radix === 10 && (rest.includes('.') || rest.toLowerCase().includes('e') || rest.toLowerCase().includes('s') || rest.toLowerCase().includes('f') || rest.toLowerCase().includes('d') || rest.toLowerCase().includes('l'))) {
        // Decimal with fractional part or exponent
        // Validate strict format: optional sign, digits, optional dot, optional digits, optional exponent
        if (!/^[+-]?(\d+(\.\d*)?|\.\d+)([eEsSfFdDlL][+-]?\d+)?$/.test(rest)) {
            return null;
        }
        const normalized = rest.replace(/[sSfFdDlL](?=[+-]?\d)/g, 'e');
        result = parseFloat(normalized);
    } else {
        // Integer in given radix
        // Validate chars strictly
        const validChars = '0123456789abcdefghijklmnopqrstuvwxyz'.slice(0, radix);
        const checkRest = rest.replace(/^[+-]/, '').toLowerCase();
        for (const char of checkRest) {
            if (!validChars.includes(char)) return null;
        }
        result = parseInt(rest, radix);
    }

    if (isNaN(result)) {
        return null;
    }

    // Apply exactness
    if (exactness === 'inexact' && Number.isInteger(result)) {
        result = result + 0.0; // Ensure it's a float (though in JS all numbers are floats)
    } else if (exactness === 'exact' && Number.isInteger(result)) {
        // Already exact, return as-is or as Rational
        return result;
    }

    return result;
}

/**
 * @fileoverview Character literal parsing for Scheme reader.
 */


/**
 * Named character constants per R7RS §6.6.
 */
const NAMED_CHARACTERS = {
    'alarm': '\x07',
    'backspace': '\x08',
    'delete': '\x7F',
    'escape': '\x1B',
    'newline': '\n',
    'null': '\x00',
    'return': '\r',
    'space': ' ',
    'tab': '\t'
};

/**
 * Parses a character literal (after the #\ prefix).
 * @param {string} name - The character name or literal
 * @returns {string} Single-character string (Scheme character)
 */
function readCharacter(name) {
    // Hex escape: #\x41 -> 'A'
    if (name.startsWith('x') && name.length > 1) {
        const codePoint = parseInt(name.slice(1), 16);
        if (isNaN(codePoint)) {
            throw new SchemeReadError(`invalid character hex escape: #\\${name}`, 'character');
        }
        return String.fromCodePoint(codePoint);
    }

    // Named character: #\newline -> '\n'
    const lower = name.toLowerCase();
    if (NAMED_CHARACTERS.hasOwnProperty(lower)) {
        return NAMED_CHARACTERS[lower];
    }

    // Single character: #\a -> 'a'
    if (name.length === 1) {
        return name;
    }

    throw new SchemeReadError(`unknown character name: #\\${name}`, 'character');
}

/**
 * @fileoverview Datum label handling for circular structure support.
 * Implements R7RS #n= and #n# syntax for shared structure.
 */


/**
 * Placeholder for forward references in datum labels.
 * Used when #n# references a label that hasn't been fully read yet.
 */
class Placeholder {
    constructor(id) {
        this.id = id;
        this.value = null; // Will be set when the labelled datum is fully read
        this.resolved = false;
    }
}

/**
 * Traverses the object graph replacing Placeholders with their resolved values.
 * Handles recursion and cycle detection using a visited Set.
 * @param {*} obj
 * @param {Set} visited
 * @returns {*} The fixed-up object
 */
function fixup(obj, visited = new Set()) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (visited.has(obj)) {
        return obj;
    }
    visited.add(obj);

    // Handle Cons pairs
    if (obj instanceof Cons) {
        if (obj.car instanceof Placeholder) {
            if (!obj.car.resolved) throw new SchemeReadError(`reference to undefined label #${obj.car.id}#`, 'datum label');
            obj.car = obj.car.value;
        } else {
            fixup(obj.car, visited);
        }

        if (obj.cdr instanceof Placeholder) {
            if (!obj.cdr.resolved) throw new SchemeReadError(`reference to undefined label #${obj.cdr.id}#`, 'datum label');
            obj.cdr = obj.cdr.value;
        } else {
            fixup(obj.cdr, visited);
        }
        return obj;
    }

    // Handle Vectors (Arrays)
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            if (obj[i] instanceof Placeholder) {
                if (!obj[i].resolved) throw new SchemeReadError(`reference to undefined label #${obj[i].id}#`, 'datum label');
                obj[i] = obj[i].value;
            } else {
                fixup(obj[i], visited);
            }
        }
        return obj;
    }

    return obj;
}

/**
 * @fileoverview Core parser for Scheme S-expressions.
 * Handles lists, vectors, atoms, quotes, and special syntaxes.
 */


/**
 * Main parser dispatch. Reads one S-expression from tokens.
 * @param {Array} tokens - Token array
 * @param {Object} state - Parser state (caseFold, labels)
 * @returns {*} Parsed S-expression
 */
function readFromTokens(tokens, state) {
    if (tokens.length === 0) {
        throw new SchemeReadError('unexpected end of input', state.current || 'expression');
    }

    const tokenObj = tokens.shift();
    const token = tokenObj.value;

    // Handle fold-case directives
    if (token === '#!fold-case') {
        state.caseFold = true;
        if (tokens.length === 0) return undefined;
        return readFromTokens(tokens, state); // Continue to next datum
    }
    if (token === '#!no-fold-case') {
        state.caseFold = false;
        if (tokens.length === 0) return undefined;
        return readFromTokens(tokens, state); // Continue to next datum
    }

    // Handle datum comments: #; skips the next datum
    if (token === '#;') {
        if (tokens.length === 0) {
            throw new SchemeReadError('unexpected end of input after #;', 'datum comment');
        }
        readFromTokens(tokens, state); // Read and discard next datum
        if (tokens.length === 0) return undefined;
        return readFromTokens(tokens, state); // Return the datum after that
    }

    // Handle fused tokens like #1=100
    if (token.includes('=') && /^#\d+=/.test(token)) {
        const match = token.match(/^(#\d+=)(.*)/);
        if (match) {
            const labelToken = match[1];
            let remainder = match[2];

            const id = parseInt(labelToken.slice(1, -1), 10);

            // Create placeholder and register it
            const placeholder = new Placeholder(id);
            state.labels.set(id, placeholder);

            let val;
            if (remainder) {
                // Check if remainder was split from a delimiter (e.g. #0=#( -> remainder=#, next=( )
                if (remainder === '#' && tokens.length > 0 && tokens[0].value === '(') {
                    remainder = '#(';
                    tokens.shift();
                } else if (remainder === '#u8' && tokens.length > 0 && tokens[0].value === '(') {
                    remainder = '#u8(';
                    tokens.shift();
                }

                tokens.unshift({ value: remainder, hasPrecedingSpace: false });
                val = readFromTokens(tokens, state);
            } else {
                // No remainder, read next token
                val = readFromTokens(tokens, state);
            }

            placeholder.value = val;
            placeholder.resolved = true;
            return handleDotAccess(val, tokens);
        }
    }

    // Handle #n= standalone token
    if (/^#\d+=$/.test(token)) {
        const id = parseInt(token.slice(1, -1), 10);
        const placeholder = new Placeholder(id);
        state.labels.set(id, placeholder);

        const val = readFromTokens(tokens, state);
        placeholder.value = val;
        placeholder.resolved = true;
        return handleDotAccess(val, tokens);
    }

    // Handle #n# reference
    if (/^#\d+#$/.test(token)) {
        const id = parseInt(token.slice(1, -1), 10);
        const placeholder = state.labels.get(id);
        if (!placeholder) {
            throw new SchemeReadError(`reference to undefined label #${id}#`, 'datum label');
        }
        return handleDotAccess(placeholder, tokens);
    }

    let result;
    if (token === '(') {
        result = readList(tokens, state);
    } else if (token === '#(') {
        result = readVector(tokens, state);
    } else if (token === '#u8(') {
        result = readBytevector(tokens);
    } else if (token === '#{') {
        result = readJSObjectLiteral(tokens, state);
    } else if (token === ')') {
        throw new SchemeReadError("unexpected ')' - unbalanced parentheses", 'list');
    } else if (token === '}') {
        throw new SchemeReadError("unexpected '}' - unbalanced braces", 'object literal');
    } else if (token === "'") {
        // Quotes
        result = list(intern('quote'), readFromTokens(tokens, state));
    } else if (token === '`') {
        result = list(intern('quasiquote'), readFromTokens(tokens, state));
    } else if (token === ',') {
        result = list(intern('unquote'), readFromTokens(tokens, state));
    } else if (token === ',@') {
        result = list(intern('unquote-splicing'), readFromTokens(tokens, state));
    } else if (token.startsWith('|') && token.endsWith('|')) {
        // Vertical bar delimited symbol |...|
        const inner = token.slice(1, -1);
        const name = processSymbolEscapes(inner);
        result = intern(name);
    } else {
        result = readAtom(token, state.caseFold);
    }

    return handleDotAccess(result, tokens);
}

/**
 * Reads a proper or improper list.
 * @param {Array} tokens
 * @param {Object} state
 * @returns {Cons|null}
 */
function readList(tokens, state) {
    const listItems = [];
    while (true) {
        if (tokens.length === 0) {
            throw new SchemeReadError("missing ')'", 'list');
        }
        if (tokens[0].value === ')') break;

        // Handle datum comment inside list
        if (tokens[0].value === '#;') {
            tokens.shift(); // consume #;
            if (tokens.length === 0) throw new SchemeReadError('unexpected end of input', 'datum comment');

            // Can't use datum comment on syntactic markers
            if (tokens[0].value === '.') {
                throw new SchemeReadError("cannot comment out '.' in dotted notation", 'datum comment');
            }
            if (tokens[0].value === ')') {
                throw new SchemeReadError('no datum following #;', 'datum comment');
            }
            readFromTokens(tokens, state); // discard next datum
            continue;
        }
        if (tokens[0].value === '.') {
            // R7RS: dotted list must have at least one element before the dot
            if (listItems.length === 0) {
                throw new SchemeReadError("illegal use of '.' - no elements before dot", 'dotted list');
            }
            tokens.shift(); // consume '.'
            // Handle datum comment after dot
            while (tokens.length > 0 && tokens[0].value === '#;') {
                tokens.shift();
                readFromTokens(tokens, state);
            }
            // Ensure there's actually a datum after the dot
            if (tokens.length === 0 || tokens[0].value === ')') {
                throw new SchemeReadError("illegal use of '.' - no datum after dot", 'dotted list');
            }
            const tail = readFromTokens(tokens, state);
            // Skip any datum comments before closing paren
            while (tokens.length > 0 && tokens[0].value === '#;') {
                tokens.shift();
                readFromTokens(tokens, state);
            }
            if (tokens.length === 0 || tokens.shift().value !== ')') {
                throw new SchemeReadError("expected ')' after improper list tail", 'dotted list');
            }
            // Build improper list
            let result = tail;
            for (let i = listItems.length - 1; i >= 0; i--) {
                result = cons(listItems[i], result);
            }
            return result;
        }
        listItems.push(readFromTokens(tokens, state));
    }
    tokens.shift(); // consume ')'

    // Build proper list
    return list(...listItems);
}

/**
 * Reads a vector #(...)
 * @param {Array} tokens
 * @param {Object} state
 * @returns {Array}
 */
function readVector(tokens, state) {
    const elements = [];
    while (true) {
        if (tokens.length === 0) {
            throw new SchemeReadError("missing ')'", 'vector');
        }
        if (tokens[0].value === ')') break;
        elements.push(readFromTokens(tokens, state));
    }
    tokens.shift(); // consume ')'
    return elements; // Return raw JS array
}

/**
 * Reads a JS object literal #{(key val) ...}
 * @param {Object[]} tokens - Token array
 * @param {Object} state - Reader state
 * @returns {Cons} S-expression representing the js-obj call
 */
function readJSObjectLiteral(tokens, state) {
    const entries = [];

    while (tokens.length > 0 && tokens[0].value !== '}') {
        // Each entry must be a list (key val) or (... obj)
        if (tokens[0].value !== '(') {
            throw new SchemeReadError(`expected '(' for property entry, got '${tokens[0].value}'`, 'object literal');
        }

        // Read the entry as a list
        tokens.shift(); // consume '('
        const entryItems = [];
        while (tokens.length > 0 && tokens[0].value !== ')') {
            entryItems.push(readFromTokens(tokens, state));
        }
        if (tokens.length === 0) {
            throw new SchemeReadError("missing ')' in property entry", 'object literal');
        }
        tokens.shift(); // consume ')'

        // Check for spread syntax: (... obj)
        if (entryItems.length >= 1 &&
            entryItems[0] instanceof Symbol$1 &&
            entryItems[0].name === '...') {
            if (entryItems.length !== 2) {
                throw new SchemeReadError('spread syntax (... obj) requires exactly one object', 'object literal');
            }
            // Mark as spread entry
            entries.push({ spread: true, value: entryItems[1] });
        } else if (entryItems.length === 2) {
            // Normal (key val) entry
            entries.push({ spread: false, key: entryItems[0], value: entryItems[1] });
        } else {
            throw new SchemeReadError(`property entry must be (key value) or (... obj), got ${entryItems.length} elements`, 'object literal');
        }
    }

    if (tokens.length === 0) {
        throw new SchemeReadError("missing '}'", 'object literal');
    }
    tokens.shift(); // consume '}'

    // Build the (js-obj ...) or (js-obj-merge ...) expression
    const hasSpread = entries.some(e => e.spread);

    if (hasSpread) {
        // Use special merge form
        const parts = [];
        let currentPairs = [];

        for (const entry of entries) {
            if (entry.spread) {
                // Flush any pending pairs
                if (currentPairs.length > 0) {
                    parts.push(list(intern('js-obj'), ...currentPairs));
                    currentPairs = [];
                }
                // Add spread object directly
                parts.push(entry.value);
            } else {
                // Accumulate key-value pair
                const key = (entry.key instanceof Symbol$1)
                    ? list(intern('quote'), entry.key)
                    : entry.key;
                currentPairs.push(key, entry.value);
            }
        }

        // Flush remaining pairs
        if (currentPairs.length > 0) {
            parts.push(list(intern('js-obj'), ...currentPairs));
        }

        // Return (js-obj-merge part1 part2 ...)
        return list(intern('js-obj-merge'), ...parts);
    } else {
        // Simple case: (js-obj k1 v1 k2 v2 ...)
        const args = [];
        for (const entry of entries) {
            const key = (entry.key instanceof Symbol$1)
                ? list(intern('quote'), entry.key)
                : entry.key;
            args.push(key, entry.value);
        }
        return list(intern('js-obj'), ...args);
    }
}

/**
 * Reads a bytevector literal #u8(...)
 * @param {Object[]} tokens - Token array
 * @returns {Uint8Array}
 */
function readBytevector(tokens) {
    const bytes = [];
    while (true) {
        if (tokens.length === 0) {
            throw new SchemeReadError("missing ')'", 'bytevector');
        }
        if (tokens[0].value === ')') break;

        const tokenObj = tokens.shift();
        const num = parseInt(tokenObj.value, 10);
        if (isNaN(num) || num < 0 || num > 255) {
            throw new SchemeReadError(`invalid byte value: ${tokenObj.value}`, 'bytevector');
        }
        bytes.push(num);
    }
    tokens.shift(); // consume ')'
    return new Uint8Array(bytes);
}

/**
 * Reads an atom (number, boolean, string, character, or symbol).
 * @param {string} token
 * @param {boolean} caseFold
 * @returns {*}
 */
function readAtom(token, caseFold = false) {
    // Try to parse as a number (including rationals and complex)
    const numResult = parseNumber(token);
    if (numResult !== null) {
        return numResult;
    }

    // Special numbers (case-insensitive)
    const lowerToken = token.toLowerCase();
    if (lowerToken === '+nan.0' || lowerToken === '-nan.0') return NaN;
    if (lowerToken === '+inf.0') return Infinity;
    if (lowerToken === '-inf.0') return -Infinity;

    // Booleans (R7RS: #t, #f, #true, #false)
    if (token === '#t' || token === '#true') return true;
    if (token === '#f' || token === '#false') return false;

    // Character literals (#\a, #\newline, #\x41, etc.)
    if (token.startsWith('#\\')) {
        return readCharacter(token.slice(2));
    }

    // Strings (not case-folded) - handle R7RS escape sequences
    if (token.startsWith('"')) {
        if (token.length < 2 || !token.endsWith('"')) {
            throw new SchemeReadError('unterminated string', 'string');
        }
        return processStringEscapes(token.slice(1, -1));
    }

    // Symbols - apply case folding if enabled
    const symbolName = caseFold ? token.toLowerCase() : token;

    // R7RS: The identifier consisting of a single dot is used only in pairs
    if (symbolName === '.') {
        throw new SchemeReadError("unexpected '.'", 'symbol');
    }

    // JS Property Access: obj.prop1.prop2 -> (js-ref (js-ref obj "prop1") "prop2")
    if (symbolName.includes('.') && !symbolName.startsWith('.') && !symbolName.endsWith('.')) {
        const parts = symbolName.split('.');
        // Ensure all parts are non-empty (no consecutive dots)
        if (parts.every(part => part.length > 0)) {
            return buildPropertyAccessForm(parts);
        }
    }

    return intern(symbolName);
}

/**
 * @fileoverview Reader module barrel export.
 * Provides the main parse() entry point and re-exports submodules.
 */


/**
 * Parses a string of Scheme code into a list of S-expressions.
 * @param {string} input - Source code to parse
 * @param {Object} [options] - Parsing options
 * @param {boolean} [options.caseFold=false] - If true, fold symbol names to lowercase (for include-ci)
 * @returns {Array} Array of S-expressions (Cons, Symbol, number, etc.)
 */
function parse(input, options = {}) {
    // State object for parsing context
    // Use provided state or create new one
    const state = options.state || {
        caseFold: options.caseFold || false,
        labels: new Map()
    };

    // Strip block comments before tokenizing
    const preprocessed = stripBlockComments(input);
    const tokens = tokenize(preprocessed);
    const expressions = [];

    try {
        while (tokens.length > 0) {
            const expr = readFromTokens(tokens, state);
            // If the expression is a Placeholder, it means top-level #n# (unlikely but possible)
            // or #n=... which returns the value. 
            // We need to run fixup on the result to resolve internal cycles.
            expressions.push(fixup(expr));
        }
    } catch (e) {
        if (!options.suppressLog) {
            console.error(`Parse error in input: "${input.substring(0, 100)}${input.length > 100 ? '...' : ''}"`);
        }
        throw e;
    }
    return expressions;
}

/**
 * Reads and parses a single S-expression from port.
 * @param {Port} port - Input port.
 * @returns {*} Parsed S-expression or EOF.
 */
function readExpressionFromPort(port) {
    // Initialize or retrieve persistent reader state for this port
    // This ensures directives like #!fold-case persist across calls
    if (!port._readerState) {
        port._readerState = {
            caseFold: false,
            labels: new Map()
        };
    }

    let buffer = '';

    while (true) {
        let hitEOF = false;
        let parenDepth = 0;
        let inString = false;
        let inVerticalBar = false;
        let escaped = false;
        let started = false;

        // Collect one "chunk" of input (atom or balanced expression)
        // Note: we don't clear buffer here because we might be retrying after a partial read
        while (true) {
            // PEEK first to check for delimiters if we are in an atom
            const next = port.peekChar();

            if (next === EOF_OBJECT) {
                hitEOF = true;
                if (started || buffer.length > 0) {
                    // We have content to process
                    break;
                }
                return EOF_OBJECT;
            }

            // Check for atom delimiters when we are reading a top-level atom
            // Delimiters: whitespace, (, ), ", ;
            if (started && parenDepth === 0 && !inString && !inVerticalBar) {
                if (/\s/.test(next) ||
                    next === '(' || next === ')' ||
                    next === '"' || next === ';') {
                    break;
                }
            }

            // Now consume the character
            const ch = port.readChar();

            // Handle comments: skip until newline
            // But only if we are not inside string/symbol
            // Special case: #; is a datum comment, not a line comment.
            // If buffer ends with #, then ; is part of #; token.
            if (ch === ';' && !inString && !inVerticalBar && !buffer.endsWith('#')) {
                while (true) {
                    const nextCh = port.peekChar();
                    if (nextCh === EOF_OBJECT || nextCh === '\n' || nextCh === '\r') {
                        break;
                    }
                    port.readChar();
                }

                // If we haven't started an atom/expr, we just skipped whitespace/comment.
                // Loop continues.
                // If we HAD started (e.g. invalid state?), we would have broken above at delimiter check.
                continue;
            }

            buffer += ch;

            // Track escape state for strings and |...| symbols
            if (escaped) {
                escaped = false;
                continue;
            } else if (ch === '\\' && (inString || inVerticalBar)) {
                escaped = true;
                continue;
            }

            // Track vertical bar symbol state
            if (ch === '|' && !inString) {
                inVerticalBar = !inVerticalBar;
                started = true;
                if (!inVerticalBar && parenDepth === 0) {
                    // Finished |...| symbol at top level
                    break;
                }
                continue;
            }

            // Skip content inside |...| symbols
            if (inVerticalBar) {
                continue;
            }

            // Track string state
            if (ch === '"') {
                inString = !inString;
                started = true;
                if (!inString && parenDepth === 0) {
                    // Finished string at top level
                    break;
                }
            } else if (!inString) {
                if (ch === '(') {
                    parenDepth++;
                    started = true;
                } else if (ch === ')') {
                    parenDepth--;
                    if (parenDepth <= 0 && started) {
                        break;
                    }
                } else if (ch === '#') {
                    // Check what follows the #
                    const n = port.peekChar();

                    if (n === '(') {
                        // Vector start: #(
                        port.readChar();
                        buffer += '(';
                        parenDepth++;
                        started = true;
                    } else if (n === 'u' || n === 'U') {
                        // Possibly #u8( bytevector
                        port.readChar(); // Consume 'u'
                        const ch2 = port.peekChar();
                        if (ch2 === '8') {
                            port.readChar(); // Consume '8'
                            const ch3 = port.peekChar();
                            if (ch3 === '(') {
                                port.readChar(); // Consume '('
                                buffer += 'u8(';
                                parenDepth++;
                                started = true;
                            } else {
                                buffer += 'u8'; // 'u8' then loop continues
                            }
                        } else {
                            buffer += 'u'; // 'u' + something else (next iter reads ch2)
                        }
                    }
                } else if (!started && !/\s/.test(ch)) {
                    // Started a hidden atom (symbol, number, etc)
                    started = true;
                } else if (started && parenDepth === 0 && /\s/.test(ch)) {
                    // Ended an atom at top level (Should be caught by peek check above)
                    break;
                }
            }
        }

        if (buffer.trim() === '') {
            return EOF_OBJECT;
        }

        try {
            // Pass the persistent state
            const result = parse(buffer, {
                suppressLog: true,
                state: port._readerState
            });

            if (result.length > 0) {
                // If the result is undefined (e.g. from #!fold-case which returns nothing),
                // we should loop again to read the next thing!

                if (result[0] === undefined) {
                    // E.g. found a directive or comment that returned no value
                    buffer = ''; // Clear buffer for next read
                    continue;
                }

                return result[0];
            }
            // If result is empty (comment/whitespace/directive handled by parse), loop.
            buffer = ''; // Clear buffer for next read
            continue;
        } catch (e) {
            // Check for "unexpected end of input" to retry reading more
            if (e.message && e.message.includes('unexpected end of input')) {
                if (hitEOF) {
                    throw e; // Cannot read more input, so this is a real error
                }
                // We need more input. Keep buffer and continue reading next chunk.
                continue;
            }
            // For debugging: warn if we're rethrowing an unexpected end error that didn't match
            // console.warn('Reader bridge rethrowing:', e.message);
            throw e;
        }
    }
}

// ============================================================================
// Current Ports (Global State)
// ============================================================================

// Default ports - console-based
let currentInputPort = null;  // We'll use a placeholder for input
let currentOutputPort = new ConsoleOutputPort('stdout');
let currentErrorPort = new ConsoleOutputPort('stderr');

// ============================================================================
// I/O Primitives
// ============================================================================

/**
 * I/O primitives exported to Scheme.
 */
const ioPrimitives = {
    // --------------------------------------------------------------------------
    // Port Predicates
    // --------------------------------------------------------------------------

    'port?': (obj) => isPort(obj),
    'input-port?': (obj) => isInputPort(obj),
    'output-port?': (obj) => isOutputPort(obj),
    'textual-port?': (obj) => isPort(obj) && obj.isTextual,
    'binary-port?': (obj) => isPort(obj) && obj.isBinary,

    'input-port-open?': (port) => {
        if (!isInputPort(port)) throw new Error('input-port-open?: expected input port');
        return port.isOpen;
    },

    'output-port-open?': (port) => {
        if (!isOutputPort(port)) throw new Error('output-port-open?: expected output port');
        return port.isOpen;
    },

    // --------------------------------------------------------------------------
    // Current Ports
    // --------------------------------------------------------------------------

    'current-input-port': () => {
        if (!currentInputPort) {
            // Create a dummy input port that returns EOF
            currentInputPort = new StringInputPort('');
        }
        return currentInputPort;
    },

    'current-output-port': () => currentOutputPort,
    'current-error-port': () => currentErrorPort,

    // --------------------------------------------------------------------------
    // String Ports
    // --------------------------------------------------------------------------

    'open-input-string': (str) => {
        if (typeof str !== 'string') throw new Error('open-input-string: expected string');
        return new StringInputPort(str);
    },

    'open-output-string': () => new StringOutputPort(),

    'get-output-string': (port) => {
        if (!(port instanceof StringOutputPort)) throw new Error('get-output-string: expected string output port');
        return port.getString();
    },

    // --------------------------------------------------------------------------
    // Bytevector Ports (Binary I/O)
    // --------------------------------------------------------------------------

    'open-input-bytevector': (bv) => {
        if (!(bv instanceof Uint8Array)) throw new Error('open-input-bytevector: expected bytevector');
        return new BytevectorInputPort(bv);
    },

    'open-output-bytevector': () => new BytevectorOutputPort(),

    'get-output-bytevector': (port) => {
        if (!(port instanceof BytevectorOutputPort)) throw new Error('get-output-bytevector: expected bytevector output port');
        return port.getBytevector();
    },

    // --------------------------------------------------------------------------
    // File Ports
    // --------------------------------------------------------------------------

    'open-input-file': (filename) => {
        if (typeof filename !== 'string') throw new Error('open-input-file: expected string');
        return new FileInputPort(filename);
    },

    'open-output-file': (filename) => {
        if (typeof filename !== 'string') throw new Error('open-output-file: expected string');
        return new FileOutputPort(filename);
    },

    'file-exists?': (filename) => {
        if (typeof filename !== 'string') throw new Error('file-exists?: expected string');
        return fileExists(filename);
    },

    'delete-file': (filename) => {
        if (typeof filename !== 'string') throw new Error('delete-file: expected string');
        deleteFile(filename);
        return undefined;
    },

    'call-with-input-file': (filename, proc) => {
        if (typeof filename !== 'string') throw new Error('call-with-input-file: expected string');
        if (typeof proc !== 'function') throw new Error('call-with-input-file: expected procedure');
        const port = new FileInputPort(filename);
        try {
            return proc(port);
        } finally {
            if (port.isOpen) port.close();
        }
    },

    'call-with-output-file': (filename, proc) => {
        if (typeof filename !== 'string') throw new Error('call-with-output-file: expected string');
        if (typeof proc !== 'function') throw new Error('call-with-output-file: expected procedure');
        const port = new FileOutputPort(filename);
        try {
            return proc(port);
        } finally {
            if (port.isOpen) port.close();
        }
    },

    'with-input-from-file': (filename, thunk) => {
        if (typeof filename !== 'string') throw new Error('with-input-from-file: expected string');
        if (typeof thunk !== 'function') throw new Error('with-input-from-file: expected procedure');
        const port = new FileInputPort(filename);
        const old = currentInputPort;
        currentInputPort = port;
        try {
            return thunk();
        } finally {
            currentInputPort = old;
            if (port.isOpen) port.close();
        }
    },

    'with-output-to-file': (filename, thunk) => {
        if (typeof filename !== 'string') throw new Error('with-output-to-file: expected string');
        if (typeof thunk !== 'function') throw new Error('with-output-to-file: expected procedure');
        const port = new FileOutputPort(filename);
        const old = currentOutputPort;
        currentOutputPort = port;
        try {
            return thunk();
        } finally {
            currentOutputPort = old;
            if (port.isOpen) port.close();
        }
    },

    'features': () => {
        return list(
            intern('r7rs'),
            intern('ieee-float'),
            intern('full-unicode'),
            intern('scheme-js')
        );
    },

    // --------------------------------------------------------------------------
    // EOF
    // --------------------------------------------------------------------------

    'eof-object': () => EOF_OBJECT,
    'eof-object?': (obj) => obj === EOF_OBJECT,

    // --------------------------------------------------------------------------
    // Input Operations
    // --------------------------------------------------------------------------

    'read-char': (...args) => {
        const port = args.length > 0 ? args[0] : ioPrimitives['current-input-port']();
        requireOpenInputPort(port, 'read-char');
        if (port.readChar) return port.readChar();
        throw new Error('read-char: unsupported port type');
    },

    'peek-char': (...args) => {
        const port = args.length > 0 ? args[0] : ioPrimitives['current-input-port']();
        requireOpenInputPort(port, 'peek-char');
        if (port.peekChar) return port.peekChar();
        throw new Error('peek-char: unsupported port type');
    },

    'char-ready?': (...args) => {
        const port = args.length > 0 ? args[0] : ioPrimitives['current-input-port']();
        if (!isInputPort(port)) throw new Error('char-ready?: expected input port');
        if (!port.isOpen) return false;
        if (port.charReady) return port.charReady();
        return false;
    },

    'read-line': (...args) => {
        const port = args.length > 0 ? args[0] : ioPrimitives['current-input-port']();
        requireOpenInputPort(port, 'read-line');
        if (port.readLine) return port.readLine();
        throw new Error('read-line: unsupported port type');
    },

    'read-string': (k, ...args) => {
        if (typeof k !== 'number' || !Number.isInteger(k) || k < 0) throw new Error('read-string: expected non-negative integer');
        const port = args.length > 0 ? args[0] : ioPrimitives['current-input-port']();
        requireOpenInputPort(port, 'read-string');
        if (port.readString) return port.readString(k);
        throw new Error('read-string: unsupported port type');
    },

    // --------------------------------------------------------------------------
    // Binary Input
    // --------------------------------------------------------------------------

    'read-u8': (...args) => {
        const port = args.length > 0 ? args[0] : ioPrimitives['current-input-port']();
        requireOpenInputPort(port, 'read-u8');
        if (port.readU8) return port.readU8();
        throw new Error('read-u8: expected binary input port');
    },

    'peek-u8': (...args) => {
        const port = args.length > 0 ? args[0] : ioPrimitives['current-input-port']();
        requireOpenInputPort(port, 'peek-u8');
        if (port.peekU8) return port.peekU8();
        throw new Error('peek-u8: expected binary input port');
    },

    'u8-ready?': (...args) => {
        const port = args.length > 0 ? args[0] : ioPrimitives['current-input-port']();
        if (!isInputPort(port)) throw new Error('u8-ready?: expected input port');
        if (!port.isOpen) return false;
        if (port.u8Ready) return port.u8Ready();
        return false;
    },

    'read-bytevector': (k, ...args) => {
        if (typeof k !== 'number' || !Number.isInteger(k) || k < 0) throw new Error('read-bytevector: expected non-negative integer');
        const port = args.length > 0 ? args[0] : ioPrimitives['current-input-port']();
        requireOpenInputPort(port, 'read-bytevector');
        if (port.readBytevector) return port.readBytevector(k);
        throw new Error('read-bytevector: expected binary input port');
    },

    // --------------------------------------------------------------------------
    // Output Operations
    // --------------------------------------------------------------------------

    'write-char': (char, ...args) => {
        if (typeof char !== 'string' || char.length !== 1) throw new Error('write-char: expected character');
        const port = args.length > 0 ? args[0] : currentOutputPort;
        requireOpenOutputPort(port, 'write-char');
        port.writeChar(char);
        return undefined;
    },

    'write-string': (str, ...args) => {
        if (typeof str !== 'string') throw new Error('write-string: expected string');
        let port = currentOutputPort;
        let start = 0;
        let end = str.length;

        if (args.length >= 1 && isOutputPort(args[0])) {
            port = args[0];
            if (args.length >= 2) start = args[1];
            if (args.length >= 3) end = args[2];
        } else if (args.length >= 1) {
            start = args[0];
            if (args.length >= 2) end = args[1];
        }

        requireOpenOutputPort(port, 'write-string');
        port.writeString(str, start, end);
        return undefined;
    },

    // --------------------------------------------------------------------------
    // Binary Output
    // --------------------------------------------------------------------------

    'write-u8': (byte, ...args) => {
        if (!Number.isInteger(byte) || byte < 0 || byte > 255) throw new Error('write-u8: expected byte (0-255)');
        const port = args.length > 0 ? args[0] : currentOutputPort;
        requireOpenOutputPort(port, 'write-u8');
        if (port.writeU8) {
            port.writeU8(byte);
            return undefined;
        }
        throw new Error('write-u8: expected binary output port');
    },

    'write-bytevector': (bv, ...args) => {
        if (!(bv instanceof Uint8Array)) throw new Error('write-bytevector: expected bytevector');
        let port = currentOutputPort;
        let start = 0;
        let end = bv.length;

        if (args.length >= 1 && isOutputPort(args[0])) {
            port = args[0];
            if (args.length >= 2) start = args[1];
            if (args.length >= 3) end = args[2];
        } else if (args.length >= 1) {
            start = args[0];
            if (args.length >= 2) end = args[1];
        }

        requireOpenOutputPort(port, 'write-bytevector');
        if (port.writeBytevector) {
            port.writeBytevector(bv, start, end);
            return undefined;
        }
        throw new Error('write-bytevector: expected binary output port');
    },

    'newline': (...args) => {
        const port = args.length > 0 ? args[0] : currentOutputPort;
        requireOpenOutputPort(port, 'newline');
        port.writeChar('\n');
        return undefined;
    },

    'display': (val, ...args) => {
        const port = args.length > 0 ? args[0] : currentOutputPort;
        requireOpenOutputPort(port, 'display');
        const str = displayString(val);
        port.writeString(str);
        return undefined;
    },

    'write': (val, ...args) => {
        const port = args.length > 0 ? args[0] : currentOutputPort;
        requireOpenOutputPort(port, 'write');
        const str = writeString(val);
        port.writeString(str);
        return undefined;
    },

    'write-simple': (val, ...args) => {
        const port = args.length > 0 ? args[0] : currentOutputPort;
        requireOpenOutputPort(port, 'write-simple');
        const str = writeString(val);
        port.writeString(str);
        return undefined;
    },

    'write-shared': (val, ...args) => {
        const port = args.length > 0 ? args[0] : currentOutputPort;
        requireOpenOutputPort(port, 'write-shared');
        const str = writeStringShared(val);
        port.writeString(str);
        return undefined;
    },

    // --------------------------------------------------------------------------
    // Port Control
    // --------------------------------------------------------------------------

    'close-port': (port) => {
        if (!isPort(port)) throw new Error('close-port: expected port');
        port.close();
        return undefined;
    },

    'close-input-port': (port) => {
        if (!isInputPort(port)) throw new Error('close-input-port: expected input port');
        port.close();
        return undefined;
    },

    'close-output-port': (port) => {
        if (!isOutputPort(port)) throw new Error('close-output-port: expected output port');
        port.close();
        return undefined;
    },

    'flush-output-port': (...args) => {
        const port = args.length > 0 ? args[0] : currentOutputPort;
        if (!isOutputPort(port)) throw new Error('flush-output-port: expected output port');
        if (port.flush) port.flush();
        return undefined;
    },

    // --------------------------------------------------------------------------
    // Read
    // --------------------------------------------------------------------------

    'read': (...args) => {
        const port = args.length > 0 ? args[0] : ioPrimitives['current-input-port']();
        requireOpenInputPort(port, 'read');
        return readExpressionFromPort(port);
    }
};

/**
 * List Primitives for Scheme.
 * 
 * Provides basic pair and list operations for the Scheme runtime.
 * Implements R7RS §6.4 list procedures.
 * 
 * NOTE: Only primitives that REQUIRE JavaScript are implemented here.
 * Higher-level list procedures are in core.scm.
 */


// =============================================================================
// List Primitives (JavaScript-required)
// =============================================================================

/**
 * List primitives exported to Scheme.
 */
const listPrimitives = {
    /**
     * Constructs a pair.
     * @param {*} a - Car element.
     * @param {*} d - Cdr element.
     * @returns {Cons} New pair.
     */
    'cons': cons,

    /**
     * Returns the car of a pair.
     * @param {Cons} p - A pair.
     * @returns {*} The car element.
     */
    'car': (p) => {
        assertPair('car', 1, p);
        return p.car;
    },

    /**
     * Returns the cdr of a pair.
     * @param {Cons} p - A pair.
     * @returns {*} The cdr element.
     */
    'cdr': (p) => {
        assertPair('cdr', 1, p);
        return p.cdr;
    },

    /**
     * Constructs a list from arguments.
     */
    'list': list,

    // =========================================================================
    // Type Predicates (require JavaScript instanceof)
    // =========================================================================

    /**
     * Pair type predicate.
     * @param {*} p - Value to check.
     * @returns {boolean} True if p is a pair.
     */
    'pair?': (p) => p instanceof Cons,

    /**
     * Null check.
     * @param {*} p - Value to check.
     * @returns {boolean} True if p is null (empty list).
     */
    'null?': (p) => p === null,

    /**
     * List type predicate.
     * @param {*} p - Value to check.
     * @returns {boolean} True if p is a proper list.
     */
    'list?': (p) => isList(p),

    // =========================================================================
    // Mutators (require direct object mutation)
    // =========================================================================

    /**
     * Mutates the car of a pair.
     * @param {Cons} p - A pair.
     * @param {*} val - New value for car.
     * @returns {null} Unspecified.
     */
    'set-car!': (p, val) => {
        assertPair('set-car!', 1, p);
        p.car = val;
        return null; // R7RS: unspecified
    },

    /**
     * Mutates the cdr of a pair.
     * @param {Cons} p - A pair.
     * @param {*} val - New value for cdr.
     * @returns {null} Unspecified.
     */
    'set-cdr!': (p, val) => {
        assertPair('set-cdr!', 1, p);
        p.cdr = val;
        return null; // R7RS: unspecified
    },

    /**
     * Appends lists together.
     * @param {...*} args - Lists to append (last can be any value).
     * @returns {*} The concatenated list.
     */
    'append': (...args) => {
        if (args.length === 0) return null;
        if (args.length === 1) return args[0];

        // Append all but last, then attach last
        let result = args[args.length - 1];

        for (let i = args.length - 2; i >= 0; i--) {
            const lst = args[i];
            result = appendTwo(lst, result, i + 1);
        }
        return result;
    }
};

/**
 * Appends two lists (helper for n-ary append).
 * @param {Cons|null} list1 - First list (must be proper).
 * @param {*} list2 - Second list (can be improper tail).
 * @param {number} argPos - Argument position for error reporting.
 * @returns {Cons|*} The concatenated list.
 * @throws {SchemeTypeError} If list1 is not a proper list.
 */
function appendTwo(list1, list2, argPos) {
    if (list1 === null) return list2;
    if (!(list1 instanceof Cons)) {
        throw new SchemeTypeError('append', argPos, 'list', list1);
    }
    return new Cons(list1.car, appendTwo(list1.cdr, list2, argPos));
}

// Mark primitives that should receive raw Scheme objects (no JS bridge wrapping)
listPrimitives['cons'].skipBridge = true;
listPrimitives['car'].skipBridge = true;
listPrimitives['cdr'].skipBridge = true;
listPrimitives['set-car!'].skipBridge = true;
listPrimitives['set-cdr!'].skipBridge = true;
listPrimitives['list'].skipBridge = true;
listPrimitives['append'].skipBridge = true;

/**
 * Vector Primitives for Scheme.
 * 
 * Provides vector (array) operations per R7RS §6.8.
 */


// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Validates and returns start/end range for vector operations.
 * @param {string} procName - Procedure name
 * @param {Array} vec - The vector
 * @param {number|undefined} start - Start index (default 0)
 * @param {number|undefined} end - End index (default vec.length)
 * @returns {[number, number]} Validated [start, end]
 */
function validateRange$2(procName, vec, start, end) {
    const s = start === undefined ? 0 : start;
    const e = end === undefined ? vec.length : end;

    if (!Number.isInteger(s) || s < 0 || s > vec.length) {
        throw new SchemeRangeError(procName, 'start', 0, vec.length, s);
    }
    if (!Number.isInteger(e) || e < s || e > vec.length) {
        throw new SchemeRangeError(procName, 'end', s, vec.length, e);
    }
    return [s, e];
}

// =============================================================================
// Vector Primitives
// =============================================================================

/**
 * Vector primitives exported to Scheme.
 */
const vectorPrimitives = {
    // -------------------------------------------------------------------------
    // Constructors
    // -------------------------------------------------------------------------

    /**
     * Creates a vector from arguments.
     * @param {...*} args - Elements of the vector.
     * @returns {Array} New vector.
     */
    'vector': (...args) => args,

    /**
     * Creates a vector of specified size.
     * @param {number} k - Size of vector.
     * @param {*} [fill] - Fill value.
     * @returns {Array} New vector.
     */
    'make-vector': (k, fill) => {
        assertInteger('make-vector', 1, k);
        if (k < 0) {
            throw new SchemeRangeError('make-vector', 'size', 0, Infinity, k);
        }
        return new Array(k).fill(fill);
    },

    // -------------------------------------------------------------------------
    // Type Predicate
    // -------------------------------------------------------------------------

    /**
     * Vector type predicate.
     * @param {*} obj - Value to check.
     * @returns {boolean} True if obj is a vector.
     */
    'vector?': (obj) => Array.isArray(obj),

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Returns the length of a vector.
     * @param {Array} vec - A vector.
     * @returns {number} Length.
     */
    'vector-length': (vec) => {
        assertVector('vector-length', 1, vec);
        return vec.length;
    },

    /**
     * Returns element at index.
     * @param {Array} vec - A vector.
     * @param {number} k - Index.
     * @returns {*} Element at index.
     */
    'vector-ref': (vec, k) => {
        assertVector('vector-ref', 1, vec);
        assertIndex('vector-ref', k, vec.length);
        return vec[k];
    },

    /**
     * Sets element at index.
     * @param {Array} vec - A vector.
     * @param {number} k - Index.
     * @param {*} obj - New value.
     * @returns {null} Unspecified.
     */
    'vector-set!': (vec, k, obj) => {
        assertVector('vector-set!', 1, vec);
        assertIndex('vector-set!', k, vec.length);
        vec[k] = obj;
        return null;
    },

    // -------------------------------------------------------------------------
    // Mutation
    // -------------------------------------------------------------------------

    /**
     * Fills vector with a value (in-place).
     * @param {Array} vec - Vector to fill
     * @param {*} fill - Fill value
     * @param {number} [start] - Start index (default 0)
     * @param {number} [end] - End index (default length)
     * @returns {null} Unspecified
     */
    'vector-fill!': (vec, fill, start, end) => {
        assertVector('vector-fill!', 1, vec);
        const [s, e] = validateRange$2('vector-fill!', vec, start, end);
        for (let i = s; i < e; i++) {
            vec[i] = fill;
        }
        return null;
    },

    // -------------------------------------------------------------------------
    // Copying
    // -------------------------------------------------------------------------

    /**
     * Returns a copy of a vector.
     * @param {Array} vec - Source vector
     * @param {number} [start] - Start index (default 0)
     * @param {number} [end] - End index (default length)
     * @returns {Array} New vector
     */
    'vector-copy': (vec, start, end) => {
        assertVector('vector-copy', 1, vec);
        const [s, e] = validateRange$2('vector-copy', vec, start, end);
        return vec.slice(s, e);
    },

    /**
     * Copies elements from one vector to another (in-place).
     * @param {Array} to - Destination vector
     * @param {number} at - Destination start index
     * @param {Array} from - Source vector
     * @param {number} [start] - Source start index (default 0)
     * @param {number} [end] - Source end index (default length)
     * @returns {null} Unspecified
     */
    'vector-copy!': (to, at, from, start, end) => {
        assertVector('vector-copy!', 1, to);
        assertInteger('vector-copy!', 2, at);
        assertVector('vector-copy!', 3, from);

        if (at < 0 || at > to.length) {
            throw new SchemeRangeError('vector-copy!', 'at', 0, to.length, at);
        }

        const [s, e] = validateRange$2('vector-copy!', from, start, end);
        const count = e - s;

        if (at + count > to.length) {
            throw new SchemeRangeError('vector-copy!', 'range', 0, to.length - at, count);
        }

        // Handle overlapping copies correctly
        if (to === from && at > s && at < e) {
            // Copy backwards to avoid overwriting
            for (let i = count - 1; i >= 0; i--) {
                to[at + i] = from[s + i];
            }
        } else {
            for (let i = 0; i < count; i++) {
                to[at + i] = from[s + i];
            }
        }
        return null;
    },

    /**
     * Concatenates vectors.
     * @param {...Array} vecs - Vectors to concatenate
     * @returns {Array} New vector
     */
    'vector-append': (...vecs) => {
        vecs.forEach((v, i) => assertVector('vector-append', i + 1, v));
        return [].concat(...vecs);
    },

    // -------------------------------------------------------------------------
    // Conversion
    // -------------------------------------------------------------------------

    /**
     * Converts vector to list.
     * @param {Array} vec - A vector.
     * @param {number} [start] - Start index
     * @param {number} [end] - End index
     * @returns {Cons|null} A list.
     */
    'vector->list': (vec, start, end) => {
        assertVector('vector->list', 1, vec);
        const [s, e] = validateRange$2('vector->list', vec, start, end);
        return list(...vec.slice(s, e));
    },

    /**
     * Converts list to vector.
     * @param {Cons|null} lst - A list.
     * @returns {Array} A vector.
     */
    'list->vector': (lst) => {
        const arr = toArray(lst);
        return arr;
    },

    /**
     * Converts vector of characters to string.
     * @param {Array} vec - Vector of characters
     * @param {number} [start] - Start index
     * @param {number} [end] - End index
     * @returns {string} String
     */
    'vector->string': (vec, start, end) => {
        assertVector('vector->string', 1, vec);
        const [s, e] = validateRange$2('vector->string', vec, start, end);
        const slice = vec.slice(s, e);
        slice.forEach((c, i) => {
            if (!isChar(c)) {
                throw new SchemeError(
                    `vector->string: element ${s + i} is not a character`,
                    [c],
                    'vector->string'
                );
            }
        });
        return slice.join('');
    },

    /**
     * Converts string to vector of characters.
     * @param {string} str - String to convert
     * @param {number} [start] - Start index
     * @param {number} [end] - End index
     * @returns {Array} Vector of characters
     */
    'string->vector': (str, start, end) => {
        assertString('string->vector', 1, str);
        const s = start === undefined ? 0 : start;
        const e = end === undefined ? str.length : end;

        if (!Number.isInteger(s) || s < 0 || s > str.length) {
            throw new SchemeRangeError('string->vector', 'start', 0, str.length, s);
        }
        if (!Number.isInteger(e) || e < s || e > str.length) {
            throw new SchemeRangeError('string->vector', 'end', s, str.length, e);
        }

        return str.slice(s, e).split('');
    }
};

// Mark primitives that should receive raw Scheme objects (no JS bridge wrapping)
vectorPrimitives['vector'].skipBridge = true;
vectorPrimitives['make-vector'].skipBridge = true;
vectorPrimitives['vector-set!'].skipBridge = true;
vectorPrimitives['vector-ref'].skipBridge = true; // Returns raw object
vectorPrimitives['vector-fill!'].skipBridge = true;

/**
 * Record Primitives for Scheme.
 * 
 * Provides record type operations for R7RS define-record-type.
 */


/**
 * Record primitives exported to Scheme.
 */
const recordPrimitives = {
    /**
     * Creates a new record type.
     * @param {string} name - Name of the record type.
     * @param {Cons} fields - List of field symbols.
     * @returns {Function} The record type constructor class.
     */
    'make-record-type': (name, fields) => {
        // name may be a Symbol object from quoted symbol 'type
        const typeName = typeof name === 'string' ? name : name.name;
        const fieldNames = toArray(fields).map(s => s.name);

        // Sanitize name for use as JS class name (replace <> and other invalid chars)
        const jsClassName = typeName.replace(/[^a-zA-Z0-9_$]/g, '_');

        // Dynamically create a named class
        const classSrc = `
            return class ${jsClassName} {
                static get schemeName() { return ${JSON.stringify(typeName)}; }
                constructor(${fieldNames.join(', ')}) {
                    ${fieldNames.map(f => `this.${f} = ${f};`).join('\n')}
                }
            }
        `;

        const ClassConstructor = new Function(classSrc)();
        return ClassConstructor;
    },

    /**
     * Creates a constructor for a record type.
     * @param {Function} rtd - Record type descriptor.
     * @returns {Function} Constructor function.
     */
    'record-constructor': (rtd) => {
        const ctor = function (...args) {
            return new rtd(...args);
        };
        // Ensure instanceof works in JS if rtd is a class/constructor
        if (rtd.prototype) {
            ctor.prototype = rtd.prototype;
        }
        return ctor;
    },

    /**
     * Creates a predicate for a record type.
     * @param {Function} rtd - Record type descriptor.
     * @returns {Function} Predicate function.
     */
    'record-predicate': (rtd) => {
        return (obj) => obj instanceof rtd;
    },

    /**
     * Creates an accessor for a record field.
     * @param {Function} rtd - Record type descriptor.
     * @param {Symbol} field - Field symbol.
     * @returns {Function} Accessor function.
     */
    'record-accessor': (rtd, field) => {
        const fieldName = field.name;
        return (obj) => {
            if (!(obj instanceof rtd)) {
                throw new SchemeTypeError(`${fieldName} accessor`, 1, rtd.name, obj);
            }
            return obj[fieldName];
        };
    },

    /**
     * Creates a modifier for a record field.
     * @param {Function} rtd - Record type descriptor.
     * @param {Symbol} field - Field symbol.
     * @returns {Function} Modifier function.
     */
    'record-modifier': (rtd, field) => {
        const fieldName = field.name;
        return (obj, val) => {
            if (!(obj instanceof rtd)) {
                throw new SchemeTypeError(`${fieldName} modifier`, 1, rtd.name, obj);
            }
            obj[fieldName] = val;
        };
    }
};

/**
 * String Primitives for Scheme.
 * 
 * Provides string operations per R7RS §6.7.
 * Strings are JavaScript strings (immutable).
 */


// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Asserts all arguments are strings.
 * @param {string} procName - Procedure name for error messages
 * @param {Array} args - Arguments to check
 */
function assertAllStrings(procName, args) {
    args.forEach((arg, i) => assertString(procName, i + 1, arg));
}

/**
 * Asserts all arguments are characters.
 * @param {string} procName - Procedure name for error messages
 * @param {Array} args - Arguments to check
 */
function assertAllChars$1(procName, args) {
    args.forEach((arg, i) => assertChar(procName, i + 1, arg));
}

/**
 * Variadic string comparison helper.
 * @param {string} procName - Procedure name
 * @param {Function} compare - Comparison function (a, b) => boolean
 * @param {Array} args - String arguments
 * @returns {boolean} True if comparison holds for all adjacent pairs
 */
function compareStrings(procName, compare, args) {
    assertArity(procName, args, 2, Infinity);
    assertAllStrings(procName, args);
    for (let i = 0; i < args.length - 1; i++) {
        if (!compare(args[i], args[i + 1])) return false;
    }
    return true;
}

/**
 * Variadic case-insensitive string comparison helper.
 * @param {string} procName - Procedure name
 * @param {Function} compare - Comparison function (a, b) => boolean
 * @param {Array} args - String arguments
 * @returns {boolean} True if comparison holds for all adjacent pairs
 */
function compareCiStrings(procName, compare, args) {
    assertArity(procName, args, 2, Infinity);
    assertAllStrings(procName, args);
    for (let i = 0; i < args.length - 1; i++) {
        const a = args[i].toLowerCase();
        const b = args[i + 1].toLowerCase();
        if (!compare(a, b)) return false;
    }
    return true;
}

/**
 * Validates and returns start/end range for string operations.
 * @param {string} procName - Procedure name
 * @param {string} str - The string
 * @param {number|undefined} start - Start index (default 0)
 * @param {number|undefined} end - End index (default str.length)
 * @returns {[number, number]} Validated [start, end]
 */
function validateRange$1(procName, str, start, end) {
    const s = start === undefined ? 0 : start;
    const e = end === undefined ? str.length : end;

    if (!Number.isInteger(s) || s < 0 || s > str.length) {
        throw new SchemeRangeError(procName, 'start', 0, str.length, s);
    }
    if (!Number.isInteger(e) || e < s || e > str.length) {
        throw new SchemeRangeError(procName, 'end', s, str.length, e);
    }
    return [s, e];
}

// =============================================================================
// String Primitives
// =============================================================================

/**
 * String primitives exported to Scheme.
 */
const stringPrimitives = {
    // -------------------------------------------------------------------------
    // Type Predicate
    // -------------------------------------------------------------------------

    /**
     * String type predicate.
     * @param {*} obj - Value to check.
     * @returns {boolean} True if obj is a string.
     */
    'string?': (obj) => typeof obj === 'string',

    // -------------------------------------------------------------------------
    // Constructors
    // -------------------------------------------------------------------------

    /**
     * Creates a string of given length, optionally filled with a character.
     * @param {number} k - Length of string
     * @param {string} [char] - Fill character (default unspecified)
     * @returns {string} New string
     */
    'make-string': (k, char) => {
        assertInteger('make-string', 1, k);
        if (k < 0) {
            throw new SchemeRangeError('make-string', 'length', 0, Infinity, k);
        }
        if (char !== undefined) {
            assertChar('make-string', 2, char);
            return char.repeat(k);
        }
        // R7RS: unspecified fill, we use space
        return ' '.repeat(k);
    },

    /**
     * Creates a string from character arguments.
     * @param {...string} chars - Characters
     * @returns {string} New string
     */
    'string': (...chars) => {
        assertAllChars$1('string', chars);
        return chars.join('');
    },

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Returns the length of a string.
     * @param {string} str - String
     * @returns {number} Length
     */
    'string-length': (str) => {
        assertString('string-length', 1, str);
        return str.length;
    },

    /**
     * Returns the character at position k.
     * @param {string} str - String
     * @param {number} k - Index
     * @returns {string} Character at index
     */
    'string-ref': (str, k) => {
        assertString('string-ref', 1, str);
        assertInteger('string-ref', 2, k);
        if (k < 0 || k >= str.length) {
            throw new SchemeRangeError('string-ref', 'index', 0, str.length - 1, k);
        }
        return str[k];
    },

    /**
     * Mutation is not supported for JS string interoperability.
     * @throws {SchemeError} Always throws
     */
    'string-set!': (str, k, char) => {
        throw new SchemeError(
            'string-set!: strings are immutable in this implementation for JavaScript interoperability',
            [],
            'string-set!'
        );
    },

    // -------------------------------------------------------------------------
    // Comparison (Case-Sensitive)
    // -------------------------------------------------------------------------

    /**
     * Returns #t if all strings are equal.
     * @param {...string} strs - Strings to compare
     * @returns {boolean}
     */
    'string=?': (...args) => compareStrings('string=?', (a, b) => a === b, args),

    /**
     * Returns #t if strings are monotonically increasing.
     * @param {...string} strs - Strings to compare
     * @returns {boolean}
     */
    'string<?': (...args) => compareStrings('string<?', (a, b) => a < b, args),

    /**
     * Returns #t if strings are monotonically decreasing.
     * @param {...string} strs - Strings to compare
     * @returns {boolean}
     */
    'string>?': (...args) => compareStrings('string>?', (a, b) => a > b, args),

    /**
     * Returns #t if strings are monotonically non-decreasing.
     * @param {...string} strs - Strings to compare
     * @returns {boolean}
     */
    'string<=?': (...args) => compareStrings('string<=?', (a, b) => a <= b, args),

    /**
     * Returns #t if strings are monotonically non-increasing.
     * @param {...string} strs - Strings to compare
     * @returns {boolean}
     */
    'string>=?': (...args) => compareStrings('string>=?', (a, b) => a >= b, args),

    // -------------------------------------------------------------------------
    // Comparison (Case-Insensitive)
    // -------------------------------------------------------------------------

    /**
     * Case-insensitive string=?.
     * @param {...string} strs - Strings to compare
     * @returns {boolean}
     */
    'string-ci=?': (...args) => compareCiStrings('string-ci=?', (a, b) => a === b, args),

    /**
     * Case-insensitive string<?.
     * @param {...string} strs - Strings to compare
     * @returns {boolean}
     */
    'string-ci<?': (...args) => compareCiStrings('string-ci<?', (a, b) => a < b, args),

    /**
     * Case-insensitive string>?.
     * @param {...string} strs - Strings to compare
     * @returns {boolean}
     */
    'string-ci>?': (...args) => compareCiStrings('string-ci>?', (a, b) => a > b, args),

    /**
     * Case-insensitive string<=?.
     * @param {...string} strs - Strings to compare
     * @returns {boolean}
     */
    'string-ci<=?': (...args) => compareCiStrings('string-ci<=?', (a, b) => a <= b, args),

    /**
     * Case-insensitive string>=?.
     * @param {...string} strs - Strings to compare
     * @returns {boolean}
     */
    'string-ci>=?': (...args) => compareCiStrings('string-ci>=?', (a, b) => a >= b, args),

    // -------------------------------------------------------------------------
    // Substring and Copy
    // -------------------------------------------------------------------------

    /**
     * Extracts a substring.
     * @param {string} str - Source string
     * @param {number} start - Start index
     * @param {number} end - End index
     * @returns {string} Substring
     */
    'substring': (str, start, end) => {
        assertString('substring', 1, str);
        assertInteger('substring', 2, start);
        assertInteger('substring', 3, end);
        const [s, e] = validateRange$1('substring', str, start, end);
        return str.slice(s, e);
    },

    /**
     * Concatenates strings.
     * @param {...string} args - Strings to append.
     * @returns {string} Concatenated string.
     */
    'string-append': (...args) => {
        args.forEach((arg, i) => assertString('string-append', i + 1, arg));
        return args.join('');
    },

    /**
     * Copies a string, optionally a portion of it.
     * @param {string} str - Source string
     * @param {number} [start] - Start index (default 0)
     * @param {number} [end] - End index (default length)
     * @returns {string} Copied string
     */
    'string-copy': (str, start, end) => {
        assertString('string-copy', 1, str);
        const [s, e] = validateRange$1('string-copy', str, start, end);
        return str.slice(s, e);
    },

    /**
     * Mutation is not supported for JS string interoperability.
     * @throws {SchemeError} Always throws
     */
    'string-fill!': (str, char, start, end) => {
        throw new SchemeError(
            'string-fill!: strings are immutable in this implementation for JavaScript interoperability',
            [],
            'string-fill!'
        );
    },

    // -------------------------------------------------------------------------
    // Conversion
    // -------------------------------------------------------------------------

    /**
     * Converts string to list of characters.
     * @param {string} str - String to convert
     * @param {number} [start] - Start index
     * @param {number} [end] - End index
     * @returns {Cons|null} List of characters
     */
    'string->list': (str, start, end) => {
        assertString('string->list', 1, str);
        const [s, e] = validateRange$1('string->list', str, start, end);
        const chars = str.slice(s, e).split('');
        return list(...chars);
    },

    /**
     * Converts list of characters to string.
     * @param {Cons|null} lst - List of characters
     * @returns {string} String
     */
    'list->string': (lst) => {
        const chars = toArray(lst);
        chars.forEach((c, i) => {
            if (!isChar(c)) {
                throw new SchemeError(
                    `list->string: element ${i + 1} is not a character`,
                    [c],
                    'list->string'
                );
            }
        });
        return chars.join('');
    },

    /**
     * Converts number to string.
     * @param {number} num - Number to convert.
     * @param {number} [radix] - Radix (2, 8, 10, 16)
     * @returns {string} String representation.
     */
    'number->string': (num, radix) => {
        assertNumber('number->string', 1, num);

        // R7RS special value formatting
        if (typeof num === 'number') {
            if (num === Infinity) return '+inf.0';
            if (num === -Infinity) return '-inf.0';
            if (Number.isNaN(num)) return '+nan.0';
        }

        if (radix !== undefined) {
            assertInteger('number->string', 2, radix);
            if (![2, 8, 10, 16].includes(radix)) {
                throw new SchemeRangeError('number->string', 'radix', 2, 16, radix);
            }
            return num.toString(radix);
        }
        return num.toString();
    },

    /**
     * Parses a string to a number.
     * @param {string} str - String to parse
     * @param {number} [radix] - Radix (2, 8, 10, 16)
     * @returns {number|boolean} Number or #f if invalid
     */
    'string->number': (str, radix) => {
        assertString('string->number', 1, str);
        const r = radix === undefined ? 10 : radix;
        if (radix !== undefined) {
            assertInteger('string->number', 2, radix);
        }

        // Delegate to reader's parseNumber for robust Scheme numeric syntax support
        // Note: radix argument overrides any prefix in string if inconsistent?
        // R7RS: "If radix is not supplied, ... If radix is supplied, ... interpret with that radix"

        let prefix = "";

        // If radix is explicit, we prepend the corresponding prefix if not present?
        if (r === 2) prefix = "#b";
        else if (r === 8) prefix = "#o";
        else if (r === 10) prefix = "#d";
        else if (r === 16) prefix = "#x";

        try {
            // Simplified approach: use parseNumber directly.

            // If customized radix (not 2,8,10,16), full custom logic required.
            if (![2, 8, 10, 16].includes(r)) {
                // Fallback to old simple parsing for non-standard bases (integers only)
                const num = parseInt(str, r);
                if (isNaN(num)) return false;
                // Validate chars
                const validChars = '0123456789abcdefghijklmnopqrstuvwxyz'.slice(0, r);
                const cleanStr = str.replace(/^[+-]/, '');
                for (const ch of cleanStr.toLowerCase()) {
                    if (!validChars.includes(ch)) return false;
                }
                return num;
            }

            // Standard bases: Use parseNumber
            // If string starts with #, parseNumber handles it.
            // If string DOES NOT start with #, pretend it has #d (default) or the radix prefix.

            let targetStr = str;
            if (!str.trim().startsWith('#')) {
                targetStr = prefix + str;
            }
            // If explicit radix given, we check if logic is consistent
            // If (string->number "#x10" 10) -> Should fail or ignore prefix?
            // R7RS: "If the string has a radix prefix, and a radix argument is also supplied,
            // and they imply different radices, an error is signaled."
            // We return #f for now to be safe (or false).
            if (radix !== undefined) {
                const match = str.match(/^#[boxd]/i);
                if (match) {
                    const p = match[0].toLowerCase();
                    if (r === 2 && p !== '#b') return false;
                    if (r === 8 && p !== '#o') return false;
                    if (r === 10 && p !== '#d') return false;
                    if (r === 16 && p !== '#x') return false;
                }
            }

            const result = parseNumber(targetStr);
            if (result === null) return false;

            return result;

        } catch (e) {
            return false;
        }
    },

    /**
     * Converts string to symbol.
     * @param {string} str - String to convert.
     * @returns {Symbol} Interned symbol.
     */
    'string->symbol': (str) => {
        assertString('string->symbol', 1, str);
        return intern(str);
    },

    /**
     * Converts symbol to string.
     * @param {Symbol} sym - Symbol to convert.
     * @returns {string} Symbol's name.
     */
    'symbol->string': (sym) => {
        assertSymbol('symbol->string', 1, sym);
        return sym.name;
    },

    // -------------------------------------------------------------------------
    // Case Conversion
    // -------------------------------------------------------------------------

    /**
     * Returns uppercase version of string.
     * @param {string} str - String
     * @returns {string} Uppercase string
     */
    'string-upcase': (str) => {
        assertString('string-upcase', 1, str);
        return str.toUpperCase();
    },

    /**
     * Returns lowercase version of string.
     * @param {string} str - String
     * @returns {string} Lowercase string
     */
    'string-downcase': (str) => {
        assertString('string-downcase', 1, str);
        return str.toLowerCase();
    },

    /**
     * Returns case-folded version of string.
     * For simple cases, this is the same as downcase.
     * @param {string} str - String
     * @returns {string} Folded string
     */
    'string-foldcase': (str) => {
        assertString('string-foldcase', 1, str);
        return str.toLowerCase();
    }
};

/**
 * Character Primitives for Scheme.
 * 
 * Provides character operations per R7RS §6.6.
 * Characters are represented as single-character JavaScript strings.
 */


// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Asserts all arguments are characters.
 * @param {string} procName - Procedure name for error messages
 * @param {Array} args - Arguments to check
 */
function assertAllChars(procName, args) {
    args.forEach((arg, i) => assertChar(procName, i + 1, arg));
}

/**
 * Variadic character comparison helper.
 * @param {string} procName - Procedure name
 * @param {Function} compare - Comparison function (a, b) => boolean
 * @param {Array} args - Character arguments
 * @returns {boolean} True if comparison holds for all adjacent pairs
 */
function compareChars(procName, compare, args) {
    assertArity(procName, args, 2, Infinity);
    assertAllChars(procName, args);
    for (let i = 0; i < args.length - 1; i++) {
        if (!compare(args[i], args[i + 1])) return false;
    }
    return true;
}

/**
 * Variadic case-insensitive character comparison helper.
 * @param {string} procName - Procedure name
 * @param {Function} compare - Comparison function (a, b) => boolean
 * @param {Array} args - Character arguments
 * @returns {boolean} True if comparison holds for all adjacent pairs
 */
function compareCiChars(procName, compare, args) {
    assertArity(procName, args, 2, Infinity);
    assertAllChars(procName, args);
    for (let i = 0; i < args.length - 1; i++) {
        const a = args[i].toLowerCase();
        const b = args[i + 1].toLowerCase();
        if (!compare(a, b)) return false;
    }
    return true;
}

// =============================================================================
// Character Primitives
// =============================================================================

/**
 * Character primitives exported to Scheme.
 */
const charPrimitives = {
    // -------------------------------------------------------------------------
    // Type Predicate
    // -------------------------------------------------------------------------

    /**
     * Character type predicate.
     * @param {*} obj - Value to check.
     * @returns {boolean} True if obj is a character.
     */
    'char?': (obj) => isChar(obj),

    // -------------------------------------------------------------------------
    // Case-Sensitive Comparison
    // -------------------------------------------------------------------------

    /**
     * Returns #t if all characters are equal.
     * @param {...string} chars - Characters to compare.
     * @returns {boolean}
     */
    'char=?': (...args) => compareChars('char=?', (a, b) => a === b, args),

    /**
     * Returns #t if characters are monotonically increasing.
     * @param {...string} chars - Characters to compare.
     * @returns {boolean}
     */
    'char<?': (...args) => compareChars('char<?', (a, b) => a < b, args),

    /**
     * Returns #t if characters are monotonically decreasing.
     * @param {...string} chars - Characters to compare.
     * @returns {boolean}
     */
    'char>?': (...args) => compareChars('char>?', (a, b) => a > b, args),

    /**
     * Returns #t if characters are monotonically non-decreasing.
     * @param {...string} chars - Characters to compare.
     * @returns {boolean}
     */
    'char<=?': (...args) => compareChars('char<=?', (a, b) => a <= b, args),

    /**
     * Returns #t if characters are monotonically non-increasing.
     * @param {...string} chars - Characters to compare.
     * @returns {boolean}
     */
    'char>=?': (...args) => compareChars('char>=?', (a, b) => a >= b, args),

    // -------------------------------------------------------------------------
    // Case-Insensitive Comparison
    // -------------------------------------------------------------------------

    /**
     * Case-insensitive char=?.
     * @param {...string} chars - Characters to compare.
     * @returns {boolean}
     */
    'char-ci=?': (...args) => compareCiChars('char-ci=?', (a, b) => a === b, args),

    /**
     * Case-insensitive char<?.
     * @param {...string} chars - Characters to compare.
     * @returns {boolean}
     */
    'char-ci<?': (...args) => compareCiChars('char-ci<?', (a, b) => a < b, args),

    /**
     * Case-insensitive char>?.
     * @param {...string} chars - Characters to compare.
     * @returns {boolean}
     */
    'char-ci>?': (...args) => compareCiChars('char-ci>?', (a, b) => a > b, args),

    /**
     * Case-insensitive char<=?.
     * @param {...string} chars - Characters to compare.
     * @returns {boolean}
     */
    'char-ci<=?': (...args) => compareCiChars('char-ci<=?', (a, b) => a <= b, args),

    /**
     * Case-insensitive char>=?.
     * @param {...string} chars - Characters to compare.
     * @returns {boolean}
     */
    'char-ci>=?': (...args) => compareCiChars('char-ci>=?', (a, b) => a >= b, args),

    // -------------------------------------------------------------------------
    // Character Class Predicates
    // -------------------------------------------------------------------------

    /**
     * Returns #t if char is alphabetic.
     * @param {string} char - Character to test.
     * @returns {boolean}
     */
    'char-alphabetic?': (char) => {
        assertChar('char-alphabetic?', 1, char);
        return /^[a-zA-Z]$/.test(char);
    },

    /**
     * Returns #t if char is numeric (0-9).
     * @param {string} char - Character to test.
     * @returns {boolean}
     */
    'char-numeric?': (char) => {
        assertChar('char-numeric?', 1, char);
        return /^[0-9]$/.test(char);
    },

    /**
     * Returns #t if char is whitespace.
     * @param {string} char - Character to test.
     * @returns {boolean}
     */
    'char-whitespace?': (char) => {
        assertChar('char-whitespace?', 1, char);
        return /^\s$/.test(char);
    },

    /**
     * Returns #t if char is uppercase.
     * @param {string} char - Character to test.
     * @returns {boolean}
     */
    'char-upper-case?': (char) => {
        assertChar('char-upper-case?', 1, char);
        return char === char.toUpperCase() && char !== char.toLowerCase();
    },

    /**
     * Returns #t if char is lowercase.
     * @param {string} char - Character to test.
     * @returns {boolean}
     */
    'char-lower-case?': (char) => {
        assertChar('char-lower-case?', 1, char);
        return char === char.toLowerCase() && char !== char.toUpperCase();
    },

    // -------------------------------------------------------------------------
    // Conversion
    // -------------------------------------------------------------------------

    /**
     * Returns the Unicode code point of a character.
     * @param {string} char - Character.
     * @returns {number} Code point.
     */
    'char->integer': (char) => {
        assertChar('char->integer', 1, char);
        return char.codePointAt(0);
    },

    /**
     * Returns the character for a Unicode code point.
     * @param {number} n - Code point.
     * @returns {string} Character.
     */
    'integer->char': (n) => {
        assertInteger('integer->char', 1, n);
        if (n < 0 || n > 0x10FFFF) {
            throw new SchemeRangeError('integer->char', 'code point', 0, 0x10FFFF, n);
        }
        return String.fromCodePoint(n);
    },

    // -------------------------------------------------------------------------
    // Case Conversion
    // -------------------------------------------------------------------------

    /**
     * Returns the uppercase version of a character.
     * @param {string} char - Character.
     * @returns {string} Uppercase character.
     */
    'char-upcase': (char) => {
        assertChar('char-upcase', 1, char);
        return char.toUpperCase();
    },

    /**
     * Returns the lowercase version of a character.
     * @param {string} char - Character.
     * @returns {string} Lowercase character.
     */
    'char-downcase': (char) => {
        assertChar('char-downcase', 1, char);
        return char.toLowerCase();
    },

    /**
     * Returns the case-folded version of a character.
     * For simple cases, this is the same as downcase.
     * @param {string} char - Character.
     * @returns {string} Folded character.
     */
    'char-foldcase': (char) => {
        assertChar('char-foldcase', 1, char);
        return char.toLowerCase();
    },

    // -------------------------------------------------------------------------
    // Digit Value
    // -------------------------------------------------------------------------

    /**
     * Returns the digit value (0-9) if char is a digit, else #f.
     * R7RS: For radix 10, only characters 0-9 have digit values.
     * @param {string} char - Character.
     * @returns {number|boolean} Digit value or #f.
     */
    'digit-value': (char) => {
        assertChar('digit-value', 1, char);
        const code = char.charCodeAt(0);
        if (code >= 48 && code <= 57) { // '0' to '9'
            return code - 48;
        }
        return false;
    }
};

/**
 * Equality Primitives for Scheme.
 * 
 * Provides eq?, eqv?, and boolean operations.
 */


/**
 * Equality primitives exported to Scheme.
 */
const eqPrimitives = {
    /**
     * Identity comparison.
     * @param {*} a - First value.
     * @param {*} b - Second value.
     * @returns {boolean} True if a and b are the same object.
     */
    'eq?': (a, b) => a === b,

    /**
     * Equivalence comparison (handles NaN, -0, Complex, Rational).
     * @param {*} a - First value.
     * @param {*} b - Second value.
     * @returns {boolean} True if a and b are equivalent.
     */
    'eqv?': (a, b) => {
        if (Object.is(a, b)) return true;

        if (a instanceof Complex && b instanceof Complex) {
            return eqPrimitives['eqv?'](a.real, b.real) && eqPrimitives['eqv?'](a.imag, b.imag);
        }

        if (a instanceof Rational) {
            if (b instanceof Rational) {
                return a.numerator === b.numerator && a.denominator === b.denominator;
            }
            if (Number.isInteger(b)) {
                return a.denominator === 1 && a.numerator === b;
            }
        }

        if (Number.isInteger(a) && b instanceof Rational) {
            return b.denominator === 1 && b.numerator === a;
        }

        return false;
    },

    /**
     * Boolean negation.
     * @param {*} obj - Value to negate.
     * @returns {boolean} True only if obj is #f.
     */
    'not': (obj) => obj === false,

    /**
     * Boolean type predicate.
     * @param {*} obj - Value to check.
     * @returns {boolean} True if obj is #t or #f.
     */
    'boolean?': (obj) => typeof obj === 'boolean',

    /**
     * Boolean equivalence. Returns true if all boolean arguments are equal.
     * @param {...boolean} args - Booleans to compare.
     * @returns {boolean} True if all arguments are the same boolean value.
     */
    'boolean=?': (...args) => {
        assertArity('boolean=?', args, 2, Infinity);
        args.forEach((arg, i) => assertBoolean('boolean=?', i + 1, arg));
        return args.every(b => b === args[0]);
    },

    /**
     * Symbol type predicate.
     * @param {*} obj - Value to check.
     * @returns {boolean} True if obj is a symbol.
     */
    'symbol?': (obj) => obj !== null && typeof obj === 'object' && obj.constructor && obj.constructor.name === 'Symbol',

    /**
     * Symbol equality. Returns true if all arguments are the same symbol.
     * @param {...Symbol} args - Symbols to compare.
     * @returns {boolean} True if all arguments are eq?.
     */
    'symbol=?': (...args) => {
        assertArity('symbol=?', args, 2, Infinity);
        if (args.length === 0) return true;
        const first = args[0];
        if (!(first !== null && typeof first === 'object' && first.constructor && first.constructor.name === 'Symbol')) {
            throw new Error('symbol=?: expected symbol');
        }
        return args.every(sym => {
            if (!(sym !== null && typeof sym === 'object' && sym.constructor && sym.constructor.name === 'Symbol')) {
                throw new Error('symbol=?: expected symbol');
            }
            return sym === first;
        });
    }
};

// Mark primitives that should receive raw Scheme objects (no JS bridge wrapping)
eqPrimitives['eq?'].skipBridge = true;
eqPrimitives['eqv?'].skipBridge = true;

// Side effects
if (typeof window !== 'undefined') {
    window.fetchData = (successCallback) => {
        setTimeout(() => {
            console.log("JavaScript is executing the callback.");
            // The successCallback is a Scheme closure wrapped by NativeJsFunction
            successCallback("Fetched data from JS");
        }, 1000); // 1 second delay
    };
    window.globalK = null;
}

function getAsyncPrimitives(interpreter) {
    return {
        'js-set-timeout': (cb, ms) => setTimeout(cb, ms),
        'js-fetch-data': (typeof window !== 'undefined') ? window.fetchData : () => { },

        // Stores a value (e.g., a continuation) in a global JS variable.
        'js-store-k': (k) => {
            if (typeof window !== 'undefined') window.globalK = k; // k will be a Bridge function (if passed from Scheme)
            return true;
        }
    };
}

/**
 * Library Registry Module
 * 
 * Manages the registry of loaded libraries and feature detection.
 * This module is pure data management - no loading or parsing.
 */


// =============================================================================
// Feature Registry (for cond-expand)
// =============================================================================

/**
 * Feature registry for cond-expand and (features) primitive.
 * Standard R7RS features plus implementation-specific ones.
 * This is the single source of truth for all features.
 */
const features = new Set([
    'r7rs',           // R7RS Scheme
    'scheme-js',      // This implementation
    'exact-closed',   // Rationals not implemented, but we can claim this for integers
    'ratios',         // Rational number support
    'ieee-float',     // JavaScript uses IEEE 754
    'full-unicode',   // Full Unicode support in strings
]);

// Detect Node.js vs browser and add appropriate feature
const isNode$1 = typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null;

if (isNode$1) {
    features.add('node');
} else {
    features.add('browser');
}

/**
 * Evaluates a cond-expand feature requirement.
 * 
 * @param {Symbol|Cons} requirement - Feature requirement expression
 * @returns {boolean} True if requirement is satisfied
 */
function evaluateFeatureRequirement(requirement) {
    // Simple feature identifier
    if (requirement instanceof Symbol$1) {
        return features.has(requirement.name);
    }

    // Compound requirement: (and ...), (or ...), (not ...), (library ...)
    const arr = toArray(requirement);
    if (arr.length === 0) return false;

    const tag = arr[0];
    if (!(tag instanceof Symbol$1)) return false;

    switch (tag.name) {
        case 'and':
            // All requirements must be true
            for (let i = 1; i < arr.length; i++) {
                if (!evaluateFeatureRequirement(arr[i])) return false;
            }
            return true;

        case 'or':
            // At least one requirement must be true
            for (let i = 1; i < arr.length; i++) {
                if (evaluateFeatureRequirement(arr[i])) return true;
            }
            return false;

        case 'not':
            // Negation
            if (arr.length !== 2) {
                throw new SchemeSyntaxError('(not) requires exactly one argument', requirement, 'cond-expand');
            }
            return !evaluateFeatureRequirement(arr[1]);

        case 'library':
            // Check if library is available (loaded or loadable)
            if (arr.length !== 2) {
                throw new SchemeSyntaxError('(library) requires a library name', requirement, 'cond-expand');
            }
            const libName = toArray(arr[1]);
            const libKey = libraryNameToKey(libName);
            return libraryRegistry.has(libKey);

        default:
            // Unknown tag - treat as false
            return false;
    }
}

// =============================================================================
// Library Registry
// =============================================================================

/**
 * Registry of loaded libraries.
 * Key: stringified library name (e.g., "scheme.base")
 * Value: { exports: Map<string, value>, env: Environment }
 */
const libraryRegistry = new Map();

/**
 * File resolver function (set by runtime).
 * @type {(libraryName: string[]) => Promise<string>}
 */
let fileResolver = null;

/**
 * Sets the file resolver for loading library files.
 * @param {Function} resolver - (libraryName: string[]) => Promise<string>
 */
function setFileResolver(resolver) {
    fileResolver = resolver;
}

/**
 * Gets the current file resolver.
 * @returns {Function|null}
 */
function getFileResolver() {
    return fileResolver;
}

/**
 * Converts a library name to a string key.
 * (scheme base) -> "scheme.base"
 * @param {Array|Cons} name - Library name as list or array
 * @returns {string}
 */
function libraryNameToKey(name) {
    const parts = Array.isArray(name) ? name : toArray(name);
    return parts.map(p => p instanceof Symbol$1 ? p.name : String(p)).join('.');
}

/**
 * Gets a loaded library's exports.
 * @param {string|string[]} library - Library name parts or library key
 * @returns {Map|null}
 */
function getLibraryExports(library) {
    const key = Array.isArray(library) ? libraryNameToKey(library) : library;
    const lib = libraryRegistry.get(key);
    return lib ? lib.exports : null;
}

/**
 * Registers a library in the registry.
 * @param {string} key - Library key
 * @param {Map} exports - Library exports
 * @param {Environment} env - Library environment
 */
function registerLibrary(key, exports$1, env) {
    libraryRegistry.set(key, { exports: exports$1, env });
}

/**
 * Registers a builtin library with exports from JavaScript.
 * Used for (scheme base) and other libraries that need runtime primitives.
 * 
 * @param {string[]} libraryName - Library name parts (e.g., ['scheme', 'base'])
 * @param {Map<string, *>|Object} exports - Exports as Map or object
 * @param {Environment} env - The environment containing the bindings
 */
function registerBuiltinLibrary(libraryName, exports$1, env) {
    const key = libraryNameToKey(libraryName);

    // Convert object to Map if needed
    const exportsMap = exports$1 instanceof Map
        ? exports$1
        : new Map(Object.entries(exports$1));

    libraryRegistry.set(key, { exports: exportsMap, env });
}

// =============================================================================
// Syntax Keywords and Special Forms
// =============================================================================

/**
 * Standard Scheme syntax keywords.
 * These are handled by the analyzer as special forms.
 * Used by library_loader to filter keywords from exports.
 */
const SYNTAX_KEYWORDS = new Set([
    'define', 'set!', 'lambda', 'if', 'begin', 'quote',
    'quasiquote', 'unquote', 'unquote-splicing',
    'define-syntax', 'let-syntax', 'letrec-syntax',
    'syntax-rules', '...', 'else', '=>', 'import', 'export',
    'define-library', 'include', 'include-ci', 'include-library-declarations',
    'cond-expand', 'let', 'letrec', 'call/cc', 'call-with-current-continuation'
]);

/**
 * Special forms recognized by the analyzer.
 * These have dedicated analysis functions and are NOT treated as macro calls.
 * Also used by syntax_rules to prevent renaming during macro expansion.
 */
const SPECIAL_FORMS$1 = new Set([
    // Core special forms
    'if', 'let', 'letrec', 'lambda', 'set!', 'define', 'begin',
    'quote', 'quasiquote', 'unquote', 'unquote-splicing',
    // Macro-related
    'define-syntax', 'let-syntax', 'letrec-syntax',
    // Control flow
    'call/cc', 'call-with-current-continuation',
    // Module system
    'import', 'cond-expand'
]);

/**
 * Library Parser Module
 * 
 * Parses define-library forms and import specifications.
 * Pure parsing logic - no registry access or file I/O.
 */


// =============================================================================
// define-library Parser
// =============================================================================

/**
 * Parses a define-library form and extracts its clauses.
 * 
 * @param {Cons} form - The define-library S-expression
 * @returns {Object} { name, exports, imports, body, includes, includesCi, includeLibraryDeclarations }
 */
function parseDefineLibrary(form) {
    const arr = toArray(form);

    if (arr.length < 2) {
        throw new SchemeSyntaxError('requires a library name', null, 'define-library');
    }

    const tag = arr[0];
    if (!(tag instanceof Symbol$1) || tag.name !== 'define-library') {
        throw new SchemeSyntaxError('expected define-library form', form, 'define-library');
    }

    const name = toArray(arr[1]);
    const result = {
        name,
        exports: [],
        imports: [],
        body: [],
        includes: [],
        includesCi: [],
        includeLibraryDeclarations: []
    };

    // Parse clauses using shared processor
    for (let i = 2; i < arr.length; i++) {
        processDeclaration(arr[i], result);
    }

    return result;
}

/**
 * Processes a single library declaration clause.
 * Handles recursion for cond-expand.
 * 
 * @param {Cons} decl - The declaration S-expression
 * @param {Object} result - Accumulator for library components
 */
function processDeclaration(decl, result) {
    const declArr = toArray(decl);
    if (declArr.length === 0) return;

    const tag = declArr[0];
    if (!(tag instanceof Symbol$1)) {
        throw new SchemeSyntaxError('invalid clause - expected symbol', decl, 'define-library');
    }

    switch (tag.name) {
        case 'export':
            // (export id ...)
            for (let j = 1; j < declArr.length; j++) {
                const spec = declArr[j];
                if (spec instanceof Symbol$1) {
                    result.exports.push({ internal: spec.name, external: spec.name });
                } else if (Array.isArray(toArray(spec))) {
                    // (rename internal external)
                    const renameArr = toArray(spec);
                    if (renameArr[0] instanceof Symbol$1 && renameArr[0].name === 'rename') {
                        result.exports.push({
                            internal: renameArr[1].name,
                            external: renameArr[2].name
                        });
                    }
                }
            }
            break;

        case 'import':
            // (import import-set ...)
            for (let j = 1; j < declArr.length; j++) {
                result.imports.push(parseImportSet(declArr[j]));
            }
            break;

        case 'begin':
            // (begin expr ...)
            for (let j = 1; j < declArr.length; j++) {
                result.body.push(declArr[j]);
            }
            break;

        case 'include':
            // (include filename ...)
            for (let j = 1; j < declArr.length; j++) {
                result.includes.push(declArr[j]);
            }
            break;

        case 'include-ci':
            // (include-ci filename ...)
            for (let j = 1; j < declArr.length; j++) {
                result.includesCi.push(declArr[j]);
            }
            break;

        case 'include-library-declarations':
            // (include-library-declarations filename ...)
            for (let j = 1; j < declArr.length; j++) {
                result.includeLibraryDeclarations.push(declArr[j]);
            }
            break;

        case 'cond-expand':
            // (cond-expand <clause> ...)
            processCondExpand(declArr, result);
            break;

        default:
            throw new SchemeSyntaxError(`unknown clause: ${tag.name}`, decl, 'define-library');
    }
}

/**
 * Processes a cond-expand declaration.
 * 
 * @param {Array} declArr - The full (cond-expand ...) form as array
 * @param {Object} result - Accumulator
 */
function processCondExpand(declArr, result) {
    for (let j = 1; j < declArr.length; j++) {
        const ceClause = toArray(declArr[j]);
        if (ceClause.length === 0) continue;

        const featureReq = ceClause[0];
        let matched = false;

        // Check for 'else' clause
        if (featureReq instanceof Symbol$1 && featureReq.name === 'else') {
            matched = true;
        } else {
            matched = evaluateFeatureRequirement(featureReq);
        }

        if (matched) {
            // Expand declarations from this clause
            for (let k = 1; k < ceClause.length; k++) {
                processDeclaration(ceClause[k], result);
            }
            // Only process first matching clause
            break;
        }
    }
}

// =============================================================================
// Import Set Parser
// =============================================================================

/**
 * Parses an import set.
 * 
 * @param {Cons|Symbol} importSet - The import specification
 * @returns {Object} { libraryName, only, except, prefix, rename }
 */
function parseImportSet(importSet) {
    const arr = toArray(importSet);
    const first = arr[0];

    // Simple case: (library name)
    if (first instanceof Symbol$1 && !['only', 'except', 'prefix', 'rename'].includes(first.name)) {
        return {
            libraryName: arr.map(s => s instanceof Symbol$1 ? s.name : String(s)),
            only: null,
            except: null,
            prefix: null,
            rename: null
        };
    }

    // Filtered imports
    const result = { libraryName: null, only: null, except: null, prefix: null, rename: null };

    if (first instanceof Symbol$1) {
        switch (first.name) {
            case 'only':
                result.only = arr.slice(2).map(s => s.name);
                Object.assign(result, parseImportSet(arr[1]));
                result.only = arr.slice(2).map(s => s.name);
                break;
            case 'except':
                Object.assign(result, parseImportSet(arr[1]));
                result.except = arr.slice(2).map(s => s.name);
                break;
            case 'prefix':
                Object.assign(result, parseImportSet(arr[1]));
                result.prefix = arr[2].name;
                break;
            case 'rename':
                Object.assign(result, parseImportSet(arr[1]));
                result.rename = [];
                for (let i = 2; i < arr.length; i += 2) {
                    result.rename.push({ from: arr[i].name, to: arr[i + 1].name });
                }
                break;
        }
    }

    return result;
}

/**
 * R7RS Library Loader
 * 
 * Handles loading libraries from files and orchestrating the import process.
 * Re-exports registry and parser functionality for backwards compatibility.
 */


/**
 * Loads a library by name synchronously (Node.js only).
 * 
 * @param {string[]} libraryName - Library name parts
 * @param {Function} analyze - The analyze function
 * @param {Object} interpreter - The interpreter instance
 * @param {Environment} baseEnv - Base environment for primitives
 * @returns {Map} The library's exports
 */
function loadLibrarySync(libraryName, analyze, interpreter, baseEnv) {
    const key = libraryNameToKey(libraryName);

    // Return cached if already loaded
    const cached = getLibraryExports(key);
    if (cached) {
        return cached;
    }

    // Resolve and load file
    const fileResolver = getFileResolver();
    if (!fileResolver) {
        throw new SchemeLibraryError('no file resolver set - call setFileResolver first');
    }

    const source = fileResolver(libraryName);
    if (source instanceof Promise) {
        throw new SchemeLibraryError('async resolver not supported in sync load', key);
    }

    const forms = parse(source);

    if (forms.length === 0) {
        throw new SchemeLibraryError('empty library file', key);
    }

    // Parse the define-library form
    const libDef = parseDefineLibrary(forms[0]);

    return evaluateLibraryDefinitionSync(libDef, analyze, interpreter, baseEnv);
}

// =============================================================================
// Core Library Evaluation
// =============================================================================

/**
 * Core library evaluation logic shared between async and sync versions.
 * 
 * @param {Object} libDef - The parsed library definition
 * @param {Function} analyze - The analyze function
 * @param {Object} interpreter - The interpreter instance
 * @param {Environment} baseEnv - Base environment for primitives
 * @param {Object} strategy - Strategy object for async/sync differences
 * @param {Function} strategy.loadLibrary - Function to load a library by name
 * @param {Function} strategy.resolveFile - Function to resolve and read a file
 * @returns {Map} The library's exports
 */
function evaluateLibraryDefinitionCore(libDef, analyze, interpreter, baseEnv, strategy) {
    const libraryName = libDef.name;
    const key = libraryNameToKey(libraryName);

    // Create library environment (child of base env)
    const libEnv = new Environment(baseEnv);

    // Process imports first
    for (const importSpec of libDef.imports) {
        const importExports = strategy.loadLibrary(importSpec.libraryName);
        applyImports(libEnv, importExports, importSpec);
    }

    // Resolve includes using file resolver
    const fileResolver = getFileResolver();
    if (fileResolver) {
        // Load standard includes
        for (const includeFile of libDef.includes) {
            const includeSource = strategy.resolveFile(
                [...libraryName.slice(0, -1), includeFile]
            );
            const includeForms = parse(includeSource);
            for (const form of includeForms) {
                libDef.body.push(form);
            }
        }

        // Load case-insensitive includes
        for (const includeFile of libDef.includesCi) {
            const includeSource = strategy.resolveFile(
                [...libraryName.slice(0, -1), includeFile]
            );
            const includeForms = parse(includeSource, { caseFold: true });
            for (const form of includeForms) {
                libDef.body.push(form);
            }
        }

        // Load library declaration includes
        for (const declFile of libDef.includeLibraryDeclarations) {
            const declSource = strategy.resolveFile(
                [...libraryName.slice(0, -1), declFile]
            );
            const declForms = parse(declSource);

            // Process each declaration in the included file
            for (const decl of declForms) {
                const declArr = toArray(decl);
                if (declArr.length === 0) continue;

                const declTag = declArr[0];
                if (!(declTag instanceof Symbol$1)) continue;

                switch (declTag.name) {
                    case 'export':
                        for (let j = 1; j < declArr.length; j++) {
                            const spec = declArr[j];
                            if (spec instanceof Symbol$1) {
                                libDef.exports.push({ internal: spec.name, external: spec.name });
                            }
                        }
                        break;
                    case 'import':
                        for (let j = 1; j < declArr.length; j++) {
                            const innerImportSpec = parseImportSet(declArr[j]);
                            const innerImportExports = strategy.loadLibrary(innerImportSpec.libraryName);
                            applyImports(libEnv, innerImportExports, innerImportSpec);
                        }
                        break;
                    case 'begin':
                        for (let j = 1; j < declArr.length; j++) {
                            libDef.body.push(declArr[j]);
                        }
                        break;
                    case 'include':
                        for (let j = 1; j < declArr.length; j++) {
                            libDef.includes.push(declArr[j]);
                        }
                        break;
                }
            }
        }
    }

    // Execute body with a defining scope for referential transparency
    const libraryScope = globalContext.freshScope();
    globalContext.registerLibraryScope(libraryScope, libEnv);
    globalContext.pushDefiningScope(libraryScope);

    try {
        for (const expr of libDef.body) {
            const ast = analyze(expr);
            interpreter.run(ast, libEnv);
        }
    } finally {
        globalContext.popDefiningScope();
    }

    // Build exports map
    const exports$1 = new Map();
    for (const exp of libDef.exports) {
        let value;
        try {
            value = libEnv.lookup(exp.internal);
        } catch (e) {
            if (globalMacroRegistry.isMacro(exp.internal)) {
                value = { _isMacro: true, name: exp.internal };
            } else if (SYNTAX_KEYWORDS.has(exp.internal)) {
                value = { _isKeyword: true, name: exp.internal };
            } else {
                throw e;
            }
        }
        exports$1.set(exp.external, value);
    }

    // Register library
    registerLibrary(key, exports$1, libEnv);

    return exports$1;
}

/**
 * Evaluates a parsed library definition synchronously.
 * 
 * @param {Object} libDef - The parsed library definition
 * @param {Function} analyze - The analyze function
 * @param {Object} interpreter - The interpreter instance
 * @param {Environment} baseEnv - Base environment for primitives
 * @returns {Map} The library's exports
 */
function evaluateLibraryDefinitionSync(libDef, analyze, interpreter, baseEnv) {
    const fileResolver = getFileResolver();

    return evaluateLibraryDefinitionCore(libDef, analyze, interpreter, baseEnv, {
        loadLibrary: (name) => loadLibrarySync(name, analyze, interpreter, baseEnv),
        resolveFile: (path) => {
            const result = fileResolver(path);
            if (result instanceof Promise) {
                throw new SchemeLibraryError('async resolver not supported in sync load');
            }
            return result;
        }
    });
}

// =============================================================================
// Import Application
// =============================================================================

/**
 * Applies import filters to add bindings to an environment.
 * 
 * @param {Environment} env - Target environment
 * @param {Map} exports - Source library exports
 * @param {Object} importSpec - Import specification
 */
function applyImports(env, exports$1, importSpec) {
    for (const [name, value] of exports$1) {
        // Check only filter
        if (importSpec.only && !importSpec.only.includes(name)) {
            continue;
        }

        // Check except filter
        if (importSpec.except && importSpec.except.includes(name)) {
            continue;
        }

        // Apply rename
        let finalName = name;
        if (importSpec.rename) {
            const renameEntry = importSpec.rename.find(r => r.from === name);
            if (renameEntry) {
                finalName = renameEntry.to;
            }
        }

        // Apply prefix
        if (importSpec.prefix) {
            finalName = importSpec.prefix + finalName;
        }

        // If it's a macro or keyword marker, don't define it in the environment.
        // It's already handled by the analyzer/macro registry.
        if (value && (value._isMacro || value._isKeyword)) {
            continue;
        }

        env.define(finalName, value);
    }
}

// =============================================================================
// Primitive Exports
// =============================================================================

/**
 * Creates (scheme primitives) exports from the global environment.
 * 
 * @param {Environment} globalEnv - The global environment with primitives
 * @returns {Map<string, *>} The exports map
 */
function createPrimitiveExports(globalEnv) {
    const exports$1 = new Map();

    // List of (scheme primitives) exports
    // This MUST match what is actually installed in the global environment by primitives/index.js
    const primitiveExports = [
        // Equivalence
        'eq?', 'eqv?', 'not', 'boolean?', 'boolean=?', 'symbol?',
        // Math - basic arithmetic
        '+', '-', '*', '/',
        // Math - binary comparisons (used by core.scm to build variadic versions)
        '%num=', '%num<', '%num>', '%num<=', '%num>=',
        // Math - integer division
        'modulo', 'quotient', 'remainder',
        // Math - type predicates
        'number?', 'real?', 'rational?', 'integer?', 'exact-integer?',
        'finite?', 'infinite?', 'nan?',
        // Math - functions requiring Math.*
        'abs', 'floor', 'ceiling', 'truncate', 'expt', 'sqrt',
        'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'exp',
        // Pairs and lists
        'cons', 'car', 'cdr', 'pair?', 'null?', 'list?',
        'set-car!', 'set-cdr!',
        'list', 'append',
        // Symbols
        'symbol->string', 'string->symbol',
        // Strings
        'string?', 'string-append', 'number->string',
        // Vectors
        'vector?', 'make-vector', 'vector', 'vector-length',
        'vector-ref', 'vector-set!',
        'vector->list', 'list->vector',
        // Records (Low-level primitives for define-record-type)
        'make-record-type', 'record-constructor', 'record-predicate',
        'record-accessor', 'record-modifier',
        // Control
        'apply', 'values', 'call-with-values',
        'eval', 'interaction-environment',
        'dynamic-wind',
        'call-with-current-continuation', 'call/cc',
        'procedure?',
        // Exceptions
        'raise', 'raise-continuable', 'with-exception-handler',
        'error', 'error-object?', 'error-object-message', 'error-object-irritants',
        // I/O
        'display', 'newline',
    ];

    for (const name of primitiveExports) {
        // Use findEnv to check if binding exists without throwing
        if (globalEnv.findEnv(name) !== null) {
            exports$1.set(name, globalEnv.lookup(name));
        } else {
            // Warn about missing primitives that we expect to be there
            console.warn(`Warning: (scheme primitives) claims export '${name}' but it is not in the global environment.`);
        }
    }

    return exports$1;
}

/**
 * Special Forms Handler Registry
 * 
 * Encapsulates the registry of special form handlers with a clean API.
 * Handlers are registered during module initialization and looked up
 * during analysis.
 */

// Private Map - not directly exported
const SPECIAL_FORMS = new Map();

/**
 * Registers a handler for a special form.
 * @param {string} name - The special form name (e.g., 'if', 'lambda')
 * @param {Function} handler - Handler function: (exp, syntacticEnv, ctx) => Executable
 */
function registerHandler(name, handler) {
    if (SPECIAL_FORMS.has(name)) {
        console.warn(`Overwriting handler for special form: ${name}`);
    }
    SPECIAL_FORMS.set(name, handler);
}

/**
 * Gets the handler for a special form.
 * @param {string} name - The special form name
 * @returns {Function|undefined} The handler function, or undefined if not found
 */
function getHandler(name) {
    return SPECIAL_FORMS.get(name);
}

/**
 * Identifier Utilities for Macro System
 * 
 * Shared utilities for handling identifiers (Symbols and SyntaxObjects)
 * across the macro expansion system.
 */


// =============================================================================
// Identifier Name Extraction
// =============================================================================

/**
 * Gets the name from an identifier, handling both Symbol and SyntaxObject.
 * @param {Symbol|SyntaxObject|*} id - The identifier to extract from
 * @returns {string|null} The identifier name, or null if not an identifier
 */
function getIdentifierName(id) {
    if (id instanceof SyntaxObject$1) return id.name;
    if (id instanceof Symbol$1) return id.name;
    return null;
}

// =============================================================================
// Ellipsis Detection
// =============================================================================

/**
 * Checks if an identifier represents an ellipsis.
 * An identifier is an ellipsis if:
 * - Its name matches the ellipsis name (usually '...')
 * - It's not listed as a literal identifier
 * 
 * @param {Symbol|SyntaxObject|*} id - The identifier to check
 * @param {string} ellipsisName - The ellipsis identifier name (default '...')
 * @param {Array<Symbol|SyntaxObject>} literals - List of literal identifiers
 * @returns {boolean} True if the identifier is an ellipsis
 */
function isEllipsisIdentifier(id, ellipsisName = '...', literals = []) {
    const name = getIdentifierName(id);
    if (name !== ellipsisName) return false;

    // Check if it's a literal (then not treated as ellipsis)
    return !literals.some(lit => identifierEquals(lit, id));
}

// =============================================================================
// Hygiene Support
// =============================================================================

// Pure Marks Hygiene: Instead of renaming introduced bindings with gensyms,
// we mark all template identifiers with a fresh expansion scope. Two identifiers
// with the same name but different scope sets are distinct bindings.


/**
 * Compares two identifiers using bound-identifier=? semantics.
 * Two identifiers are bound-identifier=? if they have the same name
 * and the same set of scope marks.
 * 
 * @param {Symbol|SyntaxObject} id1 - First identifier
 * @param {Symbol|SyntaxObject} id2 - Second identifier
 * @returns {boolean} True if bound-identifier=?
 */
function boundIdEquals(id1, id2) {
    // Get names using shared utility
    const name1 = getIdentifierName(id1);
    const name2 = getIdentifierName(id2);

    if (name1 !== name2) return false;

    // Get scope sets
    const scopes1 = id1 instanceof SyntaxObject$1 ? id1.scopes : new Set();
    const scopes2 = id2 instanceof SyntaxObject$1 ? id2.scopes : new Set();

    // Compare scope sets
    if (scopes1.size !== scopes2.size) return false;
    for (const s of scopes1) {
        if (!scopes2.has(s)) return false;
    }
    return true;
}

/**
 * Compiles a syntax-rules specification into a transformer function.
 * 
 * @param {Array<Symbol>} literals - List of literal identifiers.
 * @param {Array} clauses - List of (pattern template) clauses.
 * @param {number|null} definingScope - Scope ID where the macro was defined.
 *        Used for looking up the definition environment.
 * @param {string} ellipsisName - The ellipsis identifier (default '...')
 * @param {Environment|null} capturedEnv - Lexical environment at macro definition
 * @returns {Function} A transformer function (exp, useSiteEnv) -> exp.
 */
function compileSyntaxRules(literals, clauses, definingScope = null, ellipsisName = '...', capturedEnv = null) {
    // Keep literals as objects for hygienic comparison (using bound-identifier=?)
    const literalIds = literals;

    return (exp, useSiteEnv = null) => {
        // exp is the macro call: (macro-name arg1 ...)
        // useSiteEnv is the syntactic environment at the macro invocation site

        // Generate a UNIQUE scope ID for THIS macro expansion.
        // This is the core of Dybvig-style hygiene - each expansion gets its own scope
        // so identifiers transcribed in this expansion are distinguishable from
        // identifiers transcribed in other expansions (including nested macros).
        const expansionScope = globalContext.freshScope();

        for (const clause of clauses) {
            const template = clause[1];

            // Skip the macro name in the pattern matching
            // R7RS: The first element of the pattern is ignored
            let pattern = clause[0];
            let input = exp;
            if (pattern instanceof Cons && input instanceof Cons) {
                pattern = pattern.cdr;
                input = input.cdr;
            }

            // Pass useSiteEnv for free-identifier=? comparison on literals
            // Determine definition environment for literal comparison
            const definitionEnv = capturedEnv || (definingScope !== null ? globalContext.lookupLibraryEnv(definingScope) : null);
            const bindings = matchPattern(pattern, input, literalIds, ellipsisName, useSiteEnv, expansionScope, definitionEnv);

            if (bindings) {
                // Pure marks hygiene: no renaming needed.
                // All identifiers will be marked with expansionScope during transcription,
                // making introduced bindings distinguishable from user bindings.
                return transcribe(template, bindings, expansionScope, ellipsisName, literalIds, capturedEnv);
            }
        }
        // Extract macro name for better error message
        const macroName = exp instanceof Cons && (exp.car instanceof Symbol$1 || exp.car instanceof SyntaxObject$1)
            ? (exp.car instanceof Symbol$1 ? exp.car.name : exp.car.name)
            : 'unknown';
        throw new SchemeSyntaxError(`No matching clause for macro '${macroName}'`, exp, macroName);
    };
}

// Note: findIntroducedBindings was removed as part of the pure marks refactor.
// Introduced bindings are now distinguished by scope marks, not renaming.


/**
 * Matches an input expression against a pattern.
 * @param {*} pattern 
 * @param {*} input 
 * @param {Array<Symbol|SyntaxObject>} literals - List of literal identifiers
 * @param {string} ellipsisName
 * @param {SyntacticEnv} useSiteEnv - Environment at macro invocation for free-identifier=?
 * @param {number|null} expansionScope - Scope to flip on input identifiers for hygiene
 * @param {Environment|SyntacticEnv|null} definitionEnv - Environment of macro definition
 * @returns {Map<string, *> | null} Bindings map or null if failed.
 */
function matchPattern(pattern, input, literals, ellipsisName = '...', useSiteEnv = null, expansionScope = null, definitionEnv = null) {
    // 1. Variables (Symbols or SyntaxObjects)
    // SyntaxObjects can appear when patterns come from macro-expanded define-syntax
    if (pattern instanceof Symbol$1 || pattern instanceof SyntaxObject$1) {
        const patName = pattern instanceof SyntaxObject$1 ? pattern.name : pattern.name;

        // Literal identifier check: use bound-identifier=? semantics
        // According to R7RS, when determining if a pattern identifier is a literal,
        // we compare it to the literals list. Both come from the macro definition,
        // so we use bound-identifier=? (comparing marks/scopes).
        const isLiteral = literals.some(lit => {
            // bound-identifier=? compares name and scope marks
            return boundIdEquals(lit, pattern);
        });

        if (isLiteral) {
            const patName = pattern instanceof SyntaxObject$1 ? pattern.name : pattern.name;
            const inputName = (input instanceof Symbol$1) ? input.name :
                (input instanceof SyntaxObject$1) ? input.name : null;

            // Names must match
            if (inputName !== patName) {
                return null; // Different names - no match
            }

            // free-identifier=? semantics: if the input identifier is locally 
            // bound at the use site, it refers to that local binding, not the literal.
            // So a locally bound `=>` should NOT match the `=>` literal in cond.
            if (useSiteEnv) {
                const localBinding = useSiteEnv.lookup(input);
                if (localBinding) {
                    // Input is locally bound - it's a different identifier
                    return null;
                }
            }

            return new Map(); // Same name, not locally bound - matches literal
        }

        // Wildcard
        if (patName === '_') return new Map();

        // Pattern variable - bind input with scope marking for hygiene (Anti-Mark)
        // We flip the expansion scope on all identifiers in the matched input.
        let boundValue = input;
        if (expansionScope !== null) {
            boundValue = flipScopeInExpression(input, expansionScope);
        }
        return new Map([[pattern, boundValue]]);
    }

    // 2. Literals (Numbers, Strings, Booleans, Null)
    if (pattern === null) {
        return input === null ? new Map() : null;
    }
    if (typeof pattern !== 'object') {
        // Primitive values
        // Note: Reader produces raw primitives, but Analyzer might pass Literals?
        // No, Analyzer passes raw S-expressions to matchPattern.
        if (input === pattern) return new Map();
        return null;
    }

    // 3. Lists (Cons)
    if (pattern instanceof Cons) {
        // if (!(input instanceof Cons)) return null; // Incorrect for (x ...) matching ()

        const bindings = new Map();
        let pCurr = pattern;
        let iCurr = input;

        while (pCurr instanceof Cons) {
            const patItem = pCurr.car;

            // Check for ellipsis: look ahead using shared utility
            const nextCar = pCurr.cdr instanceof Cons ? pCurr.cdr.car : null;
            const isEllipsis = nextCar && isEllipsisIdentifier(nextCar, ellipsisName);

            if (isEllipsis) {
                // Determine how many items to match Greedily (P ...)
                // We need to reserve enough items for the tail pattern T
                // Pattern is (P ... . T)
                const tailPattern = pCurr.cdr.cdr;
                const tailLen = countPairs(tailPattern);
                const inputLen = countPairs(iCurr);

                if (inputLen < tailLen) return null; // Not enough input

                // Number of items to consume for the ellipsis
                const matchCount = inputLen - tailLen;

                // Initialize bindings for all vars in patItem to []
                const varsInPat = collectPatternVars(patItem, literals, ellipsisName);
                for (const v of varsInPat) {
                    bindings.set(v, []);
                }

                // Collect matches
                for (let k = 0; k < matchCount; k++) {
                    if (!(iCurr instanceof Cons)) return null;
                    const subBindings = matchPattern(patItem, iCurr.car, literals, ellipsisName, useSiteEnv, expansionScope);
                    if (!subBindings) return null; // Failed to match one item
                    mergeBindings(bindings, subBindings, true);
                    iCurr = iCurr.cdr;
                }

                pCurr = pCurr.cdr.cdr; // Skip pat and ellipsis
            } else {
                // Normal match
                if (iCurr === null) return null; // Ran out of input

                // Handle improper input list if pattern expects more
                if (!(iCurr instanceof Cons)) return null;

                const subBindings = matchPattern(patItem, iCurr.car, literals, ellipsisName, useSiteEnv, expansionScope);
                if (!subBindings) return null;
                mergeBindings(bindings, subBindings, false);

                pCurr = pCurr.cdr;
                iCurr = iCurr.cdr;
            }
        }

        // Check tail
        if (pCurr === null) {
            if (iCurr === null) return bindings;
            return null; // Input too long
        }

        // Dotted pattern tail: (a . b)
        // pCurr is the tail (b)
        // Match tail against remaining input
        const tailBindings = matchPattern(pCurr, iCurr, literals, ellipsisName, useSiteEnv, expansionScope);
        if (!tailBindings) return null;
        mergeBindings(bindings, tailBindings, false);

        return bindings;
    }

    return null;
}

/**
 * Counts the number of Cons pairs in a list (proper or improper).
 * @param {*} list 
 * @returns {number}
 */
function countPairs(list) {
    let count = 0;
    let curr = list;
    while (curr instanceof Cons) {
        count++;
        curr = curr.cdr;
    }
    return count;
}

/**
 * Merges source bindings into target bindings.
 * @param {Map} target 
 * @param {Map} source 
 * @param {boolean} isEllipsis - If true, append values to a list.
 */
function mergeBindings(target, source, isEllipsis) {
    for (const [key, val] of source) {
        if (isEllipsis) {
            if (!target.has(key)) {
                target.set(key, []);
            }
            const list = target.get(key);
            if (!Array.isArray(list)) {
                // Should not happen if pattern is well-formed (vars don't repeat)
                throw new SchemeSyntaxError(`Pattern variable '${key}' used in both ellipsis and non-ellipsis context`, null, 'syntax-rules');
            }
            list.push(val);
        } else {
            if (target.has(key)) {
                throw new SchemeSyntaxError(`Duplicate pattern variable '${key}'`, null, 'syntax-rules');
            }
            target.set(key, val);
        }
    }
}

/**
 * Transcribes a template literally (for escaped ellipsis handling).
 * Marks all identifiers with the expansion scope.
 * 
 * @param {*} template - The template to transcribe
 * @param {Map} bindings - Pattern variable bindings
 * @param {number|null} expansionScope - Scope ID for marking free variables
 * @returns {*} The transcribed literal
 */
function transcribeLiteral(template, bindings, expansionScope) {
    // Symbol or SyntaxObject: substitute pattern variables, keep others with scope mark
    if (template instanceof Symbol$1 || template instanceof SyntaxObject$1) {
        let name = null;
        if (template instanceof Symbol$1) name = template.name;
        else if (template instanceof SyntaxObject$1) {
            name = (template.name instanceof Symbol$1) ? template.name.name : template.name;
        }

        // If it's the ellipsis symbol, keep it literal
        if (name === '...') {
            return template;
        }

        // Pattern variable → substitute
        if (bindings.has(template)) {
            return bindings.get(template);
        }

        // All other identifiers: mark with expansion scope (pure marks hygiene)
        if (expansionScope !== null &&
            !SPECIAL_FORMS$1.has(name) &&
            !globalMacroRegistry.isMacro(name)) {
            if (template instanceof SyntaxObject$1) {
                return template.flipScope(expansionScope);
            }
            return internSyntax(name, new Set([expansionScope]));
        }

        return template;
    }

    // Literals
    if (template === null || typeof template !== 'object') {
        return template;
    }

    // Lists - recurse but treat ... literally
    if (template instanceof Cons) {
        const car = transcribeLiteral(template.car, bindings, expansionScope);
        const cdr = transcribeLiteral(template.cdr, bindings, expansionScope);
        return new Cons(car, cdr);
    }

    return template;
}

/**
 * Transcribes a template using the bindings.
 * All template identifiers are marked with expansionScope for pure marks hygiene.
 * 
 * @param {*} template - The template to transcribe
 * @param {Map<string, *>} bindings - Pattern variable bindings
 * @param {number|null} expansionScope - Scope ID for marking identifiers (per-expansion)
 * @param {string} ellipsisName - The ellipsis identifier (default '...')
 * @param {Array} literals - List of literal identifiers
 * @param {Environment|null} capturedEnv - Captured lexical environment
 * @returns {*} Expanded expression.
 */
function transcribe(template, bindings, expansionScope = null, ellipsisName = '...', literals = new Set(), capturedEnv = null) {
    if (template === null) return null;

    // 1. Variables (Symbols or SyntaxObjects)
    if (template instanceof Symbol$1 || template instanceof SyntaxObject$1) {
        // Unwrap SyntaxObject if it wraps a Cons list (recurse on content)
        if (template instanceof SyntaxObject$1 && template.name instanceof Cons) {
            return transcribe(template.name, bindings, expansionScope, ellipsisName, literals, capturedEnv);
        }

        const name = template instanceof SyntaxObject$1 ? template.name : template.name;

        // Pattern variable → substitute with user input
        // Apply scope flip to the substituted value (Anti-Mark + Mark cancellation).
        if (bindings.has(template)) {
            const value = bindings.get(template);
            if (expansionScope !== null) {
                return flipScopeInExpression(value, expansionScope);
            }
            return value;
        }

        // Lexical binding from captured environment
        // If the macro was defined in a lexical scope, resolve local bindings
        if (capturedEnv && !SPECIAL_FORMS$1.has(name) && !globalMacroRegistry.isMacro(name)) {
            const lexicalRename = capturedEnv.lookup(template);
            if (lexicalRename) {
                // Return SyntaxObject with scope info so ScopedVariable can resolve it
                if (template instanceof SyntaxObject$1) {
                    return internSyntax(lexicalRename, template.scopes).flipScope(expansionScope);
                }
                return internSyntax(lexicalRename, new Set([expansionScope]));
            }
        }

        // All other identifiers (free variables, introduced bindings): mark with expansion scope
        // This is the core of pure marks hygiene - introduced bindings get the same
        // treatment as free variables, making them distinguishable by scope sets
        if (expansionScope !== null &&
            !SPECIAL_FORMS$1.has(name) &&
            !globalMacroRegistry.isMacro(name)) {

            if (template instanceof SyntaxObject$1) {
                return template.flipScope(expansionScope);
            }
            return internSyntax(name, new Set([expansionScope]));
        }

        // Fallback: keep as-is (primitives, special forms, macros, or no expansionScope)
        return template;
    }

    // 2. Literals
    if (typeof template !== 'object') {
        return template;
    }

    // 3. Lists (Cons)
    if (template instanceof Cons) {
        let carName = null;
        if (template.car instanceof Symbol$1) {
            carName = template.car.name;
        } else if (template.car instanceof SyntaxObject$1) {
            carName = (template.car.name instanceof Symbol$1) ? template.car.name.name : template.car.name;
        }

        // Escaped ellipsis (<ellipsis> <template>)
        // Per R7RS 4.3.2, (<ellipsis> <template>) means <template> is treated literally
        // This applies to the custom ellipsis name if one was specified
        if (carName === ellipsisName) {
            if (template.cdr instanceof Cons && template.cdr.cdr === null) {
                return transcribeLiteral(template.cdr.car, bindings, expansionScope);
            }
        }

        // Check for ellipsis in template: (item <ellipsis> . rest)
        const nextCar = template.cdr instanceof Cons ? template.cdr.car : null;
        const isEllipsis = nextCar && isEllipsisIdentifier(nextCar, ellipsisName, Array.from(literals));

        if (isEllipsis) {
            const item = template.car;
            const restTemplate = template.cdr.cdr;

            // Find pattern variables used in the repeating item
            const varsInItem = getPatternVars(item, bindings);

            // Separate into list bindings (ellipsis) and scalar bindings
            const listVars = varsInItem.filter(v => Array.isArray(bindings.get(v)));

            if (listVars.length === 0) {
                throw new SchemeSyntaxError('Ellipsis template must contain at least one pattern variable bound to a list', null, 'syntax-rules');
            }

            // Check lengths of list vars
            const lengths = listVars.map(v => bindings.get(v).length);
            const len = lengths[0];
            if (!lengths.every(l => l === len)) {
                throw new SchemeSyntaxError('Ellipsis expansion: variable lengths do not match', null, 'syntax-rules');
            }

            // Expand N times
            let expandedList = transcribe(restTemplate, bindings, expansionScope, ellipsisName, literals, capturedEnv);

            for (let i = len - 1; i >= 0; i--) {
                const subBindings = new Map(bindings);
                for (const v of listVars) {
                    subBindings.set(v, bindings.get(v)[i]);
                }
                const expandedItem = transcribe(item, subBindings, expansionScope, ellipsisName, literals, capturedEnv);
                expandedList = new Cons(expandedItem, expandedList);
            }

            return expandedList;
        } else {
            // Regular cons
            return new Cons(
                transcribe(template.car, bindings, expansionScope, ellipsisName, literals, capturedEnv),
                transcribe(template.cdr, bindings, expansionScope, ellipsisName, literals, capturedEnv)
            );
        }
    }

    return template;
}

/**
 * Finds all pattern variables used in a template.
 * @param {*} template 
 * @param {Map} bindings 
 * @returns {Array<string>}
 */
function getPatternVars(template, bindings) {
    const vars = new Set();
    function traverse(node) {
        // Handle both Symbol and SyntaxObject
        if (node instanceof Symbol$1 || node instanceof SyntaxObject$1) {
            if (bindings.has(node)) {
                vars.add(node);
            }
        } else if (node instanceof Cons) {
            traverse(node.car);
            traverse(node.cdr);
        }
    }
    traverse(template);
    return Array.from(vars);
}

/**
 * Collects all pattern variables in a pattern.
 * @param {*} pattern 
 * @param {Array<Symbol|SyntaxObject>} literals 
 * @param {string} ellipsisName - The ellipsis identifier
 * @returns {Set<string>}
 */
function collectPatternVars(pattern, literals, ellipsisName = '...') {
    const vars = new Set();
    function traverse(node) {
        // Handle both Symbol and SyntaxObject
        if (node instanceof Symbol$1 || node instanceof SyntaxObject$1) {
            const name = node instanceof SyntaxObject$1 ? node.name : node.name;
            if (name === '_') return;
            if (name === ellipsisName) return; // Skip ellipsis
            if (literals.some(l => identifierEquals(l, node))) return;
            vars.add(node);
        } else if (node instanceof Cons) {
            traverse(node.car);
            traverse(node.cdr);
        }
    }
    traverse(pattern);
    return vars;
}

/**
 * Core Form Handlers
 * 
 * Handlers for fundamental Scheme special forms:
 * quote, if, lambda, let, letrec, set!, define, begin
 */


// These will be set by the analyzer when it initializes
let analyze$2;
let generateUniqueName$1;

/**
 * Initializes the core forms with dependencies from the main analyzer.
 * This breaks the circular dependency between core_forms and analyzer.
 * @param {Object} deps - Dependencies
 */
function initCoreForms(deps) {
    analyze$2 = deps.analyze;
    generateUniqueName$1 = deps.generateUniqueName;
}

// (No local currentMacroRegistry - now in InterpreterContext)

function analyzeWithCurrentMacroRegistry(exp, syntacticEnv, ctx) {
    if (exp instanceof Cons) {
        const tag = exp.car;
        if (tag instanceof Symbol$1 && ctx.currentMacroRegistry.isMacro(tag.name)) {
            const transformer = ctx.currentMacroRegistry.lookup(tag.name);
            const expanded = transformer(exp, syntacticEnv);
            return analyzeWithCurrentMacroRegistry(expanded, syntacticEnv, ctx);
        }
    }
    return analyze$2(exp, syntacticEnv, ctx);
}


// =============================================================================
// Handler Functions
// =============================================================================

function analyzeQuote(exp, syntacticEnv, ctx) {
    const text = cadr(exp);
    return new LiteralNode(unwrapSyntax(text));
}

function analyzeIf(exp, syntacticEnv, ctx) {
    const test = analyze$2(cadr(exp), syntacticEnv, ctx);
    const consequent = analyze$2(caddr(exp), syntacticEnv, ctx);
    let alternative;

    if (cdddr(exp) === null) {
        alternative = new LiteralNode(undefined);
    } else {
        alternative = analyze$2(exp.cdr.cdr.cdr.car, syntacticEnv, ctx);
    }

    return new IfNode(test, consequent, alternative);
}

function analyzeLambda(exp, syntacticEnv, ctx) {
    const paramsPart = cadr(exp);
    const body = cddr(exp);

    if (body === null) {
        throw new SchemeSyntaxError('body cannot be empty', exp, 'lambda');
    }

    const newParams = [];
    let newEnv = syntacticEnv;
    let restParamRenamed = null;

    let curr = paramsPart;

    // Handle: (lambda single-symbol body...)
    if (!(curr instanceof Cons) && (curr instanceof Symbol$1 || isSyntaxObject(curr))) {
        const name = (curr instanceof Symbol$1) ? curr.name : syntaxName(curr);
        restParamRenamed = generateUniqueName$1(name, ctx);
        newEnv = newEnv.extend(curr, restParamRenamed);
        return new LambdaNode(newParams, analyzeBody(body, newEnv, ctx), restParamRenamed);
    }

    while (curr instanceof Cons) {
        const param = curr.car;
        if (!(param instanceof Symbol$1) && !isSyntaxObject(param)) {
            throw new SchemeSyntaxError('parameter must be a symbol', param, 'lambda');
        }
        const name = (param instanceof Symbol$1) ? param.name : syntaxName(param);
        const renamed = generateUniqueName$1(name, ctx);

        newParams.push(renamed);
        newEnv = newEnv.extend(param, renamed);

        curr = curr.cdr;
    }

    if (curr !== null) {
        if (curr instanceof Symbol$1 || isSyntaxObject(curr)) {
            const name = (curr instanceof Symbol$1) ? curr.name : syntaxName(curr);
            restParamRenamed = generateUniqueName$1(name, ctx);
            newEnv = newEnv.extend(curr, restParamRenamed);
        }
    }

    return new LambdaNode(newParams, analyzeScopedBody(body, newEnv, ctx), restParamRenamed);
}

function analyzeScopedBody(body, syntacticEnv, ctx) {
    const localRegistry = new MacroRegistry(ctx.currentMacroRegistry);
    const savedRegistry = ctx.currentMacroRegistry;
    ctx.currentMacroRegistry = localRegistry;
    try {
        return analyzeBody(body, syntacticEnv, ctx);
    } finally {
        ctx.currentMacroRegistry = savedRegistry;
    }
}

function analyzeBody(body, syntacticEnv, ctx) {
    const bodyArray = toArray(body);

    let extendedEnv = syntacticEnv;
    for (const exp of bodyArray) {
        if (exp instanceof Cons) {
            const head = exp.car;
            const headName = (head instanceof Symbol$1) ? head.name :
                (isSyntaxObject(head)) ? syntaxName(head) : null;

            if (headName === 'define') {
                const defHead = cadr(exp);
                let definedName;
                let bindKey = defHead;

                if (defHead instanceof Cons) {
                    const nameObj = car(defHead);
                    definedName = (nameObj instanceof Symbol$1) ? nameObj.name : syntaxName(nameObj);
                    bindKey = nameObj;
                } else if (defHead instanceof Symbol$1 || isSyntaxObject(defHead)) {
                    definedName = (defHead instanceof Symbol$1) ? defHead.name : syntaxName(defHead);
                }

                if (definedName) {
                    extendedEnv = extendedEnv.extend(bindKey, definedName);
                }
            }
        }
    }

    const exprs = bodyArray.map(e => analyze$2(e, extendedEnv, ctx));
    if (exprs.length === 1) {
        return exprs[0];
    }
    return new BeginNode(exprs);
}

function analyzeBegin(exp, syntacticEnv, ctx) {
    const body = cdr(exp);
    return analyzeBody(body, syntacticEnv, ctx);
}

function analyzeLet(exp, syntacticEnv, ctx) {
    const bindings = cadr(exp);
    const body = cddr(exp);

    // Named let check
    if (bindings instanceof Symbol$1 || isSyntaxObject(bindings)) {
        const loopName = bindings;
        const bindPairs = caddr(exp);
        const namedBody = cdddr(exp);

        const vars = [];
        const vals = [];
        let curr = bindPairs;
        while (curr instanceof Cons) {
            const pair = curr.car;
            vars.push(car(pair));
            vals.push(cadr(pair));
            curr = curr.cdr;
        }

        const varsList = vars.reduceRight((acc, el) => cons(el, acc), null);
        const valsList = vals.reduceRight((acc, el) => cons(el, acc), null);

        const lambdaExp = cons(intern('lambda'), cons(varsList, namedBody));
        const letrecBindings = list(list(loopName, lambdaExp));
        const initialCall = cons(loopName, valsList);

        const letrecExp = list(intern('letrec'), letrecBindings, initialCall);
        return analyzeLetRec(letrecExp, syntacticEnv, ctx);
    }

    const vars = [];
    const args = [];
    const renos = [];
    let newEnv = syntacticEnv;

    let curr = bindings;
    while (curr instanceof Cons) {
        const pair = curr.car;
        const varObj = car(pair);
        const valObj = cadr(pair);

        const name = (varObj instanceof Symbol$1) ? varObj.name : syntaxName(varObj);
        const renamed = generateUniqueName$1(name, ctx);

        vars.push(renamed);
        renos.push({ id: varObj, name: renamed });
        args.push(analyze$2(valObj, syntacticEnv, ctx));

        curr = curr.cdr;
    }

    for (const r of renos) {
        newEnv = newEnv.extend(r.id, r.name);
    }

    return new TailAppNode(
        new LambdaNode(vars, analyzeScopedBody(body, newEnv, ctx)),
        args
    );
}

function analyzeLetRec(exp, syntacticEnv, ctx) {
    const bindings = cadr(exp);
    const body = cddr(exp);

    let newEnv = syntacticEnv;
    const vars = [];
    const args = [];
    const renos = [];

    let curr = bindings;
    while (curr instanceof Cons) {
        const pair = curr.car;
        const varObj = car(pair);

        const name = (varObj instanceof Symbol$1) ? varObj.name : syntaxName(varObj);
        const renamed = generateUniqueName$1(name, ctx);

        vars.push(renamed);
        renos.push({ id: varObj, name: renamed, valObj: cadr(pair) });

        newEnv = newEnv.extend(varObj, renamed);
        curr = curr.cdr;
    }

    for (const r of renos) {
        args.push(analyze$2(r.valObj, newEnv, ctx));
    }

    const undefinedLit = new LiteralNode(undefined);
    const setExprs = [];
    for (let i = 0; i < renos.length; i++) {
        setExprs.push(new SetNode(renos[i].name, args[i]));
    }

    const bodyExpr = analyzeScopedBody(body, newEnv, ctx);
    const seq = new BeginNode([...setExprs, bodyExpr]);

    return new TailAppNode(
        new LambdaNode(vars, seq),
        vars.map(_ => undefinedLit)
    );
}

function analyzeSet(exp, syntacticEnv, ctx) {
    const varObj = cadr(exp);
    const valExpr = analyze$2(caddr(exp), syntacticEnv, ctx);

    if (varObj instanceof Cons) {
        const opName = (varObj.car instanceof Symbol$1) ? varObj.car.name :
            (isSyntaxObject(varObj.car) ? syntaxName(varObj.car) : null);

        if (opName === 'js-ref') {
            const objExpr = analyze$2(cadr(varObj), syntacticEnv, ctx);
            const propName = caddr(varObj);
            return new TailAppNode(
                new VariableNode('js-set!'),
                [objExpr, new LiteralNode(propName), valExpr]
            );
        }
    }

    const renamed = syntacticEnv.lookup(varObj);
    if (renamed) {
        return new SetNode(renamed, valExpr);
    }

    const name = (varObj instanceof Symbol$1) ? varObj.name : syntaxName(varObj);
    return new SetNode(name, valExpr);
}

function analyzeDefine(exp, syntacticEnv, ctx) {
    const head = cadr(exp);
    if (head instanceof Cons) {
        const nameObj = car(head);
        const args = cdr(head);
        const body = cddr(exp);

        const lambdaExp = cons(intern('lambda'), cons(args, body));
        const valExpr = analyzeLambda(lambdaExp, syntacticEnv, ctx);

        const name = (nameObj instanceof Symbol$1) ? nameObj.name : syntaxName(nameObj);
        return new DefineNode(name, valExpr);
    }

    const varObj = head;
    const valExpr = analyze$2(caddr(exp), syntacticEnv, ctx);

    const name = (varObj instanceof Symbol$1) ? varObj.name : syntaxName(varObj);
    return new DefineNode(name, valExpr);
}

// =============================================================================
// Registration
// =============================================================================

function registerCoreForms() {
    registerHandler('quote', analyzeQuote);
    registerHandler('if', analyzeIf);
    registerHandler('lambda', analyzeLambda);
    registerHandler('let', analyzeLet);
    registerHandler('letrec', analyzeLetRec);
    registerHandler('set!', analyzeSet);
    registerHandler('define', analyzeDefine);
    registerHandler('begin', analyzeBegin);
    registerHandler('define-syntax', analyzeDefineSyntax);
    registerHandler('let-syntax', analyzeLetSyntax);
    registerHandler('letrec-syntax', analyzeLetrecSyntax);
    registerHandler('quasiquote', (exp, env, ctx) => expandQuasiquote(cadr(exp), env, ctx));
}

function analyzeDefineSyntax(exp, syntacticEnv = null, ctx) {
    const nameObj = cadr(exp);
    const name = (nameObj instanceof Symbol$1) ? nameObj.name : syntaxName(nameObj);
    const transformerSpec = caddr(exp);

    if (transformerSpec instanceof Cons) {
        const srKeyword = car(transformerSpec);
        const isSyntaxRules = (srKeyword instanceof Symbol$1 && srKeyword.name === 'syntax-rules') ||
            (isSyntaxObject(srKeyword) && syntaxName(srKeyword) === 'syntax-rules');

        if (isSyntaxRules) {
            let ellipsisName = '...';
            let literalsList;
            let clausesList;
            const afterSyntaxRules = cdr(transformerSpec);
            const firstArg = car(afterSyntaxRules);

            if (firstArg instanceof Cons || firstArg === null) {
                literalsList = firstArg;
                clausesList = cdr(afterSyntaxRules);
            } else if (firstArg instanceof Symbol$1 || firstArg instanceof SyntaxObject) {
                ellipsisName = firstArg instanceof Symbol$1 ? firstArg.name : syntaxName(firstArg);
                literalsList = cadr(afterSyntaxRules);
                clausesList = cddr(afterSyntaxRules);
            } else {
                return new LiteralNode(null);
            }

            const literals = [];
            let curr = literalsList;
            while (curr instanceof Cons) {
                literals.push(curr.car);
                curr = curr.cdr;
            }

            const clauses = [];
            curr = clausesList;
            while (curr instanceof Cons) {
                const clause = curr.car;
                clauses.push([car(clause), cadr(clause)]);
                curr = curr.cdr;
            }

            const currentScopes = globalContext.getDefiningScopes();
            const definingScope = currentScopes.length > 0 ? currentScopes[currentScopes.length - 1] : GLOBAL_SCOPE_ID;
            const transformer = compileSyntaxRules(literals, clauses, definingScope, ellipsisName, syntacticEnv);
            ctx.currentMacroRegistry.define(name, transformer);
            return new LiteralNode(null);
        }
    }
    return new LiteralNode(null);
}

function analyzeLetSyntax(exp, syntacticEnv, ctx) {
    const bindings = cadr(exp);
    const body = cddr(exp);
    if (body === null) throw new SchemeSyntaxError('body cannot be empty', exp, 'let-syntax');

    const localRegistry = new MacroRegistry(ctx.currentMacroRegistry);
    let curr = bindings;
    while (curr instanceof Cons) {
        const binding = curr.car;
        const name = syntaxName(car(binding));
        const transformerSpec = cadr(binding);
        const transformer = compileTransformerSpec(transformerSpec, syntacticEnv);
        localRegistry.define(name, transformer);
        curr = curr.cdr;
    }

    const savedRegistry = ctx.currentMacroRegistry;
    ctx.currentMacroRegistry = localRegistry;
    try {
        const letExp = cons(intern('let'), cons(null, body));
        return analyzeWithCurrentMacroRegistry(letExp, syntacticEnv, ctx);
    } finally {
        ctx.currentMacroRegistry = savedRegistry;
    }
}

function analyzeLetrecSyntax(exp, syntacticEnv, ctx) {
    const bindings = cadr(exp);
    const body = cddr(exp);
    if (body === null) throw new SchemeSyntaxError('body cannot be empty', exp, 'letrec-syntax');

    const localRegistry = new MacroRegistry(ctx.currentMacroRegistry);
    const savedRegistry = ctx.currentMacroRegistry;
    ctx.currentMacroRegistry = localRegistry;

    try {
        let curr = bindings;
        while (curr instanceof Cons) {
            const binding = curr.car;
            const name = syntaxName(car(binding));
            const transformerSpec = cadr(binding);
            const transformer = compileTransformerSpec(transformerSpec, syntacticEnv);
            localRegistry.define(name, transformer);
            curr = curr.cdr;
        }

        const bodyExprs = toArray(body);
        const analyzedBody = bodyExprs.map(e => analyzeWithCurrentMacroRegistry(e, syntacticEnv, ctx));
        if (analyzedBody.length === 1) return analyzedBody[0];
        return new BeginNode(analyzedBody);
    } finally {
        ctx.currentMacroRegistry = savedRegistry;
    }
}

function compileTransformerSpec(transformerSpec, syntacticEnv = null) {
    if (!(transformerSpec instanceof Cons)) throw new SchemeSyntaxError('Transformer must be (syntax-rules ...)', transformerSpec, 'syntax-rules');
    const keyword = car(transformerSpec);
    const keywordName = (keyword instanceof Symbol$1) ? keyword.name : (isSyntaxObject(keyword) ? syntaxName(keyword) : null);
    if (keywordName !== 'syntax-rules') throw new SchemeSyntaxError('Transformer must be (syntax-rules ...)', transformerSpec, 'syntax-rules');

    let literalsList = cadr(transformerSpec);
    const clausesList = cddr(transformerSpec);
    const literals = [];
    let curr = literalsList;
    while (curr instanceof Cons) {
        literals.push(curr.car);
        curr = curr.cdr;
    }

    const clauses = [];
    curr = clausesList;
    while (curr instanceof Cons) {
        const clause = curr.car;
        clauses.push([car(clause), cadr(clause)]);
        curr = curr.cdr;
    }

    const currentScopes = globalContext.getDefiningScopes();
    const definingScope = currentScopes.length > 0 ? currentScopes[currentScopes.length - 1] : GLOBAL_SCOPE_ID;
    return compileSyntaxRules(literals, clauses, definingScope, '...', syntacticEnv);
}

function expandQuasiquote(exp, syntacticEnv, ctx, nesting = 0) {
    if (isTaggedList(exp, 'quasiquote')) {
        return listApp('list', [new LiteralNode(intern('quasiquote')), expandQuasiquote(cadr(exp), syntacticEnv, ctx, nesting + 1)]);
    }
    if (isTaggedList(exp, 'unquote')) {
        if (nesting === 0) return analyze$2(cadr(exp), syntacticEnv, ctx);
        return listApp('list', [new LiteralNode(intern('unquote')), expandQuasiquote(cadr(exp), syntacticEnv, ctx, nesting - 1)]);
    }
    if (isTaggedList(exp, 'unquote-splicing')) {
        if (nesting === 0) throw new SchemeSyntaxError('unquote-splicing not allowed at top level', exp, 'quasiquote');
        return listApp('list', [new LiteralNode(intern('unquote-splicing')), expandQuasiquote(cadr(exp), syntacticEnv, ctx, nesting - 1)]);
    }
    if (exp instanceof Cons) {
        if (isTaggedList(exp.car, 'unquote-splicing') && nesting === 0) {
            return listApp('append', [analyze$2(cadr(exp.car), syntacticEnv, ctx), expandQuasiquote(exp.cdr, syntacticEnv, ctx, nesting)]);
        }
        return listApp('cons', [expandQuasiquote(exp.car, syntacticEnv, ctx, nesting), expandQuasiquote(exp.cdr, syntacticEnv, ctx, nesting)]);
    }
    if (Array.isArray(exp)) {
        let hasSplicing = false;
        for (const elem of exp) if (isTaggedList(elem, 'unquote-splicing') && nesting === 0) { hasSplicing = true; break; }
        if (hasSplicing) {
            const listForm = exp.reduceRight((acc, el) => cons(el, acc), null);
            return listApp('list->vector', [expandQuasiquote(listForm, syntacticEnv, ctx, nesting)]);
        }
        return listApp('vector', exp.map(e => expandQuasiquote(e, syntacticEnv, ctx, nesting)));
    }
    return new LiteralNode(unwrapSyntax(exp));
}

function isTaggedList(exp, tag) {
    if (!(exp instanceof Cons)) return false;
    const head = exp.car;
    if (head instanceof Symbol$1) return head.name === tag;
    if (isSyntaxObject(head)) return syntaxName(head) === tag;
    return false;
}

function listApp(funcName, args) {
    return new TailAppNode(new VariableNode(funcName), args);
}

/**
 * Module Form Handlers
 * 
 * Handlers for module-related special forms:
 * import, define-library
 */


// Set by analyzer initialization
let analyze$1;

/**
 * Initializes the module forms with dependencies from the main analyzer.
 * @param {Object} deps - Dependencies
 */
function initModuleForms(deps) {
    analyze$1 = deps.analyze;
}

// =============================================================================
// Handler Functions
// =============================================================================

function analyzeImport(exp, syntacticEnv, ctx) {
    const specs = toArray(cdr(exp)).map(spec => parseImportSet(spec));
    return new ImportNode(specs, loadLibrarySync, applyImports, analyze$1);
}

function analyzeDefineLibrary(exp, syntacticEnv, ctx) {
    const libDef = parseDefineLibrary(exp);
    return new DefineLibraryNode(libDef, evaluateLibraryDefinitionSync, analyze$1);
}

function analyzeCondExpand(exp, syntacticEnv, ctx) {
    const expanded = expandCondExpand(exp);
    return analyze$1(expanded, syntacticEnv, ctx);
}

function expandCondExpand(exp) {
    const clauses = toArray(exp.cdr);
    for (const clause of clauses) {
        const clauseArr = toArray(clause);
        if (clauseArr.length === 0) continue;
        const featureReq = clauseArr[0];
        let matched = false;
        if (featureReq instanceof Symbol$1 && featureReq.name === 'else') {
            matched = true;
        } else {
            matched = evaluateFeatureRequirement(featureReq);
        }
        if (matched) {
            if (clauseArr.length === 1) return list(intern('begin'));
            if (clauseArr.length === 2) return clauseArr[1];
            return cons(intern('begin'), list(...clauseArr.slice(1)));
        }
    }
    throw new SchemeSyntaxError('no matching clause and no else', exp, 'cond-expand');
}


// =============================================================================
// Registration
// =============================================================================

function registerModuleForms() {
    registerHandler('import', analyzeImport);
    registerHandler('define-library', analyzeDefineLibrary);
    registerHandler('cond-expand', analyzeCondExpand);
}

/**
 * Analyzer Handler Registry Index
 * 
 * Initializes and registers all special form handlers.
 * Provides the main entry point for handler initialization.
 */


/**
 * Initializes all handler modules with dependencies from the main analyzer.
 * Must be called before any analysis occurs.
 * 
 * @param {Object} deps - Dependencies from the main analyzer
 * @param {Function} deps.analyze - The main analyze function
 * @param {Function} deps.generateUniqueName - Unique name generator
 */
function initHandlers(deps) {
    initCoreForms(deps);
    initModuleForms(deps);
}

/**
 * Registers all built-in special form handlers.
 * Should be called once during module initialization.
 */
function registerAllHandlers() {
    registerCoreForms();
    registerModuleForms();
}

/**
 * Analyzes an S-expression and converts it to our AST object tree.
 */

/**
 * Maps scoped identifiers to unique runtime names.
 * We'll use a custom class for the Syntactic Environment.
 */
class SyntacticEnv {
  constructor(parent = null) {
    this.parent = parent;
    this.bindings = []; // Array of { id: SyntaxObject|Symbol, newName: string }
  }

  extend(id, newName) {
    const newEnv = new SyntacticEnv(this);
    newEnv.bindings.push({ id, newName });
    return newEnv;
  }

  lookup(id) {
    // Linear scan is okay for local scopes usually, but could be optimized.
    // We match based on identifierEquals logic.
    for (const binding of this.bindings) {
      if (identifierEquals(binding.id, id)) {
        return binding.newName;
      }
    }
    if (this.parent) {
      return this.parent.lookup(id);
    }
    return null;
  }
}

// Module-level fallback counter (for backwards compatibility)
let _uniqueIdCounter = 0;

/**
 * Generates a unique name for a variable binding.
 * Uses context if provided, otherwise falls back to module-level counter.
 * @param {string} baseName - Base name for the variable
 * @param {InterpreterContext} [context] - Optional context for isolation
 * @returns {string} Unique variable name
 */
function generateUniqueName(baseName, context = null) {
  if (context) {
    return `${baseName}_$${context.freshUniqueId()}`;
  }
  // Fallback to global counter for backwards compatibility
  _uniqueIdCounter++;
  return `${baseName}_$${_uniqueIdCounter}`;
}

// (No module-local uniqueIdCounter - now in InterpreterContext)

// Initialize modular handlers
initHandlers({
  analyze,
  generateUniqueName
});
registerAllHandlers();

function analyze(exp, syntacticEnv = null, context = null) {
  // Use global context if none provided
  const ctx = context || globalContext;

  if (!syntacticEnv) {
    syntacticEnv = new SyntacticEnv();
  }

  if (exp instanceof Executable) {
    return exp;
  }


  // console.log("Analyzing:", exp instanceof Cons ? JSON.stringify(exp) : exp.toString());
  if (exp === null) {
    console.error("Analyze called with null!");
    throw new SchemeSyntaxError('cannot analyze null (empty list)', null, 'analyze');
  }
  if (typeof exp === 'number') {
    return new LiteralNode(exp);
  }
  if (typeof exp === 'string') {
    return new LiteralNode(exp);
  }
  if (typeof exp === 'boolean') {
    return new LiteralNode(exp);
  }
  if (Array.isArray(exp)) {
    return new LiteralNode(exp);
  }
  if (exp instanceof Uint8Array) {
    return new LiteralNode(exp);
  }
  // Rational and Complex numbers are self-evaluating
  if (exp instanceof Rational || exp instanceof Complex) {
    return new LiteralNode(exp);
  }

  if (exp instanceof Symbol$1 || isSyntaxObject(exp)) {
    return analyzeVariable(exp, syntacticEnv);
  }

  if (exp instanceof Cons) {
    const operator = car(exp);

    // Check for macro expansion (if not shadowed locally)
    let isShadowed = false;
    if (operator instanceof Symbol$1 || isSyntaxObject(operator)) {
      if (syntacticEnv && syntacticEnv.lookup(operator)) {
        isShadowed = true;
      }
    }

    if (!isShadowed) {
      const opNameForMacro = (operator instanceof Symbol$1) ? operator.name :
        (isSyntaxObject(operator) ? syntaxName(operator) : null);

      if (opNameForMacro && ctx.currentMacroRegistry.isMacro(opNameForMacro)) {
        const transformer = ctx.currentMacroRegistry.lookup(opNameForMacro);
        try {
          const expanded = transformer(exp, syntacticEnv);
          return analyze(expanded, syntacticEnv, ctx);
        } catch (e) {
          throw new SchemeSyntaxError(`Error expanding macro: ${e.message}`, exp, opNameForMacro);
        }
      }
    }

    // Check if operator is a special form keyword
    const opName = (operator instanceof Symbol$1) ? operator.name :
      (isSyntaxObject(operator) ? syntaxName(operator) : null);

    if (opName) {
      const handler = getHandler(opName);
      if (handler) {
        return handler(exp, syntacticEnv, ctx);
      }
    }

    // Application
    return analyzeApplication(exp, syntacticEnv, ctx);
  }

  throw new SchemeSyntaxError(`Unknown expression type`, exp, 'analyze');
}


// =============================================================================
// Helper Functions
// =============================================================================

function analyzeVariable(exp, syntacticEnv, ctx) {
  // Check syntactic environment for alpha-renamed local binding
  const renamed = syntacticEnv.lookup(exp);
  if (renamed) {
    // It's a local variable! Use the renamed symbol.
    return new VariableNode(renamed);
  }

  // Not local -> Global / Free
  // If it's a syntax object, preserve scopes for global lookup
  if (isSyntaxObject(exp)) {
    return new ScopedVariable(syntaxName(exp), syntaxScopes(exp), globalScopeRegistry);
  } else {
    // Raw symbol
    return new VariableNode(exp.name);
  }
}


// =============================================================================
// Special Form Handlers
// =============================================================================

// analyzeApplication handles all non-special form list expressions (function calls)
function analyzeApplication(exp, syntacticEnv, ctx) {
  const fileArray = toArray(exp);
  const operator = fileArray[0];

  // Check for JS Method Call: (js-ref obj "method")(args...) -> (js-invoke obj "method" args...)
  if (operator instanceof Cons) {
    const opCar = car(operator);
    const opName = (opCar instanceof Symbol$1) ? opCar.name : (isSyntaxObject(opCar) ? syntaxName(opCar) : null);
    if (opName === 'js-ref') {
      const objExpr = analyze(cadr(operator), syntacticEnv, ctx);
      const methodName = caddr(operator);
      const argExprs = fileArray.slice(1).map(a => analyze(a, syntacticEnv, ctx));
      return new TailAppNode(new VariableNode('js-invoke'), [objExpr, new LiteralNode(methodName), ...argExprs]);
    }
  }

  const funcExpr = analyze(operator, syntacticEnv, ctx);
  const argExprs = fileArray.slice(1).map(a => analyze(a, syntacticEnv, ctx));
  return new TailAppNode(funcExpr, argExprs);
}

/**
 * Control Primitives for Scheme.
 * 
 * Provides control flow operations including apply, eval, dynamic-wind, and values.
 */


/**
 * Returns control primitives.
 * @param {Interpreter} interpreter - The interpreter instance.
 * @returns {Object} Map of primitive names to functions.
 */
function getControlPrimitives(interpreter) {
    /**
     * apply: Apply a procedure to a list of arguments.
     * (apply proc arg1 ... args)
     */
    const applyPrimitive = (proc, ...args) => {
        if (args.length === 0) {
            throw new SchemeTypeError('apply', 2, 'list', undefined);
        }

        // The last argument must be a list
        const lastArg = args.pop();
        let finalArgs = args;

        if (lastArg instanceof Cons) {
            finalArgs = finalArgs.concat(toArray(lastArg));
        } else if (lastArg === null) ; else {
            throw new SchemeTypeError('apply', args.length + 2, 'list', lastArg);
        }

        // Wrap args in Literals for the AST
        const argLiterals = finalArgs.map(val => new LiteralNode(val));

        // Return a TailCall to transfer control
        return new TailCall(
            new TailAppNode(new LiteralNode(proc), argLiterals),
            null // Use current environment
        );
    };

    /**
     * call-with-values: (call-with-values producer consumer)
     */
    const callWithValuesPrimitive = (producer, consumer) => {
        assertProcedure('call-with-values', 1, producer);
        assertProcedure('call-with-values', 2, consumer);
        return new TailCall(
            new CallWithValuesNode(producer, consumer),
            null
        );
    };

    const controlPrimitives = {
        'apply': applyPrimitive,

        /**
         * values: Return multiple values.
         */
        'values': (...args) => {
            if (args.length === 0) {
                return undefined;
            } else if (args.length === 1) {
                return args[0];
            } else {
                return new Values(args);
            }
        },

        'call-with-values': callWithValuesPrimitive,

        /**
         * eval: Evaluate an expression in an environment.
         */
        'eval': (expr, env) => {
            const ast = analyze(expr);
            return new TailCall(ast, env);
        },

        /**
         * interaction-environment: Returns the global environment.
         */
        'interaction-environment': () => {
            if (!interpreter.globalEnv) {
                throw new Error("interaction-environment: global environment not set");
            }
            return interpreter.globalEnv;
        },

        /**
         * null-environment: Returns a specifier for the environment that is 
         * empty except for bindings for standard syntactic keywords.
         * For R5RS compatibility.
         */
        'null-environment': (version) => {
            // R7RS only requires this for version 5 (R5RS)
            if (version !== 5) {
                throw new Error(`null-environment: unsupported version ${version}`);
            }
            // Return the global environment for now - proper implementation
            // would filter to only syntax keywords
            if (!interpreter.globalEnv) {
                throw new Error("null-environment: global environment not set");
            }
            return interpreter.globalEnv;
        },

        /**
         * dynamic-wind: Install before/after thunks.
         */
        'dynamic-wind': (before, thunk, after) => {
            assertProcedure('dynamic-wind', 1, before);
            assertProcedure('dynamic-wind', 2, thunk);
            assertProcedure('dynamic-wind', 3, after);
            return new TailCall(
                new DynamicWindInit(before, thunk, after),
                null
            );
        },

        /**
         * call-with-current-continuation: Capture the current continuation.
         */
        'call-with-current-continuation': (proc) => {
            assertProcedure('call-with-current-continuation', 1, proc);
            return new TailCall(new CallCCNode(new LiteralNode(proc)), null);
        },

        'call/cc': (proc) => {
            assertProcedure('call/cc', 1, proc);
            return new TailCall(new CallCCNode(new LiteralNode(proc)), null);
        },

        /**
         * procedure?: Type predicate for procedures.
         * Returns #t for Scheme closures, continuations, and JS functions.
         */
        'procedure?': (obj) => {
            // All callable functions are procedures
            // Scheme closures/continuations are now functions with markers
            return typeof obj === 'function' ||
                obj instanceof Closure ||
                obj instanceof Continuation;
        }
    };

    return controlPrimitives;
}

const GCPrimitives = {
    'garbage-collect-and-get-heap-usage': () => {
        if (typeof global !== 'undefined' && global.gc) {
            global.gc(); // Force GC (requires node --expose-gc)
            const used = process.memoryUsage().heapUsed;
            return used;
        } else {
            // In browser or environment without GC control, return 0
            // This effectively skips the strict check but allows the code to run.
            console.warn("GC not exposed. Heap test will not be accurate.");
            return 0;
        }
    }
};

/**
 * JavaScript Interop Primitives for Scheme.
 * 
 * Provides JavaScript evaluation and property access capabilities.
 */


/**
 * Interop primitives exported to Scheme.
 */
const interopPrimitives = {
    /**
     * Evaluates a string as JavaScript code.
     * @param {string} code - JavaScript code to evaluate.
     * @returns {*} Result of evaluation.
     */
    'js-eval': (code) => {
        assertString('js-eval', 1, code);
        return (0, eval)(code);
    },

    /**
     * Accesses a property on a JavaScript object.
     * Used by the reader's dot notation: obj.prop -> (js-ref obj "prop")
     * @param {Object} obj - The object to access.
     * @param {string} prop - The property name.
     * @returns {*} The property value.
     */
    'js-ref': (obj, prop) => {
        assertString('js-ref', 2, prop);
        if (obj === null || obj === undefined) {
            throw new SchemeError(`js-ref: cannot access property "${prop}" on ${obj}`, [obj, prop], 'js-ref');
        }
        return obj[prop];
    },

    /**
     * Sets a property on a JavaScript object.
     * Used by set! with dot notation: (set! obj.prop val) -> (js-set! obj "prop" val)
     * @param {Object} obj - The object to modify.
     * @param {string} prop - The property name.
     * @param {*} value - The value to set.
     * @returns {undefined}
     */
    'js-set!': (obj, prop, value) => {
        assertString('js-set!', 2, prop);
        if (obj === null || obj === undefined) {
            throw new SchemeError(`js-set!: cannot set property "${prop}" on ${obj}`, [obj, prop], 'js-set!');
        }
        obj[prop] = value;
        return undefined;
    },

    /**
     * Invokes a method on a JavaScript object.
     * Used by expanded dot notation: obj.method(args...) -> (js-invoke obj "method" args...)
     * @param {Object} obj - The object.
     * @param {string} method - The method name.
     * @param {...*} args - Arguments to the method.
     * @returns {*} Result of the method call.
     */
    'js-invoke': (obj, method, ...args) => {
        assertString('js-invoke', 2, method);
        if (obj === null || obj === undefined) {
            throw new SchemeError(`js-invoke: cannot call method "${method}" on ${obj}`, [obj, method], 'js-invoke');
        }
        const func = obj[method];
        if (typeof func !== 'function') {
            throw new SchemeTypeError('js-invoke', 2, 'function', func);
        }
        return func.apply(obj, args);
    },

    /**
     * Creates a plain JavaScript object from key-value pairs.
     * Keys are converted to strings following JS semantics:
     * - Scheme Symbol: uses the symbol's name property
     * - String: used verbatim
     * - Number: converted to string
     * - Other: String() conversion
     * @param {...*} args - Alternating keys and values.
     * @returns {Object} The new JavaScript object.
     */
    'js-obj': (...args) => {
        const obj = {};
        for (let i = 0; i < args.length; i += 2) {
            const key = args[i];
            const val = args[i + 1];
            // Convert key to string:
            // - Scheme Symbol (has .name property) -> use the symbol name
            // - String -> use verbatim
            // - Other -> String() conversion
            let keyStr;
            if (key && typeof key === 'object' && typeof key.name === 'string') {
                // Scheme Symbol object
                keyStr = key.name;
            } else if (typeof key === 'string') {
                keyStr = key;
            } else {
                keyStr = String(key);
            }
            obj[keyStr] = val;
        }
        return obj;
    },

    /**
     * Merges multiple objects/js-obj results into one.
     * Used for spread syntax in #{...} literals.
     * @param {...Object} objects - Objects to merge (left to right, later overrides earlier).
     * @returns {Object} The merged JavaScript object.
     */
    'js-obj-merge': (...objects) => {
        const result = {};
        for (const obj of objects) {
            if (obj && typeof obj === 'object') {
                Object.assign(result, obj);
            } else if (obj !== null && obj !== undefined) {
                throw new SchemeTypeError('js-obj-merge', 0, 'object', obj);
            }
        }
        return result;
    }
};

/**
 * Exception Primitives for Scheme.
 * 
 * Provides R7RS exception handling procedures:
 * - raise: Raise a non-continuable exception
 * - raise-continuable: Raise a continuable exception
 * - with-exception-handler: Install an exception handler
 * - error: Raise a SchemeError with message and irritants
 * - error-object?, error-object-message, error-object-irritants
 */


/**
 * Returns exception primitives.
 * @param {Interpreter} interpreter - The interpreter instance
 * @returns {Object} Map of primitive names to functions
 */
function getExceptionPrimitives(interpreter) {
    /**
     * raise: Raise a non-continuable exception.
     * If no handler is found, the exception becomes a JS error.
     */
    const raisePrimitive = (exception) => {
        return new TailCall(new RaiseNode(exception, false), null);
    };

    /**
     * raise-continuable: Raise a continuable exception.
     * The handler can return a value that becomes the result of raise-continuable.
     */
    const raiseContinuablePrimitive = (exception) => {
        return new TailCall(new RaiseNode(exception, true), null);
    };

    /**
     * with-exception-handler: Install an exception handler.
     * (with-exception-handler handler thunk)
     */
    const withExceptionHandlerPrimitive = (handler, thunk) => {
        return new TailCall(
            new WithExceptionHandlerInit(handler, thunk),
            null
        );
    };
    // Tell AppFrame not to wrap handler/thunk - we need raw Closures
    withExceptionHandlerPrimitive.skipBridge = true;

    /**
     * error: Create and raise a SchemeError.
     * (error message irritant ...)
     */
    const errorPrimitive = (message, ...irritants) => {
        const msg = typeof message === 'string' ? message : String(message);
        const err = new SchemeError(msg, irritants);
        return new TailCall(new RaiseNode(err, false), null);
    };

    return {
        'raise': raisePrimitive,
        'raise-continuable': raiseContinuablePrimitive,
        'with-exception-handler': withExceptionHandlerPrimitive,
        'error': errorPrimitive,

        /**
         * error-object?: Check if value is a SchemeError.
         */
        'error-object?': (obj) => obj instanceof SchemeError,

        /**
         * error-object-message: Get the error message.
         */
        'error-object-message': (obj) => {
            if (!(obj instanceof SchemeError)) {
                throw new SchemeError('error-object-message: expected error object', [obj]);
            }
            return obj.message;
        },

        /**
         * error-object-irritants: Get the error irritants as a list.
         */
        'error-object-irritants': (obj) => {
            if (!(obj instanceof SchemeError)) {
                throw new SchemeError('error-object-irritants: expected error object', [obj]);
            }
            return list(...obj.irritants);
        },

        /**
         * file-error?: Check if exception is a file-related error.
         * Returns #t for I/O errors like ENOENT, EACCES, etc.
         */
        'file-error?': (obj) => {
            if (obj instanceof SchemeError || obj instanceof Error) {
                const msg = obj.message || '';
                // Check for common Node.js file error codes
                return /ENOENT|EACCES|EEXIST|EISDIR|ENOTDIR|EMFILE|ENFILE|EBADF|EROFS|ENOSPC/.test(msg) ||
                    /no such file|permission denied|file exists|is a directory|not a directory/.test(msg.toLowerCase()) ||
                    /open|read|write|delete|rename|file/i.test(msg);
            }
            return false;
        },

        /**
         * read-error?: Check if exception is a read/parse error.
         * Returns #t for syntax errors, parse errors, etc.
         */
        'read-error?': (obj) => {
            if (obj instanceof SchemeError || obj instanceof Error) {
                const msg = obj.message || '';
                return /parse|syntax|unexpected|read|token|end of input/i.test(msg);
            }
            return false;
        }
    };
}

/**
 * Time Primitives
 * 
 * R7RS (scheme time) procedures.
 */


const timePrimitives = {
    /**
     * current-second: Returns the current time in seconds since epoch.
     * R7RS requires no arguments.
     * @returns {number} Seconds since 1970-01-01 00:00:00 UTC.
     */
    'current-second': (...args) => {
        assertArity('current-second', args, 0, 0);
        return Date.now() / 1000;
    },

    /**
     * current-jiffy: Returns the current jiffy count.
     * A jiffy is the smallest measurable time unit - we use milliseconds.
     * R7RS requires no arguments.
     * @returns {number} Current time in milliseconds.
     */
    'current-jiffy': (...args) => {
        assertArity('current-jiffy', args, 0, 0);
        // Use performance.now() if available for higher precision
        if (typeof performance !== 'undefined' && performance.now) {
            return Math.floor(performance.now());
        }
        return Date.now();
    },

    /**
     * jiffies-per-second: Returns the number of jiffies per second.
     * R7RS requires no arguments.
     * @returns {number} 1000 (milliseconds per second).
     */
    'jiffies-per-second': (...args) => {
        assertArity('jiffies-per-second', args, 0, 0);
        return 1000;
    }
};

/**
 * Process Context Primitives
 * 
 * R7RS (scheme process-context) procedures.
 * Provides environment-aware implementations (Node.js vs browser).
 */


// Check if running in Node.js
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

const processContextPrimitives = {
    /**
     * command-line: Returns a list of command line arguments.
     * R7RS requires no arguments.
     * @returns {Cons|null} Scheme list of command line arguments.
     */
    'command-line': (...args) => {
        assertArity('command-line', args, 0, 0);
        if (isNode) {
            // Convert JS array to Scheme list
            return list(...process.argv);
        }
        // Browser: return list with location as program name
        return list(typeof location !== 'undefined' ? location.href : 'scheme');
    },

    /**
     * exit: Exit the program with an optional status code.
     * R7RS allows 0 or 1 argument.
     * @param {number} [code=0] - Exit status code (must be exact integer).
     */
    'exit': (...args) => {
        assertArity('exit', args, 0, 1);
        let code = 0;
        if (args.length === 1) {
            // R7RS allows #t (success=0) or #f (failure=1) or exact integer
            if (args[0] === true) {
                code = 0;
            } else if (args[0] === false) {
                code = 1;
            } else {
                assertInteger('exit', 1, args[0]);
                code = args[0];
            }
        }
        if (isNode) {
            process.exit(code);
        }
        // Browser: no direct equivalent, throw an error
        throw new Error(`Program exit requested with code ${code}`);
    },

    /**
     * emergency-exit: Exit immediately without cleanup.
     * R7RS allows 0 or 1 argument.
     * @param {number} [code=0] - Exit status code.
     */
    'emergency-exit': (...args) => {
        assertArity('emergency-exit', args, 0, 1);
        let code = 0;
        if (args.length === 1) {
            if (args[0] === true) {
                code = 0;
            } else if (args[0] === false) {
                code = 1;
            } else {
                assertInteger('emergency-exit', 1, args[0]);
                code = args[0];
            }
        }
        if (isNode) {
            process.exit(code);
        }
        throw new Error(`Emergency exit requested with code ${code}`);
    },

    /**
     * get-environment-variable: Get an environment variable.
     * R7RS requires exactly 1 string argument.
     * @param {string} name - Variable name.
     * @returns {string|boolean} Value or #f if not found.
     */
    'get-environment-variable': (...args) => {
        assertArity('get-environment-variable', args, 1, 1);
        assertString('get-environment-variable', 1, args[0]);
        const name = args[0];
        if (isNode && process.env) {
            const value = process.env[name];
            return value !== undefined ? value : false;
        }
        return false;
    },

    /**
     * get-environment-variables: Get all environment variables as an alist.
     * R7RS requires no arguments.
     * @returns {Cons|null} Scheme association list of (name . value) pairs.
     */
    'get-environment-variables': (...args) => {
        assertArity('get-environment-variables', args, 0, 0);
        if (isNode && process.env) {
            // Convert to Scheme alist: ((name . value) ...)
            const entries = Object.entries(process.env);
            // Build list of pairs
            const pairs = entries.map(([name, value]) => cons(name, value));
            return list(...pairs);
        }
        return null;  // Empty list
    }
};

/**
 * Bytevector Primitives for Scheme.
 * 
 * Provides bytevector operations per R7RS §6.9.
 * Bytevectors are represented as Uint8Array instances.
 */


// =============================================================================
// Type Predicates and Assertions
// =============================================================================

/**
 * Checks if value is a bytevector (Uint8Array).
 * @param {*} x - Value to check
 * @returns {boolean}
 */
function isBytevector(x) {
    return x instanceof Uint8Array;
}

/**
 * Asserts value is a bytevector.
 * @param {string} procName - Procedure name
 * @param {number} argPos - Argument position (1-indexed)
 * @param {*} value - Value to check
 * @returns {Uint8Array} The bytevector
 * @throws {SchemeTypeError}
 */
function assertBytevector(procName, argPos, value) {
    if (!isBytevector(value)) {
        throw new SchemeTypeError(procName, argPos, 'bytevector', value);
    }
    return value;
}

/**
 * Asserts value is a byte (integer 0-255).
 * @param {string} procName - Procedure name
 * @param {number} argPos - Argument position (1-indexed)
 * @param {*} value - Value to check
 * @returns {number} The byte
 * @throws {SchemeTypeError|SchemeRangeError}
 */
function assertByte(procName, argPos, value) {
    assertInteger(procName, argPos, value);
    if (value < 0 || value > 255) {
        throw new SchemeRangeError(procName, 'byte', 0, 255, value);
    }
    return value;
}

/**
 * Validates and returns start/end range for bytevector operations.
 * @param {string} procName - Procedure name
 * @param {Uint8Array} bv - The bytevector
 * @param {number|undefined} start - Start index (default 0)
 * @param {number|undefined} end - End index (default bv.length)
 * @returns {[number, number]} Validated [start, end]
 */
function validateRange(procName, bv, start, end) {
    const s = start === undefined ? 0 : start;
    const e = end === undefined ? bv.length : end;

    if (!Number.isInteger(s) || s < 0 || s > bv.length) {
        throw new SchemeRangeError(procName, 'start', 0, bv.length, s);
    }
    if (!Number.isInteger(e) || e < s || e > bv.length) {
        throw new SchemeRangeError(procName, 'end', s, bv.length, e);
    }
    return [s, e];
}

// =============================================================================
// Bytevector Primitives
// =============================================================================

/**
 * Bytevector primitives exported to Scheme.
 */
const bytevectorPrimitives = {
    // -------------------------------------------------------------------------
    // Type Predicates
    // -------------------------------------------------------------------------

    /**
     * Bytevector type predicate.
     * @param {*} obj - Value to check.
     * @returns {boolean} True if obj is a bytevector.
     */
    'bytevector?': (obj) => isBytevector(obj),

    // -------------------------------------------------------------------------
    // Constructors
    // -------------------------------------------------------------------------

    /**
     * Creates a bytevector from byte arguments.
     * @param {...number} bytes - Bytes (0-255)
     * @returns {Uint8Array} New bytevector
     */
    'bytevector': (...bytes) => {
        bytes.forEach((b, i) => assertByte('bytevector', i + 1, b));
        return new Uint8Array(bytes);
    },

    /**
     * Creates a bytevector of given length.
     * @param {number} k - Length
     * @param {number} [fill=0] - Fill byte (default 0)
     * @returns {Uint8Array} New bytevector
     */
    'make-bytevector': (k, fill = 0) => {
        assertInteger('make-bytevector', 1, k);
        if (k < 0) {
            throw new SchemeRangeError('make-bytevector', 'length', 0, Infinity, k);
        }
        assertByte('make-bytevector', 2, fill);
        const bv = new Uint8Array(k);
        if (fill !== 0) {
            bv.fill(fill);
        }
        return bv;
    },

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Returns the length of a bytevector.
     * @param {Uint8Array} bv - A bytevector.
     * @returns {number} Length.
     */
    'bytevector-length': (bv) => {
        assertBytevector('bytevector-length', 1, bv);
        return bv.length;
    },

    /**
     * Returns byte at index.
     * @param {Uint8Array} bv - A bytevector.
     * @param {number} k - Index.
     * @returns {number} Byte value (0-255).
     */
    'bytevector-u8-ref': (bv, k) => {
        assertBytevector('bytevector-u8-ref', 1, bv);
        assertInteger('bytevector-u8-ref', 2, k);
        if (k < 0 || k >= bv.length) {
            throw new SchemeRangeError('bytevector-u8-ref', 'index', 0, bv.length - 1, k);
        }
        return bv[k];
    },

    /**
     * Sets byte at index.
     * @param {Uint8Array} bv - A bytevector.
     * @param {number} k - Index.
     * @param {number} byte - Byte value (0-255).
     * @returns {undefined}
     */
    'bytevector-u8-set!': (bv, k, byte) => {
        assertBytevector('bytevector-u8-set!', 1, bv);
        assertInteger('bytevector-u8-set!', 2, k);
        if (k < 0 || k >= bv.length) {
            throw new SchemeRangeError('bytevector-u8-set!', 'index', 0, bv.length - 1, k);
        }
        assertByte('bytevector-u8-set!', 3, byte);
        bv[k] = byte;
        return undefined;
    },

    // -------------------------------------------------------------------------
    // Copy Operations
    // -------------------------------------------------------------------------

    /**
     * Returns a copy of a bytevector.
     * @param {Uint8Array} bv - Source bytevector
     * @param {number} [start=0] - Start index
     * @param {number} [end=length] - End index
     * @returns {Uint8Array} New bytevector
     */
    'bytevector-copy': (bv, start, end) => {
        assertBytevector('bytevector-copy', 1, bv);
        const [s, e] = validateRange('bytevector-copy', bv, start, end);
        return bv.slice(s, e);
    },

    /**
     * Copies bytes from source to destination bytevector.
     * @param {Uint8Array} to - Destination bytevector
     * @param {number} at - Destination start index
     * @param {Uint8Array} from - Source bytevector
     * @param {number} [start=0] - Source start index
     * @param {number} [end=length] - Source end index
     * @returns {undefined}
     */
    'bytevector-copy!': (to, at, from, start, end) => {
        assertBytevector('bytevector-copy!', 1, to);
        assertInteger('bytevector-copy!', 2, at);
        assertBytevector('bytevector-copy!', 3, from);

        if (at < 0 || at > to.length) {
            throw new SchemeRangeError('bytevector-copy!', 'at', 0, to.length, at);
        }

        const [s, e] = validateRange('bytevector-copy!', from, start, end);
        const count = e - s;

        if (at + count > to.length) {
            throw new SchemeRangeError('bytevector-copy!', 'destination', 0, to.length - at, count);
        }

        // Handle overlapping regions by copying to temp first if needed
        if (to === from && at > s && at < e) {
            // Overlapping forward copy - need temp buffer
            const temp = from.slice(s, e);
            to.set(temp, at);
        } else {
            // Safe direct copy
            to.set(from.subarray(s, e), at);
        }

        return undefined;
    },

    /**
     * Appends bytevectors.
     * @param {...Uint8Array} bvs - Bytevectors to append
     * @returns {Uint8Array} New concatenated bytevector
     */
    'bytevector-append': (...bvs) => {
        bvs.forEach((bv, i) => assertBytevector('bytevector-append', i + 1, bv));
        const totalLength = bvs.reduce((acc, bv) => acc + bv.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const bv of bvs) {
            result.set(bv, offset);
            offset += bv.length;
        }
        return result;
    },

    // -------------------------------------------------------------------------
    // String Conversion
    // -------------------------------------------------------------------------

    /**
     * Decodes a bytevector as UTF-8 to a string.
     * @param {Uint8Array} bv - Source bytevector
     * @param {number} [start=0] - Start index
     * @param {number} [end=length] - End index
     * @returns {string} Decoded string
     */
    'utf8->string': (bv, start, end) => {
        assertBytevector('utf8->string', 1, bv);
        const [s, e] = validateRange('utf8->string', bv, start, end);
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(bv.subarray(s, e));
    },

    /**
     * Encodes a string as UTF-8 to a bytevector.
     * @param {string} str - Source string
     * @param {number} [start=0] - Start index
     * @param {number} [end=length] - End index
     * @returns {Uint8Array} Encoded bytevector
     */
    'string->utf8': (str, start, end) => {
        assertString('string->utf8', 1, str);
        const s = start === undefined ? 0 : start;
        const e = end === undefined ? str.length : end;

        if (!Number.isInteger(s) || s < 0 || s > str.length) {
            throw new SchemeRangeError('string->utf8', 'start', 0, str.length, s);
        }
        if (!Number.isInteger(e) || e < s || e > str.length) {
            throw new SchemeRangeError('string->utf8', 'end', s, str.length, e);
        }

        const encoder = new TextEncoder();
        return encoder.encode(str.slice(s, e));
    }
};

// Mark primitives that should receive raw Scheme objects (no JS bridge wrapping)
bytevectorPrimitives['bytevector'].skipBridge = true;
bytevectorPrimitives['make-bytevector'].skipBridge = true;
bytevectorPrimitives['bytevector-u8-set!'].skipBridge = true;
bytevectorPrimitives['bytevector-u8-ref'].skipBridge = true;
bytevectorPrimitives['bytevector-copy!'].skipBridge = true;

/**
 * Syntax Object Primitives for Scheme.
 * 
 * Provides procedures for working with syntax objects.
 */


// =============================================================================
// Syntax Primitives
// =============================================================================

/**
 * Syntax primitives exported to Scheme.
 */
const syntaxPrimitives = {
    /**
     * Converts a syntax object to its datum representation.
     * Recursively unwraps syntax objects in lists and vectors.
     * @param {*} stx - A syntax object or datum.
     * @returns {*} The unwrapped datum.
     */
    'syntax->datum': (stx) => unwrapSyntax(stx),

    /**
     * Checks if a value is a syntax object.
     * @param {*} obj - Value to check.
     * @returns {boolean} True if obj is a syntax object.
     */
    'syntax-object?': (obj) => obj instanceof SyntaxObject$1
};

// Mark primitives that should receive raw Scheme objects
syntaxPrimitives['syntax->datum'].skipBridge = true;
syntaxPrimitives['syntax-object?'].skipBridge = true;

/**
 * JavaScript Promise Interop Primitives for Scheme.
 * 
 * Provides transparent interoperability between Scheme and JavaScript Promises.
 * These are thin wrappers around the native Promise API, allowing Scheme
 * procedures to be used as callbacks.
 */


/**
 * Creates a JavaScript-callable wrapper for a Scheme procedure.
 * Uses the interpreter's JS bridge mechanism to invoke closures.
 * 
 * @param {Closure|Function} proc - A Scheme closure or JS function
 * @param {Object} interpreter - The interpreter instance
 * @returns {Function} A JavaScript function that can be called by Promise.then()
 */
function wrapSchemeCallback(proc, interpreter) {
    if (typeof proc === 'function' && !(proc instanceof Closure)) {
        // Already a JS function, use directly
        return proc;
    }

    // It's a Scheme Closure - use the interpreter's bridge mechanism
    return interpreter.createJsBridge(proc);
}

/**
 * Promise primitives that require interpreter access.
 * 
 * @param {Object} interpreter - The interpreter instance
 * @returns {Object} Promise primitive bindings
 */
function getPromisePrimitives(interpreter) {
    return {
        /**
         * Tests if a value is a JavaScript Promise.
         * @param {*} obj - Value to test
         * @returns {boolean} True if obj is a Promise
         */
        'js-promise?': (obj) => {
            return obj instanceof Promise;
        },

        /**
         * Creates a resolved Promise with the given value.
         * @param {*} value - Value to resolve with
         * @returns {Promise} A resolved Promise
         */
        'js-promise-resolve': (value) => {
            return Promise.resolve(value);
        },

        /**
         * Creates a rejected Promise with the given reason.
         * @param {*} reason - Rejection reason
         * @returns {Promise} A rejected Promise
         */
        'js-promise-reject': (reason) => {
            return Promise.reject(reason);
        },

        /**
         * Creates a new Promise with a resolver procedure.
         * The procedure is called with two arguments: resolve and reject,
         * which are procedures that can be called to settle the promise.
         * 
         * Usage: (make-js-promise (lambda (resolve reject) ...))
         * 
         * @param {Function|Closure} executor - (resolve, reject) => void
         * @returns {Promise} A new Promise
         */
        'make-js-promise': (executor) => {
            assertProcedure('make-js-promise', 1, executor);

            const wrappedExecutor = wrapSchemeCallback(executor, interpreter);

            return new Promise((resolve, reject) => {
                // Call the Scheme executor with resolve and reject
                // These are already JS functions so they can be passed directly
                wrappedExecutor(resolve, reject);
            });
        },

        /**
         * Attaches fulfillment and/or rejection handlers to a Promise.
         * 
         * @param {Promise} promise - The promise to attach handlers to
         * @param {Function|Closure} onFulfilled - Success handler
         * @param {Function|Closure} [onRejected] - Optional rejection handler
         * @returns {Promise} A new Promise for chaining
         */
        'js-promise-then': (promise, onFulfilled, onRejected) => {
            if (!(promise instanceof Promise)) {
                throw new SchemeTypeError('js-promise-then', 1, 'Promise', promise);
            }
            assertProcedure('js-promise-then', 2, onFulfilled);

            const wrappedFulfilled = wrapSchemeCallback(onFulfilled, interpreter);

            if (onRejected !== undefined) {
                assertProcedure('js-promise-then', 3, onRejected);
                const wrappedRejected = wrapSchemeCallback(onRejected, interpreter);
                return promise.then(wrappedFulfilled, wrappedRejected);
            }

            return promise.then(wrappedFulfilled);
        },

        /**
         * Attaches a rejection handler to a Promise.
         * 
         * @param {Promise} promise - The promise to attach handler to
         * @param {Function|Closure} onRejected - Rejection handler
         * @returns {Promise} A new Promise for chaining
         */
        'js-promise-catch': (promise, onRejected) => {
            if (!(promise instanceof Promise)) {
                throw new SchemeTypeError('js-promise-catch', 1, 'Promise', promise);
            }
            assertProcedure('js-promise-catch', 2, onRejected);

            const wrappedRejected = wrapSchemeCallback(onRejected, interpreter);
            return promise.catch(wrappedRejected);
        },

        /**
         * Attaches a handler that runs regardless of fulfillment or rejection.
         * 
         * @param {Promise} promise - The promise to attach handler to
         * @param {Function|Closure} onFinally - Handler to run
         * @returns {Promise} A new Promise for chaining
         */
        'js-promise-finally': (promise, onFinally) => {
            if (!(promise instanceof Promise)) {
                throw new SchemeTypeError('js-promise-finally', 1, 'Promise', promise);
            }
            assertProcedure('js-promise-finally', 2, onFinally);

            const wrappedFinally = wrapSchemeCallback(onFinally, interpreter);
            return promise.finally(wrappedFinally);
        },

        /**
         * Waits for all promises in a list to resolve.
         * 
         * @param {Cons|Array} promises - List of promises
         * @returns {Promise<Array>} Promise that resolves to array of results
         */
        'js-promise-all': (promises) => {
            let arr;
            if (isList(promises)) {
                arr = toArray(promises);
            } else if (Array.isArray(promises)) {
                arr = promises;
            } else {
                throw new SchemeTypeError('js-promise-all', 1, 'list of promises', promises);
            }

            return Promise.all(arr);
        },

        /**
         * Waits for the first promise to settle (resolve or reject).
         * 
         * @param {Cons|Array} promises - List of promises  
         * @returns {Promise} Promise that settles with first result
         */
        'js-promise-race': (promises) => {
            let arr;
            if (isList(promises)) {
                arr = toArray(promises);
            } else if (Array.isArray(promises)) {
                arr = promises;
            } else {
                throw new SchemeTypeError('js-promise-race', 1, 'list of promises', promises);
            }

            return Promise.race(arr);
        },

        /**
         * Waits for all promises to settle (resolve or reject).
         * Unlike promise-all, does not short-circuit on rejection.
         * 
         * @param {Cons|Array} promises - List of promises
         * @returns {Promise<Array>} Promise that resolves to array of outcome objects
         */
        'js-promise-all-settled': (promises) => {
            let arr;
            if (isList(promises)) {
                arr = toArray(promises);
            } else if (Array.isArray(promises)) {
                arr = promises;
            } else {
                throw new SchemeTypeError('js-promise-all-settled', 1, 'list of promises', promises);
            }

            return Promise.allSettled(arr);
        }
    };
}

/**
 * Class Primitives for Scheme.
 * 
 * Provides operations to create and manipulate JS-compatible classes from Scheme.
 */


/**
 * Class primitives exported to Scheme.
 */
const classPrimitives = {
    'make-class': (name, parent, fieldTags, constructorTags) => {
        const typeName = typeof name === 'string' ? name : name.name;
        const ownFieldNames = toArray(fieldTags).map(s => s.name);
        const constructorParamNames = toArray(constructorTags).map(s => s.name);
        const jsClassName = typeName.replace(/[^a-zA-Z0-9_$]/g, '_');

        // Dynamically create the class
        let InternalClass;
        if (parent) {
            const classSrc = `
                return class ${jsClassName} extends parent {
                    static get schemeName() { return ${JSON.stringify(typeName)}; }
                    constructor(${constructorParamNames.join(', ')}) {
                        super(${constructorParamNames.join(', ')});
                        ${ownFieldNames.map(f => `if (${f} !== undefined) this.${f} = ${f};`).join('\n')}
                    }
                }
            `;
            InternalClass = new Function('parent', classSrc)(parent);
        } else {
            const classSrc = `
                return class ${jsClassName} {
                    static get schemeName() { return ${JSON.stringify(typeName)}; }
                    constructor(${constructorParamNames.join(', ')}) {
                        ${ownFieldNames.map(f => `if (${f} !== undefined) this.${f} = ${f};`).join('\n')}
                    }
                }
            `;
            InternalClass = new Function(classSrc)();
        }

        // Return a wrapper that allows calling without 'new' in Scheme/JS
        const Wrapper = function (...args) {
            if (new.target) {
                return Reflect.construct(InternalClass, args, new.target);
            }
            return new InternalClass(...args);
        };

        // Ensure instanceof and static members work
        Object.setPrototypeOf(Wrapper, InternalClass);
        Wrapper.prototype = InternalClass.prototype;
        // Mark it so we can identify it's a class wrapper
        Wrapper.isSchemeClass = true;

        return Wrapper;
    },

    /**
     * Sets a method on a class's prototype.
     * @param {Function} cls - The class constructor.
     * @param {string|Symbol} name - The method name.
     * @param {Function} proc - The Scheme procedure (callable closure).
     */
    'class-method-set!': (cls, name, proc) => {
        const methodName = typeof name === 'string' ? name : name.name;
        if (typeof proc !== 'function') {
            throw new SchemeTypeError('class-method-set!', 3, 'procedure', proc);
        }
        cls.prototype[methodName] = proc;
    }
};

/**
 * Creates the global environment with built-in primitives.
 * @param {Interpreter} interpreter - A reference to the interpreter for async callbacks.
 * @returns {Environment} The global environment.
 */
function createGlobalEnvironment(interpreter) {
    const bindings = new Map();

    // Clear registry to ensure fresh state for tests
    globalScopeRegistry.clear();

    // Helper to add primitives
    const addPrimitives = (prims) => {
        for (const [name, fn] of Object.entries(prims)) {
            bindings.set(name, fn); // No wrapper needed!

            // Register for hygienic macro expansion
            globalScopeRegistry.bind(name, new Set([GLOBAL_SCOPE_ID]), fn);
        }
    };

    addPrimitives(mathPrimitives);
    addPrimitives(ioPrimitives);
    addPrimitives(listPrimitives);
    addPrimitives(vectorPrimitives);
    addPrimitives(recordPrimitives);
    addPrimitives(stringPrimitives);
    addPrimitives(charPrimitives);
    addPrimitives(eqPrimitives);
    addPrimitives(getAsyncPrimitives());
    addPrimitives(getControlPrimitives(interpreter));
    addPrimitives(GCPrimitives);
    addPrimitives(interopPrimitives);
    addPrimitives(getExceptionPrimitives());
    addPrimitives(timePrimitives);
    addPrimitives(processContextPrimitives);
    addPrimitives(bytevectorPrimitives);
    addPrimitives(syntaxPrimitives);
    addPrimitives(getPromisePrimitives(interpreter));
    addPrimitives(classPrimitives);

    return new Environment(null, bindings);
}

/**
 * Options for creating an interpreter instance.
 * @typedef {Object} CreateInterpreterOptions
 * @property {boolean} [isolated=false] - If true, creates a fresh context isolated from other interpreters
 * @property {InterpreterContext} [context] - Explicit context to use (overrides isolated flag)
 */

/**
 * Factory for the Scheme interpreter core.
 * 
 * @param {CreateInterpreterOptions} [options={}] - Configuration options
 * @returns {{interpreter: Interpreter, env: Environment, context: InterpreterContext}}
 * 
 * @example
 * // Default: uses shared global context
 * const { interpreter, env } = createInterpreter();
 * 
 * // Isolated: creates fresh context (e.g., for sandboxed REPL)
 * const { interpreter, env, context } = createInterpreter({ isolated: true });
 * 
 * // Explicit context: use your own context instance
 * const myCtx = new InterpreterContext();
 * const { interpreter, env } = createInterpreter({ context: myCtx });
 */
function createInterpreter(options = {}) {
    // Determine which context to use
    let context;
    if (options.context) {
        context = options.context;
    } else if (options.isolated) {
        context = new InterpreterContext();
    } else {
        context = globalContext;
    }

    const interpreter = new Interpreter(context);
    const env = createGlobalEnvironment(interpreter);

    // Initialize the Global Environment first
    interpreter.setGlobalEnv(env);

    // Register (scheme primitives)
    // This allows library files to (import (scheme primitives))
    const primitiveExports = createPrimitiveExports(env);
    registerBuiltinLibrary(['scheme', 'primitives'], primitiveExports, env);

    return { interpreter, env, context };
}

// Auto-generated by scripts/generate_bundled_libraries.js - do not edit manually
// Contains all .sld and .scm files from src/core/scheme/ and src/extras/scheme/

const BUNDLED_SOURCES = {
  "base.sld": ";; R7RS (scheme base) library\n;; \n;; This re-exports primitives from the runtime and core implementations.\n;; Per R7RS Appendix A.\n\n(define-library (scheme base)\n  (import (scheme primitives))\n  (import (scheme core))\n  (import (scheme control))\n\n  (export\n    ;; Equivalence predicates\n    eq? eqv? equal?\n    \n    ;; Numbers - basic arithmetic\n    + - * /\n    \n    ;; Numbers - comparison (variadic, from core)\n    = < > <= >=\n    \n    ;; Numbers - predicates (from primitives)\n    number? complex? real? rational? integer? exact-integer?\n    exact? inexact?\n    finite? infinite? nan?\n    \n    ;; Numbers - predicates (from core)\n    zero? positive? negative? odd? even?\n    \n    ;; Numbers - operations\n    abs quotient remainder modulo\n    floor ceiling truncate round\n    max min gcd lcm\n    expt sqrt square\n    exact-integer-sqrt\n    exact inexact\n    floor/ floor-quotient floor-remainder\n    truncate/ truncate-quotient truncate-remainder\n    \n    ;; Rational number procedures\n    numerator denominator\n    \n    ;; Complex number procedures\n    make-rectangular make-polar\n    real-part imag-part magnitude angle\n    \n    ;; Bytevectors\n    bytevector? make-bytevector bytevector bytevector-length\n    bytevector-u8-ref bytevector-u8-set!\n    bytevector-copy bytevector-copy! bytevector-append\n    utf8->string string->utf8\n    \n    ;; Booleans\n    not boolean? boolean=?\n    \n    ;; Pairs and lists - basic\n    cons car cdr pair? null? list?\n    set-car! set-cdr!\n    list append\n    \n    ;; Pairs and lists - extended\n    length list-ref list-tail reverse list-copy\n    make-list list-set!\n    memq memv member\n    assq assv assoc\n    \n    ;; Compound accessors (cxr) - depth 2-4\n    caar cadr cdar cddr\n    caaar caadr cadar caddr cdaar cdadr cddar cdddr\n    caaaar caaadr caadar caaddr cadaar cadadr caddar cadddr\n    cdaaar cdaadr cdadar cdaddr cddaar cddadr cdddar cddddr\n    \n    ;; Symbols\n    symbol? symbol=? symbol->string string->symbol\n    \n    ;; Characters\n    char? char=? char<? char>? char<=? char>=?\n    char->integer integer->char\n    \n    ;; Strings  \n    string? make-string string string-length string-ref\n    string=? string<? string>? string<=? string>=?\n    substring string-append string-copy\n    string->list list->string\n    number->string string->number\n    string-upcase string-downcase string-foldcase\n    \n    ;; Vectors\n    vector? make-vector vector vector-length\n    vector-ref vector-set! vector-fill!\n    vector-copy vector-copy! vector-append\n    vector->list list->vector\n    vector->string string->vector\n    \n    ;; Control\n    apply map for-each\n    string-map string-for-each\n    vector-map vector-for-each\n    call-with-current-continuation call/cc\n    dynamic-wind\n    values call-with-values\n    procedure?\n    make-parameter parameterize param-dynamic-bind\n    \n    ;; Exceptions\n    raise raise-continuable\n    with-exception-handler\n    error\n    error-object? error-object-message error-object-irritants\n    \n    ;; I/O - Ports\n    port? input-port? output-port?\n    textual-port? binary-port?\n    input-port-open? output-port-open?\n    current-input-port current-output-port current-error-port\n    close-port close-input-port close-output-port\n    flush-output-port\n    \n    ;; I/O - String Ports\n    open-input-string open-output-string get-output-string\n    \n    ;; I/O - Bytevector Ports (Binary I/O)\n    open-input-bytevector open-output-bytevector get-output-bytevector\n    \n    ;; I/O - EOF\n    eof-object eof-object?\n    \n    ;; I/O - Input\n    read-char peek-char char-ready?\n    read-line read-string\n    read\n    \n    ;; I/O - Binary Input\n    read-u8 peek-u8 u8-ready?\n    read-bytevector\n    \n    ;; I/O - Output\n    write-char write-string\n    display newline write\n    write-simple write-shared\n    \n    ;; I/O - Binary Output\n    write-u8 write-bytevector\n    \n    ;; Syntax (Macros & Special Forms)\n    define set! lambda if begin quote quasiquote unquote unquote-splicing\n    define-syntax let-syntax letrec-syntax\n    and or cond case do when unless guard\n    let let* letrec letrec*\n    let-values let*-values define-values\n    define-record-type\n    define-class\n  )\n  \n  ;; The actual bindings come from the runtime primitives.\n  ;; This library just declares what (scheme base) exports.\n  (begin\n    ;; No definitions needed - primitives are injected by the runtime\n  ))\n",
  "case-lambda.sld": ";; (scheme case-lambda) library\n;;\n;; R7RS library providing case-lambda for multi-arity procedures.\n\n(define-library (scheme case-lambda)\n  (import (scheme base))\n  (export case-lambda)\n  (include \"case_lambda.scm\"))\n",
  "case_lambda.scm": ";; case-lambda - Multi-arity procedure definition\n;;\n;; R7RS (scheme case-lambda) library\n;;\n;; case-lambda creates a procedure that dispatches based on argument count.\n;; Example:\n;;   (define add\n;;     (case-lambda\n;;       (() 0)\n;;       ((x) x)\n;;       ((x y) (+ x y))))\n\n;; /**\n;;  * case-lambda macro\n;;  *\n;;  * Creates a procedure that selects a clause based on argument count.\n;;  * Uses a simple nested-if approach for dispatching.\n;;  *\n;;  * @syntax (case-lambda clause ...)\n;;  * @param clause - (formals body ...) where formals is a lambda parameter list\n;;  * @returns A procedure that dispatches on arity\n;;  */\n\n;; Simple implementation: expand to cond-based dispatch on length\n;; For (case-lambda (()  body0) ((x) body1) ((x y) body2))\n;; expands to:\n;; (lambda args\n;;   (let ((n (length args)))\n;;     (cond\n;;       ((= n 0) body0)\n;;       ((= n 1) (let ((x (car args))) body1))\n;;       ((= n 2) (let ((x (car args)) (y (cadr args))) body2))\n;;       (else (error \"no matching clause\")))))\n\n(define-syntax case-lambda\n  (syntax-rules ()\n    ;; Single clause - optimize to simple lambda\n    ((case-lambda (formals body ...))\n     (lambda formals body ...))\n    \n    ;; Multiple clauses - build generic dispatcher\n    ((case-lambda clause ...)\n     (lambda args\n       (case-lambda-clauses args clause ...)))))\n\n;; Helper: expand clauses to cond-like dispatch\n(define-syntax case-lambda-clauses\n  (syntax-rules ()\n    ;; Base: no more clauses, error\n    ((case-lambda-clauses args)\n     (error \"case-lambda: no matching clause\" (length args)))\n    \n    ;; Empty formals: 0 args\n    ((case-lambda-clauses args (() body ...) rest ...)\n     (if (null? args)\n         (begin body ...)\n         (case-lambda-clauses args rest ...)))\n    \n    ;; One param\n    ((case-lambda-clauses args ((a) body ...) rest ...)\n     (if (and (pair? args) (null? (cdr args)))\n         (let ((a (car args)))\n           body ...)\n         (case-lambda-clauses args rest ...)))\n    \n    ;; Two params\n    ((case-lambda-clauses args ((a b) body ...) rest ...)\n     (if (and (pair? args) (pair? (cdr args)) (null? (cddr args)))\n         (let ((a (car args)) (b (cadr args)))\n           body ...)\n         (case-lambda-clauses args rest ...)))\n    \n    ;; Three params\n    ((case-lambda-clauses args ((a b c) body ...) rest ...)\n     (if (and (pair? args) (pair? (cdr args)) (pair? (cddr args)) (null? (cdddr args)))\n         (let ((a (car args)) (b (cadr args)) (c (caddr args)))\n           body ...)\n         (case-lambda-clauses args rest ...)))\n    \n    ;; Four params\n    ((case-lambda-clauses args ((a b c d) body ...) rest ...)\n     (if (= (length args) 4)\n         (let ((a (car args)) (b (cadr args)) (c (caddr args)) (d (cadddr args)))\n           body ...)\n         (case-lambda-clauses args rest ...)))\n    \n    ;; NOTE: Rest patterns must be ordered from most specific to least specific\n    ;; to ensure proper pattern matching.\n    \n    ;; Three or more (rest param) - must come before (a b . rest)\n    ((case-lambda-clauses args ((a b c . rest) body ...) more ...)\n     (if (and (pair? args) (pair? (cdr args)) (pair? (cddr args)))\n         (let ((a (car args)) (b (cadr args)) (c (caddr args)) (rest (cdddr args)))\n           body ...)\n         (case-lambda-clauses args more ...)))\n    \n    ;; Two or more (rest param) - must come before (a . rest)\n    ((case-lambda-clauses args ((a b . rest) body ...) more ...)\n     (if (and (pair? args) (pair? (cdr args)))\n         (let ((a (car args)) (b (cadr args)) (rest (cddr args)))\n           body ...)\n         (case-lambda-clauses args more ...)))\n    \n    ;; One or more (rest param)\n    ((case-lambda-clauses args ((a . rest) body ...) more ...)\n     (if (pair? args)\n         (let ((a (car args)) (rest (cdr args)))\n           body ...)\n         (case-lambda-clauses args more ...)))\n    \n    ;; Pure rest param (matches anything) - must be last\n    ((case-lambda-clauses args (rest body ...) more ...)\n     (let ((rest args))\n       body ...))))\n",
  "char.sld": ";; R7RS (scheme char) library\n;; \n;; Character procedures that are not in (scheme base).\n;; Per R7RS Appendix A.\n\n(define-library (scheme char)\n  (import (scheme primitives))\n  \n  (export\n    ;; Case-insensitive comparison\n    char-ci=? char-ci<? char-ci>? char-ci<=? char-ci>=?\n    \n    ;; Character class predicates\n    char-alphabetic? char-numeric? char-whitespace?\n    char-upper-case? char-lower-case?\n    \n    ;; Case conversion\n    char-upcase char-downcase char-foldcase\n    \n    ;; Digit value\n    digit-value\n  )\n  \n  (begin\n    ;; No definitions needed - primitives are injected by the runtime\n  ))\n",
  "complex.sld": ";; R7RS (scheme complex) library\n;;\n;; This library re-exports the optional complex number procedures.\n;; They are already implemented in (scheme base) in this implementation,\n;; but R7RS allows them to be in a separate library.\n\n(define-library (scheme complex)\n  (import (scheme base))\n  (export\n    make-rectangular\n    make-polar\n    real-part\n    imag-part\n    magnitude\n    angle))\n",
  "control.scm": ";; Standard Control Macros\n;; (when, unless, do, case, guard, let-values, let*-values, define-values)\n;; Note: `or` and `let*` are defined in macros.scm\n\n;; /**\n;;  * One-armed conditional.\n;;  * Evaluates body if test is true.\n;;  *\n;;  * @param {expression} test - Conditional test.\n;;  * @param {...expression} body - Expressions to evaluate if test is true.\n;;  */\n(define-syntax when\n  (syntax-rules ()\n    ((when test result1 result2 ...)\n     (if test\n         (begin result1 result2 ...)))))\n\n;; /**\n;;  * One-armed conditional (negated).\n;;  * Evaluates body if test is false.\n;;  *\n;;  * @param {expression} test - Conditional test.\n;;  * @param {...expression} body - Expressions to evaluate if test is false.\n;;  */\n(define-syntax unless\n  (syntax-rules ()\n    ((unless test result1 result2 ...)\n     (if test\n         #f ;; unspecified\n         (begin result1 result2 ...)))))\n\n;; /**\n;;  * Iteration construct.\n;;  *\n;;  * @param {list} ((var init [step]) ...) - Variable bindings.\n;;  * @param {list} (test expression ...) - Termination condition and return value.\n;;  * @param {...expression} commands - Body expressions.\n;;  */\n\n(define-syntax do\n  (syntax-rules ()\n    ;; Normalizer: (var init step) -> keep as is\n    ((do \"normalize\" ((var init step) . rest) (done ...) clause . body)\n     (do \"normalize\" rest (done ... (var init step)) clause . body))\n    \n    ;; Normalizer: (var init) -> add var as step\n    ((do \"normalize\" ((var init) . rest) (done ...) clause . body)\n     (do \"normalize\" rest (done ... (var init var)) clause . body))\n\n    ;; Base case: all normalized, generate loop\n    ((do \"normalize\" () ((var init step) ...) (test expr ...) . body)\n     (letrec\n       ((loop\n         (lambda (var ...)\n           (if test\n               (begin\n                 (if #f #f)\n                 expr ...)\n               (begin\n                 (begin . body)\n                 (loop step ...))))))\n       (loop init ...)))\n\n    ;; Entry point: start normalizing bindings\n    ((do ((var init . step) ...) (test . exprs) . commands)\n     (do \"normalize\" ((var init . step) ...) () (test . exprs) . commands))))\n\n;; =============================================================================\n;; Multiple Value Binding Forms\n;; =============================================================================\n\n;; /**\n;;  * Let-values binding form.\n;;  * Binds results from producers that return multiple values.\n;;  *\n;;  * @param {list} ((formals producer) ...) - Binding clauses.\n;;  * @param {...expression} body - Body expressions.\n;;  */\n(define-syntax let-values\n  (syntax-rules ()\n    ;; Empty bindings\n    ((let-values () body ...)\n     (let () body ...))\n    ;; Single binding\n    ((let-values ((formals producer)) body ...)\n     (call-with-values\n       (lambda () producer)\n       (lambda formals body ...)))\n    ;; Multiple bindings - nest them\n    ((let-values ((formals producer) rest ...) body ...)\n     (call-with-values\n       (lambda () producer)\n       (lambda formals (let-values (rest ...) body ...))))))\n\n;; /**\n;;  * Sequential let-values binding form.\n;;  * Like let-values but each clause sees the bindings of previous clauses.\n;;  *\n;;  * @param {list} ((formals producer) ...) - Binding clauses.\n;;  * @param {...expression} body - Body expressions.\n;;  */\n(define-syntax let*-values\n  (syntax-rules ()\n    ;; Empty bindings\n    ((let*-values () body ...)\n     (let () body ...))\n    ;; One or more bindings - expand sequentially\n    ((let*-values ((formals producer) rest ...) body ...)\n     (call-with-values\n       (lambda () producer)\n       (lambda formals (let*-values (rest ...) body ...))))))\n\n;; /**\n;;  * Define multiple variables from multiple values.\n;;  * Uses a recursive pattern to support any number of variables.\n;;  * Supports: (define-values () expr), (define-values (a b c ...) expr),\n;;  * (define-values (a b . rest) expr), (define-values name expr).\n;;  *\n;;  * @param {list|symbol} formals - Variable(s) to define.\n;;  * @param {expression} expr - Expression producing multiple values.\n;;  */\n(define-syntax define-values\n  (syntax-rules ()\n    ;; Empty formals - just evaluate for side effects\n    ((define-values () expr)\n     (call-with-values (lambda () expr) (lambda () (if #f #f))))\n\n    ;; Single variable in parens - direct assignment\n    ((define-values (var) expr)\n     (define var (call-with-values (lambda () expr) (lambda (x) x))))\n\n    ;; Multiple variables without rest - use recursive helper\n    ;; First capture all values as a list, then extract each one\n    ((define-values (var0 var1 ...) expr)\n     (begin\n       (define temp-vals (call-with-values (lambda () expr) list))\n       (define-values \"extract\" (var0 var1 ...) temp-vals)))\n\n    ;; Rest variable pattern: (a b . rest)\n    ((define-values (var0 var1 ... . rest) expr)\n     (begin\n       (define temp-vals (call-with-values (lambda () expr) list))\n       (define-values \"extract-rest\" (var0 var1 ...) rest temp-vals)))\n\n    ;; Single variable without parens (gets all values as list)\n    ;; NOTE: This pattern must be LAST as bare `var` matches any expression\n    ((define-values var expr)\n     (define var (call-with-values (lambda () expr) list)))\n\n    ;; Recursive extraction helper - base case\n    ((define-values \"extract\" (var) temp-vals)\n     (define var (car temp-vals)))\n\n    ;; Recursive extraction helper - multiple remaining\n    ((define-values \"extract\" (var0 var1 ...) temp-vals)\n     (begin\n       (define var0 (car temp-vals))\n       (define-values \"extract\" (var1 ...) (cdr temp-vals))))\n\n    ;; Rest extraction helper - base case (no more regular vars)\n    ((define-values \"extract-rest\" () rest temp-vals)\n     (define rest temp-vals))\n\n    ;; Rest extraction helper - extract one var, continue\n    ((define-values \"extract-rest\" (var0 var1 ...) rest temp-vals)\n     (begin\n       (define var0 (car temp-vals))\n       (define-values \"extract-rest\" (var1 ...) rest (cdr temp-vals))))))\n\n;; /**\n;;  * Case dispatch.\n;;  * Dispatches based on value equality (using memv).\n;;  * Supports => syntax to apply a procedure to the matched key.\n;;  *\n;;  * @param {expression} key - Value to match.\n;;  * @param {...list} clauses - ((datum ...) result1 result2 ...) or ((datum ...) => proc).\n;;  */\n(define-syntax case\n  (syntax-rules (else =>)\n    ;; else with => - apply proc to key (must come before plain else)\n    ((case \"dispatch\" key\n       (else => proc))\n     (proc key))\n    ;; else clause - always matches\n    ((case \"dispatch\" key\n       (else result1 result2 ...))\n     (begin result1 result2 ...))\n    ;; Single clause with => - apply proc to key if match\n    ((case \"dispatch\" key\n       ((atoms ...) => proc))\n     (if (memv key '(atoms ...))\n         (proc key)))\n    ;; => clause with more clauses following\n    ((case \"dispatch\" key\n       ((atoms ...) => proc)\n       clause clauses ...)\n     (if (memv key '(atoms ...))\n         (proc key)\n         (case \"dispatch\" key clause clauses ...)))\n    ;; Single clause with results\n    ((case \"dispatch\" key\n       ((atoms ...) result1 result2 ...))\n     (if (memv key '(atoms ...))\n         (begin result1 result2 ...)))\n    ;; Multiple clauses with results\n    ((case \"dispatch\" key\n       ((atoms ...) result1 result2 ...)\n       clause clauses ...)\n     (if (memv key '(atoms ...))\n         (begin result1 result2 ...)\n         (case \"dispatch\" key clause clauses ...)))\n    ;; No match case\n    ((case \"dispatch\" key)\n     (if #f #t))\n    ;; Entry point - bind key once\n    ((case key\n       clauses ...)\n     (let ((atom-key key))\n       (case \"dispatch\" atom-key clauses ...)))))\n\n;; =============================================================================\n;; Exception Handling\n;; =============================================================================\n\n;; /**\n;;  * Exception handling construct (R7RS).\n;;  * Catches exceptions and dispatches based on condition clauses.\n;;  *\n;;  * @param {symbol} var - Variable to bind to exception.\n;;  * @param {...clause} clauses - Exception handling clauses.\n;;  * @param {...expression} body - Body expressions to protect.\n;;  */\n(define-syntax guard\n  (syntax-rules ()\n    ((guard (var clause ...) body ...)\n     (call/cc\n       (lambda (guard-exit)\n         (with-exception-handler\n           (lambda (condition)\n             (let ((var condition))\n               (guard-clauses guard-exit var clause ...)))\n           (lambda ()\n             body ...)))))))\n\n;; /**\n;;  * Helper macro to process guard clauses.\n;;  * Evaluates clauses in order, re-raising if none match.\n;;  */\n(define-syntax guard-clauses\n  (syntax-rules (else =>)\n    ;; else clause - always matches\n    ((guard-clauses exit var (else result1 result2 ...))\n     (exit (begin result1 result2 ...)))\n    ;; => clause with more clauses following (must come before non-=> versions!)\n    ((guard-clauses exit var (test => proc) clause ...)\n     (let ((temp test))\n       (if temp\n           (exit (proc temp))\n           (guard-clauses exit var clause ...))))\n    ;; => clause - apply proc to result if test is true (single clause)\n    ((guard-clauses exit var (test => proc))\n     (let ((temp test))\n       (if temp\n           (exit (proc temp))\n           (raise var))))\n    ;; test with results and more clauses\n    ((guard-clauses exit var (test result1 result2 ...) clause ...)\n     (if test\n         (exit (begin result1 result2 ...))\n         (guard-clauses exit var clause ...)))\n    ;; test with results - return results if test is true (single clause)\n    ((guard-clauses exit var (test result1 result2 ...))\n     (if test\n         (exit (begin result1 result2 ...))\n         (raise var)))\n    ;; test only with more clauses\n    ((guard-clauses exit var (test) clause ...)\n     (let ((temp test))\n       (if temp\n           (exit temp)\n           (guard-clauses exit var clause ...))))\n    ;; test only - return result of test if true (single clause)\n    ((guard-clauses exit var (test))\n     (let ((temp test))\n       (if temp\n           (exit temp)\n           (raise var))))\n    ;; no clauses matched - re-raise\n    ((guard-clauses exit var)\n     (raise var))))\n",
  "control.sld": "(define-library (scheme control)\n  (import (scheme primitives))\n  (import (scheme core)) ;; for let, if, begin, etc.\n\n  (include \"control.scm\")\n\n  (export\n    when unless or let* do case guard\n    let-values let*-values define-values\n  )\n)\n",
  "core.scm": "; Core Bootstrap Module\n; \n; This file is a container/index for the core Scheme procedures.\n; The actual implementations are split into separate files for organization:\n;\n;   macros.scm     - Core macros: and, let, letrec, cond, define-record-type\n;   equality.scm   - equal? deep equality\n;   cxr.scm        - All 28 car/cdr composition accessors\n;   numbers.scm    - Numeric comparisons, predicates, min/max, gcd/lcm, round\n;   list.scm       - List procedures: map, for-each, memq/v, assq/v, length, etc.\n;\n; The test runner loads these files individually in the correct order.\n; For library-based loading, see base.sld and core.sld.\n;\n; NOTE: This file is kept for documentation purposes and backwards compatibility.\n; If loaded directly, it does nothing because the content is in separate files.\n",
  "core.sld": "(define-library (scheme core)\n  (import (scheme primitives))\n  \n  ;; Include separate Scheme files in dependency order\n  (include \"macros.scm\")     ; Core macros: and, let, letrec, cond\n  (include \"equality.scm\")   ; equal?\n  (include \"cxr.scm\")        ; caar, cadr, etc.\n  (include \"numbers.scm\")    ; =, <, >, predicates, min/max\n  (include \"list.scm\")       ; map, for-each, memq, assq, etc.\n  (include \"parameter.scm\")  ; make-parameter, parameterize\n  \n  (export\n    ;; Macros\n    and or let let* letrec cond\n    define-record-type define-record-field\n    define-class define-class-field define-class-method\n    \n    ;; Deep equality\n    equal?\n    \n    ;; List operations\n    map for-each\n    string-map string-for-each\n    vector-map vector-for-each\n    memq memv member\n    assq assv assoc\n    length list-ref list-tail reverse list-copy\n    make-list list-set!\n    \n    ;; Compound accessors (cxr)\n    caar cadr cdar cddr\n    caaar caadr cadar caddr cdaar cdadr cddar cdddr\n    caaaar caaadr caadar caaddr cadaar cadadr caddar cadddr\n    cdaaar cdaadr cdadar cdaddr cddaar cddadr cdddar cddddr\n    \n    ;; Comparison operators (variadic)\n    = < > <= >=\n    \n    ;; Numeric predicates\n    zero? positive? negative? odd? even?\n    \n    ;; Min/max\n    max min\n    \n    ;; GCD/LCM\n    gcd lcm\n    \n    ;; Rounding\n    round inexact->exact\n    \n    ;; Parameter objects\n    make-parameter parameterize param-dynamic-bind\n    \n    ;; Misc\n    native-report-test-result\n  )\n)\n\n",
  "cxr.scm": ";; CXR Accessors\n;; All 28 compound car/cdr accessors up to 4 levels deep\n\n;; Depth 2\n(define (caar x) (car (car x)))\n(define (cadr x) (car (cdr x)))\n(define (cdar x) (cdr (car x)))\n(define (cddr x) (cdr (cdr x)))\n\n;; Depth 3\n(define (caaar x) (car (car (car x))))\n(define (caadr x) (car (car (cdr x))))\n(define (cadar x) (car (cdr (car x))))\n(define (caddr x) (car (cdr (cdr x))))\n(define (cdaar x) (cdr (car (car x))))\n(define (cdadr x) (cdr (car (cdr x))))\n(define (cddar x) (cdr (cdr (car x))))\n(define (cdddr x) (cdr (cdr (cdr x))))\n\n;; Depth 4\n(define (caaaar x) (car (car (car (car x)))))\n(define (caaadr x) (car (car (car (cdr x)))))\n(define (caadar x) (car (car (cdr (car x)))))\n(define (caaddr x) (car (car (cdr (cdr x)))))\n(define (cadaar x) (car (cdr (car (car x)))))\n(define (cadadr x) (car (cdr (car (cdr x)))))\n(define (caddar x) (car (cdr (cdr (car x)))))\n(define (cadddr x) (car (cdr (cdr (cdr x)))))\n(define (cdaaar x) (cdr (car (car (car x)))))\n(define (cdaadr x) (cdr (car (car (cdr x)))))\n(define (cdadar x) (cdr (car (cdr (car x)))))\n(define (cdaddr x) (cdr (car (cdr (cdr x)))))\n(define (cddaar x) (cdr (cdr (car (car x)))))\n(define (cddadr x) (cdr (cdr (car (cdr x)))))\n(define (cdddar x) (cdr (cdr (cdr (car x)))))\n(define (cddddr x) (cdr (cdr (cdr (cdr x)))))\n",
  "cxr.sld": ";; R7RS (scheme cxr) library\n;; \n;; Provides compound car/cdr accessors up to 4 levels deep.\n;; Per R7RS Appendix A.\n\n(define-library (scheme cxr)\n  (import (scheme core))\n\n  (export\n    ;; Depth 2\n    caar cadr cdar cddr\n    \n    ;; Depth 3\n    caaar caadr cadar caddr\n    cdaar cdadr cddar cdddr\n    \n    ;; Depth 4\n    caaaar caaadr caadar caaddr\n    cadaar cadadr caddar cadddr\n    cdaaar cdaadr cdadar cdaddr\n    cddaar cddadr cdddar cddddr\n  )\n)\n",
  "equality.scm": ";; Equality Procedures\n;; Structural equality testing\n\n;; /**\n;;  * Deep equality check.\n;;  * Recursively compares pairs and vectors. Uses eqv? for other types.\n;;  *\n;;  * @param {*} a - First object.\n;;  * @param {*} b - Second object.\n;;  * @returns {boolean} #t if objects are structurally equal, #f otherwise.\n;;  */\n(define (equal? a b)\n  (cond\n    ((eqv? a b) #t)\n    ((and (pair? a) (pair? b))\n     (and (equal? (car a) (car b))\n          (equal? (cdr a) (cdr b))))\n    ((and (vector? a) (vector? b))\n     (let ((len-a (vector-length a))\n           (len-b (vector-length b)))\n       (if (= len-a len-b)\n           (let loop ((i 0))\n             (if (= i len-a)\n                 #t\n                 (if (equal? (vector-ref a i) (vector-ref b i))\n                     (loop (+ i 1))\n                     #f)))\n           #f)))\n    ((and (bytevector? a) (bytevector? b))\n     (let ((len-a (bytevector-length a))\n           (len-b (bytevector-length b)))\n       (if (= len-a len-b)\n           (let loop ((i 0))\n             (if (= i len-a)\n                 #t\n                 (if (= (bytevector-u8-ref a i) (bytevector-u8-ref b i))\n                     (loop (+ i 1))\n                     #f)))\n           #f)))\n    ((and (string? a) (string? b))\n     (eqv? a b)) ; Strings are primitives in JS, so eqv? (Object.is) works. \n    (else #f)))\n",
  "eval.sld": ";; (scheme eval) library\n;;\n;; R7RS evaluation procedures.\n;; Note: environment procedure not fully supported - returns interaction environment.\n\n(define-library (scheme eval)\n  (import (scheme base))\n  (export eval environment)\n  (begin\n    ;; eval and interaction-environment are already primitives\n    ;; environment returns the interaction-environment for now\n    ;; (R7RS allows implementation-defined behavior for environment)\n    (define (environment . import-specs)\n      (interaction-environment))))\n",
  "file.sld": ";; R7RS (scheme file) library\n;;\n;; Provides file I/O operations (Node.js only).\n;; Per R7RS §6.13.\n\n(define-library (scheme file)\n  (import (scheme primitives))\n  \n  (export\n    open-input-file\n    open-output-file\n    call-with-input-file\n    call-with-output-file\n    file-exists?\n    delete-file\n  )\n  \n  (begin\n    ;; All procedures are implemented as primitives\n    ;; Note: These procedures only work in Node.js\n    ;; Browser calls will raise errors\n  ))\n",
  "lazy.scm": ";; (scheme lazy) library\n;;\n;; R7RS lazy evaluation (delay/force) implementation.\n;;\n;; A promise is a pair: (forced? . value-or-thunk)\n;; - When not forced: (#f . thunk)\n;; - When forced: (#t . value)\n\n;; /**\n;;  * promise? - Check if an object is a promise.\n;;  * @param {*} obj - Object to check.\n;;  * @returns {boolean} True if obj is a promise.\n;;  */\n(define (promise? obj)\n  (and (pair? obj)\n       (pair? (car obj))\n       (eq? (caar obj) 'promise-tag)))\n\n;; Internal promise constructor\n(define (make-promise-internal thunk)\n  (cons (cons 'promise-tag #f) thunk))\n\n;; /**\n;;  * make-promise - Wrap a value in an already-forced promise.\n;;  * @param {*} obj - Value to wrap.\n;;  * @returns {promise} A promise that yields obj.\n;;  */\n(define (make-promise obj)\n  (if (promise? obj)\n      obj\n      (cons (cons 'promise-tag #t) obj)))\n\n;; /**\n;;  * force - Force a promise and return its value.\n;;  * @param {promise} promise - The promise to force.\n;;  * @returns {*} The forced value.\n;;  */\n(define (force promise)\n  (if (not (promise? promise))\n      (error \"force: expected promise\" promise))\n  (if (cdar promise)  ; already forced?\n      (cdr promise)   ; return cached value\n      (let ((result ((cdr promise))))  ; call thunk\n        (if (cdar promise)  ; check again (thunk may have forced recursively)\n            (cdr promise)\n            (begin\n              (set-cdr! (car promise) #t)  ; mark as forced\n              (set-cdr! promise result)     ; cache value\n              result)))))\n",
  "lazy.sld": ";; (scheme lazy) library\n;;\n;; R7RS lazy evaluation procedures.\n\n(define-library (scheme lazy)\n  (import (scheme base))\n  (export delay force make-promise promise? delay-force)\n  (include \"lazy.scm\")\n  (begin\n    ;; /**\n    ;;  * delay - Create a promise that will evaluate expr when forced.\n    ;;  * @syntax (delay expr)\n    ;;  * @returns {promise} A promise.\n    ;;  */\n    ;; Note: Inline promise construction to avoid hygiene issues with internal binding\n    (define-syntax delay\n      (syntax-rules ()\n        ((delay expr)\n         (cons (cons 'promise-tag #f) (lambda () expr)))))\n    \n    ;; /**\n    ;;  * delay-force - Create a promise that forces another promise when forced.\n    ;;  * Used for iterative lazy algorithms.\n    ;;  * @syntax (delay-force expr)\n    ;;  * @returns {promise} A promise.\n    ;;  */\n    (define-syntax delay-force\n      (syntax-rules ()\n        ((delay-force expr)\n         (cons (cons 'promise-tag #f) (lambda () (force expr))))))))\n\n",
  "list.scm": ";; List Procedures\n;; Higher-order list operations and searching\n\n;; /**\n;;  * Native hook for reporting test results.\n;;  * This is intended to be overridden by the environment (Node/Browser) if needed,\n;;  * or used by the test harness to communicate results to the host.\n;;  *\n;;  * @param {...*} args - Test result arguments.\n;;  * @returns {boolean} #f (default implementation).\n;;  */\n(define (native-report-test-result . args) #f)\n\n;; /**\n;;  * Applies a function to corresponding elements of one or more lists.\n;;  * Returns a new list of results. When multiple lists are given,\n;;  * the result is the same length as the shortest list (R7RS).\n;;  * Supports circular lists when used with multiple lists (stops at shortest).\n;;\n;;  * @param {procedure} proc - The function to apply.\n;;  * @param {list} lst - First list.\n;;  * @param {...list} lsts - Additional lists (optional).\n;;  * @returns {list} A new list containing the results.\n;;  */\n(define (map proc lst . lsts)\n  (if (not (procedure? proc))\n      (error \"map: expected procedure\" proc))\n  ;; For proper error messages, check that first arg is a list or null\n  ;; But for circular list support, we only check pair-ness during iteration\n  (if (and (not (null? lst)) (not (pair? lst)))\n      (error \"map: expected list\" lst))\n  (if (null? lsts)\n      ;; Single list case - works with proper lists\n      ;; (circular single list would loop forever - that's expected behavior)\n      (letrec ((loop (lambda (l)\n                       (if (null? l)\n                           '()\n                           (cons (proc (car l))\n                                 (loop (cdr l)))))))\n        (loop lst))\n      ;; Multiple lists case - stop at shortest (works with circular lists)\n      (begin\n        (for-each (lambda (l)\n                    (if (and (not (null? l)) (not (pair? l)))\n                        (error \"map: expected list\" l)))\n                  lsts)\n        (letrec ((any-null? (lambda (lists)\n                              (if (null? lists)\n                                  #f\n                                  (or (null? (car lists))\n                                      (any-null? (cdr lists))))))\n                 (all-cars (lambda (lists)\n                             (if (null? lists)\n                                 '()\n                                 (cons (caar lists) (all-cars (cdr lists))))))\n                 (all-cdrs (lambda (lists)\n                             (if (null? lists)\n                                 '()\n                                 (cons (cdar lists) (all-cdrs (cdr lists))))))\n                 (loop (lambda (first-list rest-lists)\n                         (if (or (null? first-list) (any-null? rest-lists))\n                             '()\n                             (cons (apply proc (cons (car first-list) (all-cars rest-lists)))\n                                   (loop (cdr first-list) (all-cdrs rest-lists)))))))\n          (loop lst lsts)))))\n\n;; /**\n;;  * Applies a procedure to each element of one or more lists for side effects.\n;;  * When multiple lists are given, iterates until the shortest is exhausted (R7RS).\n;;  * Supports circular lists when used with multiple lists.\n;;\n;;  * @param {procedure} proc - The procedure to apply.\n;;  * @param {list} lst - First list.\n;;  * @param {...list} lsts - Additional lists (optional).\n;;  * @returns {undefined} Unspecified.\n;;  */\n(define (for-each proc lst . lsts)\n  (if (not (procedure? proc))\n      (error \"for-each: expected procedure\" proc))\n  ;; Check first arg - allow circular lists (pair? but not list?)\n  (if (and (not (null? lst)) (not (pair? lst)))\n      (error \"for-each: expected list\" lst))\n  (if (null? lsts)\n      ;; Single list case\n      (letrec ((loop (lambda (l)\n                       (if (not (null? l))\n                           (begin\n                             (proc (car l))\n                             (loop (cdr l)))))))\n        (loop lst))\n      ;; Multiple lists case - stop at shortest (works with circular lists)\n      (letrec ((any-null? (lambda (lists)\n                            (if (null? lists)\n                                #f\n                                (or (null? (car lists))\n                                    (any-null? (cdr lists))))))\n               (all-cars (lambda (lists)\n                           (if (null? lists)\n                               '()\n                               (cons (caar lists) (all-cars (cdr lists))))))\n               (all-cdrs (lambda (lists)\n                           (if (null? lists)\n                               '()\n                               (cons (cdar lists) (all-cdrs (cdr lists))))))\n               (loop (lambda (first-list rest-lists)\n                       (if (not (or (null? first-list) (any-null? rest-lists)))\n                           (begin\n                             (apply proc (cons (car first-list) (all-cars rest-lists)))\n                             (loop (cdr first-list) (all-cdrs rest-lists)))))))\n        (loop lst lsts))))\n\n;; /**\n;;  * Applies a procedure to corresponding characters of strings.\n;;  * Returns a new string of the results. When multiple strings are given,\n;;  * the result length is the same as the shortest string (R7RS).\n;;\n;;  * @param {procedure} proc - The procedure to apply.\n;;  * @param {string} str - First string.\n;;  * @param {...string} strs - Additional strings (optional).\n;;  * @returns {string} A new string of the results.\n;;  */\n(define (string-map proc str . strs)\n  (if (not (procedure? proc))\n      (error \"string-map: expected procedure\" proc))\n  (if (not (string? str))\n      (error \"string-map: expected string\" str))\n  ;; Calculate minimum length across all strings\n  (let ((len (let loop ((min-len (string-length str)) (ss strs))\n               (if (null? ss)\n                   min-len\n                   (begin\n                     (if (not (string? (car ss)))\n                         (error \"string-map: expected string\" (car ss)))\n                     (loop (min min-len (string-length (car ss))) (cdr ss)))))))\n    (if (null? strs)\n        ;; Single string case\n        (list->string\n         (letrec ((loop (lambda (i acc)\n                          (if (< i 0)\n                              acc\n                              (loop (- i 1) (cons (proc (string-ref str i)) acc))))))\n           (loop (- len 1) '())))\n        ;; Multiple strings case\n        (list->string\n         (letrec ((loop (lambda (i acc)\n                          (if (< i 0)\n                              acc\n                              (let ((chars (cons (string-ref str i)\n                                                 (map (lambda (s) (string-ref s i)) strs))))\n                                (loop (- i 1) (cons (apply proc chars) acc)))))))\n           (loop (- len 1) '()))))))\n\n;; /**\n;;  * Applies a procedure to corresponding characters of strings for side effects.\n;;\n;;  * @param {procedure} proc - The procedure to apply.\n;;  * @param {string} str - First string.\n;;  * @param {...string} strs - Additional strings (optional).\n;;  * @returns {undefined} Unspecified.\n;;  */\n(define (string-for-each proc str . strs)\n  (if (not (procedure? proc))\n      (error \"string-for-each: expected procedure\" proc))\n  (if (not (string? str))\n      (error \"string-for-each: expected string\" str))\n  (let ((len (string-length str)))\n    (for-each (lambda (s)\n                (if (not (string? s))\n                    (error \"string-for-each: expected string\" s))\n                (if (not (= (string-length s) len))\n                    (error \"string-for-each: strings must have same length\")))\n              strs)\n    (if (null? strs)\n        ;; Single string case\n        (letrec ((loop (lambda (i)\n                         (if (< i len)\n                             (begin\n                               (proc (string-ref str i))\n                               (loop (+ i 1)))))))\n          (loop 0))\n        ;; Multiple strings case\n        (letrec ((loop (lambda (i)\n                         (if (< i len)\n                             (let ((chars (cons (string-ref str i)\n                                                (map (lambda (s) (string-ref s i)) strs))))\n                               (apply proc chars)\n                               (loop (+ i 1)))))))\n          (loop 0)))))\n\n;; /**\n;;  * Applies a procedure to corresponding elements of vectors.\n;;  * Returns a new vector of the results. When multiple vectors are given,\n;;  * the result length is the same as the shortest vector (R7RS).\n;;\n;;  * @param {procedure} proc - The procedure to apply.\n;;  * @param {vector} vec - First vector.\n;;  * @param {...vector} vecs - Additional vectors (optional).\n;;  * @returns {vector} A new vector of the results.\n;;  */\n(define (vector-map proc vec . vecs)\n  (if (not (procedure? proc))\n      (error \"vector-map: expected procedure\" proc))\n  (if (not (vector? vec))\n      (error \"vector-map: expected vector\" vec))\n  ;; Calculate minimum length across all vectors\n  (let ((len (let loop ((min-len (vector-length vec)) (vs vecs))\n               (if (null? vs)\n                   min-len\n                   (begin\n                     (if (not (vector? (car vs)))\n                         (error \"vector-map: expected vector\" (car vs)))\n                     (loop (min min-len (vector-length (car vs))) (cdr vs)))))))\n    (if (null? vecs)\n        ;; Single vector case\n        (let ((result (make-vector len)))\n          (letrec ((loop (lambda (i)\n                           (if (< i len)\n                               (begin\n                                 (vector-set! result i (proc (vector-ref vec i)))\n                                 (loop (+ i 1)))))))\n            (loop 0))\n          result)\n        ;; Multiple vectors case\n        (let ((result (make-vector len)))\n          (letrec ((loop (lambda (i)\n                           (if (< i len)\n                               (let ((elems (cons (vector-ref vec i)\n                                                  (map (lambda (v) (vector-ref v i)) vecs))))\n                                 (vector-set! result i (apply proc elems))\n                                 (loop (+ i 1)))))))\n            (loop 0))\n          result))))\n\n;; /**\n;;  * Applies a procedure to corresponding elements of vectors for side effects.\n;;\n;;  * @param {procedure} proc - The procedure to apply.\n;;  * @param {vector} vec - First vector.\n;;  * @param {...vector} vecs - Additional vectors (optional).\n;;  * @returns {undefined} Unspecified.\n;;  */\n(define (vector-for-each proc vec . vecs)\n  (if (not (procedure? proc))\n      (error \"vector-for-each: expected procedure\" proc))\n  (if (not (vector? vec))\n      (error \"vector-for-each: expected vector\" vec))\n  (let ((len (vector-length vec)))\n    (for-each (lambda (v)\n                (if (not (vector? v))\n                    (error \"vector-for-each: expected vector\" v))\n                (if (not (= (vector-length v) len))\n                    (error \"vector-for-each: vectors must have same length\")))\n              vecs)\n    (if (null? vecs)\n        ;; Single vector case\n        (letrec ((loop (lambda (i)\n                         (if (< i len)\n                             (begin\n                               (proc (vector-ref vec i))\n                               (loop (+ i 1)))))))\n          (loop 0))\n        ;; Multiple vectors case\n        (letrec ((loop (lambda (i)\n                         (if (< i len)\n                             (let ((elems (cons (vector-ref vec i)\n                                                (map (lambda (v) (vector-ref v i)) vecs))))\n                               (apply proc elems)\n                               (loop (+ i 1)))))))\n          (loop 0)))))\n\n;; =============================================================================\n;; Membership Procedures\n;; =============================================================================\n\n;; /**\n;;  * Return the sublist of list whose car is eq? to obj.\n;;  * Return #f if obj is not found.\n;;\n;;  * @param {any} obj - Object to find.\n;;  * @param {list} lst - List to search.\n;;  * @return {list|boolean} Sublist or #f.\n;;  */\n(define (memq obj lst)\n  (if (not (list? lst))\n      (error \"memq: expected list\" lst))\n  (letrec ((loop (lambda (l)\n                   (if (null? l)\n                       #f\n                       (if (eq? obj (car l))\n                           l\n                           (loop (cdr l)))))))\n    (loop lst)))\n\n;; /**\n;;  * Return the sublist of list whose car is eqv? to obj.\n;;  * Return #f if obj is not found.\n;;\n;;  * @param {any} obj - Object to find.\n;;  * @param {list} lst - List to search.\n;;  * @return {list|boolean} Sublist or #f.\n;;  */\n(define (memv obj lst)\n  (if (not (list? lst))\n      (error \"memv: expected list\" lst))\n  (letrec ((loop (lambda (l)\n                   (if (null? l)\n                       #f\n                       (if (eqv? obj (car l))\n                           l\n                           (loop (cdr l)))))))\n    (loop lst)))\n\n;; /**\n;;  * Return the sublist of list whose car is equal? to obj.\n;;  * Return #f if obj is not found.\n;;  * Optionally takes a custom comparison procedure.\n;;\n;;  * @param {any} obj - Object to find.\n;;  * @param {list} lst - List to search.\n;;  * @param {procedure} [compare] - Optional comparison procedure (default equal?).\n;;  * @return {list|boolean} Sublist or #f.\n;;  */\n(define (member obj lst . compare)\n  (if (not (list? lst))\n      (error \"member: expected list\" lst))\n  (let ((cmp (if (null? compare) equal? (car compare))))\n    (letrec ((loop (lambda (l)\n                     (if (null? l)\n                         #f\n                         (if (cmp obj (car l))\n                             l\n                             (loop (cdr l)))))))\n      (loop lst))))\n\n;; =============================================================================\n;; Association List Procedures\n;; =============================================================================\n\n;; /**\n;;  * Return the first element of alist whose car is eq? to obj.\n;;  * Return #f if not found.\n;;\n;;  * @param {any} obj - Key to find.\n;;  * @param {list} alist - Association list to search.\n;;  * @return {pair|boolean} Association pair or #f.\n;;  */\n(define (assq obj alist)\n  (if (not (list? alist))\n      (error \"assq: expected list\" alist))\n  (letrec ((loop (lambda (l)\n                   (if (null? l)\n                       #f\n                       (let ((pair (car l)))\n                         (if (not (pair? pair))\n                             (error \"assq: expected pair in alist\" pair))\n                         (if (eq? obj (car pair))\n                             pair\n                             (loop (cdr l))))))))\n    (loop alist)))\n\n;; /**\n;;  * Return the first element of alist whose car is eqv? to obj.\n;;  * Return #f if not found.\n;;\n;;  * @param {any} obj - Key to find.\n;;  * @param {list} alist - Association list to search.\n;;  * @return {pair|boolean} Association pair or #f.\n;;  */\n(define (assv obj alist)\n  (if (not (list? alist))\n      (error \"assv: expected list\" alist))\n  (letrec ((loop (lambda (l)\n                   (if (null? l)\n                       #f\n                       (let ((pair (car l)))\n                         (if (not (pair? pair))\n                             (error \"assv: expected pair in alist\" pair))\n                         (if (eqv? obj (car pair))\n                             pair\n                             (loop (cdr l))))))))\n    (loop alist)))\n\n;; /**\n;;  * Return the first element of alist whose car is equal? to obj.\n;;  * Return #f if not found. Optionally takes a custom comparison procedure.\n;;\n;;  * @param {any} obj - Key to find.\n;;  * @param {list} alist - Association list to search.\n;;  * @param {procedure} [compare] - Optional comparison procedure (default equal?).\n;;  * @return {pair|boolean} Association pair or #f.\n;;  */\n(define (assoc obj alist . compare)\n  (if (not (list? alist))\n      (error \"assoc: expected list\" alist))\n  (let ((cmp (if (null? compare) equal? (car compare))))\n    (letrec ((loop (lambda (l)\n                     (if (null? l)\n                         #f\n                         (let ((pair (car l)))\n                           (if (not (pair? pair))\n                               (error \"assoc: expected pair in alist\" pair))\n                           (if (cmp obj (car pair))\n                               pair\n                               (loop (cdr l))))))))\n      (loop alist))))\n\n;; =============================================================================\n;; List Accessors and Utilities\n;; =============================================================================\n\n;; /**\n;;  * Returns the length of a proper list.\n;;\n;;  * @param {list} lst - A proper list.\n;;  * @returns {integer} Length of the list.\n;;  */\n(define (length lst)\n  (if (not (list? lst))\n      (error \"length: expected list\" lst))\n  (letrec ((loop (lambda (l count)\n                   (if (null? l)\n                       count\n                       (loop (cdr l) (+ count 1))))))\n    (loop lst 0)))\n\n;; /**\n;;  * Returns the kth element of a list (0-indexed).\n;;\n;;  * @param {pair} lst - A list.\n;;  * @param {integer} k - Index.\n;;  * @returns {*} The kth element.\n;;  */\n(define (list-ref lst k)\n  (if (not (pair? lst))\n      (error \"list-ref: expected pair\" lst))\n  (if (not (integer? k))\n      (error \"list-ref: expected exact integer\" k))\n  (if (< k 0)\n      (error \"list-ref: index out of range\" k))\n  (letrec ((loop (lambda (l i)\n                   (cond\n                     ((null? l) (error \"list-ref: index out of range\" k))\n                     ((not (pair? l)) (error \"list-ref: improper list\" l))\n                     ((= i 0) (car l))\n                     (else (loop (cdr l) (- i 1)))))))\n    (loop lst k)))\n\n;; /**\n;;  * Returns the sublist starting at index k.\n;;\n;;  * @param {list} lst - A list.\n;;  * @param {integer} k - Index.\n;;  * @returns {list} The sublist.\n;;  */\n(define (list-tail lst k)\n  (if (not (integer? k))\n      (error \"list-tail: expected exact integer\" k))\n  (if (< k 0)\n      (error \"list-tail: index out of range\" k))\n  (letrec ((loop (lambda (l i)\n                   (cond\n                     ((= i 0) l)\n                     ((null? l) (error \"list-tail: index out of range\" k))\n                     ((not (pair? l)) (error \"list-tail: improper list\" l))\n                     (else (loop (cdr l) (- i 1)))))))\n    (loop lst k)))\n\n;; /**\n;;  * Reverses a proper list.\n;;\n;;  * @param {list} lst - A proper list.\n;;  * @returns {list} Reversed list.\n;;  */\n(define (reverse lst)\n  (if (not (list? lst))\n      (error \"reverse: expected list\" lst))\n  (letrec ((loop (lambda (l result)\n                   (if (null? l)\n                       result\n                       (loop (cdr l) (cons (car l) result))))))\n    (loop lst '())))\n\n;; /**\n;;  * Creates a shallow copy of a list.\n;;\n;;  * @param {*} obj - An object (if pair, copies structure).\n;;  * @returns {*} Copy of the object.\n;;  */\n(define (list-copy obj)\n  (if (not (pair? obj))\n      obj\n      (cons (car obj) (list-copy (cdr obj)))))\n\n;; /**\n;;  * Creates a list of k elements, each initialized to fill (default is #f).\n;;\n;;  * @param {integer} k - The number of elements.\n;;  * @param {*} fill - The value to fill (optional, default #f).\n;;  * @returns {list} A new list of k elements.\n;;  */\n(define (make-list k . rest)\n  (if (not (integer? k))\n      (error \"make-list: expected integer\" k))\n  (if (< k 0)\n      (error \"make-list: expected non-negative integer\" k))\n  (let ((fill (if (null? rest) #f (car rest))))\n    (letrec ((loop (lambda (n)\n                     (if (= n 0)\n                         '()\n                         (cons fill (loop (- n 1)))))))\n      (loop k))))\n\n;; /**\n;;  * Stores obj in element k of list.\n;;  * It is an error if k is not a valid index of list.\n;;\n;;  * @param {list} lst - A proper list.\n;;  * @param {integer} k - The index.\n;;  * @param {*} obj - The value to store.\n;;  * @returns {unspecified}\n;;  */\n(define (list-set! lst k obj)\n  (if (not (list? lst))\n      (error \"list-set!: expected list\" lst))\n  (if (not (integer? k))\n      (error \"list-set!: expected integer index\" k))\n  (if (or (< k 0) (>= k (length lst)))\n      (error \"list-set!: index out of range\" k))\n  (if (= k 0)\n      (set-car! lst obj)\n      (list-set! (cdr lst) (- k 1) obj)))\n\n",
  "macros.scm": ";; Core Macros\n;; Fundamental macros for bootstrapping\n\n;; /**\n;;  * Logical AND macro.\n;;  * Short-circuits evaluation: returns #f immediately if any expression evaluates to #f.\n;;  * Returns the value of the last expression if all are true.\n;;  *\n;;  * @param {boolean} ...test - Expressions to evaluate.\n;;  * @returns {boolean|*} #f if any test is false, otherwise the value of the last test.\n;;  */\n(define-syntax and\n  (syntax-rules ()\n    ((and) #t)\n    ((and test) test)\n    ((and test1 test2 ...)\n     (if test1 (and test2 ...) #f))))\n\n;; /**\n;;  * Logical OR macro.\n;;  * Short-circuits evaluation: returns the first true value, or #f if all are false.\n;;  *\n;;  * @param {boolean} ...test - Expressions to evaluate.\n;;  * @returns {boolean|*} First true value, or #f.\n;;  */\n(define-syntax or\n  (syntax-rules ()\n    ((or) #f)\n    ((or test) test)\n    ((or test1 test2 ...)\n     (let ((x test1))\n       (if x x (or test2 ...))))))\n\n;; /**\n;;  * Sequential binding macro.\n;;  * Binds variables sequentially, allowing later bindings to refer to earlier ones.\n;;  *\n;;  * @param {list} bindings - List of ((variable init) ...) bindings.\n;;  * @param {...expression} body - Body to evaluate.\n;;  */\n(define-syntax let*\n  (syntax-rules ()\n    ((let* () body1 body2 ...)\n     (let () body1 body2 ...))\n    ((let* ((name1 val1) (name2 val2) ...) body1 body2 ...)\n     (let ((name1 val1))\n       (let* ((name2 val2) ...)\n         body1 body2 ...)))))\n\n;; /**\n;;  * Binds variables to values within a scope.\n;;  * Supports both standard let (parallel binding) and named let (for recursion).\n;;  *\n;;  * @param {symbol|list} tag_or_bindings - Either a name for the loop (named let) or the list of bindings.\n;;  * @param {list} [bindings] - List of ((name val) ...) bindings (if named let).\n;;  * @param {...*} body - Body expressions to evaluate.\n;;  * @returns {*} Result of the last expression in the body.\n;;  */\n(define-syntax let\n  (syntax-rules ()\n    ((let ((name val) ...) body1 body2 ...)\n     ((lambda (name ...) body1 body2 ...) val ...))\n    ((let tag ((name val) ...) body1 body2 ...)\n     ((letrec ((tag (lambda (name ...) body1 body2 ...)))\n        tag)\n      val ...))))\n\n;; /**\n;;  * Recursive binding construct.\n;;  * Allows defining mutually recursive functions.\n;;  *\n;;  * @param {list} bindings - List of ((var init) ...) bindings.\n;;  * @param {...*} body - Body expressions to evaluate.\n;;  * @returns {*} Result of the last expression in the body.\n;;  */\n(define-syntax letrec\n  (syntax-rules ()\n    ((letrec ((var init) ...) body ...)\n     (let ((var 'undefined) ...)\n       (set! var init) ...\n       (let () body ...)))))\n\n;; /**\n;;  * Sequential recursive binding construct.\n;;  * Like letrec but guarantees left-to-right evaluation of inits.\n;;  *\n;;  * @param {list} bindings - List of ((var init) ...) bindings.\n;;  * @param {...*} body - Body expressions to evaluate.\n;;  * @returns {*} Result of the last expression in the body.\n;;  */\n(define-syntax letrec*\n  (syntax-rules ()\n    ;; Empty case\n    ((letrec* () body ...)\n     (let () body ...))\n    ;; Use a helper to collect bindings, then expand\n    ((letrec* ((var init) ...) body ...)\n     (let ((var 'undefined) ...)\n       (letrec* \"init\" ((var init) ...) body ...)))\n    ;; Helper: initialize each binding sequentially, then run body\n    ((letrec* \"init\" () body ...)\n     (let () body ...))\n    ((letrec* \"init\" ((var init) rest ...) body ...)\n     (begin\n       (set! var init)\n       (letrec* \"init\" (rest ...) body ...)))))\n\n;; /**\n;;  * Conditional expression.\n;;  * Evaluates clauses sequentially until one's test evaluates to true.\n;;  *\n;;  * @param {...list} clauses - List of (test expression...) clauses.\n;;  * @returns {*} Result of the evaluated clause, or undefined if no else clause matches.\n;;  */\n(define-syntax cond\n  (syntax-rules (else =>)\n    ((cond (else result1 result2 ...))\n     (begin result1 result2 ...))\n    ((cond (test => result))\n     (let ((temp test))\n       (if temp (result temp))))\n    ((cond (test => result) clause1 clause2 ...)\n     (let ((temp test))\n       (if temp\n           (result temp)\n           (cond clause1 clause2 ...))))\n    ((cond (test)) test)\n    ((cond (test) clause1 clause2 ...)\n     (let ((temp test))\n       (if temp\n           temp\n           (cond clause1 clause2 ...))))\n    ((cond (test result1 result2 ...))\n     (if test (begin result1 result2 ...)))\n    ((cond (test result1 result2 ...) clause1 clause2 ...)\n     (if test\n         (begin result1 result2 ...)\n         (cond clause1 clause2 ...)))))\n\n;; /**\n;;  * Internal helper for defining record fields.\n;;  * Defines accessors and modifiers for a specific field of a record type.\n;;  *\n;;  * @param {symbol} type - The record type name.\n;;  * @param {symbol} field-tag - The field name.\n;;  * @param {symbol} accessor - The name of the accessor function.\n;;  * @param {symbol} [modifier] - The name of the modifier function (optional).\n;;  */\n(define-syntax define-record-field\n  (syntax-rules ()\n    ((define-record-field type field-tag accessor)\n     (define accessor (record-accessor type 'field-tag)))\n    ((define-record-field type field-tag accessor modifier)\n     (begin\n       (define accessor (record-accessor type 'field-tag))\n       (define modifier (record-modifier type 'field-tag))))))\n\n;; /**\n;;  * Defines a new record type.\n;;  * Creates a constructor, a type predicate, and accessors/modifiers for fields.\n;;  *\n;;  * @param {symbol} type - The name of the new record type.\n;;  * @param {list} constructor - (constructor tag ...) specification.\n;;  * @param {symbol} predicate - Name for the type predicate (e.g. my-type?).\n;;  * @param {...list} fields - Field specifications (tag accessor [modifier]).\n;;  */\n(define-syntax define-record-type\n  (syntax-rules ()\n    ((define-record-type type\n       (constructor constructor-tag ...)\n       predicate\n       (field-tag accessor . more) ...)\n     (begin\n       (define type (make-record-type 'type '(field-tag ...)))\n       (define constructor (record-constructor type))\n       (define predicate (record-predicate type))\n       (define-record-field type field-tag accessor . more) ...))))\n\n;; /**\n;;  * Internal helper for defining class fields.\n;;  */\n(define-syntax define-class-field\n  (syntax-rules ()\n    ((define-class-field type field-tag accessor)\n     (define accessor (record-accessor type 'field-tag)))\n    ((define-class-field type field-tag accessor modifier)\n     (begin\n       (define accessor (record-accessor type 'field-tag))\n       (define modifier (record-modifier type 'field-tag))))))\n\n;; /**\n;;  * Internal helper for defining class methods.\n;;  */\n(define-syntax define-class-method\n  (syntax-rules ()\n    ((define-class-method type (name (param ...) body ...))\n     (class-method-set! type 'name (lambda (param ...) body ...)))))\n\n;; /**\n;;  * Defines a new JS-compatible class.\n;;  * Creates a constructor, a type predicate, accessors/modifiers for fields,\n;;  * and methods on the class prototype.\n;;  *\n;;  * Syntax:\n;;  * (define-class type [parent]\n;;  *   (constructor constructor-tag ...)\n;;  *   predicate\n;;  *   (fields (field-tag accessor [modifier]) ...)\n;;  *   (methods (method-name (params ...) body ...) ...))\n;;  */\n(define-syntax define-class\n  (syntax-rules (fields methods)\n    ;; Form with parent class\n    ((define-class type parent\n       (constructor-name field-tag ...)\n       predicate\n       (fields (field-tag-spec accessor . more) ...)\n       (methods (method-name params . body) ...))\n     (begin\n       (define type (make-class 'type parent '(field-tag-spec ...) '(field-tag ...)))\n       (define constructor-name (record-constructor type))\n       (define predicate (record-predicate type))\n       (define-class-field type field-tag-spec accessor . more) ...\n       (define-class-method type (method-name params . body)) ...))\n    ;; Form without parent class\n    ((define-class type\n       (constructor-name field-tag ...)\n       predicate\n       (fields (field-tag-spec accessor . more) ...)\n       (methods (method-name params . body) ...))\n     (begin\n       (define type (make-class 'type #f '(field-tag-spec ...) '(field-tag ...)))\n       (define constructor-name (record-constructor type))\n       (define predicate (record-predicate type))\n       (define-class-field type field-tag-spec accessor . more) ...\n       (define-class-method type (method-name params . body)) ...))))\n",
  "numbers.scm": ";; Numeric Procedures\n;; Comparison operators, predicates, and mathematical functions\n\n;; =============================================================================\n;; Variadic Comparison Operators\n;; =============================================================================\n;; These build on the binary primitives (%num=, %num<, etc.) from JavaScript.\n\n;; /**\n;;  * Numeric equality. Returns #t if all arguments are equal.\n;;\n;;  * @param {number} x - First number.\n;;  * @param {number} y - Second number.\n;;  * @param {...number} rest - Additional numbers.\n;;  * @returns {boolean} #t if all are equal.\n;;  */\n(define (= x y . rest)\n  (if (not (%num= x y))\n      #f\n      (if (null? rest)\n          #t\n          (apply = y rest))))\n\n;; /**\n;;  * Less than. Returns #t if arguments are strictly increasing.\n;;\n;;  * @param {number} x - First number.\n;;  * @param {number} y - Second number.\n;;  * @param {...number} rest - Additional numbers.\n;;  * @returns {boolean} #t if strictly increasing.\n;;  */\n(define (< x y . rest)\n  (if (not (%num< x y))\n      #f\n      (if (null? rest)\n          #t\n          (apply < y rest))))\n\n;; /**\n;;  * Greater than. Returns #t if arguments are strictly decreasing.\n;;\n;;  * @param {number} x - First number.\n;;  * @param {number} y - Second number.\n;;  * @param {...number} rest - Additional numbers.\n;;  * @returns {boolean} #t if strictly decreasing.\n;;  */\n(define (> x y . rest)\n  (if (not (%num> x y))\n      #f\n      (if (null? rest)\n          #t\n          (apply > y rest))))\n\n;; /**\n;;  * Less than or equal. Returns #t if arguments are non-decreasing.\n;;\n;;  * @param {number} x - First number.\n;;  * @param {number} y - Second number.\n;;  * @param {...number} rest - Additional numbers.\n;;  * @returns {boolean} #t if non-decreasing.\n;;  */\n(define (<= x y . rest)\n  (if (not (%num<= x y))\n      #f\n      (if (null? rest)\n          #t\n          (apply <= y rest))))\n\n;; /**\n;;  * Greater than or equal. Returns #t if arguments are non-increasing.\n;;\n;;  * @param {number} x - First number.\n;;  * @param {number} y - Second number.\n;;  * @param {...number} rest - Additional numbers.\n;;  * @returns {boolean} #t if non-increasing.\n;;  */\n(define (>= x y . rest)\n  (if (not (%num>= x y))\n      #f\n      (if (null? rest)\n          #t\n          (apply >= y rest))))\n\n;; =============================================================================\n;; Numeric Predicates\n;; =============================================================================\n\n;; /**\n;;  * Zero predicate.\n;;\n;;  * @param {number} x - Number to check.\n;;  * @returns {boolean} #t if x is zero.\n;;  */\n(define (zero? x)\n  (if (not (number? x))\n      (error \"zero?: expected number\" x))\n  (= x 0))\n\n;; /**\n;;  * Positive predicate.\n;;\n;;  * @param {number} x - Number to check.\n;;  * @returns {boolean} #t if x is positive.\n;;  */\n(define (positive? x)\n  (if (not (number? x))\n      (error \"positive?: expected number\" x))\n  (> x 0))\n\n;; /**\n;;  * Negative predicate.\n;;\n;;  * @param {number} x - Number to check.\n;;  * @returns {boolean} #t if x is negative.\n;;  */\n(define (negative? x)\n  (if (not (number? x))\n      (error \"negative?: expected number\" x))\n  (< x 0))\n\n;; /**\n;;  * Odd predicate.\n;;\n;;  * @param {number} x - Integer to check.\n;;  * @returns {boolean} #t if x is odd.\n;;  */\n(define (odd? x)\n  (if (not (integer? x))\n      (error \"odd?: expected integer\" x))\n  (not (= (modulo x 2) 0)))\n\n;; /**\n;;  * Even predicate.\n;;\n;;  * @param {number} x - Integer to check.\n;;  * @returns {boolean} #t if x is even.\n;;  */\n(define (even? x)\n  (if (not (integer? x))\n      (error \"even?: expected integer\" x))\n  (= (modulo x 2) 0))\n\n;; =============================================================================\n;; Min/Max\n;; =============================================================================\n\n;; /**\n;;  * Maximum. Returns the largest of its arguments.\n;;\n;;  * @param {number} x - First number.\n;;  * @param {...number} rest - Additional numbers.\n;;  * @returns {number} Maximum value.\n;;  */\n(define (max x . rest)\n  (if (not (number? x))\n      (error \"max: expected number\" x))\n  (if (null? rest)\n      x\n      (let ((next (car rest)))\n        (if (not (number? next))\n            (error \"max: expected number\" next))\n        (apply max (if (> x next) x next) (cdr rest)))))\n\n;; /**\n;;  * Minimum. Returns the smallest of its arguments.\n;;\n;;  * @param {number} x - First number.\n;;  * @param {...number} rest - Additional numbers.\n;;  * @returns {number} Minimum value.\n;;  */\n(define (min x . rest)\n  (if (not (number? x))\n      (error \"min: expected number\" x))\n  (if (null? rest)\n      x\n      (let ((next (car rest)))\n        (if (not (number? next))\n            (error \"min: expected number\" next))\n        (apply min (if (< x next) x next) (cdr rest)))))\n\n;; =============================================================================\n;; GCD/LCM\n;; =============================================================================\n\n;; /**\n;;  * Greatest common divisor (binary helper).\n;;\n;;  * @param {integer} a - First integer.\n;;  * @param {integer} b - Second integer.\n;;  * @returns {integer} GCD of a and b.\n;;  */\n(define (%gcd2 a b)\n  (let ((aa (abs a))\n        (bb (abs b)))\n    (if (= bb 0)\n        aa\n        (%gcd2 bb (modulo aa bb)))))\n\n;; /**\n;;  * Greatest common divisor.\n;;\n;;  * @param {...integer} args - Integers.\n;;  * @returns {integer} GCD of all arguments, or 0 if no arguments.\n;;  */\n(define (gcd . args)\n  (for-each (lambda (x)\n              (if (not (integer? x))\n                  (error \"gcd: expected integer\" x)))\n            args)\n  (if (null? args)\n      0\n      (let loop ((result (abs (car args)))\n                 (rest (cdr args)))\n        (if (null? rest)\n            result\n            (loop (%gcd2 result (car rest)) (cdr rest))))))\n\n;; /**\n;;  * Least common multiple.\n;;\n;;  * @param {...integer} args - Integers.\n;;  * @returns {integer} LCM of all arguments, or 1 if no arguments.\n;;  */\n(define (lcm . args)\n  (for-each (lambda (x)\n              (if (not (integer? x))\n                  (error \"lcm: expected integer\" x)))\n            args)\n  (if (null? args)\n      1\n      (let loop ((result (abs (car args)))\n                 (rest (cdr args)))\n        (if (null? rest)\n            result\n            (let ((b (abs (car rest))))\n              (if (or (= result 0) (= b 0))\n                  0\n                  (loop (quotient (* result b) (%gcd2 result b))\n                        (cdr rest))))))))\n\n;; =============================================================================\n;; Rounding (R7RS banker's rounding)\n;; =============================================================================\n\n;; /**\n;;  * Round to nearest integer (R7RS: round half to even).\n;;\n;;  * @param {number} x - Number to round.\n;;  * @returns {number} Rounded value.\n;;  */\n(define (round x)\n  (if (not (number? x))\n      (error \"round: expected number\" x))\n  ;; Convert rational to inexact for arithmetic operations\n  (let ((x (if (rational? x) (inexact x) x)))\n    (let* ((fl (floor x))\n           (frac (- x fl)))\n      (cond\n        ((< frac 0.5) fl)\n        ((> frac 0.5) (+ fl 1))\n        ;; frac = 0.5, round to even\n        ((even? (inexact->exact fl)) fl)\n        (else (+ fl 1))))))\n\n;; Helper for round: convert inexact to exact (truncate to integer)\n(define (inexact->exact x)\n  (truncate x))\n",
  "parameter.scm": ";; R7RS Parameter Objects (§4.2.6)\n;;\n;; Implementation following SRFI-39 / R7RS section 7.3.\n;; Uses dynamic-wind for proper unwinding on control flow exit.\n\n;; =============================================================================\n;; Dynamic Environment\n;; =============================================================================\n\n;; objects to cells (pairs where the cdr holds the value).\n;; The global binding is stored directly in each parameter object.\n\n;; Use a box (list) to hold the environment so we can mutate the contents\n;; without changing the binding. This ensures multiple closures see the update.\n(define *param-dynamic-env-box* (list '()))\n\n;; /**\n;;  * Looks up a parameter in the dynamic environment.\n;;  * Returns the cell bound to the parameter, or the global cell if not found.\n;;  *\n;;  * @param {procedure} parameter - The parameter object.\n;;  * @param {pair} global-cell - The parameter's global cell.\n;;  * @returns {pair} The cell containing the current value.\n;;  */\n(define (param-dynamic-lookup parameter global-cell)\n  (let ((env (car *param-dynamic-env-box*)))\n    (let loop ((env env))\n      (cond ((null? env) global-cell)\n            ((eq? (caar env) parameter) (cdar env))\n            (else (loop (cdr env)))))))\n\n;; =============================================================================\n;; make-parameter\n;; =============================================================================\n\n;; /**\n;;  * Creates a new parameter object.\n;;  *\n;;  * The parameter object is a procedure that:\n;;  * - Called with no arguments: returns the current value\n;;  * - Called with one argument: sets the value (through converter) and returns unspecified\n;;  * - Called with two arguments: internal use for parameterize (returns converted value)\n;;  *\n;;  * @param {*} init - Initial value.\n;;  * @param {procedure} [converter] - Optional conversion procedure.\n;;  * @returns {procedure} The parameter object.\n;;  */\n(define (make-parameter init . conv)\n  (let ((converter (if (null? conv) \n                       (lambda (x) x) \n                       (car conv))))\n    ;; Global cell: (parameter . value)\n    ;; The car is set to the parameter itself for identity\n    (let ((global-cell (cons #f (converter init))))\n      (letrec ((parameter\n                (lambda args\n                  (let ((cell (param-dynamic-lookup parameter global-cell)))\n                    (cond \n                      ;; No arguments: return current value\n                      ((null? args) \n                       (cdr cell))\n                      ;; One argument: set the value\n                      ((null? (cdr args))\n                       (set-cdr! cell (converter (car args))))\n                      ;; Two arguments (internal): return converted value for parameterize\n                      (else \n                       (converter (car args))))))))\n        ;; Store parameter in car for potential debugging\n        (set-car! global-cell parameter)\n        parameter))))\n\n;; =============================================================================\n;; parameterize\n;; =============================================================================\n\n;; /**\n;;  * Binds parameters to values for the dynamic extent of body.\n;;  * Uses dynamic-wind to ensure proper restoration on exit.\n;;  *\n;;  * NOTE: This procedure is called by the parameterize macro and must be\n;;  * exported from the library. This is an implementation detail that will\n;;  * be unnecessary once we have proper referential transparency in macros.\n;;  *\n;;  * @param {list} params - List of parameter objects.\n;;  * @param {list} values - List of values to bind.\n;;  * @param {procedure} body - Thunk to execute.\n;;  * @returns {*} Result of body.\n;;  */\n(define (param-dynamic-bind params values body)\n  (let ((old-env (car *param-dynamic-env-box*)))\n    ;; Create new cells for each parameter with converted values\n    (let ((new-cells \n           (let loop ((ps params) (vs values) (cells '()))\n             (if (null? ps)\n                 (reverse cells)\n                 (loop (cdr ps) \n                       (cdr vs)\n                       ;; Call parameter with 2 args to get converted value\n                       (cons (cons (car ps) \n                                   (cons (car ps) ((car ps) (car vs) #f)))\n                             cells))))))\n      ;; Extend environment and use dynamic-wind for proper unwinding\n      (let ((new-env (append new-cells old-env)))\n        (dynamic-wind\n          (lambda () (set-car! *param-dynamic-env-box* new-env))\n          body\n          (lambda () (set-car! *param-dynamic-env-box* old-env)))))))\n\n;; /**\n;;  * Syntax for dynamic parameter binding.\n;;  *\n;;  * (parameterize ((param1 val1) (param2 val2) ...) body ...)\n;;  *\n;;  * Temporarily binds each parameter to its corresponding value\n;;  * for the dynamic extent of the body expressions.\n;;  */\n(define-syntax parameterize\n  (syntax-rules ()\n    ((parameterize () body ...)\n     (begin body ...))\n    ((parameterize ((param val) ...) body ...)\n     (param-dynamic-bind (list param ...)\n                         (list val ...)\n                         (lambda () body ...)))))\n",
  "process-context.sld": ";; (scheme process-context) library\n;;\n;; R7RS process context procedures.\n;; Some features are environment-specific (Node.js vs browser).\n\n(define-library (scheme process-context)\n  (import (scheme base))\n  (export command-line exit get-environment-variable get-environment-variables\n          emergency-exit)\n  (begin\n    ;; These are implemented as JS primitives that detect the environment\n    ;; and provide appropriate implementations.\n    \n    ;; Note: In browser environment, many of these will return\n    ;; empty/default values or be no-ops.\n    ))\n",
  "read.sld": ";; R7RS (scheme read) library\n;;\n;; Provides the read procedure for parsing S-expressions.\n;; Per R7RS §6.13.2.\n\n(define-library (scheme read)\n  (import (scheme primitives))\n  \n  (export read)\n  \n  (begin\n    ;; read is implemented as a primitive\n  ))\n",
  "repl.scm": ";; (scheme repl) implementation\n;; No extra definitions needed beyond what's in repl.sld\n",
  "repl.sld": ";; (scheme repl) library - R7RS standard\n;;\n;; Provides the interaction environment for REPL use.\n\n(define-library (scheme repl)\n  (import (scheme base))\n  (export interaction-environment)\n  (begin\n    ;; interaction-environment is already a primitive in our system\n    ;; so we just re-export it.\n  ))\n",
  "time.sld": ";; (scheme time) library\n;;\n;; R7RS time procedures using JavaScript Date.\n\n(define-library (scheme time)\n  (import (scheme base))\n  (export current-second current-jiffy jiffies-per-second)\n  (begin\n    ;; /**\n    ;;  * current-second - Returns current time as seconds since epoch.\n    ;;  * @returns {real} Seconds since 1970-01-01 00:00:00 UTC.\n    ;;  */\n    ;; Implemented as JS primitive\n    \n    ;; /**\n    ;;  * current-jiffy - Returns current time in jiffies.\n    ;;  * A jiffy is 1 millisecond in our implementation.\n    ;;  * @returns {integer} Current jiffy count.\n    ;;  */\n    ;; Implemented as JS primitive\n    \n    ;; /**\n    ;;  * jiffies-per-second - Returns the number of jiffies per second.\n    ;;  * @returns {integer} 1000 (milliseconds per second).\n    ;;  */\n    ;; Implemented as JS primitive\n    ))\n",
  "write.sld": ";; R7RS (scheme write) library\n;;\n;; Provides output procedures for formatted writing.\n;; Per R7RS §6.13.3.\n\n(define-library (scheme write)\n  (import (scheme primitives))\n  \n  (export\n    display\n    write\n    ;; write-shared and write-simple are optional extensions\n    ;; that we don't implement yet\n  )\n  \n  (begin\n    ;; Bindings come from primitives\n  ))\n",
  "interop.sld": ";; (scheme-js interop) library\n;;\n;; JavaScript interoperability primitives for Scheme.\n;; Provides js-eval, js-ref (property access), and js-set! (property mutation).\n\n(define-library (scheme-js interop)\n  (import (scheme base))\n  (export\n    js-eval\n    js-ref\n    js-set!\n    js-invoke\n    js-obj\n    js-obj-merge))\n",
  "promise.scm": ";; JavaScript Promise Interoperability - Scheme Implementation\n;;\n;; This file provides the async-lambda macro which transforms\n;; code with await forms into CPS (Continuation-Passing Style).\n;;\n;; Example:\n;;   (async-lambda (url)\n;;     (let ((response (await (fetch url))))\n;;       (await (parse-json response))))\n;;\n;; Expands to:\n;;   (lambda (url)\n;;     (js-promise-then (fetch url)\n;;       (lambda (response)\n;;         (js-promise-then (parse-json response)\n;;           (lambda (v) v)))))\n\n;; ============================================================================\n;; async-lambda Macro\n;; ============================================================================\n\n;; /**\n;;  * async-lambda - Define a lambda that can use await to suspend on promises.\n;;  * \n;;  * Each (await expr) form becomes a promise-then boundary, transforming\n;;  * the remainder of the body into a continuation callback.\n;;  *\n;;  * @syntax (async-lambda (args ...) body ...)\n;;  * @returns {procedure} A procedure that returns a Promise\n;;  *\n;;  * LIMITATIONS:\n;;  * - call/cc captured BEFORE an await can escape the promise chain when invoked\n;;  * - call/cc captured AFTER an await only captures the current callback scope\n;;  * - TCO works within each callback segment, but not across await boundaries\n;;  */\n(define-syntax async-lambda\n  (syntax-rules ()\n    ;; Base case: body with no await - just return the value\n    ((async-lambda (args ...) body)\n     (lambda (args ...) (js-promise-resolve body)))\n    ;; Entry point for multiple expressions  \n    ((async-lambda (args ...) expr exprs ...)\n     (lambda (args ...)\n       (async-body expr exprs ...)))))\n\n;; /**\n;;  * async-body - Helper macro to process async body expressions.\n;;  * Transforms await forms to promise-then chains.\n;;  */\n(define-syntax async-body\n  (syntax-rules (await let)\n    ;; Single expression - wrap in resolved promise\n    ((async-body expr)\n     (js-promise-resolve expr))\n    ;; Let with await in binding - transform to promise-then\n    ((async-body (let ((var (await promise-expr))) body ...) rest ...)\n     (js-promise-then promise-expr\n       (lambda (var)\n         (async-body body ... rest ...))))\n    ;; Let without await - keep as is, continue processing\n    ((async-body (let ((var val)) body ...) rest ...)\n     (let ((var val))\n       (async-body body ... rest ...)))\n    ;; Non-let expression followed by more - sequence them\n    ((async-body expr rest ...)\n     (js-promise-then (js-promise-resolve expr)\n       (lambda (_)\n         (async-body rest ...))))))\n\n;; ============================================================================\n;; Promise Composition Utilities\n;; ============================================================================\n\n;; /**\n;;  * js-promise-map - Apply a function to the resolved value of a promise.\n;;  * @param {procedure} f - Function to apply\n;;  * @param {promise} p - Promise to map over\n;;  * @returns {promise} A new promise with the mapped value\n;;  */\n(define (js-promise-map f p)\n  (js-promise-then p f))\n\n;; /**\n;;  * js-promise-chain - Chain multiple promise-returning functions.\n;;  * @param {promise} p - Initial promise\n;;  * @param {procedure...} fs - Functions to chain (each takes a value, returns a promise)\n;;  * @returns {promise} Final promise in the chain\n;;  */\n(define (js-promise-chain p . fs)\n  (if (null? fs)\n      p\n      (apply js-promise-chain \n             (js-promise-then p (car fs))\n             (cdr fs))))\n\n\n",
  "promise.sld": ";; (scheme-js promise) library\n;;\n;; JavaScript Promise interoperability for Scheme.\n;; Provides primitives and macros for working with JavaScript Promises\n;; in a CPS-style that preserves TCO within callback segments.\n\n(define-library (scheme-js promise)\n  (import (scheme base))\n  (export \n    ;; Predicates\n    js-promise?\n    ;; Constructors\n    make-js-promise\n    js-promise-resolve\n    js-promise-reject\n    ;; Combinators\n    js-promise-then\n    js-promise-catch\n    js-promise-finally\n    js-promise-all\n    js-promise-race\n    js-promise-all-settled\n    ;; Scheme utilities\n    js-promise-map\n    js-promise-chain\n    ;; Macro for CPS transformation\n    async-lambda)\n  (include \"promise.scm\"))\n"
};

/**
 * Pretty-prints a Scheme value for the REPL.
 * @param {*} val - The value from the interpreter.
 * @returns {string}
 */
function prettyPrint(val) {
    if (val instanceof LiteralNode) {
        return prettyPrint(val.value);
    }
    // Check for Scheme closures (callable functions with marker)
    if (isSchemeClosure(val)) {
        return "#<procedure>";
    }
    // Check for Scheme continuations (callable functions with marker)
    if (isSchemeContinuation(val)) {
        return "#<continuation>";
    }
    // Regular JS functions
    if (typeof val === 'function') {
        return "#<procedure>";
    }
    if (val instanceof VariableNode) {
        return val.name;
    }
    if (val instanceof Symbol$1) {
        return val.name;
    }

    if (val instanceof Cons) {
        return `(${prettyPrintList(val)})`;
    }
    if (val === null) {
        return "'()";
    }
    if (val === true) {
        return "#t";
    }
    if (val === false) {
        return "#f";
    }
    if (typeof val === 'string') {
        // Check if it's a display string or a symbol-like string
        if (val.startsWith('[Native Error:')) return val;
        return `"${val.replace(/"/g, '\\"')}"`; // Show as string
    }
    if (Array.isArray(val)) {
        return `#(${val.map(prettyPrint).join(' ')})`;
    }
    // Numbers
    return `${val}`;
}

function prettyPrintList(cons) {
    const elems = [];
    let curr = cons;
    while (curr instanceof Cons) {
        elems.push(prettyPrint(curr.car));
        curr = curr.cdr;
    }
    if (curr !== null) {
        // Improper list
        return `${elems.join(' ')} . ${prettyPrint(curr)}`;
    }
    return elems.join(' ');
}

/**
 * Utility functions for expression completeness detection and delimiter matching.
 * Used by the browser REPL for multiline expression support and paren matching.
 * @module expression_utils
 */

/**
 * Checks if a string contains one or more complete S-expressions.
 * Returns true if the input is complete (can be parsed), false if incomplete
 * (unclosed parentheses, strings, or quotes needing more input).
 * 
 * @param {string} input - Source code to check
 * @returns {boolean} True if input contains complete expression(s)
 */
function isCompleteExpression(input) {
    if (!input || input.trim() === '') {
        return false;
    }

    // Track nesting depth and string/comment state
    let parenDepth = 0;
    let bracketDepth = 0; // for #( vectors
    let inString = false;
    let inLineComment = false;
    let blockCommentDepth = 0;
    let i = 0;

    while (i < input.length) {
        const char = input[i];
        const next = i + 1 < input.length ? input[i + 1] : '';

        // Handle line comments
        if (inLineComment) {
            if (char === '\n') {
                inLineComment = false;
            }
            i++;
            continue;
        }

        // Handle block comments
        if (blockCommentDepth > 0) {
            if (char === '|' && next === '#') {
                blockCommentDepth--;
                i += 2;
            } else if (char === '#' && next === '|') {
                blockCommentDepth++;
                i += 2;
            } else {
                i++;
            }
            continue;
        }

        // Handle strings
        if (inString) {
            if (char === '\\' && i + 1 < input.length) {
                // Escape sequence - skip next char
                i += 2;
            } else if (char === '"') {
                inString = false;
                i++;
            } else {
                i++;
            }
            continue;
        }

        // Start of line comment
        if (char === ';') {
            inLineComment = true;
            i++;
            continue;
        }

        // Start of block comment
        if (char === '#' && next === '|') {
            blockCommentDepth++;
            i += 2;
            continue;
        }

        // Start of string
        if (char === '"') {
            inString = true;
            i++;
            continue;
        }

        // Parentheses
        if (char === '(') {
            parenDepth++;
            i++;
            continue;
        }

        if (char === ')') {
            parenDepth--;
            // Mismatched closing paren - invalid but "complete" in the sense of not needing more input
            if (parenDepth < 0) {
                return true; // Let the parser report the error
            }
            i++;
            continue;
        }

        // Vector start #(
        if (char === '#' && next === '(') {
            bracketDepth++;
            i += 2;
            continue;
        }

        // Bytevector start #u8(
        if (char === '#' && next === 'u' && i + 3 < input.length &&
            input[i + 2] === '8' && input[i + 3] === '(') {
            bracketDepth++;
            i += 4;
            continue;
        }

        // Quote-like prefixes (' ` , ,@) - these require a following datum
        if (char === "'" || char === '`') {
            // Need to check if there's a complete datum after this
            const remaining = input.slice(i + 1).trim();
            if (remaining === '') {
                return false; // Quote with nothing after it
            }
            i++;
            continue;
        }

        if (char === ',') {
            if (next === '@') {
                i += 2;
            } else {
                i++;
            }
            // Need to check if there's a complete datum after this
            const remaining = input.slice(i).trim();
            if (remaining === '') {
                return false; // Unquote with nothing after it
            }
            continue;
        }

        i++;
    }

    // Check final state
    if (inString) {
        return false; // Unclosed string
    }
    if (blockCommentDepth > 0) {
        return false; // Unclosed block comment
    }
    if (parenDepth > 0 || bracketDepth > 0) {
        return false; // Unclosed parentheses
    }

    return true;
}

/**
 * Finds the position of the matching delimiter for the one at the given position.
 * 
 * @param {string} text - Source code
 * @param {number} position - Position of the delimiter to match
 * @returns {number|null} Position of matching delimiter, or null if not found
 */
function findMatchingDelimiter(text, position) {
    if (position < 0 || position >= text.length) {
        return null;
    }

    const char = text[position];

    // Opening delimiter - search forward
    if (char === '(') {
        return findForward(text, position, '(', ')');
    }

    // Closing delimiter - search backward
    if (char === ')') {
        return findBackward(text, position, '(', ')');
    }

    return null;
}

/**
 * Search forward for matching closing delimiter.
 */
function findForward(text, startPos, open, close) {
    let depth = 0;
    let inString = false;
    let inLineComment = false;
    let blockCommentDepth = 0;

    for (let i = startPos; i < text.length; i++) {
        const char = text[i];
        const next = i + 1 < text.length ? text[i + 1] : '';

        // Skip comments and strings
        if (inLineComment) {
            if (char === '\n') inLineComment = false;
            continue;
        }
        if (blockCommentDepth > 0) {
            if (char === '|' && next === '#') { blockCommentDepth--; i++; }
            else if (char === '#' && next === '|') { blockCommentDepth++; i++; }
            continue;
        }
        if (inString) {
            if (char === '\\') { i++; continue; }
            if (char === '"') inString = false;
            continue;
        }
        if (char === ';') { inLineComment = true; continue; }
        if (char === '#' && next === '|') { blockCommentDepth++; i++; continue; }
        if (char === '"') { inString = true; continue; }

        // Track parentheses
        if (char === open) {
            depth++;
        } else if (char === close) {
            depth--;
            if (depth === 0) {
                return i;
            }
        }
    }

    return null;
}

/**
 * Search backward for matching opening delimiter.
 */
function findBackward(text, startPos, open, close) {
    let depth = 0;
    // Simple backward search - doesn't handle all comment cases perfectly
    // but good enough for UI highlighting
    let inString = false;

    for (let i = startPos; i >= 0; i--) {
        const char = text[i];
        const prev = i > 0 ? text[i - 1] : '';

        // Basic string handling (imperfect but functional)
        if (char === '"' && prev !== '\\') {
            inString = !inString;
            continue;
        }
        if (inString) continue;

        // Track parentheses
        if (char === close) {
            depth++;
        } else if (char === open) {
            depth--;
            if (depth === 0) {
                return i;
            }
        }
    }

    return null;
}

// Create a single shared interpreter and environment instance
const { interpreter, env } = createInterpreter();

// =============================================================================
// Bootstrap: Load standard libraries from embedded sources
// =============================================================================

// Set file resolver to read from embedded sources (no file I/O needed)
setFileResolver((libraryName) => {
    const fileName = libraryName[libraryName.length - 1];

    // Try .sld then .scm
    if (BUNDLED_SOURCES[fileName + '.sld']) return BUNDLED_SOURCES[fileName + '.sld'];
    if (BUNDLED_SOURCES[fileName + '.scm']) return BUNDLED_SOURCES[fileName + '.scm'];
    if (BUNDLED_SOURCES[fileName]) return BUNDLED_SOURCES[fileName];

    throw new Error(`Library not found in bundled sources: ${libraryName.join('/')}`);
});

// Load standard libraries via import statement
// Excludes (scheme file) and (scheme process-context) which require Node.js
const imports = `
    (import (scheme base)
            (scheme write)
            (scheme read)
            (scheme repl)
            (scheme lazy)
            (scheme case-lambda)
            (scheme eval)
            (scheme time)
            (scheme complex)
            (scheme cxr)
            (scheme char)
            (scheme-js promise)
            (scheme-js interop))
`;
for (const exp of parse(imports)) {
    interpreter.run(analyze(exp), env);
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Internal helper to parse, analyze, and execute Scheme code.
 * @param {string} code - The Scheme source code.
 * @returns {*} The result of the evaluation.
 */
function evalCode(code) {
    const asts = parse(code);
    if (asts.length === 0) return undefined;

    let ast;
    if (asts.length === 1) {
        ast = analyze(asts[0]);
    } else {
        ast = analyze(list(intern('begin'), ...asts));
    }

    return interpreter.run(ast);
}

/**
 * Evaluates Scheme code synchronously.
 * @param {string} code - The Scheme source code.
 * @returns {*} The result of the evaluation.
 */
function schemeEval(code) {
    return evalCode(code);
}

/**
 * Evaluates Scheme code asynchronously.
 * Returns a Promise that resolves to the result.
 * @param {string} code - The Scheme source code.
 * @returns {Promise<*>} A promise resolving to the result.
 */
function schemeEvalAsync(code) {
    return new Promise((resolve, reject) => {
        try {
            resolve(evalCode(code));
        } catch (e) {
            reject(e);
        }
    });
}

export { analyze, env, findMatchingDelimiter, interpreter, isCompleteExpression, parse, prettyPrint, schemeEval, schemeEvalAsync };
