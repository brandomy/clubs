# Pitchmasters LMS Implementation Plan

**Created**: 2026-04-11
**Status**: Draft
**App**: apps/pitchmasters
**Depends on**: Plan 1 — pitchmasters-blocknote-cms.md (BlockNote must be installed first)

## Overview

Build a full custom Learning Management System (LMS) directly inside Pitchmasters, replacing the need for Toastmasters' Pathways/Base Camp. All content is authored in-browser using BlockNote, progress is tracked in Supabase, and everything integrates natively with existing meeting and member data. The system is designed specifically for startup founders — pitch-focused, mobile-first, offline-capable, and frictionless.

## Design Principles (Addressing Every Pathways Pain Point)

| Pathways Failure | Our Design Response |
|---|---|
| Confusing navigation requiring tutorials | LMS lives in the same app — no separate login, no new platform to learn |
| Not mobile-friendly | Mobile-first React, 44px touch targets, same responsive stack |
| Platform outages reset progress | PWA offline sync, all progress in Supabase with optimistic updates |
| Non-fillable PDF evaluation forms | Native React evaluation forms, auto-saved, submitted from mobile |
| Generic content irrelevant to founders | Curriculum authored by club officers, 100% pitch/founder focused |
| Disconnected from club meetings | Speeches link directly to learning projects — zero double entry |
| Hidden completion requirements | Transparent progress bars, explicit checklists per project |
| Badges buried in a separate system | Badges on public member profiles, shareable, LinkedIn-compatible |
| No club-wide analytics | Officer dashboard with path enrollment, completion rates, stall alerts |
| China unreliable | Cloudflare Pages + PWA service worker + self-hosted assets |
| Members quit rather than use it | Zero friction — it's already in the app they use for meetings |

---

## Data Model

### New Tables

#### `learning_paths`
A complete curriculum (e.g., "Pitchmasters Fundamentals", "Investor Pitch Mastery").

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| club_id | uuid FK → clubs.id | Multi-tenant isolation |
| title | text | |
| description | text | |
| slug | text | Unique per club |
| published | boolean | Default false |
| cover_image_url | text | Optional |
| created_by | uuid FK → users.id | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `learning_levels`
A level within a path (e.g., "Level 1: Foundations", "Level 2: Investor Pitch").

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| path_id | uuid FK → learning_paths.id CASCADE | |
| club_id | uuid FK → clubs.id | Denormalized for RLS |
| title | text | |
| description | text | |
| order_index | integer | For ordering |
| required_projects | integer | How many projects to complete the level |

#### `learning_projects`
A single project/assignment within a level (equivalent to a Pathways project).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| level_id | uuid FK → learning_levels.id CASCADE | |
| path_id | uuid FK → learning_paths.id | Denormalized |
| club_id | uuid FK → clubs.id | Denormalized for RLS |
| title | text | |
| description | text | Short summary shown in listings |
| content | jsonb | Full BlockNote document (instructions, objectives, resources) |
| project_type | text | 'speech' \| 'assignment' \| 'evaluation_exercise' \| 'elective' |
| evaluation_template_id | uuid FK → evaluation_templates.id | Which form evaluators use |
| order_index | integer | |
| is_elective | boolean | Default false |
| time_estimate_minutes | integer | Optional — shown to members |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `evaluation_templates`
Reusable evaluation form schemas (e.g., "Standard Speech Evaluation", "Pitch Deck Review").

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| club_id | uuid FK → clubs.id | |
| name | text | |
| description | text | |
| fields | jsonb | Array of field definitions (see schema below) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Field schema** (stored in `fields` JSONB array):
```json
[
  {
    "id": "clarity",
    "type": "rating",
    "label": "Clarity of Message",
    "max": 5,
    "required": true
  },
  {
    "id": "opening",
    "type": "textarea",
    "label": "Opening — What worked?",
    "required": true
  },
  {
    "id": "improve",
    "type": "textarea",
    "label": "One thing to improve",
    "required": true
  }
]
```

Supported field types: `rating` (1-5 stars), `textarea`, `text`, `checkbox`, `select`

#### `member_path_enrollments`
Which path each member is enrolled in.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK → users.id | |
| path_id | uuid FK → learning_paths.id | |
| club_id | uuid FK → clubs.id | |
| current_level_id | uuid FK → learning_levels.id | Updated on level completion |
| enrolled_at | timestamptz | |
| completed_at | timestamptz | Null until path complete |
| UNIQUE | (user_id, path_id) | One enrollment per path |

#### `member_project_completions`
Records each project a member has completed.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK → users.id | |
| project_id | uuid FK → learning_projects.id | |
| path_id | uuid FK → learning_paths.id | Denormalized |
| club_id | uuid FK → clubs.id | |
| speech_id | uuid FK → speeches.id | Optional — links to meeting speech record |
| status | text | 'pending_evaluation' \| 'completed' \| 'approved_by_officer' |
| evaluation_data | jsonb | Evaluator's form submission |
| evaluator_id | uuid FK → users.id | Who evaluated |
| completed_at | timestamptz | |
| approved_at | timestamptz | |
| notes | text | Officer notes |

#### `learning_badges`
Badge definitions — what triggers a badge and what it looks like.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| club_id | uuid FK → clubs.id | |
| name | text | e.g., "Ice Breaker", "Level 1 Complete" |
| description | text | |
| image_url | text | SVG or PNG stored in Supabase Storage |
| trigger_type | text | 'project_complete' \| 'level_complete' \| 'path_complete' |
| trigger_ref_id | uuid | FK to project_id, level_id, or path_id |
| created_at | timestamptz | |

#### `member_badges`
Badges earned by members.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK → users.id | |
| badge_id | uuid FK → learning_badges.id | |
| club_id | uuid FK → clubs.id | |
| earned_at | timestamptz | |
| speech_id | uuid FK → speeches.id | Optional — the speech that triggered it |

---

### RLS Policies

All new tables follow the same multi-tenant pattern as the existing schema:

```sql
-- Published paths readable by anyone (public visitors can see curriculum)
CREATE POLICY "learning_paths_read_published"
  ON learning_paths FOR SELECT USING (published = true);

-- All club members can read all paths in their club
CREATE POLICY "learning_paths_read_own_club"
  ON learning_paths FOR SELECT
  USING (club_id = get_current_user_club_id());

-- Officers/admins can create and edit paths
CREATE POLICY "learning_paths_write"
  ON learning_paths FOR ALL
  USING (
    club_id = get_current_user_club_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('officer', 'admin')
    )
  );

-- Members can read their own enrollments and completions
-- Officers can read all enrollments/completions for their club
-- (Similar pattern applied to all member_* tables)
```

---

## Architecture

```
Member (phone)              Officer (desktop/tablet)
      │                            │
 /learn                     /learn/admin
      │                            │
 LearningDashboard.tsx      PathEditor.tsx (BlockNote)
 ProjectView.tsx             EvaluationTemplateEditor.tsx
 EvaluationForm.tsx          LearningAnalytics.tsx
      │                            │
      └──────────┬─────────────────┘
                 │
          Supabase RLS
                 │
     ┌──── learning_paths ────┐
     │   learning_levels      │
     │   learning_projects    │
     │   evaluation_templates │
     │   member_enrollments   │
     │   member_completions   │
     │   learning_badges      │
     │   member_badges        │
     └────────────────────────┘
                 │
     meetings / speeches tables
     (existing — linked via speech_id FK)
```

---

## Implementation Steps

### Step 1: Database

Create all 8 new tables with:
- RLS policies on every table
- Indexes on `club_id`, `path_id`, `user_id` columns
- `updated_at` triggers
- Cascading deletes where appropriate

**SQL script**: `docs/database/sql-scripts/NNN-lms-schema.sql`

All scripts follow the patterns in `docs/database/database-protocol.md`.

### Step 2: TypeScript Types

Add to `src/types/index.ts`:
- `LearningPath`, `LearningLevel`, `LearningProject`
- `EvaluationTemplate`, `EvaluationField`, `EvaluationSubmission`
- `MemberPathEnrollment`, `MemberProjectCompletion`
- `LearningBadge`, `MemberBadge`
- `ProjectType`, `CompletionStatus` (string literal union types)

Add all 8 tables to the Supabase database types in `src/lib/supabase.ts`.

### Step 3: Data Hooks

Create `src/hooks/useLearning.ts` — primary data hook covering:

**For members:**
- `getMyEnrollment(pathId)` — current enrollment + progress
- `getMyCompletions(pathId)` — completed projects
- `getMyBadges()` — earned badges
- `enrollInPath(pathId)` — join a path
- `submitProjectCompletion(projectId, speechId?)` — mark done
- `submitEvaluation(completionId, formData)` — evaluator submits form

**For officers/admins:**
- `listPaths()` — all paths for the club
- `savePath(path)` — create/update a path
- `saveLevel(level)` — create/update a level
- `saveProject(project)` — create/update a project
- `getPendingApprovals()` — completions awaiting officer sign-off
- `approveCompletion(completionId)` — officer marks approved
- `getClubAnalytics()` — enrollment rates, completion rates per path/level
- `saveEvaluationTemplate(template)` — create/update eval form

### Step 4: Evaluation Form Engine

Create `src/components/lms/EvaluationForm.tsx` — a dynamic form renderer that reads a template's `fields` JSONB and renders the appropriate inputs.

**Field type components:**
- `RatingField.tsx` — 1-5 star selector with Toastmasters colors
- `TextareaField.tsx` — Auto-growing textarea with character count
- `TextField.tsx` — Single line
- `CheckboxField.tsx` — Yes/no criteria
- `SelectField.tsx` — Dropdown

**Behavior:**
- Form auto-saves to `localStorage` as the evaluator types (offline-safe)
- Submit button disabled until all required fields filled
- Confirmation on submit — no ambiguity about whether it went through
- Read-only mode for viewing submitted evaluations

### Step 5: Evaluation Template Builder

Create `src/components/lms/EvaluationTemplateEditor.tsx` — officer-facing drag-and-drop form builder.

```
┌─────────────────────────────────────────┐
│  Template: "Standard Pitch Evaluation"  │
│                                         │
│  ┌─── Rating ───────────────────────┐   │
│  │  Clarity of Core Message  ★★★★★  │   │
│  └──────────────────────────────────┘   │
│  ┌─── Textarea ─────────────────────┐   │
│  │  Opening — What worked?          │   │
│  └──────────────────────────────────┘   │
│                                         │
│  [+ Add Field ▼]   [Save Template]      │
└─────────────────────────────────────────┘
```

Uses DnD Kit (already installed) for field reordering.

### Step 6: Learning Path Authoring (Officer View)

Create `src/components/lms/PathEditor.tsx` — officer/admin interface for building a learning path.

**Three-panel layout (collapses to stacked on mobile):**
```
[Path Settings] → [Level Manager] → [Project Editor]
```

**Path Settings panel:**
- Title, description, slug, cover image, published toggle

**Level Manager panel:**
- List of levels with drag-to-reorder (DnD Kit)
- Add/remove levels
- Click a level to open its project list

**Project Editor panel:**
- BlockNote editor for project content (inherits BlockNote from Plan 1)
- Project type selector (speech / assignment / evaluation exercise / elective)
- Evaluation template selector (dropdown of saved templates)
- Time estimate field
- Save / publish controls

### Step 7: Member Learning Dashboard

Create `src/pages/LearningDashboard.tsx` — the member's learning home.

```
┌─────────────────────────────────────────┐
│  Your Learning Path                     │
│  Investor Pitch Mastery                 │
│                                         │
│  Level 1: Foundations  ████████░░  80%  │
│  Level 2: Pitch Craft  ░░░░░░░░░░   0%  │
│                                         │
│  ┌── Ice Breaker ──────────── ✅ ──────┐ │
│  ┌── Core Message ─────────── ✅ ──────┐ │
│  ┌── Problem/Solution ─────── 🔵 Next ─┐ │
│  ┌── Storytelling ─────────── ○ ───────┐ │
│                                         │
│  🏅 2 badges earned                     │
└─────────────────────────────────────────┘
```

**Key behaviors:**
- If not enrolled: path selection screen
- Progress is always accurate — derived from `member_project_completions`
- "Next" project is highlighted — no hunting
- Tapping a project opens `ProjectView`

### Step 8: Project View

Create `src/pages/ProjectView.tsx` — the member's view of a single project.

```
┌─────────────────────────────────────────┐
│  ← Back to Level 1                      │
│                                         │
│  Problem/Solution Speech                │
│  ⏱ ~5 min read  🎤 Speech project       │
│                                         │
│  [BlockNote read-only content renders]  │
│  - Objectives                           │
│  - Instructions                         │
│  - Resources                            │
│                                         │
│  ─────────────────────────────────────  │
│  Mark as Complete                       │
│  Link to a speech from a meeting:       │
│  [Select meeting speech ▼]  (optional)  │
│                                         │
│  [Submit for Completion]                │
└─────────────────────────────────────────┘
```

**"Link to meeting speech" selector:**
- Dropdown populated from the member's speech records in the `speeches` table
- Closes the loop between meetings and learning — one tap, no double entry

### Step 9: Officer Analytics Dashboard

Create `src/components/lms/LearningAnalytics.tsx` — officer-facing view.

**Sections:**

**Enrollment Overview:**
- Total members enrolled per path
- Completion rate per level (% of enrolled who completed)
- Stall alerts: members who haven't progressed in 30+ days

**Individual Member Progress:**
- Table: member name | current path | current level | last activity | badges
- Filter by path or status (on track / stalled / completed)

**Pending Approvals:**
- List of `member_project_completions` with status `pending_evaluation`
- Officer can view the submission and tap "Approve" or add notes

### Step 10: Badge Award Engine

Create `src/lib/badge-engine.ts` — a utility function called after any project completion or level approval.

**Logic:**
```
On project completion:
  → Check learning_badges for trigger_type='project_complete' and trigger_ref_id=project_id
  → If found and not already earned, insert into member_badges

On level completion (all required projects done):
  → Check for 'level_complete' badges
  → Update member_path_enrollments.current_level_id

On path completion:
  → Check for 'path_complete' badges
  → Set member_path_enrollments.completed_at
  → Trigger certificate generation
```

**Certificate generation:**
- Uses `@react-pdf/renderer` (add as dependency)
- Generates a branded PDF: member name, path completed, date, club name
- Stored in Supabase Storage, URL saved to `member_path_enrollments`
- Downloadable from the member's profile and LearningDashboard

### Step 11: Routes & Navigation

Add to `src/App.tsx`:
```typescript
// Member-facing
<Route path="/learn" element={<LearningDashboard />} />
<Route path="/learn/:pathSlug" element={<LearningDashboard />} />
<Route path="/learn/:pathSlug/project/:projectId" element={<ProjectView />} />

// Officer/admin
<Route path="/learn/admin" element={<LearningAdmin />} />
<Route path="/learn/admin/paths/new" element={<PathEditor />} />
<Route path="/learn/admin/paths/:pathId" element={<PathEditor />} />
<Route path="/learn/admin/templates" element={<EvaluationTemplates />} />
<Route path="/learn/admin/analytics" element={<LearningAnalytics />} />
```

Add "Learn" to Layout navigation (visible to all authenticated members).

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `docs/database/sql-scripts/NNN-lms-schema.sql` | Create | All 8 tables, indexes, RLS, triggers |
| `src/types/index.ts` | Edit | All LMS type definitions |
| `src/lib/supabase.ts` | Edit | Add all 8 tables to DB types |
| `src/lib/badge-engine.ts` | Create | Badge/certificate award logic |
| `src/hooks/useLearning.ts` | Create | All LMS data operations |
| `src/components/lms/EvaluationForm.tsx` | Create | Dynamic form renderer |
| `src/components/lms/RatingField.tsx` | Create | Star rating input |
| `src/components/lms/EvaluationTemplateEditor.tsx` | Create | Drag-and-drop form builder |
| `src/components/lms/PathEditor.tsx` | Create | Three-panel path authoring UI |
| `src/components/lms/LearningAnalytics.tsx` | Create | Officer analytics dashboard |
| `src/pages/LearningDashboard.tsx` | Create | Member learning home |
| `src/pages/ProjectView.tsx` | Create | Single project view + completion |
| `src/pages/LearningAdmin.tsx` | Create | Admin hub route wrapper |
| `src/pages/EvaluationTemplates.tsx` | Create | Template management page |
| `src/App.tsx` | Edit | Add all LMS routes |
| `src/components/Layout.tsx` | Edit | Add "Learn" nav link |
| `package.json` | Edit | Add @react-pdf/renderer |

---

## Permissions Matrix

| Action | Public | Member | Officer | Admin |
|--------|--------|--------|---------|-------|
| View published paths | ✅ | ✅ | ✅ | ✅ |
| View project content | ❌ | ✅ | ✅ | ✅ |
| Enroll in a path | ❌ | ✅ | ✅ | ✅ |
| Submit project completion | ❌ | ✅ | ✅ | ✅ |
| Submit evaluation | ❌ | ✅ (own club) | ✅ | ✅ |
| View own progress | ❌ | ✅ | ✅ | ✅ |
| View all members' progress | ❌ | ❌ | ✅ | ✅ |
| Approve completions | ❌ | ❌ | ✅ | ✅ |
| Create/edit paths | ❌ | ❌ | ✅ | ✅ |
| Create evaluation templates | ❌ | ❌ | ✅ | ✅ |
| Award/revoke badges | ❌ | ❌ | ❌ | ✅ |
| Delete paths | ❌ | ❌ | ❌ | ✅ |

---

## Dependencies Added

| Package | Purpose |
|---------|---------|
| `@react-pdf/renderer` | Certificate PDF generation |

BlockNote is already installed in Plan 1 — reused here for project content authoring.
DnD Kit is already installed — reused for level/project reordering and form builder.

---

## Implementation Order

1. Database + types (Steps 1-2)
2. Data hook skeleton (Step 3)
3. Evaluation form engine (Step 4)
4. Evaluation template builder (Step 5)
5. Path authoring — officers can create curriculum (Step 6)
6. Member dashboard (Step 7)
7. Project view + completion flow (Step 8)
8. Officer analytics (Step 9)
9. Badge engine + certificates (Step 10)
10. Routes + navigation (Step 11)
11. End-to-end test: create path → enroll member → complete project → receive badge

## Estimated Scope

- **New files**: 14
- **Modified files**: 4
- **New dependency packages**: 1 (`@react-pdf/renderer`)
- **Database changes**: 8 new tables, ~16 RLS policies, ~12 indexes
