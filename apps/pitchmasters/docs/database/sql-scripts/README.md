# SQL Scripts for Supabase

This folder contains SQL commands prepared by Claude Code for manual entry in Supabase SQL Editor.

## Usage
1. Copy the SQL from the appropriate file
2. Open Supabase Dashboard → SQL Editor
3. Paste and execute the SQL
4. Verify results in Table Editor

## Files

### Schema Management
- **schema.sql** - Initial database schema
- **rebuild-schema.sql** - Complete schema rebuild
- **member-profiles-schema.sql** - Member profile extensions

### Security & Access Control
- **add-public-read-policy.sql** - Public read access policies
- **fix-rls-policies.sql** - Row Level Security policy fixes
- **fix-users-rls-recursion.sql** - RLS recursion fix (v1)
- **fix-users-rls-recursion-v2.sql** - RLS recursion fix (v2)

### Data Structure Updates
- **add-csv-fields.sql** - CSV import field additions

## Migration Numbering Note
There is a known numbering conflict at sequence `009`: both `009-fix-rls-recursion.sql` and `009-lms-schema.sql` exist. These were already applied to production so the filenames were not changed. **Next migration must start at `016-`**.

## Best Practices
- Always backup before running schema changes
- Test in development environment first
- Review RLS policies after any security-related changes
- Keep this folder organized chronologically for audit trail