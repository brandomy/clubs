---
description: Manage the project backlog — add items, list by project/priority, run grooming sessions, archive done items
allowed-tools: Read, Edit, Bash, Write, TodoWrite
---

# Backlog Manager

Manage `BACKLOG.md` at the monorepo root. Supports four modes: **add**, **list**, **groom**, and **archive**.

## Usage

```
/backlog              → Interactive mode (asks what you want to do)
/backlog add          → Add a new item
/backlog list         → Show active backlog
/backlog groom        → Run a grooming session
/backlog archive      → Archive Done items
```

Parse `$ARGUMENTS` to detect the mode. If no arguments or unrecognized input, ask:

> What would you like to do with the backlog?
> 1. **Add** — Add a new item
> 2. **List** — View active items (filter by project or priority)
> 3. **Groom** — Run a grooming session (Monday review)
> 4. **Archive** — Move Done items to docs/archive/

---

## Always start by reading the backlog

Before any action, read `BACKLOG.md` to get the current state.

---

## MODE: ADD

### Step 1: Gather item details

Ask the user (or parse from arguments):

> What's the item? I need:
> 1. **Feature/title** (max 60 chars)
> 2. **Project**: Georgetown | Pitchmasters | Monorepo | Shared
> 3. **Type**: Feature | Bug | Enhancement | Refactor | Docs | Tech Debt
> 4. **Priority**: P0 (critical) | P1 (high) | P2 (medium, default) | P3 (low)
> 5. **Estimate**: XS (<2h) | S (2-4h) | M (4-8h) | L (1-2d) | XL (2-5d) | XXL (>5d)
> 6. **Notes** (optional): link to doc, related issue, or brief context

### Step 2: Generate the next ID

Read the current backlog table and find the highest existing ID for the project prefix:
- Georgetown → `GEO-###`
- Pitchmasters → `PM-###` (note: BACKLOG.md uses `PIT-###` — use whatever prefix is already in use)
- Monorepo → `MONO-###`
- Shared → `SHARED-###`

Increment by 1 from the highest existing number for that prefix.

### Step 3: Add the row

Insert a new row into the Active Backlog table in `BACKLOG.md`. Row format:

```
| ID | Priority | Backlog | Feature title | Project | Type | Estimate | 2026-04-11 | Notes |
```

Insert it at the end of the table (before the Legend section), ordered by Priority (P0 first, then P1, P2, P3).

### Step 4: Update Quick Stats

Update the Quick Stats section at the bottom of the file:
- Increment Total Items
- Update P0/P1 count if applicable
- Update Last Updated date

### Step 5: Confirm

Show the user the new row and confirm it was added.

---

## MODE: LIST

### Step 1: Ask for filter (optional)

> Show all items, or filter by:
> 1. Project (Georgetown / Pitchmasters / Monorepo / Shared)
> 2. Priority (P0 / P1 / P2 / P3)
> 3. Status (Backlog / In Progress / Blocked / Done)
> 4. All active items (default)

### Step 2: Display

Format the filtered results as a clean table. Group by priority (P0 → P1 → P2 → P3). Show only active (non-Done, non-Cancelled) items unless the user requested Done/Cancelled.

Add a summary line at the end:
```
N items shown | P0: X | P1: X | P2: X | P3: X | In Progress: X | Blocked: X
```

---

## MODE: GROOM

This is the Monday weekly review. Walk through the backlog systematically.

### Step 1: Surface stale and high-priority items

Report:
- Any **P0 or P1** items still in Backlog (not In Progress) — these may need attention
- Any items added **more than 90 days ago** that are still Backlog — candidates for cancellation
- Any **In Progress** items — confirm they're still active
- Any **Blocked** items — check if the blocker has resolved
- Any **XXL** items — ask if they should be broken down

### Step 2: Walk through each concern

For each flagged item, ask the user:
- Stale items: "Still relevant? → Keep / Cancel / Defer to P3"
- Blocked items: "Still blocked? → Unblock / Keep Blocked / Cancel"
- XXL items: "Ready to break this down? → Break down now / Keep as-is"
- Priority mismatches: "Should this still be P2? → Adjust / Keep"

Make the edits to `BACKLOG.md` as decisions are made (don't batch — edit immediately after each decision).

### Step 3: Balance check

After grooming, report the balance:
```
## Grooming Summary — 2026-04-11

Items reviewed: N
Changes made:
- Cancelled: N items
- Priority adjusted: N items
- Broken down: N items
- Unblocked: N items

Current state:
- Total active: N (target: under 30-50)
- P0/P1: N
- In Progress: N
- Quick wins (XS/S): N
```

If total active items exceed 50, flag it:
> ⚠️ Backlog has grown to N items. Consider a pruning pass to remove low-value P3 items.

### Step 4: Update metadata

Update `**Last Updated**` date at the top of `BACKLOG.md`.

---

## MODE: ARCHIVE

Move all **Done** items out of the active table and into the appropriate archive file.

### Step 1: Find Done items

Read `BACKLOG.md` and collect all rows with `Status: Done`.

### Step 2: Determine archive file

Archive goes to `docs/archive/backlog-YYYY.md` where YYYY is the current year.

Check if `docs/archive/backlog-2026.md` exists:
- If yes: append to it
- If no: create it with a header

Archive file format:
```markdown
# Backlog Archive — 2026

Items completed and archived from BACKLOG.md.

## Archived Items

| ID | Priority | Feature | Project | Type | Estimate | Added | Completed | Notes |
|----|----------|---------|---------|------|----------|-------|-----------|-------|
```

### Step 3: Move items

For each Done item:
1. Add it to the archive table (add a Completed column with today's date)
2. Remove it from `BACKLOG.md`

### Step 4: Update Quick Stats

Update the Quick Stats section in `BACKLOG.md` after removing Done items.

### Step 5: Confirm

Report:
> Archived N items to docs/archive/backlog-2026.md
> - [List of archived item IDs and titles]
>
> BACKLOG.md now has N active items.

---

## Backlog Health Rules

Always flag these conditions to the user:

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Too many items | >50 active | Suggest pruning pass |
| Too many P0/P1 | >5 high-priority | Suggest priority review |
| Stale items | >90 days old, not Done | Suggest cancel or defer |
| No quick wins | 0 XS/S items | Note: momentum at risk |
| XXL items | Any unbroken XXL | Suggest breakdown |

---

## ID Reference

| Project | Prefix | Example |
|---------|--------|---------|
| Georgetown | GEO-### | GEO-006 |
| Pitchmasters | PIT-### | PIT-003 |
| Monorepo | MONO-### | MONO-003 |
| Shared | SHARED-### | SHARED-001 |

Check existing IDs in BACKLOG.md and docs/archive/ before assigning a new one to avoid collisions.
