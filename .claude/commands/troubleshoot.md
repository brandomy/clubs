---
description: Activate the systematic troubleshooting protocol — creates a log file, documents failed attempts, and guides through the 6-phase process
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, TodoWrite
---

# Systematic Troubleshooting Protocol

Activate structured debugging when stuck. This skill operationalizes `docs/protocols/systematic-troubleshooting.md` — creating the log file and guiding through each phase so you don't debug in circles.

## When to use

- Second failed attempt on the same issue
- Circular debugging (repeating approaches)
- 3+ possible causes and unclear where to start
- Build or deployment failure that persists
- Any time you say "use troubleshooting protocol"

---

## STEP 0: Gather Problem Context

Ask the user:

> Let's get this documented and solve it systematically.
>
> 1. **What's the problem?** (one sentence: "X does Y instead of Z")
> 2. **Which app?** Georgetown | Pitchmasters | Monorepo-wide
> 3. **What have you already tried?** (list each attempt briefly)
> 4. **What trigger brought you here?** 2nd failed attempt | circular debugging | 3+ hypotheses | manual activation

If this was auto-triggered by 3 failed attempts in the current session, pre-fill what you already know about the attempts. Don't ask the user to repeat information already in context.

---

## STEP 1: Create the Troubleshooting Log

### Determine log file path

Based on which app:
- **Georgetown**: `apps/georgetown/docs/dev-journals/YYYY-MM-DD-[problem-slug]-troubleshooting.md`
- **Pitchmasters**: `apps/pitchmasters/docs/dev-journals/YYYY-MM-DD-[problem-slug]-troubleshooting.md`
- **Monorepo-wide**: `docs/troubleshooting-logs/YYYY-MM-DD-[problem-slug]-troubleshooting.md`

Use today's date (2026-04-11) and generate a kebab-case slug from the problem description (e.g., "auth-redirect-loop", "build-vite-chunk-error", "supabase-rls-blocking-reads").

Check if the app-specific `docs/dev-journals/` directory exists; if not, create it.

### Create the log file

Create the file using the full template from `docs/templates/troubleshooting-log-template.md` as the base, pre-filling:
- **Date**: today
- **Problem**: the one-sentence description from Step 0
- **Component/App**: the app and relevant file(s) if known
- **Trigger**: what activated the protocol
- **Failed Attempts**: document each attempt the user described (mark as ❌)
- **Status**: IN PROGRESS

Tell the user:
> Log created: `[path/to/log.md]`
> 
> Working through the protocol now. I'll update the log as we go.

---

## STEP 2: Reproduce & Gather Data (Phase 2)

Before forming hypotheses, gather actual data from the system. Don't assume — verify.

Run the relevant checks based on the problem type:

### Always run
```bash
cd /Users/randaleastman/dev/clubs

# Check workspace integrity
pnpm install --frozen-lockfile

# Check for obvious dependency issues
pnpm list react --depth=0
```

### For build/TypeScript issues
```bash
pnpm typecheck 2>&1 | head -50
pnpm lint 2>&1 | head -50
```

### For app-specific issues
```bash
# Check if issue is isolated to one app
pnpm build:georgetown 2>&1 | tail -30
pnpm build:pitchmasters 2>&1 | tail -30
```

### For monorepo dependency issues
```bash
pnpm list --depth=1 | grep -E "react|vite|typescript"
pnpm why [package-name]
```

Paste the relevant output into the log under "Evidence (Actual Data from System)".

---

## STEP 3: Simplification Checkpoint (Phase 5 — run EARLY)

**Run this before forming hypotheses.** The protocol mandates checking for existing patterns before inventing solutions.

Search for similar working code in the codebase:

```bash
# Search for the pattern related to the problem
grep -r "[relevant-keyword]" apps/ --include="*.tsx" --include="*.ts" -l
```

Answer these questions (document in the log):
- **Does similar working code exist?** Check both apps for the same pattern done correctly elsewhere.
- **Are we overengineering?** What's the simplest possible solution?
- **Can we copy/adapt existing code?** Link to any working examples found.
- **Monorepo isolation**: Does this happen in both apps or just one?

---

## STEP 4: Form Hypotheses (Phase 3)

Based on the gathered data, propose 2-4 ranked hypotheses. For each one:

```
### Hypothesis N: [Name]
**Description**: I think X is causing Y because...
**Evidence FOR**: [specific data points]
**Evidence AGAINST**: [data points that contradict this]
**Test plan**: [specific steps to verify/disprove]
**Priority**: High | Medium | Low — [reason]
```

Write these into the log. Present them to the user ranked by likelihood.

Ask:
> Which hypothesis should we test first? I recommend starting with #N because [reason].

---

## STEP 5: Test Systematically (Phase 4)

For each hypothesis test:

**Rules to follow:**
- Test ONE hypothesis at a time
- Add instrumentation (console.log, etc.) BEFORE changing code
- Document the result immediately in the log
- Revert if it doesn't work — don't stack changes

### Format for each test in the log

```markdown
### Investigation N: [What are you testing?]

**Timestamp**: 2026-04-11 HH:MM
**Hypothesis being tested**: Hypothesis #N
**Method**: [console.log / build test / query / grep]

**Command/Code**:
[exact command or code snippet]

**Result**:
[actual output]

**Conclusion**: [what this tells us — does it support or disprove the hypothesis?]
```

After each test, update the log and report findings to the user. Ask:
> That rules out hypothesis #N. Move to #N+1, or has this given you a new lead?

---

## STEP 6: Fix & Verify (Phase 6)

Once root cause is identified:

1. **Document the solution** in the log before writing code:
   ```
   Root cause: [technical explanation]
   Fix: [what needs to change]
   Why previous attempts failed: [for each attempt]
   ```

2. **Apply the fix** — minimal, targeted change only

3. **Verify** with the full quality gate:
   ```bash
   pnpm lint && pnpm typecheck && pnpm build
   ```
   Or for a single app:
   ```bash
   pnpm build:georgetown  # or pitchmasters
   ```

4. **Update the log**:
   - Fill in the Solution section
   - Fill in Lessons Learned
   - Change Status to **RESOLVED**
   - Add resolution timestamp

5. **Clean up**:
   - Remove any debug `console.log` statements added during investigation
   - Update app-specific CLAUDE.md if the root cause reveals a pattern worth documenting

---

## STEP 7: Post-Resolution

After the fix is confirmed, offer:

> Issue resolved. A few quick follow-ups:
> 1. Should I add a backlog item for the underlying tech debt? (`/backlog add`)
> 2. Should I generate a daily report entry covering this session? (`/generate-daily-report`)
> 3. Does the fix reveal anything worth adding to the app's CLAUDE.md?

---

## Critical Rules (from protocol)

**Never:**
- Stack multiple changes — test one thing at a time
- Skip logging a test result
- Repeat a failed approach without a new hypothesis
- Debug without being able to reproduce the issue

**Always:**
- Start with data from the actual system, not assumptions
- Write down the hypothesis before writing code
- Isolate to one app before checking shared code
- Run `pnpm install` if dependencies seem off

---

## Protocol Reference

Full protocol: `docs/protocols/systematic-troubleshooting.md`  
Template: `docs/templates/troubleshooting-log-template.md`  
Quick reference: `docs/protocols/troubleshooting-quick-reference.md`
