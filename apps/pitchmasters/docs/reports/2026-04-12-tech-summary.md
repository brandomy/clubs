# Technical Summary — Pitchmasters Platform
**Date**: 2026-04-12
**Prepared by**: CTO (Claude Code)
**Audience**: COO

---

## Platform Overview

Pitchmasters is a full-stack web application for managing a Toastmasters club focused on startup founders. It handles member management, meeting operations, speech/skill tracking, digital credentials, and branded public content — all in a mobile-first PWA designed to work in China.

**Hosting**: Cloudflare Pages (global CDN, free tier)
**Database**: Supabase (PostgreSQL), managed cloud

**Core stack**:

| Layer | Technology | Version |
|-------|-----------|---------|
| UI framework | React | 19.2.5 |
| Language | TypeScript | 5.8.3 |
| Build tool | Vite | 7.3.2 |
| Styling | Tailwind CSS | 3.4.x |
| Database | Supabase (PostgreSQL) | — |
| Routing | React Router | 7.x |
| Hosting | Cloudflare Pages | — |

---

## Recent Activity (Last 10 Commits)

| Hash | Description |
|------|-------------|
| `7c3559d` | fix: remove Toastmasters logo and branding from header and footer |
| `821aab9` | refactor: remove S/M/L video size buttons — drag handles only |
| `9e40d9a` | feat: Pitchmasters CMS — video embeds, size picker, save toast, image UX |
| `783bd13` | feat: Georgetown password reset flow + brandmine.ai rebrand |
| `fc1f888` | feat: Pitchmasters LMS — custom learning management system (Plan 2) |
| `2f44034` | fix: resolve Pitchmasters auth — eliminate RLS recursion and PKCE lock races |
| `f2a66a9` | refactor: rename Georgetown tables with gt_ prefix (migration 069) |
| `9894ec4` | feat: Phase 4 polish — accessibility, dead code removal, type safety |
| `bb370cd` | refactor: replace console.* with logger utility across both apps |
| `eb60f66` | feat: Phase 1 security fixes + real auth for both apps |

**Active work**: 23 files modified, not yet committed. Includes LMS and CMS refinements, PWA updates, and 4 new pending database migrations.

---

## Core Features

### Member Management
- Member directory with individual profile pages
- Privacy controls per member
- Role tracking and meeting assignments

### Authentication
- Email/password login with Supabase Auth
- Password reset flow (email link → new password)
- All app routes protected; public page view is the only exception

### LMS — Skills & Learning Paths
Members self-track progress through Toastmasters competency programs (Competent Communication, Competent Leadership, Effective Evaluation, etc.). The LMS is custom-built — no third-party platform.

- **Member view** (`/learn`): Browse skills, mark project completions, view progress
- **Project view** (`/learn/:skill/project/:id`): Step-by-step project content with completion tracking
- **Admin view** (`/learn/admin`): Manage skills, levels, and content; review club-wide progress
- **Skill editor**: Create/edit skills and their level structure
- **Level content editor**: Rich content per level (descriptions, requirements, resources)
- **Evaluation templates**: Standardized forms per skill type

### LMS — Digital Badges & Certificates
- Badges auto-issued when a skill is completed (badge engine in `lib/badge-engine.ts`)
- PDF-exportable certificates (generated client-side in `lib/certificate.tsx`)
- Certificates display on member profiles

### LMS — Learning Analytics
- Admin dashboard showing club-wide completion rates, active learners, skill adoption
- Identifies members who have stalled or are close to completing a level

### CMS — Public Pages
Officers create branded public-facing pages for recruiting, announcements, or event promotion. No external CMS dependency — fully custom.

- Rich content blocks: text, images, video embeds (YouTube/Vimeo)
- Drag-to-resize images
- Pages published at `/pages/:slug` — accessible without login
- Slug-based URLs for sharing (WhatsApp, LinkedIn, etc.)

### Community
- Partner/ecosystem directory for cross-club connections (`/community`)

---

## Architecture Notes

- **PWA**: Installable on iOS and Android. Offline-capable with branded fallback page. User-controlled update prompts (no silent auto-updates).
- **China-friendly**: All fonts self-hosted. Zero dependencies on Google Fonts, CDNs, or services blocked in China. Caching strategy avoids Chinese firewall conflicts.
- **Multi-club ready**: Database schema includes club tenant isolation — the platform is designed to onboard additional Toastmasters clubs without a rebuild.
- **Mobile-first**: 44px touch targets, 320–414px primary viewport, swipe interactions.
- **Caching strategy**: Auth endpoints never cached; images/assets cached 30 days (CacheFirst); API reads 5-minute cache with 3s network timeout (NetworkFirst).
- **Security**: Row-level security (RLS) on all Supabase tables; auth flow hardened against PKCE race conditions.

---

## Database

- **Platform**: Supabase (PostgreSQL), hosted on managed cloud
- **Migrations**: 17 numbered SQL scripts in `docs/database/sql-scripts/` (4 pending, not yet applied)
- **Recent pending migrations**:
  - `011`: Rename "path" → "skill" (terminology standardization)
  - `012–013`: Add level content as JSONB field
  - `014`: Add skill order index

**Key tables**: Members, Skills, Skill levels, Level content, Skill completions, Badges, Certificates, CMS pages

---

## Current Status (as of 2026-04-12)

The formal backlog (`docs/BACKLOG.md`) was initialized in October 2025 and has not been updated to reflect completed work — several items listed as "Backlogged" (badges, LMS) have since shipped. The active development priority, based on recent commits, is:

| Priority | Item | Status |
|----------|------|--------|
| Active | LMS refinements — skill renaming, level content editing | In progress (uncommitted) |
| Active | CMS polish — video embeds, image drag-resize UX | In progress (uncommitted) |
| Active | Branding cleanup — removing Toastmasters logo per policy | Recently shipped |
| Backlog | Multi-club landing pages | Planned |
| Backlog | Unified member registration & onboarding flow | Planned |
| Backlog | Meeting planning system (drag-and-drop role assignment) | Planned |

---

## Deployment

| Item | Detail |
|------|--------|
| Build command | `pnpm build:pitchmasters` |
| Output directory | `apps/pitchmasters/dist` |
| Host | Cloudflare Pages |
| Deploy trigger | Manual (push + Cloudflare Pages build hook) |

The app deploys independently — no shared infrastructure with Georgetown.

---

## Quality Gates

All three must pass before any deploy:

```bash
pnpm lint && pnpm typecheck && pnpm build:pitchmasters
```

1. **Lint** — ESLint (catches code quality issues)
2. **Type check** — TypeScript strict mode (catches type errors)
3. **Build** — Vite production build (confirms the app compiles and bundles cleanly)
