import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const defaultCpsPath = path.join(repoRoot, "adapters", "fusion", "FluidNC.cps");
export const defaultOriginalPostPath = path.join(os.homedir(), "AppData", "Roaming", "Autodesk", "Fusion 360 CAM", "Posts", "FluidNC.cps");

export const MM = "MM";
export const IN = "IN";
export const PLANE_XY = 0;
export const PLANE_ZX = 1;
export const PLANE_YZ = 2;
export const repoCpsPath = defaultCpsPath;
const REVISION = 50328;

function nearlyEqual(left, right, tolerance = 1e-6) {
  return Math.abs(Number(left) - Number(right)) <= tolerance;
}

const defaultProperties = {
  safePositionMethod: "G53",
  showSequenceNumbers: "false",
  sequenceNumberStart: 10,
  sequenceNumberIncrement: 1,
  separateWordsWithSpace: true,
  useToolCall: true,
  useM06: false,
  splitFile: "none",
  optionalStop: true,
  safeStartAllOperations: false,
  toolAsName: false,
  useCoolant: true,
  spindleWarmupDelay: 3,
  fluidncArcTolerance: 0.002,
  fluidncJunctionDeviation: 0.01,
  minimumSegmentLength: 0.05,
  writeMachine: false,
  writeTools: true
};

function trimNumber(text) {
  return String(text)
    .replace(/(\.\d*?[1-9])0+$/, "$1")
    .replace(/\.0+$/, "")
    .replace(/\.$/, "");
}

function formatNumber(value, decimals) {
  return trimNumber(Number(value).toFixed(decimals));
}

function createFormatFactory(host) {
  return function createFormat(spec = {}) {
    const decimals = spec.decimals ?? 3;
    const prefix = spec.prefix ?? "";
    const scale = spec.scale ?? 1;

    return {
      areDifferent(left, right) {
        return this.getResultingValue(left) !== this.getResultingValue(right);
      },
      format(value) {
        if (value === undefined || value === null || value === "") {
          return "";
        }
        const numeric = Number(value) * scale;
        let formatted = formatNumber(numeric, decimals);
        if (spec.type === host.FORMAT_REAL && formatted.indexOf(".") === -1) {
          formatted += ".";
        }
        return prefix + formatted;
      },
      getResultingValue(value) {
        if (value === undefined || value === null || value === "") {
          return undefined;
        }
        return Number(formatNumber(Number(value) * scale, decimals));
      }
    };
  };
}

function createOutputVariableFactory(host) {
  return function createOutputVariable(spec = {}, format = { format(value) { return String(value); } }) {
    let enabled = true;
    let current = spec.current;

    return {
      disable() {
        enabled = false;
      },
      enable() {
        enabled = true;
      },
      reset() {
        current = undefined;
        enabled = true;
      },
      getCurrent() {
        return current;
      },
      isEnabled() {
        return enabled;
      },
      format(value) {
        if (!enabled || value === undefined || value === null || value === "") {
          return "";
        }

        const formatted = typeof format.format == "function" ? format.format(value) : String(value);
        if (!formatted) {
          return "";
        }

        const changed = current !== value;
        if (!changed && spec.control !== host.CONTROL_FORCE) {
          return "";
        }

        current = value;
        if (changed && typeof spec.onchange == "function") {
          spec.onchange();
        }
        return `${spec.prefix ?? ""}${formatted}`;
      }
    };
  };
}

function createRange(minimum) {
  let currentMinimum = minimum;
  return {
    expandToRange(range) {
      if (range && typeof range.getMinimum == "function") {
        currentMinimum = Math.min(currentMinimum, range.getMinimum());
      }
    },
    getMinimum() {
      return currentMinimum;
    }
  };
}

function flattenWords(words) {
  const flattened = [];

  for (const word of words) {
    if (word === undefined || word === null || word === "") {
      continue;
    }
    if (Array.isArray(word)) {
      flattened.push(...flattenWords(word));
      continue;
    }
    if (typeof word != "string" && typeof word?.length == "number") {
      flattened.push(...flattenWords(Array.from(word)));
      continue;
    }
    flattened.push(String(word));
  }

  return flattened;
}

function createSection(overrides = {}) {
  const tool = {
    number: 1,
    diameter: 6,
    cornerRadius: 0,
    type: 1,
    description: "flat end mill",
    comment: "",
    lengthOffset: 1,
    diameterOffset: 1,
    holderLength: 0,
    bodyLength: 0,
    taperAngle: 0,
    manualToolChange: false,
    clockwise: true,
    spindleRPM: 5000,
    coolant: 4,
    ...overrides.tool
  };
  tool.getToolId = function getToolId() {
    return tool.number;
  };

  const parameters = {
    "operation-comment": "section",
    ...overrides.parameters
  };

  return {
    workOffset: overrides.workOffset ?? 1,
    wcs: overrides.wcs ?? "G54",
    workOrigin: overrides.workOrigin ?? { x: 0, y: 0, z: 0 },
    workPlane: overrides.workPlane ?? { forward: { x: 0, y: 0, z: 1 } },
    getTool() {
      return tool;
    },
    getParameter(name, fallback = "") {
      return Object.prototype.hasOwnProperty.call(parameters, name) ? parameters[name] : fallback;
    },
    getGlobalZRange() {
      return createRange(overrides.zMin ?? -4);
    },
    getInitialPosition() {
      return overrides.initialPosition ?? { x: 0, y: 0, z: 15 };
    },
    getMovements() {
      return 0;
    },
    getFinalPosition() {
      return overrides.finalPosition ?? { x: 0, y: 0, z: 15 };
    },
    getGlobalInitialToolAxis() {
      return { x: 0, y: 0, z: 0 };
    },
    getInitialToolAxisABC() {
      return { x: 0, y: 0, z: 0 };
    },
    getOptimizedTCPMode() {
      return 0;
    },
    getABCByPreference() {
      return { x: 0, y: 0, z: 0 };
    },
    isOptional() {
      return overrides.optional ?? false;
    },
    isOptimizedForMachine() {
      return false;
    },
    isMultiAxis() {
      return false;
    }
  };
}

function normalizeSection(section) {
  if (section && typeof section.getTool == "function") {
    return section;
  }
  return createSection(section);
}

function buildToolTable(sections) {
  const seen = {};
  const tools = [];

  for (const section of sections) {
    const tool = section.getTool();
    if (!seen[tool.number]) {
      seen[tool.number] = true;
      tools.push(tool);
    }
  }

  return {
    getNumberOfTools() {
      return tools.length;
    },
    getTool(index) {
      return tools[index];
    }
  };
}

export async function loadPost(options = {}) {
  const cpsPath = options.cpsPath ?? defaultCpsPath;
  const rawSource = await fs.readFile(cpsPath, "utf8");
  const source = typeof options.sourceTransform == "function" ? options.sourceTransform(rawSource, cpsPath) : rawSource;
  const properties = { ...defaultProperties, ...options.properties };
  const sections = (options.sections ?? [{}]).map(normalizeSection);
  const outputPath = options.outputPath ?? path.join(repoRoot, "fixtures", "expected", "fusion", `${options.programName ?? "program"}.nc`);
  const state = {
    bufferName: "main",
    sectionIndex: options.sectionIndex ?? 0,
    unit: options.unit ?? MM,
    circularPlane: options.circularPlane ?? PLANE_XY,
    currentPosition: { ...(options.startPosition ?? { x: 0, y: 0, z: 0 }) },
    nextRecords: Array.isArray(options.nextRecords) ? [...options.nextRecords] : []
  };

  const buffers = {
    main: []
  };
  const redirectedFiles = new Map();
  const warnings = [];
  const linearizeCalls = [];
  const fallbackTool = createSection().getTool();

  function ensureBuffer(name) {
    if (!Object.prototype.hasOwnProperty.call(buffers, name)) {
      buffers[name] = [];
    }
    return buffers[name];
  }

  function pushLine(line) {
    ensureBuffer(state.bufferName).push(line);
  }

  function isMotionRecord(record) {
    if (record && typeof record.isMotion == "function") {
      return Boolean(record.isMotion());
    }
    if (typeof record == "string") {
      return record === "motion";
    }
    return Boolean(record);
  }

  function peekNextRecord() {
    const record = state.nextRecords[0];
    return {
      isMotion() {
        return isMotionRecord(record);
      }
    };
  }

  function consumeNextRecord() {
    if (state.nextRecords.length > 0) {
      state.nextRecords.shift();
    }
  }

  const host = {
    Array,
    Matrix: class Matrix {
      constructor(x = null, y = null, z = null) {
        this.x = x;
        this.y = y;
        this.z = z;
      }

      getEuler2() {
        return new host.Vector(0, 0, 0);
      }

      getTransposed() {
        return this;
      }

      multiply(vector) {
        return vector;
      }
    },
    MM,
    IN,
    Vector: class Vector {
      constructor(x = 0, y = 0, z = 0) {
        this.x = Number(x) || 0;
        this.y = Number(y) || 0;
        this.z = Number(z) || 0;
      }

      get length() {
        return Math.sqrt((this.x ** 2) + (this.y ** 2) + (this.z ** 2));
      }

      getNormalized() {
        const len = this.length;
        return len > 0 ? new host.Vector(this.x / len, this.y / len, this.z / len) : new host.Vector(0, 0, 0);
      }

      isNonZero() {
        return !this.isZero();
      }

      isZero() {
        return nearlyEqual(this.x, 0) && nearlyEqual(this.y, 0) && nearlyEqual(this.z, 0);
      }

      static cross(left, right) {
        return new host.Vector(
          (left.y * right.z) - (left.z * right.y),
          (left.z * right.x) - (left.x * right.z),
          (left.x * right.y) - (left.y * right.x)
        );
      }

      static diff(left, right) {
        return new host.Vector(
          Number(left?.x ?? 0) - Number(right?.x ?? 0),
          Number(left?.y ?? 0) - Number(right?.y ?? 0),
          Number(left?.z ?? 0) - Number(right?.z ?? 0)
        );
      }

      static dot(left, right) {
        return (left.x * right.x) + (left.y * right.y) + (left.z * right.z);
      }
    },
    DEG: 1,
    EOL: "\n",
    FORMAT_REAL: "real",
    FEATURE_MACHINE_ROTARY_ANGLES: 1,
    CONTROL_FORCE: "force",
    ABC: "ABC",
    PREFER_PREFERENCE: "prefer-preference",
    ENABLE_ALL: "enable-all",
    EULER_ZXZ_R: "euler-zxz-r",
    OPTIMIZE_AXIS: "optimize-axis",
    CAPABILITY_MILLING: 1,
    CAPABILITY_MACHINE_SIMULATION: 2,
    PLANE_XY,
    PLANE_ZX,
    PLANE_YZ,
    X: "X",
    Y: "Y",
    Z: "Z",
    COOLANT_FLOOD: 1,
    COOLANT_MIST: 2,
    COOLANT_THROUGH_TOOL: 3,
    COOLANT_AIR: 4,
    COOLANT_AIR_THROUGH_TOOL: 5,
    COOLANT_SUCTION: 6,
    COOLANT_FLOOD_MIST: 7,
    COOLANT_FLOOD_THROUGH_TOOL: 8,
    COOLANT_OFF: 9,
    COMMAND_COOLANT_OFF: 100,
    COMMAND_STOP_SPINDLE: 101,
    COMMAND_START_SPINDLE: 102,
    COMMAND_OPTIONAL_STOP: 103,
    COMMAND_STOP: 104,
    COMMAND_END: 105,
    COMMAND_LOAD_TOOL: 106,
    COMMAND_COOLANT_ON: 107,
    COMMAND_LOCK_MULTI_AXIS: 108,
    COMMAND_UNLOCK_MULTI_AXIS: 109,
    COMMAND_SPINDLE_CLOCKWISE: 110,
    COMMAND_SPINDLE_COUNTERCLOCKWISE: 111,
    COMMAND_BREAK_CONTROL: 112,
    COMMAND_TOOL_MEASURE: 113,
    TOOL_PROBE: 99,
    OPTIMIZE_NONE: 0,
    OPTIMIZE_BOTH: 1,
    OPTIMIZE_HEADS: 2,
    OPTIMIZE_TABLES: 3,
    TCP_XYZ: 1,
    TCP_XYZ_OPTIMIZED: 2,
    MACHINE: "machine",
    HIGH_FEED_NO_MAPPING: 0,
    HIGH_FEED_MAP_ANY: 1,
    HIGH_FEED_MAP_MULTI: 2,
    MOVEMENT_RAMP: 1,
    MOVEMENT_RAMP_ZIG_ZAG: 2,
    MOVEMENT_RAMP_PROFILE: 4,
    MOVEMENT_RAMP_HELIX: 8,
    revision: REVISION,
    supportedFeatures: 0,
    highFeedMapping: 0,
    unit: state.unit,
    extension: "nc",
    programName: options.programName ?? "program",
    programComment: options.programComment ?? "",
    currentSection: sections[state.sectionIndex],
    tool: sections[state.sectionIndex]?.getTool?.() ?? fallbackTool,
    spindleSpeed: sections[state.sectionIndex]?.getTool?.().spindleRPM ?? fallbackTool.spindleRPM,
    machineConfiguration: {
      getDescription() {
        return "";
      },
      getMaximumSpindleSpeed() {
        return 0;
      },
      getModel() {
        return "";
      },
      getHomePositionX() {
        return 0;
      },
      getHomePositionY() {
        return 0;
      },
      getNumberOfAxes() {
        return 3;
      },
      getNumberOfTools() {
        return sections.length;
      },
      getOrientation() {
        return new host.Matrix();
      },
      getRetractPlane() {
        return 0;
      },
      getSpindleAxis() {
        return new host.Vector(0, 0, 1);
      },
      getVendor() {
        return "";
      },
      hasHomePositionX() {
        return false;
      },
      hasHomePositionY() {
        return false;
      },
      isHeadConfiguration() {
        return false;
      },
      isMachineCoordinate() {
        return false;
      },
      isMultiAxisConfiguration() {
        return false;
      },
      isReceived() {
        return false;
      }
    },
    setCodePage() {},
    spatial(value, fromUnit) {
      if (fromUnit === MM && state.unit === IN) {
        return Number(value) / 25.4;
      }
      if (fromUnit === IN && state.unit === MM) {
        return Number(value) * 25.4;
      }
      return Number(value);
    },
    toRad(value) {
      return Number(value) * Math.PI / 180;
    },
    toPreciseUnit(value, fromUnit) {
      return host.spatial(value, fromUnit);
    },
    getProperty(name) {
      return properties[name];
    },
    setProperty(name, value) {
      properties[name] = value;
    },
    getOutputPath() {
      return outputPath;
    },
    FileSystem: {
      getFolderPath(targetPath) {
        return path.dirname(targetPath);
      },
      getCombinedPath(left, right) {
        return path.join(left, right);
      }
    },
    writeln(line = "") {
      pushLine(String(line));
    },
    writeWords(...words) {
      const separator = properties.separateWordsWithSpace === false ? "" : " ";
      const filtered = words.flat().filter(Boolean);
      if (filtered.length > 0) {
        pushLine(filtered.join(separator));
      }
    },
    writeWords2(...words) {
      host.writeWords(...words);
    },
    getWordSeparator() {
      return properties.separateWordsWithSpace === false ? "" : " ";
    },
    redirectToFile(targetPath) {
      const fileName = path.basename(targetPath);
      state.bufferName = fileName;
      ensureBuffer(fileName);
      redirectedFiles.set(fileName, buffers[fileName]);
    },
    isRedirecting() {
      return state.bufferName !== "main";
    },
    closeRedirection() {
      state.bufferName = "main";
    },
    getNumberOfSections() {
      return sections.length;
    },
    getSection(index) {
      return sections[index];
    },
    getCurrentSectionId() {
      return state.sectionIndex;
    },
    getToolTable() {
      return buildToolTable(sections);
    },
    isFirstSection() {
      return state.sectionIndex === 0;
    },
    isLastSection() {
      return state.sectionIndex === sections.length - 1;
    },
    getPreviousSection() {
      return sections[Math.max(0, state.sectionIndex - 1)];
    },
    getNextSection() {
      return sections[Math.min(sections.length - 1, state.sectionIndex + 1)];
    },
    isToolChangeNeeded(sectionOrKey, maybeKey) {
      const previous = state.sectionIndex > 0 ? sections[state.sectionIndex - 1] : undefined;
      const current = host.currentSection;
      const comparisonSection = typeof sectionOrKey == "object" && sectionOrKey ? sectionOrKey : current;
      const comparisonKey = typeof sectionOrKey == "string" ? sectionOrKey : (maybeKey ?? "number");
      if (!previous || !current) {
        return true;
      }
      return previous.getTool()[comparisonKey] !== comparisonSection.getTool()[comparisonKey];
    },
    isNewWorkOffset(section) {
      const previous = state.sectionIndex > 0 ? sections[state.sectionIndex - 1] : undefined;
      if (!previous || !section) {
        return true;
      }
      return previous.workOffset !== section.workOffset;
    },
    isNewWorkPlane() {
      return false;
    },
    getCurrentPosition() {
      return { ...state.currentPosition };
    },
    getFramePosition(position) {
      return { ...position };
    },
    getGlobalPosition(position) {
      return { ...position };
    },
    getCurrentDirection() {
      return new host.Vector(0, 0, 1);
    },
    getCircularPlane() {
      return state.circularPlane;
    },
    getParameter(name, fallback = "") {
      return host.currentSection?.getParameter?.(name, fallback) ?? fallback;
    },
    hasParameter(name) {
      return host.currentSection?.getParameter?.(name, undefined) !== undefined;
    },
    isFullCircle() {
      if (!host.__currentCircularCall) {
        return false;
      }
      const start = host.getCurrentPosition();
      const plane = host.getCircularPlane();
      if (plane === PLANE_XY) {
        return nearlyEqual(start.x, host.__currentCircularCall.x) &&
          nearlyEqual(start.y, host.__currentCircularCall.y);
      }
      if (plane === PLANE_ZX) {
        return nearlyEqual(start.x, host.__currentCircularCall.x) &&
          nearlyEqual(start.z, host.__currentCircularCall.z);
      }
      if (plane === PLANE_YZ) {
        return nearlyEqual(start.y, host.__currentCircularCall.y) &&
          nearlyEqual(start.z, host.__currentCircularCall.z);
      }
      return nearlyEqual(start.x, host.__currentCircularCall.x) &&
        nearlyEqual(start.y, host.__currentCircularCall.y) &&
        nearlyEqual(start.z, host.__currentCircularCall.z);
    },
    isHelical() {
      if (!host.__currentCircularCall) {
        return false;
      }
      const start = host.getCurrentPosition();
      const plane = host.getCircularPlane();
      if (plane === PLANE_XY) {
        return !nearlyEqual(start.z, host.__currentCircularCall.z);
      }
      if (plane === PLANE_ZX) {
        return !nearlyEqual(start.y, host.__currentCircularCall.y);
      }
      if (plane === PLANE_YZ) {
        return !nearlyEqual(start.x, host.__currentCircularCall.x);
      }
      return false;
    },
    linearize(tolerance) {
      linearizeCalls.push(tolerance);
    },
    getSimulationStreamPath() {
      return "";
    },
    getCommandStringId(command) {
      if (typeof command == "string") {
        return command;
      }

      for (const [name, value] of Object.entries(host)) {
        if (name.startsWith("COMMAND_") && value === command) {
          return name;
        }
      }

      return String(command);
    },
    getRotation() {
      return new host.Matrix();
    },
    setRotation() {},
    getNextRecord() {
      return peekNextRecord();
    },
    queueNextRecords(records) {
      const queued = Array.isArray(records) ? records : [records];
      state.nextRecords.push(...queued);
    },
    getToolTypeName() {
      return "flat end mill";
    },
    is3D() {
      return true;
    },
    isSameDirection(left, right) {
      const a = new host.Vector(left?.x ?? 0, left?.y ?? 0, left?.z ?? 0).getNormalized();
      const b = new host.Vector(right?.x ?? 0, right?.y ?? 0, right?.z ?? 0).getNormalized();
      return nearlyEqual(a.x, b.x) && nearlyEqual(a.y, b.y) && nearlyEqual(a.z, b.z);
    },
    clamp(minimum, value, maximum) {
      return Math.max(minimum, Math.min(value, maximum));
    },
    conditional(condition, whenTrue, whenFalse = "") {
      return condition ? whenTrue : whenFalse;
    },
    formatWords(...words) {
      return flattenWords(words).join(host.getWordSeparator());
    },
    filterText(text, permitted) {
      if (!permitted) {
        return String(text ?? "");
      }
      const allowed = new Set(String(permitted).split(""));
      return String(text ?? "")
        .split("")
        .filter((character) => allowed.has(character.toLowerCase()) || allowed.has(character))
        .join("");
    },
    localize(text) {
      return text;
    },
    subst(text, ...args) {
      return text.replace(/%([0-9]+)/g, (_, index) => String(args[Number(index) - 1]));
    },
    validate(condition, message) {
      if (!condition) {
        throw new Error(message);
      }
      return condition;
    },
    warning(message) {
      warnings.push(message);
    },
    warningOnce(message) {
      warnings.push(message);
    },
    onUnsupportedCoolant(coolant) {
      warnings.push(`Unsupported coolant: ${String(coolant)}`);
      return "";
    },
    onUnsupportedCommand(command) {
      warnings.push(`Unsupported command: ${String(command)}`);
    },
    error(message) {
      throw new Error(message);
    }
  };

  if (options.omitControlForce) {
    delete host.CONTROL_FORCE;
  }

  if (options.coverageObject) {
    host.__coverage__ = options.coverageObject;
  }

  host.createFormat = createFormatFactory(host);
  host.createOutputVariable = createOutputVariableFactory(host);

  const context = vm.createContext(host);
  const script = new vm.Script(source, { filename: cpsPath });
  script.runInContext(context);

  function syncRuntimeGlobals() {
    host.currentSection = sections[state.sectionIndex];
    host.tool = host.currentSection?.getTool?.() ?? fallbackTool;
    host.spindleSpeed = host.tool?.spindleRPM ?? fallbackTool.spindleRPM;
  }

  for (const callbackName of ["onOpen", "onSection", "onSectionEnd", "onClose", "onCommand", "onDwell", "onSpindleSpeed", "onComment", "onPassThrough", "onRapid5D", "onLinear5D", "onRadiusCompensation"]) {
    if (typeof host[callbackName] == "function") {
      const callback = host[callbackName];
      host[callbackName] = function wrappedCallback() {
        syncRuntimeGlobals();
        return callback.apply(this, arguments);
      };
    }
  }

  if (typeof host.onCircular == "function") {
    const onCircular = host.onCircular;
    host.onCircular = function wrappedOnCircular(clockwise, cx, cy, cz, x, y, z, feed) {
      syncRuntimeGlobals();
      host.__currentCircularCall = { clockwise, cx, cy, cz, x, y, z, feed };
      try {
        const result = onCircular(clockwise, cx, cy, cz, x, y, z, feed);
        state.currentPosition = { x, y, z };
        if (host.runtime && typeof host.runtime == "object") {
          host.runtime.currentPosition = { x, y, z };
        }
        return result;
      } finally {
        host.__currentCircularCall = undefined;
      }
    };
  }

  for (const callbackName of ["onRapid", "onLinear"]) {
    if (typeof host[callbackName] == "function") {
      const callback = host[callbackName];
      host[callbackName] = function wrappedMotion(x, y, z) {
        syncRuntimeGlobals();
        const result = callback.apply(this, arguments);
        state.currentPosition = { x, y, z };
        if (host.runtime && typeof host.runtime == "object") {
          host.runtime.currentPosition = { x, y, z };
        }
        if (callbackName === "onLinear") {
          consumeNextRecord();
        }
        return result;
      };
    }
  }

  if (typeof host.onLinear5D == "function") {
    const onLinear5D = host.onLinear5D;
    host.onLinear5D = function wrappedLinear5D() {
      syncRuntimeGlobals();
      const result = onLinear5D.apply(this, arguments);
      consumeNextRecord();
      return result;
    };
  }

  return {
    host,
    state,
    warnings,
    linearizeCalls,
    redirectedFiles,
    setSectionIndex(index) {
      state.sectionIndex = index;
      host.currentSection = sections[index];
      host.tool = sections[index]?.getTool?.() ?? fallbackTool;
      host.spindleSpeed = host.tool?.spindleRPM ?? fallbackTool.spindleRPM;
    },
    setCircularPlane(plane) {
      state.circularPlane = plane;
    },
    setCurrentPosition(position) {
      state.currentPosition = { ...position };
      if (host.runtime && typeof host.runtime == "object") {
        host.runtime.currentPosition = { ...position };
      }
    },
    getMainLines() {
      return [...buffers.main];
    },
    getMainText() {
      return buffers.main.join("\n");
    },
    getFileNames() {
      return [...redirectedFiles.keys()];
    },
    getFileLines(name) {
      return [...(buffers[name] ?? [])];
    },
    getFileText(name) {
      return (buffers[name] ?? []).join("\n");
    }
  };
}
