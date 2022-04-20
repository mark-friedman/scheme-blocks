import * as Blockly from 'blockly';
// import {MyBlockly as Blockly} from '@mit-app-inventor/blockly-block-lexical-variables';

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

Blockly.Blocks['procedures_generic_call'] = {
  init: function() {
    this.appendDummyInput('HEADER').appendField('call');
    this.appendValueInput('PROC')
        .setCheck('procedure');
    this.horizontalParameters = true;
    // We start off with all the connections
    this.hasPreviousAndNext = true;
    this.hasOutput = true;
    this.itemCount = 0;
    this.setConnections();
    this.setColour(230);
    this.setTooltip('Calls a procedure!');
    this.setStyle('procedure_blocks');
    this.setMutator(new Blockly.Mutator(['procedures_call_item']));
  },
  setConnections: function() {
    if (this.hasPreviousAndNext) {
      // Don't re-add connections that already exist
      !this.nextConnection && this.setNextStatement(true);
      !this.previousConnection && this.setPreviousStatement(true);
    } else {
      this.setNextStatement(false);
      this.setPreviousStatement(false);
    }
    if (this.hasOutput) {
      if (!this.outputConnection) {
        this.setOutput(true);
      }
    } else {
      this.setOutput(false);
    }
  },
  onPendingConnection: function(closestConnection) {
    this.setOutput(false);
  },
  onchange: function(event) {
    // We'd like to try an limit the events that we have to process even more,
    // but a lot of different things can effect connection changes to this
    // block. It's possible that even the following is too restrictive!
    if (event.type === Blockly.Events.BLOCK_DRAG) {
      // Change the shape of the block to match how it is currently connected
      this.hasPreviousAndNext = true;
      this.hasOutput = true;
      if (this.outputConnection && this.outputConnection.targetBlock()) {
        this.hasPreviousAndNext = false;
      } else if (this.getPreviousBlock() || this.getNextBlock()) {
        this.hasOutput = false;
      }
      this.updateShape()
    }
  },
  // domToMutation: function(xmlElement) {
  //   this.hasOutput =
  //       (xmlElement.getAttribute('has_output') === 'true');
  //   this.hasPreviousAndNext =
  //       (xmlElement.getAttribute('has_previous_and_next') === 'true');
  //   this.setConnections();
  // },
  // mutationToDom: function() {
  //   const xmlElement = document.createElement('mutation');
  //   xmlElement.setAttribute('has_output', this.hasOutput);
  //   xmlElement.setAttribute('has_previous_and_next', this.hasPreviousAndNext);
  //   return xmlElement;
  // },
  saveExtraState: function() {
    return {
      hasOutput: this.hasOutput,
      hasPreviousAndNext: this.hasPreviousAndNext,
      itemCount: this.itemCount,
    };
  },
  loadExtraState: function(state) {
    this.hasPreviousAndNext = state.hasPreviousAndNext;
    this.hasOutput = state.hasOutput;
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
    this.setConnections();
  },
};

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

