# Session Handoff Prompt: Global Rotary Platform Transformation
**Date:** 2025-12-02
**Session Type:** Strategic Planning → Implementation
**Next Session Focus:** Brand Compliance & Database Schema

---

## Context Summary

Georgetown Rotary Speaker Management is transforming into **Rotary Club Manager** - a free, open-source, mobile-first club management platform for Rotary clubs worldwide (HuaQiao Foundation service by Chairman PSR Frank Yih).

**Key Strategic Decisions (CEO Approved):**
- Template repository model (each club self-hosts Supabase + Cloudflare Pages)
- Single-club focus for v1.0 (no cross-club sharing initially)
- Free & open-source (fully transparent)
- Discord community support
- Automated update scripts
- Expand from speakers → full club management (members, meetings, attendance, events, projects)

---

## Critical Brand Compliance Issue Discovered

**Problem:** Georgetown is using **unofficial Azure blue #005daa** in 100+ files
**Official Rotary Color:** **Azure #0067c8** (PMS 2175C)

**Files Affected:**
- `tailwind.config.js:12` - Primary color definition: `blue: '#005daa'`
- `src/index.css:88-145` - Focus states, scrollbars, form inputs
- `claude.md` - Project documentation
- `docs/governance/rotary-brand-guide.md` - Brand guidelines
- 100+ component files using `text-rotary-blue`, `bg-rotary-blue`, `border-rotary-blue`

**Required Action:** Global search/replace #005daa → #0067c8

**RGB Value Changes:**
- Old: `rgba(0, 93, 170, ...)`
- New: `rgba(0, 103, 200, ...)`

---

## Completed Work This Session

1. ✅ **Official Rotary Color Palette Created**
   - File: [public/brand/rotary-colors.json](public/brand/rotary-colors.json)
   - Complete palette with PMS, CMYK, HEX, RGB values
   - Color-blind accessibility analysis included
   - CSS custom property recommendations

2. ✅ **Comprehensive Transformation Plan**
   - File: [docs/plans/2025-12-02-global-rotary-platform-transformation.md](docs/plans/2025-12-02-global-rotary-platform-transformation.md)
   - 6-week roadmap (6 phases)
   - Technical architecture for attendance/RSVP system
   - Authentication & access control design
   - Deployment automation strategy
   - Risk mitigation & success criteria

3. ✅ **Handoff Prompt Workflow Established**
   - This file! Future sessions create dated handoff prompts in `docs/prompts/`
   - Periodic cleanup to archive old prompts

---

## Immediate Next Steps (Priority Order)

### 1. Fix Brand Color Compliance (URGENT)
**Files to update:**
```bash
# Primary configuration files
- tailwind.config.js (line 12: blue: '#005daa' → '#0067c8')
- src/index.css (lines 88, 93, 112, 113, 140, 145)
- claude.md (Azure color reference)
- docs/governance/rotary-brand-guide.md (lines 39, 79, 82)

# Fix rotary-colors.json Azure value
- public/brand/rotary-colors.json (line 6: hex should be #0067c8, not #0050a2)
```

**Search/replace strategy:**
```bash
# Find all occurrences
rg "#005daa" --files-with-matches

# Automated replacement (verify first!)
rg "#005daa" -l | xargs sed -i '' 's/#005daa/#0067c8/g'

# Also fix RGB values
rg "rgba\(0, 93, 170" -l | xargs sed -i '' 's/rgba(0, 93, 170/rgba(0, 103, 200/g'
rg "rgb\(0, 93, 170" -l | xargs sed -i '' 's/rgb(0, 93, 170/rgb(0, 103, 200/g'
```

**Testing checklist:**
- [ ] Visual regression test all pages
- [ ] Check accessibility (contrast ratios still WCAG 2.1 AA)
- [ ] Mobile responsiveness maintained
- [ ] No broken Tailwind classes

**Deliverable:** Dev journal documenting the brand compliance fix

---

### 2. Correct rotary-colors.json Azure Value

**Issue:** I initially wrote Azure as #0050a2 in rotary-colors.json, but official Rotary PDF shows **#0067c8**

**Fix:**
```json
// public/brand/rotary-colors.json
"azure": {
  "name": "Azure",
  "pantone": "PMS 2175C",
  "cmyk": "C100 M56 Y0 K0",
  "hex": "#0067c8",        // FIX THIS (currently wrong: #0050a2)
  "rgb": "0, 103, 200",    // FIX THIS (currently wrong: 0, 93, 170)
  "usage": "One-color Masterbrand Signature and Mark of Excellence",
  "colorBlindSafe": true
}
```

---

### 3. Database Schema: Attendance/RSVP System

**Create migration file:** `docs/database/054-meeting-attendance-rsvp-system.sql`

**Tables to create:**
1. `meeting_rsvps` - Member commitments to attend meetings
2. `attendance_records` - Actual attendance (members, visitors, guests)
3. `member_attendance_stats` - Cached statistics for performance

**Key features:**
- Track RSVPs (attending/not_attending/maybe/no_response)
- Guest count tracking (for meal planning)
- Visiting Rotarians (name, club, district)
- Non-Rotarian guests (prospective members)
- Attendance percentages (quarterly, YTD)
- Makeup credits

**See detailed schema in transformation plan** (lines 267-358)

---

### 4. Authentication Setup (Phase 2)

**After brand compliance is fixed, implement:**
- Supabase Auth (email/password)
- `user_roles` table (admin, officer, chair, member, readonly)
- `role_permissions` table (granular CRUD permissions)
- RLS policies for all tables
- Auth components (SignInModal, SignUpModal, PasswordResetModal)

**Critical for attendance feature:** Must know who is logged in to track RSVPs

---

## Technical Context for Next Session

### Current Tech Stack
- **Frontend:** React 19.1.1 + TypeScript + Vite 7.1.6
- **Database:** Supabase (PostgreSQL) - Singapore region
- **Styling:** Tailwind CSS 3.4.17 + Custom CSS
- **Fonts:** Self-hosted Open Sans (China-friendly)
- **State:** React hooks + Supabase realtime subscriptions
- **Routing:** React Router DOM 7.9.2

### Current Database Schema (53 migrations)
- `speakers` - Speaker pipeline (kanban board)
- `members` - Club membership directory
- `events` - Calendar events (meetings, socials, fundraisers)
- `service_projects` - Rotary service projects
- `partners` - Club partners/sponsors
- `rotary_years` - Historical timeline with themes/presidents
- `photos` - Photo gallery for events/projects

**Missing (to be added):**
- `meeting_rsvps`
- `attendance_records`
- `member_attendance_stats`
- `user_roles`
- `role_permissions`
- `system_version` (for update tracking)
- `migration_history`

### Git Status
```
Current branch: main
Modified files:
- .claude/settings.local.json
- claude.md
- src/components/MemberModal.tsx
- src/types/database.ts

Untracked files:
- docs/database/053-add-rotary-join-date-field.sql
- temp/version-tracking-technical-brief.md
- docs/plans/2025-12-02-global-rotary-platform-transformation.md (created this session)
- public/brand/rotary-colors.json (created this session)
- docs/prompts/2025-12-02-global-platform-handoff.md (this file)
```

---

## Questions for Next Session CTO

### Design Decisions Needed
1. **Primary Blue Choice:**
   - Azure #0067c8 (brighter, modern) ← CEO approved this
   - Royal Blue #17458f (darker, traditional)
   - **Decision:** Use Azure #0067c8 as primary

2. **App Rename:**
   - Rotary Club Manager (CEO's preference)
   - ClubConnect
   - Rotary Hub
   - RotaryFlow
   - **Decision:** Pending CEO final approval

3. **RSVP UI Pattern:**
   - Quick toggle button (Attending/Not Attending)
   - Modal with detailed form (guest count, dietary notes)
   - Both (quick toggle with optional details link)
   - **Recommendation:** Both - quick toggle with "Add details" link

4. **Attendance Check-In:**
   - Manual check-in (click each member)
   - Bulk check-in (mark all RSVP'd as attended, then adjust)
   - QR code scanning (future feature)
   - **Recommendation:** Bulk check-in (faster for officers)

### CEO Feedback Required
- Final app name approval
- Discord server setup (who manages?)
- Early adopter clubs to target (Georgetown + who else?)
- HuaQiao Foundation branding placement (footer? about page?)

---

## Reference Documents Created This Session

1. **Official Rotary Colors:** [public/brand/rotary-colors.json](public/brand/rotary-colors.json)
2. **Transformation Plan:** [docs/plans/2025-12-02-global-rotary-platform-transformation.md](docs/plans/2025-12-02-global-rotary-platform-transformation.md)
3. **This Handoff Prompt:** [docs/prompts/2025-12-02-global-platform-handoff.md](docs/prompts/2025-12-02-global-platform-handoff.md)

---

## Success Criteria for Next Session

**Minimum Deliverables:**
- ✅ All brand colors corrected (#005daa → #0067c8)
- ✅ rotary-colors.json Azure value fixed
- ✅ Visual regression testing passed
- ✅ Dev journal entry created

**Stretch Goals:**
- Database migration 054 created (attendance schema)
- Tailwind config updated with full Rotary palette
- App rename strategy executed

---

## Commands to Run on Session Start

```bash
# Check current color usage
rg "#005daa" --files-with-matches | wc -l  # Should show ~100 files

# Verify git status
git status

# Check for TypeScript errors
npx tsc --noEmit

# Start dev server (if testing changes)
npm run dev
```

---

## Notes for Future CTO Sessions

**Workflow established today:**
1. After conversation compaction, create dated handoff prompt in `docs/prompts/`
2. Include: context summary, completed work, next steps, open questions
3. Periodic cleanup: Archive handoff prompts older than 30 days to `docs/archive/prompts/`

**File naming convention:** `YYYY-MM-DD-brief-description-handoff.md`

**Purpose:** Enable seamless context transfer between sessions, prevent re-discussion of resolved issues, maintain continuity on long-term projects

---

**End of Handoff Prompt**
**Next Session CTO:** Review this document first, then execute brand compliance fixes
**Estimated Time:** 2-3 hours for complete brand color correction + testing
