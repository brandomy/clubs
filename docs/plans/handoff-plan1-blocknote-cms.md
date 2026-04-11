# Handoff Prompt — Plan 1: BlockNote CMS

> Copy everything below this line and paste it as your opening message to Claude Code.

---

You are the CTO for the Pitchmasters app — a Toastmasters club management application in the `clubs` monorepo at `apps/pitchmasters/`.

## Before you start

Read these files in order:
1. `/Users/randaleastman/dev/clubs/CLAUDE.md` — monorepo context
2. `/Users/randaleastman/dev/clubs/apps/pitchmasters/CLAUDE.md` — app context, constraints, tech stack, workflow rules
3. `/Users/randaleastman/dev/clubs/docs/plans/pitchmasters-blocknote-cms.md` — the full implementation plan you are executing

Do not start implementation until you have confirmed you've read all three.

## Your task

Implement Plan 1 exactly as specified in `pitchmasters-blocknote-cms.md`. This adds a Notion-like browser-based CMS to the Pitchmasters app using BlockNote, allowing club officers and admins to create and publish public pages (About Us, How to Visit, Club History, etc.) directly from within the app.

## Key context

- The app uses React 19 + TypeScript + Vite + Tailwind CSS + Supabase + React Router v6
- Deployed to Cloudflare Pages — must remain China-friendly (no Google CDN, no external font dependencies)
- Auth is currently simulated with a demo admin user — build permission checks using the existing `role` field on the `users` table (`'member' | 'officer' | 'admin'`)
- The existing `get_current_user_club_id()` security definer function is already in Supabase — use it in all RLS policies
- Custom Tailwind colors: `tm-blue`, `tm-maroon`, `tm-gray` — use these for any new UI
- Icons: use Lucide React (already installed)
- All documentation for completed work goes in `docs/dev-journals/YYYY-MM-DD-topic.md`
- Follow the Documentation Organization Protocol in CLAUDE.md strictly

## Constraints

- Do NOT install Mantine globally or let it affect the existing Tailwind layout — BlockNote's Mantine styles must be scoped to the editor component only
- Do NOT add error handling for impossible cases — trust Supabase RLS and React Router
- Do NOT add features beyond what is in the plan
- Use `pnpm` not `npm`
- Run `pnpm typecheck` and `pnpm lint` before declaring complete

## Definition of done

- [ ] `public_pages` table exists in Supabase with correct RLS policies
- [ ] Officers/admins can create, edit, publish, and unpublish pages from the browser
- [ ] Only admins can delete pages
- [ ] Published pages are readable at `/pages/:slug` without authentication
- [ ] Draft pages are only visible to officers/admins
- [ ] "Pages" link appears in the Layout navigation
- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm lint` passes with zero errors
- [ ] Dev journal entry created in `docs/dev-journals/`
