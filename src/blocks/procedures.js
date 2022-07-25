import * as Blockly from 'blockly';
import {FieldParameterFlydown} from '@mit-app-inventor/blockly-block-lexical-variables';
import {chameleonMixin} from './mixins';
import {blocklyMixin} from '../utils/mixin';

Blockly.Blocks['procedures_lambda'] = {
  // Define an unnamed procedure with a return value.
  category: 'Procedures', // Procedures are handled specially.
  bodyInputName: 'STACK',
  init: function() {
    this.createHeader();
    this.appendStatementInput('STACK')
        .setCheck(null);
    this.horizontalParameters = true; // horizontal by default
    this.setOutput(true, 'procedure');
    this.setColour(230);
    this.setTooltip('Makes a procedure!');
    this.setHelpUrl('http://www.r6rs.org/final/html/r6rs/r6rs-Z-H-14.html#node_idx_364');
    // this.appendDummyInput('HEADER')
    //     .appendField(fieldProcName, 'NAME');
    this.setStyle('procedure_blocks');
    this.setMutator(new Blockly.Mutator(['procedures_mutatorarg']));
    this.arguments_ = [];
    this.warnings = [{name: 'checkEmptySockets', sockets: ['STACK']}];
  },
  createHeader: function(ignored) {
    return this.appendDummyInput('HEADER').appendField('λ');
  },
  getProcedureDef: function() {
    // Return the name of the defined procedure,
    // a list of all its arguments,
    // and that it DOES NOT have a return value.
    return [
      '',
      this.arguments_,
      this.bodyInputName === 'RETURN',
    ]; // true for procedures that return values.
  },
  withLexicalVarsAndPrefix:
    Blockly.Blocks.procedures_defnoreturn.withLexicalVarsAndPrefix,
  onchange: Blockly.Blocks.procedures_defnoreturn.onchange,
  updateParams_: Blockly.Blocks.procedures_defnoreturn.updateParams_,
  parameterFlydown: Blockly.Blocks.procedures_defnoreturn.parameterFlydown,
  setParameterOrientation:
    Blockly.Blocks.procedures_defnoreturn.setParameterOrientation,
  mutationToDom: Blockly.Blocks.procedures_defnoreturn.mutationToDom,
  domToMutation: Blockly.Blocks.procedures_defnoreturn.domToMutation,
  decompose: Blockly.Blocks.procedures_defnoreturn.decompose,
  compose: Blockly.Blocks.procedures_defnoreturn.compose,
  dispose: Blockly.Blocks.procedures_defnoreturn.dispose,
  getVars: Blockly.Blocks.procedures_defnoreturn.getVars,
  declaredNames: Blockly.Blocks.procedures_defnoreturn.declaredNames,
  declaredVariables: Blockly.Blocks.procedures_defnoreturn.declaredVariables,
  renameVar: Blockly.Blocks.procedures_defnoreturn.renameVar,
  renameVars: Blockly.Blocks.procedures_defnoreturn.renameVars,
  renameBound: Blockly.Blocks.procedures_defnoreturn.renameBound,
  renameFree: Blockly.Blocks.procedures_defnoreturn.renameFree,
  freeVariables: Blockly.Blocks.procedures_defnoreturn.freeVariables,
  blocksInScope: Blockly.Blocks.procedures_defnoreturn.blocksInScope,
  customContextMenu: Blockly.Blocks.procedures_defnoreturn.customContextMenu,
  getParameters: Blockly.Blocks.procedures_defnoreturn.getParameters,
};

const makeStandardProcedureGetter = (procName, opt_helpUrl) => {
  const blockType = procName + '_standard_procedure_get';
  Blockly.Blocks[blockType] = {
    init: function() {
      this.appendDummyInput()
          .appendField('get')
          .appendField(procName);
      this.setOutput(true, 'procedure');
      this.setColour(230);
      this.setTooltip(`Get ${procName} procedure.`);
      opt_helpUrl && this.setHelpUrl(opt_helpUrl);
      this.setStyle('procedure_blocks');
    },
  }
  schemeCodeGenerator[blockType] = (block) => {
    const codeStr = procName;
    return block.outputConnection ? [codeStr, 1] : codeStr;
  }
  return blockType;
}

const makeStandardProcedureSetter = (procName, opt_helpUrl) => {
  const blockType = procName + '_standard_procedure_set';
  Blockly.Blocks[blockType] = {
    init: function() {
      this.appendValueInput('PROCEDURE')
          .setCheck('procedure')  // This is not strictly correct, but probably useful
          .appendField('set')
          .appendField(procName)
          .appendField('to');
      this.setNextStatement(true);
      this.setPreviousStatement(true);
      this.setColour(230);
      this.setTooltip(`Set ${procName} procedure.`);
      opt_helpUrl && this.setHelpUrl(opt_helpUrl);
      this.setStyle('procedure_blocks');
    },
  }
  schemeCodeGenerator[blockType] = (block) => {
    const valStr = schemeCodeGenerator.valueToCode(block, 'PROCEDURE', 10)
    const codeStr = `(set! ${procName} ${valStr})`;
    return block.outputConnection ? [codeStr, 1] : codeStr;
  }
  return blockType;
}

class StandardProcedureNameFlydown extends FieldParameterFlydown {
  constructor(procedureName) {
    super(procedureName, false);
    this.getterBlockName = makeStandardProcedureGetter(procedureName);
    this.setterBlockName = makeStandardProcedureSetter(procedureName);
  }

  flydownBlocksXML_() {
    return `
      <xml>
        <block type="${this.getterBlockName}" />
        <block type="${this.setterBlockName}" />
      </xml>`;
  }
}

// TODO: Flesh the following out with the mutation procedures in order to create
//       a proper Chameleon Block extension. Note that we'll have to pull all
//       the mutation-related functions out of procedureCallBase.
//
// Blockly.Extensions.register(
//     'chameleon_block_extension',
//     function() {
//       blocklyMixin(chameleonMixin, this);
//     }
// );
//
// Blockly.Extensions.registerMutator(
//     'procedures_call_item',
//     {},
// );
//
// const procCallBaseJson = {
//   'extensions': ['chameleon_block_extension',],
//   'mutator': 'procedures_call_item',
// }

const procedureCallBase = (isGeneric, blockName, argNames = []) => { return {
  init: function() {
    // TODO: uncomment the following line when the above extension definition
    //       is complete
    // this.jsonInit(procCallBaseJson);
    if (isGeneric) {
      this.appendValueInput("PROC")
          .setCheck('procedure')
          .appendField("call");
    } else {
      this.appendDummyInput()
          .appendField("call")
          .appendField(new StandardProcedureNameFlydown(blockName))
          .appendField('with');
      argNames.forEach(argName => {
        this.appendValueInput(argName)
            .setCheck(null)
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(argName);
      });
    }
    blocklyMixin(chameleonMixin, this)
    this.horizontalParameters = true;
    this.itemCount = 0;
    this.setColour(230);
    this.setTooltip('Calls a procedure!');
    this.setStyle('procedure_blocks');
    if (isGeneric) {
      this.setMutator(new Blockly.Mutator(['procedures_call_item']));
    }
  },
  getGlobalNames: function() {
    return !isGeneric && blockName ? [ blockName ] : [];
  },
  saveExtraState: function() {
    return {
      itemCount: this.itemCount,
    };
  },
  loadExtraState: function(state) {
    this.itemCount = state.itemCount;
    this.updateShape();
  },
  decompose: function(workspace) {
    // This is a special sub-block that only gets created in the mutator UI.
    // It acts as our "top block"
    const topBlock = workspace.newBlock('procedures_call_container');
    topBlock.initSvg();

    // Then we add one sub-block for each item in the list.
    let connection = topBlock.getInput('STACK').connection;
    for (let i = 0; i < this.itemCount; i++) {
      const itemBlock = workspace.newBlock('procedures_call_item');
      itemBlock.initSvg();
      connection.connect(itemBlock.previousConnection);
      connection = itemBlock.nextConnection;
    }

    // And finally we have to return the top-block.
    return topBlock;
  },

// The container block is the top-block returned by decompose.
  compose: function(topBlock) {
    // First we get the first sub-block (which represents an input on our main block).
    let itemBlock = topBlock.getInputTargetBlock('STACK');

    // Then we collect up all of the connections of on our main block that are
    // referenced by our sub-blocks.
    // This relates to the saveConnections hook (explained below).
    const connections = [];
    while (itemBlock && !itemBlock.isInsertionMarker()) {  // Ignore insertion markers!
      connections.push(itemBlock.valueConnection_);
      itemBlock = itemBlock.nextConnection &&
          itemBlock.nextConnection.targetBlock();
    }

    // Then we disconnect any children where the sub-block associated with that
    // child has been deleted/removed from the stack.
    for (let i = 0; i < this.itemCount; i++) {
      const connection = this.getInput('ARG' + i).connection.targetConnection;
      if (connection && connections.indexOf(connection) === -1) {
        connection.disconnect();
      }
    }

    // Then we update the shape of our block (removing or adding inputs as necessary).
    // `this` refers to the main block.
    this.itemCount = connections.length;
    this.updateShape();

    // And finally we reconnect any child blocks.
    for (let i = 0; i < this.itemCount; i++) {
      Blockly.Mutator.reconnect(connections[i], this, 'ARG' + i);
    }
  },
  /**
   * Modify this block to have the correct number of inputs.
   * @private
   * @this {Blockly.Block}
   */
  updateShape: function() {
   // Add new inputs.
    for (let i = 0; i < this.itemCount; i++) {
      if (!this.getInput('ARG' + i)) {
        const input = this.appendValueInput('ARG' + i)
            .setAlign(Blockly.ALIGN_RIGHT);
        if (i === 0) {
          input.appendField('with');
        }
      }
    }
    // Remove deleted inputs.
    for (let i = this.itemCount; this.getInput('ARG' + i); i++) {
      this.removeInput('ARG' + i);
    }
  },
}};

Blockly.Blocks['procedures_generic_call'] = { ...procedureCallBase(true) }

Blockly.Blocks['procedures_call_container'] = {
  /**
   * Mutator block for list container.
   * @this {Blockly.Block}
   */
  init: function() {
    this.setStyle('procedure_blocks');
    this.appendDummyInput()
        .appendField('arguments');
    this.appendStatementInput('STACK');
    this.setTooltip('Add, delete or reorder the arguments to the procedure call');
    this.contextMenu = false;
  },
};

Blockly.Blocks['procedures_call_item'] = {
  /**
   * Mutator block for adding items.
   * @this {Blockly.Block}
   */
  init: function() {
    this.setStyle('procedure_blocks');
    this.appendDummyInput()
        .appendField('arg');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('Argument to add to the procedure call');
    this.contextMenu = false;
  },
};

const standardProcedures = [
  {
    name: 'string-length',
    category: 'Strings',
    argNames: ['string'],
  },
  {
    name: 'length',
    category: 'Lists',
    argNames:  ['list',]
  },
];

const procedurePrefix = 'procedures_';

const genProcedureBlockType =
        procedureName => `${procedurePrefix}${procedureName}`

export const standardProcedureToolboxJson = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Strings',
      contents: [
        {
          kind: 'block',
          type: 'text'
        }
      ]
    },
    {
      kind: 'category',
      name: 'Variables',
      contents: [
        {
          kind: 'block',
          type: 'global_declaration'
        },
        {
          kind: 'block',
          type: 'local_declaration_statement'
        },
        {
          kind: 'block',
          type: 'local_declaration_expression'
        },
        {
          kind: 'block',
          type: 'lexical_variable_get'
        },
        {
          kind: 'block',
          type: 'lexical_variable_set'
        },
      ]
    },
    {
      kind: 'category',
      name: 'Functions',
      custom: 'PROCEDURE'
    }
  ],
};

const genToolboxProcedures = (procedures) => {
  const allCategories = new Set(standardProcedures.map(proc => proc.category));
  // TODO: We might want to impose some ordering of the categories
  allCategories.forEach((cat) => {
    const proceduresInCategory = standardProcedures.filter(proc => proc.category === cat);
    const toolboxContentsForCategory = proceduresInCategory.map((procedure) => {
      return {
        type: genProcedureBlockType(procedure.name),
        kind: 'block',
      }
    });
    const existingCategory =
        standardProcedureToolboxJson.contents.find(obj => obj.kind === 'category' && obj.name === cat);
    if (existingCategory) {
      existingCategory.contents.splice(0, 0, ...toolboxContentsForCategory);
    } else {
      standardProcedureToolboxJson.contents.splice(0,0,{
        kind: 'category',
        name: cat,
        contents: toolboxContentsForCategory,
      })
    }
  })
}

genToolboxProcedures(standardProcedures);

const genStandardProcedureBlocks = (procedures) => {
  procedures.forEach((procedure) => {
    Blockly.Blocks[genProcedureBlockType(procedure.name)] = {
      ...procedureCallBase(false, procedure.name, procedure.argNames),
    };
  });
}

genStandardProcedureBlocks(standardProcedures);

export const schemeCodeGenerator = new Blockly.Generator('Scheme');
console.log(schemeCodeGenerator);

const genStandardProcedureCode = (procedures) => {
  procedures.forEach((procedure) => {
    schemeCodeGenerator[genProcedureBlockType(procedure.name)] = (block) => {
      const argVals = procedure.argNames.map((argName) => {
        return schemeCodeGenerator.valueToCode(block, argName, 10);
      })
      const argValStr = argVals.join(' ');
      const codeStr = `(${procedure.name} ${argValStr})`;
      console.log(codeStr);
      // If this block has an outputConnection then it is in a value context, else it is in a statement context
      return block.outputConnection ? [codeStr, 1] : codeStr;
    }
  });
}

genStandardProcedureCode(standardProcedures);
