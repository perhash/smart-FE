import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
            VitePWA({
              registerType: 'autoUpdate',
              includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
              workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                runtimeCaching: [
                  {
                    urlPattern: /^https:\/\/api\./,
                    handler: 'NetworkFirst',
                    options: {
                      cacheName: 'api-cache',
                      expiration: {
                        maxEntries: 10,
                        maxAgeSeconds: 60 * 60 * 24 * 365
                      },
                      cacheableResponse: {
                        statuses: [0, 200]
                      }
                    }
                  }
                ]
              },
              manifest: {
                name: 'Smart Supply - Water Delivery Management',
                short_name: 'Smart Supply',
                description: 'Modern water bottle delivery management system for suppliers and riders',
                theme_color: '#1f2937',
                background_color: '#ffffff',
                display: 'standalone',
                orientation: 'portrait',
                scope: '/',
                start_url: '/',
                categories: ['business', 'productivity', 'utilities'],
                lang: 'en',
                dir: 'ltr',
                icons: [
                  {
                    src: 'pwa-192x192.png',
                    sizes: '192x192',
                    type: 'image/png',
                    purpose: 'any'
                  },
                  {
                    src: 'pwa-512x512.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'any'
                  },
                  {
                    src: 'pwa-512x512.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'maskable'
                  }
                ],
                shortcuts: [
                  {
                    name: 'Dashboard',
                    short_name: 'Dashboard',
                    description: 'View dashboard',
                    url: '/admin',
                    icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
                  },
                  {
                    name: 'Orders',
                    short_name: 'Orders',
                    description: 'Manage orders',
                    url: '/admin/orders',
                    icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
                  }
                ]
              }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
