import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { loadPost, PLANE_XY, PLANE_ZX, PLANE_YZ } from "../../tests/support/fusion-host.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const originalPath = process.env.FLUIDNC_ORIGINAL_POST ?? "C:\\Users\\540ly\\AppData\\Roaming\\Autodesk\\Fusion 360 CAM\\Posts\\FluidNC.cps";

function normalizeText(text) {
  return String(text ?? "").replace(/\r\n/g, "\n").trimEnd();
}

function diffText(expected, actual) {
  const expectedLines = normalizeText(expected).split("\n");
  const actualLines = normalizeText(actual).split("\n");
  const limit = Math.max(expectedLines.length, actualLines.length);

  for (let index = 0; index < limit; index += 1) {
    if (expectedLines[index] !== actualLines[index]) {
      return {
        line: index + 1,
        expected: expectedLines[index] ?? "<EOF>",
        actual: actualLines[index] ?? "<EOF>",
        matchedPrefixLines: index
      };
    }
  }

  return {
    line: null,
    expected: null,
    actual: null,
    matchedPrefixLines: expectedLines.length
  };
}

function queueNextMotion(post, isMotion) {
  post.host.queueNextRecords([{ isMotion }]);
}

function runRapid(post, x, y, z) {
  post.host.onRapid(x, y, z);
}

function runLinear(post, x, y, z, feed, nextIsMotion = false) {
  queueNextMotion(post, nextIsMotion);
  post.host.onLinear(x, y, z, feed);
}

function runArc(post, plane, clockwise, cx, cy, cz, x, y, z, feed) {
  post.setCircularPlane(plane);
  post.host.onCircular(clockwise, cx, cy, cz, x, y, z, feed);
}

async function runSections(loadOriginal, options, sectionRunners) {
  const post = await loadOriginal(options);
  post.host.onOpen();

  for (let index = 0; index < sectionRunners.length; index += 1) {
    post.setSectionIndex(index);
    post.host.onSection();
    sectionRunners[index](post);
    post.host.onSectionEnd();
  }

  post.host.onClose();
  return post;
}

function getText(post, target) {
  return target.fileName ? post.getFileText(target.fileName) : post.getMainText();
}

function classifyTarget(target, diff, warnings) {
  if (!diff.line) {
    return {
      classification: "match",
      note: "Mock host reproduced the captured file exactly."
    };
  }

  if (target.expectedGap) {
    return target.expectedGap;
  }

  if (warnings.some((warning) => warning.startsWith("Unsupported coolant:"))) {
    return {
      classification: "scenario_metadata_gap",
      note: "Scenario tool coolant metadata does not yet match the captured run."
    };
  }

  if (diff.line === 1 && /^\(.+\)$/.test(diff.expected) && /^\(.+\)$/.test(diff.actual)) {
    return {
      classification: "scenario_metadata_gap",
      note: "Program label differs before any motion is emitted."
    };
  }

  if (diff.expected === "<EOF>" || diff.actual === "<EOF>") {
    return {
      classification: "scenario_depth_gap",
      note: "Scenario stops before the captured fixture run is complete."
    };
  }

  return {
    classification: "possible_host_gap",
    note: "Mismatch is not explained by the current scenario metadata or known shallow trace limits."
  };
}

const multiToolSections = [
  {
    parameters: { "operation-comment": "01_pocket_t1" },
    initialPosition: { x: 101.934, y: 65.004, z: 15 },
    tool: { number: 1, spindleRPM: 5000, coolant: 4, diameter: 6, description: "flat end mill" },
    zMin: -4
  },
  {
    parameters: { "operation-comment": "02_bore_t2" },
    initialPosition: { x: 22.6, y: 18.7, z: 15 },
    tool: { number: 2, spindleRPM: 8000, coolant: 9, diameter: 3, description: "flat end mill" },
    zMin: -11
  },
  {
    parameters: { "operation-comment": "03_outer_profile_t1" },
    initialPosition: { x: 0.4, y: 65.8, z: 15 },
    tool: { number: 1, spindleRPM: 5000, coolant: 4, diameter: 6, description: "flat end mill" },
    zMin: -3
  }
];

const splitSections = [
  {
    parameters: { "operation-comment": "01_rough_pocket_t1" },
    initialPosition: { x: 42.264, y: 27.091, z: 15 },
    tool: { number: 1, spindleRPM: 5000, coolant: 9, diameter: 6, description: "flat end mill" },
    zMin: -4
  },
  {
    parameters: { "operation-comment": "02_bore_12mm_t2" },
    initialPosition: { x: 86.6, y: 18.7, z: 15 },
    tool: { number: 2, spindleRPM: 8000, coolant: 9, diameter: 3, description: "flat end mill" },
    zMin: -11
  },
  {
    parameters: { "operation-comment": "03_outer_profile_t1" },
    initialPosition: { x: 96.2, y: 30.4, z: 15 },
    tool: { number: 1, spindleRPM: 3234, coolant: 9, diameter: 6, description: "flat end mill" },
    zMin: -3
  }
];

const tinySections = [
  {
    parameters: { "operation-comment": "01_dense_spline_profile" },
    initialPosition: { x: -1.4, y: 26.549, z: 15 },
    tool: { number: 1, spindleRPM: 12000, coolant: 9, diameter: 3, description: "flat end mill" },
    zMin: -9
  },
  {
    parameters: { "operation-comment": "02_circle_profile" },
    initialPosition: { x: 74.6, y: 15.7, z: 15 },
    tool: { number: 1, spindleRPM: 12000, coolant: 9, diameter: 3, description: "flat end mill" },
    zMin: -9
  }
];

const scenarioDepthGap = (note) => ({
  classification: "scenario_depth_gap",
  note
});

const fixtureAuditScenarios = [
  {
    name: "multi-tool default",
    async run(loadOriginal) {
      return runSections(loadOriginal, {
        programName: "manual-toolchange-default",
        properties: {
          optionalStop: true,
          useCoolant: true,
          minimumSegmentLength: 0.01
        },
        sections: multiToolSections
      }, [
        (post) => {
          runRapid(post, 101.934, 65.004, 5);
          runLinear(post, 101.934, 65.004, 1, 796.1, true);
          runLinear(post, 101.934, 65.004, -3.4, 2388.4);
          runRapid(post, 101.934, 65.004, 15);
        },
        (post) => {
          runRapid(post, 22.6, 18.7, -2);
          runLinear(post, 22.6, 18.7, -3.7, 417.8, true);
          runArc(post, PLANE_ZX, true, 22.9, 18.7, -3.7, 22.9, 18.7, -4, 417.8);
          runRapid(post, 22.75, 18.7, 15);
        },
        (post) => {
          runRapid(post, 0.4, 65.8, 5);
          runLinear(post, 0.4, 65.8, 1, 796.1, true);
          runLinear(post, 0.4, 65.8, -2.4, 796.1, true);
          runArc(post, PLANE_YZ, true, 0.4, 65.2, -2.4, 0.4, 65.2, -3, 2388.4);
        }
      ]);
    },
    targets: [
      {
        fixturePath: "fixtures/expected/fusion/multi-tool/manual-toolchange-default.nc",
        expectedGap: scenarioDepthGap("Scenario covers startup, tool boundaries, and first primitives only. The captured fixture continues full pocket, bore, and profile toolpaths.")
      }
    ]
  },
  {
    name: "multi-tool no optional stop",
    async run(loadOriginal) {
      return runSections(loadOriginal, {
        programName: "manual-toolchange-default",
        properties: {
          optionalStop: false,
          useCoolant: true,
          minimumSegmentLength: 0.01
        },
        sections: multiToolSections
      }, [
        (post) => {
          runRapid(post, 101.934, 65.004, 5);
          runLinear(post, 101.934, 65.004, 1, 796.1, true);
          runLinear(post, 101.934, 65.004, -3.4, 2388.4);
          runRapid(post, 101.934, 65.004, 15);
        },
        (post) => {
          runRapid(post, 22.6, 18.7, -2);
          runLinear(post, 22.6, 18.7, -3.7, 417.8, true);
          runArc(post, PLANE_ZX, true, 22.9, 18.7, -3.7, 22.9, 18.7, -4, 417.8);
          runRapid(post, 22.75, 18.7, 15);
        },
        (post) => {
          runRapid(post, 0.4, 65.8, 5);
          runLinear(post, 0.4, 65.8, 1, 796.1, true);
          runLinear(post, 0.4, 65.8, -2.4, 796.1, true);
          runArc(post, PLANE_YZ, true, 0.4, 65.2, -2.4, 0.4, 65.2, -3, 2388.4);
        }
      ]);
    },
    targets: [
      {
        fixturePath: "fixtures/expected/fusion/multi-tool/manual-toolchange-no-optional-stop.nc",
        expectedGap: scenarioDepthGap("Fixture label and optional-stop state are aligned, but the scenario still stops after the first motion primitives in each tool section.")
      }
    ]
  },
  {
    name: "split-by-tool",
    async run(loadOriginal) {
      return runSections(loadOriginal, {
        programName: "split-by-tool",
        properties: {
          splitFile: "tool",
          optionalStop: false,
          safeStartAllOperations: false,
          minimumSegmentLength: 0.1
        },
        sections: splitSections
      }, [
        (post) => {
          runRapid(post, 42.264, 27.091, 5);
          runLinear(post, 42.264, 27.091, 3.1, 333.3, true);
        },
        (post) => {
          runRapid(post, 86.6, 18.7, 1);
          runLinear(post, 86.6, 18.7, -0.7, 1206, true);
          runArc(post, PLANE_ZX, true, 86.9, 18.7, -0.7, 86.9, 18.7, -1, 1206);
        },
        (post) => {
          runRapid(post, 96.2, 30.4, 5);
          runLinear(post, 96.2, 30.4, 1, 67.5, true);
          runLinear(post, 96.2, 30.4, -2.4, 67.5);
        }
      ]);
    },
    targets: [
      {
        fileName: "split-by-tool_1_T1.nc",
        fixturePath: "fixtures/expected/fusion/split-file/split-by-tool_1_T1.nc",
        expectedGap: scenarioDepthGap("Split-file startup and shutdown now align, but the scenario only drives the first pocket entry instead of the full roughing path.")
      },
      {
        fileName: "split-by-tool_2_T2.nc",
        fixturePath: "fixtures/expected/fusion/split-file/split-by-tool_2_T2.nc",
        expectedGap: scenarioDepthGap("The T2 subfile reproduces the header and entry arc. The captured bore file continues many circular passes that the mock scenario does not yet drive.")
      },
      {
        fileName: "split-by-tool_3_T1.nc",
        fixturePath: "fixtures/expected/fusion/split-file/split-by-tool_3_T1.nc",
        expectedGap: scenarioDepthGap("The restart-sensitive outer-profile file matches through startup and initial plunge, then diverges because the full profile path is not replayed.")
      }
    ]
  },
  {
    name: "split-by-toolpath",
    async run(loadOriginal) {
      return runSections(loadOriginal, {
        programName: "split-by-toolpath",
        properties: {
          splitFile: "toolpath",
          optionalStop: false,
          safeStartAllOperations: false,
          minimumSegmentLength: 0.1
        },
        sections: splitSections
      }, [
        (post) => {
          runRapid(post, 42.264, 27.091, 5);
          runLinear(post, 42.264, 27.091, 3.1, 333.3, true);
        },
        (post) => {
          runRapid(post, 86.6, 18.7, 1);
          runLinear(post, 86.6, 18.7, -0.7, 1206, true);
          runArc(post, PLANE_ZX, true, 86.9, 18.7, -0.7, 86.9, 18.7, -1, 1206);
        },
        (post) => {
          runRapid(post, 96.2, 30.4, 5);
          runLinear(post, 96.2, 30.4, 1, 67.5, true);
          runLinear(post, 96.2, 30.4, -2.4, 67.5);
        }
      ]);
    },
    targets: [
      {
        fileName: "split-by-toolpath_1_01_rough_pocket_t1_T1.nc",
        fixturePath: "fixtures/expected/fusion/split-file/split-by-toolpath_1_01_rough_pocket_t1_T1.nc",
        expectedGap: scenarioDepthGap("Per-toolpath file naming and startup state match. The mock trace is intentionally truncated after the first pocket-entry motion.")
      },
      {
        fileName: "split-by-toolpath_2_02_bore_12mm_t2_T2.nc",
        fixturePath: "fixtures/expected/fusion/split-file/split-by-toolpath_2_02_bore_12mm_t2_T2.nc",
        expectedGap: scenarioDepthGap("Per-toolpath T2 startup aligns, but the repeated bore circles from the captured subfile are not replayed yet.")
      },
      {
        fileName: "split-by-toolpath_3_03_outer_profile_t1_T1.nc",
        fixturePath: "fixtures/expected/fusion/split-file/split-by-toolpath_3_03_outer_profile_t1_T1.nc",
        expectedGap: scenarioDepthGap("The outer-profile subfile matches through the restart block, then diverges because only the entry plunge is simulated.")
      }
    ]
  },
  {
    name: "split-by-tool safe-start",
    async run(loadOriginal) {
      return runSections(loadOriginal, {
        programName: "split-by-tool-safe-start",
        properties: {
          splitFile: "tool",
          optionalStop: false,
          safeStartAllOperations: true,
          minimumSegmentLength: 0.1
        },
        sections: splitSections
      }, [
        (post) => {
          runRapid(post, 42.264, 27.091, 5);
          runLinear(post, 42.264, 27.091, 3.1, 333.3, true);
        },
        (post) => {
          runRapid(post, 86.6, 18.7, 1);
          runLinear(post, 86.6, 18.7, -0.7, 1206, true);
          runArc(post, PLANE_ZX, true, 86.9, 18.7, -0.7, 86.9, 18.7, -1, 1206);
        },
        (post) => {
          runRapid(post, 96.2, 30.4, 5);
          runLinear(post, 96.2, 30.4, 1, 67.5, true);
          runLinear(post, 96.2, 30.4, -2.4, 67.5);
        }
      ]);
    },
    targets: [
      {
        fileName: "split-by-tool-safe-start_1_T1.nc",
        fixturePath: "fixtures/expected/fusion/split-file/split-by-tool-safe-start_1_T1.nc",
        expectedGap: scenarioDepthGap("Safe-start subfile setup is covered, but the full rough pocket is not replayed.")
      },
      {
        fileName: "split-by-tool-safe-start_2_T2.nc",
        fixturePath: "fixtures/expected/fusion/split-file/split-by-tool-safe-start_2_T2.nc",
        expectedGap: scenarioDepthGap("Safe-start plus T2 restart lines align through the entry arc. The captured file then continues the full bore pattern.")
      },
      {
        fileName: "split-by-tool-safe-start_3_T1.nc",
        fixturePath: "fixtures/expected/fusion/split-file/split-by-tool-safe-start_3_T1.nc",
        expectedGap: scenarioDepthGap("The safe-start outer-profile capture contains a much longer profile path than the current mock scenario drives.")
      }
    ]
  },
  {
    name: "tiny no-filter",
    async run(loadOriginal) {
      return runSections(loadOriginal, {
        programName: "no-filter",
        properties: {
          minimumSegmentLength: 0,
          fluidncArcTolerance: 0.002,
          useCoolant: true
        },
        sections: tinySections
      }, [
        (post) => {
          runRapid(post, -1.4, 26.549, 5);
          runLinear(post, -1.4, 26.549, 0.6, 402, true);
          runLinear(post, -1.4, 26.549, -2.7, 402, true);
          runArc(post, PLANE_ZX, true, -1.1, 26.549, -2.7, -1.1, 26.549, -3, 1206);
          runLinear(post, -0.8, 26.549, -3, 1206, true);
          runArc(post, PLANE_XY, false, -0.8, 26.849, -3, -0.5, 26.849, -3, 1206);
          runLinear(post, -0.5, 51, -3, 1206, true);
          runLinear(post, -0.5, 51.396, -3, 1206, true);
          runLinear(post, -0.304, 51.741, -3, 1206);
        },
        (post) => {
          runRapid(post, 74.6, 15.7, 1);
          runLinear(post, 74.6, 15.7, -0.7, 1206, true);
          runArc(post, PLANE_ZX, true, 74.9, 15.7, -0.7, 74.9, 15.7, -1, 1206);
          runLinear(post, 75.05, 15.7, -1, 1206, true);
          runArc(post, PLANE_XY, false, 75.05, 16, -1, 75.35, 16, -1, 1206);
        }
      ]);
    },
    targets: [
      {
        fixturePath: "fixtures/expected/fusion/tiny-segment-storm/no-filter.nc",
        expectedGap: scenarioDepthGap("The scenario covers startup, the first dense-region arc handoff, and the second-section restart, but not the remaining hundreds of micro-segments.")
      }
    ]
  },
  {
    name: "tiny default-filter",
    async run(loadOriginal) {
      return runSections(loadOriginal, {
        programName: "default-filter",
        properties: {
          minimumSegmentLength: 0.05,
          fluidncArcTolerance: 0.002,
          useCoolant: true
        },
        sections: tinySections
      }, [
        (post) => {
          runRapid(post, -1.4, 26.549, 5);
          runLinear(post, -1.4, 26.549, 0.6, 402, true);
          runLinear(post, -1.4, 26.549, -2.7, 402, true);
          runArc(post, PLANE_ZX, true, -1.1, 26.549, -2.7, -1.1, 26.549, -3, 1206);
          runLinear(post, -0.8, 26.549, -3, 1206, true);
          runArc(post, PLANE_XY, false, -0.8, 26.849, -3, -0.5, 26.849, -3, 1206);
          runLinear(post, -0.5, 51, -3, 1206, true);
          runLinear(post, -0.5, 51.396, -3, 1206, true);
          runLinear(post, -0.304, 51.741, -3, 1206);
        },
        (post) => {
          runRapid(post, 74.6, 15.7, 1);
          runLinear(post, 74.6, 15.7, -0.7, 1206, true);
          runArc(post, PLANE_ZX, true, 74.9, 15.7, -0.7, 74.9, 15.7, -1, 1206);
          runLinear(post, 75.05, 15.7, -1, 1206, true);
          runArc(post, PLANE_XY, false, 75.05, 16, -1, 75.35, 16, -1, 1206);
        }
      ]);
    },
    targets: [
      {
        fixturePath: "fixtures/expected/fusion/tiny-segment-storm/default-filter.nc",
        expectedGap: scenarioDepthGap("The filter level and startup match the captured run, but the scenario intentionally stops after the first dense-region prefix and second-section restart.")
      }
    ]
  },
  {
    name: "tiny aggressive-filter",
    async run(loadOriginal) {
      return runSections(loadOriginal, {
        programName: "aggressive-filter",
        properties: {
          minimumSegmentLength: 0.1,
          fluidncArcTolerance: 0.002,
          useCoolant: true
        },
        sections: tinySections
      }, [
        (post) => {
          runRapid(post, -1.4, 26.549, 5);
          runLinear(post, -1.4, 26.549, 0.6, 402, true);
          runLinear(post, -1.4, 26.549, -2.7, 402, true);
          runArc(post, PLANE_ZX, true, -1.1, 26.549, -2.7, -1.1, 26.549, -3, 1206);
          runLinear(post, -0.8, 26.549, -3, 1206, true);
          runArc(post, PLANE_XY, false, -0.8, 26.849, -3, -0.5, 26.849, -3, 1206);
          runLinear(post, -0.5, 51, -3, 1206, true);
          runLinear(post, -0.5, 51.396, -3, 1206, true);
          runLinear(post, -0.304, 51.741, -3, 1206);
        },
        (post) => {
          runRapid(post, 74.6, 15.7, 1);
          runLinear(post, 74.6, 15.7, -0.7, 1206, true);
          runArc(post, PLANE_ZX, true, 74.9, 15.7, -0.7, 74.9, 15.7, -1, 1206);
          runLinear(post, 75.05, 15.7, -1, 1206, true);
          runArc(post, PLANE_XY, false, 75.05, 16, -1, 75.35, 16, -1, 1206);
        }
      ]);
    },
    targets: [
      {
        fixturePath: "fixtures/expected/fusion/tiny-segment-storm/aggressive-filter.nc",
        expectedGap: scenarioDepthGap("Aggressive filtering changes the captured dense-region tail, but the current mock scenario still stops after the shared startup prefix.")
      }
    ]
  }
];

if (!fs.existsSync(originalPath)) {
  console.log(`Skipping original fixture audit because the original post was not found at ${originalPath}.`);
  process.exit(0);
}

let possibleHostGaps = 0;
const counts = {
  match: 0,
  scenario_depth_gap: 0,
  scenario_metadata_gap: 0,
  possible_host_gap: 0
};

for (const scenario of fixtureAuditScenarios) {
  const post = await scenario.run((options = {}) => loadPost({
    ...options,
    cpsPath: originalPath
  }));

  console.log(`\n${scenario.name}`);
  for (const target of scenario.targets) {
    const expectedText = fs.readFileSync(path.join(repoRoot, target.fixturePath), "utf8");
    const actualText = getText(post, target);
    const diff = diffText(expectedText, actualText);
    const outcome = classifyTarget(target, diff, post.warnings);

    counts[outcome.classification] += 1;
    if (outcome.classification === "possible_host_gap") {
      possibleHostGaps += 1;
    }

    if (outcome.classification === "match") {
      console.log(`  PASS ${target.fileName ?? path.basename(target.fixturePath)} exact match`);
      continue;
    }

    console.log(`  ${outcome.classification.toUpperCase()} ${target.fileName ?? path.basename(target.fixturePath)}`);
    console.log(`    matched prefix lines: ${diff.matchedPrefixLines}`);
    console.log(`    first diff line ${diff.line}: expected "${diff.expected}" actual "${diff.actual}"`);
    console.log(`    note: ${outcome.note}`);
    if (post.warnings.length > 0) {
      console.log(`    warnings: ${post.warnings.join(" | ")}`);
    }
  }
}

console.log("\nSummary");
console.log(`  match: ${counts.match}`);
console.log(`  scenario_depth_gap: ${counts.scenario_depth_gap}`);
console.log(`  scenario_metadata_gap: ${counts.scenario_metadata_gap}`);
console.log(`  possible_host_gap: ${counts.possible_host_gap}`);

if (possibleHostGaps > 0) {
  process.exitCode = 1;
}
