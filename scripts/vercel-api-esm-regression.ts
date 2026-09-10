import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = join(process.cwd(), "api");
const failures: string[] = [];

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : path.endsWith(".ts") ? [path] : [];
  });
}

for (const file of walk(root)) {
  const source = readFileSync(file, "utf8");
  const importPattern = /(?:from|import\(\s*)["'](\.{1,2}\/[^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = importPattern.exec(source))) {
    const specifier = match[1];
    if (!specifier.endsWith(".js")) failures.push(`${relative(process.cwd(), file)} -> ${specifier}`);
  }
}

if (failures.length) {
  console.error("Vercel API ESM import regression detected:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Vercel API ESM import regression: PASS");
