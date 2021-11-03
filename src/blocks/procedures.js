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
    this.setConnections();
    this.setColour(230);
    this.setTooltip('Calls a procedure!');
    this.setStyle('procedure_blocks');
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
    console.log('Possible connection found');
    console.log(closestConnection);
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
      this.setConnections();
    }
  },
  domToMutation: function(xmlElement) {
    this.hasOutput =
        (xmlElement.getAttribute('has_output') === 'true');
    this.hasPreviousAndNext =
        (xmlElement.getAttribute('has_previous_and_next') === 'true');
    this.setConnections();
  },
  mutationToDom: function() {
    const xmlElement = document.createElement('mutation');
    xmlElement.setAttribute('has_output', this.hasOutput);
    xmlElement.setAttribute('has_previous_and_next', this.hasPreviousAndNext);
    return xmlElement;
  },
}
