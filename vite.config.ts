import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

type ChatApiModule = {
  handleChatRequest: (request: unknown, response: unknown) => Promise<void>;
  handleCardInsightRequest: (request: unknown, response: unknown) => Promise<void>;
};

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-motion": ["motion"],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icons/icon-192.svg", "icons/icon-512.svg"],
      manifest: {
        name: "Tarot dos Arcanos Maiores",
        short_name: "Tarot",
        start_url: "/",
        display: "standalone",
        background_color: "#0c0b0f",
        theme_color: "#0c0b0f",
        description: "Tiragens, diário e os 22 Arcanos Maiores de Marselha — espelho simbólico, não previsão.",
        lang: "pt-BR",
        icons: [
          {
            src: "/icons/icon-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: "/icons/icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff,woff2}"],
        globIgnores: ["**/tarot/cards/**", "**/tarot/thumbs/**", "**/NewsAdminPanel-*.js"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith("/tarot/cards/") || url.pathname.startsWith("/tarot/thumbs/"),
            handler: "CacheFirst",
            options: {
              cacheName: "tarot-card-art",
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
    {
      name: "tarot-chat-api",
      configureServer(server) {
        server.middlewares.use("/api/chat", async (request, response) => {
          // scripts/chat-api.mjs is a small Node-only helper used by dev and preview servers.
          // @ts-expect-error The script is plain ESM and intentionally not part of the TS app build.
          const { handleChatRequest } = (await import("./scripts/chat-api.mjs")) as ChatApiModule;

          await handleChatRequest(request, response);
        });
        server.middlewares.use("/api/interpret-card", async (request, response) => {
          // @ts-expect-error The script is plain ESM and intentionally not part of the TS app build.
          const { handleCardInsightRequest } = (await import("./scripts/chat-api.mjs")) as ChatApiModule;

          await handleCardInsightRequest(request, response);
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use("/api/chat", async (request, response) => {
          // @ts-expect-error The script is plain ESM and intentionally not part of the TS app build.
          const { handleChatRequest } = (await import("./scripts/chat-api.mjs")) as ChatApiModule;

          await handleChatRequest(request, response);
        });
        server.middlewares.use("/api/interpret-card", async (request, response) => {
          // @ts-expect-error The script is plain ESM and intentionally not part of the TS app build.
          const { handleCardInsightRequest } = (await import("./scripts/chat-api.mjs")) as ChatApiModule;

          await handleCardInsightRequest(request, response);
        });
      },
    },
  ],
});
