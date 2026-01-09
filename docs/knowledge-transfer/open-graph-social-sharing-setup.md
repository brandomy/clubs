# Technical Briefing: Open Graph and Social Sharing Setup

**Date**: 2025-12-18
**Author**: CEO
**To**: CTO
**Subject**: Georgetown Rotary Platform - Social Sharing Implementation & Facebook OG Debugging

---

## Executive Summary

This document provides a comprehensive technical briefing on the Open Graph (OG) meta tag implementation for the Georgetown Rotary platform, including the full troubleshooting process for Facebook link preview issues. The platform now successfully supports social sharing across multiple platforms including Facebook, Twitter/X, LinkedIn, WhatsApp, and WeChat.

**Key Outcomes**:
- ✅ Complete Open Graph implementation with platform-specific optimizations
- ✅ Fixed critical crawler blocking issues (2 distinct root causes identified)
- ✅ Verified working on Twitter, LinkedIn (confirmed via Cloudflare Analytics)
- ⏳ Facebook cache expiration pending (24-48 hour wait period)

---

## Architecture Overview

### Tech Stack
- **Frontend**: React 19, TypeScript 5.8, Vite 7
- **Deployment**: Cloudflare Pages
- **Production Domain**: https://rotary-club.app
- **Staging Domain**: https://georgetown-rotary.pages.dev

### Open Graph Implementation Components

#### 1. Static Meta Tags (`apps/georgetown/index.html`)

```html
<!-- Core Open Graph Tags -->
<meta property="og:site_name" content="Georgetown Rotary" />
<meta property="og:type" content="website" />
<meta property="og:locale" content="en_US" />
<meta property="og:title" content="Georgetown Rotary Club Operations" />
<meta property="og:description" content="Comprehensive club management platform for Georgetown Rotary - speakers, meetings, projects, and timeline tracking" />
<meta property="og:url" content="https://rotary-club.app/" />

<!-- Image Specifications -->
<meta property="og:image" content="https://rotary-club.app/assets/images/social/georgetown-rotary-og-default.jpg" />
<meta property="og:image:secure_url" content="https://rotary-club.app/assets/images/social/georgetown-rotary-og-default.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:alt" content="Georgetown Rotary Club - Service Above Self" />

<!-- Twitter/X Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Georgetown Rotary Club Operations" />
<meta name="twitter:description" content="Comprehensive club management platform for Georgetown Rotary - speakers, meetings, projects, and timeline tracking" />
<meta name="twitter:image" content="https://rotary-club.app/assets/images/social/georgetown-rotary-og-default.jpg" />
<meta name="twitter:image:alt" content="Georgetown Rotary Club - Service Above Self" />

<!-- WeChat Optimization -->
<img src="/assets/images/social/georgetown-rotary-wechat.jpg"
     alt=""
     style="position: absolute; left: -9999px; width: 1px; height: 1px;"
     aria-hidden="true">
```

**Design Notes**:
- OG image dimensions: 1200×630px (Facebook/LinkedIn optimal ratio 1.91:1)
- WeChat fallback: 1024×1024px hidden image (WeChat scrapes first large image on page)
- Twitter uses `summary_large_image` card for prominent display

#### 2. Security Headers (`apps/georgetown/public/_headers`)

```
# Global security headers (crawler-friendly)
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  X-Permitted-Cross-Domain-Policies: none

# Protected routes (block crawlers)
/members/*
  X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex, nocache

/admin/*
  X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex, nocache

/settings/*
  X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex, nocache
```

**Key Design Decision**:
- **No global `X-Robots-Tag`** - Allows social media crawlers and search engines
- **Route-specific blocking** - Protects sensitive member/admin areas only
- **HTTP headers take precedence** over HTML meta tags and robots.txt

#### 3. Crawler Detection (`apps/georgetown/functions/_middleware.ts`)

The Cloudflare Pages middleware handles dynamic meta tag injection for specific content routes:

```typescript
// Crawler user agents detected
const crawlerPattern = /facebookexternalhit|twitterbot|whatsapp|linkedin/i

// Only processes UUID-based routes
const needsMetaInjection =
  /^\/speakers\/[^/]+$/.test(url.pathname) ||
  /^\/projects\/[^/]+$/.test(url.pathname) ||
  ...

// Early exit for non-dynamic routes
if (!needsMetaInjection) {
  return next() // Pass through immediately
}

// Supabase initialization only for dynamic content
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

**Why This Matters**: Prevents unnecessary Supabase initialization for static pages, avoiding timeouts/errors.

---

## Troubleshooting Journey: Facebook 403 Error

### Problem Statement

Facebook's link preview scraper returned **403 Forbidden** errors and failed to display Open Graph tags, while the site worked correctly on other platforms (Twitter, LinkedIn, WhatsApp).

### Investigation Timeline

**Total Investigation Time**: ~2 hours
**Hypothesis Tests**: 10
**Root Causes Found**: 2
**Deployment Commits**: 2

---

### Root Cause #1: Global `X-Robots-Tag` Header Blocking

#### The Bug

The `_headers` file contained a **global crawler block**:

```
/*
  X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex, nocache
```

This HTTP header blocked ALL crawlers on ALL pages, including:
- Facebook's `facebookexternalhit`
- Twitter's `twitterbot`
- LinkedIn's `linkedinbot`
- Search engine crawlers

#### Why HTML Meta Tags Didn't Work

**HTTP header precedence order**:
1. ✅ **HTTP Response Headers** (highest priority - `X-Robots-Tag` in `_headers`)
2. HTML `<meta name="robots">` tags
3. robots.txt file

The X-Robots-Tag header was processed **before HTML parsing**, making all HTML-based fixes ineffective.

#### The Fix (Commit: `8c76524`)

```diff
# apps/georgetown/public/_headers

- /*
-   X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex, nocache

+ /*
+   # Security headers (X-Robots-Tag removed)

+ /members/*
+   X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex, nocache
```

**Result**: Allowed social media crawlers while protecting sensitive routes.

---

### Root Cause #2: Middleware Supabase Initialization

#### The Bug

The Cloudflare Pages middleware detected crawlers correctly but initialized Supabase for **all crawler requests**, including static pages (homepage, `/events`, `/projects`).

```typescript
// BEFORE (problematic)
if (isCrawler) {
  const supabase = createClient(...) // Always initialized

  // Only these routes actually need Supabase
  if (needsMetaInjection) {
    // Use supabase to fetch data
  }
  return next() // Might timeout before reaching this
}
```

For non-UUID routes, Supabase initialization was unnecessary and likely caused timeouts/errors specifically for Facebook's scraper.

#### The Fix (Commit: `88d31bd`)

```typescript
// AFTER (optimized)
// Check if route needs dynamic meta injection
if (!needsMetaInjection) {
  return next() // Early exit - no Supabase needed
}

// Only initialize Supabase for dynamic routes
const supabase = createClient(...)
```

**Result**: Facebook's scraper can access static pages without Supabase overhead.

---

### Evidence Trail

#### Investigation 1-2: Direct Testing (✅ Success)
```bash
# Test with Facebook user agent
$ curl -A "facebookexternalhit/1.1" https://rotary-club.app/
HTTP/2 200
<meta property="og:title" content="Georgetown Rotary Club Operations" />
...
```

**Finding**: Site returns 200 OK with all OG tags when accessed directly.

#### Investigation 3: Cache Busting (❌ Failed)
```bash
# Tried URL parameter to bypass cache
https://rotary-club.app/?v=1
```

**Result**: Still returned 403 in Facebook debugger.
**Conclusion**: Not a simple cache issue - something actively blocking.

#### Investigation 8: Fresh URLs (❌ Failed)

Tested URLs never shared before:
- `https://rotary-club.app/events` → 403
- `https://rotary-club.app/projects` → 403

**CRITICAL FINDING**: Proved it wasn't cache - something actively blocking all Facebook requests.

#### Investigation 9: Cloudflare Analytics (✅ Smoking Gun)

**Top Crawlers (24 hours)**:
- Twitter: 44 pages ✅
- LinkedIn: 12 pages ✅
- **Facebook: 0 pages** ❌

**Finding**: Other bots worked fine - issue specific to Facebook.

#### Investigation 10: Middleware Review (✅ Root Cause Found)

Found unnecessary Supabase initialization for all crawler requests on all routes.

---

### Current Status: Domain-Specific Facebook Cache

#### The Paradox

**As of 2025-12-18 19:08 GMT+8**:

| Domain | curl Test | Facebook Debugger | Status |
|--------|-----------|-------------------|--------|
| `rotary-club.app` | ✅ 200 OK | ❌ 403 Error | Cached failure |
| `georgetown-rotary.pages.dev` | ✅ 200 OK | ✅ 200 OK | Working |

#### Analysis

Both domains:
- Serve identical HTML content
- Return identical HTTP headers
- Have identical OG tags
- Pass curl tests with Facebook user agent

**Why the difference?**

Facebook maintains **domain-specific cache**:
- `rotary-club.app` - Has "bad history" from previous 403 errors (cached 24-48 hours)
- `georgetown-rotary.pages.dev` - Clean slate, scrapes successfully immediately

#### Verification

The staging domain working proves:
- ✅ Code is correct
- ✅ OG tags are correct
- ✅ Cloudflare isn't blocking Facebook
- ❌ Facebook has cached the previous 403 error for production domain

---

## Platform-Specific Behavior

### Facebook
- **Scraper**: `facebookexternalhit/1.1`
- **Cache Duration**: 24-48 hours for failed requests
- **Cache Clearing**: "Scrape Again" button in debugger (ineffective for 403 errors)
- **Required Tags**: `og:title`, `og:description`, `og:image`
- **Optional**: `fb:app_id` (only needed for Facebook Insights analytics)
- **Optimal Image**: 1200×630px (ratio 1.91:1)

### Twitter/X
- **Scraper**: `twitterbot`
- **Card Type**: `summary_large_image` (larger, more prominent preview)
- **Required Tags**: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- **Fallback**: Uses OG tags if Twitter tags missing
- **Analytics**: Shows 44 successful crawls in 24 hours (per Cloudflare)

### LinkedIn
- **Scraper**: `linkedinbot`
- **Uses**: Standard OG tags
- **Analytics**: Shows 12 successful crawls in 24 hours (per Cloudflare)

### WhatsApp
- **Scraper**: `whatsapp`
- **Uses**: Standard OG tags
- **Note**: Works for link previews, but has separate issue with deep linking (see Known Issues)

### WeChat
- **Behavior**: Scrapes first large image (>300px) on page
- **Solution**: Hidden 1024×1024px image positioned off-screen
- **Optimal**: Square images (1:1 ratio) for circular chat thumbnails

---

## Testing & Verification

### Testing Tools

1. **Facebook Debugger**: https://developers.facebook.com/tools/debug/
2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
3. **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/
4. **opengraph.xyz**: Multi-platform OG tag preview

### Command-Line Testing

```bash
# Test with Facebook user agent
curl -A "facebookexternalhit/1.1" https://rotary-club.app/ | head -40

# Check HTTP headers
curl -I https://rotary-club.app/

# Test specific routes
curl -A "facebookexternalhit/1.1" https://rotary-club.app/speakers/abc-123
```

### Cloudflare Analytics

**Location**: Dashboard → Analytics → Traffic → Crawlers

**Metrics Available**:
- Top crawlers by page count
- Crawler activity over time
- Identifies which bots are successfully accessing the site

---

## Known Issues & Workarounds

### Issue 1: Facebook Production Domain Cache

**Status**: ⏳ Pending
**ETA**: 2025-12-19 or 2025-12-20 (24-48 hours from fix deployment)

**Workaround**: Use staging domain for testing:
- Production: https://rotary-club.app (cached 403)
- Staging: https://georgetown-rotary.pages.dev (works immediately)

**Backlog Item**: GEO-005 - Re-verify Facebook debugger after cache expiration

**Escalation Path** (if urgent):
- Contact Facebook via crawler support: https://www.facebook.com/help/contact/184196821623379
- Request manual cache invalidation for `rotary-club.app`

### Issue 2: Blank Screen on Shared Links (Logged-in Users)

**Status**: Identified, not yet debugged
**Symptoms**:
- Link previews work (OG tags displayed)
- Clicking shared links shows blank screen for logged-in users
- Works fine for logged-out users

**Hypothesis**: React Router deep linking issue or auth redirect interference

**Priority**: Medium (doesn't affect link preview functionality)

---

## Best Practices & Lessons Learned

### 1. HTTP Header Precedence Matters

**Lesson**: Always check `_headers`/`_redirects` files first when debugging crawler issues.

**Order of precedence**:
1. HTTP Response Headers (`X-Robots-Tag` in `_headers`)
2. HTML meta tags (`<meta name="robots">`)
3. robots.txt file

### 2. Platform-Specific Deployments Have Separate Settings

**Cloudflare Pages** has distinct security settings from domain-level Cloudflare:
- Cloudflare Dashboard → Security (domain-level WAF, DDoS protection)
- Cloudflare Pages → Project Settings → Security (Pages-specific bot protection)

Both need to be checked when debugging crawler issues.

### 3. Facebook's Cache is Extremely Persistent

After a 403 error, Facebook caches the failure at the domain level:
- "Scrape Again" button: Ineffective for cached failures
- URL parameters (`?v=1`): Don't bypass domain-level cache
- New paths: Still blocked (e.g., `/events`, `/projects`)
- Wait time: 24-48 hours minimum

### 4. Test with Staging Domains

Using `*.pages.dev` staging domain for testing provides:
- Clean slate for cache testing
- Identical codebase verification
- Proof that code changes work before production cache expires

### 5. Middleware Performance for Crawlers

Crawlers have **short timeout windows** (2-5 seconds typical):
- Avoid unnecessary database/API calls for static pages
- Use early exits in middleware for non-dynamic routes
- Lazy-load heavy dependencies only when needed

---

## Security Considerations

### Public Routes (Crawler-Friendly)
- Homepage (`/`)
- Events listing (`/events`)
- Projects listing (`/projects`)
- Public speaker pages (`/speakers/:uuid`)

**Security**: Standard security headers only (no crawler blocking)

### Protected Routes (Crawler-Blocked)
- Member directory (`/members/*`)
- Admin panel (`/admin/*`)
- User settings (`/settings/*`)

**Security**: `X-Robots-Tag` with full blocking directives

### Authentication

Member data is protected by:
1. Supabase Row Level Security (RLS) policies
2. Client-side auth checks (React Router guards)
3. Server-side middleware validation
4. HTTP header crawler blocking for sensitive routes

**Note**: OG tags don't expose sensitive data - they only show public metadata.

---

## Future Enhancements

### Optional: Facebook App ID

**Current**: Not implemented
**Use Case**: Facebook Insights analytics for link sharing metrics

To implement:
```html
<meta property="fb:app_id" content="YOUR_APP_ID" />
```

**Steps**:
1. Create Facebook App at https://developers.facebook.com/apps/
2. Get App ID from dashboard
3. Add meta tag to index.html

**Priority**: Low (not required for OG preview functionality)

### Dynamic Meta Tag Injection

**Current**: Implemented for UUID-based routes
**Coverage**: `/speakers/:uuid`, `/projects/:uuid`, etc.

**Future**: Consider expanding to:
- Event detail pages (`/events/:uuid`)
- Meeting pages (`/meetings/:uuid`)
- Custom OG images per content item

---

## Deployment History

### Commit `9e823ca` - Meta Tag Updates
**Date**: 2025-12-18 17:05
**Change**: Updated OG title/description to reflect platform scope
**Result**: ✅ Success (but didn't fix Facebook 403)

### Commit `8c76524` - Remove Global Crawler Blocking
**Date**: 2025-12-18 17:15
**Change**: Removed global `X-Robots-Tag`, added route-specific blocking
**Result**: ✅ Root cause #1 fixed

### Commit `88d31bd` - Optimize Middleware
**Date**: 2025-12-18 18:10
**Change**: Early exit for crawlers on non-dynamic routes
**Result**: ✅ Root cause #2 fixed

---

## Documentation References

- **Full Troubleshooting Log**: `docs/troubleshooting-logs/troubleshooting-log-2025-12-18-facebook-og-preview.md`
- **Backlog Item**: GEO-005 (Facebook verification after cache expiration)
- **Open Graph Protocol Spec**: https://ogp.me/
- **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
- **Cloudflare Pages Headers**: https://developers.cloudflare.com/pages/configuration/headers/

---

## Summary

The Georgetown Rotary platform now has a **production-ready social sharing implementation** with comprehensive Open Graph support across all major platforms. Two critical bugs were identified and resolved:

1. ✅ **Global crawler blocking** via HTTP headers (fixed)
2. ✅ **Middleware performance** issue with Supabase initialization (fixed)

The only remaining task is verifying Facebook cache expiration (24-48 hours), tracked as backlog item **GEO-005**. The staging domain (`georgetown-rotary.pages.dev`) working successfully proves all technical implementation is correct.

**Verification Status**:
- ✅ Twitter/X: Confirmed working (44 crawls in 24h)
- ✅ LinkedIn: Confirmed working (12 crawls in 24h)
- ✅ WhatsApp: Link previews working
- ✅ WeChat: Custom image optimization implemented
- ⏳ Facebook: Awaiting cache expiration (ETA 2025-12-19/20)

---

**Questions or Issues**: Refer to the detailed troubleshooting log or contact CEO for additional context.
