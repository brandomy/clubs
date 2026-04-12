---
description: Generate a technical summary of the clubs monorepo for COO briefing
allowed-tools: Read, Bash, Glob, Grep, Write, TodoWrite
---

# Tech Summary

Generate a clear, executive-level technical summary of the clubs monorepo structure. This report is designed to brief the COO — it should be accurate, readable, and free of unnecessary jargon.

---

## STEP 1: Ask Which Apps to Cover

Present the following choice and wait for the user's response before proceeding:

> Which apps should the report cover?
>
> 1. **Both apps** — Georgetown + Pitchmasters (full monorepo summary)
> 2. **Georgetown only** — Rotary speaker & event management
> 3. **Pitchmasters only** — Toastmasters club management

Set `SCOPE` based on their answer: `both`, `georgetown`, or `pitchmasters`.

---

## STEP 2: Gather Live Data

Before writing, collect current data from the codebase. Run these commands and capture the output.

### Git status & recent activity
```bash
cd /Users/randaleastman/dev/clubs
git log --oneline -10
git status --short | head -30
```

### Package versions (root workspace)
```bash
cat package.json | grep -E '"(name|version|workspaces)"'
```

### Georgetown — if SCOPE is `both` or `georgetown`
```bash
# Page count
ls apps/georgetown/src/components/ | wc -l
ls apps/georgetown/src/pages 2>/dev/null | wc -l || echo "Pages in components"

# Core package versions
cat apps/georgetown/package.json | grep -E '"(react|typescript|vite|supabase|tailwind|react-router)"' | head -20

# Functions (Cloudflare middleware)
ls apps/georgetown/functions/ 2>/dev/null

# DB migration count
ls apps/georgetown/docs/database/sql-scripts/ 2>/dev/null | wc -l
```

Also read these files for current status:
- `apps/georgetown/src/App.tsx` (routes — just the route list section)
- `apps/georgetown/docs/governance/BACKLOG.md` (first 60 lines for priorities)

### Pitchmasters — if SCOPE is `both` or `pitchmasters`
```bash
# Component and page counts
ls apps/pitchmasters/src/components/ | wc -l
ls apps/pitchmasters/src/pages/ | wc -l

# Core package versions
cat apps/pitchmasters/package.json | grep -E '"(react|typescript|vite|supabase|tailwind|react-router)"' | head -20

# DB migration count
ls apps/pitchmasters/docs/database/sql-scripts/ 2>/dev/null | wc -l
```

Also read these files for current status:
- `apps/pitchmasters/src/App.tsx` (routes — just the route list section)
- `apps/pitchmasters/docs/BACKLOG.md` (first 60 lines for priorities)

---

## STEP 3: Write the Report

Write the report in clean markdown. Output it directly to the user (do NOT save it to a file unless they ask).

Use the structure below. Include only the sections relevant to SCOPE — skip app sections that aren't in scope.

---

```markdown
# Technical Summary — Clubs Platform
**Date**: [today's date]  
**Prepared by**: CTO (Claude Code)  
**Audience**: COO

---

## Platform Overview

The clubs platform is a **pnpm monorepo** hosting two independent React web applications — one for Georgetown Rotary Club and one for Pitchmasters (Toastmasters). Both apps share the same tech stack, are independently deployable, and live at separate URLs on Cloudflare Pages.

**Monorepo structure**:
```
clubs/
├── apps/
│   ├── georgetown/      # Rotary speaker & event management
│   └── pitchmasters/    # Toastmasters club management
└── package.json         # Shared workspace config
```

**Shared stack** (both apps):
| Layer | Technology | Version |
|-------|-----------|---------|
| UI framework | React | 19.x |
| Language | TypeScript | 5.x |
| Build tool | Vite | 7.x |
| Styling | Tailwind CSS | 3.4.x |
| Database | Supabase (PostgreSQL) | — |
| Routing | React Router | 7.x |
| Hosting | Cloudflare Pages | — |

---

## Recent Activity

[Insert the last 10 git commits in a clean list: `hash — message`]

---

## Georgetown — Rotary Speaker & Event Management

### What It Does
Georgetown is a speaker coordination and event management tool for Georgetown Rotary Club (~50 members). It replaces email chains and manual scheduling with a digital board that tracks speakers from outreach through delivery.

### Core Features
[List routes/pages found in App.tsx as feature descriptions, not raw route paths. Group logically:]
- **Speaker pipeline**: Kanban board tracking speakers across stages (Ideas → Spoken)
- **Event management**: Calendar view, event scheduling, attendance tracking
- **Member directory**: Profiles, portraits, contact management
- **Service projects**: Tracking with Rotary Areas of Focus
- **Partners**: Partner directory with logo and detail pages
- **Public sharing**: Open Graph meta tags for social previews (WhatsApp, LinkedIn, WeChat)
- **Authentication**: Protected routes, password reset flow

### Architecture Notes
- **PWA**: Installable, offline-capable with self-hosted fonts (China-friendly — no Google CDNs)
- **Cloudflare Functions**: Server-side middleware for social media crawler injection (`functions/_middleware.ts`)
- **Real-time**: Supabase realtime subscriptions for live board updates
- **Mobile-first**: Designed for phone use during meetings (44px touch targets, 320px–414px primary)

### Database
- **Platform**: Supabase (PostgreSQL), hosted in Singapore (ap-southeast-1)
- **Migrations**: [N] numbered SQL scripts in `docs/database/sql-scripts/`
- **Access pattern**: Pooled connection for app queries; direct connection for migrations

### Current Status
[Summarize top 3–5 items from Georgetown BACKLOG.md — use their priority labels]

---

## Pitchmasters — Toastmasters Club Management

### What It Does
Pitchmasters is a full club management platform for a Toastmasters club focused on startup founders. It handles meeting operations, member tracking, speech progress, and now includes a custom Learning Management System (LMS) and Content Management System (CMS).

### Core Features
[List routes/pages found in App.tsx as feature descriptions. Group logically:]
- **Dashboard**: Meeting overview, upcoming roles, quick actions
- **Member management**: Profiles, privacy settings, role tracking
- **LMS — Skills & Learning Paths**: Track member progress through Toastmasters competency programs (Competent Communication, Competent Leadership, Effective Evaluation, etc.)
- **LMS — Digital Badges & Certificates**: Auto-issued on skill completion; PDF-exportable certificates
- **LMS — Learning Analytics**: Admin view of club-wide learning progress
- **CMS — Public Pages**: Admins create branded public pages with rich content blocks (text, images, video embeds)
- **Community**: Cross-club ecosystem partner directory
- **Authentication**: Login, password reset, protected routes

### Architecture Notes
- **PWA**: Full offline support, user-controlled update prompts, branded offline page
- **Multi-club ready**: Database architecture supports tenant isolation for future growth
- **Mobile-first**: Founders primarily use phones; 44px touch targets, swipe gestures
- **China-friendly**: Self-hosted fonts, no blocked CDNs, Cloudflare Pages deployment
- **Caching strategy**: Auth endpoints never cached; storage/images CacheFirst (30d); API reads NetworkFirst (5-min)

### Database
- **Platform**: Supabase (PostgreSQL)
- **Migrations**: [N] numbered SQL scripts in `docs/database/sql-scripts/`
- **Key tables**: Members, Skills, Learning paths, Skill completions, Badges, Certificates, CMS pages

### Current Status
[Summarize top 3–5 items from Pitchmasters BACKLOG.md — use their priority labels]

---

## Deployment

| App | Build command | Output | Host |
|-----|--------------|--------|------|
| Georgetown | `pnpm build:georgetown` | `apps/georgetown/dist` | Cloudflare Pages |
| Pitchmasters | `pnpm build:pitchmasters` | `apps/pitchmasters/dist` | Cloudflare Pages |

Both apps are deployed independently via Cloudflare Pages. No shared hosting dependencies — each can be updated, rolled back, or scaled independently.

---

## Quality Gates

Before any deploy, all three checks must pass:
1. **Lint** — ESLint
2. **Type check** — TypeScript strict mode
3. **Build** — Vite production build (both apps)

Run with: `pnpm lint && pnpm typecheck && pnpm build`
```

---

## STEP 4: Offer Next Steps

After delivering the report, offer:

> Would you like me to:
> 1. **Save this report** to `docs/reports/YYYY-MM-DD-tech-summary.md`
> 2. **Dig deeper** into a specific feature or app area
> 3. **Run the pre-deploy quality gate** to show current build health
