;; flydown_test.scm - Unit test for StandardProcedureNameFlydown
(import (scheme base) (scheme-js interop))

(define (run-flydown-tests)
  (console.log "Running StandardProcedureNameFlydown tests...")
  
  (let* ((proc-name "test-procedure")
         (flydown (make-standard-procedure-name-flydown proc-name))
         (xml-str (flydown.flydownBlocksXML_)))
    
    ;; Test 1: Property initialization
    (if (equal? flydown.getterBlockName "test-procedure_standard_procedure_get")
        (console.log "✅ Getter block name is correct")
        (console.error "❌ Getter block name incorrect: " flydown.getterBlockName))
        
    ;; Test 2: XML generation
    (if (and (string? xml-str)
             (string-contains xml-str "test-procedure_standard_procedure_get")
             (string-contains xml-str "test-procedure_standard_procedure_set"))
        (console.log "✅ XML generation is correct")
        (console.error "❌ XML generation incorrect: " xml-str))
    
    (console.log "Flydown tests complete.")))

;; Helper: simple string-contains for older Scheme implementations if needed
(define (string-contains haystack needle)
  (not (equal? -1 (haystack.indexOf needle))))

(run-flydown-tests)
