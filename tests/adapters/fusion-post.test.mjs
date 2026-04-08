import assert from "node:assert/strict";
import test from "node:test";

import { IN, loadPost } from "../support/fusion-host.mjs";
import { unitScenarios } from "./fusion-scenarios.mjs";

for (const scenario of unitScenarios) {
  test(scenario.name, async () => {
    await scenario.run(assert, loadPost, { IN });
  });
}
