import { resolve } from "path";
import { defineConfig } from "vite";
import dtsPlugin from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "./src/index.ts"),
      name: "index",
      fileName: "index",
      formats: ["cjs"],
    },
    outDir: "cjs",
  },
  plugins: [dtsPlugin({ rollupTypes: true })],
});
