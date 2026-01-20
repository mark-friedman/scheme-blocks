;; mixins.scm - Block mixins for Blockly
;;
;; Provides mixins that can be applied to Blockly blocks to add
;; shared functionality.

(import (scheme base) (scheme-js interop))

;; ---------------------------------------------------------------------------
;; Utility Functions
;; ---------------------------------------------------------------------------

;; Check if a value is a function
;; @param {*} val - Value to check
;; @returns {boolean} True if val is a function
(define (function? val)
  (equal? (js-typeof val) "function"))

;; ---------------------------------------------------------------------------
;; Chameleon Mixin
;; ---------------------------------------------------------------------------

;; A mixin that allows blocks to be both statements and expressions.
;; The block changes shape based on how it's connected:
;; - If connected to an output socket, it becomes an expression (no prev/next)
;; - If connected via prev/next, it becomes a statement (no output)
;; - When floating, it has all connections available
;;
;; Each method receives the original function (or undefined) as first argument.

(define chameleon-mixin
  #{(init
      (lambda (orig-init)
        (set! this.hasPreviousAndNext #t)
        (set! this.hasOutput #t)
        (this.setConnections)))

    (setConnections
      (lambda (orig-set-connections)
        (when (function? orig-set-connections)
          (orig-set-connections))
        ;; Handle previous/next connections
        (if this.hasPreviousAndNext
            (begin
              (unless this.nextConnection
                (this.setNextStatement #t))
              (unless this.previousConnection
                (this.setPreviousStatement #t)))
            (begin
              (this.setNextStatement #f)
              (this.setPreviousStatement #f)))
        ;; Handle output connection
        (if this.hasOutput
            (unless this.outputConnection
              (this.setOutput #t))
            (this.setOutput #f))))

    (onPendingConnection
      (lambda (orig-on-pending-connection closest-connection)
        (when (function? orig-on-pending-connection)
          (orig-on-pending-connection closest-connection))
        (this.setOutput #f)))

    (onchange
      (lambda (orig-on-change event)
        (when (function? orig-on-change)
          (orig-on-change event))
        ;; Only respond to block drag events
        (when (equal? event.type Blockly.Events.BLOCK_DRAG)
          ;; Reset to all connections
          (set! this.hasPreviousAndNext #t)
          (set! this.hasOutput #t)
          ;; Check if connected as output
          (when (and this.outputConnection
                     (this.outputConnection.targetBlock))
            (set! this.hasPreviousAndNext #f))
          ;; Check if connected as statement
          (when (or (this.getPreviousBlock) (this.getNextBlock))
            (set! this.hasOutput #f))
          (this.updateShape))))

    (saveExtraState
      (lambda (orig-save-extra-state)
        (let ((orig-state (if (function? orig-save-extra-state)
                              (orig-save-extra-state)
                              #{})))
          ;; Use spread syntax to merge objects
          #{(... orig-state)
            (hasOutput this.hasOutput)
            (hasPreviousAndNext this.hasPreviousAndNext)})))

    (loadExtraState
      (lambda (orig-load-extra-state state)
        (when (function? orig-load-extra-state)
          ((orig-load-extra-state.bind this) state))
        (set! this.hasPreviousAndNext state.hasPreviousAndNext)
        (set! this.hasOutput state.hasOutput)
        (this.updateShape)))

    (updateShape
      (lambda (orig-update-shape)
        (when (function? orig-update-shape)
          (orig-update-shape))
        (this.setConnections)))})

;; Export for use by other modules
(set! window.chameleonMixin chameleon-mixin)
