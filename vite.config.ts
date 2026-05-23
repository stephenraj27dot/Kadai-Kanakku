// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        manifest: {
          name: "Baki Book - Kadai Kanakku",
          short_name: "Baki Book",
          description: "Simple digital baki notebook for local shop owners.",
          theme_color: "#16a34a",
          background_color: "#ffffff",
          display: "standalone",
          icons: [
            {
              src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2316a34a'><path d='M4 19V6c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v13M4 19a2 2 0 002 2h12a2 2 0 002-2M4 19h16'/></svg>",
              sizes: "192x192",
              type: "image/svg+xml",
              purpose: "any maskable"
            }
          ]
        }
      })
    ]
  }
});
