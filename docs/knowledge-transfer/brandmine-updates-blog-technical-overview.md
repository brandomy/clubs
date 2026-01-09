# Brandmine Updates Blog: Complete Technical Overview

**Document Purpose**: Technical knowledge transfer for HuaQiao Foundation CTO
**Author**: Randal Eastman (CEO/CTO, Brandmine)
**Last Updated**: 2025-12-18
**Audience**: Technical leadership implementing similar systems

---

## Executive Summary

Brandmine's Updates blog is a **hybrid Hugo-Supabase content system** designed for simplicity, elegance, and CLI-friendliness. The architecture enables both **web-based CMS editing** (95% of use cases) and **CLI-based technical authoring** (5% for complex posts), with bidirectional synchronization between Hugo static files and a Supabase PostgreSQL database.

**Key Design Principles:**
1. **Database as Single Source of Truth (SSOT)** - All Updates live in Supabase, Hugo files are generated artifacts
2. **Hybrid Image System** - Supabase Storage for CMS uploads, Hugo image processing for CLI-created posts
3. **Minimal Friction** - Publishing takes 8 minutes (web) or 5 CLI commands (technical posts)
4. **Built for Solo Developers** - Tools that make the right thing easier than the wrong thing

**Technology Stack:**
- **Frontend**: Hugo 0.150.0 (static site generator)
- **Backend**: Supabase PostgreSQL + Storage
- **CMS**: React Admin 5.3.2 (internal hub)
- **Sync**: Deno scripts for bidirectional sync
- **Deployment**: Cloudflare Pages (automatic on git push)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Image Handling Strategy](#image-handling-strategy)
4. [Sync Scripts & Data Flow](#sync-scripts--data-flow)
5. [Publishing Workflows](#publishing-workflows)
6. [Post Type System](#post-type-system)
7. [Multilingual Strategy](#multilingual-strategy)
8. [Troubleshooting We Encountered](#troubleshooting-we-encountered)
9. [Best Practices & Lessons Learned](#best-practices--lessons-learned)
10. [Performance & Optimization](#performance--optimization)
11. [Future Enhancements](#future-enhancements)
12. [Recommendations for HuaQiao Foundation](#recommendations-for-huaqiao-foundation)

---

## Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CONTENT CREATION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐                  ┌──────────────────┐    │
│  │   Hub CMS (95%)  │                  │  Hugo CLI (5%)   │    │
│  │  React Admin UI  │                  │  Markdown Files  │    │
│  │  WYSIWYG Editor  │                  │  Technical Posts │    │
│  │  Image Upload    │                  │  Code Examples   │    │
│  └────────┬─────────┘                  └────────┬─────────┘    │
│           │                                      │               │
│           │ Direct INSERT                        │ One-time sync│
│           ▼                                      ▼               │
└───────────────────────────────────────────────────────────────┘
                                │
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                    SUPABASE (SOURCE OF TRUTH)                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                                      │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ updates table                                       │  │  │
│  │  │ • id (uuid, primary key)                           │  │  │
│  │  │ • slug (text, unique)                              │  │  │
│  │  │ • title_en, title_ru, title_zh (text)             │  │  │
│  │  │ • content (text, Markdown)                         │  │  │
│  │  │ • author (text)                                    │  │  │
│  │  │ • date (timestamptz)                               │  │  │
│  │  │ • status (draft|scheduled|published)               │  │  │
│  │  │ • post_type (build|reflect|announce|illuminate)    │  │  │
│  │  │ • hero_image (text, filename)                      │  │  │
│  │  │ • hero_image_url (text, Supabase Storage URL)     │  │  │
│  │  │ • featured (boolean)                               │  │  │
│  │  │ • source (hugo|hub, origin tracking)              │  │  │
│  │  │ • markets, sectors, attributes, signals (arrays)  │  │  │
│  │  │ • related_brands, related_founders (arrays)       │  │  │
│  │  │ • deleted_at (timestamptz, soft delete)           │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Supabase Storage                                         │  │
│  │  Bucket: updates/                                         │  │
│  │  • {slug}/hero.jpg (1200x630px hero images)              │  │
│  │  • Public access, CDN-backed                              │  │
│  │  • Automatic URL: storage/v1/object/public/updates/...   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────────▲─────────────────────────────────┘
                                │
                                │ Periodic sync (CTO runs)
                                │
┌───────────────────────────────┴─────────────────────────────────┐
│                       HUGO STATIC SITE                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  apps/hugo/content/updates/{slug}/index.{en,ru,zh}.md    │  │
│  │  • Generated artifacts from database                      │  │
│  │  • Front matter + Markdown body                           │  │
│  │  • heroImageUrl points to Supabase Storage               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Hugo Templates                                            │  │
│  │  • layouts/updates/list.html (archive page)               │  │
│  │  • layouts/updates/single.html (individual posts)         │  │
│  │  • Hybrid image rendering (Supabase URL or Hugo process)  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│                           git push                                │
│                               │                                   │
└───────────────────────────────▼─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                   CLOUDFLARE PAGES (PRODUCTION)                  │
│  • brandmine.ai/updates/                                         │
│  • Auto-builds on git push (~2 min)                              │
│  • Global CDN, edge caching                                      │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow Patterns

**Primary Flow (95% - Hub CMS → Database → Hugo)**:
1. User creates/edits Update in Hub CMS
2. Data saved directly to Supabase `updates` table
3. CTO runs `deno task sync-updates-from-supabase` periodically
4. Script generates Hugo markdown files from database
5. Git commit + push triggers Cloudflare deployment
6. Live in ~2 minutes

**Exception Flow (5% - Hugo CLI → Database → Hugo)**:
1. CTO drafts Markdown file in `apps/hugo/content/updates/{slug}/`
2. CEO reviews on local Hugo dev server (`hugo server`)
3. CTO runs `deno task sync-updates-to-supabase` (ONE-TIME)
4. Script creates database record with `source='hugo'`
5. CTO uploads image: `node scripts/upload-update-image.js {slug}`
6. CTO syncs back: `deno task sync-updates-from-supabase`
7. Git commit + push → production
8. Future edits via Hub CMS only (database now owns it)

---

## Database Schema

### `updates` Table

```sql
CREATE TABLE updates (
  -- Identity
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,

  -- Content (multilingual)
  title_en text NOT NULL,
  title_ru text,
  title_zh text,
  content text NOT NULL,  -- Markdown format
  description text,        -- SEO meta description

  -- Metadata
  author text NOT NULL,
  date timestamptz DEFAULT now(),
  status text DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'published')),
  post_type text
    CHECK (post_type IN ('build', 'reflect', 'announce', 'illuminate')),
  source text DEFAULT 'hub'
    CHECK (source IN ('hugo', 'hub')),  -- Origin tracking
  featured boolean DEFAULT false,

  -- Images
  hero_image text,          -- Filename for Hugo processing (legacy)
  hero_image_url text,      -- Supabase Storage URL (primary)

  -- Taxonomy (PostgreSQL arrays)
  markets text[] DEFAULT '{}',
  sectors text[] DEFAULT '{}',
  attributes text[] DEFAULT '{}',
  signals text[] DEFAULT '{}',

  -- Relationships (UUID arrays)
  related_brands uuid[] DEFAULT '{}',
  related_founders uuid[] DEFAULT '{}',
  related_insights uuid[] DEFAULT '{}',

  -- Audit
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,   -- Soft delete

  -- Indexes
  CONSTRAINT updates_slug_check CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Indexes for performance
CREATE INDEX idx_updates_status ON updates(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_updates_date ON updates(date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_updates_featured ON updates(featured) WHERE deleted_at IS NULL;
CREATE INDEX idx_updates_post_type ON updates(post_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_updates_source ON updates(source);

-- GIN indexes for array searches
CREATE INDEX idx_updates_markets ON updates USING gin(markets);
CREATE INDEX idx_updates_sectors ON updates USING gin(sectors);
```

### Key Design Decisions

**1. Multilingual Columns (not separate rows)**
- **Why**: Hugo expects single files with language suffixes (`index.en.md`)
- **Trade-off**: More columns, but simpler sync logic
- **Alternative considered**: Separate `updates_translations` table (rejected: over-engineering)

**2. PostgreSQL Arrays for Taxonomy**
- **Why**: Fast `@>` (contains) and `&&` (overlaps) operators for filtering
- **Example**: `WHERE 'russia' = ANY(markets)` or `WHERE markets @> ARRAY['russia']`
- **Migration note**: Originally used `market_id` (singular), migrated to `markets` (array) for multi-tagging

**3. Soft Delete Pattern**
- **Why**: Preserve history, allow recovery, maintain referential integrity
- **Implementation**: `deleted_at` timestamp, filter with `WHERE deleted_at IS NULL`
- **Hub UI**: Trash bin view, restore functionality

**4. `source` Field (hugo|hub)**
- **Why**: Track origin for deletion safety (don't delete Hugo-originated posts without checking files)
- **Visual indicator**: Hub displays blue "Hugo" badge vs. green "Hub" badge
- **Sync safety**: `sync-updates-to-supabase.js` exits with error if trying to overwrite Hub posts

---

## Image Handling Strategy

### Hybrid Image System

**Problem**: Two content creation workflows need different image handling:
1. **Hub CMS users** (non-technical) need drag-drop uploads
2. **Hugo CLI authors** (technical) need local file processing with Hugo's image pipeline

**Solution**: Hybrid system that supports both

#### Path 1: CMS Upload (Primary - 95%)

```typescript
// Hub Upload Component
const handleImageUpload = async (file: File) => {
  // 1. Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('updates')
    .upload(`${slug}/hero.jpg`, file, {
      contentType: 'image/jpeg',
      upsert: true
    });

  // 2. Get public URL
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/updates/${slug}/hero.jpg`;

  // 3. Save URL to database
  await supabase
    .from('updates')
    .update({ hero_image_url: publicUrl })
    .eq('id', updateId);
};
```

**Result**: Image immediately available in database and CMS preview

#### Path 2: Hugo CLI Upload (Exception - 5%)

```bash
# 1. Place image in Hugo assets
cp source-image.jpg apps/hugo/assets/images/updates/{slug}/originals/{slug}-hero.jpg

# 2. Test locally
cd apps/hugo && hugo server

# 3. Sync to database (creates record)
deno task sync-updates-to-supabase

# 4. Upload image to Supabase Storage
node scripts/upload-update-image.js {slug}
# → Uploads to: updates/{slug}/hero.jpg
# → Updates database: hero_image_url field

# 5. Sync back (adds heroImageUrl to front matter)
deno task sync-updates-from-supabase
```

**Result**: Both Hugo and Hub have access to image via Supabase Storage URL

### Hugo Template Logic

```go
{{/* layouts/updates/single.html - Hybrid image rendering */}}

{{/* Prefer Supabase URL (CMS-uploaded or CLI-synced) */}}
{{ if .Params.heroImageUrl }}
  <img src="{{ .Params.heroImageUrl }}" alt="{{ .Title }}">

{{/* Fallback: Process from Hugo assets (legacy CLI-only posts) */}}
{{ else if .Params.heroImage }}
  {{ $slug := .Params.slug | default .File.ContentBaseName }}
  {{ $filename := .Params.heroImage }}
  {{ $imagePath := printf "images/updates/%s/originals/%s" $slug $filename }}
  {{ with resources.Get $imagePath }}
    {{ $image := .Resize "1200x675 webp q85" }}
    <img src="{{ $image.RelPermalink }}" alt="{{ $.Title }}">
  {{ end }}
{{ end }}
```

**Why This Works:**
- CMS users never touch Hugo assets - upload via web interface
- CLI authors get Hugo's image optimization (WebP conversion, lazy loading)
- Both paths converge: `heroImageUrl` becomes canonical
- No duplication: Hugo assets folder can be cleaned after Supabase upload

### Image Upload Script

**File**: `scripts/upload-update-image.js`

```javascript
#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function uploadImage(slug) {
  // 1. Read image from Hugo assets
  const imagePath = `apps/hugo/assets/images/updates/${slug}/originals/${slug}-hero.jpg`;
  const imageBuffer = fs.readFileSync(imagePath);

  // 2. Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('updates')
    .upload(`${slug}/hero.jpg`, imageBuffer, {
      contentType: 'image/jpeg',
      upsert: true  // Overwrite if exists
    });

  // 3. Update database with public URL
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/updates/${slug}/hero.jpg`;
  await supabase
    .from('updates')
    .update({ hero_image_url: publicUrl })
    .eq('slug', slug);

  console.log('✅ Image uploaded!');
  console.log('📋 URL:', publicUrl);
  console.log('\n📝 Next: deno task sync-updates-from-supabase');
}
```

**Security**: Requires `SUPABASE_SERVICE_ROLE_KEY` (not anon key) to bypass RLS policies

---

## Sync Scripts & Data Flow

### Three Sync Scripts

**1. `sync-updates-to-supabase.js`** (Hugo → Database)
- **Purpose**: ONE-TIME sync for Hugo-originated posts
- **Default mode**: `--new-only` (INSERT only, never UPDATE)
- **Safety**: Exits with error if slug exists in database
- **Use case**: After creating new `.md` file in Hugo CLI
- **Frequency**: Rare (5% of content creation)

```bash
deno task sync-updates-to-supabase  # Safe mode by default
deno task sync-updates-to-supabase --full  # DANGEROUS: overwrites database
```

**2. `sync-updates-from-supabase.js`** (Database → Hugo)
- **Purpose**: PRIMARY sync direction (95% of operations)
- **Safety**: Idempotent, safe to run anytime
- **Result**: Generates Hugo markdown files from database records
- **Filters**: Only non-deleted records (`deleted_at IS NULL`)
- **Use case**: After creating/editing in Hub CMS
- **Frequency**: Daily or on-demand

```bash
deno task sync-updates-from-supabase  # Safe, routine operation
```

**3. `upload-update-image.js`** (Local → Supabase Storage)
- **Purpose**: Upload hero images from Hugo assets to Supabase
- **Result**: Updates `hero_image_url` in database
- **Use case**: CLI workflow only (CMS handles uploads automatically)
- **Frequency**: Once per CLI-created post

```bash
node scripts/upload-update-image.js {slug}
```

### Sync Metadata Tracking

**File**: `data/last-sync-updates.json`

```json
{
  "lastSyncedAt": "2025-12-18T14:23:45.678Z",
  "totalSynced": 16,
  "source": "from-supabase"
}
```

**Purpose**:
- Incremental sync optimization (future enhancement)
- Audit trail for troubleshooting
- Copied to `apps/hub/public/data/` for Hub access

### Sync Flow Visualization

```
┌─────────────────────────────────────────────────────────────┐
│  SCENARIO 1: Hub CMS Post (Primary - 95%)                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User creates post in Hub CMS                            │
│     ↓ (Direct INSERT)                                       │
│  2. Supabase updates table                                  │
│     ↓ (CTO runs sync-updates-from-supabase)                │
│  3. Hugo .md files generated                                │
│     ↓ (git push)                                            │
│  4. Cloudflare Pages builds                                 │
│     ↓ (~2 minutes)                                          │
│  5. Live at brandmine.ai/updates/{slug}/                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SCENARIO 2: Hugo CLI Post (Exception - 5%)                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. CTO creates .md file in Hugo                            │
│     ↓ (hugo server for local testing)                       │
│  2. CEO approves on localhost:1313                          │
│     ↓ (ONE-TIME: sync-updates-to-supabase)                 │
│  3. Database record created (source='hugo')                 │
│     ↓ (upload-update-image.js)                             │
│  4. Image → Supabase Storage → hero_image_url updated       │
│     ↓ (sync-updates-from-supabase)                         │
│  5. heroImageUrl added to Hugo front matter                 │
│     ↓ (git push)                                            │
│  6. Live at brandmine.ai/updates/{slug}/                    │
│                                                              │
│  ⚠️  Future edits: Hub CMS only (database owns record)     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Publishing Workflows

### Workflow 1: Hub CMS (Primary - 95%)

**Time to Publish**: 8 minutes total

**Steps:**

1. **Create Update in Hub** (3 minutes)
   - Navigate: hub.brandmine.ai → Updates → Create
   - Fill required fields: Title, Slug, Content, Author
   - Optional: Taxonomy (markets, sectors), Related content
   - Upload hero image (drag-drop)
   - Set status: Draft

2. **Review & Publish** (2 minutes)
   - Preview in Hub interface
   - Check: Image displays, content formatting, metadata
   - Change status: Draft → Published
   - Click Save

3. **Sync to Hugo** (3 minutes)
   - CTO runs: `deno task sync-updates-from-supabase`
   - Script generates: `apps/hugo/content/updates/{slug}/index.en.md`
   - Git commit: `git add . && git commit -m "chore(updates): Sync from database"`
   - Git push: `git push origin main`
   - Cloudflare auto-builds (~2 min)

**Result**: Live at `brandmine.ai/updates/{slug}/`

**Who Can Do This**: Anyone with Hub CMS access (CEO, Operations team)

### Workflow 2: Hugo CLI (Exception - 5%)

**Time to Publish**: 5 CLI commands + CEO approval

**When to Use**:
- ✅ Technical deep-dives (code examples, architecture decisions)
- ✅ CTO-authored posts requiring precise Markdown control
- ✅ Posts with complex formatting (tables, diagrams, nested lists)
- ❌ All other content (use Hub CMS)

**Steps:**

1. **Create Markdown File**
```bash
mkdir -p apps/hugo/content/updates/my-technical-post
cat > apps/hugo/content/updates/my-technical-post/index.en.md << 'EOF'
---
title: "My Technical Post"
date: "2025-12-18"
author: randal-eastman
postType: build
heroImage: my-technical-post-hero.jpg
---

Content here in Markdown...
EOF
```

2. **Add Hero Image**
```bash
mkdir -p apps/hugo/assets/images/updates/my-technical-post/originals
cp ~/Downloads/hero-image.jpg apps/hugo/assets/images/updates/my-technical-post/originals/my-technical-post-hero.jpg
```

3. **Local Testing + CEO Approval**
```bash
cd apps/hugo
hugo server
# → CEO reviews at localhost:1313/updates/my-technical-post/
# → CEO approval required before proceeding
```

4. **Sync to Database (ONE-TIME)**
```bash
deno task sync-updates-to-supabase  # Creates record with source='hugo'
node scripts/upload-update-image.js my-technical-post  # Uploads to Supabase Storage
deno task sync-updates-from-supabase  # Adds heroImageUrl to front matter
```

5. **Deploy**
```bash
git add apps/hugo/content/updates/my-technical-post/
git add apps/hugo/assets/images/updates/my-technical-post/
git add data/last-sync-updates.json
git commit -m "feat(updates): Add 'My Technical Post'"
git push origin main
# → Cloudflare auto-builds
```

**⚠️ CRITICAL**: After first sync, database owns this Update. Future edits via Hub CMS only.

### Publishing Decision Tree

```
Need to publish an Update?
│
├─ Is it a technical deep-dive with code/diagrams?
│  ├─ YES → Use Hugo CLI workflow
│  └─ NO ↓
│
├─ Does it require CEO review before database sync?
│  ├─ YES → Use Hugo CLI workflow (hugo server for approval)
│  └─ NO ↓
│
└─ Use Hub CMS workflow (default for 95% of content)
```

---

## Post Type System

### Four Post Types

**Added**: 2025-12-13 (ADR-0041)

| Type | Label | Icon | Color | Use Case | Count |
|------|-------|------|-------|----------|-------|
| `build` | Build | Wrench | Blue | Product updates, technical decisions, infrastructure | 7/16 |
| `reflect` | Reflect | MessageCircle | Magenta | Founder reflections, lessons learned, personal insights | 3/16 |
| `announce` | Announce | Megaphone | Teal | Platform announcements, milestones, meta updates | 3/16 |
| `illuminate` | Illuminate | Lightbulb | Orange | Field observations, discovering hidden brands | 3/16 |

### Visual Treatment

**Hub CMS**:
- Small badge at top-left of update card
- Icon + label (e.g., "🔧 Build")
- Filter dropdown for post type filtering

**Hugo Static Site**:
- Badge displayed on list page (`/updates/`)
- NO badge on individual post pages (clean reading experience)
- Future: Optional post type filtering on public site

### Color Rationale

**Why These Colors:**

1. **Blue (Build)** - Technical, systematic work (matches Info/Catalyst timeline colors)
2. **Magenta (Reflect)** - Pivotal moments of introspection (matches Crisis timeline phase)
3. **Teal (Announce)** - Brandmine primary color (stability, trust, official communications)
4. **Orange (Illuminate)** - Discovery and highlighting (matches Brand Spotlight insights)

**Why NOT Other Colors:**
- ❌ **Indigo** - Reserved for Signals taxonomy, Founder's Journey insights, Featured tier
- ❌ **Purple** - Reserved for Triumph timeline phase (celebration, resolution)
- ❌ **Green/Olive** - Reserved for Sectors taxonomy, Market Momentum insights
- ❌ **Sky Blue** - Reserved for Markets taxonomy

**Collision Safety**: Post type badges appear in different contexts than taxonomy dimension badges (card metadata vs. content tagging), so color reuse doesn't cause confusion.

### Implementation

**Database**:
```sql
ALTER TABLE updates
  ADD COLUMN post_type text
  CHECK (post_type IN ('build', 'reflect', 'announce', 'illuminate'));
```

**TypeScript**:
```typescript
export type PostType = "build" | "reflect" | "announce" | "illuminate";

export const POST_TYPE_COLORS: Record<PostType, string> = {
  build: "text-blue-700 bg-blue-50 border-blue-200",
  reflect: "text-crisis-700 bg-crisis-50 border-crisis-200",  // Magenta
  announce: "text-teal-700 bg-teal-50 border-teal-200",
  illuminate: "text-orange-700 bg-orange-50 border-orange-200",
};
```

**Hugo Front Matter**:
```yaml
postType: build  # Control term (always English, never translated)
```

**i18n Translations**:
- EN: Build, Reflect, Announce, Illuminate
- RU: Разработка, Размышления, Объявления, Освещение
- ZH: 构建, 思考, 公告, 发现

### Filtering

**Hub CMS**: Inline filter dropdown in Updates list
**Hugo**: Not yet implemented (future enhancement)

---

## Multilingual Strategy

### Decision: English-Only with Hugo Fallback

**Rationale** (from 2025-11-12 implementation):

**Updates are ephemeral** (vs. Insights which are evergreen):
- Velocity matters more than coverage (2-3 posts/week target)
- Translation cost: $65-100/post or 2-3 hours CTO time
- Annual savings: $6,500-$15,000 or 200-300 hours
- Hugo handles fallback gracefully (RU/ZH users see English content)

**Exception**: Translate market-specific or strategically important posts retroactively

### Technical Implementation

**Hugo Fallback** (automatic):
```
Request: /ru/updates/dark-mode-launch/
File exists: apps/hugo/content/updates/dark-mode-launch/index.ru.md?
  ├─ YES → Render Russian version
  └─ NO → Fallback to index.en.md (English)
```

**No 404 errors** for missing translations. Users seamlessly see English content with Russian UI chrome.

### Database Schema

**Multilingual columns** (for future use):
```sql
title_en text NOT NULL,   -- Required
title_ru text,             -- Optional (for translated posts)
title_zh text,             -- Optional (for translated posts)
```

**Current state**: All 16 Updates are English-only

---

## Troubleshooting We Encountered

### Issue 1: React "0" Appearing in Hub

**Date**: 2025-12-10
**Symptom**: Mysterious "0" displayed above "Content Preview" section in Hub

**Root Cause**: React conditional rendering with empty arrays

```tsx
// ❌ WRONG - Empty array has length = 0, React renders "0"
{(record.markets?.length || record.sectors?.length) && (
  <div>Taxonomy</div>
)}

// When both arrays empty: 0 || 0 = 0
// React renders: "0" (number is truthy but visible!)
```

**Fix**: Explicit boolean comparison
```tsx
// ✅ CORRECT - Explicit > 0 comparison returns boolean
{((record.markets?.length ?? 0) > 0 ||
  (record.sectors?.length ?? 0) > 0) && (
  <div>Taxonomy</div>
)}
```

**Lesson Learned**: React renders `0` but not `false`. Always use explicit boolean comparisons in JSX conditionals, never rely on array length truthiness.

### Issue 2: Marked.js v17 Async Breaking Change

**Date**: 2025-12-10
**Symptom**: Markdown content not rendering in Hub

**Root Cause**: `marked.parse()` returns Promise by default in v17

```tsx
// ❌ WRONG - Returns Promise<string>, React can't render it
dangerouslySetInnerHTML={{ __html: marked.parse(record.content) }}

// ✅ CORRECT - Force synchronous mode
dangerouslySetInnerHTML={{
  __html: marked.parse(record.content, { async: false }) as string
}}
```

**Lesson Learned**: Check library upgrade guides for breaking changes. Marked.js v17 changed default to async for performance, but React components need sync mode.

### Issue 3: EasyMDE Dependency Conflict

**Date**: 2025-12-10
**Symptom**: Conflicting `marked` versions (4.3.0 vs 17.0.1)

**Root Cause**: Dead code importing legacy EasyMDE editor

**Fix**:
```bash
rm hub/src/components/admin/inputs/MarkdownEditor.tsx  # Dead code
npm uninstall easymde  # Remove dependency
```

**Lesson Learned**: Regularly audit for dead code. Legacy components can bring in old dependencies that conflict with upgraded packages.

### Issue 4: Amber vs. Orange Visual Similarity

**Date**: 2025-12-13
**Symptom**: "Reflect" (amber) and "Illuminate" (orange) badges indistinguishable at small size

**Root Cause**: Tailwind `amber-700` and `orange-700` too similar at badge scale

**Fix**: Changed Reflect from amber to magenta (crisis color)

```typescript
// Before
reflect: "text-amber-700 bg-amber-50 border-amber-200"

// After
reflect: "text-crisis-700 bg-crisis-50 border-crisis-200"  // Magenta
```

**Lesson Learned**: Always test color choices at target render size, not just in color picker. Colors that look distinct at large scale can be indistinguishable at small scale.

### Issue 5: Duplicate Search Buttons in Header

**Date**: 2025-12-13
**Symptom**: Two magnifying glass icons appearing in Hub header

**Root Cause**: Responsive code rendering both mobile and desktop versions at breakpoint overlap

**Fix**: Simplified to single icon-only button for both viewports

**Lesson Learned**: Test responsive breakpoints carefully. Use CSS `display: none` for true mobile-only/desktop-only elements, not just different styling.

---

## Best Practices & Lessons Learned

### 1. Database as Single Source of Truth

**Decision**: Supabase database is SSOT, Hugo files are generated artifacts

**Why This Works**:
- ✅ Version history (database tracks all changes)
- ✅ Relationships (UUIDs, not slugs)
- ✅ Querying (PostgreSQL for filtering, sorting, analytics)
- ✅ CMS flexibility (edit in web UI without touching Git)
- ✅ Audit trail (created_at, updated_at, deleted_at)

**Alternative Considered**: Hugo files as SSOT (rejected: limits CMS capabilities, no version history)

### 2. Soft Delete Pattern

**Implementation**: `deleted_at timestamptz` column

**Why This Works**:
- ✅ Preserve history (don't lose content)
- ✅ Recovery (restore accidentally deleted posts)
- ✅ Referential integrity (related content links don't break)
- ✅ Analytics (track content lifecycle)

**Hub UI**: Trash bin view with restore button

### 3. Source Tracking (hugo|hub)

**Field**: `source text CHECK (source IN ('hugo', 'hub'))`

**Why This Matters**:
- ✅ Deletion safety (don't delete Hugo-originated posts without checking files)
- ✅ Visual indicator (blue "Hugo" badge vs green "Hub" badge in Hub)
- ✅ Sync script safety (`sync-to-supabase` warns if overwriting Hub posts)

**Example**: Before deleting Update in Hub, check source:
- `source='hub'` → Safe to delete (no Hugo files to clean up)
- `source='hugo'` → Check Hugo files first, may need manual cleanup

### 4. CEO Approval Checkpoint for CLI Posts

**Process**: Hugo CLI posts require CEO review on `localhost:1313` BEFORE database sync

**Why This Works**:
- ✅ Catch errors early (content, formatting, images)
- ✅ Faster iteration (Hugo dev server rebuilds instantly)
- ✅ No database pollution (don't create records for rejected drafts)

**Lesson Learned**: Once synced to database, post is "live" in Hub and enters production workflow. Catching issues in local Hugo is faster than fixing in production.

### 5. Hybrid Image System

**Pattern**: Supabase Storage for CMS, Hugo processing for CLI

**Why This Works**:
- ✅ Non-technical users get drag-drop uploads (no Git, no Hugo knowledge required)
- ✅ Technical authors get Hugo's image optimization (WebP, lazy loading, responsive)
- ✅ Single source after sync (`heroImageUrl` becomes canonical)
- ✅ No duplication (Hugo assets can be cleaned after upload)

**Alternative Considered**: Hugo-only image processing (rejected: CMS users can't easily add images)

### 6. Post Type System for Filtering

**Added**: 2025-12-13

**Why This Works**:
- ✅ Better content discovery at scale (50+ updates)
- ✅ Minimal visual clutter (discrete badges, not heavy category headers)
- ✅ Respects 2025 minimalism trend (like Substack tags, not WordPress categories)
- ✅ Optional (power users filter, casual readers ignore)

**Lesson Learned**: Categorization system should match content type. Updates (internal journey) need purpose-based tags (build, reflect), not subject-matter categories (that's what taxonomy is for).

### 7. Sync Safety: --new-only Default Mode

**Pattern**: `sync-updates-to-supabase.js` defaults to INSERT-only

**Why This Works**:
- ✅ Prevents accidental overwrites of Hub edits
- ✅ Forces explicit `--full` flag for dangerous operations
- ✅ Exit with error if slug exists (clear feedback)

**Command Comparison**:
```bash
# Safe: Only create new records
deno task sync-updates-to-supabase

# Dangerous: Overwrite existing records (requires explicit flag)
deno task sync-updates-to-supabase --full
```

### 8. Sync Metadata Tracking

**File**: `data/last-sync-updates.json`

**Why This Matters**:
- ✅ Audit trail (when was last sync?)
- ✅ Debugging (how many records synced?)
- ✅ Future optimization (incremental sync based on timestamp)

**Example**:
```json
{
  "lastSyncedAt": "2025-12-18T14:23:45.678Z",
  "totalSynced": 16,
  "source": "from-supabase"
}
```

### 9. Colorblind-Safe Design

**Standard**: All post type colors use blue-based spectrum

**Colors**:
- Blue (Build) - Safe
- Magenta (Reflect) - Safe (blue-based, not red)
- Teal (Announce) - Safe
- Orange (Illuminate) - Safe (high contrast)

**Why This Matters**:
- ✅ Accessible to ~8% of males with red-green colorblindness
- ✅ High contrast ratios (WCAG AA compliance)
- ✅ Semantic meaning preserved across all color perception types

### 10. Tools That Make Right Thing Easy

**Philosophy**: Good tools improve quality by reducing friction

**Examples**:
- ✅ Hub CMS: Taxonomy autocomplete (no more looking up valid slugs)
- ✅ Hub CMS: Related content search (no more remembering UUIDs)
- ✅ Hub CMS: Markdown preview (see results before publish)
- ✅ Hugo CLI: Custom image render hooks (automatic path construction)

**CEO Quote** (from "Building Updates CMS" post):
> "Good tools don't just save time—they improve quality by making the right thing easier than the wrong thing."

---

## Performance & Optimization

### Build Performance

**Metrics** (Production):
- Hugo build time: ~4.4 seconds (512 pages)
- Cloudflare Pages deploy: ~2 minutes total
- Image processing: 125 images, WebP conversion automatic

**Optimizations**:
1. **Incremental sync** (future): Only sync changed files based on `updated_at`
2. **Pagination**: 15 updates per page (prevent long list load times)
3. **Lazy loading**: All images use `loading="lazy"` attribute
4. **WebP format**: Hugo automatically converts to WebP (smaller file sizes)

### Database Performance

**Indexes**:
```sql
-- Fast status filtering (published updates only)
CREATE INDEX idx_updates_status ON updates(status) WHERE deleted_at IS NULL;

-- Fast date sorting (newest first)
CREATE INDEX idx_updates_date ON updates(date DESC) WHERE deleted_at IS NULL;

-- GIN indexes for array filtering (taxonomy)
CREATE INDEX idx_updates_markets ON updates USING gin(markets);
CREATE INDEX idx_updates_sectors ON updates USING gin(sectors);
```

**Query Patterns**:
```sql
-- Fast: Uses idx_updates_status + idx_updates_date
SELECT * FROM updates
WHERE status = 'published'
  AND deleted_at IS NULL
ORDER BY date DESC
LIMIT 15;

-- Fast: Uses GIN index
SELECT * FROM updates
WHERE markets @> ARRAY['russia']
  AND deleted_at IS NULL;
```

### CDN & Caching

**Cloudflare Pages**:
- Global CDN (automatic)
- Edge caching for static assets
- Instant purge on new deploy

**Supabase Storage**:
- CDN-backed (global distribution)
- Public bucket (no auth required for reads)
- Automatic URL: `storage/v1/object/public/updates/{slug}/hero.jpg`

---

## Future Enhancements

### Phase 2: Public Site Filtering

**Status**: Not implemented

**Potential Features**:
1. Post type filter on `/updates/` list page (Hugo)
2. Post type badge on individual update pages (Hugo)
3. RSS feed segmentation by post type
4. Analytics: Which post types get most engagement?

**Why Not Yet**: Testing internal workflow first, public filtering adds complexity

### Phase 3: Incremental Sync Optimization

**Current**: `sync-updates-from-supabase.js` fetches all records every time

**Future**: Only sync records updated since last sync

```typescript
// Load last sync timestamp
const lastSync = JSON.parse(fs.readFileSync('data/last-sync-updates.json'));

// Fetch only changed records
const { data } = await supabase
  .from('updates')
  .select('*')
  .gte('updated_at', lastSync.lastSyncedAt)
  .is('deleted_at', null);

// Process only changed records (10-100x faster)
```

**Why Not Yet**: Current sync takes <10 seconds for 16 records, premature optimization

### Phase 4: Version History UI

**Status**: Database tracks history, but no UI

**Potential Features**:
1. View previous versions of Updates in Hub
2. Diff view (compare versions side-by-side)
3. Restore previous version with one click

**Why Not Yet**: Complex UI, low priority (manual database queries work for now)

### Phase 5: Scheduled Publishing

**Status**: Database has `status='scheduled'` but no cron job

**Potential Implementation**:
1. Supabase Edge Function (cron trigger)
2. Check for `status='scheduled' AND date <= now()`
3. Update to `status='published'`
4. Trigger webhook to run sync script

**Why Not Yet**: Manual publishing acceptable for 2-3 posts/week volume

---

## Recommendations for HuaQiao Foundation

### 1. Start with Database as SSOT

**Don't make our early mistake**: We initially had Hugo files as SSOT, then retrofitted database. This required complex migration.

**Better approach**: Design database schema first, generate Hugo files as artifacts from day 1.

**Benefits**:
- Version history from start
- Easier querying/filtering
- CMS capabilities from day 1
- No migration pain later

### 2. Plan for Hybrid Image Handling Early

**Question to answer upfront**: Who will create content?
- If only technical team → Hugo image processing sufficient
- If non-technical team → Need Supabase Storage + upload UI
- If both → Implement hybrid system from start

**Our lesson**: We added CMS uploads after Hugo-only approach, had to retrofit `heroImageUrl` field.

### 3. Use Soft Delete Pattern

**Worth it even if you think you won't need it**:
- Prevents "oh no, I deleted the wrong post" disasters
- Preserves referential integrity (links don't break)
- Enables trash bin UI (user-friendly recovery)
- Minimal overhead (one `timestamptz` column, one `WHERE` filter)

**Implementation cost**: ~1 hour
**Recovery value**: Saves hours of data archaeology

### 4. Track Content Origin (source field)

**Why this matters**:
- Enables hybrid workflows (CMS + CLI)
- Visual indicators help team understand content lifecycle
- Prevents sync script conflicts (don't overwrite wrong source)

**Simple implementation**:
```sql
source text DEFAULT 'cms' CHECK (source IN ('cms', 'cli'))
```

### 5. Design Sync Scripts with Safety Defaults

**Pattern we recommend**:
- CLI → Database sync: Default to `--new-only` mode (INSERT only)
- Database → CLI sync: Always safe (idempotent, read-only from database perspective)

**Why**:
- Prevents accidental overwrites
- Forces explicit `--full` flag for dangerous operations
- Clear error messages when conflicts detected

**Code example**:
```javascript
const mode = args.includes('--full') ? 'full' : 'new-only';

if (mode === 'new-only') {
  // Check if slug exists
  const existing = await db.query('SELECT id FROM updates WHERE slug = $1', [slug]);
  if (existing.rows.length > 0) {
    console.error(`❌ Slug '${slug}' already exists in database`);
    console.error('   Run with --full to overwrite (DANGEROUS)');
    process.exit(1);
  }
}
```

### 6. Start English-Only, Add Translations Later

**Our decision**: Updates are English-only, Insights are multilingual

**Rationale**:
- Updates are ephemeral (velocity matters)
- Insights are evergreen (worth translation investment)
- Hugo's fallback system works great (RU/ZH users see English seamlessly)

**For HuaQiao Foundation**: Decide translation strategy per content type, not site-wide

### 7. Post Type System (Optional but Valuable)

**When to add**: After ~20-30 posts, when filtering becomes valuable

**Why it works**:
- Minimal visual clutter (discrete badges, not category headers)
- Improves content discovery at scale
- Respects 2025 minimalism trend

**When NOT to add**: If posting infrequently (<1/week), adds complexity without value

### 8. Local CEO Approval Checkpoint

**Simple but powerful pattern**:
1. Draft content in CLI or CMS
2. Run on `localhost` (Hugo dev server or CMS staging)
3. CEO reviews and approves
4. Then sync to production database

**Why this prevents pain**:
- Catch errors before they're "permanent" in database
- Faster iteration (instant Hugo rebuilds vs. database round-trips)
- No database pollution from rejected drafts

### 9. Test Visual Elements at Target Size

**Lesson from our amber/orange issue**:
- Colors that look distinct in color picker can be identical at badge size
- Icons that look clear at 64px can be confusing at 16px
- Typography that works at desktop can be cramped at mobile

**Best practice**: Mock up UI at actual render size before implementing

### 10. Build Tools for Yourself First

**CEO insight** (from "Building Updates CMS" post):
> "I wasn't building this for my team. I was building it for me."

**Why this matters**:
- Founders are often heaviest content creators
- If CEO finds tool tedious, content velocity drops
- Good tools compound: Easy posting → More posts → More data → Better insights

**For HuaQiao Foundation**: If CLI workflow feels tedious, build CMS. Don't wait for "someday when we have more team."

---

## Technical Stack Summary

### Frontend (Hugo Static Site)

| Component | Version | Purpose | Notes |
|-----------|---------|---------|-------|
| Hugo | 0.150.0 | Static site generator | Extended version for image processing |
| Tailwind CSS | 4 | Styling | Utility-first CSS |
| Alpine.js | 3.14.1 | Minimal JavaScript | Self-hosted (China-safe) |
| Marked.js | N/A (Hugo) | Markdown rendering | Built into Hugo, no external dep |

### Backend (Supabase)

| Component | Purpose | Notes |
|-----------|---------|-------|
| PostgreSQL | Database | Hosted by Supabase (ap-southeast-1) |
| Supabase Storage | Image CDN | Public bucket: `updates/` |
| Supabase Auth | Future use | Not yet implemented for public auth |

### CMS (Internal Hub)

| Component | Version | Purpose | Notes |
|-----------|---------|---------|-------|
| React | 19 | UI framework | Latest stable |
| React Admin | 5.3.2 | Admin framework | Data provider pattern |
| Vite | 7 | Build tool | Fast dev server |
| TypeScript | 5.8 | Type safety | Strict mode enabled |
| Marked.js | 17.0.1 | Markdown rendering | `async: false` mode |

### Sync Scripts

| Script | Runtime | Purpose | Frequency |
|--------|---------|---------|-----------|
| `sync-updates-to-supabase.js` | Deno | Hugo → DB | Rare (5%) |
| `sync-updates-from-supabase.js` | Deno | DB → Hugo | Daily |
| `upload-update-image.js` | Node.js | Images → Storage | Once per CLI post |

### Deployment

| Service | Purpose | Trigger | Build Time |
|---------|---------|---------|------------|
| Cloudflare Pages | Hugo static hosting | Git push to `main` | ~2 minutes |
| Cloudflare Pages | Hub CMS hosting | Git push to `main` | ~3 minutes |
| Supabase | Database + Storage | Always-on | N/A |

---

## Code Samples

### Complete Hugo Update Template

**File**: `apps/hugo/content/updates/example-post/index.en.md`

```yaml
---
# Required
title: "Example Post Title"
date: "2025-12-18T08:00:00+08:00"  # ISO 8601 with timezone
author: randal-eastman              # Slug from data/authors.yml
draft: false

# Post Type
postType: build  # build|reflect|announce|illuminate

# Images
heroImage: example-post-hero.jpg           # Filename only (Hugo processes)
heroImageUrl: https://...supabase.co/.../hero.jpg  # Supabase Storage URL (canonical)

# SEO
description: "Brief description for meta tags (120-160 chars)"

# Taxonomy (optional)
markets: [russia, china]
sectors: [natural-beauty]
attributes: [founder-led]
signals: [export-ready]

# Related Content (optional, slugs)
related_brands: [sugar-cosmetics, perfect-diary]
related_founders: [vineeta-singh]
related_insights: []

# Display
featured: false  # Show featured badge on cards
---

Content here in Markdown format...

## Heading 2

Regular paragraph text with **bold** and *italic*.

![Alt text](image.jpg)  # Images auto-processed via render hook

- Bullet list
- Item 2

1. Numbered list
2. Item 2

> Blockquote text

```code
Code block
```
```

### Complete Database Record

**Example query**:
```sql
SELECT * FROM updates WHERE slug = 'dark-mode-launch';
```

**Result**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "slug": "dark-mode-launch",
  "title_en": "Dark Mode is Here",
  "title_ru": null,
  "title_zh": null,
  "content": "We shipped dark mode today...\n\n## Why Dark Mode\n\n...",
  "description": "Announcing site-wide dark mode with automatic system preference detection",
  "author": "randal-eastman",
  "date": "2025-12-11T08:00:00+08:00",
  "status": "published",
  "post_type": "build",
  "source": "hub",
  "featured": false,
  "hero_image": "dark-mode-launch-hero.jpg",
  "hero_image_url": "https://wcfhbzbmxztdzwjaujoq.supabase.co/storage/v1/object/public/updates/dark-mode-launch/hero.jpg",
  "markets": ["russia", "china"],
  "sectors": [],
  "attributes": [],
  "signals": [],
  "related_brands": [],
  "related_founders": [],
  "related_insights": [],
  "created_at": "2025-12-11T06:30:00Z",
  "updated_at": "2025-12-11T06:45:00Z",
  "deleted_at": null
}
```

### Hugo List Template (Simplified)

**File**: `apps/hugo/layouts/updates/list.html`

```go
{{ define "main" }}
<div class="updates-list-page">
  <section class="updates-hero">
    <h1>{{ i18n "updates" }}</h1>
    <p>{{ i18n "updates_subtitle" }}</p>
  </section>

  <section class="updates-list">
    {{/* Sort: featured first, then by date */}}
    {{ $allUpdates := where .Pages "Type" "updates" }}
    {{ $featured := where $allUpdates "Params.featured" true }}
    {{ $regular := where $allUpdates "Params.featured" "!=" true }}
    {{ $sortedUpdates := union $featured $regular }}

    {{/* Paginate: 15 per page */}}
    {{ $paginator := .Paginate $sortedUpdates 15 }}

    <div class="updates-grid">
      {{ range $paginator.Pages }}
        <article class="update-card">
          {{/* Post Type Badge */}}
          {{ if .Params.postType }}
            <div class="post-type-badge post-type-badge--{{ .Params.postType }}">
              {{/* Icon + Label */}}
              <span>{{ i18n .Params.postType }}</span>
            </div>
          {{ end }}

          {{/* Hero Image - Hybrid Rendering */}}
          {{ if .Params.heroImageUrl }}
            {{/* CMS-uploaded: Use Supabase URL */}}
            <img src="{{ .Params.heroImageUrl }}" alt="{{ .Title }}" loading="lazy">
          {{ else if .Params.heroImage }}
            {{/* CLI-created: Process from Hugo assets */}}
            {{ $imagePath := printf "images/updates/%s/originals/%s" .Params.slug .Params.heroImage }}
            {{ with resources.Get $imagePath }}
              {{ $image := .Resize "800x450 webp q85" }}
              <img src="{{ $image.RelPermalink }}" alt="{{ $.Title }}" loading="lazy">
            {{ end }}
          {{ end }}

          {{/* Title + Description */}}
          <h2><a href="{{ .RelPermalink }}">{{ .Title }}</a></h2>
          <p>{{ .Params.description }}</p>

          {{/* Read More */}}
          <a href="{{ .RelPermalink }}">{{ i18n "read_more" }} →</a>
        </article>
      {{ end }}
    </div>

    {{/* Pagination */}}
    {{ if gt $paginator.TotalPages 1 }}
      <nav class="pagination">
        {{ if $paginator.HasPrev }}
          <a href="{{ $paginator.Prev.URL }}">← {{ i18n "newer_posts" }}</a>
        {{ end }}
        <span>{{ i18n "page" }} {{ $paginator.PageNumber }} {{ i18n "of" }} {{ $paginator.TotalPages }}</span>
        {{ if $paginator.HasNext }}
          <a href="{{ $paginator.Next.URL }}">{{ i18n "older_posts" }} →</a>
        {{ end }}
      </nav>
    {{ end }}
  </section>
</div>
{{ end }}
```

### Hub CMS Update Card Component

**File**: `apps/hub/src/components/atomic-crm/updates/UpdateCard.tsx` (simplified)

```typescript
import { Wrench, MessageCircle, Megaphone, Lightbulb } from "lucide-react";
import { type PostType, POST_TYPE_COLORS } from "./types";

const POST_TYPE_ICONS = {
  build: Wrench,
  reflect: MessageCircle,
  announce: Megaphone,
  illuminate: Lightbulb,
};

export const UpdateCard = ({ update }: { update: Update }) => {
  const Icon = POST_TYPE_ICONS[update.post_type || "announce"];
  const colorClass = POST_TYPE_COLORS[update.post_type || "announce"];

  return (
    <article className="update-card">
      {/* Post Type Badge */}
      {update.post_type && (
        <div className={`post-type-badge ${colorClass}`}>
          <Icon className="w-3.5 h-3.5" />
          <span>{POST_TYPE_LABELS[update.post_type]}</span>
        </div>
      )}

      {/* Source Badge (Hugo vs Hub) */}
      {update.source === "hugo" && (
        <div className="source-badge source-badge--hugo">
          🔵 Hugo
        </div>
      )}

      {/* Hero Image */}
      {update.hero_image_url && (
        <img
          src={update.hero_image_url}
          alt={update.title_en}
          className="update-card__image"
          loading="lazy"
        />
      )}

      {/* Title + Description */}
      <h2 className="update-card__title">{update.title_en}</h2>
      {update.description && (
        <p className="update-card__description">{update.description}</p>
      )}

      {/* Metadata */}
      <div className="update-card__meta">
        <time>{new Date(update.date).toLocaleDateString()}</time>
        <span>•</span>
        <span>{update.author}</span>
        <span>•</span>
        <span className={`status-badge status-badge--${update.status}`}>
          {update.status}
        </span>
      </div>

      {/* Actions */}
      <a href={`/updates/${update.id}/show`} className="update-card__link">
        View Details →
      </a>
    </article>
  );
};
```

---

## Conclusion

Brandmine's Updates blog system demonstrates that **simplicity and elegance are achievable with the right architecture**:

1. **Database as SSOT** - Centralized truth, generated artifacts
2. **Hybrid workflows** - CLI for power users, CMS for everyone else
3. **Bidirectional sync** - Best of both worlds (Hugo + Supabase)
4. **Safety defaults** - Prevent accidents with INSERT-only mode
5. **Soft delete pattern** - Never lose content
6. **Origin tracking** - Understand content lifecycle
7. **CLI-friendly** - 5 commands to publish (or 1 click in CMS)

**For HuaQiao Foundation**: This architecture scales from solo developer to team, CLI to CMS, English-only to multilingual. Start simple, add complexity only when needed.

**Questions?** Feel free to reach out:
- **Email**: randal@brandmine.ai
- **GitHub**: github.com/anthropics/brandmine-hugo (private, can grant access)
- **Live Site**: brandmine.ai/updates/

---

**Document Version**: 1.0
**Total Updates**: 16 (as of 2025-12-18)
**System Status**: Production-ready, actively maintained
**License**: Private (can be shared with HuaQiao Foundation under NDA)
