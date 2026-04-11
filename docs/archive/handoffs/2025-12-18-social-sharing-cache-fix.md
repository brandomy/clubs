# Social Sharing Platform Cache Fix

**Date:** 2025-12-18
**Issue:** Some platforms (X/Twitter, LinkedIn, Facebook, WeChat) showing old/default link previews despite middleware working correctly
**Status:** ✅ FIXED - Requires deployment + cache clearing

---

## Problem Summary

Real-world testing revealed that while the Open Graph middleware is working correctly (verified via curl), some platforms were showing:
- **X (Twitter)**: Text only, no images
- **LinkedIn**: Link only, no rich preview
- **Facebook**: Fallback "Georgetown Rotary Speakers" message
- **WeChat**: Speakers work, but projects show fallback

## Root Causes

1. **Twitter Card Type**: Using `summary` instead of `summary_large_image`
   - Twitter/X won't show large images with `summary` card type
   - Only shows small thumbnail on the side

2. **Platform Caching**: Facebook, LinkedIn, X, WeChat cache link previews
   - Once cached with old/default tags, they won't refresh automatically
   - Cache can last days or weeks depending on platform

3. **WeChat User Agent**: Not detected by original middleware
   - WeChat uses `WeChat` or `MicroMessenger` in user agent
   - Was falling through to default tags

---

## Fixes Applied

### 1. Twitter Card Type (index.html:21)
**Before:**
```html
<meta name="twitter:card" content="summary" />
```

**After:**
```html
<meta name="twitter:card" content="summary_large_image" />
```

**Impact:** Twitter/X will now show large images in link previews

---

### 2. WeChat User Agent Detection (_middleware.ts:45-54)
**Before:**
```typescript
const isCrawler =
  userAgent.includes('WhatsApp') ||
  userAgent.includes('Telegram') ||
  userAgent.includes('Slack') ||
  userAgent.includes('facebookexternalhit') ||
  userAgent.includes('Twitterbot') ||
  userAgent.includes('LinkedInBot')
```

**After:**
```typescript
const isCrawler =
  userAgent.includes('WhatsApp') ||
  userAgent.includes('Telegram') ||
  userAgent.includes('Slack') ||
  userAgent.includes('facebookexternalhit') ||
  userAgent.includes('Facebot') ||
  userAgent.includes('Twitterbot') ||
  userAgent.includes('LinkedInBot') ||
  userAgent.includes('WeChat') ||
  userAgent.includes('MicroMessenger')
```

**Impact:** WeChat will now receive custom Open Graph tags

---

### 3. Twitter Card Type in Middleware (_middleware.ts:357-359)
**Added:**
```typescript
.replace(
  /<meta name="twitter:card" content="[^"]*" \/>/,
  `<meta name="twitter:card" content="summary_large_image" />`
)
```

**Impact:** Ensures Twitter card type is always `summary_large_image` for shared content

---

## How to Clear Platform Caches

After deployment, you'll need to clear the cached previews on each platform:

### Facebook / Meta
1. Visit: https://developers.facebook.com/tools/debug/
2. Enter your URL (e.g., `https://georgetown-rotary.pages.dev/projects?id=c55d2a29-c27c-4500-9221-26f9bbda4805`)
3. Click **"Debug"** button
4. Click **"Scrape Again"** button to force refresh
5. Verify the preview shows correctly

**Test URLs:**
- https://georgetown-rotary.pages.dev/projects?id=c55d2a29-c27c-4500-9221-26f9bbda4805
- https://georgetown-rotary.pages.dev/speakers/b22acb96-df4b-40bc-aca9-a1f5c20305e3

---

### X (Twitter)
1. Visit: https://cards-dev.twitter.com/validator
2. Enter your URL
3. Click **"Preview card"** button
4. If still showing old preview, wait 24 hours (Twitter caches aggressively)
5. Alternative: Tweet the link with a unique query parameter:
   - `https://georgetown-rotary.pages.dev/projects?id=UUID&v=2`
   - The `&v=2` makes Twitter treat it as a new URL

---

### LinkedIn
1. Visit: https://www.linkedin.com/post-inspector/
2. Enter your URL
3. Click **"Inspect"** button
4. If needed, click **"Clear cache"** (may require LinkedIn Page admin access)
5. Verify the preview shows correctly

---

### WeChat
**Note:** WeChat caching is aggressive and can't be manually cleared easily

**Options:**
1. **Wait 24-48 hours** - WeChat cache typically expires after 1-2 days
2. **Add query parameter** - Append `?v=1` to make WeChat treat it as new URL:
   - `https://georgetown-rotary.pages.dev/projects?id=UUID?v=1`
3. **Contact users** - Ask them to force-refresh by:
   - Long press the link → "Open in Safari"
   - Share from Safari instead of WeChat browser

---

### WhatsApp
**Good news:** WhatsApp typically refreshes cache within 15-30 minutes

**If needed:**
1. Add query parameter: `?v=1` or `?refresh=1`
2. Share the new URL
3. WhatsApp will fetch fresh meta tags

---

## Verification Commands

Test that middleware is returning correct meta tags:

```bash
# Test projects with Facebook crawler
curl -A "facebookexternalhit/1.1" \
  "https://georgetown-rotary.pages.dev/projects?id=c55d2a29-c27c-4500-9221-26f9bbda4805" \
  | grep -E 'og:|twitter:'

# Expected output:
# og:title = "Championing Mental Wellbeing for a Resilient Penang"
# og:image = "https://rmorlqozjwbftzowqmps.supabase.co/.../project-images/c55d2a29-..."
# twitter:card = "summary_large_image"
# twitter:image = "https://rmorlqozjwbftzowqmps.supabase.co/.../project-images/c55d2a29-..."

# Test with Twitter crawler
curl -A "Twitterbot/1.0" \
  "https://georgetown-rotary.pages.dev/projects?id=c55d2a29-c27c-4500-9221-26f9bbda4805" \
  | grep 'twitter:card'

# Expected: <meta name="twitter:card" content="summary_large_image" />

# Test with WeChat crawler
curl -A "MicroMessenger/1.0" \
  "https://georgetown-rotary.pages.dev/speakers/b22acb96-df4b-40bc-aca9-a1f5c20305e3" \
  | grep 'og:title'

# Expected: <meta property="og:title" content="Tammana Patel" />
```

---

## Deployment Checklist

- [x] Fix Twitter card type in index.html
- [x] Add WeChat user agent detection to middleware
- [x] Update injectMetaTags to set Twitter card type
- [x] Build functions: `pnpm run build:functions`
- [ ] Commit and push changes
- [ ] Wait for Cloudflare deployment (10-15 min)
- [ ] Verify curl tests return `summary_large_image`
- [ ] Clear platform caches (Facebook, X, LinkedIn)
- [ ] Test real-world sharing on each platform
- [ ] Document results

---

## Expected Results After Deployment

### Before Fix
| Platform | Preview Status |
|----------|---------------|
| X (Twitter) | Text only, no image |
| LinkedIn | Link only |
| Facebook | Fallback message |
| WeChat | Speakers work, projects fail |
| Messages/Email | ✅ Working |

### After Fix + Cache Clear
| Platform | Preview Status |
|----------|---------------|
| X (Twitter) | ✅ Large image + title + description |
| LinkedIn | ✅ Rich preview with image |
| Facebook | ✅ Custom title, description, image |
| WeChat | ✅ Both speakers and projects work |
| Messages/Email | ✅ Working (no change needed) |

---

## Files Modified

1. **apps/georgetown/index.html:21** - Changed Twitter card type
2. **apps/georgetown/functions/_middleware.ts:45-54** - Added WeChat, Facebot user agents
3. **apps/georgetown/functions/_middleware.ts:357-359** - Inject Twitter card type

---

## Common Issues & Solutions

### Issue: "Still showing old preview after deployment"
**Solution:** Platform cache hasn't been cleared yet
- Use the cache clearing tools above
- Or wait 24-48 hours for natural cache expiration

### Issue: "Preview shows but no image"
**Solution:** Check image URL is accessible
```bash
# Test image URL directly
curl -I "https://rmorlqozjwbftzowqmps.supabase.co/storage/v1/object/public/project-images/UUID.jpg"
# Should return: HTTP/2 200
```

### Issue: "WeChat still not working"
**Solution:** WeChat may be using a different user agent variant
- Check WeChat version (older versions may use different UA)
- Try adding `?v=1` query parameter to force new cache

### Issue: "LinkedIn requires authentication"
**Solution:** LinkedIn Post Inspector requires login
- Use Facebook debugger instead (works without login)
- Or test with LinkedIn mobile app (paste link in message to yourself)

---

## Success Metrics

✅ **curl tests** return `summary_large_image` for Twitter card
✅ **curl tests** return custom title/description for all content types
✅ **Facebook Debugger** shows correct preview
✅ **Twitter Card Validator** shows large image preview
✅ **Real-world sharing** shows rich previews on all platforms

---

## Next Steps

1. Commit and deploy changes
2. Wait 15 minutes for Cloudflare propagation
3. Run verification curl commands
4. Clear platform caches using tools above
5. Test real-world sharing on each platform
6. Document any remaining issues

---

**Handoff Complete!**
*All code changes ready for deployment*

Last updated: 2025-12-18
Related: [Phase 7 Completion Handoff](2025-12-18-phase-7-completion-handoff.md)
