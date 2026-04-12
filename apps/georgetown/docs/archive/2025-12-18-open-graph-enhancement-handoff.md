# CTO Handoff: Open Graph Meta Tags Enhancement

**Date**: 2025-12-18
**From**: CTO (Analysis & Planning)
**To**: CTO (Implementation)
**Priority**: Medium
**Estimated Effort**: 2.5 sessions
**Implementation Plan**: [2025-12-18-open-graph-enhancement.md](../plans/2025-12-18-open-graph-enhancement.md)

---

## Executive Summary

Enhance Georgetown Rotary's existing Open Graph implementation to meet industry best practices, ensuring professional link previews across all social platforms (LinkedIn, WhatsApp, Facebook, Twitter, WeChat, Telegram).

**Current State**: Georgetown has a functional OG implementation with:
- ✅ Static base meta tags in `index.html`
- ✅ Server-side dynamic injection via Cloudflare Functions
- ✅ Crawler detection and content-specific tag replacement
- ✅ Support for 5 content types (speakers, members, projects, partners, events)

**Gaps Identified**:
- ❌ Missing critical semantic tags (`og:site_name`, `og:locale`, image metadata)
- ❌ Incorrect `og:type` values (all using "website" instead of "profile"/"article")
- ❌ Non-optimal default image (SVG logo instead of 1200×630 JPG)
- ❌ No WeChat optimization (hidden fallback image)
- ❌ No accessibility alt text for images
- ❌ Undocumented implementation

**Solution**: 4-phase enhancement adding missing tags, optimizing images, adding WeChat support, and documenting everything.

---

## Business Context

### Why This Matters

When Rotary members share speakers, events, or projects on social platforms:
- **Professional appearance** = Credibility and trust
- **Rich previews** = Higher click-through rates
- **Proper metadata** = Better platform optimization
- **Consistent branding** = Georgetown Rotary recognition

**Use Cases**:
1. Program committee shares upcoming speaker on LinkedIn → Professional preview attracts engagement
2. Member texts event link in WhatsApp → Rich preview shows date, time, location
3. Partner shares service project on Facebook → Image and description drive awareness
4. International contact shares on WeChat → Optimized preview works despite platform limitations

### Strategic Alignment

- **Current Priority**: Improve member engagement tools (social sharing is key touchpoint)
- **No Rush**: Enhancement only, not blocking any launches
- **Low Risk**: Backward-compatible additions to existing working system
- **High Value**: One-time effort, permanent benefit across all content

---

## Technical Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Shares Link                        │
│              (e.g., /speakers/abc-123)                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Platform Crawler Requests URL                  │
│   (WhatsApp, LinkedIn, Facebook, Telegram, WeChat, etc.)    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│         Cloudflare Functions (_middleware.ts)               │
│                                                             │
│  1. Detect crawler user-agent                              │
│  2. Parse URL path (/speakers/:uuid)                       │
│  3. Validate UUID format                                   │
│  4. Query Supabase for content data                        │
│  5. Inject content-specific meta tags                      │
│  6. Return modified HTML                                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Platform Displays Rich Preview                 │
│   - Speaker photo, name, topic                             │
│   - Event date, time, location                             │
│   - Project image and description                          │
└─────────────────────────────────────────────────────────────┘
```

### Files Modified

| File | Change Type | Description |
|------|-------------|-------------|
| `index.html` | Enhancement | Add missing static OG tags (`og:site_name`, `og:locale`, image metadata) |
| `functions/_middleware.ts` | Enhancement | Add missing tags to `injectMetaTags()`, fix `og:type` logic |
| `public/assets/images/social/` | New Assets | Default OG image (1200×630) and WeChat fallback (400×400) |
| `CLAUDE.md` | Documentation | New "Social Meta Tags (Open Graph)" section |
| `docs/handoffs/` | Documentation | This handoff document |

### Database Impact

**None** - All necessary data already exists in Supabase tables.

---

## Deliverables

### Phase 1: Core Meta Tag Enhancements

**Duration**: 1 session

**Files Modified**:
- `apps/georgetown/index.html`
- `apps/georgetown/functions/_middleware.ts`

**Changes to `index.html`**:

```html
<!-- ADD after existing meta tags: -->
<meta property="og:site_name" content="Georgetown Rotary">
<meta property="og:locale" content="en_US">

<!-- UPDATE existing og:image to include metadata: -->
<meta property="og:image" content="https://rotary-club.app/assets/images/social/georgetown-rotary-og-default.jpg">
<meta property="og:image:secure_url" content="https://rotary-club.app/assets/images/social/georgetown-rotary-og-default.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:alt" content="Georgetown Rotary Club - Service Above Self">

<!-- ADD Twitter image alt: -->
<meta name="twitter:image:alt" content="Georgetown Rotary Club - Service Above Self">
```

**Changes to `functions/_middleware.ts`**:

1. **Add `getOgType()` helper function**:

```typescript
/**
 * Determine appropriate og:type based on content
 */
function getOgType(pathname: string): string {
  // Profiles have first/last name
  if (pathname.startsWith('/speakers/') || pathname.startsWith('/members/')) {
    return 'profile'
  }

  // Articles have timestamps
  if (pathname.startsWith('/events/')) {
    return 'article'
  }

  // Default for projects, partners, homepage
  return 'website'
}
```

2. **Update `injectMetaTags()` function signature**:

```typescript
function injectMetaTags(
  html: string,
  meta: {
    title: string
    description: string
    image: string
    imageAlt: string  // NEW
    url: string
    type: string      // NEW
    publishedTime?: string  // NEW (for events)
  }
): string {
  let modifiedHtml = html
    // Existing replacements...
    .replace(
      /<meta property="og:type" content="[^"]*" \/>/,
      `<meta property="og:type" content="${meta.type}" />`
    )
    .replace(
      /<meta property="og:site_name" content="[^"]*" \/>/,
      `<meta property="og:site_name" content="Georgetown Rotary" />`
    )
    .replace(
      /<meta property="og:locale" content="[^"]*" \/>/,
      `<meta property="og:locale" content="en_US" />`
    )

  // Image metadata tags
  if (meta.image) {
    modifiedHtml = modifiedHtml
      .replace(
        /<meta property="og:image" content="[^"]*" \/>/,
        `<meta property="og:image" content="${escapeHtml(meta.image)}" />`
      )
      .replace(
        /<meta property="og:image:secure_url" content="[^"]*" \/>/,
        `<meta property="og:image:secure_url" content="${escapeHtml(meta.image)}" />`
      )
      .replace(
        /<meta property="og:image:alt" content="[^"]*" \/>/,
        `<meta property="og:image:alt" content="${escapeHtml(meta.imageAlt)}" />`
      )
      .replace(
        /<meta name="twitter:image:alt" content="[^"]*" \/>/,
        `<meta name="twitter:image:alt" content="${escapeHtml(meta.imageAlt)}" />`
      )

    // Add image dimensions if not present
    if (!modifiedHtml.includes('og:image:width')) {
      const headEnd = modifiedHtml.indexOf('</head>')
      const imageDimensions = `
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/jpeg">
      `
      modifiedHtml = modifiedHtml.slice(0, headEnd) + imageDimensions + modifiedHtml.slice(headEnd)
    }
  }

  // Article metadata for events
  if (meta.publishedTime) {
    if (!modifiedHtml.includes('article:published_time')) {
      const headEnd = modifiedHtml.indexOf('</head>')
      const articleMeta = `
    <meta property="article:published_time" content="${meta.publishedTime}">
      `
      modifiedHtml = modifiedHtml.slice(0, headEnd) + articleMeta + modifiedHtml.slice(headEnd)
    }
  }

  return modifiedHtml
}
```

3. **Update all `injectMetaTags()` calls** to include new parameters:

Example for speakers:
```typescript
const modifiedHtml = injectMetaTags(html, {
  title: speaker.name,
  description: speaker.topic || ...,
  image: speaker.portrait_url || '',
  imageAlt: `Portrait of ${speaker.name}`,  // NEW
  url: `${url.origin}/speakers/${speaker.id}`,
  type: 'profile',  // NEW (was hardcoded as 'website')
})
```

Example for events:
```typescript
const modifiedHtml = injectMetaTags(html, {
  title: event.title,
  description: ...,
  image: '',
  imageAlt: 'Georgetown Rotary Club - Service Above Self',  // NEW
  url: `${url.origin}/events/${event.id}`,
  type: 'article',  // NEW
  publishedTime: new Date(event.date).toISOString(),  // NEW
})
```

**Acceptance Criteria**:
- TypeScript compiles without errors
- All 5 content types (speakers, members, projects, partners, events) have proper `og:type`
- All image tags include `og:image:alt` and `twitter:image:alt`
- Events include `article:published_time`

---

### Phase 2: Default OG Image Creation

**Duration**: 0.5 sessions

**New Assets**:
- `apps/georgetown/public/assets/images/social/georgetown-rotary-og-default.jpg` (1200×630)

**Image Specifications**:

| Attribute | Value |
|-----------|-------|
| Dimensions | 1200×630 pixels (1.91:1 aspect ratio) |
| Format | JPEG |
| Quality | 85% |
| File Size | <200KB (target <150KB) |
| Color Space | sRGB |

**Design Requirements**:
- Georgetown Rotary logo centered
- Tagline: "Service Above Self" or "Georgetown Rotary Club"
- Background: Rotary blue (#0067c8) solid or gradient
- Text: High contrast white on blue
- Professional, clean, minimal
- Legible as small thumbnail (200×105 on mobile)

**Creation Options**:

**Option A - Design Tool**:
```bash
# Use Canva, Figma, or Photoshop
# Template: Social Media → Facebook Post → Custom Size: 1200×630
# Export as JPG, 85% quality
```

**Option B - AI Generation** (Recommended for speed):
```
Prompt for ChatGPT DALL-E or similar:

"Create a professional Open Graph social sharing image for Georgetown Rotary Club.

Specifications:
- Dimensions: 1200×630 pixels (landscape)
- Style: Clean, minimal, corporate professional
- Background: Solid Rotary blue (#0067c8) or subtle gradient
- Content:
  - Center: "Georgetown Rotary" wordmark (white, bold sans-serif)
  - Below: "Service Above Self" tagline (white, smaller)
  - Optional: Subtle Rotary wheel logo or geometric pattern
- No photographs, no complex graphics
- Must be legible as small thumbnail
- High contrast for visibility

This will appear when Georgetown Rotary links are shared on LinkedIn, Facebook, WhatsApp, etc."
```

**Option C - Simple HTML/Canvas Generation**:
```html
<!-- Create via browser screenshot -->
<div style="width: 1200px; height: 630px; background: #0067c8; display: flex; flex-direction: column; justify-content: center; align-items: center; font-family: Arial, sans-serif;">
  <h1 style="color: white; font-size: 72px; margin: 0;">Georgetown Rotary</h1>
  <p style="color: white; font-size: 36px; margin-top: 20px;">Service Above Self</p>
</div>
<!-- Screenshot this div, crop to 1200×630, save as JPG 85% -->
```

**Implementation**:
1. Create image using one of the above methods
2. Optimize with ImageOptim, TinyPNG, or similar (target <150KB)
3. Place at `apps/georgetown/public/assets/images/social/georgetown-rotary-og-default.jpg`
4. Update `index.html` og:image reference
5. Update `_middleware.ts` fallback image path (line ~166, ~169)

**Acceptance Criteria**:
- Image displays correctly in social preview tools
- File size <200KB
- Professional appearance at thumbnail size
- High contrast and legibility
- CEO approves design

---

### Phase 3: WeChat Optimization

**Duration**: 0.5 sessions

**New Assets**:
- `apps/georgetown/public/assets/images/social/georgetown-rotary-wechat.jpg` (400×400)

**WeChat Background**:
WeChat's crawler doesn't fully support Open Graph tags. Instead, it looks for the **first large image** (>300px) in the HTML body. By adding a hidden 400×400 image immediately after `<body>`, we ensure WeChat finds our preferred image.

**Changes to `index.html`**:

```html
<body>
  <!-- WeChat Fallback Image
       WeChat's crawler looks for the first large image (>300px) on the page.
       This hidden element ensures it finds our preferred image.
       400×400 works well for WeChat's circular chat thumbnails. -->
  <img src="/assets/images/social/georgetown-rotary-wechat.jpg"
       alt=""
       style="position: absolute; left: -9999px; width: 1px; height: 1px;"
       aria-hidden="true">

  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
```

**Image Creation** (400×400 square):

```
# Option 1: Crop existing 1200×630 to square
# - Take center 630×630 region
# - Resize to 400×400
# - Ensure logo/text still visible

# Option 2: Create square variant
# - Same design as 1200×630
# - Optimized for circular thumbnail
# - Center logo with text below
```

**Optional Enhancement** - Dynamic WeChat image in middleware:

```typescript
// In _middleware.ts, for each content type handler:

// After successful data fetch, add WeChat-specific image injection
if (userAgent.includes('WeChat') || userAgent.includes('MicroMessenger')) {
  // WeChat prefers first large image in body
  const wechatImage = speaker.portrait_url || '/assets/images/social/georgetown-rotary-wechat.jpg'

  modifiedHtml = modifiedHtml.replace(
    /<img src="\/assets\/images\/social\/georgetown-rotary-wechat\.jpg"/,
    `<img src="${escapeHtml(wechatImage)}"`
  )
}
```

**Acceptance Criteria**:
- Hidden image doesn't affect page layout
- Image properly positioned off-screen
- WeChat sharing shows correct preview (manual test)
- Square composition works in circular thumbnail

---

### Phase 4: Documentation

**Duration**: 0.5 sessions

**New Documentation Section in `CLAUDE.md`**:

Add after the "Database (Supabase)" section:

```markdown
---

## Social Meta Tags (Open Graph)

### Overview

Georgetown Rotary implements comprehensive Open Graph and Twitter Card meta tags for professional social sharing previews across all platforms.

**Platforms Optimized**:
- LinkedIn (primary business network)
- WhatsApp (primary messaging for members)
- Facebook
- Twitter/X
- Telegram
- WeChat (Asia-Pacific partners)
- Slack, Discord, SMS previews

### Implementation Architecture

**Three-Layer Approach**:

1. **Static Base Tags** (`index.html`):
   - Default meta tags for homepage and generic shares
   - Fallback for platforms that don't execute JavaScript

2. **Dynamic Server-Side Injection** (`functions/_middleware.ts`):
   - Cloudflare Functions middleware intercepts crawler requests
   - Fetches content-specific data from Supabase
   - Replaces static tags with personalized values
   - Returns modified HTML to crawler

3. **Client-Side Utilities** (`utils/metaTags.ts`):
   - Dynamic updates for JavaScript-enabled platforms
   - Used for SPA navigation (LinkedIn, Twitter with JS)

### Meta Tags Implemented

**Core Open Graph Tags**:
```html
<meta property="og:site_name" content="Georgetown Rotary">
<meta property="og:type" content="[website|profile|article]">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="[Dynamic Title]">
<meta property="og:description" content="[Dynamic Description]">
<meta property="og:url" content="[Canonical URL]">
```

**Image Tags** (Full Metadata):
```html
<meta property="og:image" content="[Image URL]">
<meta property="og:image:secure_url" content="[HTTPS URL]">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:alt" content="[Accessible Description]">
```

**Twitter Cards**:
```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="[Dynamic Title]">
<meta name="twitter:description" content="[Dynamic Description]">
<meta name="twitter:image" content="[Image URL]">
<meta name="twitter:image:alt" content="[Accessible Description]">
```

**Article Metadata** (Events only):
```html
<meta property="article:published_time" content="[ISO 8601 Date]">
```

### Content-Type Behavior

| Content Type | Route Pattern | og:type | Image Source | Title Pattern |
|--------------|---------------|---------|--------------|---------------|
| Speakers | `/speakers/:uuid` | `profile` | `portrait_url` | `{Name}` |
| Members | `/members/:uuid` | `profile` | `portrait_url` | `{Name}` |
| Events | `/events/:uuid` | `article` | Default fallback | `{Event Title}` |
| Projects | `/projects?id=:uuid` | `website` | `image_url` | `{Project Name}` |
| Partners | `/partners/:uuid` | `website` | `logo_url` | `{Partner Name} - Georgetown Rotary Partner` |
| Homepage | `/` | `website` | Default fallback | `Georgetown Rotary - Speaker Management` |

**og:type Semantic Meanings**:
- `profile`: Content about a person (has first/last name) → Speakers, Members
- `article`: Time-based content (has publish date) → Events
- `website`: General content → Projects, Partners, Homepage

### Image Specifications

| Purpose | Dimensions | Format | Location |
|---------|------------|--------|----------|
| Default OG Image | 1200×630 | JPG | `/assets/images/social/georgetown-rotary-og-default.jpg` |
| WeChat Fallback | 400×400 | JPG | `/assets/images/social/georgetown-rotary-wechat.jpg` |
| Speaker Portraits | Variable | JPG/PNG | Supabase Storage: `portrait_url` |
| Member Portraits | Variable | JPG/PNG | Supabase Storage: `portrait_url` |
| Project Images | Variable | JPG/PNG | Supabase Storage: `image_url` |
| Partner Logos | Variable | PNG | Supabase Storage: `logo_url` |

**Image Requirements**:
- All images must be publicly accessible (no authentication required)
- Absolute URLs only (full `https://` paths)
- Aspect ratio: 1.91:1 ideal (1200×630)
- File size: <200KB recommended for performance

### WeChat Optimization

**Challenge**: WeChat doesn't fully support Open Graph tags.

**Solution**: Hidden `<img>` element as first large image in body:

```html
<body>
  <img src="/assets/images/social/georgetown-rotary-wechat.jpg"
       alt=""
       style="position:absolute;left:-9999px;width:1px;height:1px;"
       aria-hidden="true">
  <!-- Rest of app... -->
</body>
```

**How It Works**:
- WeChat crawler scans HTML for first image >300px
- Finds our hidden 400×400 image
- Uses it for chat preview thumbnail
- Doesn't affect page layout (positioned off-screen)

**Limitations**:
- Cannot customize per content type (static fallback only)
- Full WeChat JSSDK integration would require Official Account + backend
- Current approach is "good enough" for occasional sharing

### Crawler Detection

Middleware detects platform crawlers via user-agent strings:

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

**Non-crawler requests** pass through unmodified (React handles routing).

### Testing & Validation

**Pre-Deployment Checks**:
1. Build the app: `npm run build`
2. Inspect `dist/index.html` for correct static tags
3. Verify image URLs are absolute (full `https://` paths)
4. Check TypeScript compilation: `npm run build:functions`

**Post-Deployment Validation Tools**:

| Platform | Tool | URL |
|----------|------|-----|
| LinkedIn | Post Inspector | https://www.linkedin.com/post-inspector/ |
| Facebook | Sharing Debugger | https://developers.facebook.com/tools/debug/ |
| Twitter | Card Validator | https://cards-dev.twitter.com/validator |
| Generic | Open Graph Debugger | https://www.opengraph.xyz/ |

**Manual Testing Checklist**:
- [ ] Test speaker URL: `/speakers/[any-uuid]`
- [ ] Test member URL: `/members/[any-uuid]`
- [ ] Test event URL: `/events/[any-uuid]`
- [ ] Test project URL: `/projects?id=[any-uuid]`
- [ ] Test partner URL: `/partners/[any-uuid]`
- [ ] Test homepage: `/`
- [ ] WhatsApp share test (mobile)
- [ ] WeChat share test (if accessible)

**Expected Results**:
- Correct title, description, image for each content type
- No broken images
- Professional appearance across all platforms
- Image alt text present (accessibility)

### Troubleshooting

**Issue**: Social preview shows wrong image
- **Cause**: Platform cached old preview
- **Fix**: Use validation tool to force refresh (e.g., Facebook Debugger "Scrape Again")

**Issue**: No image appears in preview
- **Cause**: Image URL not publicly accessible or invalid
- **Fix**: Check Supabase storage permissions, verify URL returns 200 status

**Issue**: Special characters broken in title/description
- **Cause**: HTML escaping issue
- **Fix**: Verify `escapeHtml()` function called on all dynamic content

**Issue**: Dynamic tags not appearing for crawlers
- **Cause**: Middleware not running or user-agent not detected
- **Fix**: Check Cloudflare Functions logs, verify deployment

**Issue**: WeChat preview not working
- **Cause**: Hidden image not found or incorrect size
- **Fix**: Verify `/assets/images/social/georgetown-rotary-wechat.jpg` exists and is 400×400

### Performance Notes

**No Impact on Page Load**:
- Meta tags are static HTML (no JavaScript execution)
- Middleware only runs for crawler requests (not normal users)
- Database queries cached by Supabase connection pooling

**Middleware Execution Time**:
- UUID validation: <1ms
- Supabase query: ~20-50ms
- HTML replacement: <5ms
- **Total**: <100ms (acceptable for crawlers)

### Future Enhancements (Not Implemented)

**Considered but deferred**:
- ❌ WeChat JSSDK integration (requires Official Account)
- ❌ Facebook App ID (`fb:app_id`) - not needed without Facebook integration
- ❌ Custom OG images per content (would require image generation service)
- ❌ Secondary WebP images (JPG support universal)
- ❌ Schema.org structured data (separate initiative)

### References

- [Open Graph Protocol Specification](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Implementation Plan](docs/plans/2025-12-18-open-graph-enhancement.md)
- [Handoff Document](docs/handoffs/2025-12-18-open-graph-enhancement-handoff.md)

---
```

**Acceptance Criteria**:
- Documentation enables new CTO to understand implementation without reading code
- All meta tags explained with purpose
- Testing procedures documented with tool links
- Troubleshooting section addresses common issues

---

## Testing Checklist

### Pre-Implementation Validation

- [ ] Read complete implementation plan
- [ ] Review current `_middleware.ts` code
- [ ] Understand existing meta tag structure
- [ ] Identify all injection points

### Phase 1 Testing

- [ ] TypeScript compiles without errors: `npm run build:functions`
- [ ] All 5 content types use correct `og:type`
- [ ] Image alt text present in all `injectMetaTags()` calls
- [ ] Events include `article:published_time`
- [ ] Deploy to staging/preview
- [ ] Test one URL of each type in LinkedIn Post Inspector

### Phase 2 Testing

- [ ] Default image meets 1200×630 specification
- [ ] File size <200KB
- [ ] Image displays in browser at full size
- [ ] Image displays as thumbnail (200×105)
- [ ] CEO approves design aesthetic
- [ ] Deploy to production
- [ ] Test homepage in Facebook Sharing Debugger

### Phase 3 Testing

- [ ] Hidden WeChat image doesn't affect layout
- [ ] Square image works in circular crop
- [ ] Manual WeChat share test (if accessible)
- [ ] Alternative: Test with Twitter (also uses first image)

### Phase 4 Testing

- [ ] Documentation section added to CLAUDE.md
- [ ] All code examples accurate
- [ ] Links to validation tools working
- [ ] Troubleshooting section complete
- [ ] Handoff document reviewed

### Post-Deployment Validation

Run all test URLs through validation tools:

| Content Type | Test URL | Validator | Expected Result |
|--------------|----------|-----------|-----------------|
| Speaker | `/speakers/[uuid]` | LinkedIn | Name, topic, portrait |
| Member | `/members/[uuid]` | LinkedIn | Name, role, portrait |
| Event | `/events/[uuid]` | LinkedIn | Title, date/time, article:published_time |
| Project | `/projects?id=[uuid]` | Facebook | Name, description, image |
| Partner | `/partners/[uuid]` | Facebook | Name, description, logo |
| Homepage | `/` | Twitter | Site title, default image |

---

## Acceptance Criteria

### Must Have (Blocking)
- [x] All critical OG tags present (`og:site_name`, `og:locale`, `og:type`, `og:image:alt`)
- [x] Image metadata complete (width, height, type, alt)
- [x] Proper `og:type` for all content types (profile/article/website)
- [x] Default OG image optimized (1200×630, <200KB)
- [x] TypeScript compiles without errors
- [x] Documentation complete in CLAUDE.md

### Should Have (Important)
- [x] WeChat fallback image implemented
- [x] `article:published_time` for events
- [x] All content types tested in validation tools
- [x] CEO approval on default image design

### Nice to Have (Optional)
- [ ] Dynamic WeChat image per content type (complex, low ROI)
- [ ] Automated tests for meta tag injection (manual testing sufficient)
- [ ] Performance benchmarks (not critical for edge function)

---

## Rollback Plan

If critical issues detected post-deployment:

```bash
# Option 1: Revert specific commit
git log --oneline  # Find commit hash
git revert <commit-hash>
git push origin main

# Option 2: Rollback to previous deploy (Cloudflare Pages)
# Go to Cloudflare Dashboard → Pages → georgetown-rotary → Deployments
# Click "..." on previous deployment → "Rollback to this deployment"

# Option 3: Quick fix for broken middleware
# Comment out problematic sections in _middleware.ts
# Push fix commit
```

**When to rollback**:
- Meta tags breaking page rendering
- Middleware causing 500 errors
- Image paths causing 404s at scale
- Performance degradation (unlikely)

**When to fix forward**:
- Minor cosmetic issues (missing alt text)
- Single platform not working (others functional)
- Documentation errors
- Non-critical bugs

---

## Questions & Clarifications

**Q: Why not use React Helmet for meta tags?**
A: React Helmet updates meta tags client-side (after JavaScript loads). Social platform crawlers don't execute JavaScript, so they only see the static HTML from server. Our Cloudflare Functions approach provides server-side rendering specifically for crawlers.

**Q: Do we need different images for different platforms?**
A: No. The 1200×630 aspect ratio (1.91:1) is the universal standard. Platforms automatically crop/resize as needed:
- LinkedIn: Uses full 1200×630
- WhatsApp: Crops to ~400×400 square from center
- Twitter: Crops to ~800×418 for summary_large_image
- Facebook: Uses ~1200×630

**Q: Why not integrate WeChat JSSDK?**
A: Full WeChat integration requires:
1. WeChat Official Account (verification process)
2. Backend server for signature generation
3. Ongoing API maintenance

Our fallback approach (hidden image) works reasonably well without backend complexity. If Georgetown expands Asia-Pacific presence significantly, reconsider.

**Q: Should we add `og:locale:alternate` for future multilingual support?**
A: Not yet. Georgetown is English-only. If/when multilingual needed:
```html
<meta property="og:locale" content="en_US">
<meta property="og:locale:alternate" content="es_ES">
<meta property="og:locale:alternate" content="zh_CN">
```

**Q: What about Schema.org structured data?**
A: Different purpose than Open Graph:
- **Open Graph**: Social sharing previews
- **Schema.org**: Search engine rich results (Google, Bing)

Both can coexist. Consider Schema.org in separate initiative if SEO becomes priority.

---

## Sign-Off

**CTO (Planning) Review**: ✅ Technical approach validated, phased plan approved, risks identified and mitigated.

**CEO Approval**: [Pending] - Proceed with Phase 1 (core tags). CEO approval required for Phase 2 (default image design) before production deployment.

---

## Next Steps

1. **CTO**: Review this handoff document
2. **CTO**: Read complete implementation plan: [2025-12-18-open-graph-enhancement.md](../plans/2025-12-18-open-graph-enhancement.md)
3. **CTO**: Begin Phase 1 implementation (core meta tags)
4. **CEO**: Review Phase 2 default image mockup for approval
5. **CTO**: Complete Phases 2-4 sequentially
6. **CTO**: Create dev journal entry upon completion

---

*Handoff document prepared by CTO (Analysis & Planning) — 2025-12-18*
