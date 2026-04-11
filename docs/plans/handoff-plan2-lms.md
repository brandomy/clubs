# Handoff Prompt — Plan 2: Learning Management System

> Copy everything below this line and paste it as your opening message to Claude Code.

---

You are the CTO for the Pitchmasters app — a Toastmasters club management application in the `clubs` monorepo at `apps/pitchmasters/`.

## Before you start

Read these files in order:
1. `/Users/randaleastman/dev/clubs/CLAUDE.md` — monorepo context
2. `/Users/randaleastman/dev/clubs/apps/pitchmasters/CLAUDE.md` — app context, constraints, tech stack, workflow rules
3. `/Users/randaleastman/dev/clubs/docs/plans/pitchmasters-blocknote-cms.md` — Plan 1 (already implemented — provides BlockNote, `public_pages` table, and `usePublicPages` hook as patterns to follow)
4. `/Users/randaleastman/dev/clubs/docs/plans/pitchmasters-lms.md` — the full LMS implementation plan you are executing

Do not start implementation until you have confirmed you've read all four.

## Your task

Implement Plan 2 exactly as specified in `pitchmasters-lms.md`. This builds a complete custom Learning Management System inside the Pitchmasters app, replacing Toastmasters' Pathways/Base Camp for this club.

## Strategic context

This LMS was designed to fix every documented failure of Toastmasters Pathways:

- **Pathways problem**: Confusing separate platform requiring tutorials just to log in → **Our fix**: LMS lives inside the app members already use daily
- **Pathways problem**: Non-fillable PDF evaluation forms → **Our fix**: Native React evaluation forms with dynamic field engine
- **Pathways problem**: Disconnected from club meetings → **Our fix**: Speech completion records in `speeches` table link directly to `member_project_completions` via `speech_id` FK
- **Pathways problem**: Generic corporate content irrelevant to founders → **Our fix**: Officers author all curriculum in BlockNote, specific to startup/pitch context
- **Pathways problem**: Badges buried, hard to find → **Our fix**: Badges displayed on member profiles with shareable public URLs
- **Pathways problem**: No club analytics → **Our fix**: Officer analytics dashboard with enrollment rates, stall alerts, pending approvals

Keep this context in mind — every UX decision should reduce friction compared to Base Camp.

## Technical context

- BlockNote is already installed (from Plan 1) — reuse it for project content authoring in `PathEditor.tsx`
- DnD Kit is already installed — reuse it for drag-to-reorder levels/projects in the path editor and fields in the evaluation template builder
- The existing `get_current_user_club_id()` security definer function is in Supabase — use it in all RLS policies
- Auth is currently simulated with a demo admin user — use the `role` field (`'member' | 'officer' | 'admin'`) for all permission checks
- Existing tables: `clubs`, `users`, `meetings`, `speeches`, `meeting_roles`, `member_profiles` — the `speeches` table is the critical link for meeting integration
- Custom Tailwind colors: `tm-blue`, `tm-maroon`, `tm-gray`
- Icons: Lucide React

## Implementation order

Follow the order in the plan exactly:
1. Database + types first (Steps 1-2) — write the SQL migration file to `apps/pitchmasters/docs/database/sql-scripts/009-lms-schema.sql`, then run it yourself using `psql` with the `DIRECT_URL` from `apps/pitchmasters/.env.local`
2. Data hook skeleton (Step 3)
3. Evaluation form engine (Step 4) — test this in isolation before building the full path editor
4. Evaluation template builder (Step 5)
5. Path authoring UI (Step 6)
6. Member dashboard (Step 7)
7. Project view + completion flow (Step 8)
8. Officer analytics (Step 9)
9. Badge engine + certificates (Step 10)
10. Routes + navigation (Step 11)

**Do not skip ahead.** The evaluation form engine must work before the path editor, and the path editor must work before the member dashboard — each step depends on the previous.

## Critical implementation notes

### Database
- All 8 new tables need `club_id` for RLS isolation
- Use `CASCADE` on FK deletes from paths → levels → projects
- Denormalize `club_id` onto `learning_levels` and `learning_projects` — do not try to derive it through JOINs in RLS policies (causes recursion)
- Add indexes on every `club_id`, `user_id`, `path_id` column

### Evaluation form engine (`EvaluationForm.tsx`)
- Auto-save form state to `localStorage` as the user types — key: `eval_draft_${completionId}`
- Clear localStorage on successful submit
- Render read-only mode when `readOnly` prop is true (for viewing submitted evaluations)
- Never submit until all `required: true` fields are filled

### Meeting integration (Step 8)
- In `ProjectView.tsx`, the "Link to meeting speech" dropdown should query `supabase.from('speeches').select('*, meeting:meetings(title, date)').eq('user_id', currentUser.id)` ordered by most recent first
- This is the most important UX differentiator vs Pathways — make it prominent, not an afterthought

### Badge engine (`badge-engine.ts`)
- Call `awardBadgesForCompletion(userId, projectId, clubId)` after every `member_project_completions` insert
- Call `awardBadgesForLevelCompletion(userId, levelId, clubId)` when all required projects in a level are done
- Keep it a pure utility function — no React, no hooks — so it can be called from anywhere

### Certificate generation
- Use `@react-pdf/renderer` — add it with `pnpm add @react-pdf/renderer` from the `apps/pitchmasters` directory
- Generate the PDF in the browser (client-side), not server-side
- Store the result as a Blob URL for download — do not require Supabase Storage for MVP
- Supabase Storage integration for persistent certificate URLs is a future enhancement

## Constraints

- Do NOT build multi-club cross-enrollment in this phase — enrollment is always within a single club
- Do NOT build xAPI/SCORM integration — store progress natively in Supabase
- Do NOT add features beyond what is in the plan
- Do NOT create root-level docs — all new documentation goes in `docs/dev-journals/`
- Use `pnpm` not `npm`
- Run `pnpm typecheck` and `pnpm lint` before declaring complete

## Definition of done

- [ ] All 8 LMS tables exist in Supabase with correct RLS policies
- [ ] Officers can create a learning path with levels and projects using BlockNote for content
- [ ] Officers can build evaluation form templates with drag-and-drop fields
- [ ] Members can enroll in a path and see their progress dashboard
- [ ] Members can view project content and mark a project complete
- [ ] Members can optionally link a meeting speech to their project completion
- [ ] Evaluators can fill and submit evaluation forms from mobile
- [ ] Badges are automatically awarded on project/level/path completion
- [ ] PDF certificate is generated on path completion
- [ ] Officer analytics dashboard shows enrollment and completion data
- [ ] Officer pending approvals queue works
- [ ] "Learn" link appears in Layout navigation
- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm lint` passes with zero errors
- [ ] Dev journal entry created in `docs/dev-journals/`
