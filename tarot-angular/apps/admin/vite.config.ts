import { defineConfig } from "vite";
import analog from "@analogjs/platform";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => ({
  root: import.meta.dirname,
  publicDir: "public",
  build: {
    outDir: "dist/client",
    target: ["es2022"],
  },
  plugins: [
    analog({
      ssr: false,
      static: true,
      prerender: {
        routes: [],
      },
    }),
    tsconfigPaths(),
  ],
  optimizeDeps: {
    include: ["chart.js/auto"],
  },
}));
