-- Migration 073: Restore Portrait URLs After Supabase Project Switch
-- Purpose: Repair broken portrait image URLs that pointed to a retired
--          Supabase project (zooszmqdrdocuiuledql) which no longer resolves.
-- Date: 2026-04-20
-- Author: CTO (Claude Code)
--
-- Background: gt_rotary_years.club_president_photo_url and
-- gt_rotary_years.district_governor_photo_url stored absolute URLs pointing at
-- the old Supabase project. After the project was replaced with
-- rmorlqozjwbftzowqmps, those URLs 404'd silently (ThemeDisplay's onError
-- handler hides the <img>), so the portraits disappeared from /timeline.
--
-- The original image files were re-uploaded to the `rotary-themes` bucket in
-- the current project under their original keys, then these URL columns were
-- host-swapped. Wilson Lim's member portrait was also added to
-- `member-portraits` since we had the source file.
--
-- Storage side (already applied via REST upload, documented here for reference):
--   rotary-themes/president-howard-roscoe-2025-2026.jpeg
--   rotary-themes/president-wilson-lim-2024-2025.jpg
--   rotary-themes/dg-edward-khoo-2025-2026.jpeg
--   rotary-themes/dg-arvind-kumar-2024-2025.jpeg
--   member-portraits/member-wilson-lim.jpg

BEGIN;

-- Swap retired host to current project host on theme portrait URLs
UPDATE gt_rotary_years
SET club_president_photo_url = REPLACE(club_president_photo_url,
      'https://zooszmqdrdocuiuledql.supabase.co',
      'https://rmorlqozjwbftzowqmps.supabase.co')
WHERE club_president_photo_url LIKE 'https://zooszmqdrdocuiuledql.supabase.co%';

UPDATE gt_rotary_years
SET district_governor_photo_url = REPLACE(district_governor_photo_url,
      'https://zooszmqdrdocuiuledql.supabase.co',
      'https://rmorlqozjwbftzowqmps.supabase.co')
WHERE district_governor_photo_url LIKE 'https://zooszmqdrdocuiuledql.supabase.co%';

-- Attach restored portrait for Wilson Lim (member row had NULL portrait_url)
UPDATE gt_members
SET portrait_url = 'https://rmorlqozjwbftzowqmps.supabase.co/storage/v1/object/public/member-portraits/member-wilson-lim.jpg'
WHERE name = 'Wilson Lim' AND portrait_url IS NULL;

COMMIT;
