# Georgetown Table Prefix Refactor — Handoff Prompt

## Background

This is a pnpm monorepo at `/Users/randaleastman/dev/clubs/` containing two apps:
- **Georgetown** (`apps/georgetown/`) — Rotary club speaker/event management
- **Pitchmasters** (`apps/pitchmasters/`) — Toastmasters club management

Both apps share **one Supabase project** (`rmorlqozjwbftzowqmps.supabase.co`). All tables live in the `public` schema. To prevent naming collisions, we adopted a prefix convention:
- Pitchmasters tables: `pm_` prefix (already applied — `pm_members`, `pm_clubs`, etc.)
- Georgetown tables: `gt_` prefix (**this task**)

Georgetown was built before Pitchmasters and has 68+ migrations. Its tables currently have no prefix. Pitchmasters just had its full schema applied fresh (007-rebuild-schema.sql). Georgetown tables are **live in production** — so this rename must be done carefully with a migration, not a full rebuild.

## Current Georgetown Tables (all need `gt_` prefix)

| Current name | New name |
|---|---|
| `events` | `gt_events` |
| `locations` | `gt_locations` |
| `members` | `gt_members` |
| `partners` | `gt_partners` |
| `photos` | `gt_photos` |
| `project_partners` | `gt_project_partners` |
| `rotary_years` | `gt_rotary_years` |
| `service_projects` | `gt_service_projects` |
| `speakers` | `gt_speakers` |
| `user_roles` | `gt_user_roles` |
| `role_permissions` | `gt_role_permissions` |
| `attendance_records` | `gt_attendance_records` |
| `meeting_rsvps` | `gt_meeting_rsvps` |
| `global_south_interest` | `gt_global_south_interest` |

Views (if they exist as real tables or views):
- `meeting_attendance_summary` → `gt_meeting_attendance_summary`
- `meeting_rsvp_summary` → `gt_meeting_rsvp_summary`
- `member_attendance_stats` → `gt_member_attendance_stats`

## Migration Strategy

Georgetown tables are **live in production** — use `ALTER TABLE ... RENAME TO` not DROP/CREATE.

**Important**: PostgreSQL does NOT automatically rename:
- Indexes (must rename separately)
- Triggers (must rename separately)
- Sequences (must rename separately)
- Views/functions that reference the old name (must recreate)
- RLS policies (attached to table — survive rename automatically)
- Foreign keys (survive rename automatically)

### Approach
1. Write a single SQL migration file: `069-rename-tables-gt-prefix.sql`
2. Use `ALTER TABLE x RENAME TO gt_x` for each table
3. Check for views referencing old table names and recreate them
4. Verify no broken references in production

## Prerequisites — Read These Files First

1. Root `CLAUDE.md` — monorepo context
2. `apps/georgetown/CLAUDE.md` — Georgetown context, migration workflow
3. `apps/georgetown/docs/database/CURRENT-PRODUCTION-SCHEMA.sql` — authoritative current schema
4. `apps/georgetown/docs/database/068-global-south-interest-table.sql` — most recent migration (see naming style)

## Step 1: Write the Migration

Create `apps/georgetown/docs/database/069-rename-tables-gt-prefix.sql`.

Template for each rename:
```sql
-- Rename table
ALTER TABLE events RENAME TO gt_events;

-- Rename primary index (example — check actual index names in CURRENT-PRODUCTION-SCHEMA.sql)
ALTER INDEX IF EXISTS events_pkey RENAME TO gt_events_pkey;
ALTER INDEX IF EXISTS idx_events_date RENAME TO idx_gt_events_date;
-- ... etc for all indexes on this table
```

Check `CURRENT-PRODUCTION-SCHEMA.sql` for the actual index names — don't guess.

For views (`meeting_attendance_summary`, `meeting_rsvp_summary`, `member_attendance_stats`):
```sql
DROP VIEW IF EXISTS meeting_attendance_summary;
CREATE VIEW gt_meeting_attendance_summary AS
  -- recreate with updated table references
  ...;
```

## Step 2: Update Georgetown TypeScript Source

After the migration, update all `supabase.from('...')` calls in the Georgetown app. The affected files are in `apps/georgetown/src/`. Find them with:

```bash
grep -roh "from('[a-z_]*')" apps/georgetown/src --include="*.ts" --include="*.tsx" | sort -u
```

Tables to rename in code:
- `from('events')` → `from('gt_events')`
- `from('locations')` → `from('gt_locations')`
- `from('members')` → `from('gt_members')`
- `from('partners')` → `from('gt_partners')`
- `from('photos')` → `from('gt_photos')`
- `from('project_partners')` → `from('gt_project_partners')`
- `from('rotary_years')` → `from('gt_rotary_years')`
- `from('service_projects')` → `from('gt_service_projects')`
- `from('speakers')` → `from('gt_speakers')`
- `from('user_roles')` → `from('gt_user_roles')`
- `from('role_permissions')` → `from('gt_role_permissions')`
- `from('attendance_records')` → `from('gt_attendance_records')`
- `from('meeting_rsvps')` → `from('gt_meeting_rsvps')`
- `from('global_south_interest')` → `from('gt_global_south_interest')`
- `from('meeting_attendance_summary')` → `from('gt_meeting_attendance_summary')`
- `from('meeting_rsvp_summary')` → `from('gt_meeting_rsvp_summary')`
- `from('member_attendance_stats')` → `from('gt_member_attendance_stats')`

Also update `apps/georgetown/src/lib/supabase.ts` — the `Database` type definition has table keys matching the old names. Rename them all to `gt_` prefixed versions.

Also update `apps/georgetown/src/contexts/AuthContext.tsx` (or wherever `from('members')` / `from('user_roles')` is used for auth).

## Step 3: Run the Migration

Georgetown uses the same psql-based migrate script pattern as Pitchmasters. Check `apps/georgetown/CLAUDE.md` for the exact command. The `.env.local` file in `apps/georgetown/` contains `DIRECT_URL`.

```bash
# From monorepo root
cd apps/georgetown
pnpm migrate 069-rename-tables-gt-prefix.sql
# Or whatever the Georgetown migrate command is
```

## Step 4: Verify

```bash
# Typecheck
pnpm typecheck:georgetown

# Build
pnpm build:georgetown

# Then test the app manually — check that member list, events, speakers all load
```

## What NOT to Do

- Do NOT rebuild the schema from scratch (tables are live with real data)
- Do NOT rename Pitchmasters tables — they already have `pm_` prefix
- Do NOT change any Pitchmasters files
- Do NOT add `gt_` prefix to the shared Supabase project-level config (URL, keys) — those are shared

## Definition of Done

- [ ] All Georgetown tables renamed in database with `gt_` prefix
- [ ] All `from('...')` calls in `apps/georgetown/src/` updated
- [ ] `Database` type in `supabase.ts` updated
- [ ] `pnpm typecheck` passes clean
- [ ] `pnpm build:georgetown` passes clean
- [ ] App loads and members/events/speakers display correctly
