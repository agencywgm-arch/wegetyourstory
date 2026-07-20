import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync } from "node:fs";
import { resolve } from "node:path";

// Fallback SPA : 404.html = copie d'index.html (GitHub Pages)
const spaFallback = () => ({
  name: "spa-fallback-404",
  closeBundle() {
    try {
      copyFileSync(resolve("dist/index.html"), resolve("dist/404.html"));
    } catch {}
  },
});

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react(), spaFallback()],
});
