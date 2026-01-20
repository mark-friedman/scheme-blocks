;; app.scm - Main Scheme application for Scheme Blocks
;;
;; This file provides Scheme-based functionality for the Scheme Blocks IDE.
;; It accesses the Blockly workspace and code generator that are exposed
;; as globals by the webpack-bundled index.js.

(import (scheme base) (scheme-js interop))

;; ---------------------------------------------------------------------------
;; Global References
;; ---------------------------------------------------------------------------

;; Access Blockly and the Scheme code generator from window globals
(define blockly window.Blockly)
(define generator window.schemeCodeGenerator)

;; ---------------------------------------------------------------------------
;; Code Generation
;; ---------------------------------------------------------------------------

;; Generate Scheme code from the current workspace
;; Returns the generated code as a string, or an error message
(define (generate-code)
  (let ((workspace (blockly.getMainWorkspace)))
    (if workspace
        (guard (e (else (string-append "Error: " (if (js-object? e) e.message (display-to-string e)))))
          (generator.workspaceToCode workspace))
        "")))

;; Generate code and log it to the console
(define (generate-and-log-code)
  (let ((code (generate-code)))
    (console.log "Generated Scheme code:")
    (console.log code)
    code))

;; ---------------------------------------------------------------------------
;; UI Integration
;; ---------------------------------------------------------------------------

;; Wire up the "Generate Code" button
(define (setup-generate-button)
  (let ((btn (document.getElementById "blocklyButton")))
    (when btn
      (btn.addEventListener "click"
        (lambda (event)
          (generate-and-log-code))))))

;; ---------------------------------------------------------------------------
;; Initialization
;; ---------------------------------------------------------------------------

;; Set up the application
(setup-generate-button)

;; Log that Scheme integration is ready
(console.log "Scheme Blocks app.scm loaded successfully")
