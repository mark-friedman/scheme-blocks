;; init.scm - Blockly initialization for Scheme Blocks
;;
;; This file initializes the Blockly workspace and the Scheme code generator.
;; It runs after the webpack-bundled index.js has exposed Blockly and 
;; LexicalVariablesPlugin as globals.

(import (scheme base) (scheme-js interop))

;; ---------------------------------------------------------------------------
;; Global Setup
;; ---------------------------------------------------------------------------

;; Initialize Scheme generator globally
(define scheme-code-generator (js-new Blockly.Generator "Scheme"))
(set! window.schemeCodeGenerator scheme-code-generator)

;; Initial toolbox (empty, will be populated by procedures.scm)
(define initial-toolbox #{(kind "categoryToolbox") (contents #())})

;; Inject Blockly workspace into the DOM
(define workspace (Blockly.inject "blocklyDiv" 
                   #{(toolbox initial-toolbox) 
                     (media "media/")}))

;; Load lexical variable plugin
(LexicalVariablesPlugin.init workspace)

(console.log "Blockly initialized from init.scm")
