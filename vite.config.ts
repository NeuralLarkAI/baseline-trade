// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Jupiter API proxy (DEV only)
      "/jup": {
        target: "https://quote-api.jup.ag",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/jup/, ""),
      },
    },
  },
});
