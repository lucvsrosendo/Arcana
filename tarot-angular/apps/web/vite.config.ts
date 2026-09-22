import { defineConfig } from "vite";
import analog from "@analogjs/platform";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => ({
  root: import.meta.dirname,
  publicDir: "public",
  css: {
    postcss: {
      plugins: [],
    },
  },
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
    tailwindcss(),
    tsconfigPaths(),
  ],
}));
