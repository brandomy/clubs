# Phase 6 Ready - Events Calendar Sharing Handoff

**Date:** 2025-12-18
**Status:** ⏳ Ready to Start Phase 6
**Current Git Commit:** 9ff1172 (Phase 5 complete + share buttons added)
**Next Task:** Implement Events Calendar Open Graph support

---

## Current Progress Summary

### ✅ Completed Phases

**Phase 0: Infrastructure Setup**
- Cloudflare Functions middleware deployed
- Crawler detection (Telegram, WhatsApp, Facebook, Twitter, LinkedIn, Slack)
- Supabase integration working

**Phase 1: Base HTML Meta Tags**
- Default Open Graph tags with club logo fallback
- Twitter Card support
- iOS Safari "Copy Link" fix

**Phase 2: Speakers Directory** (`/speakers/:uuid`)
- Speaker portraits in link previews
- Topic descriptions
- Verified working in production

**Phase 3: Service Projects** (`/projects?id=uuid`)
- Project images in link previews
- Query parameter routing
- Verified working in production

**Phase 4: Members Directory** (`/members/:uuid`)
- Member portraits in link previews
- Smart description (job/company/classification/role)
- Share buttons added to member cards
- Only shows active members

**Phase 5: Partners Showcase** (`/partners/:uuid`)
- Partner logos in link previews
- Smart description (description/type+location)
- Share buttons added to partner cards
- Deployed and ready for testing

### 🎯 iOS Share Sheet Fixes (Attempt 16)
- ✅ Added default fallback images to index.html (club logo)
- ✅ Added default og:url to prevent empty values
- ✅ Added twitter:image tag (was missing)
- ✅ Middleware now injects both og:image AND twitter:image

---

## Phase 6: Events Calendar - Implementation Guide

### Overview
Implement Open Graph meta tag support for event pages, enabling rich link previews when sharing calendar events on social media platforms.

### Route Pattern
```
/events/:uuid
```

### Database Schema

**Table:** `events`

**Relevant Fields:**
```typescript
{
  id: string                    // UUID (primary key)
  date: string                  // Event date
  start_time?: string           // Optional start time
  end_time?: string            // Optional end time
  type: 'club_meeting' | 'club_assembly' | 'board_meeting' |
        'committee_meeting' | 'club_social' | 'service_project' |
        'holiday' | 'observance'
  title: string                 // Event title
  description?: string          // Event description
  agenda?: string              // Meeting agenda
  location_id?: string         // Foreign key to locations table
  location?: Location          // Joined location data
}
```

**Location Table Fields** (for reference):
```typescript
{
  name: string
  address?: string
  google_maps_link?: string
}
```

### Implementation Steps

#### Step 1: Add Route Handler to Middleware

**File:** `apps/georgetown/functions/_middleware.ts`

**Add after the partners section (around line 247):**

```typescript
// Process event URLs: /events/:uuid
const eventMatch = url.pathname.match(/^\/events\/([^/]+)$/)
if (eventMatch) {
  const eventId = eventMatch[1]

  // Validate UUID format
  if (UUID_REGEX.test(eventId)) {
    try {
      // Fetch event data from Supabase (with location join)
      const { data: event, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          date,
          start_time,
          end_time,
          type,
          location:locations(name, address)
        `)
        .eq('id', eventId)
        .single()

      if (!error && event) {
        // Get the base HTML response
        const response = await next()
        const html = await response.text()

        // Build description from date, time, and location
        let description = ''

        // Format date (e.g., "Monday, December 18, 2025")
        const eventDate = new Date(event.date)
        const formattedDate = eventDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })

        description = formattedDate

        // Add time if available
        if (event.start_time) {
          description += ` at ${event.start_time}`
        }

        // Add location if available
        if (event.location?.name) {
          description += ` - ${event.location.name}`
        }

        // Add brief description if available
        if (event.description) {
          const briefDesc = event.description.substring(0, 100)
          description += `. ${briefDesc}${event.description.length > 100 ? '...' : ''}`
        }

        // Inject event-specific meta tags
        const modifiedHtml = injectMetaTags(html, {
          title: event.title,
          description,
          image: '', // Events don't have images yet, will use club logo fallback
          url: `${url.origin}/events/${event.id}`,
        })

        return new Response(modifiedHtml, {
          headers: response.headers,
        })
      }
    } catch (error) {
      console.error('Error injecting event meta tags:', error)
    }
  }
}
```

#### Step 2: Update Middleware Documentation

**File:** `apps/georgetown/functions/_middleware.ts` (lines 8-13)

Update the supported routes comment:
```typescript
 * Supported routes:
 * - /speakers/:uuid - Speaker details with portrait, topic
 * - /projects?id=uuid - Service project details with image, description
 * - /members/:uuid - Member details with portrait, role, classification
 * - /partners/:uuid - Partner organization details with logo, description
 * - /events/:uuid - Event details with date, time, location
```

#### Step 3: Add Share Button to Event Components (Optional)

If you want to add share buttons to event cards/modals:

**Check these files:**
- `apps/georgetown/src/components/CalendarView.tsx`
- `apps/georgetown/src/components/EventViewModal.tsx`
- `apps/georgetown/src/components/EventsListView.tsx`

**Add to ShareButton.tsx:**
```typescript
// Add to interface
interface ShareButtonProps {
  project?: ServiceProject
  speaker?: Speaker
  member?: Member
  partner?: Partner
  event?: ClubEvent  // ADD THIS
  variant?: 'default' | 'icon-only'
  className?: string
}

// Update handleShare logic
const contentType = project ? 'project'
  : speaker ? 'speaker'
  : member ? 'member'
  : partner ? 'partner'
  : 'event'  // ADD THIS

const shareUrl = project
  ? generateProjectUrl(project.id)
  : speaker
  ? generateSpeakerUrl(speaker.id)
  : member
  ? generateMemberUrl(member.id)
  : partner
  ? generatePartnerUrl(partner.id)
  : event
  ? generateEventUrl(event.id)  // ADD THIS
  : ''

// Update shareData
const shareData = {
  title: project?.project_name || speaker?.name || member?.name || partner?.name || event?.title || '',
  text: /* ... existing logic ... */ || event?.description?.substring(0, 150) || '',
  url: shareUrl,
}
```

**Add to shareHelpers.ts:**
```typescript
// Add event to type unions
export async function shareContent(
  data: ShareData,
  contentType: 'project' | 'speaker' | 'member' | 'partner' | 'event',
  // ...
)

// Add URL generator
export function generateEventUrl(eventId: string): string {
  const baseUrl = window.location.origin
  return `${baseUrl}/events/${eventId}`
}
```

#### Step 4: Build and Test

```bash
# Build
pnpm build:georgetown

# Commit
git add apps/georgetown/functions/_middleware.ts
git commit -m "feat(functions): add Open Graph support for events calendar (Phase 6)

Add social media link preview support for event pages. Events now show rich previews with event title, formatted date/time, and location when shared on Telegram, WhatsApp, and other platforms.

**Route Pattern**: \`/events/:uuid\`

**Database Fields Used**:
- \`title\` → og:title
- \`date\`, \`start_time\`, \`location.name\` → og:description
- \`description\` → og:description (appended)

**Description Format**:
\"Monday, December 18, 2025 at 7:00 PM - Hotel Name. Brief event description...\"

**Features**:
- Human-readable date formatting
- Smart description building (date + time + location + description)
- Falls back to club logo for og:image (events don't have images)
- UUID validation for security

**Phases Complete**:
- ✅ Phase 2: Speakers
- ✅ Phase 3: Service Projects
- ✅ Phase 4: Members
- ✅ Phase 5: Partners
- ✅ Phase 6: Events (THIS PHASE)

**Remaining**:
- ⏳ Phase 7: Comprehensive Testing

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Deploy
git push

# Wait 10-15 minutes for deployment propagation
```

#### Step 5: Testing

**Method 1: curl (after 10-15 min)**
```bash
# Test event (replace UUID with actual event ID)
curl -A "TelegramBot (like TwitterBot)" \
  "https://georgetownrotary.club/events/[EVENT-UUID]" | grep "og:"
```

**Expected output:**
```html
<meta property="og:title" content="Weekly Club Meeting" />
<meta property="og:description" content="Monday, December 18, 2025 at 7:00 PM - Hotel XYZ. Join us for our regular..." />
<meta property="og:image" content="https://georgetownrotary.club/assets/images/logos/rotary-wheel-azure_white.png" />
<meta property="og:url" content="https://georgetownrotary.club/events/[UUID]" />
<meta name="twitter:image" content="https://georgetownrotary.club/assets/images/logos/rotary-wheel-azure_white.png" />
```

**Method 2: Real-world Testing**
1. Get an event UUID from the database
2. Construct URL: `https://georgetownrotary.club/events/[UUID]`
3. Share in WhatsApp/Telegram
4. Verify preview shows event title, date, time, location

**Method 3: Get Event UUID**
```sql
-- From database
SELECT id, title, date, start_time
FROM events
ORDER BY date DESC
LIMIT 3;
```

---

## Current File State

### Key Files to Review

1. **Middleware:** `apps/georgetown/functions/_middleware.ts` (lines 1-204)
   - Contains handlers for speakers, projects, members, partners
   - Next: Add events handler after line 245

2. **Share Helpers:** `apps/georgetown/src/utils/shareHelpers.ts`
   - Currently supports: project, speaker, member, partner
   - Next: Add 'event' to type unions and add generateEventUrl()

3. **Share Button:** `apps/georgetown/src/components/ShareButton.tsx`
   - Currently supports: project, speaker, member, partner
   - Next: Add event support (optional)

4. **Database Types:** `apps/georgetown/src/types/database.ts`
   - ClubEvent type defined (lines 50-65)
   - Location type defined (lines 32-48)

### Current Git Status

```bash
git log --oneline -5
# 9ff1172 feat(ui): add share buttons to member and partner cards
# 59d3f1c feat(functions): add Open Graph support for partners showcase (Phase 5)
# 2e3709f fix(sharing): resolve iOS share sheet issues
# d7ea77e feat(functions): add Open Graph support for members directory (Phase 4)
# e9f0760 revert: remove debug code - Phase 3 working in production
```

---

## Success Criteria for Phase 6

Phase 6 passes verification if:

- [ ] Events route handler added to middleware
- [ ] Build completes without errors
- [ ] Committed and deployed successfully
- [ ] curl test returns correct Open Graph tags (after 10-15 min)
- [ ] Event title appears in link preview
- [ ] Date, time, location appear in description
- [ ] WhatsApp shows rich preview
- [ ] Telegram shows rich preview
- [ ] Club logo appears as fallback image

---

## After Phase 6: Proceed to Phase 7

**Phase 7: Comprehensive Testing**

Test all routes across all platforms:

**Routes to Test:**
1. `/speakers/:uuid` - Phase 2
2. `/projects?id=uuid` - Phase 3
3. `/members/:uuid` - Phase 4
4. `/partners/:uuid` - Phase 5
5. `/events/:uuid` - Phase 6 (just completed)

**Platforms to Test:**
- ✅ Telegram (direct paste/share)
- ✅ WhatsApp
- ✅ Facebook Messenger
- ✅ Twitter/X
- ✅ LinkedIn
- ✅ Slack

**Meta Tag Debuggers:**
- Facebook: https://developers.facebook.com/tools/debug/
- Twitter: https://cards-dev.twitter.com/validator
- LinkedIn: https://www.linkedin.com/post-inspector/

**Edge Cases to Test:**
- ⚠️ Non-existent UUIDs (should fall through gracefully)
- ⚠️ Invalid UUID format (should pass through)
- ⚠️ Missing images (should use club logo fallback)
- ⚠️ Missing descriptions (should use defaults)
- ⚠️ Very long titles (should display properly)
- ⚠️ Special characters in text (should escape properly)

---

## Quick Start Commands

```bash
# 1. Check current status
git log --oneline -5
git status

# 2. Verify you're on commit 9ff1172 or later
git show --oneline -1

# 3. Read the middleware to understand structure
cat apps/georgetown/functions/_middleware.ts | head -250

# 4. Read the database types
cat apps/georgetown/src/types/database.ts | grep -A 30 "export type ClubEvent"

# 5. Start implementing (see Step 1 above)
code apps/georgetown/functions/_middleware.ts
```

---

## Troubleshooting Reference

**Full troubleshooting log:**
`docs/troubleshooting/2025-12-17-telegram-sharing-investigation.md`

**Latest attempt:** Attempt 16 (iOS share sheet fixes)

**Common Issues:**
1. **Deployment delay:** Wait 10-15 minutes after push
2. **Empty previews:** Check if crawler user agent is being detected
3. **Wrong image:** Verify og:image and twitter:image both being injected
4. **Telegram forwarding:** Platform limitation, direct paste works

---

## Session Handoff Checklist

When continuing in a fresh session:

- [ ] Read this handoff document
- [ ] Check git log to verify current commit (should be 9ff1172 or later)
- [ ] Review middleware structure (`apps/georgetown/functions/_middleware.ts`)
- [ ] Review database types for ClubEvent and Location
- [ ] Understand the description building strategy (date + time + location)
- [ ] Know the 10-15 minute deployment timeline
- [ ] Have a test event UUID ready (or query database for one)

---

## Estimated Effort

**Phase 6 Implementation:** 45-60 minutes
- Middleware code: 20-30 min
- Build & commit: 5 min
- Deploy & wait: 10-15 min
- Testing: 15-20 min

**Phase 7 Testing:** 60-90 minutes
- All routes, all platforms
- Edge case testing
- Documentation of results

**Total remaining:** ~2-2.5 hours for complete implementation

---

## Context for AI Assistant

**Project:** Georgetown Rotary Club management app
**Tech Stack:** React 19, TypeScript, Vite 7, Cloudflare Pages, Supabase
**Feature:** Social media link preview sharing (Open Graph meta tags)
**Implementation:** Edge middleware that intercepts crawler requests and injects dynamic meta tags

**Completed:**
- ✅ Phases 0-5: All content types (speakers, projects, members, partners)
- ✅ Share buttons on member and partner cards
- ✅ iOS Safari "Copy Link" fix
- ✅ Twitter Card support

**Current Task:**
- ⏳ Phase 6: Events calendar
- ⏳ Phase 7: Comprehensive testing

**Key Pattern:**
All route handlers follow the same structure:
1. Match URL pattern with regex
2. Validate UUID format
3. Fetch data from Supabase
4. Build description from available fields
5. Inject meta tags with `injectMetaTags()`
6. Return modified HTML to crawler

**Events Unique Consideration:**
- Events don't have images (use club logo fallback)
- Description needs human-readable date formatting
- May need to join with locations table for venue information

---

**Ready to implement Phase 6!**

Last updated: 2025-12-18
Current commit: 9ff1172
Next: Add events route handler to middleware
