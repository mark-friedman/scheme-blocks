# scheme-blocks [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)
## A blocks-based visual programming language based on the [Scheme](https://en.wikipedia.org/wiki/Scheme_(programming_language)) programming language

### High level goals

1. Create a design for representing 1st class procedures in Blockly.  [Snap!](https://snap.berkeley.edu/) is obviously one source of ideas for this, but if anyone has any other ideas or references they would be welcome.  Note that it's not just the procedure block(s) themselves, but some other things, like how they would fit with built-in primitive functions, which you might want in a Blockly Toolbox but might get dynamically reassigned.

2. Build a Scheme language plugin for Blockly's core language.  This would be like any of the other Blockly languages.  This would probably not be super useful for anyone, given the meagreness of Blockly's core language, but it's still probably worth doing, I think.

   1. This could also, potentially, include an interpreter as an option, maybe triggered by the addition of a do-it capability.

3. Build a "reasonable" Scheme language plugin for Blockly.  This would incorporate a significant subset of the standard Scheme r7rs-small.  I'm open to suggestions on what, exactly, this should include.

   * This could also, potentially, include an interpreter, maybe triggered by the addition of a do-it capability.

4. Design and build a blocks-based Scheme IDE, using Blockly and some existing Scheme interpreter.  This might look quite different from “standard” Blockly, since, among other things:

   * Standard Blockly doesn't have a good Scheme-y way of  dealing with the fundamental similarity of primitive functions and user-defined functions.
   
   * The straightforward way to represent lambdas might be non-optimal.  Consider, for example, if we wanted to handle them similarly to Snap!’s grey rings.

5. Build a version of [App Inventor](https://appinventor.mit.edu) that uses Scheme Blocks.  This would reuse as much of the existing App Inventor code base as possible.  Note, though, that it will probably not be possible to import/convert existing App Inventor projects to Scheme. This could be viewed as a bug or a feature ;-)

6. Think about the pedagogical implications of having the above and perhaps design curricula.

### The IDE (such as it is)

We have the beginnings of a Scheme IDE, which is a web app that uses Blockly to create Scheme programs.
It uses (or at least will use) the [Gambit Scheme](https://gambitscheme.org/) interpreter to run the programs.
Right now it just embeds the Gambit REPL and the Gambit VM (which allows for the creation of "files", which
are stored in the browser's local storage) in an iframe.

_Note that right now, running this with the associated Scheme IDE requires a local installation of
a modified browser-based REPL for [Gambit Scheme](https://gambitscheme.org/).  It is a modified version of [this code](https://github.com/gambit/gambit/tree/master/contrib/try).
The "real" source for the modified code is [here](https://github.com/mark-friedman/gambit/tree/scheme-blocks-changes/contrib/try),
which is a fork (and branch) of the main Gambit repo.  That directory is copied into this repo, but should probably be
a submodule (or something)._

### Running the IDE

```
npm start
```

