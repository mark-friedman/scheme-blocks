/**
 * Copy properties from mixin object to a target object.
 *
 * Function-valued properties in the mixin will be converted to equivalent
 * functions with the target's objects same-named property bound as the first
 * argument.  This is so that any mixed in functions will be able to call the
 * original target object's functions/methods if needed. Note that that first
 * argument may be null (if there was no property in the target object with the
 * same name) or may not be a function (if the same-named property in the
 * target wasn't a functions).
 *
 * @param {!Object} mixinObj Source object to mixin properties from
 * @param {!Object} targetObj Target object to mix into
 */
export function mixin(mixinObj, targetObj) {
  for (const mixinProperty in mixinObj) {
    const mixinPropertyValue = mixinObj[mixinProperty];
    let targetPropertyValue = targetObj[mixinProperty];
    if (typeof mixinPropertyValue === 'function') {
      if (typeof targetPropertyValue === 'function') {
        targetPropertyValue= targetPropertyValue.bind(targetObj);
      }
      // The mixin function will be called with the original target property
      // as the first argument.  Note that it could be null and might not be
      // a function.
      targetObj[mixinProperty] =
          mixinPropertyValue.bind(targetObj, targetPropertyValue);
    } else {
      targetObj[mixinProperty] = mixinPropertyValue;
    }
  }
};

/**
 * Copy properties from source object to a target object.
 *
 * Wraps the mixin function to call the mixin's init() function if it exists.
 * This is because for Blockly the call to this function is in the original
 * init() before we've had a chance to mixin any properties, most notably the
 * mixin's init() function.
 *
 * @param {!Object} sourceObj Source object to copy properties from
 * @param {!Object} targetObj Target object to copy properties to
 */
export function blocklyMixin(mixinObj, targetObj) {
  // Mix in our base mixin
  mixin(mixinObj, targetObj);
  let mixinInit = mixinObj.init;
  if (mixinInit) {
    // Call the mixin's init function with an empty origInit function, because
    // we are being called by the original init() function!.
    mixinInit.bind(targetObj)(() => {});
  }
}

