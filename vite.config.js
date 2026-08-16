import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

const ICONS = "https://nxnsdnayzimzfiwjrkvv.supabase.co/storage/v1/object/public/icons";

export default defineConfig({
  css: { postcss: { plugins: [ tailwindcss({ content: ["./index.html", "./*.{js,jsx}"] }), autoprefixer() ] } },
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: {
        name: "Bhutan Tourism Hub",
        short_name: "Tourism Hub",
        description: "Bhutan's marketplace connecting verified guides, drivers and tour operators.",
        theme_color: "#21402F",
        background_color: "#F4F5F1",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: `${ICONS}/icon-192.png`, sizes: "192x192", type: "image/png" },
          { src: `${ICONS}/icon-512.png`, sizes: "512x512", type: "image/png" },
          { src: `${ICONS}/icon-maskable-1024.png`, sizes: "1024x1024", type: "image/png", purpose: "maskable" },
        ],
      },
      injectManifest: { globPatterns: ["**/*.{js,css,html,jpg,png,svg,woff2}"] },
    }),
  ],
});
