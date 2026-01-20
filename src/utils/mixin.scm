;; mixin.scm - Mixin utilities for Blockly blocks
;;
;; Provides functions to mix properties from one object into another,
;; with special handling for functions to allow calling the original.

(import (scheme base) (scheme-js interop))

;; ---------------------------------------------------------------------------
;; Utility Functions
;; ---------------------------------------------------------------------------

;; Check if a value is a function
;; @param {*} val - Value to check
;; @returns {boolean} True if val is a function
(define (function? val)
  (equal? (js-typeof val) "function"))

;; Get all own property names of an object
;; @param {Object} obj - Object to get keys from
;; @returns {Array} Array of property names
(define (object-keys obj)
  (let ((Object (js-eval "Object")))
    (Object.keys obj)))

;; ---------------------------------------------------------------------------
;; Mixin Function
;; ---------------------------------------------------------------------------

;; Copy properties from mixin object to a target object.
;;
;; Function-valued properties in the mixin will be converted to equivalent
;; functions with the target's same-named property bound as the first
;; argument. This allows mixed-in functions to call the original.
;;
;; @param {Object} mixin-obj - Source object to mixin properties from
;; @param {Object} target-obj - Target object to mix into
(define (mixin mixin-obj target-obj)
  (let ((keys (object-keys mixin-obj)))
    ;; Iterate using vector-ref since keys is a JS array (which is a Scheme vector)
    (let loop ((i 0))
      (when (< i (vector-length keys))
        (let* ((key (vector-ref keys i))
               (mixin-val (js-ref mixin-obj key))
               (target-val (js-ref target-obj key)))
          (if (function? mixin-val)
              ;; For functions, wrap to pass original as first arg
              (let ((bound-target-val
                      (if (function? target-val)
                          (target-val.bind target-obj)
                          target-val)))
                ;; Use js-set! for dynamic key
                (js-set! target-obj key
                  (mixin-val.bind target-obj bound-target-val)))
              ;; For non-functions, copy directly
              (js-set! target-obj key mixin-val)))
        (loop (+ i 1))))))

;; ---------------------------------------------------------------------------
;; Blockly Mixin Function
;; ---------------------------------------------------------------------------

;; Copy properties from source object to a target object.
;;
;; Wraps the mixin function to call the mixin's init() function if it exists.
;; This is because for Blockly the call to this function is in the original
;; init() before we've had a chance to mixin any properties.
;;
;; @param {Object} mixin-obj - Source object to copy properties from
;; @param {Object} target-obj - Target object to copy properties to
(define (blockly-mixin mixin-obj target-obj)
  ;; Mix in properties first
  (mixin mixin-obj target-obj)
  ;; Call the mixin's init function if it exists
  (let ((mixin-init mixin-obj.init))
    (when (function? mixin-init)
      ;; Call init with an empty function as orig-init, bound to target
      ((mixin-init.bind target-obj) (lambda () #f)))))
