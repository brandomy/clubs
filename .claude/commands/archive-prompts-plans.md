---
description: Review handoffs, plans, and prompts for completion status and archive or triage them
allowed-tools: Read, Bash, Glob, Grep, Write, Edit, TodoWrite
---

# Archive Prompts & Plans

Review all files in `docs/handoffs/`, `docs/plans/`, and `docs/prompts/` to determine execution status, then either archive completed items or triage incomplete ones.

## Archive Structure

Completed items go into `docs/archive/` with subdirectories by type:
- `docs/archive/handoffs/` — completed handoff prompts
- `docs/archive/plans/` — completed implementation plans
- `docs/archive/prompts/` — completed or superseded prompts

Create subdirectories as needed (they may not exist yet).

---

## STEP 1: Inventory All Files

Read every file in these three directories (skip `README.md` files):
- `docs/handoffs/`
- `docs/plans/`
- `docs/prompts/`

For each file, record:
1. Filename and path
2. Creation/modified date (from filename or frontmatter)
3. Status field if present
4. Presence of completion signals (see Step 2)

---

## STEP 2: Determine Execution Status

Classify each file into one of four categories:

### COMPLETE — Archive it
File qualifies as complete if ANY of these are true:
- Has `Status: Complete`, `Status: Done`, `Status: Executed`, `Status: RESOLVED`, `Status: Completed`, or `Status: Archived` in frontmatter or body
- All checklist items are checked (`[x]` with no unchecked `[ ]`)
- Handoff: Has a corresponding dev-journal entry dated after the handoff file (check `docs/dev-journal/` for matching date or topic)
- Plan: Referenced work appears in git log (`git log --oneline --since=<file-date>` shows relevant commits)

### PARTIAL — Partially executed
- Has some `[x]` items and some `[ ]` items
- Status shows `In Progress` or `Partial`
- Handoff references multiple phases and only some appear resolved

### UNEXECUTED — Not started
- No completion signals
- Status is `Draft`, `Planning`, `Pending`, or absent
- No related git commits or journal entries found
- No checklist items checked

### STALE — Old and uncompleted
- File date is more than 90 days before today's date (2026-04-11)
- AND status is not Complete/Done
- These may be abandoned or superseded

---

## STEP 3: Cross-Reference with Git and Dev Journal

For each file in UNEXECUTED or PARTIAL:

1. Check git log for commits that match the file's topic:
```bash
git log --oneline --since="YYYY-MM-DD" --all | grep -i "<topic-keyword>"
```

2. Check dev-journal for entries with matching dates or topics:
```bash
ls docs/dev-journal/ | grep "<date-prefix>"
```

Use this evidence to upgrade or confirm status.

---

## STEP 4: Archive COMPLETE Files

For each COMPLETE file:

1. Ensure target directory exists (create if needed):
   - `docs/archive/handoffs/` for files from `docs/handoffs/`
   - `docs/archive/plans/` for files from `docs/plans/`
   - `docs/archive/prompts/` for files from `docs/prompts/`

2. Move the file using `mv`:
```bash
mv docs/handoffs/<filename>.md docs/archive/handoffs/<filename>.md
```

3. Report each moved file to the user.

---

## STEP 5: Triage Report

After archiving complete files, produce a structured triage report for everything else.

### Report Format

```
## Archive & Triage Report — 2026-04-11

### ✅ Archived (N files)
- docs/archive/handoffs/filename.md — reason for completion determination
- ...

### 🔄 Partial — Needs continuation (N files)
| File | Created | What's Done | What's Missing | Recommendation |
|------|---------|-------------|----------------|----------------|
| ... | ... | ... | ... | ... |

### 📋 Unexecuted — Never started (N files)
| File | Created | Topic | Recommendation |
|------|---------|-------|----------------|
| ... | ... | ... | ... |

### ⚠️ Stale — Old and uncompleted (N files)
| File | Created | Age | Status | Recommendation |
|------|---------|-----|--------|----------------|
| ... | ... | ... | ... | Archive? Delete? Continue? |

### 🎯 Recommended Actions
1. [Most important action]
2. [Second action]
3. ...
```

### Recommendations should be specific:
- "Continue Phase 2 of X plan — Phase 1 appears done per commit abc1234"
- "Delete — superseded by newer plan Y"
- "Archive — all work complete per dev-journal 2025-12-18"
- "Defer — valid but no urgency, move to BACKLOG.md"

---

## STEP 6: Offer Next Actions

After presenting the report, ask:

> Which of these would you like to act on? I can:
> - Move specific partial/unexecuted files to `BACKLOG.md`
> - Delete stale files you've confirmed as abandoned  
> - Update status fields in files you want to keep active
> - Move any additional files to archive manually

Wait for the user's response before taking further action.
