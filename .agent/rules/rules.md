---
trigger: always_on
---

# Global Project Rules

## Agentic Rules
- **Following Orders**: DO NOT make any changes or carry our implementation tasks if the user just asks a question.  Just answer the question!

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

## Documentation
- **JSDoc**: Document all JavaScript functions with JSDoc.
- **Scheme Doc**: Document all Scheme functions with JSDoc-style comments, using the same format as JSDoc, but with Scheme procedure-level comment syntax (i.e. `;;`).
- **Internal Documentation**: Document logic inside JavaScript and Scheme functions and procedures using comment syntax appropriate for the language.
- **Code Sections**: Document the start of associated collections of functions and procedures using comment syntax appropriate for the language.
- **CHANGES.md**: Document the changes you make by appending your walkthrough.md files to `CHANGES.md` when any major tasks are completed.