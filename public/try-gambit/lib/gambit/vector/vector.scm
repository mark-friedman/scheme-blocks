;;;============================================================================

;;; File: "vector.scm"

;;; Copyright (c) 2020-2022 by Marc Feeley, All Rights Reserved.

;;;============================================================================

;;; Vector operations.

;;(##include "vector#.scm")

;;;----------------------------------------------------------------------------

(define-prim-vector-procedures
  vector
  obj
  object
  0
  macro-no-force
  macro-no-check
  macro-no-check
  #f
  #f
  define-map-and-for-each
  ##equal?)

(define-prim-vector-procedures
  u8vector
  u8value
  exact-unsigned-int8
  0
  macro-force-vars
  macro-check-exact-unsigned-int8
  macro-check-exact-unsigned-int8-list-exact-unsigned-int8
  macro-test-exact-unsigned-int8
  ##fail-check-exact-unsigned-int8
  #f
  ##fx=)

(macro-if-s8vector
 (define-prim-vector-procedures
   s8vector
   s8value
   exact-signed-int8
   0
   macro-force-vars
   macro-check-exact-signed-int8
   macro-check-exact-signed-int8-list-exact-signed-int8
   macro-test-exact-signed-int8
   ##fail-check-exact-signed-int8
   #f
   ##fx=))

(macro-if-u16vector
 (define-prim-vector-procedures
   u16vector
   u16value
   exact-unsigned-int16
   0
   macro-force-vars
   macro-check-exact-unsigned-int16
   macro-check-exact-unsigned-int16-list-exact-unsigned-int16
   macro-test-exact-unsigned-int16
   ##fail-check-exact-unsigned-int16
   #f
   ##fx=))

(macro-if-s16vector
 (define-prim-vector-procedures
   s16vector
   s16value
   exact-signed-int16
   0
   macro-force-vars
   macro-check-exact-signed-int16
   macro-check-exact-signed-int16-list-exact-signed-int16
   macro-test-exact-signed-int16
   ##fail-check-exact-signed-int16
   #f
   ##fx=))

(macro-if-u32vector
 (define-prim-vector-procedures
   u32vector
   u32value
   exact-unsigned-int32
   0
   macro-force-vars
   macro-check-exact-unsigned-int32
   macro-check-exact-unsigned-int32-list-exact-unsigned-int32
   macro-test-exact-unsigned-int32
   ##fail-check-exact-unsigned-int32
   #f
   ##eqv?))

(macro-if-s32vector
 (define-prim-vector-procedures
   s32vector
   s32value
   exact-signed-int32
   0
   macro-force-vars
   macro-check-exact-signed-int32
   macro-check-exact-signed-int32-list-exact-signed-int32
   macro-test-exact-signed-int32
   ##fail-check-exact-signed-int32
   #f
   ##eqv?))

(macro-if-u64vector
 (define-prim-vector-procedures
   u64vector
   u64value
   exact-unsigned-int64
   0
   macro-force-vars
   macro-check-exact-unsigned-int64
   macro-check-exact-unsigned-int64-list-exact-unsigned-int64
   macro-test-exact-unsigned-int64
   ##fail-check-exact-unsigned-int64
   #f
   ##eqv?))

(macro-if-s64vector
 (define-prim-vector-procedures
   s64vector
   s64value
   exact-signed-int64
   0
   macro-force-vars
   macro-check-exact-signed-int64
   macro-check-exact-signed-int64-list-exact-signed-int64
   macro-test-exact-signed-int64
   ##fail-check-exact-signed-int64
   #f
   ##eqv?))

(macro-if-f32vector
 (define-prim-vector-procedures
   f32vector
   f32value
   inexact-real
   0.
   macro-force-vars
   macro-check-inexact-real
   macro-check-inexact-real-list-inexact-real
   macro-test-inexact-real
   ##fail-check-inexact-real
   #f
   ##fleqv?))

(define-prim-vector-procedures
  f64vector
  f64value
  inexact-real
  0.
  macro-force-vars
  macro-check-inexact-real
  macro-check-inexact-real-list-inexact-real
  macro-test-inexact-real
  ##fail-check-inexact-real
  #f
  ##fleqv?)

(define-prim-vector-procedures
  values
  obj
  object
  0
  macro-no-force
  macro-no-check
  macro-no-check
  #f
  #f
  #f
  ##equal?)

;;;----------------------------------------------------------------------------

(define-prim (##vector-cas! vect k val oldval))

(define-prim (vector-cas! vect k val oldval)
  (macro-force-vars (vect k oldval)
    (macro-check-vector vect 1 (vector-cas! vect k val oldval)
      (macro-check-mutable vect 1 (vector-cas! vect k val oldval)
        (macro-check-index-range
          k
          2
          0
          (##vector-length vect)
          (vector-cas! vect k val oldval)
          (##vector-cas! vect k val oldval))))))

(define-prim (##vector-inc! vect k val))

(define-prim (vector-inc! vect k #!optional (v (macro-absent-obj)))
  (macro-force-vars (vect k v)
    (macro-check-vector vect 1 (vector-inc! vect k v)
      (macro-check-mutable vect 1 (vector-inc! vect k v)
        (macro-check-index-range
          k
          2
          0
          (##vector-length vect)
          (vector-inc! vect k v)
          (let ((val (if (##eq? v (macro-absent-obj)) 1 v)))
            (macro-check-fixnum
              val
              3
              (vector-inc! vect k v)
              (let ((elem (##vector-ref vect k)))
                (macro-check-fixnum
                  elem
                  1
                  (vector-inc! vect k v)
                  (##vector-inc! vect k val))))))))))

(define bytevector?        u8vector?)
(define make-bytevector    make-u8vector)
(define bytevector         u8vector)
(define bytevector-length  u8vector-length)
(define bytevector-u8-ref  u8vector-ref)
(define bytevector-u8-set! u8vector-set!)
(define bytevector-copy    u8vector-copy)
(define bytevector-copy!   u8vector-copy!)
(define bytevector-append  u8vector-append)

;;;============================================================================
