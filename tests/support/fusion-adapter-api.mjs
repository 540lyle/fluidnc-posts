function pickMethod(host, names) {
  for (const name of names) {
    if (typeof host[name] == "function") {
      return host[name].bind(host);
    }
  }
  return undefined;
}

export function createAdapterApi(host) {
  return {
    formatComment: pickMethod(host, ["fluidncFormatComment", "formatComment"]),
    writeComment: pickMethod(host, ["fluidncWriteComment", "writeComment"]),
    writeBlock: pickMethod(host, ["fluidncWriteBlock", "writeBlock"]),
    writeProgramHeader: pickMethod(host, ["fluidncWriteProgramHeader", "writeProgramHeader"]),
    getSetting: pickMethod(host, ["fluidncGetSetting", "getSetting"]),
    writeRetract: pickMethod(host, ["fluidncWriteRetract", "writeRetract"]),
    getCoolantCodes: pickMethod(host, ["fluidncGetCoolantCodes", "getCoolantCodes"]),
    setCoolant: pickMethod(host, ["fluidncSetCoolant", "setCoolant"]),
    startSpindle: pickMethod(host, ["fluidncStartSpindle", "startSpindle"]),
    getFeed: pickMethod(host, ["fluidncGetFeed", "getFeed"]),
    writeToolCall: pickMethod(host, ["fluidncWriteToolCall", "writeToolCall"]),
    writeToolBlock: pickMethod(host, ["fluidncWriteToolBlock", "writeToolBlock"]),
    flushPendingLinearMove: pickMethod(host, ["fluidncFlushPendingLinearMove", "_fluidncFlushPending", "flushPendingLinearMove"]),
    writeStartBlocks: pickMethod(host, ["fluidncWriteStartBlocks", "writeStartBlocks"]),
    writeWCS: pickMethod(host, ["fluidncWriteWCS", "writeWCS"]),
    writeInitialPositioning: pickMethod(host, ["fluidncWriteInitialPositioning", "writeInitialPositioning"]),
    writeProgramStart: pickMethod(host, ["fluidncWriteProgramStart", "writeProgramStart"]),
    writeProgramEnd: pickMethod(host, ["fluidncWriteProgramEnd", "writeProgramEnd"]),
    activateMachine: pickMethod(host, ["fluidncActivateMachine", "activateMachine"]),
    validateToolData: pickMethod(host, ["fluidncValidateToolData", "validateToolData"]),
    validateCommonParameters: pickMethod(host, ["fluidncValidateCommonParameters", "validateCommonParameters"]),
    getBodyLength: pickMethod(host, ["fluidncGetBodyLength", "getBodyLength"]),
    forceFeed: pickMethod(host, ["fluidncForceFeed", "forceFeed"]),
    forceXYZ: pickMethod(host, ["fluidncForceXYZ", "forceXYZ"]),
    forceABC: pickMethod(host, ["fluidncForceABC", "forceABC"]),
    forceAny: pickMethod(host, ["fluidncForceAny", "forceAny"]),
    forceModals: pickMethod(host, ["fluidncForceModals", "forceModals"]),
    forceCircular: pickMethod(host, ["fluidncForceCircular", "forceCircular"]),
    getForwardDirection: pickMethod(host, ["fluidncGetForwardDirection", "getForwardDirection"]),
    getRetractParameters: pickMethod(host, ["fluidncGetRetractParameters", "getRetractParameters"]),
    subprogramsAreSupported: pickMethod(host, ["fluidncSubprogramsAreSupported", "subprogramsAreSupported"]),
    machineSimulation: pickMethod(host, ["fluidncMachineSimulation", "machineSimulation"]),
    defineMachine: pickMethod(host, ["fluidncDefineMachine", "defineMachine"]),
    defineWorkPlane: pickMethod(host, ["fluidncDefineWorkPlane", "defineWorkPlane"]),
    isTCPSupportedByOperation: pickMethod(host, ["fluidncIsTCPSupportedByOperation", "isTCPSupportedByOperation"]),
    getWorkPlaneMachineABC: pickMethod(host, ["fluidncGetWorkPlaneMachineABC", "getWorkPlaneMachineABC"]),
    positionABC: pickMethod(host, ["fluidncPositionABC", "positionABC"]),
    forceWorkPlane: pickMethod(host, ["fluidncForceWorkPlane", "forceWorkPlane"]),
    cancelWCSRotation: pickMethod(host, ["fluidncCancelWCSRotation", "cancelWCSRotation"]),
    cancelWorkPlane: pickMethod(host, ["fluidncCancelWorkPlane", "cancelWorkPlane"]),
    setWorkPlane: pickMethod(host, ["fluidncSetWorkPlane", "setWorkPlane"]),
    getOffsetCode: pickMethod(host, ["fluidncGetOffsetCode", "getOffsetCode"]),
    hasRepoSurface: typeof host.fluidncWriteBlock == "function"
  };
}
