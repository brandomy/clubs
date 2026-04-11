---
description: Run the full quality gate (lint, typecheck, build) before deploying to Cloudflare Pages
allowed-tools: Bash, Read
---

# Pre-Deploy Quality Gate

Run the full three-stage quality check for this monorepo before deploying to Cloudflare Pages. Both apps must pass all three stages before any deploy is safe.

## STEP 1: Run the Quality Gate

Run all three checks. If any stage fails, stop and report immediately — do not continue to later stages.

```bash
cd /Users/randaleastman/dev/clubs

# Stage 1: Lint
pnpm lint

# Stage 2: Type check (only if lint passes)
pnpm typecheck

# Stage 3: Build both apps (only if typecheck passes)
pnpm build
```

Run each stage sequentially. Capture the full output of each stage.

## STEP 2: Report Results

Report using this format:

```
## Pre-Deploy Quality Gate — 2026-04-11

| Stage      | Status | Duration |
|------------|--------|----------|
| Lint       | ✅ Pass / ❌ FAIL | Xs |
| Typecheck  | ✅ Pass / ❌ FAIL / ⏭ Skipped | Xs |
| Build      | ✅ Pass / ❌ FAIL / ⏭ Skipped | Xs |

**Overall: ✅ READY TO DEPLOY / ❌ NOT READY**
```

If all three pass, confirm:
> Both apps built successfully. Safe to push to main / trigger Cloudflare Pages deploy.

## STEP 3: On Failure — Diagnose and Fix

If any stage fails, do the following:

### Lint failures
- Show the exact ESLint errors with file paths and line numbers
- Fix auto-fixable issues with `pnpm lint --fix` if appropriate
- For non-auto-fixable issues, read the relevant file and fix the issue directly
- Re-run `pnpm lint` to confirm resolution before proceeding

### Typecheck failures
- Show each TypeScript error with file path, line number, and error code
- Read the affected file(s) to understand context
- Fix type errors one at a time
- Re-run `pnpm typecheck` to confirm each fix
- Common patterns to check:
  - Missing type annotations on props or function returns
  - Undefined/null not handled
  - Import path issues
  - Incorrect generic types

### Build failures
- Show the full Vite error output
- Identify whether the failure is in Georgetown, Pitchmasters, or both
- Check for:
  - Missing imports or circular dependencies
  - Environment variable references that don't exist
  - Asset path issues
  - Cloudflare Functions syntax errors in `functions/` directory
- Fix the root cause, then re-run only the failing app's build:
  ```bash
  pnpm build:georgetown   # or
  pnpm build:pitchmasters
  ```
- Once individual app passes, re-run `pnpm build` for full confirmation

## STEP 4: Final Confirmation

After fixing all failures, re-run the complete gate from scratch:

```bash
pnpm lint && pnpm typecheck && pnpm build
```

Report the clean run result before declaring the deploy ready.

## Common Error Patterns

### "Cannot find module" (build/typecheck)
Usually a missing import or wrong path. Check `tsconfig.json` path aliases.

### "Property does not exist on type" (typecheck)
Read the component to understand the expected interface. Check if a Supabase type needs updating.

### "Parsing error: Unexpected token" (lint)
Usually a syntax error. The file path in the error message is the source.

### Cloudflare Functions errors
Files in `apps/georgetown/functions/` must use Web APIs only (no Node.js APIs). Check for `process`, `require`, `Buffer`, `fs`, or `path` usage.

### "Module has no exported member" (typecheck)
Check if the export was renamed or removed in a recent change. Grep for the symbol.
