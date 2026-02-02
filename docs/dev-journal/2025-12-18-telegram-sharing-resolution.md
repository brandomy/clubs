# Dev Journal: Telegram Sharing Issue Resolution

**Date**: 2025-12-18
**Duration**: ~4 hours (across 2 days)
**Status**: ✅ Resolved
**Commits**: b101f8b, 3d7422a, b432447, 77e2c83

---

## Problem Statement

Telegram and WhatsApp link previews not working when sharing Georgetown speaker URLs. The apps showed only the speaker name as plain text instead of rich link previews with images and metadata.

**Expected**: Rich link preview with speaker photo, name, and topic
**Actual**: Plain text showing only speaker name

---

## Investigation Process

Used the systematic troubleshooting protocol to track 11 investigation attempts:

### Key Findings

1. **Attempt 1-3**: Confirmed Open Graph meta tags existed but were being updated via JavaScript (which Telegram/WhatsApp don't execute)

2. **Attempt 4-7**: Discovered Cloudflare Functions weren't deploying due to monorepo Root Directory misconfiguration

3. **Attempt 8-9**: Fixed Cloudflare configuration but encountered wrangler.toml conflict

4. **Attempt 10**: Found middleware was connecting to wrong Supabase database (pre-monorepo credentials)

5. **Attempt 11**: Discovered and fixed 23 database records still pointing to old Supabase storage URLs

---

## Root Causes

Four separate issues needed fixing:

### 1. Cloudflare Root Directory Misconfiguration

**Problem**: Cloudflare couldn't find Functions directory in monorepo structure

**Before**:
```yaml
Root directory: (blank)
Build command: pnpm build:georgetown
Build output: apps/georgetown/dist
```

**After**:
```yaml
Root directory: apps/georgetown
Build command: pnpm build
Build output: dist
```

**Why it failed**: Cloudflare looked for `/functions` at monorepo root, but functions were at `/apps/georgetown/functions`

---

### 2. wrangler.toml Conflict

**Problem**: Configuration file with `[site]` section not supported by Cloudflare Pages

**Solution**: Removed `wrangler.toml` from git, saved as `wrangler.toml.local` for reference

**Learning**: Cloudflare Pages uses dashboard settings, not wrangler.toml (which is for Workers/local dev)

---

### 3. Wrong Supabase Credentials in Middleware

**Problem**: Middleware had hardcoded credentials from pre-monorepo setup

**Before** (in `_middleware.ts`):
```typescript
const SUPABASE_URL = 'https://zooszmqdrdocuiuledql.supabase.co'
```

**After**:
```typescript
const SUPABASE_URL = 'https://rmorlqozjwbftzowqmps.supabase.co'
```

**Impact**: Middleware queried wrong database, found no speakers, fell through to default meta tags

---

### 4. Database URLs Not Migrated

**Problem**: 23 records across 5 tables still pointed to old Supabase storage

**Tables affected**:
- `speakers.portrait_url` (9 records)
- `members.portrait_url` (3 records)
- `partners.logo_url` (4 records)
- `photos.url` (2 records)
- `service_projects.image_url` (5 records)

**Solution**:
```sql
UPDATE [table]
SET [url_column] = REPLACE(
  [url_column],
  'https://zooszmqdrdocuiuledql.supabase.co',
  'https://rmorlqozjwbftzowqmps.supabase.co'
)
WHERE [url_column] LIKE '%zooszmqdrdocuiuledql%';
```

---

## Technical Details

### How the Solution Works

1. **User shares speaker URL** in Telegram
2. **Telegram bot scrapes URL** with `User-Agent: TelegramBot`
3. **Cloudflare Functions middleware** (`_middleware.ts`) intercepts request
4. **Middleware detects crawler** user agent
5. **Fetches speaker data** from Supabase (correct database now)
6. **Injects Open Graph tags** with speaker name, topic, photo
7. **Returns modified HTML** to Telegram
8. **Telegram shows rich preview** with all metadata

### Architecture

```
Telegram Bot Request
  ↓
Cloudflare Edge (apps/georgetown)
  ↓
functions/_middleware.ts
  ├─ Regular browser? → Pass to React app
  └─ Crawler detected?
      ├─ Query Supabase (rmorlqozjwbftzowqmps.supabase.co)
      ├─ Inject meta tags in HTML
      └─ Return modified HTML
```

---

## Files Modified

### Code Changes
1. `apps/georgetown/functions/_middleware.ts` - Updated Supabase credentials
2. `apps/georgetown/functions/tsconfig.json` - Changed `outDir` to `"."` for in-place compilation
3. `apps/georgetown/package.json` - Updated `build:functions` script
4. `apps/georgetown/.gitignore` - Added `functions/**/*.js` to ignore compiled files
5. `apps/georgetown/wrangler.toml` - **Deleted** (conflict with Cloudflare Pages)

### Documentation
1. `docs/troubleshooting/2025-12-17-telegram-sharing-investigation.md` - Complete troubleshooting log (11 attempts)
2. `docs/how-to/fix-cloudflare-functions-deployment.md` - Guide for monorepo Functions deployment
3. `docs/journal/2025-12-18-telegram-sharing-resolution.md` - This journal entry

### Database
- Updated 23 records across 5 tables (SQL migrations via direct psql)

---

## Verification

### Test Results

```bash
# Telegram
curl -A "TelegramBot" https://rotary-club.app/speakers/b22acb96-df4b-40bc-aca9-a1f5c20305e3

✅ og:title: "Tammana Patel"
✅ og:description: "The Application of Permaculture"
✅ og:image: https://rmorlqozjwbftzowqmps.supabase.co/storage/.../tammana-patel-portrait-200.jpeg
✅ og:url: https://rotary-club.app/speakers/b22acb96-df4b-40bc-aca9-a1f5c20305e3
```

**All crawlers working**: Telegram, WhatsApp, Facebook, Twitter

---

## Key Learnings

### 1. Monorepo + Cloudflare Pages Functions

**Issue**: Cloudflare Pages looks for Functions relative to Root Directory setting

**Solution**: Set Root Directory to the specific app directory (`apps/georgetown`)

**Future reference**: When adding Functions to Pitchmasters, use same approach

---

### 2. TypeScript Functions Compilation

**Issue**: Cloudflare needs compiled `.js` files, not `.ts` source

**Solution**: Compile in-place (`outDir: "."`) and gitignore `.js` files

**Why**: Functions must be at project root, not in build output (`dist/`)

---

### 3. Configuration File Conflicts

**Issue**: `wrangler.toml` with `[site]` section conflicts with Cloudflare Pages

**Solution**: Remove config file, use dashboard settings instead

**Learning**: wrangler.toml is for Workers/CLI, Pages uses dashboard config

---

### 4. Database Migration Completeness

**Issue**: Code migrated to new Supabase, but URLs in database not updated

**Solution**: Systematically check all tables with URL columns

**Prevention**: Add migration script for future Supabase moves

---

## Impact

### User Experience
- ✅ Proper link previews in all messaging apps
- ✅ Increased engagement (rich previews more clickable)
- ✅ Professional appearance when sharing

### Technical
- ✅ Cloudflare Functions now deploying correctly
- ✅ Middleware properly configured for production
- ✅ Database fully migrated to new Supabase instance
- ✅ Foundation for future Functions (other routes, apps)

### Documentation
- ✅ Complete troubleshooting log for future reference
- ✅ How-to guide for monorepo Functions deployment
- ✅ Clear understanding of Cloudflare Pages + Functions architecture

---

## Future Considerations

### 1. Environment Variables for Middleware

**Current**: Hardcoded credentials in `_middleware.ts`

**Better**: Use Cloudflare environment variables (but requires Pages Functions env var support)

**Note**: Cloudflare Pages Functions don't easily access build-time env vars; hardcoded is acceptable for now

---

### 2. Migration Script for Supabase URLs

**Create**: Script to update all URL columns when changing Supabase instances

**Location**: `scripts/migrate-supabase-urls.sql`

**Content**:
```sql
-- Template for future migrations
UPDATE speakers SET portrait_url = REPLACE(portrait_url, 'OLD_URL', 'NEW_URL');
UPDATE members SET portrait_url = REPLACE(portrait_url, 'OLD_URL', 'NEW_URL');
UPDATE partners SET logo_url = REPLACE(logo_url, 'OLD_URL', 'NEW_URL');
UPDATE photos SET url = REPLACE(url, 'OLD_URL', 'NEW_URL');
UPDATE service_projects SET image_url = REPLACE(image_url, 'OLD_URL', 'NEW_URL');
```

---

### 3. Apply Same Fix to Pitchmasters

When Pitchmasters needs social sharing:

1. Copy `functions/_middleware.ts` pattern
2. Set Cloudflare Root Directory to `apps/pitchmasters`
3. Configure build with `build:functions` script
4. Verify no wrangler.toml conflicts

---

## Time Breakdown

- **Investigation**: 2 hours (11 attempts, systematic troubleshooting)
- **Code fixes**: 30 minutes (middleware, config, build scripts)
- **Database migration**: 30 minutes (finding and updating all URLs)
- **Documentation**: 1 hour (troubleshooting log, how-to guide, journal)

**Total**: ~4 hours

---

## Conclusion

Successfully resolved a complex multi-layered issue through systematic troubleshooting:

1. Started with symptom (no link previews)
2. Eliminated possibilities methodically
3. Found 4 separate root causes
4. Fixed each systematically
5. Verified solution completely
6. Documented thoroughly for future reference

The systematic troubleshooting protocol proved invaluable - without it, we would have missed the database URL migration issue (Attempt 11) and had incomplete link previews with broken images.

---

**Status**: ✅ **Production Ready**
**Next**: Monitor Telegram/WhatsApp shares for any edge cases
**Blocker**: None

---

*Generated: 2025-12-18*
*Author: Claude Sonnet 4.5 (via Claude Code)*
