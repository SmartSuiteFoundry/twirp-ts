import { applyEsmExtensions } from "./index.js";

// Not top-level await: tshy builds this file as CommonJS too, where it is a
// syntax error, even though only the ESM copy is ever run.
const main = async (): Promise<void> => {
  const root = process.argv[2] ?? "src";
  const { changed, unresolved } = await applyEsmExtensions(root);

  console.log(
    `esm-extensions: rewrote ${changed.length} file(s) under ${root}`
  );

  if (unresolved.length > 0) {
    console.error(
      `esm-extensions: could not resolve:\n  ${unresolved.join("\n  ")}`
    );
    process.exit(1);
  }
};

void main();
