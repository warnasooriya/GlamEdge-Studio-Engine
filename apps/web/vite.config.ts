import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// The GA tag is embedded statically in index.html (Google's own install
// instructions, verbatim) so their detector — which reads raw HTML, not the
// rendered DOM — can find it. That means `vite dev` would otherwise report
// every local session as live traffic, so strip the block for dev serving
// only; `vite build` (what ships in the Docker image) keeps it untouched.
function stripAnalyticsInDev(): Plugin {
  return {
    name: "strip-analytics-in-dev",
    apply: "serve",
    transformIndexHtml(html) {
      return html.replace(/<!-- ga-tag:start -->[\s\S]*?<!-- ga-tag:end -->/, "");
    },
  };
}

export default defineConfig({
  plugins: [
    stripAnalyticsInDev(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "GlamEdge Studio Engine",
        short_name: "GlamEdge",
        description: "All-in-one SaaS management & portfolio showcase platform for salons & studios",
        theme_color: "#1E293B",
        background_color: "#0f172a",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/ledger"),
            handler: "NetworkFirst",
            options: {
              cacheName: "pos-ledger-cache",
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
});
