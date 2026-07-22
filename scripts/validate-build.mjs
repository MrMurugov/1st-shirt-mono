import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "src");
const dataRoot = path.join(sourceRoot, "_data");
const outputRoot = path.join(projectRoot, "dist");
const pagesPrefix = "/1st-shirt/";
const missing = [];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(directory) {
  const result = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await listFiles(filePath));
    else result.push(filePath);
  }

  return result;
}

function collectAssetPaths(value, output = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectAssetPaths(item, output));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectAssetPaths(item, output));
  } else if (typeof value === "string" && value.startsWith("/assets/")) {
    output.push(value);
  }

  return output;
}

const dataFiles = (await listFiles(dataRoot)).filter((filePath) => filePath.endsWith(".json"));
let dataAssetCount = 0;

for (const filePath of dataFiles) {
  const data = JSON.parse(await readFile(filePath, "utf8"));
  const assetPaths = collectAssetPaths(data);
  dataAssetCount += assetPaths.length;

  for (const assetPath of assetPaths) {
    const sourcePath = path.join(sourceRoot, assetPath.slice(1));
    if (!await exists(sourcePath)) missing.push(`${path.relative(projectRoot, filePath)} → ${assetPath}`);
  }
}

const htmlFiles = (await listFiles(outputRoot)).filter((filePath) => filePath.endsWith(".html"));
let internalReferenceCount = 0;

for (const filePath of htmlFiles) {
  const html = await readFile(filePath, "utf8");
  const references = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);

  for (const reference of references) {
    if (!reference.startsWith(pagesPrefix)) continue;

    internalReferenceCount += 1;
    const cleanReference = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
    const relativePath = cleanReference.slice(pagesPrefix.length);
    const outputPath = relativePath === ""
      ? path.join(outputRoot, "index.html")
      : relativePath.endsWith("/")
        ? path.join(outputRoot, relativePath, "index.html")
        : path.join(outputRoot, relativePath);

    if (!await exists(outputPath)) missing.push(`${path.relative(projectRoot, filePath)} → ${reference}`);
  }
}

const cssFiles = (await listFiles(outputRoot)).filter((filePath) => filePath.endsWith(".css"));
let cssReferenceCount = 0;

for (const filePath of cssFiles) {
  const css = await readFile(filePath, "utf8");
  const references = [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((match) => match[1]);

  for (const reference of references) {
    if (/^(?:data:|https?:|#)/.test(reference)) continue;
    cssReferenceCount += 1;

    const outputPath = reference.startsWith(pagesPrefix)
      ? path.join(outputRoot, reference.slice(pagesPrefix.length))
      : path.resolve(path.dirname(filePath), reference);

    if (!await exists(outputPath)) missing.push(`${path.relative(projectRoot, filePath)} → ${reference}`);
  }
}

if (missing.length) {
  console.error(`Build validation failed: ${missing.length} missing reference(s).`);
  missing.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log(`Build validation passed: ${htmlFiles.length} pages, ${dataAssetCount} data assets, ${internalReferenceCount + cssReferenceCount} internal references.`);
