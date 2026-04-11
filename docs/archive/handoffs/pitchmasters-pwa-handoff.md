# Pitchmasters PWA Implementation - Handoff Prompt

**Created**: 2025-12-17
**Plan**: [docs/plans/pitchmasters-pwa-implementation.md](../plans/pitchmasters-pwa-implementation.md)
**Estimated Time**: 3-4 hours

---

## Context for AI Assistant

You are implementing Progressive Web App (PWA) features for the **Pitchmasters Toastmasters Club** app, replicating the successful PWA implementation from the **Georgetown Rotary Club** app (completed 2025-12-03).

### Key Context

1. **Georgetown PWA is complete and working** - Use it as reference
2. **Pitchmasters currently has no PWA features** - Starting from scratch
3. **Tech stacks are compatible** - Both use React 19, Vite 7, Supabase
4. **Implementation is proven** - Georgetown approach validated and documented

### What You'll Build

- ✅ Service worker with offline support (China-safe, no Google CDN)
- ✅ User-controlled update prompts (no auto-updates)
- ✅ Offline indicator banner
- ✅ Branded offline fallback page
- ✅ Lighthouse CI testing
- ✅ PWA manifest with Toastmasters branding

---

## Quick Start Instructions

### Phase 1: Setup (1 hour)

```bash
# Navigate to Pitchmasters
cd apps/pitchmasters

# Install dependencies
pnpm add -D vite-plugin-pwa@^1.2.0 workbox-window@^7.4.0 @lhci/cli@^0.15.1
```

**Then**:
1. Update `vite.config.ts` - Add VitePWA plugin with Toastmasters branding
2. Update `package.json` - Add PWA scripts (`dev:pwa`, `preview:pwa`, `lighthouse`)
3. Update `src/main.tsx` - Add dev mode service worker cleanup at top

### Phase 2: Components (1-1.5 hours)

Create these new files (copy structure from Georgetown, adapt branding):

1. **`src/components/UpdatePrompt.tsx`**
   - User-controlled update notification
   - Toastmasters red button (#E31F26)
   - Copy from Georgetown, change colors/text

2. **`src/components/OfflineIndicator.tsx`**
   - Yellow banner at top when offline
   - Copy from Georgetown exactly (no branding changes needed)

3. **`public/offline.html`**
   - Branded offline fallback page
   - Toastmasters red gradient background
   - Copy from Georgetown, adapt colors (#E31F26) and text ("Pitchmasters", "meeting schedules", etc.)

4. **Register in `src/App.tsx`**:
   ```typescript
   import { UpdatePrompt } from './components/UpdatePrompt'
   import { OfflineIndicator } from './components/OfflineIndicator'

   // At end of App return
   <>
     <YourMainContent />
     <UpdatePrompt />
     <OfflineIndicator />
   </>
   ```

### Phase 3: Testing (0.5-1 hour)

1. **Create `lighthouserc.json`** (copy from Georgetown exactly)

2. **Test manually**:
   ```bash
   pnpm run preview:pwa
   # Open Chrome DevTools → Application tab
   # Verify service worker registered
   # Test offline mode
   ```

3. **Run automated test**:
   ```bash
   pnpm run lighthouse
   # Should pass with PWA score 90+
   ```

---

## Implementation Checklist

Use this as your task tracker:

### Setup Phase
- [ ] Install vite-plugin-pwa, workbox-window, @lhci/cli
- [ ] Configure vite.config.ts with VitePWA plugin
- [ ] Add PWA scripts to package.json
- [ ] Add service worker cleanup to main.tsx

### Components Phase
- [ ] Create UpdatePrompt.tsx with Toastmasters branding
- [ ] Create OfflineIndicator.tsx
- [ ] Create offline.html with Toastmasters theme
- [ ] Register components in App.tsx
- [ ] Create PWA icons (192x192, 512x512, apple-touch-icon)

### Testing Phase
- [ ] Create lighthouserc.json
- [ ] Test service worker registration
- [ ] Test update prompt (make code change, rebuild)
- [ ] Test offline mode (DevTools → Network → Offline)
- [ ] Test offline indicator toggle
- [ ] Run pnpm run lighthouse (score 90+)

### Documentation Phase
- [ ] Update apps/pitchmasters/README.md with PWA section
- [ ] Update apps/pitchmasters/CLAUDE.md with PWA notes
- [ ] Verify all PWA scripts work

---

## Key Configuration Values

Use these exact values for Pitchmasters branding:

### Manifest (vite.config.ts)
```typescript
manifest: {
  name: 'Pitchmasters Toastmasters Club',
  short_name: 'Pitchmasters',
  description: 'Pitchmasters Toastmasters Club - Meeting and Member Management',
  theme_color: '#E31F26', // Toastmasters red
  background_color: '#ffffff',
  display: 'standalone',
  categories: ['business', 'productivity', 'education']
}
```

### Colors
- **Primary**: `#E31F26` (Toastmasters red)
- **Secondary**: `#1E3A8A` (Toastmasters blue)
- **Hover**: `#C71C21` (darker red)

### Service Worker Strategy
- **registerType**: `'prompt'` (user-controlled updates)
- **Auth endpoints**: NetworkOnly (never cache)
- **Mutations**: NetworkOnly (never cache)
- **Storage**: CacheFirst (30 days)
- **API reads**: NetworkFirst (5 minutes)

---

## Reference Files

**Copy structure from Georgetown** (adapt branding):
- [apps/georgetown/vite.config.ts](../../apps/georgetown/vite.config.ts#L52-L172) - Lines 52-172
- [apps/georgetown/src/components/UpdatePrompt.tsx](../../apps/georgetown/src/components/UpdatePrompt.tsx)
- [apps/georgetown/src/components/OfflineIndicator.tsx](../../apps/georgetown/src/components/OfflineIndicator.tsx)
- [apps/georgetown/public/offline.html](../../apps/georgetown/public/offline.html)
- [apps/georgetown/lighthouserc.json](../../apps/georgetown/lighthouserc.json)
- [apps/georgetown/package.json](../../apps/georgetown/package.json#L7-L13) - Scripts

**Full implementation plan**:
- [docs/plans/pitchmasters-pwa-implementation.md](../plans/pitchmasters-pwa-implementation.md) - Complete details

**Lessons learned**:
- [docs/pwa-implementation-lessons-learned.md](../pwa-implementation-lessons-learned.md)
- [docs/pwa-china-safe-correction.md](../pwa-china-safe-correction.md)

---

## Critical Reminders

### ⚠️ Security
- **NEVER cache auth endpoints** (`/auth/*` → NetworkOnly)
- **NEVER cache mutations** (POST/PUT/DELETE → NetworkOnly)

### ⚠️ Development
- **PWA disabled by default in dev** (`pnpm dev` has no service worker)
- **Use `pnpm dev:pwa`** to test PWA features locally
- **Always run `pnpm run build`** before testing PWA (preview mode)

### ⚠️ Testing
- **Test offline.html**, not main app (Lighthouse CI can't render auth apps)
- **Manual testing in Chrome DevTools** for full app validation
- **Update prompt requires rebuild** to test (make code change, rebuild)

### ⚠️ Icons
- **Must create icons** before deployment:
  - 192x192px (home screen)
  - 512x512px (splash screen)
  - apple-touch-icon.png (iOS)
- **Use Toastmasters red/blue colors**
- **20% padding for maskable icons**

---

## Success Criteria

✅ **Working PWA**:
- Service worker registers in production build
- Update prompt appears after code change + rebuild
- Offline indicator shows when connection lost
- offline.html loads for uncached routes when offline
- App installable on mobile (via browser "Install App" prompt)

✅ **Passing Tests**:
- Lighthouse audit passes (PWA score 90+)
- No console errors related to service worker
- Manual offline mode works in Chrome DevTools

✅ **Good Developer Experience**:
- `pnpm dev` works without service worker (fast HMR)
- `pnpm dev:pwa` enables PWA testing when needed
- `pnpm preview:pwa` builds and previews locally
- `pnpm run lighthouse` runs automated audit

---

## Common Issues & Solutions

### Issue: "Failed to register service worker"
**Solution**: Make sure you're testing in preview mode (`pnpm run preview:pwa`), not dev mode

### Issue: "Update prompt never appears"
**Solution**:
1. Make a code change
2. Run `pnpm run build`
3. Refresh page
4. Wait up to 60 seconds for hourly check

### Issue: "Offline mode doesn't work"
**Solution**:
1. Load page while online first (to cache assets)
2. Then toggle DevTools → Network → Offline
3. Navigate to previously visited routes

### Issue: "Lighthouse can't test PWA"
**Solution**: Test `offline.html` instead of main app (see lighthouserc.json)

---

## Questions to Ask If Stuck

1. **"Can I see Georgetown's vite.config.ts PWA section?"**
   - Look at lines 52-172 in apps/georgetown/vite.config.ts

2. **"How do I test the update prompt?"**
   - Make trivial code change → `pnpm run build` → reload → wait 60s

3. **"Why isn't service worker registering?"**
   - Are you in preview mode, not dev mode?
   - Check Console → Application → Service Workers

4. **"Where do I put the offline indicator in App.tsx?"**
   - At the end of the return, after all main content

5. **"What should offline.html say for Pitchmasters?"**
   - Change "Georgetown Rotary Club" → "Pitchmasters Toastmasters Club"
   - Change features: "speaker information" → "meeting schedules", etc.

---

## Final Validation

Before marking complete, verify:

```bash
# 1. Build succeeds
pnpm run build

# 2. Preview works
pnpm run preview:pwa
# → Open localhost:5190
# → DevTools → Application → Service Workers → "activated"

# 3. Offline test
# → Load page
# → DevTools → Network → Offline
# → Navigate → should work or show offline.html

# 4. Lighthouse passes
pnpm run lighthouse
# → PWA score: 90+
# → No errors

# 5. Update test
# → Change code
# → pnpm run build
# → Reload page
# → Update prompt appears (within 60s)

# 6. Clean dev mode
pnpm dev
# → No service worker warnings
# → HMR works normally
```

---

## Handoff Complete When...

- [ ] All files created and configured
- [ ] All tests passing (manual + automated)
- [ ] Documentation updated (README.md, CLAUDE.md)
- [ ] No console errors in preview mode
- [ ] Service worker registers successfully
- [ ] Update prompt works
- [ ] Offline mode works
- [ ] Dev mode clean (no PWA conflicts)

---

**Copy this entire document to start implementation**. Follow the plan, reference Georgetown files, and use the checklist to track progress. Estimated 3-4 hours from start to finish.

**Plan Location**: [docs/plans/pitchmasters-pwa-implementation.md](../plans/pitchmasters-pwa-implementation.md)

**Questions?** Reference the plan for detailed explanations of all decisions and configurations.
