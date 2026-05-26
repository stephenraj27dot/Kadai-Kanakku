import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    // Relying on manual manifest and sw.js in public/ for SSR compatibility
    plugins: []
  }
});
