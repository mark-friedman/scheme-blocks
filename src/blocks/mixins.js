import * as Blockly from 'blockly/core';

export const chameleonMixin = {
  init: function(origInit) {
    // We start off with all the connections
    this.hasPreviousAndNext = true;
    this.hasOutput = true;
    this.setConnections();
  },
  setConnections: function(origSetConnections) {
    origSetConnections && origSetConnections();
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
  onPendingConnection: function(origOnPendingConnections, closestConnection) {
    origOnPendingConnections && origOnPendingConnections(closestConnection);
    this.setOutput(false);
  },
  onchange: function(origOnChange, event) {
    origOnChange && origOnChange(event);
    // We'd like to try and limit the events that we have to process even more,
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
  saveExtraState: function(origSaveExtraState) {
    const origExtraState = origSaveExtraState ? origSaveExtraState() : {};
    return {
      ...origExtraState,
      hasOutput: this.hasOutput,
      hasPreviousAndNext: this.hasPreviousAndNext,
    };
  },
  loadExtraState: function(origLoadExtraState, state) {
    origLoadExtraState.call(this, state);
    this.hasPreviousAndNext = state.hasPreviousAndNext;
    this.hasOutput = state.hasOutput;
    this.updateShape();
  },
  updateShape: function(origUpdateShape) {
    origUpdateShape && origUpdateShape();
    this.setConnections();
  },
}
