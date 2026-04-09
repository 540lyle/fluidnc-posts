import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { differentialScenarios } from "../../tests/adapters/fusion-differential-scenarios.mjs";
import { defaultOriginalPostPath, IN, loadPost, repoCpsPath } from "../../tests/support/fusion-host.mjs";

const originalPath = process.env.FLUIDNC_ORIGINAL_POST ?? defaultOriginalPostPath;

function snapshotPost(post) {
  const fileNames = post.getFileNames();
  const redirectedFiles = {};

  for (const fileName of fileNames) {
    redirectedFiles[fileName] = post.getFileText(fileName);
  }

  return {
    mainText: post.getMainText(),
    fileNames,
    redirectedFiles
  };
}

function diffText(expected, actual) {
  const expectedLines = expected.split("\n");
  const actualLines = actual.split("\n");
  const limit = Math.max(expectedLines.length, actualLines.length);

  for (let index = 0; index < limit; index += 1) {
    if (expectedLines[index] !== actualLines[index]) {
      return {
        line: index + 1,
        expected: expectedLines[index] ?? "<EOF>",
        actual: actualLines[index] ?? "<EOF>"
      };
    }
  }

  return null;
}

function diffPrefix(expected, actual) {
  const expectedLines = expected.split("\n");
  const actualLines = actual.split("\n");

  for (let index = 0; index < actualLines.length; index += 1) {
    if (expectedLines[index] !== actualLines[index]) {
      return {
        line: index + 1,
        expected: expectedLines[index] ?? "<EOF>",
        actual: actualLines[index] ?? "<EOF>"
      };
    }
  }

  if (actualLines.length > expectedLines.length) {
    return {
      line: expectedLines.length + 1,
      expected: "<EOF>",
      actual: actualLines[expectedLines.length]
    };
  }

  return null;
}

function checkTextRules(actual, rules = []) {
  for (const rule of rules) {
    if (rule.type === "include") {
      if (!actual.includes(rule.text)) {
        return `missing required text "${rule.text}".`;
      }
    } else if (rule.type === "exclude") {
      if (actual.includes(rule.text)) {
        return `found forbidden text "${rule.text}".`;
      }
    } else {
      return `unknown rule type "${rule.type}".`;
    }
  }

  return null;
}

function compareSnapshots(scenarioName, expectedPosts, actualPosts) {
  const failures = [];

  if (expectedPosts.length !== actualPosts.length) {
    failures.push(`${scenarioName}: original created ${expectedPosts.length} post instance(s), rewrite created ${actualPosts.length}.`);
    return failures;
  }

  for (let index = 0; index < expectedPosts.length; index += 1) {
    const expected = expectedPosts[index];
    const actual = actualPosts[index];
    const label = `${scenarioName} [post ${index + 1}]`;

    const mainDiff = diffText(expected.mainText, actual.mainText);
    if (mainDiff) {
      failures.push(`${label}: main NC differs at line ${mainDiff.line}. expected "${mainDiff.expected}" actual "${mainDiff.actual}".`);
    }

    if (expected.fileNames.join("\n") !== actual.fileNames.join("\n")) {
      failures.push(`${label}: redirected file list differs. expected [${expected.fileNames.join(", ")}] actual [${actual.fileNames.join(", ")}].`);
      continue;
    }

    for (const fileName of expected.fileNames) {
      const redirectedDiff = diffText(expected.redirectedFiles[fileName], actual.redirectedFiles[fileName]);
      if (redirectedDiff) {
        failures.push(`${label}: redirected file ${fileName} differs at line ${redirectedDiff.line}. expected "${redirectedDiff.expected}" actual "${redirectedDiff.actual}".`);
      }
    }
  }

  return failures;
}

if (!fs.existsSync(originalPath)) {
  console.log(`Skipping differential output test because the original post was not found at ${originalPath}. Set FLUIDNC_ORIGINAL_POST to override the default location.`);
  process.exit(0);
}

let failures = 0;

for (const scenario of differentialScenarios) {
  try {
    if (Array.isArray(scenario.fixtureChecks) && scenario.fixtureChecks.length > 0) {
      const rewriteInstances = await scenario.run(async function loadRewrite(options = {}) {
        return loadPost({
          ...options,
          cpsPath: repoCpsPath
        });
      }, { IN });

      if (rewriteInstances.length !== scenario.fixtureChecks.length) {
        failures += 1;
        console.error(`FAIL ${scenario.name}`);
        console.error(`${scenario.name}: scenario returned ${rewriteInstances.length} post instance(s), but fixtureChecks has ${scenario.fixtureChecks.length}.`);
        continue;
      }

      let scenarioFailed = false;
      for (let index = 0; index < rewriteInstances.length; index += 1) {
        const actualText = snapshotPost(rewriteInstances[index]).mainText;
        const failure = checkTextRules(actualText, scenario.fixtureChecks[index]);
        if (failure) {
          failures += 1;
          scenarioFailed = true;
          console.error(`FAIL ${scenario.name}`);
          console.error(`${scenario.name} [post ${index + 1}]: ${failure}`);
          break;
        }
      }

      if (!scenarioFailed) {
        console.log(`PASS ${scenario.name}`);
      }
      continue;
    }

    if (Array.isArray(scenario.fixturePrefixPaths) && scenario.fixturePrefixPaths.length > 0) {
      const rewriteInstances = await scenario.run(async function loadRewrite(options = {}) {
        return loadPost({
          ...options,
          cpsPath: repoCpsPath
        });
      }, { IN });

      if (rewriteInstances.length !== scenario.fixturePrefixPaths.length) {
        failures += 1;
        console.error(`FAIL ${scenario.name}`);
        console.error(`${scenario.name}: scenario returned ${rewriteInstances.length} post instance(s), but fixturePrefixPaths has ${scenario.fixturePrefixPaths.length}.`);
        continue;
      }

      let scenarioFailed = false;
      for (let index = 0; index < rewriteInstances.length; index += 1) {
        const fixturePath = path.resolve(process.cwd(), scenario.fixturePrefixPaths[index]);
        const expectedFixture = fs.readFileSync(fixturePath, "utf8").replace(/\r\n/g, "\n");
        const actualText = snapshotPost(rewriteInstances[index]).mainText;
        const mismatch = diffPrefix(expectedFixture, actualText);
        if (mismatch) {
          failures += 1;
          scenarioFailed = true;
          console.error(`FAIL ${scenario.name}`);
          console.error(`${scenario.name} [post ${index + 1}]: fixture prefix differs at line ${mismatch.line}. expected "${mismatch.expected}" actual "${mismatch.actual}".`);
          break;
        }
      }

      if (!scenarioFailed) {
        console.log(`PASS ${scenario.name}`);
      }
      continue;
    }

    const originalInstances = await scenario.run(async function loadOriginal(options = {}) {
      return loadPost({
        ...options,
        cpsPath: originalPath
      });
    }, { IN });

    const rewriteInstances = await scenario.run(async function loadRewrite(options = {}) {
      return loadPost({
        ...options,
        cpsPath: repoCpsPath
      });
    }, { IN });

    const originalPosts = originalInstances.map(snapshotPost);
    const rewritePosts = rewriteInstances.map(snapshotPost);

    const mismatches = compareSnapshots(scenario.name, originalPosts, rewritePosts);
    if (mismatches.length > 0) {
      failures += mismatches.length;
      console.error(`FAIL ${scenario.name}`);
      for (const mismatch of mismatches) {
        console.error(mismatch);
      }
    } else {
      console.log(`PASS ${scenario.name}`);
    }
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${scenario.name}`);
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  }
}

if (failures > 0) {
  process.exitCode = 1;
}
