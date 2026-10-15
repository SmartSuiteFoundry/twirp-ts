import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applyEsmExtensions } from "../index.js";

let root: string;

const write = async (relative: string, contents: string): Promise<void> => {
  const path = join(root, relative);
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, contents);
};

const read = (relative: string): Promise<string> =>
  readFile(join(root, relative), "utf8");

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "esm-extensions-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("applyEsmExtensions", () => {
  it("adds .js to a sibling module", async () => {
    await write("sibling.ts", "export const a = 1;\n");
    await write("index.ts", 'export * from "./sibling";\n');

    await applyEsmExtensions(root);

    expect(await read("index.ts")).toBe('export * from "./sibling.js";\n');
  });

  it("resolves a directory to its index", async () => {
    await write("api/index.ts", "export const a = 1;\n");
    await write("index.ts", 'export * from "./api";\n');

    await applyEsmExtensions(root);

    expect(await read("index.ts")).toBe('export * from "./api/index.js";\n');
  });

  it("does not double the slash on a bare './'", async () => {
    await write("index.ts", "export const a = 1;\n");
    await write("index.test.ts", 'import { a } from "./";\n');

    await applyEsmExtensions(root);

    expect(await read("index.test.ts")).toBe('import { a } from "./index.js";\n');
  });

  it("leaves a specifier that already has an extension", async () => {
    await write("sibling.ts", "export const a = 1;\n");
    await write("index.ts", 'export * from "./sibling.js";\n');

    const { changed } = await applyEsmExtensions(root);

    expect(changed).toEqual([]);
    expect(await read("index.ts")).toBe('export * from "./sibling.js";\n');
  });

  it("leaves bare package specifiers alone", async () => {
    await write("index.ts", 'import { x } from "@protobuf-ts/runtime";\n');

    const { changed } = await applyEsmExtensions(root);

    expect(changed).toEqual([]);
  });

  it("reports a specifier it cannot resolve", async () => {
    await write("index.ts", 'export * from "./missing";\n');

    const { changed, unresolved } = await applyEsmExtensions(root);

    expect(changed).toEqual([]);
    expect(unresolved).toHaveLength(1);
    expect(unresolved[0]).toContain("./missing");
  });

  it("rewrites nested directories and reports each file once", async () => {
    await write("a/b/leaf.ts", "export const a = 1;\n");
    await write(
      "a/b/index.ts",
      'export * from "./leaf";\nexport * from "./leaf";\n',
    );

    const { changed } = await applyEsmExtensions(root);

    expect(changed).toHaveLength(1);
    expect(await read("a/b/index.ts")).toBe(
      'export * from "./leaf.js";\nexport * from "./leaf.js";\n',
    );
  });

  it("is idempotent", async () => {
    await write("sibling.ts", "export const a = 1;\n");
    await write("index.ts", 'export * from "./sibling";\n');

    await applyEsmExtensions(root);
    const { changed } = await applyEsmExtensions(root);

    expect(changed).toEqual([]);
  });

  it("skips declaration files", async () => {
    await write("sibling.ts", "export const a = 1;\n");
    await write("types.d.ts", 'export * from "./sibling";\n');

    const { changed } = await applyEsmExtensions(root);

    expect(changed).toEqual([]);
  });
});
