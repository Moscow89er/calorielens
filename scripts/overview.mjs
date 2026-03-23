#!/usr/bin/env node

import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const API_ROOT = path.join(ROOT, "apps", "api");
const MODULES_DIR = path.join(API_ROOT, "src", "modules");
const SHARED_INDEX = path.join(ROOT, "packages", "shared", "src", "index.ts");
const PRISMA_SCHEMA = path.join(API_ROOT, "prisma", "schema.prisma");
const OUTPUT_FILE = path.join(ROOT, "docs", "OVERVIEW.md");

async function pathExists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function findPackages(baseDir) {
  const result = [];

  if (!(await pathExists(baseDir))) {
    return result;
  }

  const entries = await readdir(baseDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const packageDir = path.join(baseDir, entry.name);
    const packageJsonPath = path.join(packageDir, "package.json");

    if (!(await pathExists(packageJsonPath))) {
      continue;
    }

    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
    result.push({
      name: packageJson.name ?? entry.name,
      dir: path.relative(ROOT, packageDir),
      scripts: Object.keys(packageJson.scripts ?? {}),
    });
  }

  return result;
}

function normalizeEndpointPath(parts) {
  const cleaned = parts
    .filter((part) => part !== undefined && part !== null)
    .map((part) => String(part).trim())
    .filter((part) => part.length > 0)
    .map((part) => part.replace(/^\/+|\/+$/g, ""));

  return `/${cleaned.join("/")}`.replace(/\/+/g, "/");
}

async function parseControllerFile(filePath) {
  const source = await readFile(filePath, "utf8");

  const controllerMatch = source.match(/@Controller\((?:['"`]([^'"`]+)['"`])?\)/);
  const controllerBasePath = controllerMatch?.[1] ?? "";

  const endpoints = [];
  const lines = source.split(/\r?\n/);
  let pendingMethod = null;
  let pendingPath = "";

  for (const line of lines) {
    const httpMatch = line.match(/@(Get|Post|Put|Patch|Delete)\((?:['"`]([^'"`]*)['"`])?\)/);

    if (httpMatch) {
      pendingMethod = httpMatch[1].toUpperCase();
      pendingPath = httpMatch[2] ?? "";
      continue;
    }

    if (pendingMethod && /^\s*[a-zA-Z0-9_]+\s*\(/.test(line)) {
      endpoints.push({
        method: pendingMethod,
        path: normalizeEndpointPath(["api", controllerBasePath, pendingPath]),
      });
      pendingMethod = null;
      pendingPath = "";
    }
  }

  return endpoints;
}

async function collectEndpoints() {
  const endpoints = [];

  if (!(await pathExists(MODULES_DIR))) {
    return endpoints;
  }

  const moduleEntries = await readdir(MODULES_DIR, { withFileTypes: true });

  for (const moduleEntry of moduleEntries) {
    if (!moduleEntry.isDirectory()) {
      continue;
    }

    const moduleName = moduleEntry.name;
    const moduleDir = path.join(MODULES_DIR, moduleName);
    const files = await readdir(moduleDir, { withFileTypes: true });

    for (const fileEntry of files) {
      if (!fileEntry.isFile() || !fileEntry.name.endsWith(".controller.ts")) {
        continue;
      }

      const controllerPath = path.join(moduleDir, fileEntry.name);
      const parsed = await parseControllerFile(controllerPath);

      for (const endpoint of parsed) {
        endpoints.push({
          ...endpoint,
          module: moduleName,
        });
      }
    }
  }

  return endpoints.sort((a, b) => {
    if (a.path === b.path) {
      return a.method.localeCompare(b.method);
    }
    return a.path.localeCompare(b.path);
  });
}

async function collectModules() {
  if (!(await pathExists(MODULES_DIR))) {
    return [];
  }

  const entries = await readdir(MODULES_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function collectSharedExports() {
  if (!(await pathExists(SHARED_INDEX))) {
    return [];
  }

  const source = await readFile(SHARED_INDEX, "utf8");
  const matches = source.matchAll(/export\s+\*\s+from\s+['"`]([^'"`]+)['"`]/g);

  return Array.from(matches, (match) => match[1]).sort((a, b) => a.localeCompare(b));
}

async function collectPrismaSummary() {
  if (!(await pathExists(PRISMA_SCHEMA))) {
    return { models: [], enums: [] };
  }

  const schema = await readFile(PRISMA_SCHEMA, "utf8");
  const models = Array.from(schema.matchAll(/^model\s+([A-Za-z0-9_]+)\s+\{/gm), (m) => m[1]);
  const enums = Array.from(schema.matchAll(/^enum\s+([A-Za-z0-9_]+)\s+\{/gm), (m) => m[1]);

  return { models, enums };
}

function renderOverview({
  packages,
  modules,
  endpoints,
  sharedExports,
  prisma,
}) {
  const generatedAt = new Date().toISOString();

  const packageLines =
    packages.length === 0
      ? ["- (не найдено)"]
      : packages.map((pkg) => {
          const scriptsPreview = pkg.scripts.length > 0 ? pkg.scripts.join(", ") : "-";
          return `- \`${pkg.name}\` (\`${pkg.dir}\`) — scripts: ${scriptsPreview}`;
        });

  const moduleLines =
    modules.length === 0 ? ["- (не найдено)"] : modules.map((moduleName) => `- \`${moduleName}\``);

  const endpointLines =
    endpoints.length === 0
      ? ["| - | - | - |", "|---|---|---|"]
      : [
          "| Method | Path | Module |",
          "|---|---|---|",
          ...endpoints.map((endpoint) => {
            return `| \`${endpoint.method}\` | \`${endpoint.path}\` | \`${endpoint.module}\` |`;
          }),
        ];

  const sharedLines =
    sharedExports.length === 0
      ? ["- (не найдено)"]
      : sharedExports.map((entry) => `- \`${entry}\``);

  const prismaModelLines =
    prisma.models.length === 0 ? ["- (не найдено)"] : prisma.models.map((model) => `- \`${model}\``);
  const prismaEnumLines =
    prisma.enums.length === 0 ? ["- (не найдено)"] : prisma.enums.map((entry) => `- \`${entry}\``);

  return [
    "# Overview",
    "",
    `Автосводка по проекту. Сгенерировано: \`${generatedAt}\`.`,
    "",
    "## Workspaces",
    ...packageLines,
    "",
    "## API Modules",
    ...moduleLines,
    "",
    "## API Endpoints",
    ...endpointLines,
    "",
    "## Shared Exports (`packages/shared/src/index.ts`)",
    ...sharedLines,
    "",
    "## Prisma Summary",
    "### Models",
    ...prismaModelLines,
    "### Enums",
    ...prismaEnumLines,
    "",
    "## Sources",
    "- `apps/api/src/modules/*/*.controller.ts`",
    "- `apps/api/prisma/schema.prisma`",
    "- `packages/shared/src/index.ts`",
    "- `apps/*/package.json`, `packages/*/package.json`",
    "",
  ].join("\n");
}

async function main() {
  const [appsPackages, libraryPackages, modules, endpoints, sharedExports, prisma] =
    await Promise.all([
      findPackages(path.join(ROOT, "apps")),
      findPackages(path.join(ROOT, "packages")),
      collectModules(),
      collectEndpoints(),
      collectSharedExports(),
      collectPrismaSummary(),
    ]);

  const markdown = renderOverview({
    packages: [...appsPackages, ...libraryPackages].sort((a, b) => a.name.localeCompare(b.name)),
    modules,
    endpoints,
    sharedExports,
    prisma,
  });

  await writeFile(OUTPUT_FILE, markdown, "utf8");
  process.stdout.write(`Generated ${path.relative(ROOT, OUTPUT_FILE)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});

