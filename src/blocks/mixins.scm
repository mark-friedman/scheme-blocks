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
        ;; Note: Use js-null? because JavaScript null is truthy in Scheme
        (if this.hasPreviousAndNext
            (begin
              (when (or (js-null? this.nextConnection) (js-undefined? this.nextConnection))
                (this.setNextStatement #t))
              (when (or (js-null? this.previousConnection) (js-undefined? this.previousConnection))
                (this.setPreviousStatement #t)))
            (begin
              ;; Only remove connections if they're not currently in use
              (when (and (not (js-null? this.nextConnection))
                         (not (js-undefined? this.nextConnection))
                         (not (this.nextConnection.isConnected)))
                (this.setNextStatement #f))
              (when (and (not (js-null? this.previousConnection))
                         (not (js-undefined? this.previousConnection))
                         (not (this.previousConnection.isConnected)))
                (this.setPreviousStatement #f))))
        ;; Handle output connection
        (if this.hasOutput
            (when (or (js-null? this.outputConnection) (js-undefined? this.outputConnection))
              (this.setOutput #t))
            ;; Only remove output if it's not currently in use
            (when (and (not (js-null? this.outputConnection))
                       (not (js-undefined? this.outputConnection))
                       (not (this.outputConnection.isConnected)))
              (this.setOutput #f)))))

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
          ;; Check if connected as output - call targetBlock() as method
          (when (and (not (js-null? this.outputConnection))
                     (not (js-undefined? this.outputConnection)))
            (let ((target ((js-ref this.outputConnection "targetBlock"))))
              (when (and (not (js-null? target)) (not (js-undefined? target)))
                (set! this.hasPreviousAndNext #f))))
          ;; Check if connected as statement - call methods properly
          (let ((prev-block (this.getPreviousBlock))
                (next-block (this.getNextBlock)))
            (when (or (and (not (js-null? prev-block)) (not (js-undefined? prev-block)))
                      (and (not (js-null? next-block)) (not (js-undefined? next-block))))
              (set! this.hasOutput #f)))
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
