import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default defineConfig({
  css: { postcss: { plugins: [ tailwindcss({ content: ["./index.html", "./*.{js,jsx}"] }), autoprefixer() ] } },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      // icons live as real files in /public — browsers validate these, not inline data
      includeAssets: ["favicon-32.png", "apple-touch-icon.png", "preview.png"],
      manifest: {
        id: "/",
        name: "Bhutan Tourism Hub",
        short_name: "Tourism Hub",
        description: "Bhutan's marketplace connecting verified guides, drivers and tour operators.",
        lang: "en",
        dir: "ltr",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#FFFFFF",
        background_color: "#FFFFFF",
        categories: ["business", "travel", "productivity"],
        icons: [
          // shown as-is: rounded corners with real transparency
          { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          // Android crops these to its own shape — full-bleed, content inside the safe zone
          { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,jpg,png,svg,woff2}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      }
    })
  ]
});
