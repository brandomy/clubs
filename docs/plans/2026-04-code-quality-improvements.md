# Code Quality & Infrastructure Improvements Plan

**Created**: 2026-04-11
**Status**: In Progress (Phase 1 complete, Phase 2 complete, Phase 3 complete, Phase 4 next)
**Scope**: Both apps (Georgetown + Pitchmasters) and monorepo infrastructure
**Source**: Full project review conducted 2026-04-11

---

## Overview

18 improvements identified during a comprehensive project review, organized into 4 phases by priority and dependency order. Each phase can be executed independently but should be done in order where possible.

---

## Phase 1: Security ✅ Complete (2026-04-11)

### ~~1.1 Scrub exposed credentials from Pitchmasters .env~~ ✅ Already safe
- `.env` was never committed to git (verified via `git log`)
- Line 9 comment uses `<PASSWORD>` as a literal placeholder — no real credential
- `VITE_SUPABASE_ANON_KEY` is the public anon key — correct to have in `.env`
- No action needed

### ~~1.2 Sanitize dangerouslySetInnerHTML in Georgetown~~ ✅ Already fixed
- `EventViewModal.tsx:742` already uses `DOMPurify.sanitize(event.agenda)`
- `FaviconTestPage.tsx` uses it for a hardcoded SVG constant (not user input) — safe
- No action needed

### ~~1.3 Move hardcoded Supabase key to env vars in Georgetown middleware~~ ✅ Already fixed
- `functions/_middleware.ts:91-92` already reads from `env.SUPABASE_URL` / `env.SUPABASE_ANON_KEY`
- No hardcoded keys in source
- No action needed

### 1.4 Replace mock/demo auth with real authentication — ⏸ Deferred
- **Files**:
  - Georgetown: `apps/georgetown/src/hooks/useAuth.ts` (lines 96-136) — mock fallback gives first active member officer access when no session
  - Pitchmasters: `apps/pitchmasters/src/pages/MemberProfilePage.tsx` (lines 37-46) — hardcoded `demo-admin` user with `isAuthenticated = true`
- **Deferral reason**: No users are authenticating yet — mock auth is intentional development scaffolding. Risk is zero until real users access the app.
- **When to implement**: Before public launch. Requires login UI + protected route wrapper. Needs separate planning session.

**Phase 1 Result**: 3 items pre-existing (already fixed before this review), 1 deferred to pre-launch

---

## Phase 2: Infrastructure & Quality Gates (High Priority)

### ~~2.1 Add testing infrastructure and initial tests~~ ✅ Complete (2026-04-11)
- **Scope**: Both apps
- **Problem**: Zero test coverage, no testing framework configured
- **Action**:
  - Add `vitest`, `@testing-library/react`, `@testing-library/jest-dom` to both apps
  - Add `vitest.config.ts` to both apps
  - Add `test` script to both `package.json` files and root
  - Write initial tests for:
    - Georgetown: `urlValidation.ts`, `dateValidation.ts`, `impact-stats.ts`
    - Pitchmasters: `privacy.ts`, `permissions.ts`
  - Target: 5-10 tests per app covering critical utility logic

### ~~2.2 Set up GitHub Actions CI pipeline~~ ✅ Complete (2026-04-11)
- **File**: `.github/workflows/ci.yml` (created)
- Runs on push to main and PRs to main
- Steps: checkout → pnpm setup → node setup → install → lint → typecheck → test → build
- Build uses placeholder Supabase env vars (non-functional but bundle-correct)
- Also added `"typecheck": "tsc --noEmit"` to Georgetown package.json (was missing)

### ~~2.3 Break up oversized components~~ ✅ Complete (2026-04-11)
- **Georgetown EventsListView**: 1173 → 1074 lines
  - Extracted `src/hooks/useTableFilters.ts` — filter/sort state and computed filteredEvents/sortedEvents
  - Extracted `src/components/ColumnSettings.tsx` — self-contained dropdown with click-outside + state
- **Georgetown KanbanBoard**: 1129 → 953 lines
  - Extracted `src/components/SpeakerCardExpanded.tsx` — full portrait card from Cards view (~180 lines)
  - Removed `LinkedInIcon`, `SocialMediaIcons`, `ShareButton`, `BadgeCheck`, `Pencil` imports (now in SpeakerCardExpanded)
- **Pitchmasters MemberDirectory**: 527 → 307 lines
  - Extracted `src/components/MemberCard.tsx` — full member card with contact actions (~220 lines)
- **CalendarView.tsx**: was already 368 lines (not 772 as recorded) — no action needed
- **MemberProfilePage.tsx**: deferred to Phase 4 (no clear boundaries for extraction without risk)

### 2.4 Clean up console.log statements
- **Scope**: Both apps
- **Problem**: 20+ debug console statements in production code
- **Action**:
  - Georgetown: Replace `console.log`/`console.error` calls with existing `logger.ts` utility or remove
  - Pitchmasters: Same treatment
  - Consider a Vite plugin or ESLint rule to strip/warn on console usage

**Phase 2 Estimated Effort**: 2-3 sessions

---

## Phase 3: Monorepo Improvements ✅ Complete (2026-04-11)

### ~~3.1 Unify build configurations~~ ✅ Complete (2026-04-11)
- Created `tsconfig.base.json` at root with 14 shared compiler options (ES2022 target, strict, bundler mode)
- Both `tsconfig.app.json` files now extend root base; each keeps only its unique flags
- Georgetown unique: `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUncheckedSideEffectImports`
- Pitchmasters unique: `isolatedModules`, `noUncheckedIndexedAccess`; also upgraded from ES2020 → ES2022
- Added `minHeight: { touch: '44px' }` and `minWidth: { touch: '44px' }` to Georgetown Tailwind (matching Pitchmasters)
- Vite configs intentionally left separate — different PWA workboxes, ports, plugins

### ~~3.2 Extract shared utilities package~~ ⏸ Deferred — not justified at current scale
- After reading all candidate files: `logger.ts` is identical but trivially small (36 lines); `useRealtimeSubscription` has hard `supabase` client import; `ErrorBoundary` has Rotary brand colors; `OfflineIndicator` has different styling per app
- Creating a `packages/shared/` workspace for 1-2 small utilities adds cross-package build infrastructure with no real payoff
- Revisit when there are 3+ genuinely reusable utilities with meaningful shared logic

### ~~3.3 Add memoization to list-heavy components~~ ✅ Complete (2026-04-11)
- `SpeakerCardExpanded` — wrapped with `React.memo` (pure presentational; `onView`/`onEdit` are stable setState refs)
- `MemberCard` (Pitchmasters) — wrapped with `React.memo`
- `SpeakerCard` (kanban column card) skipped — uses `useSortable` DnD hooks + owns local state; memo would rarely fire

### ~~3.4 Optimize Georgetown bundle size~~ ✅ Complete (2026-04-11)
- Added `rollupOptions.manualChunks` to Georgetown Vite config: `vendor` (react/router), `supabase`, `tiptap` (@tiptap/react + starter-kit), `ui` (lucide-react, date-fns, dnd-kit)
- Lazy-loaded `RichTextEditor` in both `EventViewModal` and `AddEventModal` using `React.lazy` + `Suspense`
- TipTap now only loads when user opens edit form (not on events page load)
- Fallback: animated skeleton `div` (h-32, animate-pulse) prevents layout shift
- `@tiptap/pm` excluded from manualChunks (subpath-only package, no root entry)

### ~~3.5 Remove unused dependencies from Pitchmasters~~ ✅ Complete (2026-04-11)
- Confirmed zero imports of `dnd-kit` in `apps/pitchmasters/src/`
- Removed `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` from Pitchmasters
- Updated `vite.config.ts` manualChunks: removed dnd-kit from `ui` chunk

### ~~3.6 Extract duplicate data-fetching logic in Pitchmasters~~ ✅ Complete (2026-04-11)
- Created `apps/pitchmasters/src/hooks/useMembersData.ts` — returns `{ members, isLoading, error }`
- Replaced identical 15-line Supabase query + normalization in `MembersPage` and `CommunityPage`
- `MemberProfilePage` left as-is (different query: single member by ID with `.eq().single()`)
- CommunityPage: partners fetch kept in separate `useEffect` with its own loading/error state; combined loading state derived via `||`
- Also fixed pre-existing build bug in `ProtectedRoute.tsx`: `ReactNode` was imported from `react-router-dom` (wrong); moved to `react`

**Phase 3 Actual Effort**: 1 session

---

## Phase 4: Polish (Low Priority)

### 4.1 Fix accessibility gaps
- **Problem**: Missing `<label>` elements on form inputs (Pitchmasters), `alert()` used for confirmations (Georgetown, 32 instances)
- **Action**:
  - Pitchmasters: Add proper `<label>` with `htmlFor` to all edit form inputs in `MemberProfilePage`
  - Georgetown: Replace `alert()` / `confirm()` calls with a reusable `ConfirmModal` component

### 4.2 Remove dead code
- **Problem**: Unused files in production
- **Action**:
  - Georgetown: Delete `PartnersPage_old.tsx` (556 lines), remove `ErrorTest.tsx` from production build
  - Pitchmasters: Remove `/favicon-test` route from `App.tsx` or gate behind dev-only flag

### 4.3 Create missing documentation files
- **Problem**: Root CLAUDE.md references files that don't exist
- **Action**:
  - Verify `BACKLOG.md` exists at root (or remove reference)
  - Verify `docs/templates/troubleshooting-log-template.md` exists (or create)
  - Update README cross-references

### 4.4 Replace remaining `any` types with proper types
- **Problem**: ~15 warnings in Pitchmasters, ~58 in Georgetown
- **Action**:
  - Pitchmasters: Type `updateMemberProfile` with generics, replace `Record<string, any>` in types/index.ts, type privacy utility parameters
  - Georgetown: Type `CalendarView.selectedEvent`, fix remaining `any` in hooks
  - Focus on non-docs files (skip knowledge-transfer examples)

**Phase 4 Estimated Effort**: 1-2 sessions

---

## Execution Notes

- **Total estimated effort**: 6-10 sessions across all phases
- **Dependencies**: Phase 1 has no dependencies. Phase 2.1 (testing) should come before Phase 3 refactoring so you can verify refactors don't break anything. Phase 3.2 (shared package) should come after Phase 3.1 (unified configs).
- **Each item is independently executable** within its phase
- **Verify after each item**: Run `pnpm lint && pnpm typecheck && pnpm build` to confirm nothing breaks
