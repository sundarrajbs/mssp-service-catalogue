import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The public preview must never read or write real user data. This walks
 * every module reachable from the /preview routes and checks that none of
 * them is a repository, the Supabase client, a server action for catalogues,
 * or code that touches browser storage.
 */
const SRC = resolve(__dirname, "../..");

function resolveImport(from: string, spec: string): string | null {
  const base = spec.startsWith("@/") ? join(SRC, spec.slice(2)) : spec.startsWith(".") ? resolve(dirname(from), spec) : null;
  if (!base) return null; // a package from node_modules
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function reachableFrom(entries: string[]): Set<string> {
  const seen = new Set<string>();
  const queue = [...entries];
  while (queue.length) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const source = readFileSync(file, "utf8");
    // `import x from "y"`, `export … from "y"`, `import "y"` and `import("y")`.
    const pattern = /(?:import|export)[^'"]*?from\s+["']([^"']+)["']|import\s+["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;
    for (const match of source.matchAll(pattern)) {
      const target = resolveImport(file, match[1] ?? match[2] ?? match[3]);
      if (target) queue.push(target);
    }
  }
  return seen;
}

function previewEntries(dir = join(SRC, "app/preview")): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return previewEntries(path);
    return /\.(tsx?)$/.test(name) && !name.includes(".test.") ? [path] : [];
  });
}

describe("public preview isolation", () => {
  const files = [...reachableFrom(previewEntries())].map((f) => relative(SRC, f));

  it("reaches the preview's own modules", () => {
    expect(files).toContain("components/preview/PreviewProvider.tsx");
    expect(files).toContain("lib/seed/demo.ts");
  });

  it("never loads repositories, Supabase, catalogue server actions or the signed-in workspace", () => {
    const forbidden = files.filter((f) =>
      /^lib\/repository\/|^lib\/supabase\/|^lib\/workspace\/|^app\/app\/|^components\/workspace\//.test(f),
    );
    expect(forbidden).toEqual([]);
  });

  it("never touches browser storage", () => {
    const usingStorage = files.filter((f) => /localStorage|sessionStorage|indexedDB/.test(readFileSync(join(SRC, f), "utf8")));
    expect(usingStorage).toEqual([]);
  });
});
