# RSVP System Troubleshooting Handoff

**Date**: 2025-12-02
**Session**: Phase 3 RSVP & Attendance Implementation
**Status**: 🔴 Blocked - Authentication/Database Integration Issue

---

## Current Situation
Georgetown Rotary's Phase 3 RSVP & Attendance system has database and authentication issues preventing RSVPs from saving. User attempted to RSVP to AGM 2025 event but encountered errors.

## Business Context
- **Organization**: Georgetown Rotary Club (~50 members)
- **System**: React + TypeScript + Supabase (PostgreSQL)
- **Feature**: RSVP & Attendance tracking for 6 meeting types (club_meeting, club_assembly, board_meeting, committee_meeting, club_event, service_project)
- **User Role**: Testing as Synthia Surin (first active member, officer role)

---

## What Was Fixed This Session

### ✅ Completed
1. **Event Type Expansion** - Renamed `bod_meeting` → `board_meeting`, expanded RSVP to all 6 meeting types
2. **RSVPModal UX** - Added event title/date to header, made RSVP status prominent, collapsed optional fields
3. **RLS Policies** - Fixed `user_roles` infinite recursion with security definer functions (migration 058)
4. **Meeting RSVPs RLS** - Simplified policies to remove `auth.uid()` dependency (migration 059)
5. **Mock Auth UUID** - Changed from string `'mock-user-id'` to valid UUID `'00000000-0000-0000-0000-000000000001'`
6. **Database Entries** - Created `auth.users` and `user_roles` entries for mock auth UUID

### Files Modified
- `src/hooks/useAuth.ts` - Mock auth uses fixed UUID
- `src/components/meetings/RSVPModal.tsx` - Added eventTitle prop, improved UX, added memberId check
- `src/components/CalendarView.tsx` - Passes eventTitle/eventDate to RSVPModal
- `src/components/EventsListView.tsx` - Passes eventTitle/eventDate to RSVPModal
- `src/types/database.ts` - Updated event type union
- `src/components/Calendar.tsx` - Updated board_meeting styling
- `src/components/EventViewModal.tsx` - Updated board_meeting labels
- `src/components/AddEventModal.tsx` - Updated board_meeting dropdown
- Database: migrations 057, 058, 059, 060

---

## Current Error

**"Failed to save RSVP: Error: Member ID or Event ID is missing"**

Location: `useRSVP.ts:153:15` → `RSVPModal.tsx:58:13`

### Error Context
```typescript
// useRSVP.ts line 150-154
const updateRSVP = useCallback(
  async (status: MeetingRSVP['status'], data?: Partial<MeetingRSVP>) => {
    if (!memberId || !eventId) {
      throw new Error('Member ID or Event ID is missing')
    }
```

---

## Root Cause Analysis

### The Architecture Mismatch
**Current System**: Dual identity model
- `auth.users.id` (user_id) - Supabase authentication UUID
- `members.id` (member_id) - Rotary member record UUID
- `user_roles` table links: `user_id` → `member_id` + `role`

**The Problem**:
1. Mock auth creates React state with `memberId` (correct)
2. BUT `useRSVP` hook expects `memberId` from `useAuth()` hook
3. Mock auth IS setting `memberId` in React state
4. However, when `updateRSVP()` is called, it checks if `memberId` exists
5. The error suggests `memberId` is NULL/undefined when save happens

### User's Insight
> "maybe in our database we need to work with 'memberId' not have 'userId'? Our clubs are all about 'members' and not 'users'."

**This is architecturally correct** - Rotary clubs care about members, not abstract auth users. Consider:
- **Option A**: Refactor to use `member_id` as primary identity (remove `user_id` foreign key requirement)
- **Option B**: Fix mock auth to properly populate `memberId` throughout the chain
- **Option C**: Temporarily bypass memberId check for testing

---

## Debugging Steps Needed

### 1. Verify Mock Auth State
```typescript
// In RSVPModal.tsx line 41-43, check console for:
console.log('RSVPModal - eventId:', eventId, 'memberId:', memberId)

// Expected: memberId = 'd54b1365-86ef-4ec2-9e80-f7f5c6b8cfcf' (Synthia Surin)
// If NULL: Mock auth isn't setting memberId in React state
```

### 2. Check useAuth Hook Chain
```typescript
// src/hooks/useAuth.ts line 128
setMemberId(members.id)  // Should set: d54b1365-86ef-4ec2-9e80-f7f5c6b8cfcf

// Verify in browser console:
// ⚠️ Using MOCK AUTH for testing. Member: Synthia Surin ID: d54b1365-86ef-4ec2-9e80-f7f5c6b8cfcf
```

### 3. Database Verification
```sql
-- Check mock auth linkage
SELECT
  u.id as user_id,
  u.email,
  ur.member_id,
  m.name
FROM auth.users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN members m ON m.id = ur.member_id
WHERE u.id = '00000000-0000-0000-0000-000000000001';

-- Expected: member_id = d54b1365-86ef-4ec2-9e80-f7f5c6b8cfcf
```

### 4. Check useRSVP Hook
```typescript
// src/hooks/useRSVP.ts line 23
const { memberId } = useAuth()

// Add debug logging:
console.log('useRSVP - memberId from useAuth:', memberId)
```

---

## Recommended Next Steps

### Option 1: Quick Fix (Recommended for Testing)
Temporarily bypass memberId requirement in RSVPModal:
```typescript
const handleSave = async () => {
  const effectiveMemberId = memberId || 'd54b1365-86ef-4ec2-9e80-f7f5c6b8cfcf'
  // ... rest of save logic using effectiveMemberId
}
```

### Option 2: Architectural Fix (Better Long-term)
Refactor to member-centric auth:
1. Change `meeting_rsvps.member_id` to be the primary identity
2. Remove or make optional the `user_id` foreign key in `user_roles`
3. Update all RLS policies to check `member_id` directly
4. Update `useAuth` to return `member_id` as the primary identity

### Option 3: Debug Mock Auth
1. Add extensive logging to track `memberId` through the entire chain
2. Check if React state is properly holding the value
3. Verify `useAuth` hook returns are correct
4. Check if `useRSVP` is receiving the value

---

## Key Files to Review

```
src/hooks/useAuth.ts (line 95-135)        - Mock auth setup
src/hooks/useRSVP.ts (line 22-27, 150-186) - memberId usage
src/components/meetings/RSVPModal.tsx (line 29-43, 56-85) - Save logic
docs/database/060-create-mock-auth-user.sql - Mock auth DB setup
```

---

## Testing Checklist
- [ ] Hard refresh browser (Cmd+Shift+R)
- [ ] Open browser console
- [ ] Navigate to Calendar → Click AGM 2025
- [ ] Check console for: `RSVPModal - eventId: <uuid> memberId: <uuid>`
- [ ] Select "✓ Yes, I'll attend"
- [ ] Click "Save RSVP"
- [ ] Check console for error details

---

## Expected Console Output
```
⚠️ Using MOCK AUTH for testing. Member: Synthia Surin ID: d54b1365-86ef-4ec2-9e80-f7f5c6b8cfcf
RSVPModal - eventId: a83209fc-8c9d-47d0-9c01-00b6f6f68d43 memberId: d54b1365-86ef-4ec2-9e80-f7f5c6b8cfcf
```

---

## Database State

### Mock Auth Setup
```sql
-- auth.users entry
id: '00000000-0000-0000-0000-000000000001'
email: 'mock@georgetown-rotary.org'

-- user_roles linkage
user_id: '00000000-0000-0000-0000-000000000001'
member_id: 'd54b1365-86ef-4ec2-9e80-f7f5c6b8cfcf' (Synthia Surin)
role: 'officer'
```

### Tables Status
- ✅ `auth.users` has mock user: `00000000-0000-0000-0000-000000000001`
- ✅ `user_roles` links mock user → Synthia: `member_id = d54b1365-86ef-4ec2-9e80-f7f5c6b8cfcf`
- ✅ `meeting_rsvps` table exists with permissive RLS policies
- ✅ `members` table has 26 active members

### Migrations Applied
- 055: Meeting RSVP system (tables, views, RLS)
- 055-fix: View schema fixes
- 056: Attendance records and stats
- 056-fix: Attendance view fixes
- 057: Rename bod_meeting → board_meeting
- 058: Fix user_roles RLS infinite recursion (security definer functions)
- 059: Simplify meeting_rsvps RLS (testing mode)
- 060: Create mock auth user with UUID

---

## Questions to Answer
1. Is `memberId` NULL in RSVPModal when user clicks Save?
2. Does `useAuth()` return correct `memberId` value?
3. Is the issue timing (async state not ready)?
4. Should we refactor to member-centric architecture?

---

## Success Criteria
User can:
- Click AGM 2025 event
- See "AGM 2025 - Dec 15, 2025" in modal header ✅ **WORKING**
- Select "✓ Yes, I'll attend"
- Click Save RSVP
- **RSVP saves successfully** ❌ **NOT WORKING**
- Modal closes
- RSVP persists after refresh

---

## Technical Context

### useAuth Hook Flow
```typescript
// 1. App loads → useAuth checks for session
// 2. No session found → calls useMockAuth()
// 3. useMockAuth fetches first active member from DB
// 4. Sets React state:
setUser(mockUser)      // { id: '00000000-0000-0000-0000-000000000001', email: '...' }
setUserRole(mockRole)  // { user_id: '...', member_id: 'd54b...', role: 'officer' }
setMemberId(members.id) // 'd54b1365-86ef-4ec2-9e80-f7f5c6b8cfcf'

// 5. useAuth returns: { user, userRole, memberId, ... }
```

### useRSVP Hook Flow
```typescript
// 1. RSVPModal calls: const { rsvp, updateRSVP } = useRSVP(eventId)
// 2. useRSVP calls: const { memberId } = useAuth()
// 3. updateRSVP function checks: if (!memberId || !eventId) throw error
// 4. ERROR: memberId is undefined at this point
```

### Potential Issues
1. **Timing**: `memberId` not set yet when RSVPModal mounts?
2. **React State**: `setMemberId()` called but not propagated?
3. **Hook Dependency**: `useRSVP` not re-rendering when `memberId` changes?
4. **Context Missing**: Is there a React Context that should wrap these components?

---

## Priority & Complexity

**Priority**: 🔴 HIGH - RSVP system blocks Phase 3 completion
**Complexity**: Medium - Either quick bypass or architectural refactor needed
**Estimated Time**: 1-2 hours (quick fix) or 4-6 hours (architectural refactor)

---

## Next Session Action Plan

1. **Start with debugging** (15 min)
   - Add console logs throughout the chain
   - Verify `memberId` at each step
   - Identify WHERE it becomes NULL

2. **Quick fix if timing issue** (30 min)
   - Add loading state to RSVPModal
   - Wait for `memberId` before rendering form
   - Or use fallback member ID

3. **OR architectural refactor** (4-6 hours)
   - Design member-centric auth system
   - Update database schema
   - Refactor all auth hooks
   - Update all RLS policies
   - Test thoroughly

4. **Document decision** (15 min)
   - Create ADR if architectural change
   - Update this handoff with resolution

---

## Contact & Resources

**CEO Approval Required For**: Architectural refactor (Option 2)
**COO Review**: Code quality after fix implementation
**CTO Autonomy**: Quick fix (Option 1), debugging (Option 3)

**Key Documentation**:
- [Database README](../database/README.md)
- [Phase 3 Dev Journal](../dev-journals/2025-12-02-phase3-rsvp-attendance-components.md)
- [System Architecture](../governance/system-architecture.md)

---

**Last Updated**: 2025-12-02
**Next Session**: Continue troubleshooting with fresh context
