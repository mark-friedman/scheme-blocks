;; procedures.scm - Procedure blocks for Blockly
;;
;; Implements procedure definitions, callers, and related blocks in Scheme.
;; Replaces the original procedures.js.

(import (scheme base) (scheme-js interop))

;; ---------------------------------------------------------------------------
;; Utilities
;; ---------------------------------------------------------------------------

;; Check if a value is a function
;; @param {*} val - Value to check
;; @returns {boolean} True if val is a function
(define (function? val)
  (equal? (js-typeof val) "function"))

;; Get the prototype of the definition block to copy methods
(define defnoreturn-proto Blockly.Blocks.procedures_defnoreturn)

;; ---------------------------------------------------------------------------
;; Standard Procedure Factories
;; ---------------------------------------------------------------------------

;; Create a getter block for a standard built-in procedure
;; @param {string} proc-name - Name of the procedure
;; @param {string|undefined} opt-help-url - Optional help URL
;; @returns {string} The block type name
(define (make-standard-procedure-getter proc-name opt-help-url)
  (let ((block-type (string-append proc-name "_standard_procedure_get")))
    ;; Define Block
    (js-set! Blockly.Blocks block-type
      #{(init
          (lambda ()
            (((this.appendDummyInput).appendField "get").appendField proc-name)
            (this.setOutput #t "procedure")
            (this.setColour 230)
            (this.setTooltip (string-append "Get " proc-name " procedure."))
            (when opt-help-url (this.setHelpUrl opt-help-url))
            (this.setStyle "procedure_blocks")))})
            
    ;; Define Generator
    (js-set! schemeCodeGenerator.forBlock block-type
      (lambda (block)
        (let ((code-str proc-name))
          (if block.outputConnection
              (vector code-str 1)  ;; Return as vector (JS array)
              code-str))))
    block-type))

;; Create a setter block for a standard built-in procedure
;; @param {string} proc-name - Name of the procedure
;; @param {string|undefined} opt-help-url - Optional help URL
;; @returns {string} The block type name
(define (make-standard-procedure-setter proc-name opt-help-url)
  (let ((block-type (string-append proc-name "_standard_procedure_set")))
    ;; Define Block
    (js-set! Blockly.Blocks block-type
      #{(init
          (lambda ()
            ((((this.appendValueInput "PROCEDURE").setCheck "procedure").appendField "set").appendField proc-name).appendField "to"
            (this.setNextStatement #t)
            (this.setPreviousStatement #t)
            (this.setColour 230)
            (this.setTooltip (string-append "Set " proc-name " procedure."))
            (when opt-help-url (this.setHelpUrl opt-help-url))
            (this.setStyle "procedure_blocks")))})
            
    ;; Define Generator
    (js-set! schemeCodeGenerator.forBlock block-type
      (lambda (block)
        (let* ((val-str (schemeCodeGenerator.valueToCode block "PROCEDURE" 10))
               (code-str (string-append "(set! " proc-name " " val-str ")")))
          (if block.outputConnection
              (vector code-str 1)
              code-str))))
    block-type))

;; StandardProcedureNameFlydown Class
;; ---------------------------------------------------------------------------

;; Extend FieldParameterFlydown to create a custom field for standard procedures
;; Uses define-class with custom constructor and super call
(define-class StandardProcedureNameFlydown 
  window.LexicalVariablesPlugin.FieldParameterFlydown
  make-standard-procedure-name-flydown
  standard-procedure-name-flydown?
  (fields 
    (getterBlockName getter-block-name)
    (setterBlockName setter-block-name))
  (constructor (procedure-name)
    ;; Call parent constructor with procedure-name and false
    (super procedure-name #f)
    ;; Call factories to register blocks and store the block type names
    (set! this.getterBlockName (make-standard-procedure-getter procedure-name js-undefined))
    (set! this.setterBlockName (make-standard-procedure-setter procedure-name js-undefined)))
  (methods
    ;; Generate the flydown XML containing getter and setter blocks
    ;; @returns {string} XML string for the flydown blocks
    (flydownBlocksXML_ ()
      (string-append 
        "<xml><block type=\"" 
        this.getterBlockName 
        "\"></block><block type=\"" 
        this.setterBlockName 
        "\"></block></xml>"))))

;; ---------------------------------------------------------------------------
;; Block: procedures_lambda
;; ---------------------------------------------------------------------------

;; Define an unnamed procedure with a return value
(define procedures-lambda
  #{(category "Procedures")
    (bodyInputName "STACK")
    
    (init 
      (lambda ()
        (this.createHeader)
        ((this.appendStatementInput "STACK").setCheck js-null)
        (set! this.horizontalParameters #t)
        (this.setOutput #t "procedure")
        (this.setColour 230)
        (this.setTooltip "Makes a procedure!")
        (this.setHelpUrl "http://www.r6rs.org/final/html/r6rs/r6rs-Z-H-14.html#node_idx_364")
        (this.setStyle "procedure_blocks")
        
        ;; Initialize mutator using js-new - requires (quarks, block) arguments
        (this.setMutator 
          (js-new Blockly.icons.MutatorIcon #("procedures_mutatorarg") this))
           
        (set! this.arguments_ #())
        (set! this.warnings (vector #{ (name "checkEmptySockets") (sockets #("STACK")) }))))

    (createHeader
      (lambda (ignored)
        ((this.appendDummyInput "HEADER").appendField "λ")))

    (getProcedureDef
      (lambda ()
        ;; Return: name (empty), arguments, hasReturn (check based on bodyInputName)
        (vector "" 
                this.arguments_ 
                (equal? this.bodyInputName "RETURN"))))})

;; Copy methods from procedures_defnoreturn
(let ((methods-to-copy 
       '(withLexicalVarsAndPrefix onchange updateParams_ parameterFlydown 
         setParameterOrientation mutationToDom domToMutation decompose compose 
         dispose getDeclaredVars declaredNames declaredVariables 
         renameVar renameVars renameBound renameFree freeVariables 
         blocksInScope customContextMenu getParameters)))
  
  (for-each 
    (lambda (method-name)
      (let* ((method-key (symbol->string method-name))
             (method (js-ref defnoreturn-proto method-key)))
        (if (not (js-undefined? method))
            (js-set! procedures-lambda method-key method)
            (console.warn (string-append "Warning: method " method-key " not found in procedures_defnoreturn")))))
    methods-to-copy))

;; Register the block
(set! Blockly.Blocks.procedures_lambda procedures-lambda)

;; ---------------------------------------------------------------------------
;; Generator for procedures_lambda
;; ---------------------------------------------------------------------------

;; Generate Scheme lambda expression from procedures_lambda block
;; @param {Block} block - The Blockly block
;; @returns {Array|string} Generated code and precedence, or just code
(set! schemeCodeGenerator.forBlock.procedures_lambda
  (lambda (block)
    ;; Get arguments from the block
    (let* ((args-array (if (js-undefined? block.arguments_) #() block.arguments_))
           (args-str (args-array.join " "))
           ;; Get the body code from the STACK input
           (body-code (schemeCodeGenerator.statementToCode block "STACK")))
      ;; Construct: (lambda (arg1 arg2 ...) body)
      (let ((code (string-append "(lambda (" args-str ")\n" 
                                (if (equal? body-code "") "  #f" body-code) ")")))
        (if block.outputConnection
            (vector code 1)
            code)))))

;; ---------------------------------------------------------------------------
;; Block: procedures_generic_call
;; ---------------------------------------------------------------------------

;; Create a specific procedure call block (for built-in procedures with known args)
;; @param {string} block-name - Name of the procedure
;; @param {list} arg-names - Argument names for the procedure
;; @returns {Object} Block definition object
(define (specific-procedure-call-block block-name arg-names)
  #{(init
      (lambda ()
        ;; Build the input with chained appendField calls
        (let* ((input (this.appendDummyInput))
               (field1 (input.appendField "call"))
               (field2 (field1.appendField (make-standard-procedure-name-flydown block-name))))
          (field2.appendField "with"))
        (when arg-names
          (for-each 
            (lambda (arg-name)
              (let* ((input (this.appendValueInput arg-name))
                     (checked (input.setCheck js-null))
                     (aligned (checked.setAlign Blockly.inputs.Align.RIGHT)))
                (aligned.appendField arg-name)))
            arg-names))
        
        ;; Use our Scheme chameleon mixin!
        (blockly-mixin window.chameleonMixin this)
        
        (this.setColour 230)
        (this.setTooltip "Calls a procedure!")
        (this.setStyle "procedure_blocks")))

    (getGlobalNames
      (lambda ()
        (vector block-name)))})

;; Create the generic procedure call block (with mutator for dynamic args)
;; @returns {Object} Block definition object
(define (generic-procedure-call-block)
  #{(init
      (lambda ()
        (((this.appendValueInput "PROC").setCheck "procedure").appendField "call")
        
        ;; Use our Scheme chameleon mixin!
        (blockly-mixin window.chameleonMixin this)
        
        (set! this.horizontalParameters #t)
        (set! this.itemCount 0)
        (this.setColour 230)
        (this.setTooltip "Calls a procedure!")
        (this.setStyle "procedure_blocks")
        
        (this.setMutator (js-new Blockly.icons.MutatorIcon #("procedures_call_item") this))))

    (getGlobalNames
      (lambda () #()))
            
    (saveExtraState
       (lambda ()
         #{ (itemCount this.itemCount) }))
         
    (loadExtraState
       (lambda (state)
         (set! this.itemCount state.itemCount)
         (this.updateShape)))
         
    (decompose
       (lambda (workspace)
         (let ((top-block (workspace.newBlock "procedures_call_container")))
            (top-block.initSvg)
            ;; Populate sub-blocks
            (let loop ((i 0)
                       (connection (top-block.getInput "STACK").connection))
               (if (< i this.itemCount)
                   (let ((item-block (workspace.newBlock "procedures_call_item")))
                      (item-block.initSvg)
                      (connection.connect item-block.previousConnection)
                      (loop (+ i 1) item-block.nextConnection))
                   top-block)))))
                   
    (compose
       (lambda (top-block)
         (let ((item-block (top-block.getInputTargetBlock "STACK")))
            ;; Build list of connections
            (let loop ((curr item-block)
                       (connections '()))
              (if curr
                  (loop (if curr.nextConnection 
                            (curr.nextConnection.targetBlock) 
                            #f)
                        (append connections (list curr.valueConnection_)))
                  ;; Done collecting - convert to vector and update
                  (let ((conn-vec (list->vector connections)))
                    (set! this.itemCount (vector-length conn-vec))
                    (this.updateShape)
                    ;; Reconnect
                    (let reconnect-loop ((i 0))
                      (when (< i this.itemCount)
                         (when (vector-ref conn-vec i)
                           ((this.getInput (string-append "ARG" (number->string i))).connection.connect 
                            (vector-ref conn-vec i)))
                         (reconnect-loop (+ i 1))))))))))
                 
    (updateShape
       (lambda ()
         (when (and this.itemCount (this.getInput "PROC"))
           ;; Add inputs as needed
           (let loop ((i 0))
              (when (< i this.itemCount)
                (unless (this.getInput (string-append "ARG" (number->string i)))
                  (((this.appendValueInput (string-append "ARG" (number->string i))).appendField "arg")))
                (loop (+ i 1))))
           ;; Remove extra inputs
           (let remove-loop ((i this.itemCount))
              (when (this.getInput (string-append "ARG" (number->string i)))
                (this.removeInput (string-append "ARG" (number->string i)))
                (remove-loop (+ i 1)))))))
                              
    (mutationToDom
       (lambda ()
         (let ((container (Blockly.utils.xml.createElement "mutation")))
            (container.setAttribute "itemCount" this.itemCount)
            container)))
            
    (domToMutation
       (lambda (xml-element)
         (set! this.itemCount (string->number (xml-element.getAttribute "itemCount")))
         (this.updateShape)))})

(set! Blockly.Blocks.procedures_generic_call (generic-procedure-call-block))

;; ---------------------------------------------------------------------------
;; Mutator blocks for generic call
;; ---------------------------------------------------------------------------

(set! Blockly.Blocks.procedures_call_container
  #{(init
      (lambda ()
        (this.setStyle "procedure_blocks")
        ((this.appendDummyInput).appendField "arguments")
        (this.appendStatementInput "STACK")
        (this.setTooltip "Add, delete or reorder the arguments to the procedure call")
        (set! this.contextMenu #f)))})

(set! Blockly.Blocks.procedures_call_item
  #{(init
      (lambda ()
        (this.setStyle "procedure_blocks")
        ((this.appendDummyInput).appendField "arg")
        (this.setPreviousStatement #t)
        (this.setNextStatement #t)
        (this.setTooltip "Argument to add to the procedure call")
        (set! this.contextMenu #f)))})

;; ---------------------------------------------------------------------------
;; Generator for procedures_generic_call
;; ---------------------------------------------------------------------------

(set! schemeCodeGenerator.forBlock.procedures_generic_call
  (lambda (block)
     (let ((proc-code (schemeCodeGenerator.valueToCode block "PROC" 10)))
        (when (equal? proc-code "")
          (set! proc-code "unnamed-procedure"))
        ;; Build argument list
        (let loop ((i 0)
                   (args '()))
          (if (< i block.itemCount)
              (loop (+ i 1)
                    (append args (list (schemeCodeGenerator.valueToCode block (string-append "ARG" (number->string i)) 10))))
              ;; Done - construct code
              (let ((args-vec (list->vector args)))
                (let ((code (string-append "(" proc-code 
                                          (if (> (vector-length args-vec) 0) " " "") 
                                          (args-vec.join " ") ")")))
                   (if block.outputConnection
                       (vector code 1)
                       code))))))))

;; ---------------------------------------------------------------------------
;; Standard Procedures (Built-ins)
;; ---------------------------------------------------------------------------

;; Define standard built-in procedures organized by category
;; Each entry: #{ (name "proc") (category "Cat/Subcat") (argNames #("a" "b")) }
;; Category format: "TopLevel" or "TopLevel/Subcategory"

(define standard-builtins
  (list 
    ;; --- Math / Arithmetic ---
    #{ (name "+") (category "Math/Arithmetic") (argNames #("a" "b")) }
    #{ (name "-") (category "Math/Arithmetic") (argNames #("a" "b")) }
    #{ (name "*") (category "Math/Arithmetic") (argNames #("a" "b")) }
    #{ (name "/") (category "Math/Arithmetic") (argNames #("a" "b")) }
    #{ (name "abs") (category "Math/Arithmetic") (argNames #("n")) }
    #{ (name "quotient") (category "Math/Arithmetic") (argNames #("n" "d")) }
    #{ (name "remainder") (category "Math/Arithmetic") (argNames #("n" "d")) }
    #{ (name "modulo") (category "Math/Arithmetic") (argNames #("n" "d")) }
    
    ;; --- Math / Comparison ---
    #{ (name "=") (category "Math/Comparison") (argNames #("a" "b")) }
    #{ (name "<") (category "Math/Comparison") (argNames #("a" "b")) }
    #{ (name ">") (category "Math/Comparison") (argNames #("a" "b")) }
    #{ (name "<=") (category "Math/Comparison") (argNames #("a" "b")) }
    #{ (name ">=") (category "Math/Comparison") (argNames #("a" "b")) }
    #{ (name "max") (category "Math/Comparison") (argNames #("a" "b")) }
    #{ (name "min") (category "Math/Comparison") (argNames #("a" "b")) }
    
    ;; --- Math / Predicates ---
    #{ (name "zero?") (category "Math/Predicates") (argNames #("n")) }
    #{ (name "positive?") (category "Math/Predicates") (argNames #("n")) }
    #{ (name "negative?") (category "Math/Predicates") (argNames #("n")) }
    #{ (name "odd?") (category "Math/Predicates") (argNames #("n")) }
    #{ (name "even?") (category "Math/Predicates") (argNames #("n")) }
    #{ (name "number?") (category "Math/Predicates") (argNames #("obj")) }
    #{ (name "integer?") (category "Math/Predicates") (argNames #("obj")) }
    
    ;; --- Math / Advanced ---
    #{ (name "expt") (category "Math/Advanced") (argNames #("base" "exp")) }
    #{ (name "sqrt") (category "Math/Advanced") (argNames #("n")) }
    #{ (name "floor") (category "Math/Advanced") (argNames #("n")) }
    #{ (name "ceiling") (category "Math/Advanced") (argNames #("n")) }
    #{ (name "truncate") (category "Math/Advanced") (argNames #("n")) }
    #{ (name "round") (category "Math/Advanced") (argNames #("n")) }
    #{ (name "gcd") (category "Math/Advanced") (argNames #("a" "b")) }
    #{ (name "lcm") (category "Math/Advanced") (argNames #("a" "b")) }
    
    ;; --- Lists / Basic ---
    #{ (name "cons") (category "Lists/Basic") (argNames #("a" "b")) }
    #{ (name "car") (category "Lists/Basic") (argNames #("pair")) }
    #{ (name "cdr") (category "Lists/Basic") (argNames #("pair")) }
    #{ (name "list") (category "Lists/Basic") (argNames #("items...")) }
    #{ (name "length") (category "Lists/Basic") (argNames #("list")) }
    #{ (name "append") (category "Lists/Basic") (argNames #("list1" "list2")) }
    #{ (name "reverse") (category "Lists/Basic") (argNames #("list")) }
    
    ;; --- Lists / Access ---
    #{ (name "list-ref") (category "Lists/Access") (argNames #("list" "k")) }
    #{ (name "list-tail") (category "Lists/Access") (argNames #("list" "k")) }
    #{ (name "list-set!") (category "Lists/Access") (argNames #("list" "k" "val")) }
    #{ (name "caar") (category "Lists/Access") (argNames #("pair")) }
    #{ (name "cadr") (category "Lists/Access") (argNames #("pair")) }
    #{ (name "cdar") (category "Lists/Access") (argNames #("pair")) }
    #{ (name "cddr") (category "Lists/Access") (argNames #("pair")) }
    
    ;; --- Lists / Search ---
    #{ (name "memq") (category "Lists/Search") (argNames #("obj" "list")) }
    #{ (name "memv") (category "Lists/Search") (argNames #("obj" "list")) }
    #{ (name "member") (category "Lists/Search") (argNames #("obj" "list")) }
    #{ (name "assq") (category "Lists/Search") (argNames #("key" "alist")) }
    #{ (name "assv") (category "Lists/Search") (argNames #("key" "alist")) }
    #{ (name "assoc") (category "Lists/Search") (argNames #("key" "alist")) }
    
    ;; --- Lists / Predicates ---
    #{ (name "null?") (category "Lists/Predicates") (argNames #("obj")) }
    #{ (name "pair?") (category "Lists/Predicates") (argNames #("obj")) }
    #{ (name "list?") (category "Lists/Predicates") (argNames #("obj")) }
    
    ;; --- Lists / Higher-Order ---
    #{ (name "map") (category "Lists/Higher-Order") (argNames #("proc" "list")) }
    #{ (name "for-each") (category "Lists/Higher-Order") (argNames #("proc" "list")) }
    #{ (name "filter") (category "Lists/Higher-Order") (argNames #("pred" "list")) }
    #{ (name "apply") (category "Lists/Higher-Order") (argNames #("proc" "args")) }
    
    ;; --- Strings / Basic ---
    #{ (name "string-length") (category "Strings/Basic") (argNames #("string")) }
    #{ (name "string-ref") (category "Strings/Basic") (argNames #("string" "k")) }
    #{ (name "substring") (category "Strings/Basic") (argNames #("string" "start" "end")) }
    #{ (name "string-append") (category "Strings/Basic") (argNames #("s1" "s2")) }
    #{ (name "string-copy") (category "Strings/Basic") (argNames #("string")) }
    
    ;; --- Strings / Comparison ---
    #{ (name "string=?") (category "Strings/Comparison") (argNames #("s1" "s2")) }
    #{ (name "string<?") (category "Strings/Comparison") (argNames #("s1" "s2")) }
    #{ (name "string>?") (category "Strings/Comparison") (argNames #("s1" "s2")) }
    #{ (name "string<=?") (category "Strings/Comparison") (argNames #("s1" "s2")) }
    #{ (name "string>=?") (category "Strings/Comparison") (argNames #("s1" "s2")) }
    
    ;; --- Strings / Conversion ---
    #{ (name "string->list") (category "Strings/Conversion") (argNames #("string")) }
    #{ (name "list->string") (category "Strings/Conversion") (argNames #("list")) }
    #{ (name "number->string") (category "Strings/Conversion") (argNames #("n")) }
    #{ (name "string->number") (category "Strings/Conversion") (argNames #("string")) }
    #{ (name "symbol->string") (category "Strings/Conversion") (argNames #("symbol")) }
    #{ (name "string->symbol") (category "Strings/Conversion") (argNames #("string")) }
    
    ;; --- Strings / Predicates ---
    #{ (name "string?") (category "Strings/Predicates") (argNames #("obj")) }
    
    ;; --- Vectors ---
    #{ (name "make-vector") (category "Vectors") (argNames #("k" "fill")) }
    #{ (name "vector") (category "Vectors") (argNames #("items...")) }
    #{ (name "vector-length") (category "Vectors") (argNames #("vec")) }
    #{ (name "vector-ref") (category "Vectors") (argNames #("vec" "k")) }
    #{ (name "vector-set!") (category "Vectors") (argNames #("vec" "k" "val")) }
    #{ (name "vector->list") (category "Vectors") (argNames #("vec")) }
    #{ (name "list->vector") (category "Vectors") (argNames #("list")) }
    #{ (name "vector?") (category "Vectors") (argNames #("obj")) }
    
    ;; --- Characters ---
    #{ (name "char->integer") (category "Characters") (argNames #("char")) }
    #{ (name "integer->char") (category "Characters") (argNames #("n")) }
    #{ (name "char=?") (category "Characters") (argNames #("c1" "c2")) }
    #{ (name "char<?") (category "Characters") (argNames #("c1" "c2")) }
    #{ (name "char>?") (category "Characters") (argNames #("c1" "c2")) }
    #{ (name "char?") (category "Characters") (argNames #("obj")) }
    
    ;; --- I/O ---
    #{ (name "display") (category "I/O") (argNames #("obj")) }
    #{ (name "newline") (category "I/O") (argNames #()) }
    #{ (name "write") (category "I/O") (argNames #("obj")) }
    #{ (name "read") (category "I/O") (argNames #()) }
    
    ;; --- Predicates / Type ---
    #{ (name "boolean?") (category "Predicates") (argNames #("obj")) }
    #{ (name "symbol?") (category "Predicates") (argNames #("obj")) }
    #{ (name "procedure?") (category "Predicates") (argNames #("obj")) }
    
    ;; --- Predicates / Equality ---
    #{ (name "eq?") (category "Predicates") (argNames #("a" "b")) }
    #{ (name "eqv?") (category "Predicates") (argNames #("a" "b")) }
    #{ (name "equal?") (category "Predicates") (argNames #("a" "b")) }
    
    ;; --- Logic ---
    #{ (name "not") (category "Logic") (argNames #("obj")) }
  ))

;; Register blocks and generators for standard built-ins
(for-each 
  (lambda (proc-info)
    (let ((block-type (string-append "procedures_" proc-info.name)))
      ;; Define Block using the specific procedure call block
      (js-set! Blockly.Blocks block-type
         (specific-procedure-call-block proc-info.name (vector->list proc-info.argNames)))
         
      ;; Define Generator
      (js-set! schemeCodeGenerator.forBlock block-type
         (lambda (block)
            ;; Build argument list
            (let loop ((i 0)
                       (args '()))
               (if (< i (vector-length proc-info.argNames))
                   (loop (+ i 1)
                         (append args (list (schemeCodeGenerator.valueToCode block (vector-ref proc-info.argNames i) 10))))
                   ;; Done - construct code
                   (let ((args-vec (list->vector args)))
                     (let ((code (string-append "(" proc-info.name " " (args-vec.join " ") ")")))
                        (if block.outputConnection
                            (vector code 1)
                            code)))))))))
  standard-builtins)

;; ---------------------------------------------------------------------------
;; Toolbox Definition - Nested Categories
;; ---------------------------------------------------------------------------

;; Helper: Parse "Category/Subcategory" into components
;; Special handling for "I/O" which should not be split
(define (parse-category-path path)
  (cond
    ((equal? path "I/O") (vector "I/O" #f))
    ((path.includes "/")
     (let ((idx (path.indexOf "/")))
       (vector (path.substring 0 idx)
               (path.substring (+ idx 1)))))
    (else (vector path #f))))

;; Build nested category structure from standard-builtins
(define (build-nested-toolbox)
  ;; Create category hierarchy as JS object for easy lookup
  (define categories (js-eval "({})"))
  
  ;; Process each builtin and build category structure
  (for-each
    (lambda (proc-info)
      (let* ((path-parts (parse-category-path proc-info.category))
             (top-cat (vector-ref path-parts 0))
             (sub-cat (vector-ref path-parts 1))
             (block-entry (js-eval "({})")))
        
        ;; Build block entry
        (js-set! block-entry "kind" "block")
        (js-set! block-entry "type" (string-append "procedures_" proc-info.name))
        
        ;; Ensure top-level category exists
        (when (js-undefined? (js-ref categories top-cat))
          (let ((cat-obj (js-eval "({})")))
            (js-set! cat-obj "name" top-cat)
            (js-set! cat-obj "subcategories" (js-eval "({})"))
            (js-set! cat-obj "blocks" (js-eval "([])"))
            (js-set! categories top-cat cat-obj)))
        
        (let ((top-obj (js-ref categories top-cat)))
          (if sub-cat
              ;; Has subcategory - add to subcategory
              (begin
                (when (js-undefined? (js-ref top-obj.subcategories sub-cat))
                  (js-set! top-obj.subcategories sub-cat (js-eval "([])")))
                ((js-ref top-obj.subcategories sub-cat).push block-entry))
              ;; No subcategory - add directly to top category
              (top-obj.blocks.push block-entry)))))
    standard-builtins)
  
  ;; Convert to Blockly toolbox format
  (define (category-to-toolbox-entry name cat-obj colour)
    (let* ((subcats (Object.keys cat-obj.subcategories))
           (has-subcats (> (vector-length subcats) 0))
           (result (js-eval "({})")))
      
      (js-set! result "kind" "category")
      (js-set! result "name" name)
      (js-set! result "colour" colour)
      
      (if has-subcats
          ;; Has subcategories - create nested structure
          (let ((items (js-eval "([])")))
            ;; Add direct blocks first
            (for-each (lambda (b) (items.push b)) (vector->list cat-obj.blocks))
            ;; Add subcategory entries
            (for-each
              (lambda (sub-name)
                (let ((sub-entry (js-eval "({})")))
                  (js-set! sub-entry "kind" "category")
                  (js-set! sub-entry "name" sub-name)
                  (js-set! sub-entry "colour" colour)
                  (js-set! sub-entry "contents" (js-ref cat-obj.subcategories sub-name))
                  (items.push sub-entry)))
              (vector->list subcats))
            (js-set! result "contents" items))
          ;; No subcategories - flat category
          (js-set! result "contents" cat-obj.blocks))
      result))
  
  ;; Build final toolbox with category colors
  (define category-colours
    #{ (Math 230) (Lists 260) (Strings 160) (Vectors 290) 
       (Characters 20) (I/O 330) (Predicates 65) (Logic 210) })
  
  (let ((contents (js-eval "([])")))
    (for-each
      (lambda (cat-name)
        (let ((cat-obj (js-ref categories cat-name))
              (colour (or (js-ref category-colours cat-name) 230)))
          (contents.push (category-to-toolbox-entry cat-name cat-obj colour))))
      (vector->list (Object.keys categories)))
    
    ;; Add Variables and Functions categories
    (contents.push
      #{ (kind "category") 
         (name "Variables") 
         (colour 330)
         (contents (vector
           #{ (kind "block") (type "global_declaration") }
           #{ (kind "block") (type "local_declaration_statement") }
           #{ (kind "block") (type "local_declaration_expression") }
           #{ (kind "block") (type "lexical_variable_get") }
           #{ (kind "block") (type "lexical_variable_set") })) })
    
    (contents.push
      #{ (kind "category") 
         (name "Functions") 
         (colour 290)
         (custom "PROCEDURE") })
    
    #{ (kind "categoryToolbox") (contents contents) }))

(define standard-procedure-toolbox-json (build-nested-toolbox))



(set! window.standardProcedureToolboxJson standard-procedure-toolbox-json)

;; ---------------------------------------------------------------------------
;; Workspace Update
;; ---------------------------------------------------------------------------

;; If a workspace already exists, update its toolbox
(let ((ws (Blockly.getMainWorkspace)))
  (when (and ws (not (js-undefined? ws)) (not (js-null? ws)))
    (ws.updateToolbox standard-procedure-toolbox-json)))

;; ---------------------------------------------------------------------------
;; Toolbox Category Callback (Add Lambda to Flyout)
;; ---------------------------------------------------------------------------

;; Setup custom procedure category callback
;; @private
(define (setup-proc-callback)
  (let ((ws (Blockly.getMainWorkspace)))
    (when (and ws (not (js-undefined? ws)) (not (js-null? ws)))
      (let* ((cat-name (if (js-undefined? Blockly.PROCEDURE_CATEGORY_NAME) 
                           "PROCEDURE" 
                           Blockly.PROCEDURE_CATEGORY_NAME))
             (old-cb (ws.getToolboxCategoryCallback cat-name))
             (new-cb (lambda (workspace)
                       (let* ((old-xml (if (and old-cb (not (js-undefined? old-cb))) 
                                          (old-cb workspace) 
                                          #()))
                              (lambda-block (Blockly.utils.xml.createElement "block"))
                              (generic-block (Blockly.utils.xml.createElement "block")))
                          
                          (lambda-block.setAttribute "type" "procedures_lambda")
                          (lambda-block.setAttribute "gap" "16")
                          
                          (generic-block.setAttribute "type" "procedures_generic_call")
                          (generic-block.setAttribute "gap" "16")
                          
                          ;; Add to front
                          (old-xml.unshift generic-block)
                          (old-xml.unshift lambda-block)
                          old-xml))))
         ;; Remove old callback
         (ws.removeToolboxCategoryCallback cat-name)
         ;; Register new callback
         (ws.registerToolboxCategoryCallback cat-name new-cb)
         (console.log "Registered custom procedure category callback")))))

(setup-proc-callback)

(console.log "Loaded procedures.scm with toolbox and callbacks")
