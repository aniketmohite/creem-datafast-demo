import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    outDir: "dist",
    external: ["creem", "express"],
  },
  {
    entry: {
      browser: "src/client/browser.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    splitting: false,
    sourcemap: true,
    outDir: "dist",
    platform: "browser",
    external: [],
  },
]);
