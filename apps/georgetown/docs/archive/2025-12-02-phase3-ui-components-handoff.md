# Session Handoff Prompt: Phase 3 - React UI Components (RSVP & Attendance)
**Date:** 2025-12-02
**Session Type:** Implementation (Frontend)
**Next Session Focus:** Build React components for RSVP and attendance check-in
**Previous Session:** Phase 2 - Database Schema Complete

---

## Context Summary

Georgetown Rotary is transforming into **Rotary Club Manager** - a global open-source platform for Rotary clubs worldwide (HuaQiao Foundation gift by Chairman PSR Frank Yih). We've completed Phase 1 (brand compliance) and Phase 2 (database schema). Now we build the UI.

**Strategic Vision:**
- Template repository model (clubs self-host Supabase + Cloudflare Pages)
- Free & open-source forever (zero licensing costs)
- Global South friendly (China, India, Africa accessible)
- Mobile-first design (TRUE mobile-first, not retrofitted)
- Target: 10-20 clubs Year 1, 500+ clubs by Year 5

**Competitive Position:** ONLY open-source Rotary club platform (beats ClubRunner, DACdb, Wild Apricot on cost, accessibility, data sovereignty)

---

## Completed Work (Phases 1-2)

### ✅ Phase 1: Brand Compliance & Foundation
- **Brand color fix:** #005daa → #0067c8 (official Rotary Azure PMS 2175C) across 100+ files
- **Color palette:** [public/brand/rotary-colors.json](../../public/brand/rotary-colors.json)
- **Transformation plan:** [docs/plans/2025-12-02-global-rotary-platform-transformation.md](../plans/2025-12-02-global-rotary-platform-transformation.md)
- **Handoff workflow:** [docs/prompts/README.md](README.md)

### ✅ Phase 2: Database Schema (Authentication & Attendance)
**Migrations:** 054, 055, 056 (should be run before this session)

**Migration 054:** User Roles & Permissions
- 5 roles: admin, officer, chair, member, readonly
- Granular CRUD permissions per resource
- RLS policies enforcing security
- Functions: `get_user_role()`, `user_has_permission()`

**Migration 055:** Meeting RSVP System
- RSVP statuses: attending, not_attending, maybe, no_response
- Guest tracking (count + names for meal planning)
- Dietary restrictions/special requests
- Auto-creation of RSVPs for new club meetings
- Views: `meeting_rsvp_summary`, `member_rsvp_history`

**Migration 056:** Attendance Records & Statistics
- 3 attendee types: members, visiting Rotarians, guests
- Stats: quarterly, YTD, lifetime percentages
- Rotary year aware (Jul 1 - Jun 30)
- At-risk member alerts (below 60% or 4+ absences)
- Views: `meeting_attendance_summary`, `member_attendance_detail`, `at_risk_members`

**Database Status:**
- 5 new tables (user_roles, role_permissions, meeting_rsvps, attendance_records, member_attendance_stats)
- 5 new views (summaries and analytics)
- 7 new functions (helpers and automation)
- 15+ RLS policies (role-based security)

---

## Phase 3: React UI Components (This Session)

### Priority 1: RSVP Components (Mobile-First)

**User Story:**
> "As a member, I want to quickly RSVP for Thursday's meeting on my phone during lunch, optionally add a guest and dietary notes, so the program committee knows headcount for meal planning."

**Components to Build:**

#### 1. `src/components/meetings/RSVPButton.tsx`
**Purpose:** Quick RSVP toggle (attending/not attending) on event cards

**Requirements:**
- Mobile touch-friendly (44px minimum)
- 3 states: Attending (green), Not Attending (gray), No Response (blue outline)
- Optional "Maybe" state (yellow)
- One-tap toggle (no modal for quick RSVP)
- Real-time update via Supabase subscription
- Permission check: members can RSVP, readonly cannot

**Design:**
```tsx
// Event card shows:
[Event Details]
[RSVP: ✓ Attending | ✗ Not Going | + Add Details]

// Mobile layout:
- Full-width buttons on mobile (< 768px)
- Inline buttons on desktop (>= 768px)
```

**Database:**
```sql
-- Update RSVP
UPDATE meeting_rsvps
SET status = 'attending', updated_at = NOW()
WHERE event_id = '[event-uuid]' AND member_id = '[member-uuid]';
```

**Props:**
```tsx
interface RSVPButtonProps {
  eventId: string;
  memberId: string;
  currentStatus: 'attending' | 'not_attending' | 'maybe' | 'no_response';
  onStatusChange?: (newStatus: string) => void;
}
```

---

#### 2. `src/components/meetings/RSVPModal.tsx`
**Purpose:** Detailed RSVP with guest count and dietary notes

**Requirements:**
- Opens from "Add Details" link on RSVPButton
- Fields:
  - RSVP status (dropdown: Attending / Not Attending / Maybe)
  - Guest count (number input, 0-10, default 0)
  - Guest names (optional textarea, one per line)
  - Dietary notes (textarea: vegetarian, allergies, etc.)
  - Special requests (textarea: wheelchair access, etc.)
- Auto-save on blur (2-second debounce)
- Close button + click outside to close
- Mobile-optimized form layout

**Database:**
```sql
UPDATE meeting_rsvps
SET
  status = '[status]',
  guest_count = [count],
  guest_names = ARRAY['Guest 1', 'Guest 2'],
  dietary_notes = '[notes]',
  special_requests = '[requests]',
  updated_at = NOW()
WHERE event_id = '[event-uuid]' AND member_id = '[member-uuid]';
```

**Props:**
```tsx
interface RSVPModalProps {
  eventId: string;
  memberId: string;
  isOpen: boolean;
  onClose: () => void;
}
```

---

#### 3. `src/components/meetings/RSVPList.tsx`
**Purpose:** Admin dashboard showing who's coming (meal planning)

**Requirements:**
- Only visible to officers/admins (permission check)
- Table/card view toggle (mobile: cards, desktop: table)
- Columns:
  - Member name (sortable)
  - RSVP status (color-coded badges)
  - Guest count
  - Dietary notes (tooltip on hover)
  - Last updated
- Summary stats at top:
  - Total attending (members + guests)
  - Total not attending
  - Total no response
  - Response rate %
- Export to CSV button (for venue catering)
- Real-time updates (Supabase subscription)

**Database:**
```sql
-- Use the pre-built view
SELECT * FROM meeting_rsvp_summary WHERE event_id = '[event-uuid]';

-- Detail list
SELECT
  m.name,
  r.status,
  r.guest_count,
  r.dietary_notes,
  r.updated_at
FROM meeting_rsvps r
JOIN members m ON r.member_id = m.id
WHERE r.event_id = '[event-uuid]'
ORDER BY m.name;
```

**Props:**
```tsx
interface RSVPListProps {
  eventId: string;
}
```

---

### Priority 2: Attendance Components

**User Story:**
> "As an officer, I want to quickly check in members during the meeting on my phone, add visiting Rotarians and guests, so we have accurate attendance records for Rotary reporting."

**Components to Build:**

#### 4. `src/components/meetings/AttendanceChecker.tsx`
**Purpose:** Quick check-in interface for taking attendance

**Requirements:**
- Only visible to officers/admins
- Pre-populated with members who RSVP'd "attending" (highlighted)
- Bulk actions:
  - "Check in all RSVP'd" button (one tap)
  - "Check in all active members" button (for in-person meetings)
- Individual check-in:
  - Member list with checkboxes (or toggle buttons)
  - Green checkmark when checked in
  - Timestamp shown
- "+ Add Visitor" button → opens VisitorForm
- "+ Add Guest" button → opens GuestForm
- Summary stats:
  - Members checked in / Total active
  - Visitors count
  - Guests count
  - Total headcount
- Save button (commits all to database)

**Database:**
```sql
-- Check in member
INSERT INTO attendance_records (event_id, attendee_type, member_id, checked_in_by)
VALUES ('[event-uuid]', 'member', '[member-uuid]', auth.uid());

-- Bulk check-in (all RSVP'd)
INSERT INTO attendance_records (event_id, attendee_type, member_id, checked_in_by)
SELECT '[event-uuid]', 'member', member_id, auth.uid()
FROM meeting_rsvps
WHERE event_id = '[event-uuid]' AND status = 'attending';
```

**Props:**
```tsx
interface AttendanceCheckerProps {
  eventId: string;
}
```

---

#### 5. `src/components/meetings/VisitorForm.tsx`
**Purpose:** Quick add for visiting Rotarians

**Requirements:**
- Modal form with fields:
  - Visitor name (text input, required)
  - Club name (text input, required, autocomplete from past visitors)
  - District (text input, optional)
  - Notes (textarea, optional)
- "Save & Add Another" button (for multiple visitors)
- "Save & Close" button
- Recent visitors dropdown (for quick re-entry)

**Database:**
```sql
INSERT INTO attendance_records (
  event_id,
  attendee_type,
  visitor_name,
  visitor_club,
  visitor_district,
  notes,
  checked_in_by
) VALUES (
  '[event-uuid]',
  'visiting_rotarian',
  '[name]',
  '[club]',
  '[district]',
  '[notes]',
  auth.uid()
);
```

**Props:**
```tsx
interface VisitorFormProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (visitor: VisitorData) => void;
}
```

---

#### 6. `src/components/meetings/GuestForm.tsx`
**Purpose:** Quick add for non-Rotarian guests (prospective members)

**Requirements:**
- Modal form with fields:
  - Guest name (text input, required)
  - Hosted by (dropdown: active members, required)
  - Prospective member? (checkbox, important for follow-up)
  - Contact info (text input: email or phone, optional)
  - Notes (textarea, optional)
- "Save & Add Another" button
- "Save & Close" button

**Database:**
```sql
INSERT INTO attendance_records (
  event_id,
  attendee_type,
  guest_name,
  guest_hosted_by,
  guest_is_prospective_member,
  guest_contact_info,
  notes,
  checked_in_by
) VALUES (
  '[event-uuid]',
  'guest',
  '[name]',
  '[host-member-uuid]',
  [true/false],
  '[contact]',
  '[notes]',
  auth.uid()
);
```

**Props:**
```tsx
interface GuestFormProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (guest: GuestData) => void;
}
```

---

#### 7. `src/components/meetings/AttendanceDashboard.tsx`
**Purpose:** Member personal attendance stats

**Requirements:**
- Shows member's own attendance statistics
- Cards:
  - Current quarter: "You've attended 10/12 meetings (83%)"
  - Year-to-date: "You've attended 28/35 meetings (80%)"
  - Lifetime: "You've attended 156/180 meetings (87%)"
  - Last attended: "Thursday, Nov 30, 2025"
  - Consecutive absences: Alert if >= 4 (red warning)
- Attendance history calendar heatmap (optional, nice-to-have)
- At-risk warning: "⚠️ You're below 60% attendance (Rotary requirement)"
- Mobile-optimized card layout

**Database:**
```sql
-- Get member's stats
SELECT * FROM member_attendance_stats WHERE member_id = '[member-uuid]';

-- Get attendance history
SELECT * FROM member_attendance_detail
WHERE member_id = '[member-uuid]'
ORDER BY event_date DESC
LIMIT 20;
```

**Props:**
```tsx
interface AttendanceDashboardProps {
  memberId: string;
}
```

---

### Priority 3: Integration with Existing Components

**Update these existing components:**

#### 8. `src/components/EventsListView.tsx`
**Add:**
- RSVPButton component to each event card (for club meetings only)
- "View RSVPs" button for officers (opens RSVPList modal)
- "Take Attendance" button for officers (opens AttendanceChecker)

#### 9. `src/components/Calendar.tsx` and `src/components/CalendarView.tsx`
**Add:**
- RSVP status indicator on calendar events (green dot = attending, gray = not attending)
- Click event → Shows RSVPModal
- Officer view: Shows headcount ("42 attending, 8 guests")

#### 10. `src/components/MemberDirectory.tsx` or `src/components/MembersList.tsx`
**Add:**
- Attendance percentage column (sortable)
- At-risk indicator (red flag if < 60%)
- Click member → Shows AttendanceDashboard in modal

---

## Technical Implementation Notes

### Supabase Realtime Subscriptions

**Pattern to use:**
```tsx
// In RSVPButton.tsx
useEffect(() => {
  const subscription = supabase
    .channel('rsvp-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'meeting_rsvps',
        filter: `event_id=eq.${eventId}`
      },
      (payload) => {
        // Update local state
        setRsvpStatus(payload.new.status);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [eventId]);
```

### Permission Checking

**Hook to create:**
```tsx
// src/hooks/usePermissions.ts
export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = async (resource: string, action: string) => {
    const { data } = await supabase.rpc('user_has_permission', {
      user_uuid: user?.id,
      resource_name: resource,
      permission_type: action
    });
    return data;
  };

  return { hasPermission };
}

// Usage in component:
const { hasPermission } = usePermissions();
const canTakeAttendance = await hasPermission('attendance', 'create');
```

### Mobile-First Styling

**Breakpoints (from Tailwind):**
```css
/* Mobile-first approach */
.rsvp-button {
  @apply w-full py-3 text-base; /* Mobile: full-width, large touch target */
}

@media (min-width: 768px) {
  .rsvp-button {
    @apply w-auto py-2 text-sm; /* Desktop: auto-width, compact */
  }
}
```

### Error Handling

**Pattern:**
```tsx
try {
  const { data, error } = await supabase
    .from('meeting_rsvps')
    .update({ status: 'attending' })
    .eq('event_id', eventId)
    .eq('member_id', memberId);

  if (error) throw error;

  // Success feedback
  toast.success('RSVP updated!');
} catch (error) {
  console.error('RSVP error:', error);
  toast.error('Failed to update RSVP. Please try again.');
}
```

---

## Success Criteria

**Phase 3 Complete When:**

1. ✅ Members can RSVP for meetings on mobile (one tap)
2. ✅ Members can add guest count and dietary notes
3. ✅ Officers see RSVP summary dashboard (who's coming)
4. ✅ Officers can take attendance quickly (bulk check-in)
5. ✅ Officers can add visiting Rotarians and guests
6. ✅ Members see their own attendance stats
7. ✅ At-risk members see warning if below 60%
8. ✅ Real-time updates work (no page refresh needed)
9. ✅ All components are mobile-optimized (320px-414px)
10. ✅ Zero TypeScript errors

---

## Files to Create (Phase 3)

### Components:
- `src/components/meetings/RSVPButton.tsx` (~100 lines)
- `src/components/meetings/RSVPModal.tsx` (~200 lines)
- `src/components/meetings/RSVPList.tsx` (~250 lines)
- `src/components/meetings/AttendanceChecker.tsx` (~300 lines)
- `src/components/meetings/VisitorForm.tsx` (~150 lines)
- `src/components/meetings/GuestForm.tsx` (~150 lines)
- `src/components/meetings/AttendanceDashboard.tsx` (~200 lines)

### Hooks:
- `src/hooks/useAuth.ts` (~100 lines)
- `src/hooks/usePermissions.ts` (~80 lines)
- `src/hooks/useRSVP.ts` (~120 lines) - RSVP data fetching/updating
- `src/hooks/useAttendance.ts` (~120 lines) - Attendance data management

### Types:
- Update `src/types/database.ts` with new table types:
  - `UserRole`, `RolePermission`, `MeetingRSVP`, `AttendanceRecord`, `MemberAttendanceStats`

### Styles:
- `src/components/meetings/meetings.css` (optional, if needed beyond Tailwind)

---

## Migration Verification (Run First!)

**Before building UI, verify migrations ran successfully:**

```bash
# Check tables exist
psql "$DIRECT_URL" -c "\dt *role* *rsvp* *attendance*"

# Check permissions seeded
psql "$DIRECT_URL" -c "SELECT count(*) FROM role_permissions;"
# Expected: 40 rows

# Check stats calculated
psql "$DIRECT_URL" -c "SELECT count(*) FROM member_attendance_stats;"
# Expected: ~50 rows (number of active members)

# Check views exist
psql "$DIRECT_URL" -c "\dv meeting*"
# Expected: meeting_rsvp_summary, meeting_attendance_summary
```

**If migrations haven't been run:**
1. Run [migration instructions from previous session](#migration-execution-instructions)
2. Verify success before proceeding

---

## Known Issues / Gotchas

1. **Auth Not Yet Implemented:**
   - Migrations assume `auth.uid()` exists
   - UI components will need mock auth until Supabase Auth is configured
   - For testing: Hardcode a member_id temporarily

2. **RLS Policies May Block:**
   - If you see "permission denied" errors, check RLS policies
   - Temporarily disable RLS for testing: `ALTER TABLE meeting_rsvps DISABLE ROW LEVEL SECURITY;`
   - Re-enable after auth is working

3. **Auto-Create RSVPs Trigger:**
   - New club meetings should auto-create RSVPs for all active members
   - If not working, check trigger is active: `SELECT * FROM pg_trigger WHERE tgname LIKE '%rsvp%';`

4. **Stats Refresh Performance:**
   - `refresh_member_attendance_stats()` runs on every attendance insert
   - For bulk operations (50+ members), may be slow
   - Consider disabling trigger temporarily during bulk import

---

## Next Steps After Phase 3

**Phase 4: Global Deployment Preparation**
- Consolidate SQL migrations into single setup script
- Create Cloudflare Pages deployment config
- Write club setup guide (15-minute deployment)
- Create video walkthrough

**Phase 5: Community & Support**
- Discord server setup
- Documentation website (VitePress)
- Demo site with sample data
- CSV import templates

**Phase 6: Launch**
- Testing & QA
- Security audit
- Launch communications (Rotary districts, social media)

---

## Commands to Run on Session Start

```bash
# Verify git status
git status

# Check TypeScript
npx tsc --noEmit

# Start dev server
npm run dev

# Check database connection
psql "$DIRECT_URL" -c "SELECT version();"

# Verify migrations
psql "$DIRECT_URL" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND (tablename LIKE '%rsvp%' OR tablename LIKE '%attendance%');"
```

---

## Reference Documents

**Essential Reading:**
- [Transformation Plan](../plans/2025-12-02-global-rotary-platform-transformation.md) - Strategic context
- [Migration 054](../../docs/database/054-user-roles-and-permissions.sql) - User roles schema
- [Migration 055](../../docs/database/055-meeting-rsvp-system.sql) - RSVP schema
- [Migration 056](../../docs/database/056-attendance-records-and-stats.sql) - Attendance schema
- [Rotary Brand Guide](../governance/rotary-brand-guide.md) - Colors, typography
- [Mobile-First Standards](../standards/responsive-design-standard.md) - Responsive patterns

**Previous Handoffs:**
- [Phase 2 Handoff](2025-12-02-global-platform-handoff.md) - Context from last session

---

**End of Handoff Prompt**
**Next Session CTO:** Build RSVP and attendance UI components (mobile-first React)
**Estimated Time:** 4-6 hours for Priority 1 & 2, 2-3 hours for Priority 3 integration
**Success:** Members can RSVP and officers can take attendance on mobile devices
