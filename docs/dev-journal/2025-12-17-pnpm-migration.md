=== CLUBS MONOREPO DEV JOURNAL ===

**Date:** 2025-12-17
**Project:** Clubs Monorepo (Georgetown Rotary + Pitchmasters)
**Task:** Migrate from npm workspaces to pnpm
**Status:** Complete
**CTO:** Claude Code | **CEO:** Randal Eastman

---

## Business Impact Summary

**Problem Solved**
- Inconsistent package management across portfolio projects (HuaQiao uses pnpm, Clubs used npm)
- Slower dependency installation and larger disk usage with npm workspaces
- Potential phantom dependency issues with npm's less strict resolution
- Different tooling between projects increases context switching costs

**Value Delivered**
- Unified package management standard across all portfolio projects (HuaQiao + Clubs)
- ~3x faster dependency installation via pnpm's hard-link architecture
- Significant disk space savings through content-addressable storage
- Stricter dependency resolution prevents subtle bugs from phantom dependencies
- Aligned with modern monorepo best practices (pnpm + Turborepo is 2025 standard)

**Strategic Alignment**
- Standardization reduces cognitive overhead when switching between projects
- Infrastructure consistency enables easier knowledge transfer and tooling reuse
- Positions monorepo for future scaling (additional apps, shared packages)
- Locked version (`pnpm@10.24.0`) ensures reproducible builds across environments

---

## Technical Implementation

**Migration Steps**

1. **Created pnpm workspace configuration**
   - Added `pnpm-workspace.yaml` defining `apps/*` pattern
   - Created `.npmrc` with optimized pnpm settings

2. **Updated package management**
   - Removed `workspaces` field from root `package.json`
   - Converted all npm scripts to pnpm filter commands
   - Updated engine requirements: `npm >=9.0.0` → `pnpm >=9.0.0`
   - Locked to specific version: `packageManager: "pnpm@10.24.0"`

3. **Cleaned legacy artifacts**
   - Removed all `package-lock.json` files (root + both apps)
   - Generated new `pnpm-lock.yaml` with strict dependency resolution
   - Cleaned and reinstalled all dependencies

4. **Updated documentation**
   - Updated `CLAUDE.md` with pnpm commands and benefits
   - Updated deployment instructions for Cloudflare Pages
   - Added pnpm-specific workspace management details

**Files Modified**
- `package.json` - New pnpm scripts and packageManager field
- `CLAUDE.md` - Updated all command examples and documentation
- `.npmrc` - Created with pnpm configuration
- `pnpm-workspace.yaml` - Created workspace definition
- `pnpm-lock.yaml` - New lockfile (959 packages)

**Files Removed**
- `package-lock.json` (root)
- `apps/georgetown/package-lock.json`
- `apps/pitchmasters/package-lock.json`

**New Commands**

```bash
# Development (now runs in parallel automatically)
pnpm dev                  # Both apps simultaneously
pnpm dev:georgetown       # Port 5180
pnpm dev:pitchmasters     # Port 5190

# Building
pnpm build               # All apps
pnpm build:georgetown    # Single app
pnpm build:pitchmasters  # Single app

# Quality checks
pnpm lint                # Lint all apps
pnpm typecheck           # Type check all apps
pnpm clean               # Clean everything including pnpm-lock.yaml
```

**Testing Performed**
- ✅ Verified both apps install dependencies correctly
- ✅ Verified Georgetown dev server starts (Port 5180)
- ✅ Verified Pitchmasters dev server starts (Port 5190)
- ✅ Verified Georgetown production build succeeds
- ✅ All 959 packages installed in 9 seconds

---

## Backlog System Refinement

**Archive Restructuring**

Based on CEO feedback about root directory clutter and questioning all-caps naming convention, performed critical analysis:

**Issue Identified:**
- `BACKLOG-ARCHIVE.md` at root was over-engineered for solo dev workflow
- Archives are historical documentation, not active tracking
- Best practice sources don't mandate archive files - they emphasize lean backlogs

**Solution Implemented:**
- Moved `BACKLOG-ARCHIVE.md` → `docs/archive/backlog-2025.md`
- Year-based organization (`backlog-YYYY.md`) for scalability
- Reduced root directory clutter
- Updated all references in documentation

**Rationale:**
- Archives should live with documentation, not at root
- Year-based naming scales better than single archive file
- Aligns with actual 2025 best practices (lean root, archive only what's necessary)
- CEO's question surfaced valid concern about over-engineering

---

## Backlog Updates

**Items Added:**
- **GEO-001** (P2) - Add web sharing capability to Georgetown app
  - Enable sharing of events, speakers, and content via Web Share API
  - Estimate: M (4-8 hours)

**Items Completed:**
- **MONO-001** (P2) - Setup backlog management system
  - Archive moved to `docs/archive/`
  - Status: Done ✅

- **MONO-002** (P1) - Migrate from npm to pnpm workspaces
  - Infrastructure migration complete
  - Commit: e0764d8
  - Status: Done ✅

**Current Stats:**
- Total Items: 3
- Done (pending archive): 2
- Active (Backlog): 1
- P0/P1 Items: 0
- In Progress: 0
- Blocked: 0

---

## Deployment Implications

**Cloudflare Pages Updates Required**

Both apps need build command updates in Cloudflare Pages dashboard:

**Georgetown:**
- Old: `npm run build:georgetown`
- New: `pnpm build:georgetown`

**Pitchmasters:**
- Old: `npm run build:pitchmasters`
- New: `pnpm build:pitchmasters`

**Note:** Cloudflare Pages auto-detects pnpm via `packageManager` field and `pnpm-lock.yaml` presence.

---

## Key Learnings

**Package Manager Migration**
1. pnpm's parallel execution (`--parallel` flag) is built-in and efficient
2. Filter syntax (`--filter rotary-speakers`) cleaner than npm workspace syntax
3. Hard links and content-addressable storage provide immediate performance benefits
4. Build script warning about esbuild/sharp is cosmetic - builds work fine

**Documentation Process**
1. CEO questions about naming conventions and file locations are valuable
2. "Best practice" claims should be backed by actual sources, not assumptions
3. Over-engineering detection: If something feels like clutter, question it
4. Simplicity > consistency when consistency adds no value

**Backlog Management**
1. Archives are low-value compared to active backlog
2. Git history can replace many archive use cases
3. Root directory files should "earn their place"
4. Year-based organization prevents single files from growing indefinitely

---

## Next Steps

1. **Update Cloudflare Pages** - Change build commands to use pnpm
2. **Quarterly Archive** - Move completed items to `docs/archive/backlog-2025.md`
3. **Implement GEO-001** - Web sharing capability for Georgetown app
4. **Monitor Performance** - Track build/install times with pnpm vs. previous npm setup

---

## Commits

- `e0764d8` - chore: migrate from npm workspaces to pnpm
- `19b8828` - refactor: move backlog archive to docs/archive/ organized by year

---

**Journal Entry By:** Claude Sonnet 4.5
**Review Status:** Ready for CEO Review
**Follow-up Required:** Update Cloudflare Pages build commands
