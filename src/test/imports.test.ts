import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..", "..");
const SRC = join(ROOT, "src");

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const installed = new Set([
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.devDependencies ?? {}),
]);

// Imports that don't need to be in package.json
const BUILTIN_OR_ALIAS = (spec: string) => {
  if (spec.startsWith(".") || spec.startsWith("/")) return true; // relative
  if (spec.startsWith("@/")) return true; // src alias
  if (spec.startsWith("node:")) return true;
  // Node built-ins (small set used in tests)
  if (["fs", "path", "url", "crypto", "os", "stream", "util"].includes(spec)) return true;
  return false;
};

// Extract the package name from an import specifier.
// e.g. "@dnd-kit/core/something" -> "@dnd-kit/core"
//      "react-router-dom/x"      -> "react-router-dom"
const pkgName = (spec: string): string => {
  const parts = spec.split("/");
  if (spec.startsWith("@")) return parts.slice(0, 2).join("/");
  return parts[0];
};

const walk = (dir: string, out: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
};

const IMPORT_RE = /(?:^|\n)\s*(?:import|export)[^'"\n;]*?from\s*['"]([^'"]+)['"]/g;
const SIDE_EFFECT_RE = /(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g;
const DYNAMIC_RE = /import\(\s*['"]([^'"]+)['"]\s*\)/g;

describe("import resolution guardrail", () => {
  it("every bare import in src/ is declared in package.json", () => {
    const files = walk(SRC);
    const missing: string[] = [];

    for (const file of files) {
      const code = readFileSync(file, "utf8");
      const specs = new Set<string>();
      for (const re of [IMPORT_RE, SIDE_EFFECT_RE, DYNAMIC_RE]) {
        let m;
        while ((m = re.exec(code)) !== null) specs.add(m[1]);
      }
      for (const spec of specs) {
        if (BUILTIN_OR_ALIAS(spec)) continue;
        const name = pkgName(spec);
        if (!installed.has(name)) {
          missing.push(`"${name}" imported in ${file.replace(ROOT + "/", "")} (from "${spec}")`);
        }
      }
    }

    expect(missing, `Missing packages in package.json:\n${missing.join("\n")}`).toEqual([]);
  });
});
