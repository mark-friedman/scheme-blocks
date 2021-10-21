import * as Blockly from 'blockly';

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
