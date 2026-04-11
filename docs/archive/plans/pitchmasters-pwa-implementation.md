# Pitchmasters PWA Implementation Plan

**Created**: 2025-12-17
**Status**: Ready for Implementation
**Estimated Time**: 3-4 hours
**Source**: Georgetown PWA implementation (completed 2025-12-03)

---

## Context

Georgetown Rotary Club app was successfully converted to a Progressive Web App (PWA) on 2025-12-03. This plan replicates that implementation for the Pitchmasters Toastmasters app, following the proven architecture and lessons learned.

**Reference Documentation**:
- [docs/pwa-implementation-lessons-learned.md](../pwa-implementation-lessons-learned.md)
- [docs/pwa-china-safe-correction.md](../pwa-china-safe-correction.md)
- Georgetown implementation: [apps/georgetown/vite.config.ts](../../apps/georgetown/vite.config.ts)

---

## Georgetown PWA Status ✅

**Verification Complete** - Georgetown has:

✅ **vite-plugin-pwa** configured with `registerType: 'prompt'`
✅ **Workbox** runtime caching strategies (China-safe, no Google CDN)
✅ **UpdatePrompt** component for user-controlled updates
✅ **OfflineIndicator** component for connection status
✅ **offline.html** fallback page (branded with Rotary theme)
✅ **Lighthouse CI** configuration and passing tests
✅ **PWA dev scripts** (`dev:pwa`, `preview:pwa`, `lighthouse`)
✅ **Service worker cleanup** in dev mode
✅ **Manifest** with proper icons and metadata

All files reviewed and confirmed working. Ready to replicate for Pitchmasters.

---

## Pitchmasters Current State

**Missing PWA Features**:
- ❌ No vite-plugin-pwa installed
- ❌ No service worker configuration
- ❌ No UpdatePrompt component
- ❌ No OfflineIndicator component
- ❌ No offline.html fallback page
- ❌ No PWA manifest
- ❌ No Lighthouse CI testing
- ❌ No PWA dev scripts

**Tech Stack** (compatible with Georgetown):
- React 19.1.1 ✅
- TypeScript 5.7.2 ✅
- Vite 7.1.6 ✅
- Tailwind CSS 3.4.17 ✅
- Supabase ✅
- React Router 7.9.3 ✅

All dependencies are compatible. Can use same PWA approach.

---

## Implementation Strategy

### Phase 1: Foundation (1 hour)
1. Install PWA dependencies
2. Configure vite.config.ts with vite-plugin-pwa
3. Add PWA dev scripts to package.json
4. Update main.tsx with dev mode service worker cleanup

### Phase 2: Core Features (1-1.5 hours)
5. Create UpdatePrompt component (user-controlled updates)
6. Create OfflineIndicator component (connection status)
7. Create offline.html fallback page (branded Pitchmasters theme)
8. Register components in App.tsx

### Phase 3: Testing (0.5-1 hour)
9. Install and configure Lighthouse CI
10. Test PWA features manually
11. Run automated Lighthouse audit

### Phase 4: Documentation (0.5 hour)
12. Update Pitchmasters README.md with PWA section
13. Document PWA configuration in CLAUDE.md

---

## Detailed Implementation Steps

### 1. Install Dependencies

```bash
cd apps/pitchmasters
pnpm add -D vite-plugin-pwa@^1.2.0 workbox-window@^7.4.0 @lhci/cli@^0.15.1
```

**Dependencies**:
- `vite-plugin-pwa`: Vite plugin for PWA integration (generateSW strategy)
- `workbox-window`: Client-side service worker utilities
- `@lhci/cli`: Lighthouse CI for automated PWA testing

---

### 2. Configure vite.config.ts

Add VitePWA plugin with Pitchmasters branding (Toastmasters blue/red theme):

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
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
            purpose: 'maskable'
          }
        ],
        categories: ['business', 'productivity', 'education']
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf}'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/api/, /^\/auth/, /\.map$/],

        runtimeCaching: [
          // Auth endpoints - NEVER cache
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
            handler: 'NetworkOnly'
          },
          // Mutations - NEVER cache
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
          // Storage - Cache-first
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
          // API Reads - NetworkFirst with 5-min cache
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            method: 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 5 * 60 // 5 minutes
              },
              networkTimeoutSeconds: 3,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },

      devOptions: {
        enabled: process.env.VITE_PWA_DEV === 'true',
        type: 'module'
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react', '@dnd-kit/sortable', '@dnd-kit/core', 'date-fns']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5190,
    host: true
  },
  preview: {
    port: 5190
  }
})
```

**Key Decisions**:
- `registerType: 'prompt'` - Let users control update timing (best for club management app)
- `theme_color: '#E31F26'` - Toastmasters International red
- `categories: ['business', 'productivity', 'education']` - Reflects Toastmasters purpose
- 5-minute API cache - Balance between freshness and offline access
- China-safe: All Workbox code bundled locally (no Google CDN)

---

### 3. Update package.json Scripts

Add PWA development and testing scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:pwa": "VITE_PWA_DEV=true vite --force",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "preview:pwa": "pnpm run build && vite preview",
    "lighthouse": "pnpm run build && lhci autorun",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "typecheck": "tsc --noEmit"
  }
}
```

**Script Purposes**:
- `dev` - Normal dev mode (PWA disabled for fast HMR)
- `dev:pwa` - Dev mode with PWA enabled (for testing PWA features)
- `preview:pwa` - Build and preview locally (test production PWA)
- `lighthouse` - Build and run automated Lighthouse audit

---

### 4. Update main.tsx - Dev Mode Cleanup

Add aggressive service worker cleanup at the top of main.tsx:

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Aggressive cleanup in dev mode to prevent service worker conflicts
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(registrations => {
      return Promise.all(registrations.map(r => r.unregister()))
    })
    .then(() => caches.keys())
    .then(cacheNames => {
      return Promise.all(cacheNames.map(name => caches.delete(name)))
    })
    .then(() => console.log('[Main] Dev environment clean ✓'))
    .catch(err => console.error('[Main] Cleanup failed:', err))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**Why This Matters**:
- Service workers cache files, breaking Hot Module Replacement (HMR)
- Cleanup ensures fresh state every dev session
- Only runs in dev mode (no production impact)

---

### 5. Create UpdatePrompt Component

**File**: `apps/pitchmasters/src/components/UpdatePrompt.tsx`

```typescript
import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration: ServiceWorkerRegistration | undefined) {
      if (!registration) return

      // Check for updates every hour
      console.log('[PWA] Service worker registered. Checking for updates hourly.')
      setInterval(() => {
        console.log('[PWA] Checking for updates...')
        registration.update()
      }, 60 * 60 * 1000)
    },
    onRegisterError(error: Error) {
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
            <div className="w-10 h-10 bg-[#E31F26] rounded-full flex items-center justify-center">
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
              A new version of Pitchmasters is ready to install.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => updateServiceWorker(true)}
                className="flex-1 px-4 py-2 bg-[#E31F26] text-white rounded-lg hover:bg-[#C71C21] transition-colors font-medium text-sm"
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

**Features**:
- Non-intrusive notification in bottom-right corner
- User controls when to update (doesn't interrupt active sessions)
- Checks for updates every hour automatically
- Toastmasters red branding (#E31F26)

---

### 6. Create OfflineIndicator Component

**File**: `apps/pitchmasters/src/components/OfflineIndicator.tsx`

```typescript
import { useEffect, useState } from 'react'

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-yellow-500 text-white px-4 py-3 shadow-lg">
        <div className="max-w-screen-xl mx-auto flex items-center gap-3">
          <span className="text-2xl">📡</span>
          <div className="flex-1">
            <strong className="font-semibold">You're offline</strong>
            <p className="text-sm opacity-90">
              Some features may be unavailable until connection is restored
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Features**:
- Shows banner at top of screen when offline
- Automatically hides when connection restored
- Clear visual indicator for users
- Non-blocking UI

---

### 7. Create offline.html Fallback Page

**File**: `apps/pitchmasters/public/offline.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - Pitchmasters Toastmasters Club</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: linear-gradient(135deg, #E31F26 0%, #C71C21 100%);
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
      background: #1E3A8A;
      color: white;
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
      background: #1e40af;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(30, 58, 138, 0.4);
    }

    button:active {
      transform: translateY(0);
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
      color: #FFFFFF;
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
      color: #1E3A8A;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
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
        <li>Browse cached meeting schedules</li>
        <li>See past role assignments</li>
        <li>Review club information</li>
      </ul>
    </div>
  </div>

  <script>
    function updateStatus() {
      const statusEl = document.getElementById('status');

      if (navigator.onLine) {
        statusEl.textContent = 'Connection restored! Reloading...';
        statusEl.className = 'status-online';
        setTimeout(() => location.reload(), 1000);
      } else {
        statusEl.textContent = 'Still offline - waiting for connection';
        statusEl.className = 'status-offline';
      }
    }

    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    setInterval(() => {
      if (navigator.onLine) updateStatus();
    }, 5000);
  </script>
</body>
</html>
```

**Features**:
- Toastmasters red gradient background
- Connection status monitoring
- Auto-reload when connection restored
- Pure HTML/CSS (no JavaScript dependencies)
- Branded with Pitchmasters context

---

### 8. Register Components in App.tsx

Import and render UpdatePrompt and OfflineIndicator:

```typescript
// At top of App.tsx
import { UpdatePrompt } from './components/UpdatePrompt'
import { OfflineIndicator } from './components/OfflineIndicator'

// At end of App component return (after main content)
function App() {
  return (
    <>
      {/* Existing app content */}
      <YourMainAppContent />

      {/* PWA Components */}
      <UpdatePrompt />
      <OfflineIndicator />
    </>
  )
}
```

---

### 9. Configure Lighthouse CI

**File**: `apps/pitchmasters/lighthouserc.json`

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

**Why Test offline.html**:
- Pitchmasters is authenticated (like Georgetown)
- Lighthouse CI can't render authenticated React apps in headless mode
- Testing offline.html validates service worker, manifest, and PWA basics
- For full app testing, use Chrome DevTools Lighthouse manually

---

### 10. Create PWA Icons

Create icon files in `apps/pitchmasters/public/icons/`:

**Required icons**:
- `icon-192x192.png` - Android home screen
- `icon-512x512.png` - Android splash screen
- `apple-touch-icon.png` - iOS home screen

**Icon Design**:
- Use Pitchmasters logo or Toastmasters "T" emblem
- Toastmasters red (#E31F26) and blue (#1E3A8A) colors
- Simple, recognizable design at small sizes
- 20% padding around icon for maskable format

**Generation Options**:
1. Use existing Pitchmasters logo/branding
2. Export from Figma/design tool
3. Use online PWA icon generator (e.g., maskable.app)

---

## Testing Checklist

### Manual Testing

1. **Build and Preview**:
   ```bash
   cd apps/pitchmasters
   pnpm run preview:pwa
   ```

2. **Chrome DevTools - Service Worker**:
   - Open `chrome://inspect/#service-workers`
   - Should show "activated and running" for localhost:5190
   - No errors in console

3. **Chrome DevTools - Manifest**:
   - Application tab → Manifest
   - Verify all fields populated correctly
   - Check icons load properly

4. **Update Prompt Test**:
   - Make trivial code change
   - Run `pnpm run build`
   - Reload page
   - Update prompt should appear within 60 seconds

5. **Offline Test**:
   - Load app while online
   - DevTools → Network → Offline checkbox
   - Navigate to cached pages → should work
   - Navigate to uncached route → offline.html appears

6. **Offline Indicator Test**:
   - Toggle offline in DevTools
   - Yellow banner should appear/disappear

### Automated Testing

```bash
cd apps/pitchmasters
pnpm run lighthouse
```

**Expected Results**:
- ✅ PWA score: 90+ (error threshold)
- ✅ Service worker registered
- ✅ Manifest valid
- ✅ Installable
- ✅ Accessibility: 90+
- ⚠️ Performance: 75+ (warn threshold)

---

## Success Criteria

- [ ] Service worker registers successfully in production build
- [ ] Update prompt appears when new version deployed
- [ ] Offline indicator shows when connection lost
- [ ] offline.html displays for uncached routes when offline
- [ ] Lighthouse audit passes all assertions (score 90+)
- [ ] Dev mode works without service worker conflicts (`pnpm dev`)
- [ ] PWA dev mode works for testing (`pnpm dev:pwa`)
- [ ] App installable on mobile devices
- [ ] All PWA scripts functional in package.json

---

## Pitfalls to Avoid

### 1. **Don't Cache Auth Endpoints**
✅ NetworkOnly for all `/auth/*` routes (already in plan)

### 2. **Don't Cache Mutations**
✅ NetworkOnly for POST/PUT/DELETE (already in plan)

### 3. **Don't Fight Service Workers in Dev**
✅ Disabled by default, aggressive cleanup (already in plan)

### 4. **Don't Use autoUpdate**
✅ Using `prompt` strategy (already in plan)

### 5. **Don't Test Authenticated Pages with Lighthouse CI**
✅ Testing offline.html only (already in plan)

### 6. **Don't Forget Icons**
⚠️ Must create 192x192, 512x512, and apple-touch-icon

### 7. **Don't Skip TypeScript Types**
✅ vite-plugin-pwa provides virtual module types automatically

---

## Rollback Plan

If PWA causes issues:

1. **Disable in Production**:
   ```typescript
   // vite.config.ts
   VitePWA({
     registerType: 'prompt',
     disable: true // Add this
   })
   ```

2. **Unregister Service Workers**:
   ```typescript
   // Temporary code in main.tsx
   navigator.serviceWorker.getRegistrations()
     .then(registrations => {
       return Promise.all(registrations.map(r => r.unregister()))
     })
   ```

3. **Remove from Build**:
   - Remove VitePWA plugin from vite.config.ts
   - Run `pnpm build`
   - Redeploy

---

## Post-Implementation

### Update Documentation

1. **Update apps/pitchmasters/README.md**:
   - Add PWA section after Tech Stack
   - Document PWA scripts
   - Link to this plan

2. **Update apps/pitchmasters/CLAUDE.md**:
   - Add PWA architecture section
   - Document service worker strategy
   - Note China-safe implementation

### Monitoring

- Monitor Cloudflare Pages deployment logs
- Check service worker registration rates
- Watch for update prompt issues
- Monitor offline usage patterns

---

## Reference

**Georgetown Files to Reference**:
- [vite.config.ts](../../apps/georgetown/vite.config.ts:52-172)
- [UpdatePrompt.tsx](../../apps/georgetown/src/components/UpdatePrompt.tsx)
- [OfflineIndicator.tsx](../../apps/georgetown/src/components/OfflineIndicator.tsx)
- [offline.html](../../apps/georgetown/public/offline.html)
- [lighthouserc.json](../../apps/georgetown/lighthouserc.json)

**Documentation**:
- [PWA Implementation Lessons](../pwa-implementation-lessons-learned.md)
- [China-Safe Correction](../pwa-china-safe-correction.md)

**External Resources**:
- vite-plugin-pwa: https://vite-pwa-org.netlify.app/
- Workbox: https://developer.chrome.com/docs/workbox/
- MDN PWA Guide: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps

---

**Plan Version**: 1.0
**Last Updated**: 2025-12-17
**Status**: Ready for Implementation
