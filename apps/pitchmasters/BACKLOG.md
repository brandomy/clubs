# Pitchmasters Development Backlog

**Owner**: CTO (Claude Code)
**Purpose**: Track future features and tasks without CEO project management burden
**Last Updated**: 2026-04-12

---

## Usage

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

---

## Status Definitions

- **Backlogged**: Captured for future consideration
- **In Progress**: Actively being implemented
- **Completed**: Deployed to production
- **Archived**: No longer relevant or superseded

---

## Active Backlog

### #001: Multi-Club Landing Pages
**Status**: Backlogged
**Priority**: High
**Scope**:
- Individual landing pages for each club (Pitchmasters, future clubs)
- Unique value propositions per club
- Toastmasters brand compliance
- Mobile-first responsive design

**Acceptance Criteria**:
- [ ] Each club has dedicated landing page
- [ ] Displays club-specific meeting times, locations, value props
- [ ] Mobile-responsive (320px-414px)
- [ ] Toastmasters brand colors and fonts
- [ ] <3s load time on 3G

**Business Value**: Attract founders to specific clubs based on their needs

---

### #002: Unified Registration & Onboarding
**Status**: Backlogged
**Priority**: High
**Scope**:
- Multi-step registration flow (beyond current basic auth)
- Club selection based on location/timezone
- Member profile creation at signup
- Email verification
- Welcome sequence

**Acceptance Criteria**:
- [ ] 3-step registration process (<5 min to complete)
- [ ] Club assignment based on preferences
- [ ] Profile fields: name, startup, role, communication goals
- [ ] Email verification with welcome message
- [ ] Mobile-optimized forms

**Note**: Basic auth (login + password reset) exists. Missing: guided onboarding flow post-signup.

**Business Value**: Seamless path from visitor to active member

---

### #003: Meeting Planning System
**Status**: Backlogged
**Priority**: High
**Scope**:
- Drag-and-drop role assignment
- Meeting agenda templates (Toastmasters standard)
- Automated email notifications
- Attendance tracking
- Meeting notes/feedback capture

**Acceptance Criteria**:
- [ ] Meeting planning time <15 minutes
- [ ] Drag-and-drop role assignment working
- [ ] Auto-send meeting agendas 48h before meeting
- [ ] 95% attendance accuracy tracking
- [ ] Mobile-accessible for last-minute changes

**Business Value**: Solve operational pain point, reduce VP Education workload

---

### #005: Dashboard Live Data
**Status**: Backlogged
**Priority**: Medium
**Scope**:
- Connect Dashboard stats to real Supabase data (currently static placeholders)
- Next meeting date/time from database
- Active member count
- Recent activity feed
- Member's upcoming role assignments

**Acceptance Criteria**:
- [ ] Dashboard stats pull from live data
- [ ] Next meeting dynamically populated
- [ ] Member sees their own upcoming role assignment
- [ ] Mobile-friendly stat cards

**Business Value**: Dashboard is the daily-driver view — it needs real data to be useful

---

### #006: Meeting Role Assignment Notifications
**Status**: Backlogged
**Priority**: Medium
**Scope**:
- Email members when assigned a role
- Reminder 48h before meeting
- Role acceptance/decline flow
- Integration with Meeting Planning System (#003)

**Acceptance Criteria**:
- [ ] Email sent on role assignment
- [ ] 48h reminder sent automatically
- [ ] Member can accept or request swap
- [ ] Club admin notified of declines

**Business Value**: Reduces no-shows and last-minute scrambles for role coverage

---

## Completed Items

### #004: Digital Badges & Recognition
**Status**: Completed
**Completed**: 2026-04-11
**What was built**:
- Badge award engine (`src/lib/badge-engine.ts`) — pure utility, no React
- Badges trigger on: project completion, level completion, skill completion
- LMS badge admin in Learning Admin (`src/pages/LearningAdmin.tsx`)
- Badges display on member profiles
- Certificate generation (`src/lib/certificate.tsx`)

---

### Auth System
**Status**: Completed
**Completed**: ~2025-12 / 2026-04
**What was built**:
- Login page with real Supabase auth
- Password reset flow
- Protected routes
- RLS recursion fix (eliminated PKCE lock races)

---

### PWA with Offline Support
**Status**: Completed
**Completed**: 2025-12-17
**What was built**:
- Service worker with China-safe caching (no Google CDN)
- User-controlled update prompts
- Offline indicator banner
- Branded offline fallback page
- Lighthouse CI configured
- PWA icons (192x192, 512x512, 180x180 Apple touch)

---

### Member Management
**Status**: Completed
**Completed**: ~2025-12
**What was built**:
- Member directory with search
- Member profile pages
- Member cards
- Privacy settings per member

---

### Evaluation Templates
**Status**: Completed
**Completed**: ~2025-12
**What was built**:
- Template editor for speech evaluations
- Rating fields
- Template list and selection

---

### LMS — Learning Management System
**Status**: Completed
**Completed**: 2026-04-11
**What was built**:
- Custom LMS (Plan 2 — fully custom, no third-party)
- Skills, levels, and projects hierarchy
- Skill editor (`src/components/lms/SkillEditor.tsx`)
- Level content editor with JSONB storage
- Learning dashboard for members
- Learning admin for club admins
- Learning analytics dashboard
- Badge engine integrated with LMS completions
- Project view for tracking speech/project progress
- `useLearning` hook for data access

---

### CMS — Content Management System
**Status**: Completed
**Completed**: 2026-04-11
**What was built**:
- BlockNote-based rich text page editor
- Video embeds with drag-to-resize handles
- Image upload and management
- Save toast notifications
- Pages list for admin management
- Public page view for members
- CMS schema definitions

---

### Ecosystem Partner Directory
**Status**: Completed
**Completed**: ~2025-12
**What was built**:
- Directory of ecosystem partners
- Partner cards and listings

---

## Archived Items

*None yet*

---

## Template for New Items

```markdown
### #XXX: [Feature Name]
**Status**: Backlogged
**Priority**: High/Medium/Low
**Scope**:
- [Key functionality 1]
- [Key functionality 2]
- [Key functionality 3]

**Acceptance Criteria**:
- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]
- [ ] [Measurable outcome 3]

**Business Value**: [Why this matters for founder acquisition/retention/charter goals]
```

---

**Key Principle**: System tracks tasks, not CEO's memory. CTO owns all maintenance and planning.
