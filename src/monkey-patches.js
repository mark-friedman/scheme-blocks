/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

Blockly.Block.prototype.unplug = function(opt_healStack) {
  if (this.outputConnection) {
    this.unplugFromRow_(opt_healStack);
  }
  if (this.previousConnection) {
    this.unplugFromStack_(opt_healStack);
  }
};
