# Handoff: Verify Upload Forms Connect to New Supabase Storage

**Date**: 2025-12-18
**Priority**: Medium
**Status**: Verification Needed
**Previous Work**: [Telegram Sharing Investigation](../troubleshooting/2025-12-17-telegram-sharing-investigation.md)

---

## Context

We've completed migrating from old Supabase storage (`zooszmqdrdocuiuledql.supabase.co`) to new production storage (`rmorlqozjwbftzowqmps.supabase.co`).

**What's been done:**
1. ✅ Updated all 23 database URLs to new storage
2. ✅ Migrated all 24 image files to new storage
3. ✅ Fixed hardcoded URLs in code (Availability.tsx)
4. ✅ Verified `.env` has correct Supabase URL
5. ✅ Verified `src/lib/supabase.ts` uses environment variables
6. ✅ All existing images display correctly

**What needs verification:**
- ⏳ Upload forms actually work with new storage
- ⏳ New images upload to correct buckets
- ⏳ Uploaded images are accessible

---

## Task

Test all image upload forms in the Georgetown app to confirm they:
1. Connect to the new Supabase storage
2. Upload files successfully
3. Generate correct URLs
4. Display uploaded images properly

---

## Upload Forms to Test

### 1. Speaker Portraits
**Location**: Speaker modal edit form
**Bucket**: `speaker-portraits`
**Test**:
1. Open a speaker's detail modal
2. Click edit
3. Upload a new portrait image
4. Verify image displays in modal
5. Check database URL points to `rmorlqozjwbftzowqmps.supabase.co`
6. Verify image is publicly accessible

### 2. Member Portraits
**Location**: Member directory edit form
**Bucket**: `member-portraits`
**Test**: Same as speakers

### 3. Partner Logos
**Location**: Partners page edit form
**Bucket**: `partner-logos`
**Test**: Same as above

### 4. Service Project Images
**Location**: Service projects modal
**Bucket**: `project-images`
**Test**: Same as above

### 5. Club Photos
**Location**: Timeline/photos upload
**Bucket**: `club-photos`
**Subdirectories**: `service/YYYY/`, `community/YYYY/`
**Test**: Verify subdirectory structure preserved

---

## How to Test

### Step 1: Check Current Configuration

```bash
# Verify .env has correct Supabase URL
cat apps/georgetown/.env | grep VITE_SUPABASE_URL
# Should show: VITE_SUPABASE_URL=https://rmorlqozjwbftzowqmps.supabase.co

# Verify supabase client uses env vars
cat apps/georgetown/src/lib/supabase.ts
# Should use: import.meta.env.VITE_SUPABASE_URL
```

### Step 2: Start Dev Server

```bash
cd apps/georgetown
pnpm dev
# Opens: http://localhost:5180
```

### Step 3: Test Each Upload Form

For EACH form:

1. **Navigate to upload UI**
   - Speakers: Click speaker → Edit → Upload portrait
   - Members: Members tab → Edit member → Upload portrait
   - Partners: Partners page → Edit → Upload logo
   - Projects: Projects → Edit → Upload image
   - Photos: Timeline → Add photo

2. **Upload Test Image**
   - Use a small test image (< 100 KB)
   - Click upload button
   - Wait for upload to complete

3. **Verify Image Displays**
   - Check preview shows in UI
   - Verify image loads (no broken image icon)

4. **Check Database URL**
   ```sql
   -- For speakers
   SELECT portrait_url FROM speakers WHERE id = '[uploaded-speaker-id]';

   -- For members
   SELECT portrait_url FROM members WHERE id = '[uploaded-member-id]';

   -- etc.
   ```

5. **Verify Public Access**
   ```bash
   curl -I [uploaded-image-url]
   # Should return: HTTP/2 200
   ```

---

## Expected Results

### ✅ Success Criteria

All upload forms should:
- Upload without errors
- Generate URLs like: `https://rmorlqozjwbftzowqmps.supabase.co/storage/v1/object/public/[bucket]/[filename]`
- Store correct URLs in database
- Display uploaded images immediately
- Images accessible via public URLs

### ❌ Failure Scenarios

If uploads fail or use old storage:
- Check `.env` is loaded (restart dev server)
- Check for hardcoded old URLs in components
- Check bucket permissions in Supabase dashboard
- Check RLS policies allow uploads

---

## Troubleshooting

### Problem: Upload fails with 403 error

**Check bucket permissions:**
1. Go to Supabase Dashboard → Storage
2. Select bucket (e.g., `speaker-portraits`)
3. Settings → Permissions
4. Verify public bucket or correct RLS policy

**Expected policy:**
```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'speaker-portraits');

-- Allow public reads
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'speaker-portraits');
```

### Problem: Image uploads but shows 404

**Check bucket exists:**
```bash
curl -I https://rmorlqozjwbftzowqmps.supabase.co/storage/v1/object/public/speaker-portraits/
# Should return: HTTP/2 200 or 400 (not 404)
```

**Create bucket if missing:**
1. Supabase Dashboard → Storage → New Bucket
2. Name: `speaker-portraits` (or relevant bucket)
3. Public: Yes
4. File size limit: 5 MB
5. Allowed MIME types: `image/jpeg`, `image/png`

### Problem: Old URLs still appearing

**Search for hardcoded references:**
```bash
cd apps/georgetown
grep -r "zooszmqdrdocuiuledql" src/ --include="*.ts" --include="*.tsx"
# Should return: (nothing)
```

---

## Quick Test Script

```bash
# 1. Verify environment
cat apps/georgetown/.env | grep SUPABASE

# 2. Start dev server
cd apps/georgetown && pnpm dev

# 3. In browser, test one upload:
#    - Navigate to Speakers
#    - Edit any speaker
#    - Upload a test portrait
#    - Verify image displays

# 4. Check database
psql $DATABASE_URL -c "SELECT portrait_url FROM speakers ORDER BY updated_at DESC LIMIT 1;"
# Should show: https://rmorlqozjwbftzowqmps.supabase.co/...

# 5. Verify public access
curl -I [url-from-step-4]
# Should return: HTTP/2 200
```

---

## Files to Review

If issues found, check these files:

### Upload Components
```bash
# Find all components that upload images
grep -r "supabase.storage" apps/georgetown/src/ --include="*.tsx"

# Common patterns:
# - ImageUpload.tsx
# - PhotoUploadModal.tsx
# - SpeakerModal.tsx (portrait upload)
# - MemberForm.tsx (portrait upload)
# - PartnerForm.tsx (logo upload)
# - ServiceProjectModal.tsx (image upload)
```

### Supabase Client
- `apps/georgetown/src/lib/supabase.ts` - Client initialization
- `apps/georgetown/.env` - Environment variables

### Image Utilities
- `apps/georgetown/src/utils/imageCompression.ts` - Image processing
- Look for hardcoded bucket names or URLs

---

## Documentation References

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Troubleshooting Log](../troubleshooting/2025-12-17-telegram-sharing-investigation.md)
- [Image Migration Log](../maintenance/2025-12-18-image-migration.md)
- [Georgetown CLAUDE.md](../../apps/georgetown/CLAUDE.md)

---

## Success Checklist

- [ ] All 5 upload forms tested
- [ ] All uploads use new Supabase storage
- [ ] All uploaded images display correctly
- [ ] All database URLs point to new storage
- [ ] All images publicly accessible
- [ ] No errors in browser console
- [ ] No hardcoded old URLs found

---

## Handoff Prompt for Claude

**Use this prompt to continue:**

```
I need to verify that all image upload forms in the Georgetown Rotary app are correctly configured to use the new Supabase storage (rmorlqozjwbftzowqmps.supabase.co instead of zooszmqdrdocuiuledql.supabase.co).

Context: We recently migrated from old to new Supabase storage and updated all database URLs and migrated all existing images. Now we need to confirm that NEW uploads go to the correct storage.

Review the handoff document at:
docs/handoffs/2025-12-18-verify-upload-forms.md

Carry forward the troubleshooting log at:
docs/troubleshooting/2025-12-17-telegram-sharing-investigation.md

Tasks:
1. Search for all image upload components
2. Verify they use the Supabase client from src/lib/supabase.ts
3. Check for any hardcoded storage URLs
4. Test uploads if possible (or provide test instructions)
5. Update troubleshooting log with Attempt 14 documenting findings
6. Create a summary of upload form status

Start by reading both documents above, then search for upload-related code.
```

---

**Created**: 2025-12-18 06:10 SGT
**Status**: Ready for testing
**Estimated time**: 30-60 minutes
