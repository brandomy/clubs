---
description: Create a daily dev journal entry summarizing the day's development work
allowed-tools: Read, Bash, Glob, Grep, Write, TodoWrite
---

# Generate Daily Report

Create a daily dev journal entry for a chosen date and store it in `docs/dev-journal/`.

## Dev Journal Location

All entries live in `docs/dev-journal/` with filenames:
```
YYYY-MM-DD-daily-report.md
```

If a file for the chosen date already exists, offer to append to or replace it.

---

## STEP 1: Choose Report Date

Ask the user:

> Which date should this report cover?
>
> 1. **Today** — 2026-04-11
> 2. **Yesterday** — 2026-04-10
> 3. **Day before yesterday** — 2026-04-09
> 4. **Another day** — I'll enter a date manually

Wait for their selection before proceeding.

- If they choose 1, 2, or 3, use the corresponding date.
- If they choose 4, ask: "Enter the date (YYYY-MM-DD format):"
- Validate that the entered date is a real calendar date.

Set `REPORT_DATE` to the chosen date for all subsequent steps.

---

## STEP 2: Gather Evidence

Collect all available data for `REPORT_DATE` automatically before asking the user anything.

### Git Activity
```bash
git log --oneline --all --since="REPORT_DATE 00:00" --until="REPORT_DATE 23:59" --format="%h %s %an"
```

Also check for commits across all apps:
```bash
git log --oneline --all --since="REPORT_DATE 00:00" --until="REPORT_DATE 23:59" --stat --format="commit %h: %s"
```

### Files Modified on That Date
```bash
git diff --name-only $(git log --format="%H" --since="REPORT_DATE 00:00" --until="REPORT_DATE 23:59" | tail -1)^ $(git log --format="%H" --since="REPORT_DATE 00:00" --until="REPORT_DATE 23:59" | head -1) 2>/dev/null || echo "No changes found"
```

### Existing Documentation from That Date
Look for handoffs, plans, or troubleshooting docs created on `REPORT_DATE`:
```bash
find docs/ -name "*REPORT_DATE*" -type f
```

Check `docs/dev-journal/` for any existing entry:
```bash
ls docs/dev-journal/ | grep "REPORT_DATE"
```

---

## STEP 3: Ask for User Input

After gathering git evidence, present a brief summary of what you found:

> Here's what I found for REPORT_DATE:
> - N commits: [list commit messages]
> - Files changed: [list key files]
> - Existing docs: [list any]
>
> Please add any context I may have missed:
> 1. **What were you working on?** (main focus areas, goals for the day)
> 2. **What did you complete?** (wins, shipped features, resolved bugs)
> 3. **What's blocked or in progress?** (incomplete items, blockers)
> 4. **Any decisions made?** (architecture choices, approach changes, things deferred)
> 5. **Notes for tomorrow?** (what to pick up next)
>
> You can answer as many or as few as you like. Press Enter/send when done.

Wait for their response.

---

## STEP 4: Write the Journal Entry

Combine the git evidence and user input into a structured journal entry.

### Journal Entry Format

```markdown
# Dev Journal — YYYY-MM-DD

**Date**: YYYY-MM-DD  
**Apps touched**: [Georgetown | Pitchmasters | Monorepo | None]

---

## Summary

[2-3 sentence overview of the day's work]

---

## What Was Done

### [App or Area Name]
- [Specific change or accomplishment]
- [Another item]

### [Second area if applicable]
- [Item]

---

## Commits

| Hash | Message | App |
|------|---------|-----|
| `abc1234` | fix: resolve auth issue | Georgetown |

---

## In Progress / Carry-Forward

- [ ] [Incomplete item or next step]
- [ ] [Another item]

---

## Decisions & Notes

- **[Decision topic]**: [What was decided and why]
- **[Another note]**: [Detail]

---

## Files Changed

Key files modified today:
- `apps/georgetown/src/...`
- `apps/pitchmasters/src/...`

---

## Blockers

[Any blockers, or "None" if clean]

---

## Tomorrow's Focus

1. [Top priority]
2. [Second priority]
```

### Formatting rules:
- Use actual commit hashes from git output (short form, 7 chars)
- Categorize changes by app (Georgetown, Pitchmasters, Monorepo)
- Keep the summary tight — 2-3 sentences max
- "In Progress" section should be actionable checkboxes
- Omit sections that have no content (e.g., skip Blockers if there are none)
- If no git activity found, note "No commits recorded" under Commits

---

## STEP 5: Check for Existing Entry

Before writing, check if `docs/dev-journal/YYYY-MM-DD-daily-report.md` already exists.

If it exists:
> A journal entry already exists for this date at `docs/dev-journal/YYYY-MM-DD-daily-report.md`.
>
> Would you like to:
> 1. **Replace it** — overwrite with the new entry
> 2. **Append** — add today's new content below the existing entry
> 3. **Cancel** — don't write anything

Wait for their choice.

---

## STEP 6: Write the File

Write the completed journal entry to:
```
docs/dev-journal/YYYY-MM-DD-daily-report.md
```

Confirm with the user:
> Journal entry written to `docs/dev-journal/YYYY-MM-DD-daily-report.md`
>
> [Show first 10 lines of the entry as a preview]

---

## STEP 7: Offer Follow-ups

> Anything else you'd like to do?
> - Add this to the `BACKLOG.md` carry-forward items
> - Create a handoff prompt for tomorrow
> - Update a plan's status based on today's progress
