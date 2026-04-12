import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Read version from package.json
import packageJson from './package.json'

export default defineConfig(({ command }) => ({
  esbuild: {
    // Strip all console calls and debugger statements from production builds
    drop: command === 'build' ? ['console', 'debugger'] : [],
  },
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version)
  },
  plugins: [
    react(),
    // PWA Plugin - China-safe configuration (no external CDN dependencies)
    VitePWA({
      registerType: 'prompt', // User-controlled updates
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/apple-touch-icon.png'],

      manifest: {
        name: 'Pitchmasters Toastmasters Club',
        short_name: 'Pitchmasters',
        description: 'Pitchmasters Toastmasters Club - Meeting and Member Management',
        theme_color: '#E31F26', // Toastmasters red
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable' // Android adaptive icon
          }
        ],
        categories: ['business', 'productivity', 'education']
      },

      workbox: {
        // Static asset precaching
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2,woff,ttf}'
        ],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MB — main bundle exceeds default 2 MB limit

        // Clean up old caches automatically
        cleanupOutdatedCaches: true,

        // SPA fallback — serve app shell for all navigation (React Router handles routing)
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/api/,           // Don't cache API routes
          /^\/auth/,          // Don't cache auth routes
          /\.map$/,           // Don't cache source maps
        ],

        // Runtime caching strategies - CHINA-SAFE (no Google CDN)
        runtimeCaching: [
          // 1. Auth endpoints - NEVER cache (security)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
            handler: 'NetworkOnly'
          },

          // 2. Mutations (POST/PUT/DELETE) - NEVER cache (data integrity)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            method: 'POST',
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            method: 'PUT',
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            method: 'DELETE',
            handler: 'NetworkOnly'
          },

          // 3. Storage (images) - Cache-first for performance
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },

          // 4. API Reads (GET) - Network-first with 5-min cache
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            method: 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 5 * 60 // 5 minutes (fresh data for club management)
              },
              networkTimeoutSeconds: 3, // Fallback to cache after 3s
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },

      // Dev mode configuration - disabled by default for fast HMR
      devOptions: {
        enabled: process.env.VITE_PWA_DEV === 'true',
        type: 'module'
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps for production
    minify: 'esbuild', // Use esbuild for minification (faster than terser)
    rollupOptions: {
      output: {
        // Code splitting for better caching
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react', 'date-fns']
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5190,
    host: true
  },
  preview: {
    port: 5190
  }
}))