import { build } from "esbuild";

const shared = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "browser",
  target: ["es2017", "chrome80", "safari13"],
};

await build({
  ...shared,
  format: "iife",
  globalName: "FATrack",
  minify: true,
  sourcemap: false,
  outfile: "dist/fa.min.js",
  banner: { js: "/* @freshaffiliates/track v1.0.0 | MIT */" },
});

await build({
  ...shared,
  format: "esm",
  minify: false,
  sourcemap: true,
  outfile: "dist/fa.esm.js",
});

await build({
  ...shared,
  format: "cjs",
  minify: false,
  sourcemap: true,
  outfile: "dist/fa.cjs.js",
});

import { execSync } from "child_process";
execSync("npx tsc --declaration --emitDeclarationOnly --outDir dist", { stdio: "inherit" });

console.log("✓ @freshaffiliates/track built → dist/");
