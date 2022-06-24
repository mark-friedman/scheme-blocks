# scheme-blocks
## A blocks-based visual programming language based on the Scheme programming language

### High level goals

1. Create a design for representing 1st class procedures in Blockly.  Snap! is obviously one source of ideas for this, but if anyone has any other ideas or references they would be welcome.  Note that it's not just the procedure block(s) themselves, but some other things, like how they would fit with built-in primitive functions, which you might want in a Blockly Toolbox but might get dynamically reassigned.

2. Build a Scheme language plugin for Blockly's core language.  This would be like any of the other Blockly languages.  This would probably not be super useful for anyone, given the meagreness of Blockly's core language, but it's still probably worth doing, I think.

   1. This could also, potentially, include an interpreter as an option, maybe triggered by the addition of a do-it capability.

3. Build a "reasonable" Scheme language plugin for Blockly.  This would incorporate a significant subset of the standard Scheme r7rs-small.  I'm open to suggestions on what, exactly, this should include.

   * This could also, potentially, include an interpreter, maybe triggered by the addition of a do-it capability.

4. Design and build a blocks-based Scheme IDE, using Blockly and some existing Scheme interpreter.  This might look quite different than “standard” Blockly, since, among other things:

   * Standard Blockly doesn't have a good Scheme-y way of  dealing with the fundamental similarity of primitive functions and user-defined functions.
   
   * The straightforward way to represent lambdas might be non-optimal.  Consider, for example, if we wanted to handle tham similarly to Snap!’s grey rings.

5. Build a version of App Inventor that uses Scheme Blocks.  This would reuse as much of the existing App Inventor code base as possible.  Note, though, that it will probably not be possible to import/convert existing App Inventor projects to Scheme. This could be viewed as a bug or a feature ;-)

6. Think about the pedagogical implications of having the above and perhaps design curricula.
