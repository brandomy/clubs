# BlockNote CMS Implementation

**Date**: 2026-04-11
**Status**: Complete
**Sprint**: Plan 1 — BlockNote CMS

## Summary

Added a Notion-like browser-based CMS to Pitchmasters using [BlockNote](https://www.blocknotejs.org/). Club officers and admins can now create, edit, publish, and delete public pages (About Us, How to Visit, Club History, etc.) directly from within the app. Published pages are readable at `/pages/:slug` without authentication.

## What Was Built

### Database
- **Table**: `public_pages` — stores page content as BlockNote JSONB, with multi-tenant `club_id` isolation
- **RLS policies**: 5 policies enforcing the full permissions matrix (public read of published pages, officer create/edit/publish, admin-only delete)
- **Auto-trigger**: `moddatetime` trigger keeps `updated_at` current on every UPDATE
- **SQL script**: `docs/database/sql-scripts/008-public-pages.sql`

### Permissions Matrix
| Action | Public | Member | Officer | Admin |
|--------|--------|--------|---------|-------|
| View published pages | ✅ | ✅ | ✅ | ✅ |
| View draft pages | ❌ | ❌ | ✅ | ✅ |
| Create / Edit | ❌ | ❌ | ✅ | ✅ |
| Publish / Unpublish | ❌ | ❌ | ✅ | ✅ |
| Delete | ❌ | ❌ | ❌ | ✅ |

### New Packages
| Package | Version | Purpose |
|---------|---------|---------|
| `@blocknote/core` | ^0.47.3 | Editor engine |
| `@blocknote/react` | ^0.47.3 | React bindings |
| `@blocknote/mantine` | ^0.47.3 | Styled UI theme |
| `@mantine/core` | ^8.3.18 | BlockNote peer dep |
| `@mantine/hooks` | ^8.3.18 | Mantine peer dep |
| `@floating-ui/dom` | ^1.7.6 | BlockNote peer dep |

> Mantine 8.x was required (not 9.x) — BlockNote 0.47.x peers against `@mantine/core@^8.3.11`.

### New Files
| File | Purpose |
|------|---------|
| `docs/database/sql-scripts/008-public-pages.sql` | Table + RLS + trigger |
| `src/hooks/usePublicPages.ts` | CRUD data access layer |
| `src/components/cms/PageEditor.tsx` | BlockNote editor wrapper with save/publish/delete |
| `src/components/cms/PublicPageView.tsx` | Read-only BlockNote renderer |
| `src/components/cms/PagesList.tsx` | Page management list with role-gated actions |
| `src/pages/PagesListPage.tsx` | Route wrapper for list |
| `src/pages/PublicPageViewPage.tsx` | Route wrapper for public view |
| `src/pages/PageEditorPage.tsx` | Route wrapper for editor |

### Modified Files
| File | Change |
|------|--------|
| `src/types/index.ts` | Added `PublicPage` interface |
| `src/lib/supabase.ts` | Added `public_pages` DB types |
| `src/App.tsx` | Added 4 new routes (`/pages`, `/pages/new`, `/pages/:slug/edit`, `/pages/:slug`) |
| `src/components/Layout.tsx` | Added "Pages" nav link (desktop + mobile) |

## Key Design Decisions

**Mantine CSS scoping**: BlockNote's styles are imported only in `PageEditor.tsx` and `PublicPageView.tsx` component files. By lazy-loading these only when pages routes are hit, Mantine styles load on demand and don't affect the base Tailwind layout.

**No auto-save**: Pages save only on explicit button click ("Save Draft" or "Publish"). This avoids race conditions and is appropriate for club content editors who are deliberate about publishing.

**Slug generation**: Auto-generated from the title on first creation; editable manually for custom URLs. Once set manually, title changes don't override it.

**Demo auth**: Until real Supabase Auth is wired up, both `PagesListPage` and `PageEditorPage` use a `DEMO_ADMIN` user constant (role: `'admin'`). This matches the existing pattern in `MembersPage`. The `VITE_DEMO_CLUB_ID` env var must be set for Supabase queries to work.

## Quality Gates

- `pnpm typecheck`: ✅ Zero errors
- `pnpm lint`: ✅ Zero errors (30 warnings — all `@typescript-eslint/no-explicit-any`, pre-existing pattern in codebase)

## Deployment Note

Before deploying to Cloudflare Pages:
1. Run `008-public-pages.sql` in Supabase SQL Editor
2. Enable the `moddatetime` extension in Supabase → Database → Extensions
3. Set `VITE_DEMO_CLUB_ID` environment variable to your actual club UUID
