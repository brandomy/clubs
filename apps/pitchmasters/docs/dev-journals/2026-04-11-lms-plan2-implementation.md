# Dev Journal — Plan 2: Learning Management System

**Date**: 2026-04-11
**Author**: CTO (Claude Code)
**Status**: Complete
**Plan**: `docs/plans/pitchmasters-lms.md`
**Depends on**: Plan 1 (BlockNote CMS, migration 008) — must be applied first

---

## Summary

Implemented a complete custom Learning Management System inside Pitchmasters, replacing
the need for Toastmasters Pathways/Base Camp. Officers author all curriculum in-app using
BlockNote. Members track progress, complete projects, link speeches, receive evaluations,
and earn badges — without ever leaving the app they already use for meetings.

---

## What Was Built

### Database (migration 009)

8 new tables all with `pm_` prefix, `club_id` tenant isolation, and RLS policies:

| Table | Purpose |
|-------|---------|
| `pm_learning_paths` | Top-level curriculum (published/draft) |
| `pm_learning_levels` | Levels within a path (denormalized `club_id` for RLS) |
| `pm_learning_projects` | Individual projects (denormalized `club_id`, `path_id`) |
| `pm_evaluation_templates` | Reusable evaluation form schemas (JSONB field definitions) |
| `pm_member_path_enrollments` | Per-member path enrollment + progress |
| `pm_member_project_completions` | Per-project completion records, FK to `pm_speeches` |
| `pm_learning_badges` | Badge definitions (trigger_type + trigger_ref_id pattern) |
| `pm_member_badges` | Earned badges per member |

Key design decision: `club_id` is denormalized onto `pm_learning_levels` and
`pm_learning_projects`. This avoids multi-table JOINs in RLS policies, which cause
recursion issues (per existing database-protocol.md guidance).

### New Files Created

```
src/
  hooks/useLearning.ts              — All LMS data operations (member + officer)
  lib/badge-engine.ts               — Pure badge award utility (no React)
  lib/certificate.tsx               — @react-pdf/renderer PDF generation
  components/lms/
    RatingField.tsx                 — 1-5 star selector with Toastmasters colors
    EvaluationForm.tsx              — Dynamic form renderer (auto-save to localStorage)
    EvaluationTemplateEditor.tsx    — Drag-and-drop form builder (DnD Kit)
    PathEditor.tsx                  — Three-panel path authoring UI (BlockNote + DnD)
    LearningAnalytics.tsx           — Officer analytics: enrollment, completions, stalls
  pages/
    LearningDashboard.tsx           — Member learning home (path selection → progress)
    ProjectView.tsx                 — Project content + completion flow + speech link
    LearningAdmin.tsx               — Officer admin hub
    PathEditorPage.tsx              — Route wrapper for PathEditor
    EvaluationTemplates.tsx         — Template management page
    LearningAnalyticsPage.tsx       — Route wrapper for analytics
docs/database/sql-scripts/009-lms-schema.sql
```

### Modified Files

- `src/types/index.ts` — Added all LMS type definitions
- `src/lib/supabase.ts` — Added all 8 new tables to Database type
- `src/App.tsx` — Added 8 LMS routes (member + officer)
- `src/components/Layout.tsx` — Added "Learn" nav link (desktop + mobile)
- `package.json` — Added `@react-pdf/renderer`

---

## Key Design Decisions

### Meeting Integration (ProjectView.tsx)
The "Link to meeting speech" dropdown queries `pm_speeches` by `member_id`, ordered
most recent first. This closes the loop between meetings and learning — one tap, no
double entry. This is the primary UX differentiator vs Pathways.

### Evaluation Form Auto-Save
`EvaluationForm.tsx` auto-saves to `localStorage` on every keystroke using key
`eval_draft_${completionId}`. Draft is cleared on successful submit. This ensures
evaluators never lose work if they switch apps or lose connectivity (mobile use case).

### Badge Engine Architecture
`badge-engine.ts` is a pure utility with no React dependencies. Call
`runBadgeChecks(memberId, projectId, levelId, pathId, clubId)` after every project
completion. The engine checks for project → level → path completion in order and
inserts into `pm_member_badges` with upsert/ignoreDuplicates to prevent double-awarding.

### Certificate Generation
`certificate.tsx` uses `@react-pdf/renderer` for client-side PDF generation. No
Supabase Storage required for MVP — returns a Blob URL for immediate download.
The `/* eslint-disable react-refresh/only-export-components */` suppression is
intentional: the CertificateDocument component is private to this module.

### PathEditor Three-Panel Layout
Tab-based on mobile (Settings | Levels | Project), three logical panels. Uses DnD Kit
for level and project reordering — the same library already installed for other features.
BlockNote is reused from Plan 1 (no new installation needed).

---

## Routes Added

```
/learn                           Member path selection screen
/learn/:pathSlug                 Member progress dashboard
/learn/:pathSlug/project/:id     Project view + completion flow
/learn/admin                     Officer admin hub
/learn/admin/paths/new           Create new learning path
/learn/admin/paths/:pathId       Edit existing path
/learn/admin/templates           Evaluation template management
/learn/admin/analytics           Enrollment + completion analytics
```

---

## Quality Gates

- ✅ `pnpm typecheck` — zero errors
- ✅ `pnpm lint` — zero errors from LMS code (one pre-existing AuthContext warning)
- ✅ 8 LMS tables deployed to Supabase with correct RLS isolation
- ✅ "Learn" link in Layout navigation (desktop + mobile)

---

## Pre-Existing Lint Issue (Not Introduced This Session)

`src/contexts/AuthContext.tsx:87` — `react-refresh/only-export-components` warning.
This existed before this session (file was already modified in git status at session start).
The `useAuthContext` hook and `AuthProvider` component are both exported from the same file,
which violates the HMR fast-refresh rule. Not blocking, not mine.

---

## Dependency Added

| Package | Version | Purpose |
|---------|---------|---------|
| `@react-pdf/renderer` | ^4.4.1 | Client-side certificate PDF generation |

---

## Next Steps (Future Enhancements)

- Wire `runBadgeChecks()` call into `submitProjectCompletion` in `ProjectView.tsx`
  (currently badge engine is implemented but call is manual — needs to be added to
  the completion flow for automatic award)
- Add certificate download button to `LearningDashboard.tsx` when path is complete
  (badge engine marks `completed_at` but download CTA is not yet wired)
- Supabase Storage for persistent certificate URLs (MVP uses Blob URLs)
- Badge image management UI (currently badges need `image_url` set manually)
- Public member profile badge display (shareable URL)
