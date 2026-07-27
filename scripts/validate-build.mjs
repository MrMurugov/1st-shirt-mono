import { access, readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "src");
const dataRoot = path.join(sourceRoot, "_data");
const outputRoot = path.join(projectRoot, "dist");
const pagesPrefix = "/1st-shirt/";
const missing = [];
const violations = [];

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

function validateUnique(items, key, label) {
  const seen = new Set();

  for (const item of items) {
    const value = item?.[key];
    if (!value) {
      violations.push(`${label}: missing ${key}`);
      continue;
    }
    if (seen.has(value)) violations.push(`${label}: duplicate ${key} "${value}"`);
    seen.add(value);
  }
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

const products = JSON.parse(await readFile(path.join(dataRoot, "products.json"), "utf8"));
const categories = JSON.parse(await readFile(path.join(dataRoot, "categories.json"), "utf8"));
const printMethods = JSON.parse(await readFile(path.join(dataRoot, "printMethods.json"), "utf8"));
const solutions = JSON.parse(await readFile(path.join(dataRoot, "solutions.json"), "utf8"));
const cases = JSON.parse(await readFile(path.join(dataRoot, "cases.json"), "utf8"));

[
  [products, "products"],
  [categories, "categories"],
  [printMethods, "print methods"],
  [solutions, "solutions"],
  [cases, "cases"]
].forEach(([items, label]) => {
  validateUnique(items, "id", label);
  validateUnique(items, "slug", label);
});

const productIds = new Set(products.map((item) => item.id));
const categoryIds = new Set(categories.map((item) => item.id));
const printMethodIds = new Set(printMethods.map((item) => item.id));

for (const category of categories) {
  if (category.parentId && !categoryIds.has(category.parentId)) {
    violations.push(`${category.id}: unknown parent category "${category.parentId}"`);
  }
  if (category.parentId === category.id) {
    violations.push(`${category.id}: category cannot be its own parent`);
  }
}

for (const method of printMethods) {
  if (typeof method.imageAlt !== "string" || !method.imageAlt.trim()) {
    violations.push(`${method.id}: imageAlt is required`);
  }
}

for (const solution of solutions) {
  for (const productId of solution.productIds || []) {
    if (!productIds.has(productId)) {
      violations.push(`${solution.id}: unknown product "${productId}"`);
    }
  }
}

for (const caseItem of cases) {
  for (const productId of caseItem.productIds || []) {
    if (!productIds.has(productId)) {
      violations.push(`${caseItem.id}: unknown product "${productId}"`);
    }
  }
  for (const methodId of caseItem.printMethodIds || []) {
    if (!printMethodIds.has(methodId)) {
      violations.push(`${caseItem.id}: unknown print method "${methodId}"`);
    }
  }
}

const expectedGalleryRoles = [
  "studio-back-blank",
  "branding-detail",
  "lifestyle-primary",
  "lifestyle-secondary"
];

for (const product of products) {
  const label = product.id || product.name || "product-without-id";

  if (typeof product.image !== "string" || !product.image.endsWith(".webp")) {
    violations.push(`${label}: image must reference a WebP file`);
  }

  if (typeof product.imageAlt !== "string" || !product.imageAlt.trim()) {
    violations.push(`${label}: imageAlt is required`);
  }

  if (!categoryIds.has(product.categoryId)) {
    violations.push(`${label}: unknown category "${product.categoryId}"`);
  }

  for (const methodId of product.printMethods || []) {
    if (!printMethodIds.has(methodId)) {
      violations.push(`${label}: unknown print method "${methodId}"`);
    }
  }

  if (!Array.isArray(product.tierPrices) || product.tierPrices.length === 0) {
    violations.push(`${label}: tierPrices must contain at least one tier`);
  } else {
    product.tierPrices.forEach((tier, index) => {
      if (!Number.isFinite(tier.quantity) || tier.quantity <= 0) {
        violations.push(`${label}: tier ${index + 1} has invalid quantity`);
      }
      if (!Number.isFinite(tier.unitPrice) || tier.unitPrice <= 0) {
        violations.push(`${label}: tier ${index + 1} has invalid unitPrice`);
      }
      if (index > 0 && tier.quantity <= product.tierPrices[index - 1].quantity) {
        violations.push(`${label}: tier quantities must increase`);
      }
    });
  }

  if (!Array.isArray(product.gallery) || product.gallery.length !== 4) {
    violations.push(`${label}: gallery must contain exactly four secondary images`);
    continue;
  }

  product.gallery.forEach((media, index) => {
    const expectedRole = expectedGalleryRoles[index];

    if (!media || typeof media !== "object" || Array.isArray(media)) {
      violations.push(`${label}: gallery item ${index + 1} must be a media object`);
      return;
    }

    if (typeof media.src !== "string" || !media.src.endsWith(".webp")) {
      violations.push(`${label}: gallery item ${index + 1} must reference a WebP file`);
    }

    if (typeof media.alt !== "string" || !media.alt.trim()) {
      violations.push(`${label}: gallery item ${index + 1} requires alt text`);
    }

    if (media.role !== expectedRole) {
      violations.push(`${label}: gallery item ${index + 1} must use role "${expectedRole}"`);
    }
  });

  const mediaPaths = [product.image, ...product.gallery.map((media) => media.src)];
  if (new Set(mediaPaths).size !== mediaPaths.length) {
    violations.push(`${label}: all five product images must be unique`);
  }
}

const caseImageHashes = new Map();

for (const caseItem of cases) {
  const sourcePath = path.join(sourceRoot, caseItem.image.slice(1));
  if (!await exists(sourcePath)) continue;
  const hash = createHash("sha256").update(await readFile(sourcePath)).digest("hex");
  const previous = caseImageHashes.get(hash);
  if (previous) {
    violations.push(`${caseItem.id}: case image duplicates "${previous}" byte-for-byte`);
  } else {
    caseImageHashes.set(hash, caseItem.id);
  }
}

const htmlFiles = (await listFiles(outputRoot)).filter((filePath) => filePath.endsWith(".html"));
let internalReferenceCount = 0;

for (const filePath of htmlFiles) {
  const html = await readFile(filePath, "utf8");
  const references = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const seenIds = new Set();

  for (const id of ids) {
    if (seenIds.has(id)) {
      violations.push(`${path.relative(projectRoot, filePath)}: duplicate id "${id}"`);
    }
    seenIds.add(id);
  }

  if (references.includes("#")) {
    violations.push(`${path.relative(projectRoot, filePath)}: contains a no-op href="#"`);
  }

  if (!/<link rel="canonical" href="https:\/\//.test(html)) {
    violations.push(`${path.relative(projectRoot, filePath)}: canonical URL is missing`);
  }

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

if (missing.length || violations.length) {
  console.error(`Build validation failed: ${missing.length} missing reference(s), ${violations.length} media schema violation(s).`);
  missing.forEach((item) => console.error(`- ${item}`));
  violations.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log(`Build validation passed: ${htmlFiles.length} pages, ${dataAssetCount} data assets, ${internalReferenceCount + cssReferenceCount} internal references.`);
