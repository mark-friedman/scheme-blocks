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

;; Create a procedure call block (generic or specific)
;; @param {boolean} is-generic - Whether this is a generic call block
;; @param {string|undefined} block-name - Name of the specific procedure (if not generic)
;; @param {list|undefined} arg-names - Argument names for specific procedures
;; @returns {Object} Block definition object
(define (procedure-call-base is-generic block-name arg-names)
  #{(init
      (lambda ()
        (if is-generic
            (((this.appendValueInput "PROC").setCheck "procedure").appendField "call")
            (begin
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
                  arg-names))))
        
        ;; Use our Scheme chameleon mixin!
        (blockly-mixin window.chameleonMixin this)
        
        (set! this.horizontalParameters #t)
        (set! this.itemCount 0)
        (this.setColour 230)
        (this.setTooltip "Calls a procedure!")
        (this.setStyle "procedure_blocks")
        
        (when is-generic
          (this.setMutator (js-new Blockly.icons.MutatorIcon #("procedures_call_item") this)))))

    (getGlobalNames
      (lambda ()
        (if (and (not is-generic) block-name)
            (vector block-name)
            #())))
            
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

(set! Blockly.Blocks.procedures_generic_call (procedure-call-base #t #f #f))

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

;; Define standard built-in procedures
(define standard-builtins
  (list 
    #{ (name "string-length") (category "Strings") (argNames #("string")) }
    #{ (name "length") (category "Lists") (argNames #("list")) }))

;; Register blocks and generators for standard built-ins
(for-each 
  (lambda (proc-info)
    (let ((block-type (string-append "procedures_" proc-info.name)))
      ;; Define Block - convert vector to list for arg-names
      (js-set! Blockly.Blocks block-type
         (procedure-call-base #f proc-info.name (vector->list proc-info.argNames)))
         
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
;; Toolbox Definition
;; ---------------------------------------------------------------------------

(define standard-procedure-toolbox-json
  #{ (kind "categoryToolbox")
     (contents (vector
       #{ (kind "category") 
          (name "Strings") 
          (contents (vector #{ (kind "block") (type "text") })) }
       #{ (kind "category") 
          (name "Lists") 
          (contents #()) }
       #{ (kind "category") 
          (name "Variables") 
          (contents (vector
            #{ (kind "block") (type "global_declaration") }
            #{ (kind "block") (type "local_declaration_statement") }
            #{ (kind "block") (type "local_declaration_expression") }
            #{ (kind "block") (type "lexical_variable_get") }
            #{ (kind "block") (type "lexical_variable_set") })) }
       #{ (kind "category") 
          (name "Functions") 
          (custom "PROCEDURE") }
     )) })

;; Populate toolbox with standard procedure blocks
;; @private
(define (gen-toolbox-procedures)
  (for-each
    (lambda (proc-info)
      (let* ((cat-name proc-info.category)
             (block-type (string-append "procedures_" proc-info.name))
             (cat-obj (standard-procedure-toolbox-json.contents.find
                         (lambda (cat) (equal? cat.name cat-name)))))
        (if (not (js-undefined? cat-obj))
            (cat-obj.contents.unshift #{ (kind "block") (type block-type) })
            (console.warn (string-append "Category " cat-name " not found")))))
    standard-builtins))

(gen-toolbox-procedures)

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
