;;;============================================================================

;;; File: "_define-syntax.scm"

;;; Copyright (c) 2000-2022 by Marc Feeley, All Rights Reserved.

;;;============================================================================

;; This file implements macro-define-syntax which behaves like
;; ##define-syntax but allows the expander to use the (syntax-case ...),
;; (syntax-rules ...), and (syntax ...) forms.

;;;----------------------------------------------------------------------------

(##define-syntax macro-define-syntax
  syn#define-syntax-form-transformer)

;;;============================================================================
