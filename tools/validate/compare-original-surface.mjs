import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const currentPath = path.join(repoRoot, "adapters", "fusion", "FluidNC.cps");
const originalPath = "C:\\Users\\540ly\\AppData\\Roaming\\Autodesk\\Fusion 360 CAM\\Posts\\FluidNC.cps";

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function extractFunctions(source) {
  return [...source.matchAll(/function\s+([A-Za-z0-9_]+)\s*\(/g)].map((match) => match[1]);
}

function extractProperties(source) {
  const match = source.match(/properties\s*=\s*\{([\s\S]*?)\n\};/);
  const body = match ? match[1] : "";
  return [...body.matchAll(/^\s*([A-Za-z0-9_]+)\s*:\s*\{/gm)].map((propertyMatch) => propertyMatch[1]);
}

if (!fs.existsSync(originalPath)) {
  console.log(`Original adapter not found at ${originalPath}.`);
  process.exit(0);
}

const currentSource = readText(currentPath);
const originalSource = readText(originalPath);

const currentFunctions = new Set(extractFunctions(currentSource));
const originalFunctions = new Set(extractFunctions(originalSource));
const currentProperties = new Set(extractProperties(currentSource));
const originalProperties = new Set(extractProperties(originalSource));

const missingFunctions = [...originalFunctions].filter((name) => !currentFunctions.has(name));
const extraFunctions = [...currentFunctions].filter((name) => !originalFunctions.has(name));
const missingProperties = [...originalProperties].filter((name) => !currentProperties.has(name));
const extraProperties = [...currentProperties].filter((name) => !originalProperties.has(name));

console.log("Original Surface Comparison");
console.log(`Current adapter:  ${currentPath}`);
console.log(`Original adapter: ${originalPath}`);
console.log("");
console.log(`Functions in original: ${originalFunctions.size}`);
console.log(`Functions in current:  ${currentFunctions.size}`);
console.log(`Properties in original: ${originalProperties.size}`);
console.log(`Properties in current:  ${currentProperties.size}`);
console.log("");

if (missingFunctions.length > 0) {
  console.log("Missing functions:");
  for (const name of missingFunctions) {
    console.log(`- ${name}`);
  }
}

if (missingProperties.length > 0) {
  console.log("Missing properties:");
  for (const name of missingProperties) {
    console.log(`- ${name}`);
  }
}

if (extraFunctions.length > 0) {
  console.log("Extra current-only functions:");
  for (const name of extraFunctions) {
    console.log(`- ${name}`);
  }
}

if (extraProperties.length > 0) {
  console.log("Extra current-only properties:");
  for (const name of extraProperties) {
    console.log(`- ${name}`);
  }
}

if (missingFunctions.length > 0 || missingProperties.length > 0) {
  process.exitCode = 1;
} else {
  console.log("Current adapter includes every original function name and property name.");
}
