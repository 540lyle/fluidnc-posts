import assert from "node:assert/strict";
import process from "node:process";

import coverageLib from "istanbul-lib-coverage";
import instrumentLib from "istanbul-lib-instrument";

import { unitScenarios } from "../../tests/adapters/fusion-scenarios.mjs";
import { IN, loadPost } from "../../tests/support/fusion-host.mjs";

const coverageObject = {};
const { createCoverageMap } = coverageLib;
const { createInstrumenter } = instrumentLib;

const instrumenter = createInstrumenter({
  coverageVariable: "__coverage__",
  preserveComments: true
});

async function loadInstrumentedPost(options = {}) {
  return loadPost({
    ...options,
    coverageObject,
    sourceTransform(source, filename) {
      return instrumenter.instrumentSync(source, filename);
    }
  });
}

let failures = 0;

for (const scenario of unitScenarios) {
  try {
    await scenario.run(assert, loadInstrumentedPost, { IN });
    console.log(`PASS ${scenario.name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${scenario.name}`);
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  }
}

if (Object.keys(coverageObject).length === 0) {
  console.error("No coverage data was collected for adapters/fusion/FluidNC.cps.");
  process.exitCode = 1;
} else {
  const coverageMap = createCoverageMap(coverageObject);
  const summary = coverageMap.getCoverageSummary();
  const metrics = {
    statements: summary.statements.pct,
    branches: summary.branches.pct,
    functions: summary.functions.pct,
    lines: summary.lines.pct
  };

  console.log("");
  console.log("Coverage Summary");
  console.log(`Statements: ${metrics.statements}%`);
  console.log(`Branches: ${metrics.branches}%`);
  console.log(`Functions: ${metrics.functions}%`);
  console.log(`Lines: ${metrics.lines}%`);

  for (const [name, pct] of Object.entries(metrics)) {
    if (pct < 100) {
      console.error(`Coverage threshold failed for ${name}: expected 100, got ${pct}.`);
      process.exitCode = 1;
    }
  }
}

if (failures > 0) {
  process.exitCode = 1;
}
