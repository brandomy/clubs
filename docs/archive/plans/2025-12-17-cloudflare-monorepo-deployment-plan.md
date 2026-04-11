# Cloudflare Pages Deployment Plan - HuaQiao Foundation Club Platforms

**Date**: 2025-12-17
**Type**: Infrastructure & Deployment Strategy
**Status**: Ready for Implementation

---

## Strategic Context

### Vision
Building **open-source club management platforms** for Rotary and Toastmasters clubs in the region. Each club gets their own instance with their own data, deployed from a shared codebase.

### Pilot Clubs (Guinea Pigs)
- **Georgetown Rotary Club** - First Rotary platform instance
- **Pitchmasters Toastmasters Club** - First Toastmasters platform instance

### HuaQiao Foundation Umbrella
All platforms live under the HuaQiao Foundation GitHub organization in a **monorepo architecture**:
- Repository: `HuaQiao-Foundation/clubs`
- Single Cloudflare account hosts all club instances
- Shared codebase, separate data per club

### Future Roadmap
```
Current (2025 Q1):
├── georgetown-rotary (pilot)
└── pitchmasters-toastmasters (pilot)

Future (2025-2026):
├── penang-rotary
├── kuala-lumpur-toastmasters
├── singapore-rotary
└── [more clubs across region]
```

---

## Why Fresh Deployment?

The existing Cloudflare Pages deployments are connected to **old separate repositories**:
- Old Georgetown: `club-management-solutions/georgetown-rotary-club`
- Old Pitchmasters: `club-management-solutions/pitchmasters-toastmasters`

Current codebase is a **monorepo**:
- New repo: `HuaQiao-Foundation/clubs`
- Structure: Both apps in `apps/georgetown/` and `apps/pitchmasters/`

**You cannot reuse the old deployments** - they're configured for different repo structures and build paths.

---

## Naming Strategy

### Selected: Instance-Based Naming ✅

**Rationale**:
- Clean, professional URLs without implementation details
- Scalable for adding more clubs
- Each club instance is clearly identified
- No `-monorepo` suffix (internal implementation detail)
- Open-source friendly naming

**Pattern**: `{club-name}-{organization-type}`

**Examples**:
- Georgetown Rotary: `georgetown-rotary`
- Pitchmasters Toastmasters: `pitchmasters-toastmasters`
- Future: `penang-rotary`, `singapore-rotary`, `kl-toastmasters`

---

## Prerequisites

- [x] Cloudflare account with Pages access
- [x] GitHub repo: `HuaQiao-Foundation/clubs`
- [x] Admin access to Cloudflare account
- [x] Supabase credentials for both projects
- [x] Custom domains noted down (if applicable)

---

## Part 1: Georgetown Rotary Deployment

### Step 1: Create New Cloudflare Pages Project

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click **"Workers & Pages"** in left sidebar
3. Click **"Create application"** → **"Pages"** tab
4. Click **"Connect to Git"**

### Step 2: Connect GitHub Repository

1. Select **GitHub** as provider
2. Authorize Cloudflare (if not already done)
3. Select repository: **`HuaQiao-Foundation/clubs`**
4. Click **"Begin setup"**

### Step 3: Configure Build Settings

**Project name**: `georgetown-rotary`

**Production branch**: `main`

**Build settings**:
```
Framework preset: None (manual configuration)
Build command: npm run build:georgetown
Build output directory: apps/georgetown/dist
Root directory: (leave blank)
Environment variables: (see below)
```

**Important**: Do NOT select "Vite" preset - it will use wrong build command

### Step 4: Set Environment Variables

Click **"Add variable"** and add these for **Production**:

```bash
VITE_SUPABASE_URL=https://[your-project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ[your-key]...
VITE_APP_ENV=production
VITE_CHINA_MODE=true
VITE_ENABLE_ANALYTICS=false
```

Repeat for **Preview** environment (same values or different if needed).

### Step 5: Deploy

1. Click **"Save and Deploy"**
2. Watch build logs (takes ~2-3 minutes)
3. Note the deployment URL: `georgetown-rotary.pages.dev`

### Step 6: Verify Georgetown Deployment

Test the following:
- [ ] Site loads at `.pages.dev` URL
- [ ] Speaker kanban displays correctly
- [ ] Drag-and-drop works
- [ ] Data loads from Supabase
- [ ] PWA manifest loads (check DevTools → Application → Manifest)
- [ ] No console errors
- [ ] Mobile responsive (test 320px width)

### Step 7: Custom Domain (Optional)

If you had a custom domain on old deployment:

1. In project settings → **"Custom domains"**
2. Click **"Set up a custom domain"**
3. Enter domain (e.g., `georgetown.rotary.club`)
4. Follow DNS instructions
5. Wait for SSL certificate (~5 minutes)

---

## Part 2: Pitchmasters Deployment

### Step 1: Create New Cloudflare Pages Project

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click **"Workers & Pages"** → **"Create application"** → **"Pages"**
3. Click **"Connect to Git"**

### Step 2: Connect GitHub Repository

1. Select **GitHub**
2. Select repository: **`HuaQiao-Foundation/clubs`** (same repo, different build config)
3. Click **"Begin setup"**

### Step 3: Configure Build Settings

**Project name**: `pitchmasters-toastmasters`

**Production branch**: `main`

**Build settings**:
```
Framework preset: None
Build command: npm run build:pitchmasters
Build output directory: apps/pitchmasters/dist
Root directory: (leave blank)
Environment variables: (see below)
```

### Step 4: Set Environment Variables

Click **"Add variable"** and add these for **Production**:

```bash
VITE_SUPABASE_URL=https://[your-project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ[your-key]...
VITE_APP_ENV=production
VITE_CHINA_MODE=true
VITE_ENABLE_ANALYTICS=false
```

Repeat for **Preview** environment.

### Step 5: Deploy

1. Click **"Save and Deploy"**
2. Watch build logs (~2 minutes)
3. Note the deployment URL: `pitchmasters-toastmasters.pages.dev`

### Step 6: Verify Pitchmasters Deployment

Test the following:
- [ ] Site loads at `.pages.dev` URL
- [ ] Meeting roles display correctly
- [ ] Drag-and-drop works
- [ ] Data loads from Supabase
- [ ] No console errors
- [ ] Mobile responsive

### Step 7: Custom Domain (Optional)

Same process as Georgetown if you have a custom domain.

---

## Part 3: Migration from Old Deployments

### For Georgetown

**Old project**: `georgetown-rotary-club`

**Steps**:
1. ✅ Note custom domain (if exists)
2. ✅ Export environment variables (compare with new ones)
3. ✅ Test new deployment thoroughly
4. ✅ Move custom domain to new project
5. ⏸️ **Keep old project for 30 days** (don't delete yet)
6. ⏸️ After 30 days, delete old project

### For Pitchmasters

**Old project**: `pitchmasters-toastmasters`

**Steps**:
1. ✅ Note custom domain (if exists)
2. ✅ Export environment variables
3. ✅ Test new deployment
4. ✅ Move custom domain to new project
5. ⏸️ **Keep old project for 30 days**
6. ⏸️ After 30 days, delete old project

---

## Part 4: Post-Deployment Configuration

### Enable Analytics (Both Apps)

1. Cloudflare Dashboard → Select project
2. **"Analytics"** tab → **"Web Analytics"**
3. Enable analytics
4. Note: Privacy-friendly, no cookies, GDPR compliant

### Set Up Deployment Notifications (Optional)

1. Project settings → **"Notifications"**
2. Add email for deployment success/failure alerts
3. Add webhook for Slack/Discord (if desired)

### Configure Branch Previews

**Default behavior**: All branches get preview deployments

**To limit previews** (recommended):
1. Settings → **"Builds & deployments"**
2. **"Branch preview settings"**
3. Select: "Custom branches only"
4. Add pattern: `feature/*` or `preview/*`

This prevents preview deployments for every random branch.

---

## Part 5: Testing China Accessibility

Both apps are configured for China accessibility. Verify:

### Method 1: Great Firewall Test
1. Visit [chinafirewalltest.com](https://www.chinafirewalltest.com/)
2. Enter your `.pages.dev` URL
3. Check results (should be accessible)

### Method 2: VPN Testing
1. Use China-based VPN
2. Visit both apps
3. Verify load time < 5 seconds
4. Check no external CDN failures

### Method 3: Speed Test
1. Visit [dotcom-tools.com/website-speed-test](https://www.dotcom-tools.com/website-speed-test)
2. Select China locations
3. Run speed test
4. Verify reasonable load times

---

## Part 6: Ongoing Deployment Workflow

### For Future Code Changes

**Automatic deployments enabled** - just push to GitHub:

```bash
# Make changes locally
git add .
git commit -m "feat: add new feature"
git push origin main

# Cloudflare automatically:
# 1. Detects push to main
# 2. Runs build command
# 3. Deploys to production
# 4. Updates both apps independently
```

### For Preview Deployments

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
git add .
git commit -m "feat: implement new feature"

# Push to GitHub
git push origin feature/new-feature

# Cloudflare automatically:
# 1. Creates preview deployment
# 2. URL: feature-new-feature.[project-name].pages.dev
# 3. Test in isolation
# 4. Merge to main when ready
```

### Environment Variable Updates

When you update environment variables:

1. Cloudflare Dashboard → Project → Settings → Environment variables
2. Update variable value
3. **Save**
4. **Trigger redeploy** (required for changes to take effect):

```bash
# Option 1: Empty commit
git commit --allow-empty -m "chore: trigger redeploy for env var changes"
git push origin main

# Option 2: Use Cloudflare dashboard
# Deployments → View build → "Retry deployment" button
```

---

## Part 7: Troubleshooting

### Build Fails: "Module not found"

**Cause**: Dependencies not installed in monorepo root

**Fix**:
```bash
# Locally:
rm -rf node_modules apps/*/node_modules
npm install
npm run build:georgetown
npm run build:pitchmasters

# If works locally, push to trigger new build
```

### Build Fails: "Command not found: npm run build:georgetown"

**Cause**: Build command wrong or root directory wrong

**Fix**:
1. Verify build command: `npm run build:georgetown` (exact)
2. Verify root directory is blank (not `apps/georgetown`)
3. Check `package.json` in repo root has this script

### Site Loads but Shows Blank Page

**Cause 1**: Missing `_redirects` file for SPA routing

**Fix**: Already added in this setup - check it deployed:
```bash
# Should exist in build output
ls apps/georgetown/dist/_redirects
ls apps/pitchmasters/dist/_redirects
```

**Cause 2**: Environment variables missing

**Fix**: Check Cloudflare dashboard → Settings → Environment variables

### Supabase Connection Fails

**Cause**: Wrong environment variables

**Fix**:
1. Verify `VITE_SUPABASE_URL` starts with `https://`
2. Verify `VITE_SUPABASE_ANON_KEY` is correct
3. Check Supabase project is running
4. Test connection locally first

---

## Part 8: Rollback Procedures

### Emergency Rollback (Instant)

If new deployment breaks:

1. Cloudflare Dashboard → Project → **"Deployments"**
2. Find last working deployment
3. Click **"..."** → **"Rollback to this deployment"**
4. Confirm
5. **Rollback time**: ~1-2 minutes

### Git Rollback (If needed)

```bash
# Find problematic commit
git log --oneline -10

# Revert it
git revert [commit-hash]
git push origin main

# Cloudflare auto-deploys the revert
```

---

## Checklist: Complete Deployment

Use this to verify both apps are fully deployed:

### Georgetown
- [ ] Cloudflare Pages project created (`georgetown-rotary`)
- [ ] Connected to `HuaQiao-Foundation/clubs` repo
- [ ] Build command: `npm run build:georgetown`
- [ ] Build output: `apps/georgetown/dist`
- [ ] Environment variables set (Production + Preview)
- [ ] Successful deployment (green checkmark)
- [ ] Site loads at `.pages.dev` URL
- [ ] All features working (speakers, events, drag-drop)
- [ ] PWA manifest loads
- [ ] Custom domain configured (if applicable)
- [ ] China accessibility verified
- [ ] Old project kept as backup (don't delete yet)

### Pitchmasters
- [ ] Cloudflare Pages project created (`pitchmasters-toastmasters`)
- [ ] Connected to `HuaQiao-Foundation/clubs` repo
- [ ] Build command: `npm run build:pitchmasters`
- [ ] Build output: `apps/pitchmasters/dist`
- [ ] Environment variables set (Production + Preview)
- [ ] Successful deployment (green checkmark)
- [ ] Site loads at `.pages.dev` URL
- [ ] All features working (meetings, roles, drag-drop)
- [ ] Custom domain configured (if applicable)
- [ ] China accessibility verified
- [ ] Old project kept as backup (don't delete yet)

### Both Apps
- [ ] Branch preview deployments working
- [ ] Analytics enabled
- [ ] Deployment notifications configured
- [ ] Team members granted access (if applicable)
- [ ] Documentation updated with new URLs
- [ ] Old deployments noted for deletion in 30 days

---

## Support & Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare Community Forum](https://community.cloudflare.com/)
- [Vite Static Deploy Guide](https://vitejs.dev/guide/static-deploy.html#cloudflare-pages)
- [Monorepo Build Patterns](https://developers.cloudflare.com/pages/configuration/build-configuration/)

---

## Summary of Changes Made

This deployment setup includes:

**New files created**:
- ✅ `apps/georgetown/wrangler.toml` - Local development config
- ✅ `apps/pitchmasters/wrangler.toml` - Local development config
- ✅ `apps/georgetown/public/_redirects` - SPA routing support
- ✅ `apps/pitchmasters/public/_redirects` - SPA routing support
- ✅ `apps/georgetown/.env.cloudflare.example` - Environment variable template

**Files updated**:
- ✅ `apps/georgetown/public/_headers` - Enhanced security headers (matched Pitchmasters)
- ✅ `apps/georgetown/public/robots.txt` - Added AI bot blocking

**Configuration standardized**:
- ✅ Both apps now have identical security header structure
- ✅ Both apps block AI/ML crawlers and archive bots
- ✅ Both apps have SPA routing configured
- ✅ Both apps have local Wrangler testing support

---

**Next Steps**: Follow this guide to create the two new Cloudflare Pages projects. The old projects will remain as backups for 30 days.

**Deployment Time Estimate**: ~30 minutes total (15 minutes per app)

---

*Created: 2025-12-17*
*Maintained by: CTO*
*Migration from: Separate repos → Monorepo*
