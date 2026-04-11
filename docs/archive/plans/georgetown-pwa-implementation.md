# Georgetown Rotary Club PWA Implementation Plan

**Created**: 2025-12-17
**Target**: Georgetown Rotary Club (apps/georgetown)
**Tech Stack**: React 19 + Vite 7 + TypeScript 5.8 + Supabase
**Estimated Time**: 6-8 hours (4 phases)
**Status**: Ready for Implementation

---

## Executive Summary

Transform the Georgetown Rotary Club management application into a Progressive Web App (PWA) with offline support, installability, and automatic updates. This implementation is based on proven architecture from the Brandmine Hub project, adapted for Georgetown's specific requirements and China-safe compliance.

### Key Features to Implement

1. **Offline Support**: Members can view cached data when offline
2. **Install to Home Screen**: Native app-like experience on mobile/desktop
3. **Automatic Updates**: User-controlled update prompts
4. **China-Safe**: Zero external CDN dependencies (critical for Global South audience)
5. **Fast Performance**: Intelligent caching for instant load times

### Success Criteria

- ✅ Service worker registers successfully in production
- ✅ App installable on iOS, Android, and desktop
- ✅ Offline mode displays cached member/speaker/event data
- ✅ Update prompt appears when new version deployed
- ✅ Lighthouse PWA audit score: 90+/100
- ✅ Zero Google CDN dependencies (China compliance)
- ✅ Dev mode works without service worker conflicts

---

## Architecture Overview

### PWA Strategy: generateSW (Workbox via vite-plugin-pwa)

**Why generateSW over injectManifest:**
- Zero-config precaching of all static assets
- Automatic cache versioning and cleanup
- Built-in navigation fallback
- Simpler maintenance (no custom service worker code)
- Sufficient for Georgetown's requirements (no push notifications or background sync needed)

### Update Strategy: User-Controlled Prompt

**Why prompt over autoUpdate:**
- Georgetown users may be editing member data, adding speakers, or scheduling events
- Interrupting active sessions = lost work
- Users control when updates are applied
- Better UX for forms and data entry operations

### Caching Strategy

**Static Assets (CSS/JS/Images)**: Cache-first with stale-while-revalidate
- Instant load times on repeat visits
- Background updates ensure freshness

**Supabase API Reads (GET)**: Network-first with 5-minute cache
- Fresh data prioritized (important for multi-user club management)
- 5-minute offline fallback for brief disconnections
- Balances data freshness with offline access

**Supabase Mutations (POST/PUT/DELETE)**: Network-only (NEVER cached)
- Prevents stale writes and data corruption
- Ensures data integrity for member/speaker/event updates

**Supabase Auth**: Network-only (NEVER cached)
- Security requirement - fresh auth checks always

### China-Safe Compliance

**Critical for Georgetown**: The Global South Interest feature means Chinese users may access the site.

**Implementation:**
- ✅ All Workbox code bundled locally by Vite (no Google CDN)
- ✅ Zero `importScripts()` from external domains
- ✅ All service worker code self-hosted
- ✅ No googleapis.com, gstatic.com, or google-analytics dependencies

**Verification:**
```bash
# After build, check for blocked domains
grep -r "googleapis\|gstatic\|google" dist/
# Expected: No matches (or only in comments/docs)
```

---

## Phase 1: Foundation Setup (1.5 hours)

### 1.1 Install Dependencies

```bash
cd apps/georgetown
npm install -D vite-plugin-pwa workbox-window
```

**Dependencies:**
- `vite-plugin-pwa`: Vite plugin for PWA integration (industry standard)
- `workbox-window`: Client-side service worker utilities

### 1.2 Create PWA Icons

**Required Sizes:**
- 192x192 (Android home screen)
- 512x512 (Android splash screen)
- 180x180 (Apple touch icon)
- 32x32, 16x16 (Favicon)

**File Locations:**
```
apps/georgetown/public/
  └── icons/
      ├── icon-192x192.png
      ├── icon-512x512.png
      ├── apple-touch-icon.png (180x180)
      ├── favicon-32x32.png
      └── favicon-16x16.png
```

**Design Guidelines:**
- Use Rotary International colors: #0067C8 (blue), #F7A81B (gold)
- Include Rotary wheel logo
- Ensure icons are recognizable at small sizes
- Test maskable icon compatibility for Android

**Icon Generation Tool:**
```bash
# Use existing Georgetown logo/branding
# Resize using ImageMagick or online tool like realfavicongenerator.net
```

### 1.3 Configure vite.config.ts

**File**: `apps/georgetown/vite.config.ts`

**Add vite-plugin-pwa configuration:**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { VitePWA } from 'vite-plugin-pwa' // NEW

// Read version from package.json
import packageJson from './package.json'

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version)
  },
  plugins: [
    react(),
    // Existing robots-headers plugin
    {
      name: 'robots-headers',
      configureServer(server) {
        server.middlewares.use('/', (_req, res, next) => {
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
      png: { quality: 80 },
      jpeg: { quality: 75 },
      jpg: { quality: 75 },
      webp: { quality: 80 },
      avif: { quality: 70 },
      cache: false,
      cacheLocation: undefined
    }),
    // NEW: PWA Plugin
    VitePWA({
      registerType: 'prompt', // User-controlled updates
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],

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
        categories: ['business', 'productivity', 'social'],
        screenshots: [] // Optional: Add later for enhanced install prompt
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

        // Runtime caching strategies
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
          },

          // 5. Fonts - Cache-first (rarely change)
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
              }
            }
          }
        ]
      },

      // Dev mode configuration
      devOptions: {
        enabled: process.env.VITE_PWA_DEV === 'true', // Disabled by default
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
})
```

### 1.4 Update package.json Scripts

**File**: `apps/georgetown/package.json`

**Add new scripts:**

```json
{
  "scripts": {
    "dev": "vite",
    "dev:pwa": "VITE_PWA_DEV=true vite --force",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "preview:pwa": "npm run build && vite preview",
    "lighthouse": "npm run build && lhci autorun"
  }
}
```

**Script Explanations:**
- `dev`: Normal development (PWA disabled for fast HMR)
- `dev:pwa`: Test PWA features in development
- `preview:pwa`: Preview production PWA build locally
- `lighthouse`: Run PWA audit

### 1.5 Clean Service Workers in Dev Mode

**File**: `apps/georgetown/src/main.tsx`

**Add aggressive cleanup at the top of the file (before ReactDOM.createRoot):**

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// AGGRESSIVE SERVICE WORKER CLEANUP IN DEV MODE
// Prevents service worker conflicts during development
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  console.log('[Main] Dev mode detected - cleaning service workers...')

  // Unregister all service workers
  navigator.serviceWorker.getRegistrations()
    .then(registrations => {
      console.log(`[Main] Found ${registrations.length} service worker(s)`)
      return Promise.all(
        registrations.map(registration => {
          console.log('[Main] Unregistering:', registration.scope)
          return registration.unregister()
        })
      )
    })
    .then(() => caches.keys())
    .then(cacheNames => {
      console.log(`[Main] Found ${cacheNames.length} cache(s)`)
      return Promise.all(
        cacheNames.map(name => {
          console.log('[Main] Deleting cache:', name)
          return caches.delete(name)
        })
      )
    })
    .then(() => {
      console.log('[Main] ✅ Dev environment clean - HMR should work perfectly')
    })
    .catch(err => {
      console.error('[Main] Error cleaning service workers:', err)
    })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**Why This Matters:**
- Service workers cache files, breaking Hot Module Replacement (HMR)
- Developers experience frustration with stale cached code
- This cleanup ensures dev mode works smoothly
- PWA features are tested separately with `npm run dev:pwa`

---

## Phase 2: Core PWA Features (2-3 hours)

### 2.1 Create Offline Fallback Page

**File**: `apps/georgetown/public/offline.html`

**Purpose**: Display when user navigates to uncached route while offline

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - Georgetown Rotary Club</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: linear-gradient(135deg, #0067C8 0%, #004080 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      text-align: center;
      max-width: 500px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }

    .icon {
      font-size: 64px;
      margin-bottom: 20px;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    h1 {
      font-size: 32px;
      margin-bottom: 16px;
      font-weight: 600;
    }

    p {
      font-size: 16px;
      margin-bottom: 12px;
      opacity: 0.9;
      line-height: 1.6;
    }

    #status {
      margin: 24px 0;
      padding: 12px 20px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      font-weight: 500;
    }

    .status-online {
      background: rgba(34, 197, 94, 0.3);
      color: #dcfce7;
    }

    .status-offline {
      background: rgba(239, 68, 68, 0.3);
      color: #fecaca;
    }

    button {
      background: #F7A81B;
      color: #1f2937;
      border: none;
      padding: 14px 32px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 20px;
    }

    button:hover {
      background: #e09916;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(247, 168, 27, 0.4);
    }

    button:active {
      transform: translateY(0);
    }

    .rotary-wheel {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      opacity: 0.9;
    }

    .feature-list {
      margin-top: 30px;
      text-align: left;
      background: rgba(255, 255, 255, 0.05);
      padding: 20px;
      border-radius: 12px;
    }

    .feature-list h2 {
      font-size: 18px;
      margin-bottom: 12px;
      color: #F7A81B;
    }

    .feature-list ul {
      list-style: none;
      padding: 0;
    }

    .feature-list li {
      padding: 8px 0;
      padding-left: 24px;
      position: relative;
      font-size: 14px;
    }

    .feature-list li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #F7A81B;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Rotary Wheel Icon (placeholder - replace with actual SVG) -->
    <div class="icon">📡</div>

    <h1>You're Offline</h1>

    <p>
      Your internet connection appears to be offline.
      Don't worry - some features are still available!
    </p>

    <div id="status" class="status-offline">
      Checking connection...
    </div>

    <button onclick="location.reload()">Try Again</button>

    <div class="feature-list">
      <h2>While Offline You Can:</h2>
      <ul>
        <li>View recently accessed members</li>
        <li>Browse cached speaker information</li>
        <li>See past event details</li>
        <li>Review club directory</li>
      </ul>
    </div>
  </div>

  <script>
    // Connection status monitoring
    function updateStatus() {
      const statusEl = document.getElementById('status');

      if (navigator.onLine) {
        statusEl.textContent = 'Connection restored! Reloading...';
        statusEl.className = 'status-online';

        // Auto-reload after brief delay
        setTimeout(() => {
          location.reload();
        }, 1000);
      } else {
        statusEl.textContent = 'Still offline - waiting for connection';
        statusEl.className = 'status-offline';
      }
    }

    // Initial check
    updateStatus();

    // Listen for connection changes
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    // Poll every 5 seconds as backup (online/offline events not 100% reliable)
    setInterval(() => {
      if (navigator.onLine) {
        updateStatus();
      }
    }, 5000);
  </script>
</body>
</html>
```

### 2.2 Create Update Prompt Component

**File**: `apps/georgetown/src/components/UpdatePrompt.tsx`

**Purpose**: Notify users when new version is available

```typescript
import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      if (!registration) return

      // Check for updates every hour
      console.log('[PWA] Service worker registered. Checking for updates hourly.')
      setInterval(() => {
        console.log('[PWA] Checking for updates...')
        registration.update()
      }, 60 * 60 * 1000)
    },
    onRegisterError(error) {
      console.error('[PWA] Service worker registration failed:', error)
    },
  })

  if (!needRefresh) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-[#0067C8] rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              Update Available
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              A new version of Georgetown Rotary Club is ready to install.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => updateServiceWorker(true)}
                className="flex-1 px-4 py-2 bg-[#0067C8] text-white rounded-lg hover:bg-[#004080] transition-colors font-medium text-sm"
              >
                Update Now
              </button>
              <button
                onClick={() => setNeedRefresh(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 2.3 Create Offline Indicator Component

**File**: `apps/georgetown/src/components/OfflineIndicator.tsx`

**Purpose**: Show banner when user goes offline

```typescript
import { useEffect, useState } from 'react'

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      console.log('[Offline Indicator] Connection restored')
      setIsOffline(false)

      // Hide banner after brief delay
      setTimeout(() => {
        setShowBanner(false)
      }, 3000)
    }

    const handleOffline = () => {
      console.log('[Offline Indicator] Connection lost')
      setIsOffline(true)
      setShowBanner(true)
    }

    // Set initial state
    setIsOffline(!navigator.onLine)
    setShowBanner(!navigator.onLine)

    // Listen for connection changes
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showBanner) {
    return null
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isOffline ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div
        className={`${
          isOffline
            ? 'bg-amber-500 text-amber-900'
            : 'bg-green-500 text-green-900'
        } px-4 py-3`}
      >
        <div className="container mx-auto flex items-center gap-3">
          <span className="text-2xl">
            {isOffline ? '📡' : '✅'}
          </span>
          <div className="flex-1">
            <div className="font-semibold">
              {isOffline ? "You're offline" : 'Back online!'}
            </div>
            <div className="text-sm opacity-90">
              {isOffline
                ? 'Some features may be unavailable. Viewing cached data.'
                : 'Connection restored. All features available.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 2.4 Register Components in App

**File**: `apps/georgetown/src/App.tsx`

**Import and add components:**

```typescript
import { UpdatePrompt } from './components/UpdatePrompt'
import { OfflineIndicator } from './components/OfflineIndicator'

function App() {
  return (
    <>
      {/* Your existing app structure */}
      <Router>
        {/* Routes */}
      </Router>

      {/* PWA Components */}
      <UpdatePrompt />
      <OfflineIndicator />
    </>
  )
}

export default App
```

---

## Phase 3: Testing & Validation (2 hours)

### 3.1 Install Lighthouse CI

```bash
cd apps/georgetown
npm install -D @lhci/cli
```

### 3.2 Create Lighthouse Configuration

**File**: `apps/georgetown/lighthouserc.json`

```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./dist",
      "url": ["http://localhost/offline.html"],
      "numberOfRuns": 1
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", {"minScore": 0.75}],
        "categories:accessibility": ["error", {"minScore": 0.90}],
        "categories:best-practices": ["warn", {"minScore": 0.80}],
        "categories:seo": ["warn", {"minScore": 0.50}],
        "categories:pwa": ["error", {"minScore": 0.90}],

        "service-worker": "error",
        "installable-manifest": "error",
        "viewport": "error",
        "themed-omnibox": "warn",
        "content-width": "warn",
        "apple-touch-icon": "warn",

        "first-contentful-paint": ["warn", {"maxNumericValue": 2000}],
        "largest-contentful-paint": ["warn", {"maxNumericValue": 3000}],
        "cumulative-layout-shift": ["warn", {"maxNumericValue": 0.1}],
        "total-blocking-time": ["warn", {"maxNumericValue": 300}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

**Why test offline.html:**
- Georgetown has authentication (causes NO_FCP errors in headless Chrome)
- offline.html is public and renders reliably
- Still validates service worker, manifest, and installability

**For full app PWA audit:**
- Use Chrome DevTools Lighthouse manually
- Test after deploying to Cloudflare Pages

### 3.3 Test Checklist

**Local Testing (Dev Mode):**

```bash
# 1. Start dev server (PWA disabled)
npm run dev
# ✅ Hot reload works
# ✅ No service worker registered
# ✅ Fast development experience

# 2. Test PWA in dev mode
npm run dev:pwa
# ✅ Service worker registers
# ✅ Manifest loads
# ✅ Can test update flow
```

**Build Testing:**

```bash
# 1. Build for production
npm run build

# 2. Preview locally
npm run preview:pwa

# 3. Test in browser (http://localhost:5180)
# ✅ Service worker activates
# ✅ App installable (browser shows install prompt)
# ✅ Offline mode works (DevTools → Network → Offline)
# ✅ Update prompt appears (after rebuilding)
# ✅ Cached data loads when offline
```

**Lighthouse Audit:**

```bash
# Run automated audit
npm run lighthouse

# Expected results:
# ✅ PWA score: 90+/100
# ✅ Service worker registered
# ✅ Manifest valid
# ✅ Installable
# ✅ Performance: 75+/100
# ✅ Accessibility: 90+/100
```

**Manual Chrome DevTools Testing:**

1. **Install PWA:**
   - Chrome → Address bar → Install icon
   - App should install to desktop/home screen

2. **Service Worker:**
   - DevTools → Application → Service Workers
   - Status: "activated and running"
   - Update on reload: unchecked (we use prompt)

3. **Cache:**
   - DevTools → Application → Cache Storage
   - Should see: workbox-precache-*, supabase-api, supabase-storage

4. **Offline:**
   - DevTools → Network → Offline
   - Navigate to /members
   - Should show cached data or offline.html

5. **Update Flow:**
   - Make code change
   - Rebuild: `npm run build`
   - Refresh app
   - Update prompt should appear

**China Compliance Verification:**

```bash
# After build, check for blocked domains
cd dist
grep -r "googleapis\|gstatic\|google" .

# Expected: No matches in service worker
# (May find in HTML comments or font URLs - those are OK if served from Google Fonts)

# Check service worker specifically
cat dist/sw.js | grep "importScripts"
# Expected: No matches

cat dist/sw.js | grep "google"
# Expected: No matches
```

### 3.4 Mobile Testing

**iOS (Safari):**
1. Deploy to Cloudflare Pages or test on local network
2. Open in Safari on iPhone
3. Share → Add to Home Screen
4. Icon should appear with Rotary branding
5. Open from home screen → should feel like native app

**Android (Chrome):**
1. Deploy or test on local network
2. Open in Chrome on Android
3. Browser should show "Install app" banner
4. Install → app opens in standalone mode
5. Icon uses maskable design for adaptive icon

**Desktop (Chrome/Edge):**
1. Open app in Chrome/Edge
2. Address bar shows install icon
3. Install → app opens in separate window
4. Looks and feels like desktop app

---

## Phase 4: Documentation & Polish (1 hour)

### 4.1 Update README

**File**: `apps/georgetown/README.md`

**Add PWA section after Tech Stack:**

```markdown
## PWA Features

Georgetown Rotary Club is a Progressive Web App with:

- **📱 Installable**: Add to home screen on iOS, Android, and desktop
- **🔌 Offline Support**: View cached members, speakers, and events without internet
- **⚡ Fast Performance**: Instant load times with intelligent caching
- **🔄 Auto-updates**: Prompted when new version available
- **🌏 China-Safe**: Zero external CDN dependencies

### Development

```bash
# Normal dev (PWA disabled for fast HMR)
npm run dev

# Test PWA features in dev
npm run dev:pwa

# Preview production PWA build
npm run preview:pwa

# Run Lighthouse PWA audit
npm run lighthouse
```

### Deployment

PWA features work automatically in production. Users will be prompted to:
1. Install app to home screen
2. Update when new version is deployed

### Caching Strategy

- **Static assets**: Cached for instant load
- **API reads**: 5-minute cache (fresh data prioritized)
- **API writes**: Never cached (data integrity)
- **Auth**: Never cached (security)

See [docs/pwa/README.md](../../docs/pwa/georgetown-pwa-implementation.md) for full documentation.
```

### 4.2 Create Troubleshooting Guide

**File**: `docs/pwa/georgetown-troubleshooting.md`

**Content:** Common issues and solutions (see Appendix A)

### 4.3 Add .gitignore Entries

**File**: `apps/georgetown/.gitignore`

**Add:**

```
# PWA
dist
.lighthouseci
lighthouseci/
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests pass: `npm run lighthouse`
- [ ] Service worker activates in local preview
- [ ] Update prompt tested and working
- [ ] Offline mode tested
- [ ] Icons created and optimized
- [ ] China compliance verified (no Google CDN)
- [ ] README updated with PWA section

### Cloudflare Pages Configuration

**No changes needed** - Cloudflare Pages automatically serves:
- `manifest.webmanifest` with correct MIME type
- Service worker with correct headers
- All static assets with caching headers

**Important:** Ensure these headers in Cloudflare Pages settings:

```
# _headers file (optional, Cloudflare adds these by default)
/sw.js
  Cache-Control: public, max-age=0, must-revalidate
  Service-Worker-Allowed: /

/manifest.webmanifest
  Content-Type: application/manifest+json
```

### Post-Deployment Testing

1. **Visit deployed URL**
2. **Verify service worker registers** (DevTools → Application)
3. **Test install prompt** (should appear on mobile/desktop)
4. **Test offline mode** (DevTools → Network → Offline)
5. **Verify update flow** (deploy new version, check for prompt)
6. **Test from China** (optional: use VPN to verify no blocking)

---

## Success Metrics

### Technical Metrics

- ✅ Lighthouse PWA score: 90+/100
- ✅ First Contentful Paint: < 2s
- ✅ Largest Contentful Paint: < 3s
- ✅ Service worker activation: < 1s
- ✅ Install prompt appearance: On first visit (if eligible)

### User Experience Metrics

- ✅ Offline access to cached data
- ✅ Install to home screen works on iOS/Android/Desktop
- ✅ App feels native (no browser chrome in standalone mode)
- ✅ Updates apply smoothly without data loss
- ✅ Loading feels instant on repeat visits

### Compliance Metrics

- ✅ Zero Google CDN dependencies
- ✅ All service worker code self-hosted
- ✅ Works from China without blocking

---

## Appendix A: Troubleshooting Common Issues

### Issue 1: Service Worker Not Registering

**Symptoms:**
- DevTools shows no service worker
- PWA install prompt never appears

**Solutions:**

1. **Check HTTPS:** Service workers require HTTPS (or localhost)
   ```
   ✅ https://georgetown.example.com
   ✅ http://localhost:5180
   ❌ http://192.168.1.100:5180 (use ngrok for mobile testing)
   ```

2. **Check console for errors:**
   ```javascript
   // DevTools → Console
   // Look for registration errors
   ```

3. **Verify build output:**
   ```bash
   ls -la dist/sw.js
   # Should exist after npm run build
   ```

4. **Hard refresh:**
   - Chrome: Cmd/Ctrl + Shift + R
   - Clear site data: DevTools → Application → Clear storage

### Issue 2: Update Prompt Not Appearing

**Symptoms:**
- Deploy new version
- Users don't see update notification

**Solutions:**

1. **Check update interval:**
   - Updates checked hourly (see UpdatePrompt.tsx)
   - Force check: Unregister SW → Reload

2. **Verify version changed:**
   ```bash
   # Check if dist files actually changed
   diff -r dist-old/ dist-new/
   ```

3. **Clear cache and test:**
   - DevTools → Application → Clear storage
   - Reload → Should see new version immediately

### Issue 3: Offline Mode Not Working

**Symptoms:**
- Go offline
- App shows browser error instead of cached content

**Solutions:**

1. **Visit pages online first:**
   - Pages must be cached before offline access
   - Service worker only caches on first visit

2. **Check cache in DevTools:**
   ```
   Application → Cache Storage
   ✅ Should see: workbox-precache-*, supabase-api
   ❌ Empty? Service worker hasn't cached yet
   ```

3. **Verify offline.html exists:**
   ```bash
   ls -la dist/offline.html
   # Should exist after build
   ```

### Issue 4: Dev Mode HMR Broken

**Symptoms:**
- Changes don't reflect
- Must hard refresh constantly
- Console shows service worker errors

**Solutions:**

1. **Verify PWA disabled in dev:**
   ```bash
   npm run dev  # NOT npm run dev:pwa
   ```

2. **Check main.tsx cleanup:**
   - Should have service worker cleanup code
   - See Phase 1.5

3. **Manual cleanup:**
   ```javascript
   // DevTools → Console
   navigator.serviceWorker.getRegistrations().then(r => r.forEach(sw => sw.unregister()))
   caches.keys().then(k => k.forEach(c => caches.delete(c)))
   ```

4. **Nuclear option:**
   - DevTools → Application → Clear storage → Clear site data
   - Close all tabs for localhost:5180
   - Restart dev server

### Issue 5: Install Prompt Not Showing

**Symptoms:**
- PWA works but browser doesn't offer install

**Causes & Solutions:**

1. **Already installed:**
   - Check if app is already on home screen
   - Uninstall first to test prompt again

2. **Engagement requirements not met (Chrome):**
   - User must interact with site (click, scroll, etc.)
   - Must visit twice over 5 minutes
   - Wait or simulate engagement

3. **Missing manifest requirements:**
   ```json
   // Must have in manifest:
   "name": "...",
   "short_name": "...",
   "icons": [{ "sizes": "192x192" }, { "sizes": "512x512" }],
   "start_url": "/",
   "display": "standalone"
   ```

4. **Service worker must be active:**
   - Check DevTools → Application → Service Workers
   - Status should be "activated and running"

### Issue 6: Icons Not Appearing Correctly

**Symptoms:**
- Default browser icon instead of Rotary logo
- Icon looks pixelated or wrong size

**Solutions:**

1. **Verify icon files exist:**
   ```bash
   ls -la public/icons/
   # Should have: icon-192x192.png, icon-512x512.png, apple-touch-icon.png
   ```

2. **Check manifest references:**
   ```json
   // vite.config.ts manifest.icons
   // Paths should match public/ structure
   ```

3. **Test icon sizes:**
   - 192x192: Minimum for Android
   - 512x512: Minimum for splash screen
   - PNG format required

4. **Clear installed app:**
   - Uninstall PWA
   - Clear cache
   - Reinstall to see updated icon

### Issue 7: Lighthouse Audit Failing

**Symptoms:**
- `npm run lighthouse` shows errors
- PWA score below 90

**Solutions:**

1. **Check audit target:**
   ```json
   // lighthouserc.json
   "url": ["http://localhost/offline.html"]
   // NOT index.html (causes NO_FCP for auth apps)
   ```

2. **Verify build succeeded:**
   ```bash
   npm run build
   # Should complete without errors
   ls -la dist/
   # Should have sw.js, manifest.webmanifest, offline.html
   ```

3. **Common errors:**
   - "Does not register service worker": sw.js missing
   - "Manifest doesn't have icons": Check vite.config.ts
   - "NO_FCP": Use offline.html instead of index.html

---

## Appendix B: File Checklist

**Modified Files:**

- ✅ `apps/georgetown/vite.config.ts` - PWA plugin config
- ✅ `apps/georgetown/package.json` - New scripts
- ✅ `apps/georgetown/src/main.tsx` - Dev cleanup
- ✅ `apps/georgetown/src/App.tsx` - Register PWA components
- ✅ `apps/georgetown/README.md` - PWA documentation
- ✅ `apps/georgetown/.gitignore` - Lighthouse artifacts

**Created Files:**

- ✅ `apps/georgetown/public/offline.html` - Offline fallback
- ✅ `apps/georgetown/public/icons/icon-192x192.png` - Android icon
- ✅ `apps/georgetown/public/icons/icon-512x512.png` - Splash screen
- ✅ `apps/georgetown/public/icons/apple-touch-icon.png` - iOS icon
- ✅ `apps/georgetown/lighthouserc.json` - Audit config
- ✅ `apps/georgetown/src/components/UpdatePrompt.tsx` - Update UI
- ✅ `apps/georgetown/src/components/OfflineIndicator.tsx` - Offline banner
- ✅ `docs/pwa/georgetown-pwa-implementation.md` - This document
- ✅ `docs/pwa/georgetown-troubleshooting.md` - Troubleshooting guide

**Auto-Generated Files (by vite-plugin-pwa):**

- `apps/georgetown/dist/sw.js` - Service worker (after build)
- `apps/georgetown/dist/manifest.webmanifest` - Web app manifest (after build)
- `apps/georgetown/dist/workbox-*.js` - Workbox runtime (after build)

---

## Appendix C: Browser Compatibility

### Fully Supported

**Desktop:**
- ✅ Chrome 90+ (Windows/Mac/Linux)
- ✅ Edge 90+ (Windows/Mac)
- ✅ Firefox 90+ (limited - no install prompt)
- ✅ Safari 15+ (Mac - limited PWA features)

**Mobile:**
- ✅ Chrome 90+ (Android)
- ✅ Safari 15+ (iOS - install via Share menu)
- ✅ Samsung Internet 14+ (Android)

### Partial Support

**Firefox Desktop:**
- ✅ Service workers work
- ✅ Offline mode works
- ❌ No install prompt (Firefox doesn't support PWA install on desktop)
- Workaround: Users can manually add to bookmarks bar

**Safari Desktop:**
- ✅ Service workers work (Safari 11.1+)
- ✅ Offline mode works
- ❌ No install prompt (Safari doesn't support PWA install on desktop)
- Workaround: Use "Add to Dock" feature in Safari 15+

**iOS Safari:**
- ✅ Service workers work (iOS 11.3+)
- ✅ Install via Share → Add to Home Screen
- ⚠️ Limited storage (50MB quota)
- ⚠️ Cache may be evicted by OS if device storage low

### Graceful Degradation

For browsers without full PWA support:
- App still works normally (standard web app)
- No offline features
- No install prompt
- All functionality remains accessible

---

## Handoff Complete

This plan is ready for implementation. Follow phases sequentially, test thoroughly, and refer to troubleshooting guide as needed.

**Questions or blockers?** Reference:
- This document for architecture decisions
- Appendix A for troubleshooting
- Hub implementation: `apps/hub/docs/pwa/` (if available in monorepo)

**Good luck!** 🚀
