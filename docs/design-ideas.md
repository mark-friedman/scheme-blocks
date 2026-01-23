**Make sure that the easy things are easy and the hard things possible\!**

The number of blocks needed for even a small subset of Scheme seems large.  We may need a [nested Blockly Toolbox](https://developers.google.com/blockly/guides/configure/web/toolbox#tree_of_categories).  We might also want a way to allow users to augment the toolbox by either:

* Adding standard Scheme functions that we don’t support by default  
* Importing SRFIs and other libraries

Note that that second option in particular suggests that we might want to integrate with a Scheme implementation that allows some introspection so that we can **automatically create new blocks from imported libraries**.

We should consider `(define foo …)` and `(define (foo bar …) …)` as separate blocks.

One big challenge is how to enable the ease of use of having blocks which do procedure calls while still enabling the use of procedure names as variables.

Should `(define (foo bar …) …)` create a procedure call block?

* Should it matter if the definition is at top-level?  
* For non-top-level scopes **we could create “callers” in a flydown**, analogous to getters and setters.

Should defining a variable as a procedure (i.e. via a lambda) create a procedure call block?

* Should it matter if the definition is at top-level?

What about the fact that the user program could re-assign to a variable that is bound to a procedure?  Any caller blocks could be invalid.

* The shape could be wrong (i.e. the new value is a procedure with a different number of parameters.  
* The new value might not even be a procedure\!

We might want to use a Scheme implementation that disallows assignment to variables defined in the “scheme-report-environment” in order to not have to deal with changes to standard toolbox blocks.

Having to use `apply` (or a separate `call` block) would be awkward.  It would be nice to have UI affordance which could convert a variable (or expression) into a call.  For standard Scheme procedures (and maybe in-scope procedure definitions) it could create a block of the right shape (i.e. number of inputs).  For other references it could have a mutator which would allow the user to create the right shape.  We could still also have a generic call block which could be mutated as needed.

It would be nice if the generic call block didn’t take of too much space.  Maybe it’s just a block of a special (grey, like SNAP\!?) color, which takes a procedure and a set of arguments.

In order to make it clearer that procedure names are just the same as variable names, we could have the **“standard” procedure blocks that we pull out of the toolbox just be generic call blocks with the procedure name as a Blockly shadow block**\!  There may be an issue with distinguishing calls to procedures that take no arguments and simple references to the procedure by name.  Maybe the look of the caller block will be distinctive enough.  Also, shadow blocks can’t be pulled out or duplicated, so how do we just obtain a getter block for standard procedure. In the short run we could just pre-attach the getter block to the call block.  In the long run, maybe we want a shadow block that has a flydown with the getter and setter.  This would also deal with how to get a setter block for a standard procedure.  Also, see also the next item about having multiple complexity levels of the UI. 

Maybe we could have 3 levels of UI:

1. Beginner \- where getters are marked with “get”, call blocks with “call”, etc.  
2. Intermediate \- where we remove the training wheels of “get”, “call”, etc.  
3. Advanced \- where we allow intermixing of text with blocks.

We may want a few different varieties of variable getters (ahd maybe setters):

* Normal lexical variable getter  
* Fixed variable name (for standard procedures) 

