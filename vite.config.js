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
          { src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAALHElEQVR4nO2cy3MVxxXGz6hGgeQPQIqoSnjogXgESQQ2ksCYOLGzySZeJhWvs7HL/gO8dRUOSLBPlc3DiW0esRM7D68wG4ikEOnqhR0nWYDE[...]" },
          { src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAcFklEQVR4nO3dy/NkV0EH8NNTvxBA2JKQWEIek8kkE5KZmCxIQggvQReUWGiVr5KVKwVL/wC2Wip5sLcKAhExQAQFFRciuAhmAswrk4CvhZmw[...]" },
          { src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABAAAAAQACAIAAADwf7zUAAAwKUlEQVR4nO3dS7B0V3ke4H2o5mIwYxNBqsJNN6Qg/RQaRAgZlFEch6RcNiHGqTDKyGATV3nKNCnHIIl5UtwTDLYCGXpAgAygkJzSncxdZGru[...]" }
        ]
      },
      injectManifest: { globPatterns: ["**/*.{js,css,html,jpg,png,svg,woff2}"], cleanupOutdatedCaches: true, clientsClaim: true, skipWaiting: true }
    })
  ]
});
