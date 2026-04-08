import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..", "..");
const cpsPath = path.join(repoRoot, "adapters", "fusion", "FluidNC.cps");

try {
  const source = await readFile(cpsPath, "utf8");
  new vm.Script(source, { filename: cpsPath, displayErrors: true });
  console.log(`Syntax OK: ${path.relative(repoRoot, cpsPath)}`);
} catch (error) {
  const detail = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`Syntax check failed for ${cpsPath}`);
  console.error(detail);
  process.exitCode = 1;
}
