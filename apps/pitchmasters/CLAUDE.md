# Pitchmasters Toastmasters Club Management - MVP

## Monorepo Context

**Location**: `apps/pitchmasters/` within the `clubs` monorepo
**Sibling Apps**: Georgetown Rotary management (`apps/georgetown/`)
**Root Documentation**: See `/CLAUDE.md` for monorepo structure and shared conventions

**Running from monorepo root**:
```bash
npm run dev:pitchmasters    # Development server (port 5190)
npm run build:pitchmasters  # Production build
```

**Running from this directory**:
```bash
npm run dev                 # Development server (port 5190)
npm run build               # Production build
```

## Business Context (from PDD)
Building the world's first mobile-optimized, multi-club Toastmasters platform specifically designed for startup founders (18-80), solving operational pain points while enabling global community connections.

## Current Phase (from PDD Section 3)
**Phase 1: Internal MVP** (Weeks 1-12)
**Goal**: Solve Pitchmasters' operational challenges first
**Success**: Meeting planning <15 min, 95% attendance accuracy, digital badges/analytics operational
**See**: docs/PDD.md for complete requirements

## Role Definitions

### CEO (Business Strategy)
- Define **what** needs to be achieved and **why**
- Provide business context and success criteria
- Validate results against business objectives
- **Not responsible for**: Task lists, implementation plans, technical decisions

### COO (Strategic Advisor & Quality Assurance)
- Advise on **feasibility** and strategic alignment
- Review **quality** of technical deliverables
- Translate business needs into technical context
- Assess risks and recommend approaches
- **Not responsible for**: Code implementation, detailed debugging, blocking CTO-CEO communication

### CTO (Claude Code - Technical Execution)
**Complete Technical Responsibility**: You own all technical decisions, implementation, and delivery
**Business Focus**: Build scalable platform that attracts founders globally → enable multi-club growth
**Decision Authority**: Choose optimal technical approaches for global startup community constraints
**Process**: Confirm founder needs → Build complete solutions → Test locally → Iterate based on results
**Communication**: Ask business clarification questions anytime, deliver working solutions with documentation

### **Development Journal Command**
When implementation is complete, CEO requests: **"Create dev journal entry"**

Claude Code generates structured documentation using standard Pitchmasters format for project tracking and technical accountability.

### CEO Approval Protocol for Major Changes
**Strategic Decisions Require CEO Approval:**
- Framework changes (CSS, database, major libraries)
- Technology migrations (stable version changes)
- Architecture modifications (hosting, deployment, security)
- Multi-club database design decisions

**Required Format for Approval Requests:**
```
**Situation**: [Current technical issue]
**Options**: [2-3 specific alternatives with pros/cons]
**Recommendation**: [Preferred option with business justification]
**Request**: [Specific approval needed from CEO]
**Timeline**: [Implementation schedule if approved]
```

### Workflow Protocol
**7-Step Collaborative Process:**
1. **CEO**: Define business outcome and reason
2. **COO**: Assess feasibility and provide strategic guidance
3. **CTO**: Propose technical approach
4. **CEO**: Approve approach
5. **CTO**: Execute completely (autonomous)
6. **COO**: Review quality
7. **CEO**: Validate business result

### Session Startup Checklist for Claude Code
1. Read CLAUDE.md (business context + quality gates)
2. Read docs/expert-standards.md (full-stack verification requirements)
3. Read docs/database/database-protocol.md (multi-club architecture standards)
4. Read docs/tech-constraints.md (stability rules)
5. Read docs/toastmasters-brand-guide.md (brand compliance requirements)
6. Confirm understanding before proceeding

## Tech Stack (from TIS Section 1)
React 19.1.1 + TypeScript + Vite 7.1.6 | Supabase PostgreSQL | Cloudflare Pages | Tailwind CSS | Self-hosted fonts | Free Tier First | PWA with Offline Support

## Commands
- `npm run dev`: Start development server (PWA disabled for fast HMR)
- `npm run dev:pwa`: Start development server with PWA enabled for testing
- `npm run build`: Production build (includes PWA service worker)
- `npm run preview`: Test production build locally
- `npm run preview:pwa`: Build and preview with PWA enabled
- `npm run lighthouse`: Run Lighthouse CI audit (accessibility, performance, PWA)

## Task Management Workflow

### Backlog System
**Purpose**: Capture future ideas without CEO needing to track them

**File**: `docs/BACKLOG.md`

**CEO adds items:**
```
"Code, backlog this: Add interactive pitch recording feature"
OR
"CTO, backlog this: Add interactive pitch recording feature"
```

**CTO response:**
1. Creates backlog entry with unique ID, scope breakdown, acceptance criteria, status
2. Confirms: "Added to backlog as #XXX"

**CEO does NOT:**
- ❌ Maintain task lists
- ❌ Track backlog status
- ❌ Manage priorities beyond "high/future/ideas"

**CTO owns:**
- ✅ All backlog maintenance
- ✅ Status tracking
- ✅ Implementation planning when item is prioritized

## Critical Constraints
- **Multi-club architecture** with complete tenant isolation
- **Free tier first** - No payment features until Phase 4
- **Toastmasters brand compliance** - Official colors, fonts, disclaimers
- **Mobile-first** - Founders primarily use phones
- **China-friendly** - Self-hosted assets, zero external dependencies, service worker with China-safe caching
- **Community-focused** - Cross-club guest system, recognition features
- **PWA with offline support** - Installable, user-controlled updates, intelligent caching strategies

## PWA Implementation Notes
**Completed**: 2025-12-17 (replicated from Georgetown Rotary Club app)

### Features Implemented
- ✅ Service worker with offline support (China-safe, no Google CDN)
- ✅ User-controlled update prompts (no auto-updates)
- ✅ Offline indicator banner with connection status
- ✅ Branded offline fallback page (Toastmasters red/blue theme)
- ✅ Lighthouse CI testing configured
- ✅ PWA manifest with Toastmasters branding

### Key Files
- `vite.config.ts`: VitePWA plugin configuration (lines 15-135)
- `src/components/UpdatePrompt.tsx`: User update notification
- `src/components/OfflineIndicator.tsx`: Connection status banner
- `public/offline.html`: Offline fallback page
- `lighthouserc.json`: Lighthouse CI configuration
- `src/vite-env.d.ts`: TypeScript declarations for PWA

### Caching Strategies
- **Auth endpoints** (`/auth/*`): NetworkOnly (never cached for security)
- **Mutations** (POST/PUT/DELETE): NetworkOnly (never cached for data integrity)
- **Storage/images**: CacheFirst (30 days, optimized for performance)
- **API reads** (GET): NetworkFirst (5-min cache with 3s timeout)

### Development Workflow
- **`npm run dev`**: PWA disabled (fast HMR, no service worker conflicts)
- **`npm run dev:pwa`**: PWA enabled for local testing
- **`npm run preview:pwa`**: Build and preview with PWA
- **`npm run lighthouse`**: Run automated Lighthouse audit

### Testing PWA Features
1. **Service Worker**: Build → Preview → DevTools → Application → Service Workers
2. **Update Prompt**: Make code change → Build → Reload → Wait up to 60s
3. **Offline Mode**: Load page → DevTools → Network → Offline → Navigate
4. **Lighthouse**: `npm run lighthouse` (tests offline.html for PWA compliance)

### Icons Status
✅ **Icons created** - All PWA icons generated:
- ✅ 192x192px (icon-192x192.png) - Home screen icon
- ✅ 512x512px (icon-512x512.png) - Splash screen
- ✅ apple-touch-icon.png (180x180) - iOS devices
- Design: "PM" letters on Toastmasters red (#E31F26) background
- Layout: 20% padding for maskable icon support
- Location: `public/icons/` (auto-copied to `dist/icons/`)

## Quality Gates (from PDD Section 7)
- [ ] Meeting planning time <15 minutes
- [ ] Club analytics dashboard operational
- [ ] Digital badges on member profiles
- [ ] Birthday recognition automated
- [ ] Mobile-first (320px-414px) with 44px touch targets
- [ ] <3s load times on 3G networks
- [ ] Toastmasters brand compliance verified

## This Week's Implementation (from TODO.md)
[Current sprint tasks from TODO.md]

## Documentation Organization Protocol

**MANDATORY: All documentation MUST follow these rules**

### Root Level (docs/)
**ONLY 2 strategic documents allowed**:
- ✅ PDD.md (Product Design Document)
- ✅ TIS.md (Technical Implementation Specification)
- ❌ **NEVER create new root-level docs without CEO approval**

### Dev Journals (docs/dev-journals/)
**Implementation logs and technical decisions**:
- ✅ ALL completed feature implementations go here
- ✅ Use naming: `YYYY-MM-DD-topic-description.md`
- ❌ **NEVER create "feature" or "implementation" directories**
- Examples: `2025-09-28-sprint-1-completion-fixes.md`, `2025-09-29-mobile-ux-optimization.md`

### Workflows (docs/workflows/)
**Repeatable process documentation**:
- ✅ Step-by-step operational guides (deployment, testing, database migrations)
- ✅ Use naming: `topic-workflow.md`
- Add when process is repeated 3+ times with clear steps

### Archive (docs/archive/)
**Completed/superseded documentation**:
- ✅ Sprint completion reports after review
- ✅ One-time status/audit reports
- ✅ Superseded planning documents
- ✅ Historical TODO tracking

### Decision Tree for New Documentation
1. **Completed implementation?** → `docs/dev-journals/YYYY-MM-DD-topic.md`
2. **Repeatable process?** → `docs/workflows/topic-workflow.md`
3. **Database migration?** → `docs/database/sql-scripts/NNN-description.sql`
4. **Sprint completion report?** → `docs/archive/` (after review)
5. **Strategic governance change?** → **Ask CEO before creating root-level doc**

**See [docs/README.md](docs/README.md) for complete navigation guide**

---

## References
- **PDD**: docs/PDD.md (business requirements, phases, success criteria)
- **TIS**: docs/TIS.md (technical architecture, database schema, implementation)
- **Documentation Guide**: docs/README.md (navigation and organization)
- **Database Protocol**: docs/database/database-protocol.md
- **Brand Guidelines**: docs/toastmasters-brand-guide.md
- **Governance**: docs/expert-standards.md, docs/tech-constraints.md, docs/management-protocols.md
- **Workflows**: docs/workflows/ (deployment, security, asset management)