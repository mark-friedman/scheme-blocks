/**
 * @license
 *
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Example of including Blockly with using Webpack with
 *               defaults: (English lang & JavaScript generator).
 * @author samelh@google.com (Sam El-Husseini)
 */

import * as Blockly from 'blockly';

// To use the import below (for testing local package) replace the
// dependency in packages.json with the following:
//      "@mit-app-inventor/blockly-block-lexical-variables": "file:../my-blockly-plugins/blockly-plugins/block-lexical-variables",
// block-lexical-variables/src/index.js also needs to contain the following:
//      export const MyBlockly = Blockly;
// import {MyBlockly as Blockly} from '@mit-app-inventor/blockly-block-lexical-variables';

import * as LexicalVariables
  from '@mit-app-inventor/blockly-block-lexical-variables';
import {standardProcedureToolboxJson} from './blocks/procedures';

document.addEventListener('DOMContentLoaded', function() {
  const workspace = Blockly.inject('blocklyDiv',
      {
        toolbox: standardProcedureToolboxJson,
        media: 'media/',
      });

  // Set up lambda block in Procedure toolbox category
  const oldProcCategoryCallback =
      workspace.getToolboxCategoryCallback(Blockly.PROCEDURE_CATEGORY_NAME);
  workspace.removeToolboxCategoryCallback(Blockly.PROCEDURE_CATEGORY_NAME);
  const newProcCategoryCallback = (workspace) => {
    const oldXmlList = oldProcCategoryCallback(workspace);
    const lambdaBlock = Blockly.utils.xml.createElement('block');
    lambdaBlock.setAttribute('type', 'procedures_lambda');
    lambdaBlock.setAttribute('gap', 16);
    const genericCallBlock = Blockly.utils.xml.createElement('block');
    genericCallBlock.setAttribute('type', 'procedures_generic_call');
    genericCallBlock.setAttribute('gap', 16);
    return [lambdaBlock, genericCallBlock].concat(oldXmlList);
  };
  workspace.registerToolboxCategoryCallback(Blockly.PROCEDURE_CATEGORY_NAME,
      newProcCategoryCallback);

  // Load lexical variable plugin
  LexicalVariables.init(workspace);

  const lang = 'JavaScript';
  const button = document.getElementById('blocklyButton');
  button.addEventListener('click', function() {
    alert('Check the console for the generated output.');
    const code = Blockly[lang].workspaceToCode(workspace);
    console.log(code);
  });
});
