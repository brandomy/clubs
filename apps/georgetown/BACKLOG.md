# Georgetown Rotary Development Backlog

**Purpose**: Track all development tasks and features for Georgetown Rotary Club Management System

**Ownership**: CTO maintains all entries, status updates, and implementation planning

**CEO Usage**: "Code, backlog this: [description]" or "CTO, backlog this: [description]" to add new items

---

## Backlog Types

**Technical Backlog**: Code features, infrastructure, bug fixes, technical debt
**Content Backlog**: Data entry, content updates, documentation, reference materials

---

## Technical Backlog Summary

| ID | Item | Type | Priority | Status | Added | Completed |
|----|------|------|----------|--------|-------|-----------|
| [#001](#001-speaker-management-board-system) | Speaker Management Board System | Feature | High | Completed | 2024-XX-XX | 2025-01-XX |
| [#002](#002-member-attendance-tracking) | Member Attendance Tracking | Feature | Future | Backlogged | 2024-XX-XX | - |
| [#003](#003-member-directory-with-search) | Member Directory with Search | Feature | Future | Backlogged | 2024-XX-XX | - |
| [#004](#004-event-calendar-integration) | Event Calendar Integration | Feature | Ideas | Backlogged | 2024-XX-XX | - |
| [#005](#005-timeline-photo-gallery) | Timeline Photo Gallery | Feature | Ideas | Backlogged | 2024-XX-XX | - |
| [#006](#006-timeline-pdf-export) | Timeline PDF Export | Feature | Ideas | Backlogged | 2024-XX-XX | - |
| [#007](#007-timeline-markdown-support) | Timeline Markdown Support | Feature | Ideas | Backlogged | 2024-XX-XX | - |
| [#008](#008-timeline-revision-history) | Timeline Revision History | Feature | Ideas | Backlogged | 2024-XX-XX | - |
| [#009](#009-add-team-members-to-service-projects) | Add Team Members to Service Projects | Feature | Ideas | Backlogged | 2024-XX-XX | - |
| [#010](#010-membership-prospects-board) | Membership Prospects Board | Feature | Ideas | Backlogged | 2024-XX-XX | - |
| [#011](#011-meeting-signup-attendance-and-meal-choices) | Meeting Signup, Attendance, and Meal Choices | Feature | Ideas | Backlogged | 2024-XX-XX | - |
| [#012](#012-wheelchair-loaner-tracking-app) | Wheelchair Loaner Tracking App | Feature | Ideas | Backlogged | 2024-XX-XX | - |
| [#013](#013-pwa-enhancements-offline-functionality) | PWA Enhancements: Offline Functionality | Infrastructure | Future | Backlogged | 2025-12-02 | - |
| [#014](#014-pwa-push-notifications-meeting-reminders) | PWA: Push Notifications (Meeting Reminders) | Infrastructure | Future | Backlogged | 2025-12-02 | - |
| [#015](#015-pwa-background-sync-offline-queue) | PWA: Background Sync (Offline Queue) | Infrastructure | Future | Backlogged | 2025-12-02 | - |
| [#016](#016-pwa-install-prompt-add-to-home-screen) | PWA: Install Prompt ("Add to Home Screen") | Infrastructure | Future | Backlogged | 2025-12-02 | - |
| [#017](#017-cross-club-collaboration-architecture) | Cross-Club Collaboration Architecture | Infrastructure | Ideas | Backlogged | 2025-12-02 | - |
| [#018](#018-analytics-tracking-phase-3-rsvp-attendance) | Analytics Tracking: Phase 3 RSVP & Attendance | Infrastructure | High | Backlogged | 2025-12-02 | - |

## Content Backlog Summary

| ID | Item | Type | Priority | Status | Added | Completed |
|----|------|------|----------|--------|-------|-----------|
| [#C001](#c001-populate-historical-speakers-data) | Populate Historical Speakers Data | Data Entry | Future | Backlogged | 2025-12-02 | - |
| [#C002](#c002-upload-member-photos-portraits) | Upload Member Photos/Portraits | Content | Future | Backlogged | 2025-12-02 | - |
| [#C003](#c003-rotary-year-timeline-historical-data) | Rotary Year Timeline Historical Data | Data Entry | Future | Backlogged | 2025-12-02 | - |

---

## Status Definitions

- **Backlogged**: Captured idea, not yet prioritized for implementation
- **In Progress**: Currently being developed by CTO
- **Completed**: Implemented, tested, and deployed
- **On Hold**: Blocked or deprioritized pending other work

---

## High Priority

### #001: Speaker Management Board System
**Status**: Completed
**Business Objective**: Replace email-based speaker coordination with professional board interface

**Scope**:
- Drag-and-drop board (Ideas → Approached → Agreed → Scheduled → Spoken → Dropped)
- Full CRUD operations for speaker records
- Real-time Supabase collaboration
- Mobile-first responsive design

**Acceptance Criteria**:
- ✅ Program committee can track speakers through full pipeline
- ✅ No scheduling conflicts or double-booking
- ✅ Works on mobile phones during meetings
- ✅ Rotary brand standards maintained

**Completed**: 2025-01-XX

---

## Future Enhancements

### #002: Member Attendance Tracking
**Status**: Backlogged
**Business Objective**: Digital attendance system to replace manual paper sign-in

**Scope**:
- Check-in interface for weekly meetings
- Attendance history per member
- Export reports for district requirements
- Integration with member directory

**Acceptance Criteria**:
- Officers can mark attendance in < 2 minutes per meeting
- Historical attendance viewable per member
- District-compliant reports exportable
- Mobile-optimized for meeting usage

**Priority**: Future

---

### #003: Member Directory with Search
**Status**: Backlogged
**Business Objective**: Digital member directory accessible to all club members

**Scope**:
- Member profiles (name, phone, email, classification)
- Search and filter capabilities
- Mobile-responsive card layout
- Privacy controls (members can hide contact info)

**Acceptance Criteria**:
- All members can find contact info quickly
- Search by name, classification, or company
- Respects member privacy preferences
- Professional Rotary brand appearance

**Priority**: Future

---

## Ideas / Research Needed

### #004: Event Calendar Integration
**Status**: Backlogged
**Business Objective**: Centralized calendar for all Rotary events (meetings, speakers, service projects)

**Scope**:
- TBD - needs requirements gathering from officers
- Consider iCal export for personal calendars
- Service project coordination
- Meeting location/time management

**Acceptance Criteria**: TBD

**Priority**: Ideas - Needs CEO clarification

---

### #005: Timeline Photo Gallery
**Status**: Backlogged
**Business Objective**: Visual storytelling for annual timeline with focus on 50th anniversary (2027) documentation

**Scope**:
- Photo upload interface for officers (drag-and-drop)
- Image storage in Supabase Storage bucket (rotary-year-photos)
- Lightbox gallery display on timeline view
- Photo captions and metadata (date, event, photographer)
- Batch upload for multiple photos
- Image optimization and thumbnails

**Acceptance Criteria**:
- Officers can upload photos to specific Rotary years
- Photos display in professional gallery format
- Captions provide context for historical record
- Mobile-friendly gallery viewing
- Optimized loading (lazy loading, thumbnails)

**Technical Notes**:
- Database field already exists: `photos: JSONB { url: string; caption: string }[]`
- Follow existing pattern from ThemeDisplay image handling
- Max 20 photos per year to prevent performance issues

**Priority**: Future (High value for 50th anniversary documentation)

**Estimated Effort**: 4-6 hours

---

### #006: Timeline PDF Export
**Status**: Backlogged
**Business Objective**: Generate professional annual reports for District 3300 leadership and club archives

**Scope**:
- "Export to PDF" button on timeline view
- Formatted report generation with sections:
  - Leadership portraits and themes
  - Year summary and narrative
  - Statistics dashboard
  - Highlights and challenges
  - Service projects list with details
  - Speakers list with topics
  - Photo gallery (if implemented)
- Rotary brand compliance (colors, logos, fonts)
- Professional layout suitable for printing

**Acceptance Criteria**:
- Officers can generate PDF in < 10 seconds
- PDF matches Rotary brand standards
- Suitable for district presentations
- Includes all key year information
- Mobile-friendly export workflow

**Technical Notes**:
- Consider libraries: `jspdf`, `react-pdf`, or `pdfmake`
- May need server-side rendering for complex layouts
- Test with various year data (minimal vs. complete)

**Priority**: Future (District reporting requirement)

**Estimated Effort**: 8-10 hours

---

### #007: Timeline Markdown Support
**Status**: Backlogged
**Business Objective**: Enable richer formatting for year narratives (bold, italics, lists) while maintaining simplicity

**Scope**:
- Replace plain textarea with Markdown editor in NarrativeEditor
- Support basic Markdown syntax:
  - **Bold** and *italic* text
  - Bulleted and numbered lists
  - Headings (H3, H4)
  - Links
- Live preview mode for formatted output
- Help/cheat sheet for Markdown syntax
- Render Markdown in timeline view

**Acceptance Criteria**:
- Officers can use basic text formatting
- Preview shows formatted output before saving
- No complex WYSIWYG features (keep it simple)
- Auto-save works with Markdown content
- Graceful fallback for plain text

**Technical Notes**:
- Library options: `react-markdown`, `marked`, `remark`
- Keep editor simple (not full WYSIWYG like Notion)
- Ensure Markdown content sanitized for security
- Test with mobile devices (Markdown entry on phone)

**Priority**: Future (Nice-to-have for professional documentation)

**Estimated Effort**: 3-4 hours

---

### #008: Timeline Revision History
**Status**: Backlogged
**Business Objective**: Protect against accidental data loss and enable narrative change tracking for accountability

**Scope**:
- Create `rotary_year_revisions` table for snapshots
- Capture revision on each auto-save:
  - Timestamp
  - User who made changes
  - Full snapshot of summary, narrative, highlights, challenges
- "View History" button in NarrativeEditor
- Compare revisions side-by-side
- Restore from previous version
- Retention policy (keep last 50 revisions per year)

**Acceptance Criteria**:
- Officers can view all narrative changes
- Restore capability for accidental deletions
- Clear attribution (who changed what, when)
- Performance: revision queries < 1 second
- UI shows meaningful diffs between versions

**Technical Notes**:
- Database schema:
  ```sql
  CREATE TABLE rotary_year_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rotary_year_id UUID REFERENCES rotary_years(id),
    summary TEXT,
    narrative TEXT,
    highlights JSONB,
    challenges JSONB,
    changed_by TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- Consider storage implications (JSONB can be large)
- Implement diff display (visual comparison)
- Add "Restore" confirmation modal

**Priority**: Future (Important for data protection, not urgent)

**Estimated Effort**: 6-8 hours

---

### #009: Add Team Members to Service Projects
**Status**: Backlogged
**Business Objective**: Track which club members are actively working on each service project for better coordination and recognition

**Scope**:
- Add project team members multi-select in ServiceProjectModal
- Display team members on project cards and detail view
- Link team members to members table (similar to Partners relationship)
- Create `project_team_members` junction table
- Show member portraits/initials on project cards
- Filter projects by team member involvement

**Acceptance Criteria**:
- Project leads can assign multiple team members to projects
- Team members visible on project cards (portraits/initials)
- Members can filter to see "My Projects"
- Clear distinction between Project Lead and Team Members
- Mobile-friendly team member selection

**Technical Notes**:
- Database schema:
  ```sql
  CREATE TABLE project_team_members (
    project_id UUID REFERENCES service_projects(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    role TEXT, -- Optional: 'Coordinator', 'Volunteer', etc.
    PRIMARY KEY (project_id, member_id)
  );
  ```
- Follow pattern from project_partners implementation
- Reuse multi-select component with search from ServiceProjectModal
- Display similar to partners: "Team: John Doe, Jane Smith + Add"

**Priority**: Future (Enhances project management and member engagement)

**Estimated Effort**: 4-6 hours

---

### #010: Membership Prospects Board
**Status**: Backlogged
**Business Objective**: Track potential new members through recruitment pipeline, similar to speaker and project board workflows

**Scope**:
- Board view for membership prospects with columns:
  - Identified → Contacted → Meeting Scheduled → Proposed → Approved → Inducted
- Member prospect profiles (name, company, classification, sponsor, contact info)
- Drag-and-drop workflow for membership committee
- Integration with members table (convert prospect → active member)
- Real-time collaboration for membership committee
- Mobile-friendly for officers working at events

**Acceptance Criteria**:
- Membership committee can track all prospects in pipeline
- Clear visibility of recruitment status for each prospect
- Smooth transition from prospect to active member
- Works on mobile during networking events
- Rotary brand standards maintained
- Privacy controls (prospects not visible to general membership)

**Technical Notes**:
- Follow proven pattern from Speakers (/speakers) and Projects (/projects) board views
- Create `membership_prospects` table with similar structure to `speakers`
- Reuse board component patterns (drag-and-drop, modals, filters)
- Consider access control: only officers/membership committee can view prospects
- Upon "Inducted", offer to convert prospect → member record automatically

**Priority**: Future (Enhances membership growth tracking)

**Estimated Effort**: 6-8 hours (reusing existing board patterns)

---

### #011: Meeting Signup, Attendance, and Meal Choices
**Status**: Backlogged
**Business Objective**: Streamline weekly meeting attendance and meal choice collection to replace manual sign-in sheets and phone calls

**Scope**:
- Weekly meeting signup interface for members
- RSVP system (attending/not attending)
- Meal choice selection (e.g., chicken, fish, vegetarian)
- Guest count and names entry
- Attendance tracking integration with member records
- Officer dashboard showing expected attendance counts
- Automatic reminders/notifications before meetings
- Export attendance for district reporting
- Historical attendance records per member

**Acceptance Criteria**:
- Members can RSVP and select meal choice 24 hours before meeting
- Officers see real-time attendance count for catering planning
- Guest information captured for proper seating/badges
- Attendance history viewable per member
- Mobile-optimized (members RSVP from phones)
- Integration with existing member directory
- Export reports for district compliance

**Technical Notes**:
- Create `meeting_attendance` table with:
  - meeting_date, member_id, status (attending/absent), meal_choice, guest_count, guest_names
- Create `meetings` table for scheduled meetings with date, location, speaker
- Weekly recurring meeting generation (automated or manual)
- Email/SMS reminder system (consider integration requirements)
- Dashboard widget showing "This Week's Meeting" attendance summary
- Consider integration with #002 Member Attendance Tracking
- Mobile-first form design for easy RSVP on phones

**Priority**: Future (High member value, reduces officer administrative burden)

**Estimated Effort**: 10-12 hours (includes attendance tracking, meal choices, reporting)

---

### #012: Wheelchair Loaner Tracking App
**Status**: Backlogged
**Business Objective**: Manage wheelchair loaner program inventory, borrowers, and availability for community service

**Scope**:
- Wheelchair inventory management (wheelchair ID, condition, location)
- Borrower check-out/check-in system
- Availability tracking (available, on loan, maintenance needed)
- Borrower information (name, contact, loan date, expected return date)
- Overdue loan notifications/reminders
- Maintenance history and scheduling
- Public availability checker (community members can see if wheelchairs available)
- Officer dashboard for loan management
- Historical usage reports for grant applications

**Acceptance Criteria**:
- Officers can check out wheelchair to borrower in < 1 minute
- Real-time visibility of available wheelchairs
- Community members can check availability without logging in
- Overdue loan tracking and reminder system
- Maintenance schedule prevents loaning damaged equipment
- Export usage statistics for grant reporting
- Mobile-friendly (officers manage loans from phones)
- Privacy protection for borrower information

**Technical Notes**:
- Create `wheelchairs` table:
  - id, serial_number, acquisition_date, condition, status (available/on_loan/maintenance), location
- Create `wheelchair_loans` table:
  - wheelchair_id, borrower_name, borrower_contact, loan_date, expected_return, actual_return, notes
- Create `wheelchair_maintenance` table:
  - wheelchair_id, maintenance_date, issue, resolution, cost
- Public API endpoint for availability count (no auth required)
- Officer-only access for loan management and borrower details
- Dashboard widget showing current loans, overdue items, available count
- Consider barcode/QR code scanning for quick check-out
- SMS/email reminder system for overdue returns

**Priority**: Future (Community service program, potential grant funding showcase)

**Estimated Effort**: 8-10 hours (inventory tracking, loan workflow, reporting)

---

### #013: PWA Enhancements: Offline Functionality
**Status**: Backlogged
**Business Objective**: Enable Rotary clubs to access speaker/member data during meetings even without internet connectivity (especially valuable for Global South clubs with unreliable internet)

**Scope**:
- Implement Service Worker for asset caching
- Cache speaker, member, and event data for offline browsing
- Offline mode indicator (banner showing "You're offline")
- Queue offline actions (edits, new speakers) for sync when reconnected
- Progressive asset loading (prioritize critical data)
- Test offline functionality across browsers (Chrome, Safari, Firefox)

**Acceptance Criteria**:
- Users can browse speaker directory offline
- Offline indicator visible when disconnected
- Changes made offline sync automatically when reconnected
- No data loss during offline usage
- Works on mobile devices (iOS Safari, Android Chrome)
- Service worker updates don't break existing functionality

**Technical Notes**:
- Use Workbox or custom service worker strategy
- Cache strategy: Stale-while-revalidate for data, Cache-first for static assets
- IndexedDB for offline data storage (speakers, members)
- Conflict resolution for offline edits (last-write-wins or user prompt)
- Test with Chrome DevTools offline mode
- iOS Safari service worker quirks (cache eviction policy)

**Priority**: Future (Phase 4 - Deployment Prep)

**Estimated Effort**: 6-8 hours

---

### #014: PWA: Push Notifications (Meeting Reminders)
**Status**: Backlogged
**Business Objective**: Remind members about upcoming meetings and speakers to improve attendance (automated notifications reduce officer workload)

**Scope**:
- Push notification permission request (user opt-in)
- Send notifications for:
  - Meeting reminders (3 days before, 1 day before)
  - Speaker announcements (when speaker confirmed)
  - RSVP reminders (if attendance tracking implemented)
  - Service project updates
- Notification preferences (user can choose which notifications to receive)
- Works on Android and desktop (iOS Safari doesn't support push notifications yet)
- Fallback to email notifications for iOS users

**Acceptance Criteria**:
- Members receive meeting reminders on Android/desktop
- Clear opt-in flow (not intrusive)
- User can manage notification preferences
- Notifications are actionable (click → open app to RSVP)
- Graceful fallback for iOS (email reminders instead)
- No spam (respect frequency limits)

**Technical Notes**:
- Use Web Push API with VAPID keys
- Backend required for sending notifications (consider Supabase Edge Functions)
- Store notification subscriptions in database
- iOS Safari limitation: No push notification support (use email)
- Test notification delivery across browsers
- Consider notification batching (don't spam users)

**Priority**: Future (Phase 5+ - Community Features)

**Estimated Effort**: 8-10 hours (includes backend setup)

**Dependencies**: Requires backend notification service (Supabase Edge Functions or similar)

---

### #015: PWA: Background Sync (Offline Queue)
**Status**: Backlogged
**Business Objective**: Ensure data changes (speaker edits, attendance records) aren't lost when users go offline during meetings

**Scope**:
- Queue failed requests (network errors, offline state)
- Retry queue when connection restored
- Background sync for:
  - Speaker updates
  - Member profile changes
  - Attendance records
  - RSVP submissions
- Visual feedback for queued actions ("Saving when online...")
- Conflict resolution if data changed on server while offline
- Automatic retry with exponential backoff

**Acceptance Criteria**:
- Changes made offline sync automatically when reconnected
- User sees clear feedback for queued actions
- No duplicate submissions (idempotent requests)
- Conflict resolution handles simultaneous edits gracefully
- Works across browser restarts (persists queue in IndexedDB)
- Sync completes even if user closes app (background sync)

**Technical Notes**:
- Use Background Sync API (Chrome/Edge only, not Safari)
- Fallback: Sync on app reopen for Safari
- Queue in IndexedDB (persists across sessions)
- Idempotency keys for requests (prevent duplicates)
- Conflict resolution strategy: last-write-wins or prompt user
- Visual indicator: "3 changes waiting to sync"

**Priority**: Future (Phase 4 - Deployment Prep, pairs with #013 Offline Functionality)

**Estimated Effort**: 6-8 hours

**Dependencies**: Requires #013 (Offline Functionality) implemented first

---

### #016: PWA: Install Prompt ("Add to Home Screen")
**Status**: Backlogged
**Business Objective**: Increase app-like adoption by prompting users to install Georgetown to home screen (improves accessibility and perceived professionalism)

**Scope**:
- Custom "Install App" banner (non-intrusive)
- Trigger install prompt after user engagement (not immediately on load)
- Show prompt only once per user (respect dismissal)
- Works on Android, desktop Chrome, Edge
- Manual instructions for iOS Safari ("Add to Home Screen" via Share menu)
- Track installation analytics (how many users install)
- Custom app icon and splash screen (PWA manifest)

**Acceptance Criteria**:
- Install prompt appears after meaningful engagement (e.g., after adding first speaker)
- User can dismiss prompt (won't show again)
- Install process is smooth (1-2 taps)
- Installed app opens in standalone mode (no browser UI)
- Custom app icon displays on home screen
- Splash screen shows Rotary branding while loading

**Technical Notes**:
- Listen for `beforeinstallprompt` event (Chrome/Edge)
- Defer prompt until user engagement (e.g., after 2 minutes or specific action)
- Store dismissal in localStorage (don't annoy users)
- iOS Safari: Show manual instructions (screenshot tutorial)
- Update manifest.json: icons (192x192, 512x512), theme color, display mode
- Test installation flow on Android, desktop, iOS

**Priority**: Future (Phase 4 - Deployment Prep)

**Estimated Effort**: 3-4 hours

---

### #017: Cross-Club Collaboration Architecture
**Status**: Backlogged (STRATEGIC DECISION REQUIRED)
**Business Objective**: Enable Rotary clubs to discover and collaborate on service projects across clubs, districts, and zones (major pain point currently requiring manual email coordination)

**Problem Statement**:
Rotary clubs currently struggle to:
- Discover service projects from other clubs they could join
- Share successful project models for replication
- Find cross-club partnership opportunities (joint fundraisers, multi-club grants)
- Coordinate district-wide service initiatives
- **This requires shared platform architecture, fundamentally different from current self-hosted model**

**Architectural Options** (CEO decision required):

#### Option A: Federated Model (Decentralized)
**How it works:**
- Each club self-hosts their Georgetown instance (current model)
- Clubs can "connect" to other clubs (like Mastodon/ActivityPub federation)
- Projects can be "published" to federated network (opt-in)
- Discovery via federated search (query connected clubs)

**Pros:**
- ✅ Maintains data sovereignty (clubs control their data)
- ✅ No central platform hosting costs
- ✅ Privacy control (clubs choose what to share)
- ✅ Aligns with open source philosophy

**Cons:**
- ❌ Complex to implement (federated protocols are hard)
- ❌ Discovery limited to connected clubs (no global directory)
- ❌ User experience fragmented (search across instances)
- ❌ Requires clubs to manage federation settings

**Estimated Effort**: 40-60 hours (complex protocol implementation)

---

#### Option B: Central Hub Model (Centralized)
**How it works:**
- HuaQiao Foundation hosts single central platform (like Slack)
- All clubs are "workspaces" on same instance
- Projects visible across clubs (with permissions)
- Central search/discovery directory

**Pros:**
- ✅ Easy discovery (global project directory)
- ✅ Simple sharing (one platform, no federation)
- ✅ Best user experience (seamless cross-club browsing)
- ✅ Central analytics (district-level insights)

**Cons:**
- ❌ Contradicts self-hosted model (single point of failure)
- ❌ Hosting costs (scale to 1000s of clubs)
- ❌ Data sovereignty concerns (clubs don't control their data)
- ❌ Single database for all clubs (privacy/security risk)

**Estimated Effort**: 30-40 hours (multi-tenancy architecture)
**Ongoing Costs**: $50-500/month (database hosting for multi-tenant platform)

---

#### Option C: Hybrid Model (Recommended)
**How it works:**
- Clubs self-host for local operations (speakers, members, attendance) — **current model unchanged**
- Optional "Rotary Project Exchange" service (HuaQiao Foundation-hosted)
- Clubs can **publish** projects to exchange (opt-in, public API)
- Other clubs browse exchange, express interest, connect directly
- Exchange is read-only directory (not full platform)

**Pros:**
- ✅ Maintains data sovereignty (clubs control local data)
- ✅ Easy discovery (central project directory)
- ✅ Optional participation (clubs choose to publish)
- ✅ Low hosting costs (just directory, not full platform)
- ✅ Aligns with "gift" narrative (HuaQiao provides exchange service)
- ✅ Gradual adoption (Phase 7+, doesn't block Phase 1-6)

**Cons:**
- ⚠️ Two systems to maintain (club app + exchange service)
- ⚠️ Sync complexity (publish projects from club to exchange)
- ⚠️ Limited features (exchange is directory only, not collaboration platform)

**Estimated Effort**: 20-30 hours (exchange API + publish workflow)
**Ongoing Costs**: $10-20/month (simple directory database + API)

---

**Scope (Option C - Hybrid Model, if approved):**
- Create "Rotary Project Exchange" service:
  - Public API for browsing projects
  - Clubs can publish projects (opt-in)
  - Search by: Area of Focus, location, club, keywords
  - Project details: description, timeline, partners needed, contact
  - "Express Interest" button (sends email to project lead)
- Club-side implementation:
  - "Publish to Exchange" button on project detail page
  - Preview before publishing (what data will be shared)
  - Unpublish/update published projects
  - Browse exchange from within club app
- Exchange website:
  - Public-facing directory (rotaryprojects.exchange or similar)
  - No login required to browse
  - Contact project leads via form (spam protection)

**Acceptance Criteria**:
- Clubs can publish projects to exchange in < 30 seconds
- Published projects discoverable by other clubs within 1 minute
- Exchange browsable without login (public directory)
- Clubs control what data is shared (opt-in publishing)
- Simple contact flow (interested club → email project lead)
- Works with self-hosted club instances (API integration)

**Strategic Questions for CEO:**
1. **Is cross-club collaboration a v1.0 priority or Phase 7+ feature?**
2. **Which architectural model aligns with HuaQiao Foundation's vision?** (Federated, Central, or Hybrid)
3. **Is HuaQiao Foundation willing to host "Rotary Project Exchange" service?** (Ongoing $10-20/month cost)
4. **Should this be Rotary-only or open to other service clubs?** (Kiwanis, Lions, etc.)
5. **Privacy concerns: What project data can be public vs. private?** (Budget? Partner names? Club member contact?)

**Priority**: Ideas (Strategic decision required before design)

**Estimated Effort**: 20-30 hours (Option C - Hybrid), 30-60 hours (Options A-B)

---

### #018: Analytics Tracking: Phase 3 RSVP & Attendance
**Status**: Backlogged
**Type**: Infrastructure
**Business Objective**: Track user engagement with new RSVP and attendance features to measure adoption and identify UX friction points

**Context**:
Umami analytics is already implemented (October 2025) with 50+ tracked events across Dashboard, Speaker Board, Timeline, and other features. Phase 3 RSVP & Attendance components (completed December 2025) are missing analytics instrumentation.

**Scope**:
Add event tracking to all Phase 3 components:

**RSVP Components:**
- `rsvp-button-click` - Track status selection (attending/regrets/maybe)
- `rsvp-modal-opened` - Track modal opens (from calendar vs events list)
- `rsvp-form-submit-attempt` - Track RSVP submission attempt
- `rsvp-form-submit-success` - Track successful RSVP save
- `rsvp-form-submit-error` - Track RSVP save errors
- `rsvp-status-changed` - Track status changes (attending → regrets)
- `rsvp-list-opened` - Officer views RSVP list
- `rsvp-list-export` - CSV export clicked
- `rsvp-list-filter` - Filter by status (all/attending/regrets/maybe)

**Attendance Components:**
- `attendance-checker-opened` - Officer opens attendance modal
- `attendance-bulk-checkin-rsvp` - Bulk check-in RSVP'd members clicked
- `attendance-bulk-checkin-all` - Check in all members clicked
- `attendance-member-toggle` - Individual member check-in/out
- `visitor-form-opened` - Add visitor form opened
- `visitor-form-submit-success` - Visitor added successfully
- `guest-form-opened` - Add guest form opened
- `guest-form-submit-success` - Guest added successfully
- `attendance-dashboard-opened` - Member views own attendance stats
- `attendance-at-risk-warning` - At-risk alert shown (< 60% or 4+ absences)

**Acceptance Criteria**:
- All RSVP interactions tracked (button clicks, form submissions, status changes)
- All attendance interactions tracked (check-in, visitor/guest adds, dashboard views)
- Track user intent (attempt) AND outcomes (success/error) per Brandmine pattern
- Events visible in Umami dashboard within 1 minute (production)
- Development console logs show tracking events (easy debugging)
- Zero performance impact (async tracking, non-blocking)

**Technical Implementation**:
```typescript
// Example: RSVPButton.tsx
import { trackEvent } from '../../utils/analytics'

const handleAttendingClick = () => {
  trackEvent('rsvp-button-click', {
    action: 'attending',
    ctaLocation: 'calendar-view',
    eventId
  })
  // ... rest of handler
}

// Example: RSVPModal.tsx
useEffect(() => {
  if (isOpen) {
    trackModal.open('rsvp-modal', trigger)
  }
}, [isOpen])

const handleSubmit = async () => {
  trackForm.attempt('rsvp-modal')
  try {
    await saveRSVP()
    trackForm.success('rsvp-modal', { status, guestCount })
  } catch (error) {
    trackForm.error('rsvp-modal', error.message)
  }
}
```

**Files to Modify**:
- `src/components/meetings/RSVPButton.tsx` - Add button click tracking
- `src/components/meetings/RSVPModal.tsx` - Add form tracking (attempt, success, error)
- `src/components/meetings/RSVPList.tsx` - Add list view, filter, export tracking
- `src/components/meetings/AttendanceChecker.tsx` - Add bulk action tracking
- `src/components/meetings/VisitorForm.tsx` - Add form tracking
- `src/components/meetings/GuestForm.tsx` - Add form tracking
- `src/components/meetings/AttendanceDashboard.tsx` - Add view tracking, at-risk warning
- `src/components/CalendarView.tsx` - Track RSVP modal opens from calendar
- `src/components/EventsListView.tsx` - Track RSVP/attendance modal opens from events list
- `src/components/MemberDirectory.tsx` - Track attendance dashboard opens from directory

**Priority**: High (Track adoption metrics for Phase 3 before UAT)

**Estimated Effort**: 2-3 hours

**Dependencies**: None (analytics infrastructure already exists)

---

## Content Backlog (Data Entry & Documentation)

### #C001: Populate Historical Speakers Data
**Status**: Backlogged
**Type**: Data Entry
**Business Objective**: Complete speaker records for past years to demonstrate full speaker tracking value to program committee

**Scope**:
- Enter historical speaker records from 2020-2024 (approximately 150 speakers)
- Data sources: Meeting minutes, email records, program chair notes
- Required fields: Name, Topic, Date, Company (if available)
- Optional fields: Phone, Email, Rotary affiliation (if known)

**Acceptance Criteria**:
- Minimum 100 speaker records entered (2 years minimum)
- All records have: Name, Topic, Date
- Data verified for accuracy (no duplicate entries)
- Speakers properly assigned to "Spoken" column

**Priority**: Future (Nice-to-have for historical reference, not critical for MVP)

**Estimated Effort**: 4-6 hours (data entry time)

**Assigned To**: Program Committee Chair or Administrative Assistant

---

### #C002: Upload Member Photos/Portraits
**Status**: Backlogged
**Type**: Content
**Business Objective**: Professional member directory with photos for better member recognition and directory usability

**Scope**:
- Upload professional headshot photos for all active members (~50 photos)
- Photo requirements:
  - Square crop (1:1 aspect ratio)
  - Minimum 300x300px resolution
  - Professional quality (clear, well-lit)
  - Consistent background (solid color preferred)
- Store in Supabase Storage bucket: `member-portraits/`
- Update `portrait_url` field in members table

**Acceptance Criteria**:
- All active members have portrait photos
- Photos meet quality standards (professional appearance)
- Consistent sizing and cropping across all photos
- Fast loading (optimized file sizes < 200KB each)
- Photos display correctly in member directory and timeline views

**Technical Notes**:
- Photo upload interface already exists in MemberModal
- Supabase storage bucket configured
- Image optimization handled by Vite build

**Priority**: Future (Enhances professionalism, not critical for functionality)

**Estimated Effort**: 3-4 hours (photo collection and upload time)

**Assigned To**: Membership Chair or Communications Committee

---

### #C003: Rotary Year Timeline Historical Data
**Status**: Backlogged
**Type**: Data Entry
**Business Objective**: Complete Rotary year timeline data for 50th anniversary celebration (2027) preparation

**Scope**:
- Enter historical Rotary year data (2010-2024, 14 years)
- Required fields per year:
  - President name and portrait
  - Year theme (if known)
  - Year summary (2-3 sentences minimum)
  - Major highlights (3-5 items)
  - Major challenges (1-3 items)
- Optional fields:
  - Secretary, Treasurer names
  - Club statistics (member count, attendance %, service hours)
  - Service project summaries
  - Speaker highlights
  - Photos (if available)

**Data Sources**:
- Club archives (annual reports)
- District records
- Past president interviews
- Meeting minute summaries
- Photo albums

**Acceptance Criteria**:
- Minimum 10 years of data entered (2015-2024)
- All years have: President, theme, summary, highlights
- Data reviewed and approved by Past Presidents
- Photos uploaded where available
- Ready for 50th anniversary commemoration (2027)

**Priority**: Future (Important for 50th anniversary, but 2+ years away)

**Estimated Effort**: 10-15 hours (research and data entry time)

**Assigned To**: Club Historian or Past Presidents Committee

---

## Template for New Items

```markdown
### #XXX: [Feature Name]
**Status**: Backlogged
**Business Objective**: [What business problem this solves]

**Scope**:
- [Key capability 1]
- [Key capability 2]
- [Key capability 3]

**Acceptance Criteria**:
- [Success measure 1]
- [Success measure 2]
- [Success measure 3]

**Priority**: [High/Future/Ideas]
```

---

## Completed Archive

See [docs/dev-journals/](docs/dev-journals/) for detailed implementation logs of completed items.
