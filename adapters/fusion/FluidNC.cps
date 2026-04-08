description = "FluidNC";
vendor = "FluidNC";
vendorUrl = "https://github.com/bdring/FluidNC/wiki";
longDescription = "Repository-authored FluidNC post for 3-axis Fusion milling workflows. It focuses on safe restarts, split outputs, manual tool changes, and planner-aware segment filtering.";
certificationLevel = 2;
legal = "Copyright (C) 2012-2026 by Autodesk, Inc.";
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
    description: "Kept for compatibility. This post always restates restart-sensitive modal state at section boundaries.",
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
  useG95: {
    title: "Use feed per revolution (G95)",
    description: "Compatibility property retained for the original post surface.",
    group: "preferences",
    type: "boolean",
    value: false,
    scope: "post"
  },
  useDPMFeeds: {
    title: "Use DPM feeds",
    description: "Compatibility property retained for the original post surface.",
    group: "preferences",
    type: "boolean",
    value: false,
    scope: "post"
  },
  useTiltedWorkplane: {
    title: "Use tilted workplane",
    description: "Compatibility property retained for the original post surface.",
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
    description: "Reference value echoed in the output header.",
    group: "fluidnc",
    type: "number",
    value: 0.002,
    scope: "post"
  },
  fluidncJunctionDeviation: {
    title: "FluidNC junction deviation (mm)",
    description: "Reference value echoed in the output header.",
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

function createRuntimeState() {
  return {
    sequenceNumber: Number(getProperty("sequenceNumberStart")) || 10,
    currentSectionId: undefined,
    currentPosition: undefined,
    lastOutputPosition: undefined,
    pendingLinearMove: undefined,
    activeWorkOffset: "",
    activeToolNumber: undefined,
    activeSpindleSpeed: undefined,
    pendingSpindleSpeed: undefined,
    spindleDirection: "",
    coolantCode: "",
    activePlane: undefined,
    redirected: false,
    splitCount: 0
  };
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
  var mode = String(getProperty("showSequenceNumbers"));
  if (mode == "true") {
    return true;
  }
  if (mode == "toolChange") {
    return !!isToolChangeBlock;
  }
  return false;
}

function nextSequenceWord() {
  var word = "N" + runtime.sequenceNumber;
  runtime.sequenceNumber += Number(getProperty("sequenceNumberIncrement")) || 1;
  return word;
}

function flattenWords(words) {
  var flattened = [];
  var index;
  for (index = 0; index < words.length; index += 1) {
    if (words[index] instanceof Array) {
      flattened = flattened.concat(flattenWords(words[index]));
    } else if (words[index]) {
      flattened.push(words[index]);
    }
  }
  return flattened;
}

function fluidncWriteBlock(words, isToolChangeBlock) {
  var filtered = flattenWords(words);
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
  return formatComment(programName || "program");
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
    comment += " - " + formatComment(toolType || tool.description || "tool");
    writeComment(comment);
  }
}

function writeConfigComments() {
  writeComment("FluidNC config: arc_tol=" + String(getProperty("fluidncArcTolerance")) + "mm" +
    " junc_dev=" + String(getProperty("fluidncJunctionDeviation")) + "mm" +
    " min_seg=" + String(getProperty("minimumSegmentLength")) + "mm");
  writeComment("Ensure firmware arc_tolerance_mm and junction_deviation_mm match these values");
}

function fluidncWriteProgramHeader() {
  fluidncWriteComment(getProgramLabel());
  writeToolComments();
  writeln("");
  writeConfigComments();
}

function fluidncGetSetting(setting, defaultValue) {
  if (!setting) {
    return defaultValue;
  }

  var parts = String(setting).split(".");
  var current = settings;
  var index;

  for (index = 0; index < parts.length; index += 1) {
    if (current === undefined || current === null || current[parts[index]] === undefined) {
      return defaultValue;
    }
    current = current[parts[index]];
  }

  return current;
}

function writeModalReset() {
  writeBlock(["G90", "G94", getUnitCode(), "G17"], false);
}

function writeWorkOffset(section, forceOutput) {
  var code = getWorkOffsetCode(section);
  if (forceOutput || runtime.activeWorkOffset != code) {
    runtime.activeWorkOffset = code;
    writeBlock([code], false);
  } else {
    runtime.activeWorkOffset = code;
  }
}

function getClearanceHeight(section) {
  if (section && typeof section.getInitialPosition == "function") {
    var position = section.getInitialPosition();
    if (position && position.z !== undefined) {
      return position.z;
    }
  }
  if (runtime.currentPosition && runtime.currentPosition.z !== undefined) {
    return runtime.currentPosition.z;
  }
  return undefined;
}

function writeSafeRetract(section) {
  if (String(getProperty("safePositionMethod")) == "clearanceHeight") {
    var clearanceHeight = getClearanceHeight(section);
    if (clearanceHeight !== undefined) {
      writeBlock(["G0", axisWord("Z", clearanceHeight)], false);
    }
    return;
  }
  writeBlock(["G53", "G0", "Z0"], false);
}

function fluidncWriteRetract() {
  writeSafeRetract(currentSection);
}

function setCurrentPosition(x, y, z) {
  var base = runtime.currentPosition || getCurrentPosition();
  runtime.currentPosition = {
    x: x === undefined ? base.x : x,
    y: y === undefined ? base.y : y,
    z: z === undefined ? base.z : z
  };
}

function rememberOutputPosition(x, y, z) {
  setCurrentPosition(x, y, z);
  runtime.lastOutputPosition = {
    x: runtime.currentPosition.x,
    y: runtime.currentPosition.y,
    z: runtime.currentPosition.z
  };
}

function stopCoolant() {
  if (runtime.coolantCode) {
    writeBlock(["M9"], false);
    runtime.coolantCode = "";
  }
}

function fluidncGetCoolantCodes(coolant) {
  if (coolant == COOLANT_OFF) {
    return ["M9"];
  }
  var code = coolantCodeForSection({
    getTool: function () {
      return { coolant: coolant };
    }
  });
  return code ? [code] : [];
}

function coolantCodeForSection(section) {
  if (!getProperty("useCoolant")) {
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
  writeBlock([code], false);
  runtime.coolantCode = code;
}

function fluidncSetCoolant(coolant) {
  if (coolant == COOLANT_OFF) {
    stopCoolant();
    return fluidncGetCoolantCodes(coolant);
  }

  startCoolant({
    getTool: function () {
      return { coolant: coolant };
    }
  });
  return fluidncGetCoolantCodes(coolant);
}

function stopSpindle() {
  if (runtime.spindleDirection) {
    writeBlock(["M5"], false);
    runtime.spindleDirection = "";
  }
}

function shouldStartSpindle(section, forceStart) {
  var tool = section.getTool();
  var speed = runtime.pendingSpindleSpeed !== undefined ? runtime.pendingSpindleSpeed : Number(tool.spindleRPM || 0);
  var direction = tool.clockwise === false ? "M4" : "M3";

  return Boolean(forceStart) ||
    !runtime.spindleDirection ||
    runtime.activeSpindleSpeed !== speed ||
    runtime.spindleDirection !== direction;
}

function fluidncStartSpindle(section, forceStart) {
  var tool = section.getTool();
  var speed = runtime.pendingSpindleSpeed !== undefined ? runtime.pendingSpindleSpeed : Number(tool.spindleRPM || 0);
  var direction = tool.clockwise === false ? "M4" : "M3";

  if (!shouldStartSpindle(section, forceStart)) {
    runtime.activeSpindleSpeed = speed;
    runtime.pendingSpindleSpeed = undefined;
    return false;
  }

  writeBlock([spindleWord(speed), direction], true);
  runtime.activeSpindleSpeed = speed;
  runtime.pendingSpindleSpeed = undefined;
  runtime.spindleDirection = direction;

  if (Number(getProperty("spindleWarmupDelay")) > 0) {
    writeBlock(["G4", "P" + formatSeconds(Number(getProperty("spindleWarmupDelay")))], false);
  }
  return true;
}

function fluidncGetFeed(feed) {
  return feedWord(feed);
}

function fluidncWriteToolCall(tool, announceChange) {
  if (getProperty("useToolCall")) {
    if (getProperty("toolAsName") && tool.description) {
      fluidncWriteComment("TOOL " + fluidncFormatComment(tool.description));
    } else {
      fluidncWriteBlock(["T" + String(tool.number)], true);
    }
  }
  if (announceChange) {
    fluidncWriteComment("CHANGE TO T" + String(tool.number));
  }
  if (getProperty("useM06")) {
    fluidncWriteBlock(["M6"], true);
  }
  runtime.activeToolNumber = tool.number;
  forceModals();
}

function fluidncWriteToolBlock() {
  fluidncWriteBlock(Array.prototype.slice.call(arguments), true);
}

function buildSplitFileName(section) {
  runtime.splitCount += 1;
  var baseName = cleanProgramToken(programName || "program");
  var tool = section.getTool();
  if (String(getProperty("splitFile")) == "toolpath") {
    return baseName + "_" + String(runtime.splitCount) + "_" + getSectionLabel(section, runtime.splitCount - 1) + "_T" + String(tool.number);
  }
  return baseName + "_" + String(runtime.splitCount) + "_T" + String(tool.number);
}

function openSplitOutput(section) {
  var subprogram = buildSplitFileName(section);
  var folder = FileSystem.getFolderPath(getOutputPath());
  var filePath = FileSystem.getCombinedPath(folder, subprogram + "." + extension);

  writeComment("Load tool number " + String(section.getTool().number) + " and subprogram " + subprogram);
  redirectToFile(filePath);

  runtime.redirected = true;
  runtime.activeWorkOffset = "";
  runtime.activeToolNumber = undefined;
  runtime.activeSpindleSpeed = undefined;
  runtime.pendingSpindleSpeed = undefined;
  runtime.spindleDirection = "";
  runtime.coolantCode = "";
  runtime.pendingLinearMove = undefined;
  runtime.lastOutputPosition = undefined;
  runtime.currentPosition = undefined;
  resetOutputState();

  writeComment(getProgramLabel());
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
  writeBlock(["G53", "G0", "X0", "Y0"], false);
  writeBlock(["M5"], false);
  runtime.spindleDirection = "";
  writeBlock(["M30"], false);
  closeRedirection();

  runtime.redirected = false;
  runtime.activeWorkOffset = "";
  runtime.activeToolNumber = undefined;
  runtime.activeSpindleSpeed = undefined;
  runtime.pendingSpindleSpeed = undefined;
  runtime.spindleDirection = "";
  runtime.coolantCode = "";
  runtime.pendingLinearMove = undefined;
  runtime.lastOutputPosition = undefined;
  runtime.currentPosition = undefined;
}

function distanceSquared(fromPosition, toPosition) {
  var dx = toPosition.x - fromPosition.x;
  var dy = toPosition.y - fromPosition.y;
  var dz = toPosition.z - fromPosition.z;
  return dx * dx + dy * dy + dz * dz;
}

function fluidncFlushPendingLinearMove() {
  flushPendingLinearMove();
}

function shouldFilterLinearMove(x, y, z) {
  var threshold = Number(getProperty("minimumSegmentLength"));
  if (!(threshold > 0)) {
    return false;
  }

  var anchor = runtime.lastOutputPosition || runtime.currentPosition || getCurrentPosition();
  if (!anchor) {
    return false;
  }

  var move = { x: x, y: y, z: z };
  var minDistance = spatial(threshold, MM);
  var minDistanceSquared = minDistance * minDistance;
  var measuredDistance = distanceSquared(anchor, move);

  return measuredDistance > 0 && measuredDistance < minDistanceSquared;
}

function emitLinearMove(x, y, z, feed) {
  var xWord = xOutput.format(x);
  var yWord = yOutput.format(y);
  var zWord = zOutput.format(z);
  var fWord = feedOutput.format(feed);

  if (xWord || yWord || zWord) {
    writeBlock([gMotionModal.format(1), xWord, yWord, zWord, fWord], false);
    rememberOutputPosition(x, y, z);
  } else if (fWord) {
    writeBlock([gMotionModal.format(1), fWord], false);
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
  var splitMode = String(getProperty("splitFile"));
  var tool = section.getTool();
  var toolChange = runtime.activeToolNumber !== tool.number;
  var forceWorkOffset = toolChange || runtime.activeWorkOffset !== getWorkOffsetCode(section);
  var laterSection = typeof isFirstSection == "function" ? !isFirstSection() : runtime.activeToolNumber !== undefined;
  var needsBoundaryRetract = splitMode == "none" && toolChange;
  var needsSectionSpacer = splitMode == "none" && (toolChange || laterSection);
  var redirectedAtStart = runtime.redirected;

  writeBlock(["G90", "G94", getUnitCode(), "G17"], false);
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
  writeComment(getSectionLabel(section, runtime.splitCount || 0));

  if (splitMode != "none" && toolChange && !laterSection) {
    writeSafeRetract(section);
  }

  if (toolChange && laterSection && getProperty("optionalStop")) {
    writeBlock(["M1"], true);
  }

  if (toolChange || runtime.activeToolNumber === undefined) {
    writeToolCall(tool, toolChange && laterSection);
  }

  startSpindle(section, toolChange || splitMode != "none");
  if (toolChange || splitMode != "none") {
    writeBlock([gPlaneModal.format(17), gAbsIncModal.format(90), gFeedModeModal.format(94)], false);
    runtime.activePlane = 17;
  }
  writeWorkOffset(section, forceWorkOffset);
  startCoolant(section);
  if (section && typeof section.getInitialPosition == "function") {
    fluidncWriteInitialPositioning(section.getInitialPosition(), toolChange || splitMode != "none");
  }
}

function fluidncWriteStartBlocks(isRequired, code) {
  var sectionId = typeof getCurrentSectionId == "function" ? getCurrentSectionId() : runtime.currentSectionId;
  if (runtime.currentSectionId !== sectionId) {
    runtime.currentSectionId = sectionId;
    forceModals();
  }
  if (typeof code == "function") {
    code();
  }
}

function fluidncWriteWCS(section) {
  writeWorkOffset(section || currentSection, true);
}

function fluidncWriteInitialPositioning(position, isRequired) {
  if (position) {
    var requiresFullStart = isRequired === undefined ? true : !!isRequired;
    var safeStartRequiresFallback = !requiresFullStart && getProperty("safeStartAllOperations");
    forceModals(gAbsIncModal, gMotionModal);
    writeBlock(["G53", "G0", "Z0"], false);
    if (requiresFullStart || safeStartRequiresFallback) {
      forceModals(gMotionModal);
      writeBlock([formatWords(gAbsIncModal.format(90), gPlaneModal.format(17)), gMotionModal.format(0), xOutput.format(position.x), yOutput.format(position.y)], false);
      rememberOutputPosition(position.x, position.y, runtime.currentPosition && runtime.currentPosition.z);
      if (position.z !== undefined && position.z !== null) {
        writeBlock([gMotionModal.format(0), zOutput.format(position.z)], false);
        rememberOutputPosition(position.x, position.y, position.z);
      }
      runtime.activePlane = 17;
      forceModals(gMotionModal);
      forceFeed();
      return;
    }
    writeBlock([formatWords(gAbsIncModal.format(90), gPlaneModal.format(17)), gMotionModal.format(0), xOutput.format(position.x), yOutput.format(position.y)], false);
    rememberOutputPosition(position.x, position.y, runtime.currentPosition && runtime.currentPosition.z);
    if (position.z !== undefined && position.z !== null) {
      writeBlock([gMotionModal.format(0), zOutput.format(position.z)], false);
      rememberOutputPosition(position.x, position.y, position.z);
    }
    runtime.activePlane = 17;
  }
}

function finishMainProgram() {
  stopCoolant();
  writeSafeRetract(currentSection || (typeof getNumberOfSections == "function" && getNumberOfSections() > 0 ? getSection(getNumberOfSections() - 1) : undefined));
  writeBlock(["G53", "G0", "X0", "Y0"], false);
  stopSpindle();
  writeBlock(["M30"], false);
}

function fluidncWriteProgramStart() {
  forceModals();
  gUnitModal.reset();
  writeBlock([gAbsIncModal.format(90), gFeedModeModal.format(94)], false);
  writeBlock([gPlaneModal.format(17)], false);
  writeBlock([gUnitModal.format(getUnitCodeNumber())], false);
  gAbsIncModal.format(90);
  gFeedModeModal.format(94);
  gUnitModal.format(getUnitCodeNumber());
  gPlaneModal.format(17);
  runtime.activePlane = 17;
}

function fluidncWriteProgramEnd() {
  finishMainProgram();
}

function fluidncActivateMachine() {
  return machineConfiguration;
}

function fluidncValidateToolData() {
  return true;
}

function fluidncValidateCommonParameters() {
  fluidncValidateToolData();
  return true;
}

function fluidncGetBodyLength(tool) {
  return Number((tool && (tool.bodyLength || tool.fluteLength || tool.overallLength)) || 0);
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

function fluidncForceABC() {
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

function fluidncGetForwardDirection(section) {
  if (section && section.workPlane && section.workPlane.forward) {
    return section.workPlane.forward;
  }
  return getCurrentDirection();
}

function fluidncGetRetractParameters() {
  return {
    method: String(getProperty("safePositionMethod")),
    words: ["Z0"]
  };
}

function fluidncSubprogramsAreSupported() {
  return true;
}

function fluidncMachineSimulation() {
  return false;
}

function fluidncDefineMachine() {
  return machineConfiguration;
}

function fluidncDefineWorkPlane(section) {
  return fluidncGetForwardDirection(section || currentSection);
}

function fluidncIsTCPSupportedByOperation() {
  return false;
}

function fluidncGetWorkPlaneMachineABC() {
  return {
    x: 0,
    y: 0,
    z: 0,
    isNonZero: function () {
      return false;
    }
  };
}

function fluidncPositionABC(abc) {
  return abc;
}

function fluidncForceWorkPlane() {
  return true;
}

function fluidncCancelWCSRotation() {
  return false;
}

function fluidncCancelWorkPlane() {
  return false;
}

function fluidncSetWorkPlane() {
  return false;
}

function fluidncGetOffsetCode() {
  return "";
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

  if (String(getProperty("splitFile")) == "none") {
    var firstSection = typeof getNumberOfSections == "function" && getNumberOfSections() > 0 ? getSection(0) : currentSection;
    writeBlock(["G90", getUnitCode(), "G17"], false);
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
  runtime.pendingSpindleSpeed = Number(spindleSpeed);
  if (runtime.spindleDirection) {
    runtime.activeSpindleSpeed = Number(spindleSpeed);
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
    forceCircular(plane);
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
    forceCircular(plane);
    words = [gPlaneModal.format(17), gMotionModal.format(clockwise ? 2 : 3), xOutput.format(x), yOutput.format(y), zOutput.format(z), iOutput.format(cx - start.x), jOutput.format(cy - start.y), feedOutput.format(feed)];
  } else if (plane == PLANE_ZX) {
    forceCircular(plane);
    words = [gPlaneModal.format(18), gMotionModal.format(clockwise ? 2 : 3), xOutput.format(x), yOutput.format(y), zOutput.format(z), iOutput.format(cx - start.x), kOutput.format(cz - start.z), feedOutput.format(feed)];
  } else if (plane == PLANE_YZ) {
    forceCircular(plane);
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
    startSpindle(currentSection, true);
    break;
  case COMMAND_OPTIONAL_STOP:
    writeBlock(["M1"], true);
    break;
  case COMMAND_STOP:
    writeBlock(["M0"], true);
    break;
  case COMMAND_END:
    writeBlock(["M30"], false);
    break;
  case COMMAND_LOAD_TOOL:
    writeToolCall(currentSection.getTool(), true);
    break;
  default:
    warning("Unsupported command: " + String(command));
  }
}

function fluidncOnSectionEnd() {
  flushPendingLinearMove();
  if (runtime.activePlane !== 17) {
    writeBlock(["G17"], false);
    runtime.activePlane = 17;
  }
  if (typeof isLastSection == "function" ? !isLastSection() : true) {
    var nextSection = typeof getNextSection == "function" ? getNextSection() : undefined;
    if (nextSection && nextSection.getTool && currentSection && currentSection.getTool &&
      nextSection.getTool().coolant !== currentSection.getTool().coolant) {
      stopCoolant();
    }
  }
  forceAny();
}

function fluidncOnClose() {
  if (String(getProperty("splitFile")) == "none") {
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
    forceFeed();
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

function formatComment(text) {
  return fluidncFormatComment(text);
}

function writeComment(text) {
  return fluidncWriteComment(text);
}

function writeBlock(words, isToolChangeBlock) {
  return fluidncWriteBlock(words, isToolChangeBlock);
}

function writeProgramHeader() {
  return fluidncWriteProgramHeader();
}

function getSetting(setting, defaultValue) {
  return fluidncGetSetting(setting, defaultValue);
}

function writeRetract() {
  return fluidncWriteRetract();
}

function getCoolantCodes(coolant) {
  return fluidncGetCoolantCodes(coolant);
}

function setCoolant(coolant) {
  return fluidncSetCoolant(coolant);
}

function startSpindle() {
  return fluidncStartSpindle.apply(this, arguments);
}

function getFeed(feed) {
  return fluidncGetFeed(feed);
}

function writeToolCall(tool, announceChange) {
  return fluidncWriteToolCall(tool, announceChange);
}

function writeToolBlock() {
  return fluidncWriteToolBlock.apply(this, arguments);
}

function _fluidncFlushPending() {
  return fluidncFlushPendingLinearMove();
}

function writeStartBlocks(isRequired, code) {
  return fluidncWriteStartBlocks(isRequired, code);
}

function writeWCS(section) {
  return fluidncWriteWCS(section);
}

function writeInitialPositioning(position) {
  return fluidncWriteInitialPositioning.apply(this, arguments);
}

function writeProgramStart() {
  return fluidncWriteProgramStart();
}

function writeProgramEnd() {
  return fluidncWriteProgramEnd();
}

function activateMachine() {
  return fluidncActivateMachine();
}

function validateToolData() {
  return fluidncValidateToolData();
}

function validateCommonParameters() {
  return fluidncValidateCommonParameters();
}

function getBodyLength(tool) {
  return fluidncGetBodyLength(tool);
}

function forceFeed() {
  return fluidncForceFeed();
}

function forceXYZ() {
  return fluidncForceXYZ();
}

function forceABC() {
  return fluidncForceABC();
}

function forceAny() {
  return fluidncForceAny();
}

function forceModals() {
  return fluidncForceModals.apply(this, arguments);
}

function forceCircular(plane) {
  return fluidncForceCircular(plane);
}

function getForwardDirection(section) {
  return fluidncGetForwardDirection(section);
}

function getRetractParameters() {
  return fluidncGetRetractParameters();
}

function subprogramsAreSupported() {
  return fluidncSubprogramsAreSupported();
}

function machineSimulation() {
  return fluidncMachineSimulation();
}

function defineMachine() {
  return fluidncDefineMachine();
}

function defineWorkPlane(section) {
  return fluidncDefineWorkPlane(section);
}

function isTCPSupportedByOperation() {
  return fluidncIsTCPSupportedByOperation();
}

function getWorkPlaneMachineABC() {
  return fluidncGetWorkPlaneMachineABC();
}

function positionABC(abc) {
  return fluidncPositionABC(abc);
}

function forceWorkPlane() {
  return fluidncForceWorkPlane();
}

function cancelWCSRotation() {
  return fluidncCancelWCSRotation();
}

function cancelWorkPlane() {
  return fluidncCancelWorkPlane();
}

function setWorkPlane() {
  return fluidncSetWorkPlane();
}

function getOffsetCode() {
  return fluidncGetOffsetCode();
}

function onMoveToSafeRetractPosition() {
  return fluidncOnMoveToSafeRetractPosition();
}

function onRotateAxes(x, y, z) {
  return fluidncOnRotateAxes(x, y, z);
}

function onReturnFromSafeRetractPosition(x, y, z) {
  return fluidncOnReturnFromSafeRetractPosition(x, y, z);
}

function onOpen() {
  return fluidncOnOpen();
}

function onSection() {
  return fluidncOnSection();
}

function onDwell(seconds) {
  return fluidncOnDwell(seconds);
}

function onSpindleSpeed(spindleSpeed) {
  return fluidncOnSpindleSpeed(spindleSpeed);
}

function onCircular(clockwise, cx, cy, cz, x, y, z, feed) {
  return fluidncOnCircular(clockwise, cx, cy, cz, x, y, z, feed);
}

function onCommand(command) {
  return fluidncOnCommand(command);
}

function onSectionEnd() {
  return fluidncOnSectionEnd();
}

function onClose() {
  return fluidncOnClose();
}

function onComment(text) {
  return fluidncOnComment(text);
}

function onPassThrough(text) {
  return fluidncOnPassThrough(text);
}

function onRapid(x, y, z) {
  return fluidncOnRapid(x, y, z);
}

function onLinear(x, y, z, feed) {
  return fluidncOnLinear(x, y, z, feed);
}

function onRapid5D() {
  return fluidncOnRapid5D();
}

function onLinear5D() {
  return fluidncOnLinear5D();
}

function onRadiusCompensation() {
  return fluidncOnRadiusCompensation();
}
