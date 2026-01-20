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
import { LexicalVariablesPlugin } from '@mit-app-inventor/blockly-block-lexical-variables';


document.addEventListener('DOMContentLoaded', function () {
  // Expose globals for testing and future Scheme interop
  window.Blockly = Blockly;
  window.LexicalVariablesPlugin = LexicalVariablesPlugin;

  // Initialize Scheme generator globally (was previously done in procedures.js)
  const schemeCodeGenerator = new Blockly.Generator('Scheme');
  window.schemeCodeGenerator = schemeCodeGenerator;

  // Initial toolbox (empty, will be populated by procedures.scm)
  const initialToolbox = { kind: 'categoryToolbox', contents: [] };

  const workspace = Blockly.inject('blocklyDiv', {
    toolbox: initialToolbox,
    media: 'media/',
  });

  // Load lexical variable plugin
  LexicalVariablesPlugin.init(workspace);

  // Note: Custom procedure category callback and blocks are setup by src/blocks/procedures.scm

  // TODO: Uncomment the code below to show the generated code.
  // workspace.addChangeListener((event) => {
  //   if (!event.isUiEvent) {
  //     const code = schemeCodeGenerator.workspaceToCode(workspace);
  //     console.log(code);
  //   }
  // })

  const lang = 'Scheme';
  const button = document.getElementById('blocklyButton');
});
