# Code Quality & Infrastructure Improvements - Handoff Prompt

## Context

Read the implementation plan at `docs/plans/2026-04-code-quality-improvements.md`. It contains 18 improvements organized into 4 phases, identified during a full project review on 2026-04-11.

This is a pnpm monorepo at `/Users/randaleastman/dev/clubs/` with two React apps:
- **Georgetown** (`apps/georgetown/`) - Rotary club management (React 19, Vite 7, TypeScript 5.8, Supabase, Tailwind)
- **Pitchmasters** (`apps/pitchmasters/`) - Toastmasters club management (same stack)

Read the root `CLAUDE.md` and both app-specific CLAUDE.md files before starting work.

## Instructions

Work through the plan one phase at a time, in order (Phase 1 through Phase 4). Within each phase, items can be done in any order.

**For each item:**
1. Read the relevant source files mentioned in the plan
2. Make the changes described
3. Run `pnpm lint && pnpm typecheck && pnpm build` to verify nothing breaks
4. Move to the next item

**Do NOT:**
- Add features beyond what each item describes
- Refactor surrounding code that isn't part of the plan
- Add comments, docstrings, or type annotations to code you didn't change
- Create new abstractions unless the plan specifically calls for one

**Do:**
- Keep changes minimal and focused on each item
- Preserve existing code style and patterns
- Ask the user before making judgment calls on ambiguous items (e.g., auth implementation details in 1.4)

## Phase Execution

### Phase 1: Security (start here)
Items 1.1-1.4. These are the most critical. Item 1.4 (auth) may require user input on how they want auth to work — ask before implementing.

### Phase 2: Infrastructure
Items 2.1-2.4. Do 2.1 (testing setup) first so tests are available for verifying the component refactors in 2.3.

### Phase 3: Monorepo
Items 3.1-3.6. Do 3.1 (config unification) before 3.2 (shared package). Item 3.5 (remove unused deps) is a quick win — do it early.

### Phase 4: Polish
Items 4.1-4.4. These are independent and can be done in any order.

## Verification

After completing each phase, run the full quality check:

```bash
pnpm lint && pnpm typecheck && pnpm build
```

After Phase 2.1, also run:

```bash
pnpm test
```

## Success Criteria

- All 18 items addressed
- `pnpm lint` shows 0 errors (warnings acceptable)
- `pnpm typecheck` passes with no errors
- `pnpm build` succeeds for both apps
- No regressions in existing functionality
