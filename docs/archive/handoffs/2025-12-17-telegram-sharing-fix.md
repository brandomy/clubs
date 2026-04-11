# Telegram Sharing Fix - Handoff Document

**Date**: 2025-12-17
**Status**: 🚀 DEPLOYED - Awaiting verification
**Commit**: 3d7422a

---

## Problem Summary

Telegram and WhatsApp showing incomplete link previews when sharing Georgetown speaker URLs:
- Telegram: Shows speaker name but no clickable link
- WhatsApp: Expected to show similar incomplete preview
- Messages app: Works correctly (baseline)

---

## Root Cause

**Three-layer investigation revealed:**

1. ✅ **Meta tags exist** - Open Graph tags present in HTML
2. ✅ **Middleware exists** - `_middleware.ts` correctly implements server-side injection
3. ❌ **Deployment location wrong** - Functions compiled to wrong directory

### The Core Issue

Cloudflare Pages Functions must be located at **project root `/functions`**, not in build output `/dist/functions`.

**What was happening:**
```
Build process:
1. TypeScript source: apps/georgetown/functions/_middleware.ts ✅
2. Compiled to: apps/georgetown/dist/functions/_middleware.js ❌
3. Cloudflare looked for: apps/georgetown/functions/_middleware.js ❓

Result: Functions never deployed, middleware never ran
```

**Per Cloudflare documentation:**
> "Make sure that the `/functions` directory is at the root of your Pages project (and not in the static root, such as `/dist`)."

---

## Solution Implemented

### 1. Compile Functions In-Place

**File**: [apps/georgetown/functions/tsconfig.json](../../apps/georgetown/functions/tsconfig.json#L14)

```diff
{
  "compilerOptions": {
-   "outDir": "../dist/functions"
+   "outDir": "."
  }
}
```

**Effect**: TypeScript now compiles `.ts` → `.js` in the same directory

---

### 2. Simplify Build Script

**File**: [apps/georgetown/package.json](../../apps/georgetown/package.json#L10)

```diff
{
  "scripts": {
-   "build:functions": "cd functions && npm install && tsc --project tsconfig.json && cp package.json ../dist/functions/ && cd .."
+   "build:functions": "cd functions && npm install && tsc --project tsconfig.json && cd .."
  }
}
```

**Removed**: Unnecessary copy to dist/ (Cloudflare doesn't use it)

---

### 3. Gitignore Compiled Files

**File**: [apps/georgetown/.gitignore](../../apps/georgetown/.gitignore#L34-L36)

```gitignore
# Cloudflare Functions (compiled .js files - source is .ts)
functions/**/*.js
functions/**/*.js.map
```

**Rationale**:
- Source of truth is TypeScript (`.ts`)
- JavaScript built fresh on each deploy
- Prevents commit conflicts and drift

---

## How It Works Now

### Build Process
```bash
pnpm build:georgetown

# Steps:
1. tsc -b              # Compile TypeScript app
2. vite build          # Build React app to dist/
3. npm run build:functions
   ├── cd functions
   ├── npm install     # Install @supabase/supabase-js
   ├── tsc             # Compile _middleware.ts → _middleware.js (in-place)
   └── cd ..
```

### Deployment Structure
```
apps/georgetown/
├── functions/
│   ├── _middleware.ts    ✅ Source (committed)
│   ├── _middleware.js    ✅ Compiled (gitignored, built on deploy)
│   ├── package.json      ✅ Runtime deps
│   └── node_modules/     ✅ Installed on deploy
└── dist/                 ✅ Static assets
    └── (no functions/)   ✅ Correctly empty
```

### Cloudflare Execution
```
User shares: https://georgetown-rotary.pages.dev/speakers/abc-123

1. Telegram bot requests page (User-Agent: TelegramBot)
2. Cloudflare finds /functions/_middleware.js ✅
3. Middleware detects crawler user agent ✅
4. Fetches speaker from Supabase ✅
5. Injects speaker name into og:title ✅
6. Returns modified HTML to Telegram ✅
7. Telegram shows proper preview with speaker name ✅
```

---

## Verification Steps

### 1. Check Cloudflare Deployment
- Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/)
- Select Georgetown Rotary project
- Verify deployment succeeded (Commit: 3d7422a)
- Check build logs show: `found 0 vulnerabilities` (functions built)

### 2. Test with Real Speaker URL

**Get a real speaker ID:**
1. Go to https://georgetown-rotary.pages.dev
2. Click on any speaker card
3. Copy the URL: `https://georgetown-rotary.pages.dev/speakers/[UUID]`

**Test with curl (simulating Telegram):**
```bash
curl -A "TelegramBot" https://georgetown-rotary.pages.dev/speakers/[UUID] | grep "og:title"

# Expected: <meta property="og:title" content="[Speaker Name]" />
# NOT: <meta property="og:title" content="Georgetown Rotary Speakers" />
```

**Test with real Telegram:**
1. Share speaker URL in Telegram
2. Wait 5-10 seconds for preview to load
3. Should show speaker name + topic
4. Link should be clickable

### 3. Test with WhatsApp

```bash
curl -A "WhatsApp/2.0" https://georgetown-rotary.pages.dev/speakers/[UUID] | grep "og:title"
```

Then share link in WhatsApp and verify preview.

---

## Troubleshooting

### Functions Not Running?

**Check 1: Build logs**
```
# In Cloudflare deployment logs, look for:
> npm install
> tsc --project tsconfig.json
found 0 vulnerabilities
```

**Check 2: Functions tab in Cloudflare**
- Go to Cloudflare Pages → Georgetown → Functions
- Should see `_middleware` listed
- Check for error logs

**Check 3: Curl test**
```bash
# Should return speaker name, not default
curl -A "TelegramBot" https://georgetown-rotary.pages.dev/speakers/[real-uuid] | grep og:title
```

### Telegram Still Shows Wrong Preview?

**Clear Telegram cache:**
- Delete the chat message
- Wait 30 seconds
- Re-share the link
- Telegram refetches metadata

**Test with fresh UUID:**
- Create a new speaker
- Share that new speaker's URL (never cached)

### Build Fails?

**Error: "Cannot find module @supabase/supabase-js"**
- Check `functions/package.json` includes dependency
- Verify `npm install` runs in build:functions script

**Error: "Cannot find _middleware.js"**
- Check TypeScript compiled successfully
- Verify `outDir: "."` in functions/tsconfig.json

---

## Files Modified

### Code Changes
1. **apps/georgetown/functions/tsconfig.json** - outDir set to "."
2. **apps/georgetown/package.json** - Simplified build:functions
3. **apps/georgetown/.gitignore** - Added functions/**/*.js

### Documentation
1. **docs/troubleshooting/2025-12-17-telegram-sharing-investigation.md** - Full investigation log
2. **docs/handoffs/2025-12-17-telegram-sharing-fix.md** - This document

---

## Key Learnings

### 1. Cloudflare Functions Location
- Functions must be at project root, not in build output
- Cloudflare deploys functions separately from static assets
- Source location matters for deployment

### 2. TypeScript Compilation Strategy
- Compile in-place for Cloudflare to find
- Gitignore compiled files (built fresh on deploy)
- Keeps source TypeScript as source of truth

### 3. Debugging Deployment Issues
- Test with curl and user agent strings
- Check Cloudflare Functions tab for logs
- Verify file locations match Cloudflare's expectations

### 4. Crawler Detection
- Each platform has different user agent
- Middleware correctly handles: Telegram, WhatsApp, Slack, Facebook, Twitter, LinkedIn
- Regular users bypass middleware (fast for humans)

---

## Related Documentation

- **Investigation log**: [docs/troubleshooting/2025-12-17-telegram-sharing-investigation.md](../troubleshooting/2025-12-17-telegram-sharing-investigation.md)
- **Previous deployment fix**: [docs/handoffs/2025-12-17-cloudflare-deployment-resolution.md](./2025-12-17-cloudflare-deployment-resolution.md)
- **Functions README**: [apps/georgetown/functions/README.md](../../apps/georgetown/functions/README.md)
- **Cloudflare Functions docs**: https://developers.cloudflare.com/pages/functions/

---

## Status

**Deployment**: ✅ PUSHED (Commit 3d7422a)
**Cloudflare Build**: ⏳ IN PROGRESS
**Testing**: ⏳ PENDING

**Next Actions**:
1. Wait 2-3 minutes for Cloudflare build
2. Run curl tests with real speaker UUID
3. Test in actual Telegram app
4. Verify WhatsApp also works
5. Mark as ✅ VERIFIED once confirmed

---

**Handoff Complete** ✅

Ready for verification testing once Cloudflare deployment completes.
