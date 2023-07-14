;;;============================================================================

;;; File: "_num#.scm"

;;; Copyright (c) 1994-2021 by Marc Feeley, All Rights Reserved.

;;;============================================================================

;;; Representation of exceptions.

(define-library-type-of-exception range-exception
  id: 10aa6857-6f27-45ab-ac38-2318ef2f277c
  constructor: #f
  opaque:

  (procedure unprintable: read-only: no-functional-setter:)
  (arguments unprintable: read-only: no-functional-setter:)
  (arg-id    unprintable: read-only: no-functional-setter:)
)

(define-library-type-of-exception divide-by-zero-exception
  id: c4319ec5-29d5-43f3-bd16-fad15b238e82
  constructor: #f
  opaque:

  (procedure unprintable: read-only: no-functional-setter:)
  (arguments unprintable: read-only: no-functional-setter:)
)

(define-library-type-of-exception fixnum-overflow-exception
  id: dd080472-485f-4f09-8e9e-924194042ff3
  constructor: #f
  opaque:

  (procedure unprintable: read-only: no-functional-setter:)
  (arguments unprintable: read-only: no-functional-setter:)
)

;;;----------------------------------------------------------------------------

;;; Define type checking macros.

(##define-macro (macro-index? var)
  `(##not (##fxnegative? ,var)))

(##define-macro (macro-index-range? var lo hi)
  `(macro-fixnum-range? ,var ,lo ,hi))

(##define-macro (macro-index-range-incl? var lo hi)
  `(macro-fixnum-range-incl? ,var ,lo ,hi))

(##define-macro (macro-fixnum-range? var lo hi)
  `(and (##not (##fx< ,var ,lo))
        (##fx< ,var ,hi)))

(##define-macro (macro-fixnum-range-incl? var lo hi)
  `(##fx<= ,lo ,var ,hi))

(##define-macro (macro-fixnum-and-fixnum-range-incl? var lo hi)
  `(and (##fixnum? ,var)
        (macro-fixnum-range-incl? ,var ,lo ,hi)))

(##define-macro (macro-range-incl? var lo hi)
  `(and (macro-exact-int? ,var)
        (##not (##< ,var ,lo))
        (##not (##< ,hi ,var))))

(define-check-index-range-macro
  index
  macro-index?)

(define-check-index-range-macro
  index-range
  macro-index-range?
  lo
  hi)

(define-check-index-range-macro
  index-range-incl
  macro-index-range-incl?
  lo
  hi)

(define-check-index-range-macro
  fixnum-range
  macro-fixnum-range?
  lo
  hi)

(define-check-index-range-macro
  fixnum-range-incl
  macro-fixnum-range-incl?
  lo
  hi)

(define-check-type exact-unsigned-int8 'exact-unsigned-int8
  macro-fixnum-and-fixnum-range-incl?
  0
  255)

(define-check-type (list exact-unsigned-int8-list) #f
  (lambda (obj) #t)) ;; defer detailed checks to logic traversing the list

(define-check-type (exact-unsigned-int8-list exact-unsigned-int8-list-exact-unsigned-int8) 'exact-unsigned-int8-list
  macro-fixnum-and-fixnum-range-incl?
  0
  255)

(macro-if-s8vector
 (begin

   (define-check-type exact-signed-int8 'exact-signed-int8
     macro-fixnum-and-fixnum-range-incl?
     -128
     127)

   (define-check-type (list exact-signed-int8-list) #f
     (lambda (obj) #t)) ;; defer detailed checks to logic traversing the list

   (define-check-type (exact-signed-int8-list exact-signed-int8-list-exact-signed-int8) 'exact-signed-int8-list
     macro-fixnum-and-fixnum-range-incl?
     -128
     127)))

(macro-if-u16vector
 (begin

   (define-check-type exact-unsigned-int16 'exact-unsigned-int16
     macro-fixnum-and-fixnum-range-incl?
     0
     65535)

   (define-check-type (list exact-unsigned-int16-list) #f
     (lambda (obj) #t)) ;; defer detailed checks to logic traversing the list

   (define-check-type (exact-unsigned-int16-list exact-unsigned-int16-list-exact-unsigned-int16) 'exact-unsigned-int16-list
     macro-fixnum-and-fixnum-range-incl?
     0
     65535)))

(macro-if-s16vector
 (begin

   (define-check-type exact-signed-int16 'exact-signed-int16
     macro-fixnum-and-fixnum-range-incl?
     -32768
     32767)

   (define-check-type (list exact-signed-int16-list) #f
     (lambda (obj) #t)) ;; defer detailed checks to logic traversing the list

   (define-check-type (exact-signed-int16-list exact-signed-int16-list-exact-signed-int16) 'exact-signed-int16-list
     macro-fixnum-and-fixnum-range-incl?
     -32768
     32767)))

(macro-if-u32vector
 (begin

   (define-check-type exact-unsigned-int32 'exact-unsigned-int32
     macro-range-incl?
     0
     4294967295)

   (define-check-type (list exact-unsigned-int32-list) #f
     (lambda (obj) #t)) ;; defer detailed checks to logic traversing the list

   (define-check-type (exact-unsigned-int32-list exact-unsigned-int32-list-exact-unsigned-int32) 'exact-unsigned-int32-list
     macro-range-incl?
     0
     4294967295)))

(macro-if-s32vector
 (begin

   (define-check-type exact-signed-int32 'exact-signed-int32
     macro-range-incl?
     -2147483648
     2147483647)

   (define-check-type (list exact-signed-int32-list) #f
     (lambda (obj) #t)) ;; defer detailed checks to logic traversing the list

   (define-check-type (exact-signed-int32-list exact-signed-int32-list-exact-signed-int32) 'exact-signed-int32-list
     macro-range-incl?
     -2147483648
     2147483647)))

(macro-if-u64vector
 (begin

   (define-check-type exact-unsigned-int64 'exact-unsigned-int64
     macro-range-incl?
     0
     18446744073709551615)

   (define-check-type (list exact-unsigned-int64-list) #f
     (lambda (obj) #t)) ;; defer detailed checks to logic traversing the list

   (define-check-type (exact-unsigned-int64-list exact-unsigned-int64-list-exact-unsigned-int64) 'exact-unsigned-int64-list
     macro-range-incl?
     0
     18446744073709551615)))

(macro-if-s64vector
 (begin

   (define-check-type exact-signed-int64 'exact-signed-int64
     macro-range-incl?
     -9223372036854775808
     9223372036854775807)

   (define-check-type (list exact-signed-int64-list) #f
     (lambda (obj) #t)) ;; defer detailed checks to logic traversing the list

   (define-check-type (exact-signed-int64-list exact-signed-int64-list-exact-signed-int64) 'exact-signed-int64-list
     macro-range-incl?
     -9223372036854775808
     9223372036854775807)))

(define-check-type exact-integer 'exact-integer
  macro-exact-int?)

(define-check-type nonnegative-exact-integer 'nonnegative-exact-integer
  macro-nonnegative-exact-int?)

(define-check-type inexact-real 'inexact-real
  ##flonum?)

(define-check-type (list inexact-real-list) #f
  (lambda (obj) #t)) ;; defer detailed checks to logic traversing the list

(define-check-type (inexact-real-list inexact-real-list-inexact-real) 'inexact-real-list
  ##flonum?)

(define-check-type number 'number
  ##number?)

(define-check-type real 'real
  ##real?)

(define-check-type fixnum 'fixnum
  ##fixnum?)

(define-check-type flonum 'flonum
  ##flonum?)

;;;============================================================================

;;; Number representation.

;; There are 5 internal representations for numbers:
;;
;; fixnum, bignum, ratnum, flonum, cpxnum
;;
;; Fixnums and bignums form the class of exact-int.
;; Fixnums, bignums and ratnums form the class of exact-real.
;; Fixnums, bignums, ratnums and flonums form the class of noncpxnum.

;; The representation has some invariants:
;;
;; The numerator of a ratnum is a non-zero exact-int.
;; The denominator of a ratnum is an exact-int greater than 1.
;; The numerator and denominator have no common divisors greater than 1.
;;
;; The real part of a cpxnum is a noncpxnum.
;; The imaginary part of a cpxnum is a noncpxnum != fixnum 0

;; The following table gives the mapping of the Scheme exact numbers to their
;; internal representation:
;;
;;    type          representation
;; exact integer  = exact-int (fixnum, bignum)
;; exact rational = exact-real (fixnum, bignum, ratnum)
;; exact real     = exact-real (fixnum, bignum, ratnum)
;; exact complex  = exact-real or cpxnum with exact-real real and imag parts

;; For inexact numbers, the representation is not quite as straightforward.
;;
;; There are 3 special classes of inexact representation:
;; flonum-int : flonum with integer value
;; cpxnum-real: cpxnum with imag part = flonum 0.0 or -0.0
;; cpxnum-int : cpxnum-real with exact-int or flonum-int real part
;;
;; Note: cpxnum-real and cpxnum-int only exist if
;; (macro-cpxnum-are-possibly-real?) returns #t.
;;
;; This gives the following table for Scheme's inexact numbers:
;;
;;      type          representation
;; inexact integer  = flonum-int or cpxnum-int if it exists
;; inexact rational = flonum     or cpxnum-real if it exists
;; inexact real     = flonum     or cpxnum-real if it exists
;; inexact complex  = flonum     or cpxnum with flonum real or imag part

(##define-macro (macro-special-case-exact-zero?) #t); (+ -0. 0)=-0.  (* 4. 0)=0
(##define-macro (macro-cpxnum-are-possibly-real?) #f)

(##define-macro (macro-exact-int? obj) ;; obj can be any object
  `(macro-exact-int-dispatch ,obj #f #t #t))

(##define-macro (macro-nonnegative-exact-int? obj)
  `(let ((obj ,obj))
     (macro-exact-int-dispatch
       obj #f
       (##not (##fxnegative? obj))
       (##not (##negative? obj)))))

(##define-macro (macro-exact-real? obj) ;; obj can be any object
  `(macro-exact-real-dispatch ,obj #f #t #t #t))

(##define-macro (macro-flonum-int? obj) ;; obj must be a flonum
  `(##flinteger? ,obj))

(##define-macro (macro-flonum-rational? obj) ;; obj must be a flonum
  `(##flfinite? ,obj))

(##define-macro (macro-noncpxnum-int? obj) ;; obj must be in fixnum/bignum/ratnum/flonum
  `(if (##flonum? ,obj)
     (macro-flonum-int? ,obj)
     (##not (##ratnum? ,obj))))

(##define-macro (macro-noncpxnum-rational? obj) ;; obj must be in fixnum/bignum/ratnum/flonum
  `(or (##not (##flonum? ,obj))
       (macro-flonum-rational? ,obj)))

(##define-macro (macro-cpxnum-int? obj) ;; obj must be a cpxnum
  `(and (macro-cpxnum-are-possibly-real?)
        (macro-cpxnum-real? ,obj)
        (let ((real (macro-cpxnum-real ,obj)))
          (macro-noncpxnum-int? real))))

(##define-macro (macro-cpxnum-rational? obj) ;; obj must be a cpxnum
  `(and (macro-cpxnum-are-possibly-real?)
        (let ((imag (macro-cpxnum-imag ,obj)))
          (and (##flonum? imag)
               (##flzero? imag)
               (let ((real (macro-cpxnum-real ,obj)))
                 (macro-noncpxnum-rational? real))))))

(##define-macro (macro-cpxnum-real? obj) ;; obj must be a cpxnum
  `(and (macro-cpxnum-are-possibly-real?)
        (let ((imag (macro-cpxnum-imag ,obj)))
          (and (##flonum? imag)
               (##flzero? imag)))))

(macro-define-syntax macro-if-bignum
  (lambda (stx)
    (syntax-case stx ()
      ((_ yes)
       #'(macro-if-bignum yes (##begin)))
      ((_ yes no)
       #'(cond-expand
          ((or enable-bignum (not disable-bignum))
           yes)
          (else
           no))))))

(macro-define-syntax macro-if-ratnum
  (lambda (stx)
    (syntax-case stx ()
      ((_ yes)
       #'(macro-if-ratnum yes (##begin)))
      ((_ yes no)
       #'(cond-expand
          ((or enable-ratnum (not disable-ratnum))
           yes)
          (else
           no))))))

(macro-define-syntax macro-if-cpxnum
  (lambda (stx)
    (syntax-case stx ()
      ((_ yes)
       #'(macro-if-cpxnum yes (##begin)))
      ((_ yes no)
       #'(cond-expand
          ((or enable-cpxnum (not disable-cpxnum))
           yes)
          (else
           no))))))

;; Dispatch for number representation

(macro-define-syntax macro-number-dispatch
  (lambda (stx)
    (syntax-case stx ()
      ((_ num err fix big rat flo cpx)
       #'(macro-if-bignum
          (macro-if-ratnum
           (macro-if-cpxnum
            (cond ((##fixnum? num) fix)
                  ((##flonum? num) flo)
                  ((##bignum? num) big)
                  ((##ratnum? num) rat)
                  ((##cpxnum? num) cpx)
                  (else            err))
            (cond ((##fixnum? num) fix)
                  ((##flonum? num) flo)
                  ((##bignum? num) big)
                  ((##ratnum? num) rat)
                  ;;((##cpxnum? num) cpx)
                  (else            err)))
           (macro-if-cpxnum
            (cond ((##fixnum? num) fix)
                  ((##flonum? num) flo)
                  ((##bignum? num) big)
                  ;;((##ratnum? num) rat)
                  ((##cpxnum? num) cpx)
                  (else            err))
            (cond ((##fixnum? num) fix)
                  ((##flonum? num) flo)
                  ((##bignum? num) big)
                  ;;((##ratnum? num) rat)
                  ;;((##cpxnum? num) cpx)
                  (else            err))))
          (macro-if-ratnum
           (macro-if-cpxnum
            (cond ((##fixnum? num) fix)
                  ((##flonum? num) flo)
                  ;;((##bignum? num) big)
                  ((##ratnum? num) rat)
                  ((##cpxnum? num) cpx)
                  (else            err))
            (cond ((##fixnum? num) fix)
                  ((##flonum? num) flo)
                  ;;((##bignum? num) big)
                  ((##ratnum? num) rat)
                  ;;((##cpxnum? num) cpx)
                  (else            err)))
           (macro-if-cpxnum
            (cond ((##fixnum? num) fix)
                  ((##flonum? num) flo)
                  ;;((##bignum? num) big)
                  ;;((##ratnum? num) rat)
                  ((##cpxnum? num) cpx)
                  (else            err))
            (cond ((##fixnum? num) fix)
                  ((##flonum? num) flo)
                  ;;((##bignum? num) big)
                  ;;((##ratnum? num) rat)
                  ;;((##cpxnum? num) cpx)
                  (else            err)))))))))

(macro-define-syntax macro-exact-real-dispatch
  (lambda (stx)
    (syntax-case stx ()
      ((_ num err fix big rat)
       #'(macro-if-bignum
          (macro-if-ratnum
           (cond ((##fixnum? num) fix)
                 ((##bignum? num) big)
                 ((##ratnum? num) rat)
                 (else            err))
           (cond ((##fixnum? num) fix)
                 ((##bignum? num) big)
                 ;;((##ratnum? num) rat)
                 (else            err)))
          (macro-if-ratnum
           (cond ((##fixnum? num) fix)
                 ;;((##bignum? num) big)
                 ((##ratnum? num) rat)
                 (else            err))
           (cond ((##fixnum? num) fix)
                 ;;((##bignum? num) big)
                 ;;((##ratnum? num) rat)
                 (else            err))))))))

(macro-define-syntax macro-exact-int-dispatch
  (lambda (stx)
    (syntax-case stx ()
      ((_ num err fix big)
       #'(macro-if-bignum
          (cond ((##fixnum? num) fix)
                ((##bignum? num) big)
                (else            err))
          (cond ((##fixnum? num) fix)
                ;;((##bignum? num) big)
                (else            err)))))))

(macro-define-syntax macro-exact-int-dispatch-no-error
  (lambda (stx)
    (syntax-case stx ()
      ((_ num fix big)
       #'(macro-if-bignum
          (if (##fixnum? num)
              fix
              big)
          fix)))))

(macro-define-syntax macro-if-enable-assert-normalized-exact-int
  (lambda (stx)
    (syntax-case stx ()
      ((_ yes)
       #'(macro-if-enable-assert-normalized-exact-int yes (##begin)))
      ((_ yes no)
       #'no))))

(macro-define-syntax macro-assert-normalized-exact-int
  (lambda (stx)
    (syntax-case stx ()
      ((_ expr)
       #'(macro-if-enable-assert-normalized-exact-int
          (##let (($val expr))
            (##if (##not (##or (##fixnum? $val)
                               (##bignum.normalized? $val)))
                  (##error "normalized exact integer expected:" $val))
            $val)
          (##begin))))))

(macro-define-syntax define-prim-normalized-exact-int
  (lambda (stx)
    (syntax-case stx ()
      ((_ pattern . body)
       #'(define-prim pattern
           (macro-if-enable-assert-normalized-exact-int
            (##let (($result (##let () . body)))
              (macro-assert-normalized-exact-int $result)
              $result)
            (##let () . body)))))))

;;; - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

;;; Miscellaneous constants.

(##define-macro (macro-inexact-+4)     4.0)
(##define-macro (macro-inexact-+2)     2.0)
(##define-macro (macro-inexact--2)    -2.0)
(##define-macro (macro-inexact-+1)     1.0)
(##define-macro (macro-inexact--1)    -1.0)
(##define-macro (macro-inexact-+1/2)   0.5)
(##define-macro (macro-inexact-+0)     0.0)
(##define-macro (macro-inexact--0)    -0.0)
(##define-macro (macro-inexact-+pi)    3.141592653589793)
(##define-macro (macro-inexact--pi)   -3.141592653589793)
(##define-macro (macro-inexact-+pi/2)  1.5707963267948966)
(##define-macro (macro-inexact--pi/2) -1.5707963267948966)
(##define-macro (macro-inexact-+pi/4)   .7853981633974483)
(##define-macro (macro-inexact-+3pi/4) 2.356194490192345)
(##define-macro (macro-inexact-+inf)  (/ +1. 0.))
(##define-macro (macro-inexact--inf)  (/ -1. 0.))
(##define-macro (macro-inexact-+nan)  (##flcopysign (/ 0. 0.) +1.))
(##define-macro (macro-cpxnum-+2i)    +2i)
(##define-macro (macro-cpxnum--i)     -i)
(##define-macro (macro-cpxnum-+i)     +i)

(##define-macro (macro-cpxnum-+1/2+sqrt3/2i)
  (make-rectangular 1/2 (/ (sqrt 3) 2)))

(##define-macro (macro-cpxnum-+1/2-sqrt3/2i)
  (make-rectangular 1/2 (- (/ (sqrt 3) 2))))

(##define-macro (macro-cpxnum--1/2+sqrt3/2i)
  (make-rectangular -1/2 (/ (sqrt 3) 2)))

(##define-macro (macro-cpxnum--1/2-sqrt3/2i)
  (make-rectangular -1/2 (- (/ (sqrt 3) 2))))

(##define-macro (macro-cpxnum-+sqrt3/2+1/2i)
  (make-rectangular (/ (sqrt 3) 2) 1/2))

(##define-macro (macro-cpxnum-+sqrt3/2-1/2i)
  (make-rectangular (/ (sqrt 3) 2) -1/2))

(##define-macro (macro-cpxnum--sqrt3/2+1/2i)
  (make-rectangular (- (/ (sqrt 3) 2)) 1/2))

(##define-macro (macro-cpxnum--sqrt3/2-1/2i)
  (make-rectangular (- (/ (sqrt 3) 2)) -1/2))

(##define-macro (macro-inexact-exp-+1/2) (exp +1/2))
(##define-macro (macro-inexact-exp--1/2) (exp -1/2))
(##define-macro (macro-inexact-log-2)    (log 2))

;;; The next constants are for 64-bit, IEEE 754 binary arithmetic

(##define-macro (macro-inexact-epsilon) 1.1102230246251565e-16)     ; (- 1 epsilon) <> 1, epsilon smallest
(##define-macro (macro-inexact-lambda)  2.2250738585072014e-308)    ; smallest positive flonum
(##define-macro (macro-inexact-omega)   1.7976931348623157e308)     ; largest finite flonum

;;; - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

;;; Bignum related constants.

(##define-macro (macro-max-lines)                  65536)
(##define-macro (macro-max-fixnum32-div-max-lines)  8191)
(##define-macro (macro-max-fixnum32)           536870911)
(##define-macro (macro-max-fixnum32-div-10)     53687091)

;;; - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

;;; Flonum related constants.

(##define-macro (macro-flonum-m-bits)
  52)

(##define-macro (macro-flonum-m-bits-plus-1)
  53)

(##define-macro (macro-flonum-m-bits-plus-1*2)
  106)

(##define-macro (macro-flonum-e-bits)
  11)

(##define-macro (macro-flonum-sign-bit) ;; (expt 2 (+ (macro-flonum-e-bits) (macro-flonum-m-bits)))
  #x8000000000000000)

(##define-macro (macro-flonum-m-min) ;; (expt 2.0 (macro-flonum-m-bits))
  4503599627370496.0)

(##define-macro (macro-flonum-+m-min) ;; (expt 2 (macro-flonum-m-bits))
  4503599627370496)

(##define-macro (macro-flonum-+m-max-plus-1) ;; (expt 2 (macro-flonum-m-bits-plus-1))
  9007199254740992)

(##define-macro (macro-flonum-+m-max) ;; (- (macro-flonum-+m-max-plus-1) 1)
  9007199254740991)

(##define-macro (macro-flonum-+m-max-plus-1-inexact);; (exact->inexact (macro-flonum-+m-max-plus-1))
  9007199254740992.0)

(##define-macro (macro-flonum-inverse-+m-max-plus-1-inexact);; (/ (macro-flonum-+m-max-plus-1-inexact))
  (/ 9007199254740992.0))

(##define-macro (macro-flonum--m-min) ;; (- (macro-flonum-+m-min))
  -4503599627370496)

(##define-macro (macro-flonum--m-max) ;; (- (macro-flonum-+m-max))
  -9007199254740991)

(##define-macro (macro-flonum-e-bias) ;; (- (expt 2 (- (macro-flonum-e-bits) 1)) 1)
  1023)

(##define-macro (macro-flonum-e-bias-plus-1) ;; (+ (macro-flonum-e-bias) 1)
  1024)

(##define-macro (macro-flonum-e-bias-minus-1) ;; (- (macro-flonum-e-bias) 1)
  1022)

(##define-macro (macro-flonum-e-min) ;; (- (+ (macro-flonum-e-bias) (macro-flonum-m-bits) -1))
  -1074)

(##define-macro (macro-flonum-min-normal) ;; (expt 2.0 (+ (macro-flonum-m-bits) (macro-flonum-e-min)))
  (expt 2.0 (+ 52 -1074)))

(##define-macro (macro-scale-down) ;; (expt 2 (- (+ (quotient (macro-flonum-e-bias-plus-1) 2) 1)))
  (expt 2 -513))

(##define-macro (macro-inexact-scale-down) ;; (expt 2.0 (- (+ (quotient (macro-flonum-e-bias-plus-1) 2) 1)))
  (expt 2.0 -513))

(##define-macro (macro-scale-up) ;; (expt 2 (+ (quotient (macro-flonum-e-bias-plus-1) 2) (macro-flonum-m-bits-plus-1)))
  (expt 2 565))

(##define-macro (macro-inexact-scale-up) ;; (expt 2.0 (+ (quotient (macro-flonum-e-bias-plus-1) 2) (macro-flonum-m-bits-plus-1)))
  (expt 2.0 565))

(##define-macro (macro-inexact-radix) ;; (exact->inexact (macro-radix))
  16384.0)

;;; - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

;;; Ratnum objects.

;; A ratnum is represented by an object vector of length 2
;; slot 0 = numerator
;; slot 1 = denominator

(##define-macro (macro-ratnum-make num den) `(##ratnum-make ,num ,den))
(##define-macro (macro-ratnum-numerator r) `(##ratnum-numerator ,r))
(##define-macro (macro-ratnum-denominator r) `(##ratnum-denominator ,r))

(define-macro (macro-exact-int->ratnum x)
  `(macro-ratnum-make ,x 1))

;;; - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

;;; Cpxnum objects.

;; A cpxnum is represented by an object vector of length 2
;; slot 0 = real
;; slot 1 = imag

(##define-macro (macro-cpxnum-make r i) `(##cpxnum-make ,r ,i))
(##define-macro (macro-cpxnum-real c) `(##cpxnum-real ,c))
(##define-macro (macro-cpxnum-imag c) `(##cpxnum-imag ,c))

(define-macro (macro-noncpxnum->cpxnum x)
  `(macro-cpxnum-make ,x 0))

;;; - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

(##define-macro (macro-bignum-odd? x);;;;;;;;;;;;;;;;;;;;
  `(##fxodd? (##bignum.mdigit-ref ,x 0)))

(##define-macro (macro-real->inexact x)
  `(let ((x ,x))
     (if (##flonum? x)
       x
       (##exact->inexact
        (if (macro-cpxnum-are-possibly-real?)
          (##real-part x)
          x)))))

;;; - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

;; Fast path for conversion of small integers and floating point numbers
;; possibly prefixed with a sign.

(##define-macro (macro-string->number-decimal-fast-path str)
  `(let ((str ,str))
     (declare (standard-bindings) (extended-bindings) (not safe) (not interrupts-enabled))
     (let ((len (string-length str)))
       (and (fx< 0 len) ;; at least one character
            (let ((start
                   (let ((first (string-ref str 0)))
                     (if (or (char=? first #\+)
                             (char=? first #\-))
                         1
                         0))))
              (and (fx< (fx- len start) 9) ;; won't overflow 32 bit fixnums?
                   (fx< start len) ;; at least one remaining character
                   (let loop1 ((i start)
                               (n 0))
                     (if (fx< i (string-length str))
                         (let ((d (fx- (char->integer (string-ref str i)) 48)))
                           (if (and (fx>= d 0) (fx<= d 9))
                               (loop1 (fx+ i 1)
                                      (fx+ (fx* n 10) d))
                               (if (fx= d -2) ;; character is "."?
                                   (let loop2 ((i (fx+ i 1)) (n n) (p10 1))
                                     (if (fx< i (string-length str))
                                         (let ((d (fx- (char->integer (string-ref str i)) 48)))
                                           (if (and (fx>= d 0) (fx<= d 9))
                                               (loop2 (fx+ i 1)
                                                      (fx+ (fx* n 10) d)
                                                      (fx* p10 10))
                                               #f))
                                         (let ((first (string-ref str 0)))
                                           (and (or (fx< 1 p10) ;; end != "."
                                                    (not (fx= i
                                                              (if (or (char=? first #\+)
                                                                      (char=? first #\-))
                                                                  2
                                                                  1))))
                                                (##flcopysign
                                                 (fl/ (fixnum->flonum n)
                                                      (fixnum->flonum p10))
                                                 (if (char=? first #\-)
                                                     (macro-inexact--1)
                                                     (macro-inexact-+1)))))))
                                   #f)))
                         (if (char=? (string-ref str 0) #\-)
                             (fx- n)
                             n)))))))))

;;;============================================================================
