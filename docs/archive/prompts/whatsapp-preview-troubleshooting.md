# WhatsApp Link Preview Troubleshooting - Handoff Prompt

**Use this prompt when WhatsApp/Telegram shows topic text but no clickable link**

---

## Prompt for New Session

```
I need help troubleshooting WhatsApp link preview issues for Georgetown Rotary speakers.

PROBLEM:
When sharing speaker URLs in WhatsApp/Telegram, the preview shows:
- ✅ Speaker topic text (e.g., "The Application of Permaculture")
- ❌ NO clickable link below the topic
- ❌ Just plain text, not a hyperlink

Expected behavior:
- Should show topic text
- Should show clickable URL below topic
- Should allow users to tap and open the link

CURRENT IMPLEMENTATION:
We have a Cloudflare Pages Function that injects Open Graph meta tags:
- File: apps/georgetown/functions/_middleware.ts
- Detects WhatsApp/Telegram user agents
- Fetches speaker data from Supabase
- Injects speaker name in og:title
- Injects topic in og:description
- Returns modified HTML to crawler

CONTEXT FILES TO READ:
1. apps/georgetown/functions/_middleware.ts - Edge function implementation
2. apps/georgetown/index.html - Default meta tags
3. apps/georgetown/src/utils/metaTags.ts - Dynamic meta tag updates
4. apps/georgetown/docs/adr/002-social-sharing-open-graph-limitations.md - Architecture

SYMPTOMS:
- WhatsApp shows topic text correctly
- WhatsApp does NOT show clickable URL
- Telegram shows same behavior
- Desktop WhatsApp Web shows same issue

QUESTIONS TO INVESTIGATE:
1. Is og:url meta tag being set correctly?
2. Is the URL in og:url a full absolute URL?
3. Are we missing twitter:url or other required tags?
4. Is WhatsApp caching old preview without URL?
5. Do we need to add canonical link tag?

TESTING COMMANDS:
Test what WhatsApp sees:
curl -H "User-Agent: WhatsApp/2.0" https://georgetown-rotary.pages.dev/speakers/[uuid] | grep -E "(og:url|twitter:url|canonical)"

Expected output should include:
<meta property="og:url" content="https://georgetown-rotary.pages.dev/speakers/[uuid]" />

ACCEPTANCE CRITERIA:
After fix, WhatsApp preview should show:
1. Speaker name as title
2. Topic as description
3. Clickable URL link below description
4. URL should be the full speaker URL

START BY:
1. Reading the _middleware.ts function
2. Checking if og:url is being set
3. Verifying the URL format (absolute vs relative)
4. Testing with curl to see actual meta tags
5. Comparing to working WhatsApp preview examples

ADDITIONAL CONTEXT:
- We recently deployed hybrid modal + URL routing
- Share URLs changed from /speakers?id=abc to /speakers/abc
- Cloudflare function was just deployed
- This is the first test of the function in production
```

---

## Alternative: Quick Debug Prompt

```
WhatsApp link preview issue:

Shows: Topic text ✅
Missing: Clickable URL link ❌

Check apps/georgetown/functions/_middleware.ts

Is og:url being set correctly? Should be:
<meta property="og:url" content="https://full-domain.com/speakers/uuid" />

Test with:
curl -H "User-Agent: WhatsApp/2.0" https://georgetown-rotary.pages.dev/speakers/[uuid] | grep og:url

Fix if missing or incorrect format.
```

---

## Diagnostic Checklist

Before troubleshooting, gather this information:

### 1. Get the Actual Speaker URL
```
What URL are you sharing?
Example: https://georgetown-rotary.pages.dev/speakers/abc-123-def-456
```

### 2. Test What WhatsApp Sees
```bash
curl -H "User-Agent: WhatsApp/2.0" [YOUR-URL] > whatsapp-view.html
grep -E "(og:|twitter:|canonical)" whatsapp-view.html
```

### 3. Check Required Meta Tags

WhatsApp requires these tags:
- [ ] `<meta property="og:title" content="..." />` - Speaker name
- [ ] `<meta property="og:description" content="..." />` - Topic
- [ ] `<meta property="og:url" content="..." />` - **FULL absolute URL**
- [ ] `<meta property="og:type" content="website" />`
- [ ] `<meta property="og:image" content="..." />` - Optional but recommended

### 4. Common Issues & Fixes

**Issue:** `og:url` is empty or missing
```typescript
// BAD - in _middleware.ts
modifiedHtml.replace(
  /<meta property="og:url" content="[^"]*" \/>/,
  `<meta property="og:url" content="" />` // Empty!
)

// GOOD
modifiedHtml.replace(
  /<meta property="og:url" content="[^"]*" \/>/,
  `<meta property="og:url" content="${url.origin}/speakers/${speaker.id}" />`
)
```

**Issue:** `og:url` is relative, not absolute
```typescript
// BAD
content="/speakers/abc-123"

// GOOD
content="https://georgetown-rotary.pages.dev/speakers/abc-123"
```

**Issue:** `og:url` not being replaced in HTML
```typescript
// Check if regex matches
const hasOgUrl = html.includes('og:url')
console.log('Has og:url tag:', hasOgUrl)

// If missing, add it instead of replace
if (!html.includes('og:url')) {
  // Insert new tag
  html = html.replace(
    '</head>',
    `<meta property="og:url" content="${fullUrl}" />\n</head>`
  )
}
```

**Issue:** WhatsApp cache (old preview)
```
1. Delete the WhatsApp chat
2. Share the link again in a NEW chat
3. WhatsApp refreshes preview for new chats
```

### 5. Reference: Working Example

A correct WhatsApp preview should have HTML like:
```html
<meta property="og:type" content="website" />
<meta property="og:title" content="Dr. Baskaran Gobala" />
<meta property="og:description" content="The Application of Permaculture" />
<meta property="og:url" content="https://georgetown-rotary.pages.dev/speakers/abc-123-def-456" />
<meta property="og:image" content="https://georgetown-rotary.pages.dev/path/to/image.jpg" />
```

---

## Specific Code to Check

**In `apps/georgetown/functions/_middleware.ts`:**

Look for this section (around line 130-160):
```typescript
function injectMetaTags(html: string, meta: {...}): string {
  // Check this line specifically
  .replace(
    /<meta property="og:url" content="[^"]*" \/>/,
    `<meta property="og:url" content="${escapeHtml(meta.url)}" />`
  )
}
```

**Verify `meta.url` contains full URL:**
```typescript
// When calling injectMetaTags, ensure:
const modifiedHtml = injectMetaTags(html, {
  title: speaker.name,
  description: speaker.topic || '...',
  image: speaker.portrait_url || '',
  url: `${url.origin}/speakers/${speaker.id}`, // ← Must be FULL URL
})
```

---

## Quick Fix (If You Find the Issue)

**If `og:url` is missing/incorrect in _middleware.ts:**

1. Update the `injectMetaTags()` function
2. Ensure `meta.url` is passed correctly
3. Test locally with curl
4. Commit and push
5. Wait for Cloudflare deployment (~2 min)
6. Clear WhatsApp cache (delete chat)
7. Test again in fresh chat

---

## Success Criteria

After fix, `curl` command should show:
```html
<meta property="og:url" content="https://georgetown-rotary.pages.dev/speakers/abc-123" />
```

And WhatsApp preview should show:
```
Dr. Baskaran Gobala
The Application of Permaculture
https://georgetown-rotary.pages.dev/speakers/abc-123  ← Clickable link
```

---

## Related Files

- `apps/georgetown/functions/_middleware.ts` - Main fix location
- `apps/georgetown/index.html` - Default og:url tag
- `apps/georgetown/src/utils/metaTags.ts` - Client-side (doesn't affect WhatsApp)
- `apps/georgetown/docs/adr/002-social-sharing-open-graph-limitations.md` - Architecture

---

## Example curl Output (What You Should See)

```bash
$ curl -H "User-Agent: WhatsApp/2.0" https://georgetown-rotary.pages.dev/speakers/abc-123

<!doctype html>
<html lang="en">
  <head>
    ...
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Dr. Baskaran Gobala" />
    <meta property="og:description" content="The Application of Permaculture" />
    <meta property="og:url" content="https://georgetown-rotary.pages.dev/speakers/abc-123" />
    <meta property="og:image" content="" />
    ...
  </head>
</html>
```

The `og:url` line is critical for WhatsApp to show the clickable link!

---

**Document Status:** Ready for troubleshooting
**Created:** 2025-12-17
**Priority:** High (affects user sharing experience)
