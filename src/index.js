/**
 * @license
 *
 * Copyright 2021 Mark Friedman
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
 * @fileoverview Main JavaScript file for the Scheme Blocks IDE
 * @author mark.friedman@gmail.com (Mark Friedman)
 */

import * as Blockly from 'blockly';

import * as LexicalVariables
  from '@mit-app-inventor/blockly-block-lexical-variables';
import {standardProcedureToolboxJson, schemeCodeGenerator} from './blocks/procedures';

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

  workspace.addChangeListener((event) => {
    if (!event.isUiEvent) {
      const code = schemeCodeGenerator.workspaceToCode(workspace);
      console.log(code);
    }
  })

  const lang = 'Scheme';
  const button = document.getElementById('blocklyButton');
});
