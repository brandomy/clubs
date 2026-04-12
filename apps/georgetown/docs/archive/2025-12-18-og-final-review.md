# Open Graph Final Review & Post-Deployment Testing

**Date**: 2025-12-18
**Session Type**: Final Review & Validation
**Status**: Ready for Testing
**Estimated Time**: 15-20 minutes

---

## Context

All Open Graph (OG) implementation is complete and deployed. This session focuses on **post-deployment validation** to ensure social media previews work correctly across all platforms.

**What was implemented:**
- ✅ Core OG meta tags (og:site_name, og:locale, og:type, og:image metadata)
- ✅ Dynamic server-side injection via Cloudflare Functions middleware
- ✅ Default OG image (1200×630)
- ✅ WeChat optimization (1024×1024 square fallback)
- ✅ Documentation in CLAUDE.md
- ✅ Brand guide and image template

---

## Pre-Deployment Status ✅

Everything is in place and ready:

### Build Verification
```bash
✅ TypeScript compilation: No errors
✅ Vite build: Success (377KB main bundle)
✅ Functions build: Middleware compiled
✅ Static assets: Both OG images present in dist/
✅ HTML output: All meta tags present
```

### Files Created
- `public/assets/images/social/georgetown-rotary-og-default.jpg` (1200×630, 49.87KB)
- `public/assets/images/social/georgetown-rotary-wechat.jpg` (1024×1024, 112KB)
- `docs/templates/image-template.md` (PBS templates)
- `docs/governance/rotary-brand-guide.md` (v2.0)

### Files Modified
- `index.html` - Complete OG tags + WeChat fallback
- `functions/_middleware.ts` - getOgType() + updated handlers
- `CLAUDE.md` - Full documentation added

---

## What You Need to Check

### 1. Quick Manual Verification (5 min)

**After deployment completes:**

1. **Open production site** - https://rotary-club.app/
2. **View page source** (Cmd+Option+U or right-click → View Source)
3. **Search for "og:image"** and verify you see:
   ```html
   <meta property="og:image" content="https://rotary-club.app/assets/images/social/georgetown-rotary-og-default.jpg" />
   <meta property="og:image:width" content="1200" />
   <meta property="og:image:height" content="630" />
   ```

4. **Check WeChat fallback** - Search for "WeChat" and verify hidden image:
   ```html
   <img src="/assets/images/social/georgetown-rotary-wechat.jpg"
   ```

5. **Test image URLs directly:**
   - https://rotary-club.app/assets/images/social/georgetown-rotary-og-default.jpg
   - https://rotary-club.app/assets/images/social/georgetown-rotary-wechat.jpg
   - Both should load successfully (not 404)

---

### 2. Online Validator Testing (10-15 min)

**Use these validators to test social previews:**

#### LinkedIn Post Inspector
**URL**: https://www.linkedin.com/post-inspector/

**Test these URLs:**
- Homepage: `https://rotary-club.app/`
- Any speaker URL: `https://rotary-club.app/speakers/[uuid]`

**Expected Results:**
- ✅ Image appears (1200×630 default or speaker portrait)
- ✅ Title shows (site name or speaker name)
- ✅ Description shows
- ✅ No errors or warnings

**If cached:** Click "Inspect" button to force refresh.

---

#### Facebook Sharing Debugger
**URL**: https://developers.facebook.com/tools/debug/

**Test these URLs:**
- Homepage: `https://rotary-club.app/`
- Speaker URL: `https://rotary-club.app/speakers/[uuid]`
- Project URL: `https://rotary-club.app/projects/[uuid]`

**Expected Results:**
- ✅ All og: tags appear in "Meta Tags" section
- ✅ Image preview shows correctly
- ✅ No warnings about missing required fields

**If cached:** Click "Scrape Again" button at bottom.

---

#### Twitter Card Validator
**URL**: https://cards-dev.twitter.com/validator

**Test:**
- Homepage: `https://rotary-club.app/`

**Expected Results:**
- ✅ Card type: "summary_large_image"
- ✅ Image appears
- ✅ Title and description show

**Note:** Twitter may show cached results. Clear and retry if needed.

---

#### Generic Open Graph Debugger
**URL**: https://www.opengraph.xyz/

**Test all content types:**
- Homepage
- Speaker (profile type)
- Member (profile type)
- Event (article type)
- Project (website type)
- Partner (website type)

**Expected Results:**
- ✅ Correct og:type for each content type
- ✅ All meta tags present
- ✅ Images load properly
- ✅ No missing required fields

---

### 3. Mobile Platform Testing (Optional - 5 min)

**If you have access to these platforms:**

#### WhatsApp
1. Share homepage link to yourself
2. Check preview shows image + title

#### WeChat (if accessible)
1. Share homepage link in chat
2. Verify circular thumbnail appears
3. Should use 1024×1024 image

#### Telegram
1. Share homepage link to Saved Messages
2. Verify preview card appears

---

## Expected Behavior by Content Type

| Route Pattern | og:type | Image Source | Example |
|---------------|---------|--------------|---------|
| `/` | website | Default OG image | Homepage |
| `/speakers/:uuid` | profile | Speaker portrait or default | Individual speaker |
| `/members/:uuid` | profile | Member portrait or default | Individual member |
| `/events/:uuid` | article | Default OG image | Club event |
| `/projects/:uuid` | website | Project image or default | Service project |
| `/partners/:uuid` | website | Partner logo or default | Partner org |

**All should include:**
- og:site_name = "Georgetown Rotary"
- og:locale = "en_US"
- og:image:width = 1200
- og:image:height = 630
- twitter:card = "summary_large_image"

---

## Troubleshooting

### Issue: "Old preview still showing"
**Cause:** Platform cached old preview
**Fix:** Use validator's "Scrape Again" or "Refresh" button

### Issue: "Image not loading"
**Cause:** Image URL incorrect or image file missing
**Fix:**
1. Check image URL in browser directly
2. Verify file exists in dist/assets/images/social/
3. Check build output for errors

### Issue: "No preview appears at all"
**Cause:** Middleware not running or meta tags missing
**Fix:**
1. View page source, verify og:image tag exists
2. Check Cloudflare Functions logs for errors
3. Verify middleware.js file exists in deployment

### Issue: "Wrong title/description for speaker"
**Cause:** Database data missing or middleware error
**Fix:**
1. Check Supabase for speaker data
2. View Cloudflare Functions logs
3. Verify UUID format is correct

---

## Success Criteria

**You're done when:**

- ✅ LinkedIn Post Inspector shows preview correctly
- ✅ Facebook Debugger shows all og: tags
- ✅ Twitter Card Validator shows summary_large_image
- ✅ All images load (no 404s)
- ✅ At least one test of each content type (speaker, member, event, project, partner)
- ✅ Mobile share test works (optional but recommended)

---

## Next Steps After Validation

1. **If everything works:**
   - ✅ Mark OG implementation as complete
   - ✅ Move to Web Share API finalization
   - ✅ Update project status

2. **If issues found:**
   - Document specific failures
   - Check troubleshooting section above
   - Review Cloudflare Functions logs
   - Test locally with build output

---

## Reference Documents

- **Implementation**: [CLAUDE.md - Social Meta Tags section](../CLAUDE.md#social-meta-tags-open-graph)
- **Brand Guide**: [docs/governance/rotary-brand-guide.md](../governance/rotary-brand-guide.md)
- **Image Template**: [docs/templates/image-template.md](../templates/image-template.md)
- **Review Checklist**: [temp/og-review-checklist.md](../../../temp/og-review-checklist.md)

---

## Quick Commands

```bash
# Rebuild if needed
cd apps/georgetown
npm run build

# Check build output
ls -lh dist/assets/images/social/

# View built HTML
cat dist/index.html | grep "og:image"

# Check middleware compilation
ls -lh functions/_middleware.js
```

---

**Handoff Complete - Ready for Final Testing** ✅

After completing validation, you can confidently move forward with Web Share API finalization knowing social previews work correctly across all platforms.
