/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from 'blockly';

// The change was to allow for the possibility of having an output connection
// and a previous connections
Blockly.Block.prototype.unplug = function(opt_healStack) {
  if (this.outputConnection) {
    this.unplugFromRow_(opt_healStack);
  }
  if (this.previousConnection) {
    this.unplugFromStack_(opt_healStack);
  }
};

// The change is to allow for the fact that a block might change shape while it
// is being dragged
/**
 * Shows an insertion marker connected to the appropriate blocks (based on
 * manager state).
 * @private
 */
Blockly.InsertionMarkerManager.prototype.showInsertionMarker_ = function() {
  var local = this.localConnection_;
  var closest = this.closestConnection_;

  var isLastInStack = this.lastOnStack_ && local == this.lastOnStack_;
  var imBlock = isLastInStack ? this.lastMarker_ : this.firstMarker_;
  try {
    var imConn = imBlock.getMatchingConnection(local.getSourceBlock(), local);
  } catch (e) {
    // It's possible that the number of connections on the local block has
    // changed since insertions marker was originally created.  Let's recreate
    // the insertion marker and try again.
    this.firstMarker_ = this.createMarkerBlock_(this.topBlock_);
    imBlock = isLastInStack ? this.lastMarker_ : this.firstMarker_;
    imConn = imBlock.getMatchingConnection(local.getSourceBlock(), local);
  }

  if (imConn == this.markerConnection_) {
    throw Error('Made it to showInsertionMarker_ even though the marker isn\'t ' +
        'changing');
  }

  // Render disconnected from everything else so that we have a valid
  // connection location.
  imBlock.render();
  imBlock.rendered = true;
  imBlock.getSvgRoot().setAttribute('visibility', 'visible');

  if (imConn && closest) {
    // Position so that the existing block doesn't move.
    imBlock.positionNearConnection(imConn, closest);
  }
  if (closest) {
    // Connect() also renders the insertion marker.
    imConn.connect(closest);
  }

  this.markerConnection_ = imConn;
};

/**
 * Set whether this block can chain onto the bottom of another block.
 * @param {boolean} newBoolean True if there can be a previous statement.
 * @param {(string|Array<string>|null)=} opt_check Statement type or
 *     list of statement types.  Null/undefined if any type could be connected.
 */
Blockly.Block.prototype.setPreviousStatement = function(newBoolean, opt_check) {
  if (newBoolean) {
    if (opt_check === undefined) {
      opt_check = null;
    }
    if (!this.previousConnection) {
      // if (this.outputConnection) {
      //   throw Error('Remove output connection prior to adding previous ' +
      //       'connection.');
      // }
      this.previousConnection =
          this.makeConnection_(Blockly.connectionTypes.PREVIOUS_STATEMENT);
    }
    this.previousConnection.setCheck(opt_check);
  } else {
    if (this.previousConnection) {
      if (this.previousConnection.isConnected()) {
        throw Error('Must disconnect previous statement before removing ' +
            'connection.');
      }
      this.previousConnection.dispose();
      this.previousConnection = null;
    }
  }
};

// The change is to allow previous and output connection
/**
 * Set whether this block returns a value.
 * @param {boolean} newBoolean True if there is an output.
 * @param {(string|Array<string>|null)=} opt_check Returned type or list
 *     of returned types.  Null or undefined if any type could be returned
 *     (e.g. variable get).
 */
Blockly.Block.prototype.setOutput = function(newBoolean, opt_check) {
  if (newBoolean) {
    if (opt_check === undefined) {
      opt_check = null;
    }
    if (!this.outputConnection) {
      // if (this.previousConnection) {
      //   throw Error('Remove previous connection prior to adding output ' +
      //       'connection.');
      // }
      this.outputConnection =
          this.makeConnection_(Blockly.connectionTypes.OUTPUT_VALUE);
    }
    this.outputConnection.setCheck(opt_check);
  } else {
    if (this.outputConnection) {
      if (this.outputConnection.isConnected()) {
        throw Error('Must disconnect output value before removing connection.');
      }
      this.outputConnection.dispose();
      this.outputConnection = null;
    }
  }
};

// The change is to disallow connections that would cause a block to have both
// previous and output connections

// From connection.js
Blockly.Connection.REASON_PREVIOUS_AND_OUTPUT = 8;

/**
 * Check that connecting the given connections is safe, meaning that it would
 * not break any of Blockly's basic assumptions (e.g. no self connections).
 * @param {Blockly.Connection} a The first of the connections to check.
 * @param {Blockly.Connection} b The second of the connections to check.
 * @return {number} An enum with the reason this connection is safe or unsafe.
 * @public
 */
Blockly.ConnectionChecker.prototype.doSafetyChecks = function(a, b) {
  if (!a || !b) {
    return Blockly.Connection.REASON_TARGET_NULL;
  }
  if (a.isSuperior()) {
    var blockA = a.getSourceBlock();
    var blockB = b.getSourceBlock();
  } else {
    var blockB = a.getSourceBlock();
    var blockA = b.getSourceBlock();
  }
  if (blockA == blockB) {
    return Blockly.Connection.REASON_SELF_CONNECTION;
  } else if (b.type != Blockly.OPPOSITE_TYPE[a.type]) {
    return Blockly.Connection.REASON_WRONG_TYPE;
  } else if (blockA.workspace !== blockB.workspace) {
    return Blockly.Connection.REASON_DIFFERENT_WORKSPACES;
  } else if (blockA.isShadow() && !blockB.isShadow()) {
    return Blockly.Connection.REASON_SHADOW_PARENT;
  } else if (b.type === Blockly.connectionTypes.OUTPUT_VALUE &&
      blockB.getPreviousBlock()) {
    return Blockly.Connection.REASON_PREVIOUS_AND_OUTPUT;
  } else if (b.type === Blockly.connectionTypes.PREVIOUS_STATEMENT &&
      blockB.outputConnection && blockB.outputConnection.targetBlock()) {
    return Blockly.Connection.REASON_PREVIOUS_AND_OUTPUT;
  }
  return Blockly.Connection.CAN_CONNECT;
};

/**
 * Helper method that translates a connection error code into a string.
 * @param {number} errorCode The error code.
 * @param {Blockly.Connection} a One of the two connections being checked.
 * @param {Blockly.Connection} b The second of the two connections being
 *     checked.
 * @return {string} A developer-readable error string.
 * @public
 */
Blockly.ConnectionChecker.prototype.getErrorMessage = function(errorCode,
    a, b) {
  switch (errorCode) {
    case Blockly.Connection.REASON_SELF_CONNECTION:
      return 'Attempted to connect a block to itself.';
    case Blockly.Connection.REASON_DIFFERENT_WORKSPACES:
      // Usually this means one block has been deleted.
      return 'Blocks not on same workspace.';
    case Blockly.Connection.REASON_WRONG_TYPE:
      return 'Attempt to connect incompatible types.';
    case Blockly.Connection.REASON_TARGET_NULL:
      return 'Target connection is null.';
    case Blockly.Connection.REASON_CHECKS_FAILED:
      var connOne = /** @type {!Blockly.Connection} **/ (a);
      var connTwo = /** @type {!Blockly.Connection} **/ (b);
      var msg = 'Connection checks failed. ';
      msg += connOne + ' expected ' + connOne.getCheck() + ', found ' + connTwo.getCheck();
      return msg;
    case Blockly.Connection.REASON_SHADOW_PARENT:
      return 'Connecting non-shadow to shadow block.';
    case Blockly.Connection.REASON_DRAG_CHECKS_FAILED:
      return 'Drag checks failed.';
    case Blockly.Connection.REASON_PREVIOUS_AND_OUTPUT:
      return 'Block would have an output and a previous connection.'
    default:
      return 'Unknown connection failure: this should never happen!';
  }
};
