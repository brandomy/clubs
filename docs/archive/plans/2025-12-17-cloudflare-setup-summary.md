# Cloudflare Deployment Strategy - HuaQiao Foundation Club Platforms

**Date**: 2025-12-17
**Type**: Infrastructure Plan Summary
**Status**: ✅ Ready for Implementation

---

## Strategic Vision

### Open-Source Club Management Platforms
Building reusable platforms for Rotary and Toastmasters clubs across the region:
- **Shared codebase** in monorepo
- **Separate instances** per club (own data, own deployment)
- **Scalable architecture** for regional expansion

### Pilot Clubs
- **Georgetown Rotary Club** - First Rotary instance
- **Pitchmasters Toastmasters Club** - First Toastmasters instance

### Future Expansion
Single Cloudflare account will host all club instances:
```
georgetown-rotary.pages.dev
pitchmasters-toastmasters.pages.dev
penang-rotary.pages.dev (future)
singapore-rotary.pages.dev (future)
kl-toastmasters.pages.dev (future)
```

---

## Current Situation

### Existing Deployments (OLD - Separate Repos)
- **Georgetown**: `georgetown-rotary-club.pages.dev` (deployed 14d ago)
  - Connected to: `club-management-solutions/georgetown-rotary-club`
  - Status: ⚠️ Outdated repo, needs migration

- **Pitchmasters**: `pitchmasters-toastmasters.pages.dev` (deployed 2mo ago)
  - Connected to: `club-management-solutions/pitchmasters-toastmasters`
  - Status: ⚠️ Outdated repo, needs migration

### New Setup (Monorepo)
- **Repository**: `HuaQiao-Foundation/clubs`
- **Structure**: Both apps in monorepo (`apps/georgetown/`, `apps/pitchmasters/`)
- **Status**: ✅ Ready for fresh deployment

---

## Naming Strategy: Instance-Based ✅

**Pattern**: `{club-name}-{organization-type}`

**Benefits**:
- Clean, professional URLs
- No implementation details (`-monorepo` suffix removed)
- Scalable for adding more clubs
- Open-source friendly

**Examples**:
- Georgetown: `georgetown-rotary` (not `georgetown-rotary-monorepo`)
- Pitchmasters: `pitchmasters-toastmasters` (not `pitchmasters-monorepo`)

---

## What We Created

### Configuration Files

**Georgetown**:
- ✅ [wrangler.toml](../apps/georgetown/wrangler.toml) - Local Cloudflare development config
- ✅ [public/_redirects](../apps/georgetown/public/_redirects) - SPA routing for React Router
- ✅ [.env.cloudflare.example](../apps/georgetown/.env.cloudflare.example) - Environment variable template

**Pitchmasters**:
- ✅ [wrangler.toml](../apps/pitchmasters/wrangler.toml) - Local Cloudflare development config
- ✅ [public/_redirects](../apps/pitchmasters/public/_redirects) - SPA routing for React Router

### Security Enhancements

**Georgetown**:
- ✅ Enhanced [_headers](../apps/georgetown/public/_headers) - Added cache-control, permissions-policy
- ✅ Enhanced [robots.txt](../apps/georgetown/public/robots.txt) - Added AI bot blocking (GPTBot, Claude-Web, etc.)

**Both Apps**:
- ✅ Standardized security headers
- ✅ Comprehensive bot blocking (search engines, AI crawlers, archive services)
- ✅ SPA routing configured

### Documentation

- ✅ [Cloudflare Monorepo Deployment Guide](./cloudflare-monorepo-deployment.md) - Complete step-by-step deployment instructions
- ✅ This summary document

---

## Configuration Comparison

| Feature | Georgetown | Pitchmasters | Status |
|---------|-----------|--------------|---------|
| **wrangler.toml** | ✅ Created | ✅ Created | Both ready |
| **_redirects** | ✅ Created | ✅ Created | Both ready |
| **_headers** | ✅ Enhanced | ✅ Already good | Standardized |
| **robots.txt** | ✅ Enhanced | ✅ Already good | Standardized |
| **.env.cloudflare.example** | ✅ Created | ✅ Already exists | Both ready |
| **PWA Support** | ✅ Configured | ❌ Not configured | Georgetown only |
| **Image Optimization** | ✅ Configured | ❌ Not configured | Georgetown only |

---

## Deployment Configuration

### Georgetown Rotary

```yaml
Project Name: georgetown-rotary
Repository: HuaQiao-Foundation/clubs
Branch: main
Build Command: npm run build:georgetown
Build Output: apps/georgetown/dist
Root Directory: (blank - monorepo root)
Node Version: 18+
```

**Environment Variables** (Production):
```bash
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ[key]...
VITE_APP_ENV=production
VITE_CHINA_MODE=true
VITE_ENABLE_ANALYTICS=false
VITE_PWA_DEV=false
```

### Pitchmasters Toastmasters

```yaml
Project Name: pitchmasters-toastmasters
Repository: HuaQiao-Foundation/clubs
Branch: main
Build Command: npm run build:pitchmasters
Build Output: apps/pitchmasters/dist
Root Directory: (blank - monorepo root)
Node Version: 18+
```

**Environment Variables** (Production):
```bash
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ[key]...
VITE_APP_ENV=production
VITE_CHINA_MODE=true
VITE_ENABLE_ANALYTICS=false
```

---

## Key Differences from Old Setup

### Old Setup (Separate Repos)
- ❌ Each app in separate repository
- ❌ Build command: `npm run build` (from app root)
- ❌ Build output: `dist` (at app root)
- ❌ Root directory: `/` (app itself was root)

### New Setup (Monorepo)
- ✅ Both apps in single repository
- ✅ Build command: `npm run build:georgetown` or `npm run build:pitchmasters` (from monorepo root)
- ✅ Build output: `apps/georgetown/dist` or `apps/pitchmasters/dist`
- ✅ Root directory: blank (so Cloudflare can access root package.json)

---

## Security Features

Both apps now have comprehensive protection:

### HTTP Headers
- `X-Robots-Tag`: noindex, nofollow, noarchive, nosnippet, noimageindex, nocache
- `X-Frame-Options`: DENY
- `X-Content-Type-Options`: nosniff
- `Referrer-Policy`: no-referrer
- `Cache-Control`: private, no-cache, no-store, must-revalidate
- `Permissions-Policy`: Blocks geolocation, microphone, camera

### robots.txt Blocking
- All major search engines (Google, Bing, Yahoo, DuckDuckGo, Baidu, Yandex)
- Social media bots (Facebook, Twitter, LinkedIn, WhatsApp)
- AI/ML training crawlers (GPTBot, ChatGPT-User, CCBot, Claude-Web, PerplexityBot)
- SEO crawlers (AhrefsBot, SemrushBot)
- Archive services (Internet Archive, Wayback Machine)

---

## Ready to Deploy

### Pre-Deployment Checklist

**Before creating Cloudflare Pages projects**:
- ✅ Configuration files created
- ✅ Security headers standardized
- ✅ SPA routing configured
- ✅ Environment variable templates ready
- ✅ Deployment guide written
- ⏸️ Supabase credentials ready (get these before deploying)
- ⏸️ Custom domains noted (if migrating from old deployments)

**Local Testing** (optional but recommended):
```bash
# Build both apps locally to verify
npm run build:georgetown
npm run build:pitchmasters

# Preview locally
cd apps/georgetown && npm run preview
cd apps/pitchmasters && npm run preview

# Check for build errors
npm run typecheck
```

---

## Next Steps

Follow the [Cloudflare Monorepo Deployment Guide](./cloudflare-monorepo-deployment.md) to:

1. **Create Georgetown project** (~15 min)
   - Create Cloudflare Pages project
   - Connect to `HuaQiao-Foundation/clubs`
   - Configure build settings
   - Add environment variables
   - Deploy and verify

2. **Create Pitchmasters project** (~15 min)
   - Same process as Georgetown
   - Different build command and output path

3. **Migrate custom domains** (if applicable)
   - Move domains from old projects to new
   - Verify SSL certificates

4. **Keep old projects as backup** (30 days)
   - Don't delete immediately
   - Archive after new deployments proven stable

5. **Test China accessibility**
   - Use Great Firewall test
   - Verify with VPN
   - Check load times

---

## Files Changed in This Session

**Created**:
- `apps/georgetown/wrangler.toml`
- `apps/pitchmasters/wrangler.toml`
- `apps/georgetown/public/_redirects`
- `apps/pitchmasters/public/_redirects`
- `apps/georgetown/.env.cloudflare.example`
- `docs/cloudflare-monorepo-deployment.md`
- `docs/cloudflare-setup-summary.md` (this file)

**Modified**:
- `apps/georgetown/public/_headers` (enhanced security)
- `apps/georgetown/public/robots.txt` (added AI bot blocking)

---

## Commit Message Suggestion

When you're ready to commit these changes:

```bash
git add .
git commit -m "config: prepare Cloudflare Pages deployment for monorepo

Add complete Cloudflare Pages configuration for both apps:
- Create wrangler.toml for local development testing
- Add _redirects files for SPA routing support
- Enhance security headers (Georgetown now matches Pitchmasters)
- Block AI/ML crawlers in robots.txt (GPTBot, Claude-Web, etc.)
- Add environment variable templates
- Create comprehensive deployment guide for monorepo setup

This prepares for fresh Cloudflare Pages deployments to replace
old separate-repo projects with new monorepo-based projects.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git push origin main
```

**Note**: Push BEFORE creating Cloudflare projects, so the new config files are available during first deployment.

---

## Deployment Time Estimate

- **Georgetown setup**: 15 minutes
- **Pitchmasters setup**: 15 minutes
- **Testing & verification**: 15 minutes
- **Custom domain migration**: 10 minutes (if applicable)

**Total**: ~30-55 minutes for complete migration

---

## Success Criteria

Deployment is successful when:

**Georgetown**:
- [ ] New Cloudflare Pages project created
- [ ] Site loads at `georgetown-rotary.pages.dev`
- [ ] All features working (speakers, events, drag-drop)
- [ ] PWA manifest loads correctly
- [ ] No console errors
- [ ] China accessible (verified with test)
- [ ] Custom domain working (if applicable)

**Pitchmasters**:
- [ ] New Cloudflare Pages project created
- [ ] Site loads at `pitchmasters-toastmasters.pages.dev`
- [ ] All features working (meetings, roles, drag-drop)
- [ ] No console errors
- [ ] China accessible (verified with test)
- [ ] Custom domain working (if applicable)

**Both**:
- [ ] Automatic deployments working (push to main triggers deploy)
- [ ] Preview deployments working (feature branches)
- [ ] Analytics enabled
- [ ] Old projects kept as backup

---

*Prepared: 2025-12-17*
*Ready for deployment: Yes*
*Estimated completion: 30-55 minutes*
