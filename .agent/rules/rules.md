---
trigger: always_on
---

# Global Project Rules

## Agentic Rules
- **Following Orders**: DO NOT make any changes or carry our implementation tasks if the user just asks a question.  Just answer the question!

## Blockly Library Info
- **Context7**: Use the Context7 MSP server and specify the /google/blockly library ID.
- **Developer Documentation**: The developer documentation website is  https://developers.google.com/blockly
- **Developer Community Forum**:  The developer community forum Google Group is at https://groups.google.com/g/blockly
- **Blockly Sample Code**: Use the Context7 MSP server and specify the  /google/blockly-samples library ID

## Testing Requirements
- All new features must have accompanying unit and/or functional tests in `tests/`.
- Any complex logic should have unit tests.  Refactor to make it testable if needed.
- Most tests should be written BEFORE the code that is being tested is written. Sometimes you'll realize after writing the code that you need to write additional tests for it and that's ok.  It's also ok to occasionally rewrite tests to make them more correct or more effective or cover more cases.

## Scheme Coding
- **Features**: Use the `scheme-js` implementation of Scheme described in the `scheme-js-readme.md` file.  Note that it has some features beyonf just R7RS-small standard Scheme.  In particular it has features to provide transparent interopability with JavaScript and the ability to be used in a browser and access DOM and other browser objects.
- **Library Files**: The `scheme-js`implementation files are in the `libs` directory.

## JavaScript Code Style
- **Modules**: Use ES Modules (`import`/`export`).
- **Formatting**: Use 2 spaces for indentation.
- **Exports**: Export functions and classes clearly.

## Scheme Code Rules
- **Scheme over JS**: Implementations should always be done in Scheme, if possible.  If that's not possible, isolate the minimum that is required in JavaScript and then implement the rest in Scheme.
- **Idiomatic Scheme**: Don't just transliterate from JavaScript to Scheme.  Understand the intent of the JavaScrip code and try to use idiomatic Scheme code.

## Task and Roadmap maintainance
-  **Roadmap files**:  There will sometimes be roadmap files for larger or long range plans.  We want to ensure the roadmap stays current and reflects the actual state of the project. As you work through each task and phase:
    * Check off completed tasks (- [x]) as we finish them
    * Add new tasks that emerge during implementation
    * Move completed items to the "Completed Items" section
    * Update the status emoji (⬜ → 🔄 → ✅) for each phase
    * Add change log entries for significant updates

## Documentation
- **JSDoc**: Document all JavaScript functions with JSDoc.
- **Scheme Doc**: Document all Scheme functions with JSDoc-style comments, using the same format as JSDoc, but with Scheme procedure-level comment syntax (i.e. `;;`).
- **Internal Documentation**: Document logic inside JavaScript and Scheme functions and procedures using comment syntax appropriate for the language.
- **Code Sections**: Document the start of associated collections of functions and procedures using comment syntax appropriate for the language.
- **CHANGES.md**: Document the changes you make by appending your walkthrough.md files to `CHANGES.md` when any major tasks are completed.