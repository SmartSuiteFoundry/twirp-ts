import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

export interface EsmExtensionsResult {
  /** Files whose contents were rewritten. */
  changed: string[];
  /** Specifiers that resolved to neither a sibling module nor a directory index. */
  unresolved: string[];
}

// `from "./x"`, `import("./x")` - anything quoting a relative path.
const SPECIFIER = /(["'])(\.\.?\/[^"']*)\1/g;

const exists = async (path: string): Promise<boolean> => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};

const walk = async (dir: string): Promise<string[]> => {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts"))
      out.push(full);
  }
  return out;
};

const resolveSpecifier = async (
  fromFile: string,
  spec: string
): Promise<string | undefined> => {
  if (/\.(js|json|mjs|cjs)$/.test(spec)) return spec;
  const base = join(dirname(fromFile), spec);
  if (await exists(`${base}.ts`)) return `${spec}.js`;
  // A bare "./" would otherwise produce ".//index.js".
  if (await exists(join(base, "index.ts")))
    return `${spec.replace(/\/$/, "")}/index.js`;
  return undefined;
};

/**
 * Rewrites relative import specifiers under `root` to carry the explicit file
 * extension that nodenext requires.
 *
 * Neither protoc-gen-ts nor protoc-gen-twirp_ts emits them, so a package that
 * compiles its generated code as ESM has to add them after codegen.
 */
export const applyEsmExtensions = async (
  root: string
): Promise<EsmExtensionsResult> => {
  const from = resolve(root);
  const changed: string[] = [];
  const unresolved: string[] = [];

  for (const file of await walk(from)) {
    const source = await readFile(file, "utf8");
    const edits: [string, string][] = [];

    for (const match of source.matchAll(SPECIFIER)) {
      const next = await resolveSpecifier(file, match[2] as string);
      if (next === undefined) unresolved.push(`${file}: ${match[2]}`);
      else if (next !== match[2])
        edits.push([match[0], `${match[1]}${next}${match[1]}`]);
    }

    if (edits.length === 0) continue;
    let updated = source;
    for (const [before, after] of edits)
      updated = updated.split(before).join(after);
    await writeFile(file, updated);
    changed.push(file);
  }

  return { changed, unresolved };
};
