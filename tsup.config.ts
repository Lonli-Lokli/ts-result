import { defineConfig } from "tsup";

export default defineConfig({
  entryPoints: ["packages/ts-result/src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  outDir: "build/dist",
  clean: true,
});