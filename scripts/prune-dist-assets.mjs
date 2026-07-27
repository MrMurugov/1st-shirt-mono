import { readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const outputRoot = path.resolve(projectRoot, "dist");
const imageRoot = path.join(outputRoot, "assets", "images");
const pagesPrefix = "/1st-shirt/";

if (path.dirname(outputRoot) !== projectRoot || path.basename(outputRoot) !== "dist") {
  throw new Error(`Refusing to prune unexpected output path: ${outputRoot}`);
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

function outputPathFromReference(reference, sourceFile) {
  const cleanReference = reference.split(/[?#]/, 1)[0];
  if (!cleanReference || /^(?:data:|https?:|mailto:|tel:|#)/.test(cleanReference)) return null;

  if (cleanReference.startsWith(pagesPrefix)) {
    return path.join(outputRoot, cleanReference.slice(pagesPrefix.length));
  }

  if (cleanReference.startsWith("/assets/")) {
    return path.join(outputRoot, cleanReference.slice(1));
  }

  return path.resolve(path.dirname(sourceFile), cleanReference);
}

const referencedImages = new Set();
const sourceFiles = (await listFiles(outputRoot)).filter((filePath) => /\.(?:html|css|js)$/.test(filePath));

for (const filePath of sourceFiles) {
  const source = await readFile(filePath, "utf8");
  const references = [
    ...[...source.matchAll(/(?:href|src|content|data-gallery-src)="([^"]+)"/g)].map((match) => match[1]),
    ...[...source.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((match) => match[1])
  ];

  for (const reference of references) {
    const outputPath = outputPathFromReference(reference, filePath);
    if (outputPath?.startsWith(`${imageRoot}${path.sep}`)) referencedImages.add(outputPath);
  }
}

let removed = 0;

for (const filePath of await listFiles(imageRoot)) {
  if (referencedImages.has(filePath)) continue;
  await rm(filePath);
  removed += 1;
}

console.log(`Pruned ${removed} unreferenced production image(s).`);
