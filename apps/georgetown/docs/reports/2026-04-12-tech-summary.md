# Technical Summary — Georgetown App
**Date**: 2026-04-12
**Prepared by**: CTO (Claude Code)
**Audience**: COO

---

## Platform Overview

Georgetown is a React single-page application (SPA) for Georgetown Rotary Club (~50 members). It replaces email chains and manual coordination with a digital platform that tracks speakers from initial outreach through delivery, plus handles events, members, service projects, and club communications.

**Hosting**: Cloudflare Pages (globally accessible, including mainland China)
**Database**: Supabase (PostgreSQL), hosted in Singapore (ap-southeast-1)

**Tech stack**:

| Layer | Technology | Version |
|-------|-----------|---------|
| UI framework | React | 19.2.5 |
| Language | TypeScript | 5.8.3 |
| Build tool | Vite | 7.3.2 |
| Styling | Tailwind CSS | 3.4.17 |
| Routing | React Router | 7.9.2 |
| Database | Supabase (PostgreSQL) | — |
| Hosting | Cloudflare Pages | — |

---

## Recent Activity (Last 10 Commits)

- `b87a8fe` — feat: LMS dashboard — level progress tracker and end marker
- `06b696b` — feat: rename path → skill, add level content, CMS schema, Toastmasters reference data
- `585d070` — refactor: switch to variable fonts — Pitchmasters and Georgetown
- `7c3559d` — fix: remove Toastmasters logo and branding from header and footer
- `821aab9` — refactor: remove S/M/L video size buttons — drag handles only
- `9e40d9a` — feat: Pitchmasters CMS — video embeds, size picker, save toast, image UX
- `783bd13` — feat: Georgetown password reset flow + brandmine.ai rebrand
- `fc1f888` — feat: Pitchmasters LMS — custom learning management system
- `2f44034` — fix: resolve Pitchmasters auth — eliminate RLS recursion and PKCE lock races
- `f2a66a9` — refactor: rename Georgetown tables with gt_ prefix (migration 069)

*Note: Recent commits are mostly Pitchmasters work. The Georgetown-specific commits were the password reset flow and the table rename migration.*

---

## Georgetown — Rotary Speaker & Event Management

### What It Does

Georgetown is the program committee's command center. It centralizes speaker discovery, coordination, and scheduling so the club never double-books, loses a contact, or forgets a follow-up. Members access it on their phones during weekly meetings.

### Core Features

**Speaker Pipeline**
- Kanban board with six stages: Ideas → Approached → Agreed → Scheduled → Spoken → Dropped
- Drag-and-drop cards between stages
- Speaker detail pages with portraits, social links, and topic notes
- Speaker Bureau view — public-facing profile gallery for sharing externally

**Events & Calendar**
- Calendar view of club meetings and special events
- Events list view for at-a-glance scheduling
- Member availability tracker
- Event types: Club Meetings, Board Meetings, Club Socials, Club Assembly, Observances

**Member Directory**
- Member profiles with portraits, roles (array), Rotary join date, citizenship, classification
- Photo gallery (club event photos stored in Supabase)

**Service Projects**
- Project tracking with images, partner links, and Rotary Areas of Focus
- Impact field for outcomes reporting

**Partner Directory**
- Partner profiles with logos, location, social media links
- Nested detail pages

**Timeline**
- Club history and milestone tracking system

**Social Sharing (Open Graph)**
- Cloudflare Functions middleware intercepts social media crawlers (WhatsApp, LinkedIn, WeChat, Telegram, etc.)
- Injects content-specific meta tags server-side before crawler sees the page
- Each speaker, member, event, and project generates a custom social preview with correct title, description, and image

**Authentication**
- Protected routes (all pages require login)
- Password reset flow
- User roles and permissions system (migration 054)

### Architecture Notes

- **PWA**: Installable on mobile home screens, offline detection with banner notification, self-hosted fonts (no external CDNs)
- **China-friendly**: No Google Fonts, no blocked CDNs — Cloudflare Pages deployment works in mainland China
- **Code splitting**: 55% bundle size reduction (850 KB → 377 KB) via lazy loading — 40+ route chunks loaded on demand
- **Real-time**: Supabase realtime subscriptions keep the speaker board live across multiple users simultaneously
- **Error resilience**: Error boundary prevents full app crashes; retry logic (3×) with exponential backoff on failed API calls
- **Mobile-first**: 44px minimum touch targets, tested at 320px–414px primary breakpoints
- **Cloudflare Functions**: `_middleware.ts` handles server-side social crawler injection without a separate backend

### Database

- **Platform**: Supabase (PostgreSQL), Singapore region
- **Migrations**: 70 numbered SQL scripts (000–069) in `docs/database/`
- **Table prefix**: All tables prefixed `gt_` (standardized in migration 069)
- **Key tables**: Speakers, Members, Events, Locations, Projects, Partners, Photos, Timeline, RSVPs, Attendance, User Roles
- **Access pattern**: Pooled connection (PgBouncer, port 6543) for app queries; direct connection (port 5432) for migrations via psql

### Current Backlog Status

| Priority | Item | Status |
|----------|------|--------|
| **High** | Analytics Tracking: Phase 3 — RSVP & Attendance (#018) | Backlogged |
| **Future** | Member Attendance Tracking (#002) | Backlogged |
| **Future** | Member Directory with Search (#003) | Backlogged |
| **Future** | PWA Enhancements — Offline Functionality (#013) | Backlogged |
| **Future** | PWA Push Notifications — Meeting Reminders (#014) | Backlogged |
| **Content** | Populate Historical Speakers Data (#C001) | Backlogged |
| **Content** | Upload Member Photos/Portraits (#C002) | Backlogged |

The app is feature-complete for core speaker management. The active high-priority item is closing the loop on RSVP/attendance analytics.

---

## Deployment

| Build command | Output directory | Host |
|--------------|-----------------|------|
| `pnpm build:georgetown` | `apps/georgetown/dist` | Cloudflare Pages |

Deployed independently — can be updated, rolled back, or scaled without touching Pitchmasters.

---

## Quality Gates

Before any deploy, all three checks must pass:

1. **Lint** — ESLint (zero errors)
2. **Type check** — TypeScript strict mode (zero errors)
3. **Build** — Vite production build

Run with: `pnpm lint && pnpm typecheck && pnpm build:georgetown`
