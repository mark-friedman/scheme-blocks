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
        // In next line we subtract 1 for the targetObj parameter which is added
        // by bind() below
        const mixinArity = mixinPropertyValue.length - 1;
        const targetArity = targetPropertyValue.length;
        if (mixinArity !== targetArity) {
          // We can have different arities but we should at least warn about it!
          console.warn(`Mixin function ${mixinProperty} has ${mixinArity}` +
              ` parameters (minus the initial target object parameter) but` +
              ` target function has ${targetArity}.`);
        }
        targetPropertyValue= targetPropertyValue.bind(targetObj);
      } else {
        // It's ok for target property to not be a function, but we should warn
        // about it.
        if (targetPropertyValue !== undefined) {
          console.warn(`Mixin property ${mixinProperty} is a function but` +
              ` the corresponding target property is not.`);
        }
      }
      // The mixin function will be called with the original target property
      // as the first argument.  Note that it could be null and might not be
      // a function.
      targetObj[mixinProperty] =
          mixinPropertyValue.bind(targetObj, targetPropertyValue);
    } else {
      if (typeof targetPropertyValue === 'function') {
        console.warn(`Mixin property ${mixinProperty} is not a function` +
            ` but the corresponding target property is.`);
      }
      targetObj[mixinProperty] = mixinPropertyValue;
    }
  }
}

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

