description = "FluidNC";
vendor = "FluidNC";
vendorUrl = "https://github.com/bdring/FluidNC/wiki";
longDescription = "Repository-authored FluidNC post for 3-axis Fusion milling workflows. It focuses on safe restarts, split outputs, manual tool changes, and planner-aware segment filtering.";
certificationLevel = 2;
legal = "Copyright (C) 2026 Lyle Lohman. Repository-authored rewrite; see upstream notes for Autodesk provenance.";
minimumRevision = 45917;

extension = "nc";
setCodePage("ascii");

capabilities = CAPABILITY_MILLING | CAPABILITY_MACHINE_SIMULATION;
tolerance = spatial(0.002, MM);
minimumChordLength = spatial(0.1, MM);
minimumCircularRadius = spatial(0.01, MM);
maximumCircularRadius = spatial(1000, MM);
minimumCircularSweep = toRad(0.01);
maximumCircularSweep = toRad(180);
allowHelicalMoves = true;
allowedCircularPlanes = undefined;
highFeedrate = unit == MM ? 5000 : 200;

properties = {
  safePositionMethod: {
    title: "Safe Retracts",
    description: "Use machine Z0 or the section clearance height when retracting between restart-sensitive boundaries.",
    group: "homePositions",
    type: "enum",
    values: [
      { title: "G53", id: "G53" },
      { title: "Clearance Height", id: "clearanceHeight" }
    ],
    value: "G53",
    scope: "post"
  },
  showSequenceNumbers: {
    title: "Use sequence numbers",
    description: "Output block numbers on every line, only on tool-change lines, or never.",
    group: "formats",
    type: "enum",
    values: [
      { title: "Yes", id: "true" },
      { title: "No", id: "false" },
      { title: "Only on tool change", id: "toolChange" }
    ],
    value: "false",
    scope: "post"
  },
  sequenceNumberStart: {
    title: "Start sequence number",
    description: "First emitted block number.",
    group: "formats",
    type: "integer",
    value: 10,
    scope: "post"
  },
  sequenceNumberIncrement: {
    title: "Sequence number increment",
    description: "Amount added for each emitted block number.",
    group: "formats",
    type: "integer",
    value: 1,
    scope: "post"
  },
  separateWordsWithSpace: {
    title: "Separate words with space",
    description: "Insert spaces between G-code words.",
    group: "formats",
    type: "boolean",
    value: true,
    scope: "post"
  },
  useToolCall: {
    title: "Output tool number",
    description: "Emit T words before each tool-managed section.",
    group: "preferences",
    type: "boolean",
    value: true,
    scope: "post"
  },
  useM06: {
    title: "Output M6",
    description: "Emit M6 after each tool call.",
    group: "preferences",
    type: "boolean",
    value: false,
    scope: "post"
  },
  splitFile: {
    title: "Split file",
    description: "Emit one master file or split into sub-files by tool or toolpath.",
    group: "preferences",
    type: "enum",
    values: [
      { title: "No splitting", id: "none" },
      { title: "Split by tool", id: "tool" },
      { title: "Split by toolpath", id: "toolpath" }
    ],
    value: "none",
    scope: "post"
  },
  optionalStop: {
    title: "Optional stop",
    description: "Emit M1 before tool changes in single-file output.",
    group: "preferences",
    type: "boolean",
    value: true,
    scope: "post"
  },
  safeStartAllOperations: {
    title: "Safe start all operations",
    description: "Restate restart-sensitive modal state at section boundaries even when the controller lacks optional block support.",
    group: "preferences",
    type: "boolean",
    value: false,
    scope: "post"
  },
  toolAsName: {
    title: "Tool as name",
    description: "Annotate tool changes with the tool description instead of relying on operator memory.",
    group: "preferences",
    type: "boolean",
    value: false,
    scope: "post"
  },
  useCoolant: {
    title: "Use coolant",
    description: "Allow coolant M-code output.",
    group: "preferences",
    type: "boolean",
    value: true,
    scope: "post"
  },
  spindleWarmupDelay: {
    title: "Spindle warmup delay (sec)",
    description: "Dwell after spindle start before cutting begins.",
    group: "fluidnc",
    type: "number",
    value: 3,
    scope: "post"
  },
  fluidncArcTolerance: {
    title: "FluidNC arc tolerance (mm)",
    description: "Display only. Echo this value in the output header and set firmware arc_tolerance_mm to match.",
    group: "fluidnc",
    type: "number",
    value: 0.002,
    scope: "post"
  },
  fluidncJunctionDeviation: {
    title: "FluidNC junction deviation (mm)",
    description: "Display only. Echo this value in the output header and set firmware junction_deviation_mm to match.",
    group: "fluidnc",
    type: "number",
    value: 0.01,
    scope: "post"
  },
  minimumSegmentLength: {
    title: "Min segment length (mm)",
    description: "Suppress linear moves shorter than this threshold until a later endpoint must be flushed.",
    group: "fluidnc",
    type: "number",
    value: 0.05,
    scope: "post"
  }
};

wcsDefinitions = {
  useZeroOffset: false,
  wcs: [
    { name: "Standard", format: "G", range: [54, 59] }
  ]
};

var settings = {
  coolant: {
    coolants: [
      { id: COOLANT_FLOOD },
      { id: COOLANT_MIST, on: 7, off: 9 },
      { id: COOLANT_THROUGH_TOOL },
      { id: COOLANT_AIR, on: 8, off: 9 },
      { id: COOLANT_AIR_THROUGH_TOOL },
      { id: COOLANT_SUCTION },
      { id: COOLANT_FLOOD_MIST },
      { id: COOLANT_FLOOD_THROUGH_TOOL },
      { id: COOLANT_OFF, off: 9 }
    ],
    singleLineCoolant: false
  },
  retract: {
    cancelRotationOnRetracting: false,
    methodXY: undefined,
    methodZ: "G53",
    useZeroValues: ["G28", "G30"],
    homeXY: {
      onIndexing: false,
      onToolChange: false,
      onProgramEnd: { axes: [X, Y] }
    }
  },
  machineAngles: {
    controllingAxis: "ABC",
    type: "PREFER_PREFERENCE",
    options: "ENABLE_ALL"
  },
  workPlaneMethod: {
    useTiltedWorkplane: false,
    eulerConvention: "EULER_ZXZ_R",
    eulerCalculationMethod: "standard",
    cancelTiltFirst: true,
    forceMultiAxisIndexing: false,
    optimizeType: "OPTIMIZE_AXIS"
  },
  comments: {
    permittedCommentChars: " abcdefghijklmnopqrstuvwxyz0123456789.,=_-*:()",
    prefix: "(",
    suffix: ")",
    outputFormat: "ignoreCase",
    maximumLineLength: 80,
    showSequenceNumbers: false
  },
  maximumSequenceNumber: undefined,
  maximumToolNumber: 9999,
  outputToolLengthCompensation: false,
  outputToolLengthOffset: false,
  supportsOptionalBlocks: false,
  supportsTCP: false,
  supportsRadiusCompensation: false
};

var gFormat = createFormat({ prefix: "G", decimals: 0 });
var xyzFormat = createFormat({ decimals: unit == MM ? 3 : 4 });
var feedFormat = createFormat({ decimals: unit == MM ? 1 : 2 });
var spindleFormat = createFormat({ decimals: 0 });
var secondsFormat = createFormat({ decimals: 3 });

var forceControl = typeof CONTROL_FORCE == "undefined" ? undefined : CONTROL_FORCE;
var xOutput = createOutputVariable({ prefix: "X" }, xyzFormat);
var yOutput = createOutputVariable({ prefix: "Y" }, xyzFormat);
var zOutput = createOutputVariable({ prefix: "Z" }, xyzFormat);
var feedOutput = createOutputVariable({ prefix: "F" }, feedFormat);
var spindleOutput = createOutputVariable({ prefix: "S", control: forceControl }, spindleFormat);
var iOutput = createOutputVariable({ prefix: "I", control: forceControl }, xyzFormat);
var jOutput = createOutputVariable({ prefix: "J", control: forceControl }, xyzFormat);
var kOutput = createOutputVariable({ prefix: "K", control: forceControl }, xyzFormat);

var gMotionModal = createOutputVariable({}, gFormat);
var gPlaneModal = createOutputVariable({
  onchange: function () {
    gMotionModal.reset();
  }
}, gFormat);
var gAbsIncModal = createOutputVariable({}, gFormat);
var gFeedModeModal = createOutputVariable({}, gFormat);
var gUnitModal = createOutputVariable({}, gFormat);

var runtime = createRuntimeState();

function createCachedProperties() {
  var minimumSegmentLength = Number(getProperty("minimumSegmentLength")) || 0;
  var minimumSegment = minimumSegmentLength > 0 ? spatial(minimumSegmentLength, MM) : 0;

  return {
    sequenceNumberStart: Number(getProperty("sequenceNumberStart")) || 10,
    sequenceMode: String(getProperty("showSequenceNumbers")),
    sequenceNumberIncrement: Number(getProperty("sequenceNumberIncrement")) || 1,
    splitMode: String(getProperty("splitFile")),
    safePositionMethod: String(getProperty("safePositionMethod")),
    optionalStop: Boolean(getProperty("optionalStop")),
    useCoolant: Boolean(getProperty("useCoolant")),
    spindleWarmupDelay: Number(getProperty("spindleWarmupDelay")) || 0,
    safeStartAllOperations: Boolean(getProperty("safeStartAllOperations")),
    useToolCall: Boolean(getProperty("useToolCall")),
    toolAsName: Boolean(getProperty("toolAsName")),
    useM06: Boolean(getProperty("useM06")),
    minimumSegmentLength: minimumSegmentLength,
    minimumSegmentSquared: minimumSegment * minimumSegment
  };
}

function resetRuntimeSessionFields(state, redirected) {
  state.currentPosition = undefined;
  state.lastOutputPosition = undefined;
  state.pendingLinearMove = undefined;
  state.activeWorkOffset = "";
  state.activeToolNumber = undefined;
  state.activeSpindleSpeed = undefined;
  state.pendingSpindleSpeed = undefined;
  state.spindleDirection = "";
  state.coolantCode = "";
  state.activePlane = undefined;
  state.redirected = !!redirected;
}

function createRuntimeState() {
  var props = createCachedProperties();
  var state = {
    props: props,
    sequenceNumber: props.sequenceNumberStart,
    currentSectionId: undefined,
    warnedWorkOffsets: {},
    splitCount: 0
  };
  resetRuntimeSessionFields(state, false);
  return state;
}

function resetOutputState() {
  xOutput.reset();
  yOutput.reset();
  zOutput.reset();
  feedOutput.reset();
  spindleOutput.reset();
  iOutput.reset();
  jOutput.reset();
  kOutput.reset();
  gMotionModal.reset();
  gPlaneModal.reset();
  gAbsIncModal.reset();
  gFeedModeModal.reset();
  gUnitModal.reset();
}

function resetRuntime() {
  runtime = createRuntimeState();
  resetOutputState();
}

function cleanText(text) {
  if (text === undefined || text === null) {
    return "";
  }
  return String(text)
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^\s+|\s+$/g, "");
}

function cleanFileToken(text) {
  var cleaned = cleanText(text).toLowerCase().replace(/[^a-z0-9]+/g, "_");
  cleaned = cleaned.replace(/^_+|_+$/g, "");
  return cleaned || "section";
}

function cleanProgramToken(text) {
  var cleaned = cleanText(text).toLowerCase().replace(/[^a-z0-9_-]+/g, "_");
  cleaned = cleaned.replace(/^_+|_+$/g, "");
  return cleaned || "program";
}

function fluidncFormatComment(text) {
  return cleanText(text);
}

function fluidncWriteComment(text) {
  var comment = fluidncFormatComment(text);
  if (comment) {
    writeln("(" + comment + ")");
  }
}

function trimTrailingZeros(text) {
  var trimmed = String(text).replace(/(\.\d*?[1-9])0+$/g, "$1").replace(/\.0+$/g, "");
  return trimmed.replace(/\.$/, "");
}

function formatSeconds(seconds) {
  var formatted = trimTrailingZeros(secondsFormat.format(Number(seconds)));
  return formatted.indexOf(".") === -1 ? formatted + "." : formatted;
}

function axisWord(letter, value) {
  return value === undefined || value === null ? "" : letter + xyzFormat.format(value);
}

function feedWord(feed) {
  return feed === undefined || feed === null ? "" : "F" + feedFormat.format(feed);
}

function spindleWord(speed) {
  return speed === undefined || speed === null ? "" : "S" + spindleFormat.format(speed);
}

function shouldNumberBlock(isToolChangeBlock) {
  if (runtime.props.sequenceMode == "true") {
    return true;
  }
  if (runtime.props.sequenceMode == "toolChange") {
    return !!isToolChangeBlock;
  }
  return false;
}

function nextSequenceWord() {
  var word = "N" + runtime.sequenceNumber;
  runtime.sequenceNumber += runtime.props.sequenceNumberIncrement;
  return word;
}

function filterWords(words) {
  var filtered = [];
  var index;
  for (index = 0; index < words.length; index += 1) {
    if (words[index]) {
      filtered.push(words[index]);
    }
  }
  return filtered;
}

function fluidncWriteBlock(words, isToolChangeBlock) {
  var filtered = filterWords(words);
  if (shouldNumberBlock(isToolChangeBlock)) {
    filtered.unshift(nextSequenceWord());
  }
  if (filtered.length > 0) {
    writeWords(filtered);
  }
}

function getUnitCode() {
  return unit == IN ? "G20" : "G21";
}

function getUnitCodeNumber() {
  return unit == IN ? 20 : 21;
}

function getProgramLabel() {
  return fluidncFormatComment(programName || "program");
}

function getSectionLabel(section, index) {
  var rawComment = section && typeof section.getParameter == "function" ? section.getParameter("operation-comment", "") : "";
  if (!rawComment) {
    rawComment = "section_" + String(index + 1);
  }
  return cleanFileToken(rawComment);
}

function getWorkOffsetCode(section) {
  var offset = section && section.workOffset ? Number(section.workOffset) : 1;
  if (!(offset >= 1 && offset <= 6)) {
    if (!runtime.warnedWorkOffsets[offset]) {
      runtime.warnedWorkOffsets[offset] = true;
      warning("Unsupported work offset " + String(offset) + "; using G54.");
    }
    offset = 1;
  }
  return "G" + String(53 + offset);
}

function collectToolSummaries() {
  var entries = [];
  var byToolNumber = {};
  var sectionCount = typeof getNumberOfSections == "function" ? getNumberOfSections() : 0;
  var index;

  for (index = 0; index < sectionCount; index += 1) {
    var section = getSection(index);
    var tool = section.getTool();
    var entry = byToolNumber[tool.number];
    if (!entry) {
      entry = {
        tool: tool,
        zMin: undefined
      };
      byToolNumber[tool.number] = entry;
      entries.push(entry);
    }

    if (typeof section.getGlobalZRange == "function") {
      var range = section.getGlobalZRange();
      if (range && typeof range.getMinimum == "function") {
        var minimum = range.getMinimum();
        if (entry.zMin === undefined || minimum < entry.zMin) {
          entry.zMin = minimum;
        }
      }
    }
  }

  return entries;
}

function writeToolComments() {
  var summaries = collectToolSummaries();
  var index;

  for (index = 0; index < summaries.length; index += 1) {
    var entry = summaries[index];
    var tool = entry.tool;
    var comment = "T" + String(tool.number) + " D=" + xyzFormat.format(Number(tool.diameter || 0)) + " CR=" + xyzFormat.format(Number(tool.cornerRadius || 0));
    if (entry.zMin !== undefined) {
      comment += " - ZMIN=" + xyzFormat.format(Number(entry.zMin));
    }
    var toolType = typeof getToolTypeName == "function" ? getToolTypeName(tool.type) : "";
    comment += " - " + fluidncFormatComment(toolType || tool.description || "tool");
    fluidncWriteComment(comment);
  }
}

function writeConfigComments() {
  fluidncWriteComment("FluidNC config: arc_tol=" + String(getProperty("fluidncArcTolerance")) + "mm" +
    " junc_dev=" + String(getProperty("fluidncJunctionDeviation")) + "mm" +
    " min_seg=" + String(runtime.props.minimumSegmentLength) + "mm");
  fluidncWriteComment("Ensure firmware arc_tolerance_mm and junction_deviation_mm match these values");
}

function fluidncWriteProgramHeader() {
  fluidncWriteComment(getProgramLabel());
  writeToolComments();
  writeln("");
  writeConfigComments();
}

function writeWorkOffset(section, forceOutput) {
  var code = getWorkOffsetCode(section);
  if (forceOutput || runtime.activeWorkOffset != code) {
    runtime.activeWorkOffset = code;
    fluidncWriteBlock([code], false);
  } else {
    runtime.activeWorkOffset = code;
  }
}

function getClearanceHeight(section) {
  var sectionHeight;
  var runtimeHeight;
  if (section && typeof section.getInitialPosition == "function") {
    var position = section.getInitialPosition();
    if (position && position.z !== undefined) {
      sectionHeight = position.z;
    }
  }
  if (runtime.currentPosition && runtime.currentPosition.z !== undefined) {
    runtimeHeight = runtime.currentPosition.z;
  }
  if (sectionHeight === undefined) {
    return runtimeHeight;
  }
  if (runtimeHeight === undefined) {
    return sectionHeight;
  }
  return Math.max(sectionHeight, runtimeHeight);
}

function writeSafeRetract(section) {
  if (runtime.props.safePositionMethod == "clearanceHeight") {
    var clearanceHeight = getClearanceHeight(section);
    if (clearanceHeight !== undefined) {
      fluidncWriteBlock(["G0", axisWord("Z", clearanceHeight)], false);
    }
    return;
  }
  fluidncWriteBlock(["G53", "G0", "Z0"], false);
}

function setCurrentPosition(x, y, z) {
  var base = runtime.currentPosition;
  if (!base) {
    base = getCurrentPosition();
    runtime.currentPosition = {
      x: base && base.x !== undefined ? base.x : 0,
      y: base && base.y !== undefined ? base.y : 0,
      z: base && base.z !== undefined ? base.z : 0
    };
    base = runtime.currentPosition;
  }
  if (x !== undefined) {
    base.x = x;
  }
  if (y !== undefined) {
    base.y = y;
  }
  if (z !== undefined) {
    base.z = z;
  }
  return base;
}

function rememberOutputPosition(x, y, z) {
  var current = setCurrentPosition(x, y, z);
  var last = runtime.lastOutputPosition;
  if (!last) {
    runtime.lastOutputPosition = {
      x: current.x,
      y: current.y,
      z: current.z
    };
    return;
  }
  last.x = current.x;
  last.y = current.y;
  last.z = current.z;
}

function stopCoolant() {
  if (runtime.coolantCode) {
    fluidncWriteBlock(["M9"], false);
    runtime.coolantCode = "";
  }
}

function coolantCodeForSection(section) {
  if (!runtime.props.useCoolant) {
    return "";
  }

  var coolant = section && section.getTool ? section.getTool().coolant : undefined;
  switch (coolant) {
  case COOLANT_MIST:
    return "M7";
  case COOLANT_AIR:
  case COOLANT_THROUGH_TOOL:
  case COOLANT_AIR_THROUGH_TOOL:
    return "M8";
  default:
    return "";
  }
}

function startCoolant(section) {
  var code = coolantCodeForSection(section);
  if (!code) {
    stopCoolant();
    return;
  }
  if (runtime.coolantCode == code) {
    return;
  }
  stopCoolant();
  fluidncWriteBlock([code], false);
  runtime.coolantCode = code;
}

function stopSpindle() {
  if (runtime.spindleDirection) {
    fluidncWriteBlock(["M5"], false);
    runtime.spindleDirection = "";
  }
}

function resolveSpindle(section) {
  var tool = section.getTool();
  return {
    speed: runtime.pendingSpindleSpeed !== undefined ? runtime.pendingSpindleSpeed : Number(tool.spindleRPM || 0),
    direction: tool.clockwise === false ? "M4" : "M3"
  };
}

function shouldStartSpindle(section, forceStart, spindle) {
  var nextSpindle = spindle || resolveSpindle(section);
  return Boolean(forceStart) ||
    !runtime.spindleDirection ||
    runtime.activeSpindleSpeed !== nextSpindle.speed ||
    runtime.spindleDirection !== nextSpindle.direction;
}

function fluidncStartSpindle(section, forceStart) {
  var spindle = resolveSpindle(section);

  if (!shouldStartSpindle(section, forceStart, spindle)) {
    runtime.activeSpindleSpeed = spindle.speed;
    runtime.pendingSpindleSpeed = undefined;
    return false;
  }

  fluidncWriteBlock([spindleWord(spindle.speed), spindle.direction], true);
  runtime.activeSpindleSpeed = spindle.speed;
  runtime.pendingSpindleSpeed = undefined;
  runtime.spindleDirection = spindle.direction;

  if (runtime.props.spindleWarmupDelay > 0) {
    fluidncWriteBlock(["G4", "P" + formatSeconds(runtime.props.spindleWarmupDelay)], false);
  }
  return true;
}

function fluidncWriteToolCall(tool, announceChange) {
  if (runtime.props.useToolCall) {
    if (runtime.props.toolAsName && tool.description) {
      fluidncWriteComment("TOOL " + fluidncFormatComment(tool.description));
    } else {
      fluidncWriteBlock(["T" + String(tool.number)], true);
    }
  }
  if (announceChange) {
    fluidncWriteComment("CHANGE TO T" + String(tool.number));
  }
  if (runtime.props.useM06) {
    fluidncWriteBlock(["M6"], true);
  }
  runtime.activeToolNumber = tool.number;
  fluidncForceModals();
}

function buildSplitFileName(section) {
  runtime.splitCount += 1;
  var baseName = cleanProgramToken(programName || "program");
  var tool = section.getTool();
  if (runtime.props.splitMode == "toolpath") {
    return baseName + "_" + String(runtime.splitCount) + "_" + getSectionLabel(section, runtime.splitCount - 1) + "_T" + String(tool.number);
  }
  return baseName + "_" + String(runtime.splitCount) + "_T" + String(tool.number);
}

function openSplitOutput(section) {
  var subprogram = buildSplitFileName(section);
  var folder = FileSystem.getFolderPath(getOutputPath());
  var filePath = FileSystem.getCombinedPath(folder, subprogram + "." + extension);

  fluidncWriteComment("Load tool number " + String(section.getTool().number) + " and subprogram " + subprogram);
  redirectToFile(filePath);

  resetRuntimeSessionFields(runtime, true);
  resetOutputState();

  fluidncWriteComment(getProgramLabel());
  fluidncWriteProgramStart();
  writeToolComments();
  writeln("");
  writeConfigComments();
  writeWorkOffset(section, true);
  writeSafeRetract(section);
}

function closeSplitOutput() {
  if (!runtime.redirected) {
    return;
  }
  stopCoolant();
  writeSafeRetract(currentSection);
  fluidncWriteBlock(["G53", "G0", "X0", "Y0"], false);
  fluidncWriteBlock(["M5"], false);
  runtime.spindleDirection = "";
  fluidncWriteBlock(["M30"], false);
  closeRedirection();

  resetRuntimeSessionFields(runtime, false);
}

function distanceSquaredTo(anchor, x, y, z) {
  var dx = x - anchor.x;
  var dy = y - anchor.y;
  var dz = z - anchor.z;
  return dx * dx + dy * dy + dz * dz;
}

function shouldFilterLinearMove(x, y, z) {
  if (!(runtime.props.minimumSegmentSquared > 0)) {
    return false;
  }

  var anchor = runtime.lastOutputPosition || runtime.currentPosition || getCurrentPosition();
  if (!anchor) {
    return false;
  }

  var measuredDistance = distanceSquaredTo(anchor, x, y, z);

  return measuredDistance > 0 && measuredDistance < runtime.props.minimumSegmentSquared;
}

function emitLinearMove(x, y, z, feed) {
  var xWord = xOutput.format(x);
  var yWord = yOutput.format(y);
  var zWord = zOutput.format(z);
  var fWord = feedOutput.format(feed);

  if (xWord || yWord || zWord) {
    fluidncWriteBlock([gMotionModal.format(1), xWord, yWord, zWord, fWord], false);
    rememberOutputPosition(x, y, z);
  } else if (fWord) {
    fluidncWriteBlock([gMotionModal.format(1), fWord], false);
  }
}

function flushPendingLinearMove() {
  if (!runtime.pendingLinearMove) {
    return;
  }
  var pending = runtime.pendingLinearMove;
  runtime.pendingLinearMove = undefined;
  emitLinearMove(pending.x, pending.y, pending.z, pending.feed);
}

function writeSectionStart(section) {
  var splitMode = runtime.props.splitMode;
  var tool = section.getTool();
  var toolChange = runtime.activeToolNumber !== tool.number;
  var forceWorkOffset = toolChange || runtime.activeWorkOffset !== getWorkOffsetCode(section);
  var laterSection = typeof isFirstSection == "function" ? !isFirstSection() : runtime.activeToolNumber !== undefined;
  var needsBoundaryRetract = splitMode == "none" && toolChange;
  var needsSectionSpacer = splitMode == "none" && (toolChange || laterSection);
  var redirectedAtStart = runtime.redirected;

  fluidncWriteBlock(["G90", "G94", getUnitCode(), "G17"], false);
  gAbsIncModal.format(90);
  gFeedModeModal.format(94);
  gUnitModal.format(getUnitCodeNumber());
  gPlaneModal.format(17);
  runtime.activePlane = 17;

  if (splitMode != "none") {
    if (runtime.redirected) {
      stopCoolant();
      stopSpindle();
      writeln("");
      closeSplitOutput();
    }
    if (!redirectedAtStart) {
      writeln("");
    }
    openSplitOutput(section);
    toolChange = true;
    forceWorkOffset = true;
  } else if (toolChange && laterSection) {
    stopSpindle();
  }

  if (needsBoundaryRetract) {
    writeSafeRetract(section);
  }
  if (needsSectionSpacer) {
    writeln("");
  }
  fluidncWriteComment(getSectionLabel(section, runtime.splitCount || 0));

  if (splitMode != "none" && toolChange && !laterSection) {
    writeSafeRetract(section);
  }

  if (toolChange && laterSection && runtime.props.optionalStop) {
    fluidncWriteBlock(["M1"], true);
  }

  if (toolChange || runtime.activeToolNumber === undefined) {
    fluidncWriteToolCall(tool, toolChange && laterSection);
  }

  fluidncStartSpindle(section, toolChange || splitMode != "none");
  if (toolChange || splitMode != "none") {
    fluidncWriteBlock([gPlaneModal.format(17), gAbsIncModal.format(90), gFeedModeModal.format(94)], false);
    runtime.activePlane = 17;
  }
  writeWorkOffset(section, forceWorkOffset);
  startCoolant(section);
  if (section && typeof section.getInitialPosition == "function") {
    fluidncWriteInitialPositioning(section.getInitialPosition(), toolChange || splitMode != "none");
  }
}

function fluidncWriteInitialPositioning(position, isRequired) {
  if (position) {
    var requiresFullStart = isRequired === undefined ? true : !!isRequired;
    var safeStartRequiresFallback = !requiresFullStart && runtime.props.safeStartAllOperations;
    fluidncForceModals(gAbsIncModal, gMotionModal);
    fluidncWriteBlock(["G53", "G0", "Z0"], false);
    fluidncWriteBlock([gAbsIncModal.format(90), gPlaneModal.format(17), gMotionModal.format(0), xOutput.format(position.x), yOutput.format(position.y)], false);
    rememberOutputPosition(position.x, position.y, runtime.currentPosition && runtime.currentPosition.z);
    if (position.z !== undefined && position.z !== null) {
      fluidncWriteBlock([gMotionModal.format(0), zOutput.format(position.z)], false);
      rememberOutputPosition(position.x, position.y, position.z);
    }
    runtime.activePlane = 17;
    if (requiresFullStart || safeStartRequiresFallback) {
      fluidncForceModals(gMotionModal);
      fluidncForceFeed();
    }
  }
}

function finishMainProgram() {
  stopCoolant();
  writeSafeRetract(currentSection || (typeof getNumberOfSections == "function" && getNumberOfSections() > 0 ? getSection(getNumberOfSections() - 1) : undefined));
  fluidncWriteBlock(["G53", "G0", "X0", "Y0"], false);
  stopSpindle();
  fluidncWriteBlock(["M30"], false);
}

function fluidncWriteProgramStart() {
  fluidncForceModals();
  gUnitModal.reset();
  fluidncWriteBlock([gAbsIncModal.format(90), gFeedModeModal.format(94)], false);
  fluidncWriteBlock([gPlaneModal.format(17)], false);
  fluidncWriteBlock([gUnitModal.format(getUnitCodeNumber())], false);
  gAbsIncModal.format(90);
  gFeedModeModal.format(94);
  gUnitModal.format(getUnitCodeNumber());
  gPlaneModal.format(17);
  runtime.activePlane = 17;
}

function fluidncForceFeed() {
  feedOutput.reset();
  return true;
}

function fluidncForceXYZ() {
  xOutput.reset();
  yOutput.reset();
  zOutput.reset();
  return true;
}

function fluidncForceAny() {
  fluidncForceXYZ();
  fluidncForceFeed();
  return true;
}

function fluidncForceModals() {
  if (arguments.length === 0) {
    gMotionModal.reset();
    gPlaneModal.reset();
    gAbsIncModal.reset();
    gFeedModeModal.reset();
    feedOutput.reset();
  } else {
    var index;
    for (index = 0; index < arguments.length; index += 1) {
      if (arguments[index] && typeof arguments[index].reset == "function") {
        arguments[index].reset();
      }
    }
  }
  return true;
}

function fluidncForceCircular(plane) {
  if (plane == PLANE_XY) {
    xOutput.reset();
    yOutput.reset();
    iOutput.reset();
    jOutput.reset();
  } else if (plane == PLANE_ZX) {
    zOutput.reset();
    xOutput.reset();
    kOutput.reset();
    iOutput.reset();
  } else if (plane == PLANE_YZ) {
    yOutput.reset();
    zOutput.reset();
    jOutput.reset();
    kOutput.reset();
  }
  return plane;
}

function fluidncOnMoveToSafeRetractPosition() {
  writeSafeRetract(currentSection);
}

function fluidncOnRotateAxes(x, y, z) {
  fluidncOnRapid(x, y, z);
}

function fluidncOnReturnFromSafeRetractPosition(x, y, z) {
  fluidncOnRapid(x, y, z);
}

function fluidncOnOpen() {
  resetRuntime();
  fluidncWriteProgramHeader();

  if (runtime.props.splitMode == "none") {
    var firstSection = typeof getNumberOfSections == "function" && getNumberOfSections() > 0 ? getSection(0) : currentSection;
    fluidncWriteBlock(["G90", getUnitCode(), "G17"], false);
    writeWorkOffset(firstSection, true);
    writeSafeRetract(firstSection);
    fluidncWriteProgramStart();
  } else {
    fluidncWriteComment("***THIS FILE DOES NOT CONTAIN NC CODE***");
  }
}

function fluidncOnSection() {
  writeSectionStart(currentSection);
}

function fluidncOnDwell(seconds) {
  if (Number(seconds) > 0) {
    fluidncWriteBlock(["G4", "P" + formatSeconds(Number(seconds))], false);
  }
}

function fluidncOnSpindleSpeed(spindleSpeed) {
  var nextSpeed = Number(spindleSpeed);
  runtime.pendingSpindleSpeed = nextSpeed;
  if (runtime.spindleDirection && nextSpeed !== runtime.activeSpindleSpeed) {
    runtime.activeSpindleSpeed = nextSpeed;
    fluidncWriteBlock([spindleWord(runtime.activeSpindleSpeed)], false);
  }
}

function fluidncOnCircular(clockwise, cx, cy, cz, x, y, z, feed) {
  flushPendingLinearMove();

  var start = runtime.currentPosition || getCurrentPosition();
  var plane = getCircularPlane();
  var words;
  var fullCircle = typeof isFullCircle == "function" ? isFullCircle() : false;

  if (fullCircle) {
    if (isHelical && isHelical()) {
      linearize(tolerance);
      return;
    }
    fluidncForceCircular(plane);
    if (plane == PLANE_XY) {
      words = [gPlaneModal.format(17), gMotionModal.format(clockwise ? 2 : 3), xOutput.format(x), iOutput.format(cx - start.x), jOutput.format(cy - start.y), feedOutput.format(feed)];
    } else if (plane == PLANE_ZX) {
      words = [gPlaneModal.format(18), gMotionModal.format(clockwise ? 2 : 3), zOutput.format(z), iOutput.format(cx - start.x), kOutput.format(cz - start.z), feedOutput.format(feed)];
    } else if (plane == PLANE_YZ) {
      words = [gPlaneModal.format(19), gMotionModal.format(clockwise ? 2 : 3), yOutput.format(y), jOutput.format(cy - start.y), kOutput.format(cz - start.z), feedOutput.format(feed)];
    } else {
      linearize(tolerance);
      return;
    }
  } else if (plane == PLANE_XY) {
    fluidncForceCircular(plane);
    words = [gPlaneModal.format(17), gMotionModal.format(clockwise ? 2 : 3), xOutput.format(x), yOutput.format(y), zOutput.format(z), iOutput.format(cx - start.x), jOutput.format(cy - start.y), feedOutput.format(feed)];
  } else if (plane == PLANE_ZX) {
    fluidncForceCircular(plane);
    words = [gPlaneModal.format(18), gMotionModal.format(clockwise ? 2 : 3), xOutput.format(x), yOutput.format(y), zOutput.format(z), iOutput.format(cx - start.x), kOutput.format(cz - start.z), feedOutput.format(feed)];
  } else if (plane == PLANE_YZ) {
    fluidncForceCircular(plane);
    words = [gPlaneModal.format(19), gMotionModal.format(clockwise ? 2 : 3), xOutput.format(x), yOutput.format(y), zOutput.format(z), jOutput.format(cy - start.y), kOutput.format(cz - start.z), feedOutput.format(feed)];
  } else {
    linearize(tolerance);
    return;
  }

  fluidncWriteBlock(words, false);
  if (plane == PLANE_ZX) {
    runtime.activePlane = 18;
  } else if (plane == PLANE_YZ) {
    runtime.activePlane = 19;
  } else {
    runtime.activePlane = 17;
  }
  rememberOutputPosition(x, y, z);
}

function fluidncOnCommand(command) {
  switch (command) {
  case COMMAND_COOLANT_OFF:
    stopCoolant();
    break;
  case COMMAND_STOP_SPINDLE:
    stopSpindle();
    break;
  case COMMAND_START_SPINDLE:
    fluidncStartSpindle(currentSection, true);
    break;
  case COMMAND_OPTIONAL_STOP:
    fluidncWriteBlock(["M1"], true);
    break;
  case COMMAND_STOP:
    fluidncWriteBlock(["M0"], true);
    break;
  case COMMAND_END:
    fluidncWriteBlock(["M30"], false);
    break;
  case COMMAND_LOAD_TOOL:
    fluidncWriteToolCall(currentSection.getTool(), true);
    break;
  default:
    warning("Unsupported command: " + String(command));
  }
}

function fluidncOnSectionEnd() {
  flushPendingLinearMove();
  if (runtime.activePlane !== 17) {
    fluidncWriteBlock(["G17"], false);
    runtime.activePlane = 17;
  }
  if (typeof isLastSection == "function" ? !isLastSection() : true) {
    var nextSection = typeof getNextSection == "function" ? getNextSection() : undefined;
    // When the next section uses the same coolant, leave runtime.coolantCode intact so startCoolant() can skip a redundant M7/M8.
    if (nextSection && nextSection.getTool && currentSection && currentSection.getTool &&
      nextSection.getTool().coolant !== currentSection.getTool().coolant) {
      stopCoolant();
    }
  }
  fluidncForceAny();
}

function fluidncOnClose() {
  if (runtime.props.splitMode == "none") {
    writeln("");
    finishMainProgram();
  } else if (runtime.redirected) {
    writeln("");
    closeSplitOutput();
  }
}

function fluidncOnComment(text) {
  fluidncWriteComment(text);
}

function fluidncOnPassThrough(text) {
  if (text) {
    writeln(String(text));
  }
}

function fluidncOnRapid(x, y, z) {
  flushPendingLinearMove();
  var xWord = xOutput.format(x);
  var yWord = yOutput.format(y);
  var zWord = zOutput.format(z);
  if (xWord || yWord || zWord) {
    fluidncWriteBlock([gMotionModal.format(0), xWord, yWord, zWord], false);
    rememberOutputPosition(x, y, z);
    fluidncForceFeed();
  }
}

function fluidncOnLinear(x, y, z, feed) {
  if (shouldFilterLinearMove(x, y, z)) {
    runtime.pendingLinearMove = {
      x: x,
      y: y,
      z: z,
      feed: feed
    };
    return;
  }

  runtime.pendingLinearMove = undefined;
  emitLinearMove(x, y, z, feed);
}

function fluidncOnRapid5D() {
  error("This post only supports 3-axis motion.");
}

function fluidncOnLinear5D() {
  error("This post only supports 3-axis motion.");
}

function fluidncOnRadiusCompensation() {
  error("Radius compensation is not supported by this post.");
}

var onMoveToSafeRetractPosition = fluidncOnMoveToSafeRetractPosition;
var onRotateAxes = fluidncOnRotateAxes;
var onReturnFromSafeRetractPosition = fluidncOnReturnFromSafeRetractPosition;
var onOpen = fluidncOnOpen;
var onSection = fluidncOnSection;
var onDwell = fluidncOnDwell;
var onSpindleSpeed = fluidncOnSpindleSpeed;
var onCircular = fluidncOnCircular;
var onCommand = fluidncOnCommand;
var onSectionEnd = fluidncOnSectionEnd;
var onClose = fluidncOnClose;
var onComment = fluidncOnComment;
var onPassThrough = fluidncOnPassThrough;
var onRapid = fluidncOnRapid;
var onLinear = fluidncOnLinear;
var onRapid5D = fluidncOnRapid5D;
var onLinear5D = fluidncOnLinear5D;
var onRadiusCompensation = fluidncOnRadiusCompensation;
