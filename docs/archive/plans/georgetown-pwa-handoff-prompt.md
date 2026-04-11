# Georgetown PWA Implementation - Handoff Prompt

**Purpose**: Ready-to-use prompt for AI assistant to implement Georgetown Rotary Club PWA
**Plan Document**: [georgetown-pwa-implementation.md](georgetown-pwa-implementation.md)
**Estimated Time**: 6-8 hours
**Prerequisites**: None (plan is complete)

---

## Copy-Paste Prompt for AI Assistant

```
I need you to implement Progressive Web App (PWA) features for the Georgetown Rotary Club application. Follow the detailed plan located at:

docs/plans/georgetown-pwa-implementation.md

CRITICAL REQUIREMENTS:

1. **China-Safe Compliance**: Zero external CDN dependencies (no Google CDN imports)
   - All Workbox code must be bundled locally by Vite
   - Verify no googleapis.com or gstatic.com in service worker after build

2. **User-Controlled Updates**: Use 'prompt' strategy (not autoUpdate)
   - Users editing member/speaker/event data should not be interrupted
   - UpdatePrompt component shows notification when update available

3. **Dev Mode Protection**: Aggressive service worker cleanup in dev
   - PWA disabled by default (dev script)
   - PWA enabled only with dev:pwa script
   - Cleanup code in main.tsx to prevent HMR conflicts

4. **Smart Caching Strategy**:
   - Static assets: Cache-first
   - Supabase API reads (GET): Network-first with 5-min cache
   - Supabase mutations (POST/PUT/DELETE): Network-only (NEVER cached)
   - Supabase auth: Network-only (NEVER cached)

5. **Testing Requirements**:
   - Lighthouse audit must pass (90+ PWA score)
   - Test offline mode (cached data loads)
   - Test update flow (prompt appears after rebuild)
   - Verify installability on iOS/Android/Desktop

IMPLEMENTATION PHASES (follow sequentially):

Phase 1: Foundation Setup (1.5 hours)
- Install vite-plugin-pwa and workbox-window
- Create PWA icons (192x192, 512x512, apple-touch-icon)
- Configure vite.config.ts with PWA plugin
- Update package.json with new scripts
- Add service worker cleanup to main.tsx

Phase 2: Core PWA Features (2-3 hours)
- Create offline.html fallback page
- Create UpdatePrompt component
- Create OfflineIndicator component
- Register components in App.tsx

Phase 3: Testing & Validation (2 hours)
- Install @lhci/cli
- Create lighthouserc.json
- Run lighthouse audit
- Test in DevTools (service worker, cache, offline mode)
- Verify China compliance (no external imports)

Phase 4: Documentation & Polish (1 hour)
- Update README.md with PWA section
- Update .gitignore
- Verify deployment checklist

IMPORTANT NOTES:

- Georgetown uses React 19 + Vite 7 + TypeScript 5.8 + Supabase
- Existing vite.config.ts has image optimization and robots headers (preserve these)
- Offline.html should use Rotary colors: #0067C8 (blue), #F7A81B (gold)
- Test with npm run preview:pwa after building
- Use npm run dev (not dev:pwa) for normal development

START WITH PHASE 1 and work through sequentially. Ask if you encounter any blockers or need clarification on architecture decisions.
```

---

## Alternative: Focused Prompt (If AI Needs Shorter Context)

```
Implement PWA for Georgetown Rotary Club (apps/georgetown). Key requirements:

1. Install: vite-plugin-pwa, workbox-window
2. Configure vite.config.ts with VitePWA plugin (registerType: 'prompt')
3. Create PWA icons: 192x192, 512x512, apple-touch-icon
4. Create public/offline.html (Rotary-branded fallback)
5. Create components: UpdatePrompt, OfflineIndicator
6. Add dev mode SW cleanup to main.tsx
7. Configure Lighthouse CI (test offline.html, not index.html)
8. Update package.json scripts: dev:pwa, preview:pwa, lighthouse

CRITICAL:
- Cache Supabase GET (5min), NEVER cache POST/PUT/DELETE/auth
- Zero Google CDN (China-safe)
- Disable PWA in dev (enable with VITE_PWA_DEV=true)

Full plan: docs/plans/georgetown-pwa-implementation.md
```

---

## Expected Outputs

After implementation completes, verify these files exist:

**Modified:**
- `apps/georgetown/vite.config.ts` - Has VitePWA plugin
- `apps/georgetown/package.json` - Has dev:pwa, preview:pwa, lighthouse scripts
- `apps/georgetown/src/main.tsx` - Has SW cleanup code
- `apps/georgetown/src/App.tsx` - Renders UpdatePrompt and OfflineIndicator
- `apps/georgetown/README.md` - Has PWA section
- `apps/georgetown/.gitignore` - Ignores .lighthouseci/

**Created:**
- `apps/georgetown/public/offline.html` - Branded offline page
- `apps/georgetown/public/icons/icon-192x192.png` - Android icon
- `apps/georgetown/public/icons/icon-512x512.png` - Splash screen
- `apps/georgetown/public/icons/apple-touch-icon.png` - iOS icon (180x180)
- `apps/georgetown/lighthouserc.json` - Lighthouse config
- `apps/georgetown/src/components/UpdatePrompt.tsx` - Update notification
- `apps/georgetown/src/components/OfflineIndicator.tsx` - Offline banner

**Auto-generated (after npm run build):**
- `apps/georgetown/dist/sw.js` - Service worker
- `apps/georgetown/dist/manifest.webmanifest` - Web app manifest
- `apps/georgetown/dist/workbox-*.js` - Workbox runtime

---

## Testing Commands for AI

After implementation, AI should run:

```bash
# 1. Build production version
cd apps/georgetown
npm run build

# 2. Preview locally
npm run preview:pwa
# Open http://localhost:5180
# DevTools → Application → Service Workers (should show "activated")

# 3. Run Lighthouse audit
npm run lighthouse
# Should pass with PWA score 90+

# 4. Verify China compliance
grep -r "googleapis\|gstatic" dist/sw.js
# Should return no matches
```

---

## Success Criteria Checklist

Ask AI to verify:

- [ ] `npm run build` completes successfully
- [ ] `npm run lighthouse` passes all assertions
- [ ] Service worker activates in preview mode
- [ ] Update prompt appears after rebuild + reload
- [ ] Offline mode works (DevTools → Network → Offline)
- [ ] App installable (browser shows install prompt)
- [ ] No Google CDN imports in dist/sw.js
- [ ] Dev mode (npm run dev) has no SW conflicts
- [ ] All components render without errors

---

## Troubleshooting Reference

If AI encounters issues, direct to:
- **Plan**: `docs/plans/georgetown-pwa-implementation.md` - Full architecture
- **Appendix A**: Troubleshooting common issues (in plan document)
- **Appendix B**: File checklist (in plan document)
- **Hub Reference**: `apps/hub/docs/pwa/` - Working example (if exists)

---

## Notes for AI Assistant

**Context to provide:**
- Georgetown is a Rotary club management app (members, speakers, events)
- Global South Interest feature means Chinese users may access
- Users may be editing data when updates deploy (hence prompt strategy)
- Offline access is nice-to-have (5-min cache is acceptable)
- Rotary branding: Blue (#0067C8) and Gold (#F7A81B)

**Common pitfalls to avoid:**
- Don't cache mutations (POST/PUT/DELETE) - causes stale writes
- Don't cache auth endpoints - security risk
- Don't enable PWA in dev by default - breaks HMR
- Don't use autoUpdate - interrupts active users
- Don't import Workbox from CDN - blocked in China
- Don't test index.html with Lighthouse - causes NO_FCP error

---

## Estimated Timeline

- **Phase 1** (Foundation): 1.5 hours
  - 30 min: Install deps, create icons
  - 45 min: Configure vite.config.ts (careful with existing config)
  - 15 min: Update package.json, main.tsx

- **Phase 2** (Features): 2-3 hours
  - 45 min: Create offline.html (branded design)
  - 45 min: Create UpdatePrompt component
  - 30 min: Create OfflineIndicator component
  - 30 min: Integrate into App.tsx, test

- **Phase 3** (Testing): 2 hours
  - 30 min: Setup Lighthouse CI
  - 30 min: Run audits, fix issues
  - 1 hour: Manual testing (DevTools, offline mode, update flow)

- **Phase 4** (Documentation): 1 hour
  - 30 min: Update README
  - 30 min: Final verification, cleanup

**Total**: 6-8 hours depending on icon creation time and testing depth

---

## Post-Implementation: Deployment

**Cloudflare Pages configuration** (after merge):
1. Build command: `npm run build:georgetown`
2. Build output: `apps/georgetown/dist`
3. No special headers needed (Cloudflare auto-configures)

**First deployment test:**
1. Visit deployed URL
2. Check service worker registers (DevTools)
3. Test install prompt on mobile
4. Test offline mode
5. Deploy new version, verify update prompt

---

## Final Notes

This implementation is based on proven architecture from Brandmine Hub. The plan includes:
- Complete code samples (copy-paste ready)
- Architecture decisions with rationale
- Comprehensive troubleshooting guide
- Testing checklist
- China-safe compliance verification

AI should have everything needed to implement independently. If questions arise, refer to plan document first.

**Good luck!** 🚀
