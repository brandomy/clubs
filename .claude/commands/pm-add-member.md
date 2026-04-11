---
description: Add a new member to Pitchmasters — creates their Supabase auth account (sends invite email) and inserts the pm_members row
allowed-tools: Bash, Read
---

# Pitchmasters: Add Member

You are adding a new member to the Pitchmasters app. This creates their Supabase Auth account (invite email sent) and inserts a row in `pm_members`.

## Step 1: Parse arguments

Parse `$ARGUMENTS` for: full name, email, role. The role must be `member`, `officer`, or `admin`. Default role is `member`.

If any required info is missing, ask:
```
Who are we adding to Pitchmasters?
- Full name:
- Email:
- Role (member / officer / admin) [default: member]:
```

## Step 2: Load credentials

Read `apps/pitchmasters/.env.local` and extract:
- `DIRECT_URL` — for psql
- `SUPABASE_SERVICE_ROLE_KEY` — for the Admin API

Read `apps/pitchmasters/.env` and extract:
- `VITE_SUPABASE_URL` — the Supabase project URL

If `SUPABASE_SERVICE_ROLE_KEY` is missing from `.env.local`, stop and tell the user:

> ❌ `SUPABASE_SERVICE_ROLE_KEY` not found in `apps/pitchmasters/.env.local`.
>
> Add it before running this command:
> 1. Go to your Supabase dashboard → Project Settings → API
> 2. Copy the **service_role** key (not the anon key)
> 3. Add to `apps/pitchmasters/.env.local`:
>    ```
>    SUPABASE_SERVICE_ROLE_KEY=eyJ...
>    ```
> Then run `/pm-add-member` again.

## Step 3: Check if auth user already exists

Use psql to check `auth.users` for this email:

```bash
psql "$DIRECT_URL" -t -c "SELECT id FROM auth.users WHERE email = '<email>';"
```

If a row is found, save the UUID. Skip Step 4 (no need to invite — already has auth account).

## Step 4: Create auth user via Supabase Admin API

If the user does NOT exist in auth yet, send an invite:

```bash
curl -s -X POST "$VITE_SUPABASE_URL/auth/v1/invite?redirect_to=http://localhost:5190/reset-password" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "<email>"}'
```

Parse the `id` field from the JSON response — this is the UUID.

If the response contains an error, stop and report it to the user.

## Step 5: Check if pm_members row already exists

```bash
psql "$DIRECT_URL" -t -c "SELECT id FROM pm_members WHERE id = '<uuid>';"
```

If a row exists, tell the user they're already a member and stop.

## Step 6: Set club_id in JWT app_metadata

RLS policies read `club_id` from the JWT — set it now so the user can access their data after sign-in:

```bash
curl -s -X PUT "$VITE_SUPABASE_URL/auth/v1/admin/users/<uuid>" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"app_metadata": {"club_id": "b4bd1d30-0915-4e4b-8876-9f9a0e2beb06", "role": "<role>"}}'
```

If the response contains an error, stop and report it.

## Step 7: Insert the pm_members row

```bash
psql "$DIRECT_URL" -c "
INSERT INTO pm_members (id, email, full_name, club_id, role)
VALUES (
  '<uuid>',
  '<email>',
  '<full_name>',
  'b4bd1d30-0915-4e4b-8876-9f9a0e2beb06',
  '<role>'
);
"
```

## Step 8: Report success

```
✅ Member added to Pitchmasters

  Name:   <full_name>
  Email:  <email>
  Role:   <role>
  UUID:   <uuid>

An invite email has been sent to <email>.
They should click the link, then use "Forgot password / set up account?" on the login page to set their password.
```

If the auth user already existed (Step 3 found them), say:
```
✅ Member added to Pitchmasters

  Name:   <full_name>
  Email:  <email>
  Role:   <role>
  UUID:   <uuid>

Auth account already existed — no invite email sent.
They can sign in at localhost:5190 (or the production URL).
```

## Error handling

- If psql fails (connection error): show the psql error and stop
- If the invite API returns a 422 (email already registered): treat it as "already exists" and continue to Step 5
- If insert fails with unique violation: they're already a member, say so
- If insert fails for any other reason: show the error
