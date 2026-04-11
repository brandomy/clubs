import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'child_process'

// Get git commit hash and date
function getGitInfo() {
  try {
    const hash = execSync('git rev-parse --short HEAD').toString().trim()
    const date = execSync('git log -1 --format=%cd --date=short').toString().trim()
    return `${hash} • ${date}`
  } catch (error) {
    console.warn('Failed to get git info:', error)
    return 'dev'
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  esbuild: {
    // Strip all console calls and debugger statements from production builds
    drop: command === 'build' ? ['console', 'debugger'] : [],
  },
  define: {
    __APP_VERSION__: JSON.stringify(getGitInfo())
  },
  plugins: [
    react(),
    // Custom plugin to add X-Robots-Tag headers for search engine blocking
    {
      name: 'robots-headers',
      configureServer(server) {
        server.middlewares.use('/', (_req, res, next) => {
          // Add comprehensive search engine blocking headers
          res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex, notranslate')
          res.setHeader('X-Frame-Options', 'DENY')
          res.setHeader('X-Content-Type-Options', 'nosniff')
          next()
        })
      }
    },
    ViteImageOptimizer({
      test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
      includePublic: true,
      logStats: true,
      png: {
        quality: 80
      },
      jpeg: {
        quality: 75
      },
      jpg: {
        quality: 75
      },
      webp: {
        quality: 80
      },
      avif: {
        quality: 70
      },
      cache: false,
      cacheLocation: undefined
    }),
    // PWA Plugin - China-safe configuration (no external CDN dependencies)
    VitePWA({
      registerType: 'prompt', // User-controlled updates
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/apple-touch-icon.png'],

      manifest: {
        name: 'Georgetown Rotary Club',
        short_name: 'Georgetown RC',
        description: 'Georgetown Rotary Club - Speaker, Event, and Member Management',
        theme_color: '#0067C8', // Rotary blue
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
        categories: ['business', 'productivity', 'social']
      },

      workbox: {
        // Static asset precaching
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2,woff,ttf}'
        ],

        // Clean up old caches automatically
        cleanupOutdatedCaches: true,

        // Offline fallback page
        navigateFallback: '/offline.html',
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
  server: {
    port: 5180,
    host: true
  },
  preview: {
    port: 5180
  },
  assetsInclude: ['**/*.svg'],
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          tiptap: ['@tiptap/react', '@tiptap/starter-kit'],
          ui: ['lucide-react', 'date-fns', '@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.svg')) {
            return 'assets/images/[name]-[hash][extname]'
          }
          if (assetInfo.name?.match(/\.(jpg|jpeg|png|gif|webp|avif)$/)) {
            return 'assets/images/[name]-[hash][extname]'
          }
          if (assetInfo.name?.match(/\.(woff|woff2|eot|ttf|otf)$/)) {
            return 'assets/fonts/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  }
}))
