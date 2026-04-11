# Pitchmasters BlockNote CMS Implementation Plan

**Created**: 2026-04-11
**Status**: Draft
**App**: apps/pitchmasters

## Overview

Add a simple browser-based CMS to Pitchmasters using [BlockNote](https://www.blocknotejs.org/) — a Notion-like block editor. Club officers/admins can create and edit public pages (e.g., About Us, How to Visit, Club History) through the app. All content is stored in Supabase alongside existing club data, with the same multi-tenant RLS isolation.

## Why BlockNote

- Notion-like `/` slash menu — familiar to non-technical users
- Drag-and-drop block reordering out of the box
- Polished default UI with minimal custom code needed
- React component, outputs JSON (stores cleanly in Supabase JSONB)
- MIT licensed, actively maintained

## Architecture

```
Browser (member/visitor)          Browser (officer/admin)
        │                                  │
   GET /pages/:slug                  GET /pages/:slug/edit
        │                                  │
   PublicPageView.tsx              PageEditor.tsx (BlockNote)
        │                                  │
        └──────────┬───────────────────────┘
                   │
            Supabase RLS
                   │
          public_pages table
         (club_id tenant isolation)
```

## Implementation Steps

### Step 1: Database — `public_pages` Table

Create a new Supabase table and RLS policies.

**Table: `public_pages`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Default `gen_random_uuid()` |
| club_id | uuid (FK → clubs.id) | Multi-tenant key |
| slug | text | URL-friendly identifier, unique per club |
| title | text | Page title |
| content | jsonb | BlockNote document JSON |
| published | boolean | Default `false` |
| author_id | uuid (FK → users.id) | Who created/last edited |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Default `now()` |

**Constraints:**
- Unique index on `(club_id, slug)` — slugs unique within a club
- Index on `(club_id, published)` — fast listing of published pages

**SQL script**: `docs/database/sql-scripts/NNN-public-pages.sql`

```sql
CREATE TABLE public_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL DEFAULT '',
  content jsonb NOT NULL DEFAULT '[]'::jsonb,
  published boolean NOT NULL DEFAULT false,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, slug)
);

CREATE INDEX idx_public_pages_club_published ON public_pages (club_id, published);

-- RLS Policies
ALTER TABLE public_pages ENABLE ROW LEVEL SECURITY;

-- Anyone can read published pages from their club (or public visitors)
CREATE POLICY "public_pages_read_published"
  ON public_pages FOR SELECT
  USING (published = true);

-- Officers and admins can read all pages (including drafts) for their club
CREATE POLICY "public_pages_read_all_own_club"
  ON public_pages FOR SELECT
  USING (club_id = get_current_user_club_id());

-- Officers and admins can insert pages for their club
CREATE POLICY "public_pages_insert"
  ON public_pages FOR INSERT
  WITH CHECK (
    club_id = get_current_user_club_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('officer', 'admin')
    )
  );

-- Officers and admins can update pages for their club
CREATE POLICY "public_pages_update"
  ON public_pages FOR UPDATE
  USING (
    club_id = get_current_user_club_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('officer', 'admin')
    )
  );

-- Only admins can delete pages
CREATE POLICY "public_pages_delete"
  ON public_pages FOR DELETE
  USING (
    club_id = get_current_user_club_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Auto-update updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public_pages
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);
```

### Step 2: TypeScript Types

Add to `src/types/index.ts`:

```typescript
export interface PublicPage {
  id: string;
  club_id: string;
  slug: string;
  title: string;
  content: any; // BlockNote JSON document
  published: boolean;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}
```

Add to the Supabase database types in `src/lib/supabase.ts`:

```typescript
public_pages: {
  Row: PublicPage;
  Insert: Omit<PublicPage, 'id' | 'created_at' | 'updated_at'>;
  Update: Partial<Omit<PublicPage, 'id' | 'club_id' | 'created_at'>>;
};
```

### Step 3: Install BlockNote

```bash
cd apps/pitchmasters
pnpm add @blocknote/core @blocknote/react @blocknote/mantine @mantine/core
```

> BlockNote's default theme uses Mantine. The `@blocknote/mantine` package provides pre-styled components. The Mantine dependency is scoped to the editor — it won't affect the rest of the Tailwind-based app.

### Step 4: Data Hook — `usePublicPages`

Create `src/hooks/usePublicPages.ts`:

```typescript
// Provides CRUD operations for public pages
// - listPages(clubId): fetch all pages (published + drafts for officers)
// - getPage(clubId, slug): fetch single page by slug
// - savePage(page): insert or update
// - deletePage(pageId): delete (admin only)
// - publishPage(pageId, published): toggle publish status
```

**Key behaviors:**
- Unauthenticated users only see published pages
- Officers/admins see all pages with draft indicators
- `savePage` auto-generates slug from title if not provided
- `savePage` sets `updated_at` and `author_id` automatically

### Step 5: Page Editor Component

Create `src/components/cms/PageEditor.tsx`:

```
┌──────────────────────────────────────────┐
│  Page Title: [___________________________]│
│  Slug: [about-us_____] (auto-generated)  │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │                                     │  │
│  │   BlockNote Editor                  │  │
│  │   Type / for commands...            │  │
│  │                                     │  │
│  │                                     │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  [Save Draft]  [Publish]  [Delete]        │
└──────────────────────────────────────────┘
```

**Features:**
- Title input field (auto-slugifies)
- BlockNote editor instance with Toastmasters-themed color palette
- Save/Publish/Delete action buttons
- Auto-save indicator (optional — save on blur or explicit save)
- Responsive — works on mobile (though editing is best on tablet/desktop)

**BlockNote configuration:**
- Default block types: paragraph, heading (h1-h3), bullet list, numbered list, image, table
- Remove code blocks and other developer-oriented blocks
- Custom slash menu items (optional future enhancement): "Meeting Schedule", "Member Spotlight"

### Step 6: Public Page View Component

Create `src/components/cms/PublicPageView.tsx`:

- Renders BlockNote JSON content as read-only HTML
- Uses `@blocknote/react`'s read-only mode (no editor chrome)
- Styled with Tailwind prose classes for consistent typography
- Shows page title, last updated date
- If page not found or unpublished → 404 message

### Step 7: Pages List Component

Create `src/components/cms/PagesList.tsx`:

```
┌──────────────────────────────────────────┐
│  Club Pages                [+ New Page]  │
│                                           │
│  ┌─ About Us ──────── Published ──────┐  │
│  │  /pages/about-us   Updated Apr 10  │  │
│  │  [Edit] [Unpublish] [View]         │  │
│  └────────────────────────────────────┘  │
│                                           │
│  ┌─ How to Visit ───── Draft ─────────┐  │
│  │  /pages/how-to-visit  Updated Apr 8│  │
│  │  [Edit] [Publish] [Delete]         │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

- Lists all pages for the club (published + drafts for officers)
- Status badges (Published / Draft)
- Action buttons based on role permissions
- "New Page" button for officers/admins

### Step 8: Routes

Add to `src/App.tsx`:

```typescript
// Public page viewing
<Route path="/pages" element={<PagesListPage />} />
<Route path="/pages/:slug" element={<PublicPageViewPage />} />

// Editor (officer/admin only)
<Route path="/pages/:slug/edit" element={<PageEditorPage />} />
<Route path="/pages/new" element={<PageEditorPage />} />
```

### Step 9: Navigation

Add "Pages" link to the Layout component navigation:

```
Dashboard | Members | Pages | Meetings | Speeches
                       ↑ new
```

- Visible to all users (public pages are readable by anyone)
- "New Page" / edit buttons only shown to officers/admins via permission checks

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `docs/database/sql-scripts/NNN-public-pages.sql` | Create | Table, indexes, RLS policies |
| `src/types/index.ts` | Edit | Add `PublicPage` interface |
| `src/lib/supabase.ts` | Edit | Add `public_pages` to DB types |
| `src/hooks/usePublicPages.ts` | Create | CRUD hook for pages |
| `src/components/cms/PageEditor.tsx` | Create | BlockNote editor wrapper |
| `src/components/cms/PublicPageView.tsx` | Create | Read-only page renderer |
| `src/components/cms/PagesList.tsx` | Create | Page listing with admin actions |
| `src/pages/PagesListPage.tsx` | Create | Route wrapper for PagesList |
| `src/pages/PublicPageViewPage.tsx` | Create | Route wrapper for page view |
| `src/pages/PageEditorPage.tsx` | Create | Route wrapper for editor |
| `src/App.tsx` | Edit | Add page routes |
| `src/components/Layout.tsx` | Edit | Add "Pages" nav link |
| `package.json` | Edit | Add BlockNote + Mantine deps |

## Styling Notes

- The BlockNote editor ships with its own styles via `@blocknote/mantine`
- The editor will be wrapped in a container that matches the existing Tailwind layout
- Read-only page view uses Tailwind `prose` classes for consistent typography
- Color accents use existing `tm-blue`, `tm-maroon` custom colors
- Mobile-responsive with 44px touch targets on action buttons

## Permissions Matrix

| Action | Public | Member | Officer | Admin |
|--------|--------|--------|---------|-------|
| View published pages | ✅ | ✅ | ✅ | ✅ |
| View draft pages | ❌ | ❌ | ✅ | ✅ |
| Create pages | ❌ | ❌ | ✅ | ✅ |
| Edit pages | ❌ | ❌ | ✅ | ✅ |
| Publish/unpublish | ❌ | ❌ | ✅ | ✅ |
| Delete pages | ❌ | ❌ | ❌ | ✅ |

## Future Enhancements (Not in Scope)

- **Custom blocks**: Embed live data (next meeting, member count, recent speeches)
- **Page templates**: Pre-built layouts for common pages (About, Visit, Officers)
- **Version history**: Store previous versions for rollback
- **Image uploads**: Upload images to Supabase Storage from within the editor
- **SEO metadata**: Description, og:image fields for each page
- **Page ordering**: Drag-and-drop to reorder pages in navigation

## Dependencies Added

| Package | Version | Purpose | Size |
|---------|---------|---------|------|
| `@blocknote/core` | latest | Core editor engine | ~150KB |
| `@blocknote/react` | latest | React bindings | ~30KB |
| `@blocknote/mantine` | latest | Default styled UI | ~20KB |
| `@mantine/core` | latest | UI primitives for editor | ~100KB |

Total added bundle: ~300KB (tree-shaken, only loaded on pages routes).

## Implementation Order

1. **Database** (Step 1) — Create table + policies
2. **Types** (Step 2) — Add TypeScript definitions
3. **Dependencies** (Step 3) — Install BlockNote
4. **Hook** (Step 4) — Data access layer
5. **Editor** (Step 5) — Build the editing experience
6. **Viewer** (Step 6) — Build the read-only renderer
7. **List** (Step 7) — Page management UI
8. **Routes + Nav** (Steps 8-9) — Wire everything together
9. **Test** — Create a test page, verify permissions, test on mobile

## Estimated Scope

- **New files**: 7
- **Modified files**: 4
- **New dependency packages**: 4
- **Database changes**: 1 new table, 5 RLS policies, 2 indexes
