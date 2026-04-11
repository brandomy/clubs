# Implementation Plan: Hybrid Modal + URL Routing for Georgetown

**Project:** Georgetown Rotary Club Management App
**Feature:** Hybrid Modal + URL Routing Architecture
**Estimated Effort:** 18-20 hours
**Risk Level:** Low
**Status:** Planning

---

## Executive Summary

This plan details the implementation of hybrid modal + URL routing for Georgetown, migrating from component-based modal state management to URL-based routing while maintaining identical visual UX.

**Goal:** Enable shareable URLs, browser history, bookmarking, and deep linking for all card detail views.

**Approach:** Incremental migration, one entity type at a time, starting with Speakers as pilot.

---

## Prerequisites

- ✅ Georgetown app running locally
- ✅ React Router 6+ installed (already in use)
- ✅ All modal components working (already in place)
- ✅ TypeScript types defined (already in place)
- ✅ Supabase queries working (already in place)

---

## Implementation Phases

### Phase 0: Setup & Preparation (1 hour)

**Goal:** Prepare project structure and understand current architecture

**Tasks:**

1. **Create routes directory**
   ```bash
   mkdir -p apps/georgetown/src/routes
   ```

2. **Review current modal implementations**
   - Read `SpeakerDetailModal.tsx`
   - Read `SpeakerModal.tsx` (edit form)
   - Read `SpeakerCard.tsx` (card component)
   - Read `KanbanBoard.tsx` (board component)
   - Understand current state management

3. **Create shared types/utilities**
   ```typescript
   // src/routes/RouteUtils.ts
   export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

   export function validateUUID(id: string): boolean {
     return UUID_REGEX.test(id)
   }

   export function createLoadingModal() {
     return (
       <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
         <div className="bg-white rounded-lg p-6">
           <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
         </div>
       </div>
     )
   }
   ```

4. **Document current URL structure**
   ```
   Current URLs:
   /speakers              → Kanban board
   /projects              → Service projects page
   /members               → Member directory
   /partners              → Partners page
   /calendar              → Calendar view (events + holidays)

   Future URLs (to add):
   /speakers/:id          → Speaker detail modal
   /speakers/:id/edit     → Speaker edit modal
   /projects/:id          → Project detail modal
   /projects/:id/edit     → Project edit modal
   /members/:id           → Member detail modal
   /members/:id/edit      → Member edit modal
   /partners/:id          → Partner detail modal
   /partners/:id/edit     → Partner edit modal
   /calendar/events/:id   → Event detail modal
   /calendar/holidays/:id → Holiday detail modal
   ```

**Deliverables:**
- ✅ Routes directory created
- ✅ Current architecture documented
- ✅ Shared utilities created
- ✅ URL structure documented

---

### Phase 1: Speakers - Detail View (3-4 hours)

**Goal:** Implement hybrid routing for speaker detail view as pilot

**Tasks:**

#### 1.1 Create SpeakerDetailRoute Component (1 hour)

**File:** `src/routes/SpeakerDetailRoute.tsx`

```typescript
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import SpeakerDetailModal from '../components/SpeakerDetailModal'
import type { Speaker } from '../types/database'
import { validateUUID } from './RouteUtils'

export default function SpeakerDetailRoute() {
  const { speakerId } = useParams<{ speakerId: string }>()
  const navigate = useNavigate()
  const [speaker, setSpeaker] = useState<Speaker | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSpeaker()
  }, [speakerId])

  const loadSpeaker = async () => {
    if (!speakerId || !validateUUID(speakerId)) {
      navigate('/speakers')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('speakers')
        .select('*')
        .eq('id', speakerId)
        .single()

      if (error || !data) {
        console.error('Error loading speaker:', error)
        navigate('/speakers')
        return
      }

      setSpeaker(data)
    } catch (err) {
      console.error('Error loading speaker:', err)
      setError('Failed to load speaker')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    navigate('/speakers')
  }

  const handleEdit = () => {
    navigate(`/speakers/${speakerId}/edit`)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  if (error || !speaker) {
    return null
  }

  return (
    <SpeakerDetailModal
      speaker={speaker}
      onClose={handleClose}
      onEdit={handleEdit}
    />
  )
}
```

**Implementation notes:**
- Loads speaker from database using URL parameter
- Validates UUID format
- Handles loading state with spinner
- Handles errors (redirects to board if speaker not found)
- Passes navigation handlers to modal

#### 1.2 Update SpeakerDetailModal (30 min)

**File:** `src/components/SpeakerDetailModal.tsx`

**Changes needed:**
- Add optional `onEdit` prop
- Call `onEdit()` when Edit button clicked (instead of local state toggle)

```typescript
// Add to interface
interface SpeakerDetailModalProps {
  speaker: Speaker
  onClose: () => void
  onEdit?: () => void  // New: Optional edit handler
}

// Update Edit button click handler
const handleEdit = () => {
  if (onEdit) {
    onEdit()  // Use passed handler (triggers navigation)
  } else {
    // Fallback to old behavior (for backwards compatibility during migration)
    setIsEditMode(true)
  }
}
```

**Why optional?**
- Allows gradual migration
- Component still works in non-routed contexts during development

#### 1.3 Create SpeakersPage Wrapper (30 min)

**File:** `src/components/SpeakersPage.tsx`

```typescript
import { Outlet } from 'react-router-dom'
import KanbanBoard from './KanbanBoard'

/**
 * Page wrapper for speakers section
 * Renders Kanban board + outlet for modals (via nested routes)
 */
export default function SpeakersPage() {
  return (
    <>
      {/* Board - always visible */}
      <KanbanBoard />

      {/* Modal outlet - renders child routes */}
      <Outlet />
    </>
  )
}
```

**Note:** This is a simple wrapper that doesn't change any logic

#### 1.4 Update App.tsx Router Config (30 min)

**File:** `src/App.tsx`

```typescript
// Add import
import SpeakersPage from './components/SpeakersPage'
import SpeakerDetailRoute from './routes/SpeakerDetailRoute'

// Update routes
<Routes>
  {/* ... existing routes ... */}

  {/* OLD: Flat route */}
  {/* <Route path="/speakers" element={<KanbanBoard />} /> */}

  {/* NEW: Nested route structure */}
  <Route path="/speakers" element={<SpeakersPage />}>
    <Route path=":speakerId" element={<SpeakerDetailRoute />} />
  </Route>

  {/* ... other routes ... */}
</Routes>
```

**What this does:**
- `/speakers` renders `SpeakersPage` (which includes `KanbanBoard`)
- `/speakers/:id` renders `SpeakersPage` + `SpeakerDetailRoute` (via `<Outlet />`)
- Visual result: Modal appears over board when URL has speaker ID

#### 1.5 Update SpeakerCard Component (30 min)

**File:** `src/components/SpeakerCard.tsx`

```typescript
// Add import
import { useNavigate } from 'react-router-dom'

export default function SpeakerCard({ speaker }: SpeakerCardProps) {
  const navigate = useNavigate()

  // BEFORE:
  // const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  // const handleCardClick = () => setIsViewModalOpen(true)

  // AFTER:
  const handleCardClick = () => {
    navigate(`/speakers/${speaker.id}`)
  }

  return (
    <>
      <div onClick={handleCardClick}>
        {/* Card UI - no changes */}
      </div>

      {/* REMOVE: Modal no longer rendered here */}
      {/* {isViewModalOpen && (
        <SpeakerDetailModal
          speaker={speaker}
          onClose={() => setIsViewModalOpen(false)}
        />
      )} */}
    </>
  )
}
```

**Changes:**
- Replace `useState` with `useNavigate`
- Replace `setIsViewModalOpen(true)` with `navigate()`
- Remove modal rendering (now handled by router)

#### 1.6 Testing (1 hour)

**Manual tests:**

1. **Direct URL access**
   ```
   Navigate to: http://localhost:5180/speakers/[actual-speaker-id]
   Expected: Board loads, modal opens for speaker
   ```

2. **Card click**
   ```
   Click speaker card
   Expected: URL updates to /speakers/[id], modal opens
   ```

3. **Close modal**
   ```
   Click X button in modal
   Expected: URL returns to /speakers, modal closes
   ```

4. **Browser back button**
   ```
   Open modal, press browser back
   Expected: Modal closes, URL returns to /speakers
   ```

5. **Edit button**
   ```
   Click Edit in detail modal
   Expected: URL updates to /speakers/[id]/edit
   Note: Will redirect to board (edit route not implemented yet)
   ```

6. **Invalid speaker ID**
   ```
   Navigate to: http://localhost:5180/speakers/999999
   Expected: Redirects to /speakers (board)
   ```

7. **Share URL**
   ```
   Open modal, copy URL from address bar
   Paste URL in new tab
   Expected: Modal opens directly for that speaker
   ```

8. **Mobile testing** (if available)
   ```
   Open on phone/tablet
   Test back gesture
   Expected: Closes modal
   ```

**Automated tests:**
```typescript
// src/routes/SpeakerDetailRoute.test.tsx
describe('SpeakerDetailRoute', () => {
  test('loads speaker and renders modal', async () => {
    // Test implementation
  })

  test('redirects if speaker not found', async () => {
    // Test implementation
  })

  test('validates UUID format', async () => {
    // Test implementation
  })
})
```

**Deliverables:**
- ✅ Direct URLs work
- ✅ Card clicks update URL and open modal
- ✅ Close button works (navigates back)
- ✅ Browser back works
- ✅ Invalid IDs handled gracefully
- ✅ Visual UX unchanged (modal looks identical)

---

### Phase 2: Speakers - Edit View (2-3 hours)

**Goal:** Implement hybrid routing for speaker edit modal

**Tasks:**

#### 2.1 Create SpeakerEditRoute Component (1 hour)

**File:** `src/routes/SpeakerEditRoute.tsx`

```typescript
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import SpeakerModal from '../components/SpeakerModal'
import type { Speaker } from '../types/database'
import { validateUUID } from './RouteUtils'

export default function SpeakerEditRoute() {
  const { speakerId } = useParams<{ speakerId: string }>()
  const navigate = useNavigate()
  const [speaker, setSpeaker] = useState<Speaker | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSpeaker()
  }, [speakerId])

  const loadSpeaker = async () => {
    if (!speakerId || !validateUUID(speakerId)) {
      navigate('/speakers')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('speakers')
        .select('*')
        .eq('id', speakerId)
        .single()

      if (error || !data) {
        console.error('Error loading speaker:', error)
        navigate('/speakers')
        return
      }

      setSpeaker(data)
    } catch (err) {
      console.error('Error loading speaker:', err)
      navigate('/speakers')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    // Return to detail view (not board)
    navigate(`/speakers/${speakerId}`)
  }

  const handleSave = async () => {
    // After save, return to detail view
    navigate(`/speakers/${speakerId}`)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  if (!speaker) {
    return null
  }

  return (
    <SpeakerModal
      speaker={speaker}
      onClose={handleClose}
    />
  )
}
```

**Implementation notes:**
- Similar to detail route, but renders edit modal
- Navigates back to detail view (not board) on close/save
- This creates a natural flow: Board → Detail → Edit → Detail → Board

#### 2.2 Update App.tsx Router (15 min)

**File:** `src/App.tsx`

```typescript
// Add import
import SpeakerEditRoute from './routes/SpeakerEditRoute'

// Update routes
<Route path="/speakers" element={<SpeakersPage />}>
  <Route path=":speakerId" element={<SpeakerDetailRoute />} />
  <Route path=":speakerId/edit" element={<SpeakerEditRoute />} />  {/* New */}
</Route>
```

#### 2.3 Update SpeakerModal (if needed) (30 min)

**File:** `src/components/SpeakerModal.tsx`

**Review:**
- Check if `onClose` is called on save (should be)
- Check if `onClose` is called on cancel (should be)
- Ensure no internal navigation logic

**Most likely:** No changes needed (modal already supports external close handlers)

#### 2.4 Testing (1 hour)

**Manual tests:**

1. **Edit from detail view**
   ```
   Open speaker detail → Click Edit
   Expected: URL updates to /speakers/[id]/edit, edit modal opens
   ```

2. **Save changes**
   ```
   Edit speaker → Click Save
   Expected: URL updates to /speakers/[id], detail modal shows updated data
   ```

3. **Cancel edit**
   ```
   Edit speaker → Click Cancel/X
   Expected: URL updates to /speakers/[id], detail modal shows (no changes saved)
   ```

4. **Direct URL to edit**
   ```
   Navigate to: http://localhost:5180/speakers/[id]/edit
   Expected: Board loads, edit modal opens
   ```

5. **Browser back from edit**
   ```
   Open edit modal → Press back
   Expected: URL updates to /speakers/[id], detail modal shows
   ```

6. **Full flow**
   ```
   Board → Click card → Detail modal opens
   Click Edit → Edit modal opens
   Click Save → Detail modal shows updated data
   Click Close → Board shows
   Press Back → Detail modal opens
   Press Back → Board shows
   ```

**Deliverables:**
- ✅ Edit URLs work
- ✅ Edit from detail view works
- ✅ Save returns to detail view
- ✅ Cancel returns to detail view
- ✅ Browser history tracks edit flow
- ✅ Direct edit URLs work

---

### Phase 3: Service Projects (3-4 hours)

**Goal:** Replicate speakers pattern for service projects

**Tasks:**

#### 3.1 Create Project Routes (1.5 hours)

**Files to create:**
- `src/routes/ProjectDetailRoute.tsx` (copy from `SpeakerDetailRoute.tsx`)
- `src/routes/ProjectEditRoute.tsx` (copy from `SpeakerEditRoute.tsx`)

**Changes needed:**
- Update imports (use `ServiceProjectDetailModal`, `ServiceProjectModal`)
- Update types (`ServiceProject` instead of `Speaker`)
- Update database table (`service_projects` instead of `speakers`)
- Update URL paths (`/projects` instead of `/speakers`)

#### 3.2 Create ProjectsPage Wrapper (15 min)

**File:** `src/components/ProjectsPage.tsx`

```typescript
import { Outlet } from 'react-router-dom'
import ServiceProjectsPage from './ServiceProjectsPage'

export default function ProjectsPage() {
  return (
    <>
      <ServiceProjectsPage />  {/* Existing projects page */}
      <Outlet />                {/* Modal outlet */}
    </>
  )
}
```

#### 3.3 Update App.tsx Router (15 min)

```typescript
import ProjectsPage from './components/ProjectsPage'
import ProjectDetailRoute from './routes/ProjectDetailRoute'
import ProjectEditRoute from './routes/ProjectEditRoute'

<Route path="/projects" element={<ProjectsPage />}>
  <Route path=":projectId" element={<ProjectDetailRoute />} />
  <Route path=":projectId/edit" element={<ProjectEditRoute />} />
</Route>
```

#### 3.4 Update ServiceProjectCard (30 min)

**File:** `src/components/ServiceProjectCard.tsx`

- Add `useNavigate` hook
- Replace modal state with `navigate(`/projects/${project.id}`)`
- Remove modal rendering

#### 3.5 Update Modal Components (if needed) (30 min)

**Files:**
- `src/components/ServiceProjectDetailModal.tsx`
- `src/components/ServiceProjectModal.tsx`

**Changes:**
- Add `onEdit` prop to detail modal (if not already present)
- Ensure `onClose` is used consistently

#### 3.6 Testing (1 hour)

**Test same scenarios as speakers:**
- Direct URLs
- Card clicks
- Close modal
- Edit flow
- Browser back
- Share URL

**Deliverables:**
- ✅ Project detail URLs work
- ✅ Project edit URLs work
- ✅ All navigation flows work
- ✅ Visual UX unchanged

---

### Phase 4: Members (2-3 hours)

**Goal:** Implement hybrid routing for members

**Tasks:**

#### 4.1 Create Member Routes (1.5 hours)

**Files to create:**
- `src/routes/MemberDetailRoute.tsx`
- `src/routes/MemberEditRoute.tsx`

**Pattern:** Same as speakers/projects

#### 4.2 Create MembersPage Wrapper (15 min)

**File:** `src/components/MembersPage.tsx`

```typescript
import { Outlet } from 'react-router-dom'
import MemberDirectory from './MemberDirectory'

export default function MembersPage() {
  return (
    <>
      <MemberDirectory />
      <Outlet />
    </>
  )
}
```

#### 4.3 Update App.tsx Router (15 min)

```typescript
<Route path="/members" element={<MembersPage />}>
  <Route path=":memberId" element={<MemberDetailRoute />} />
  <Route path=":memberId/edit" element={<MemberEditRoute />} />
</Route>
```

#### 4.4 Update MemberCard (30 min)

- Use `navigate()` instead of state
- Remove modal rendering

#### 4.5 Testing (1 hour)

**Deliverables:**
- ✅ Member URLs work
- ✅ All navigation flows work

---

### Phase 5: Partners (2-3 hours)

**Goal:** Implement hybrid routing for partners

**Tasks:**

#### 5.1 Create Partner Routes (1.5 hours)

**Files to create:**
- `src/routes/PartnerDetailRoute.tsx`
- `src/routes/PartnerEditRoute.tsx`

#### 5.2 Create PartnersPage Wrapper (15 min)

**File:** `src/components/PartnersPageWrapper.tsx`

```typescript
import { Outlet } from 'react-router-dom'
import PartnersPage from './PartnersPage'

export default function PartnersPageWrapper() {
  return (
    <>
      <PartnersPage />
      <Outlet />
    </>
  )
}
```

#### 5.3 Update App.tsx Router (15 min)

```typescript
<Route path="/partners" element={<PartnersPageWrapper />}>
  <Route path=":partnerId" element={<PartnerDetailRoute />} />
  <Route path=":partnerId/edit" element={<PartnerEditRoute />} />
</Route>
```

#### 5.4 Update PartnerCard (30 min)

- Use `navigate()` instead of state
- Remove modal rendering

#### 5.5 Testing (1 hour)

**Deliverables:**
- ✅ Partner URLs work
- ✅ All navigation flows work

---

### Phase 6: Calendar (Events & Holidays) (3-4 hours)

**Goal:** Implement hybrid routing for calendar modals

**Tasks:**

#### 6.1 Create Event Routes (1.5 hours)

**Files to create:**
- `src/routes/EventDetailRoute.tsx`
- `src/routes/EventEditRoute.tsx`

**URL structure:**
- Detail: `/calendar/events/:eventId`
- Edit: `/calendar/events/:eventId/edit`

#### 6.2 Create Holiday Routes (1.5 hours)

**Files to create:**
- `src/routes/HolidayDetailRoute.tsx`
- `src/routes/HolidayEditRoute.tsx`

**URL structure:**
- Detail: `/calendar/holidays/:holidayId`
- Edit: `/calendar/holidays/:holidayId/edit`

#### 6.3 Update App.tsx Router (30 min)

```typescript
<Route path="/calendar" element={<CalendarPageWrapper />}>
  <Route path="events/:eventId" element={<EventDetailRoute />} />
  <Route path="events/:eventId/edit" element={<EventEditRoute />} />
  <Route path="holidays/:holidayId" element={<HolidayDetailRoute />} />
  <Route path="holidays/:holidayId/edit" element={<HolidayEditRoute />} />
</Route>
```

#### 6.4 Update CalendarView (30 min)

**File:** `src/components/CalendarView.tsx`

- Update event click handlers to use `navigate()`
- Update holiday click handlers to use `navigate()`
- Remove modal rendering

#### 6.5 Create CalendarPageWrapper (15 min)

```typescript
import { Outlet } from 'react-router-dom'
import CalendarView from './CalendarView'

export default function CalendarPageWrapper() {
  return (
    <>
      <CalendarView />
      <Outlet />
    </>
  )
}
```

#### 6.6 Testing (1 hour)

**Test scenarios:**
- Event detail URLs
- Holiday detail URLs
- Edit flows for both
- Calendar navigation

**Deliverables:**
- ✅ Event URLs work
- ✅ Holiday URLs work
- ✅ All navigation flows work

---

### Phase 7: Testing & Polish (3-4 hours)

**Goal:** Comprehensive testing and bug fixes

**Tasks:**

#### 7.1 Cross-Browser Testing (1 hour)

**Test on:**
- Chrome (desktop)
- Safari (desktop)
- Firefox (desktop)
- Safari (iOS)
- Chrome (Android)

**Test:**
- Direct URLs
- Browser back/forward
- Share URLs
- Bookmarks

#### 7.2 Mobile Testing (1 hour)

**Test on physical devices:**
- iPhone (Safari)
- Android phone (Chrome)

**Test:**
- Back gesture
- Share sheet
- URL copying
- Keyboard (if editing)

#### 7.3 Edge Cases (1 hour)

**Test scenarios:**
- Invalid UUIDs in URL
- Non-existent IDs
- Network errors during load
- Multiple rapid clicks
- Browser refresh on modal
- Direct edit URL (skip detail view)

#### 7.4 Performance Testing (30 min)

**Measure:**
- Modal open time (should be <100ms)
- Direct URL load time (should be <500ms)
- Browser back speed (should be instant)

**Tools:**
- Chrome DevTools Performance tab
- React DevTools Profiler

#### 7.5 Accessibility Testing (30 min)

**Test with:**
- Screen reader (VoiceOver on Mac/iOS)
- Keyboard only (Tab, Enter, Escape)
- Focus management

**Verify:**
- Focus trap in modal
- Escape key closes modal
- Focus returns to card on close
- ARIA attributes correct

#### 7.6 Bug Fixes & Polish (1 hour)

- Fix any issues found in testing
- Improve loading states if needed
- Add error messages if needed
- Polish animations/transitions

**Deliverables:**
- ✅ All browsers work
- ✅ Mobile devices work
- ✅ Edge cases handled
- ✅ Performance acceptable
- ✅ Accessibility maintained
- ✅ All bugs fixed

---

## Rollback Plan

### If Critical Issue Found

**Quick rollback (per entity):**

1. **Revert card component**
   ```bash
   git checkout HEAD~1 src/components/SpeakerCard.tsx
   ```

2. **Revert router config**
   ```bash
   git checkout HEAD~1 src/App.tsx
   ```

3. **Restart dev server**
   ```bash
   pnpm dev:georgetown
   ```

**Full rollback:**
```bash
git revert <commit-range>
```

**Risk mitigation:**
- Implement one entity at a time
- Commit after each phase
- Test thoroughly before next phase
- Keep PRs small (one entity per PR)

---

## Success Criteria

### Functional Requirements

- ✅ Direct URLs work for all entities
- ✅ Browser back button closes modals
- ✅ Share button copies correct URL
- ✅ Bookmarks open correct modal
- ✅ Edit flow works (detail → edit → save → detail)
- ✅ Invalid IDs handled gracefully
- ✅ Loading states shown appropriately
- ✅ Errors handled gracefully

### Non-Functional Requirements

- ✅ Visual UX identical to before (no user-visible changes)
- ✅ Performance: Modal opens in <100ms
- ✅ Performance: Direct URL loads in <500ms
- ✅ Accessibility maintained (WCAG 2.1 AA)
- ✅ Mobile experience smooth (60fps animations)
- ✅ Browser history works intuitively
- ✅ No breaking changes to existing features

### Code Quality

- ✅ TypeScript types correct
- ✅ No console errors
- ✅ No console warnings
- ✅ Code follows existing patterns
- ✅ Comments added where needed
- ✅ Consistent naming conventions

---

## Post-Implementation Tasks

### Documentation

1. **Update README** (if needed)
   - Document new URL structure
   - Add examples of shareable URLs

2. **Update CLAUDE.md** (if needed)
   - Document routing architecture
   - Add guidance for future modal implementations

3. **Create runbook** (optional)
   - How to add new modal routes
   - Common pitfalls and solutions

### Knowledge Transfer

1. **Demo to team**
   - Show new functionality
   - Explain technical architecture
   - Answer questions

2. **Share learnings**
   - Document any issues encountered
   - Share solutions for future reference

### Monitoring

1. **Analytics**
   - Add tracking for modal views (if needed)
   - Monitor URL sharing patterns

2. **Error tracking**
   - Monitor for 404s on modal URLs
   - Track navigation errors

---

## Dependencies

### Technical Dependencies

- React Router 6+ (already installed)
- React 19+ (already installed)
- TypeScript (already configured)
- Supabase client (already configured)

### Team Dependencies

- Product approval (review UX unchanged)
- QA testing (if applicable)
- Deployment approval

---

## Timeline

### Detailed Breakdown

| Phase | Description | Duration | Dependencies |
|-------|-------------|----------|--------------|
| 0 | Setup & preparation | 1 hour | None |
| 1 | Speakers - detail view | 3-4 hours | Phase 0 |
| 2 | Speakers - edit view | 2-3 hours | Phase 1 |
| 3 | Service projects | 3-4 hours | Phase 2 |
| 4 | Members | 2-3 hours | Phase 3 |
| 5 | Partners | 2-3 hours | Phase 4 |
| 6 | Calendar (events + holidays) | 3-4 hours | Phase 5 |
| 7 | Testing & polish | 3-4 hours | Phase 6 |

**Total:** 18-24 hours

### Schedule Options

**Option A: Incremental (Recommended)**
- Implement one entity per day
- Test thoroughly before moving to next
- Lower risk, easier to debug

**Option B: Batch by Type**
- Day 1: All detail views (speakers, projects, members, partners, calendar)
- Day 2: All edit views
- Day 3: Testing & polish
- Faster, but higher risk

**Option C: MVP First**
- Day 1: Speakers only (detail + edit)
- Validate approach
- Day 2-3: All other entities
- Safest approach for first implementation

---

## Risk Management

### Identified Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Browser back breaks | High | Low | Thorough testing, easy rollback |
| Mobile back gesture fails | Medium | Low | Test on real devices early |
| Performance regression | Low | Low | Profile before/after |
| UX change noticed by users | High | Low | Keep modals visually identical |
| Breaking existing features | High | Low | Incremental rollout, testing |
| Route conflicts | Medium | Low | Clear URL structure, testing |

### Mitigation Strategies

1. **Incremental rollout**
   - One entity at a time
   - Easy to identify issues

2. **Thorough testing**
   - Test each phase before proceeding
   - Use multiple browsers/devices

3. **Easy rollback**
   - Small commits
   - Keep old code accessible
   - Document rollback process

4. **Feature flag** (optional)
   ```typescript
   const useHybridRouting = import.meta.env.VITE_HYBRID_ROUTING === 'true'

   if (useHybridRouting) {
     navigate(`/speakers/${id}`)
   } else {
     setIsModalOpen(true)
   }
   ```

---

## Communication Plan

### Stakeholder Updates

**Before implementation:**
- Share TDD for approval
- Review implementation plan
- Get buy-in on timeline

**During implementation:**
- Daily updates (if applicable)
- Flag any blockers immediately
- Share progress after each phase

**After implementation:**
- Demo new functionality
- Share metrics (if applicable)
- Gather feedback

### User Communication

**If users need to know:**
- "You can now share direct links to speakers/projects"
- "Browser back button now works as expected"
- "Bookmark your favorite items for quick access"

**Most likely:** Silent update (no user-visible changes)

---

## Lessons Learned (To Document After Implementation)

### What Went Well
- [To be filled after implementation]

### What Could Be Improved
- [To be filled after implementation]

### Unexpected Issues
- [To be filled after implementation]

### Future Recommendations
- [To be filled after implementation]

---

## Appendix A: File Checklist

### Files to Create

- [ ] `src/routes/RouteUtils.ts`
- [ ] `src/routes/SpeakerDetailRoute.tsx`
- [ ] `src/routes/SpeakerEditRoute.tsx`
- [ ] `src/routes/ProjectDetailRoute.tsx`
- [ ] `src/routes/ProjectEditRoute.tsx`
- [ ] `src/routes/MemberDetailRoute.tsx`
- [ ] `src/routes/MemberEditRoute.tsx`
- [ ] `src/routes/PartnerDetailRoute.tsx`
- [ ] `src/routes/PartnerEditRoute.tsx`
- [ ] `src/routes/EventDetailRoute.tsx`
- [ ] `src/routes/EventEditRoute.tsx`
- [ ] `src/routes/HolidayDetailRoute.tsx`
- [ ] `src/routes/HolidayEditRoute.tsx`
- [ ] `src/components/SpeakersPage.tsx`
- [ ] `src/components/ProjectsPage.tsx`
- [ ] `src/components/MembersPage.tsx`
- [ ] `src/components/PartnersPageWrapper.tsx`
- [ ] `src/components/CalendarPageWrapper.tsx`

### Files to Modify

- [ ] `src/App.tsx` (router config)
- [ ] `src/components/SpeakerCard.tsx`
- [ ] `src/components/ServiceProjectCard.tsx`
- [ ] `src/components/MemberCard.tsx`
- [ ] `src/components/PartnerCard.tsx`
- [ ] `src/components/CalendarView.tsx`
- [ ] `src/components/SpeakerDetailModal.tsx` (add `onEdit` prop)
- [ ] `src/components/ServiceProjectDetailModal.tsx` (add `onEdit` prop)
- [ ] `src/components/MemberDetailModal.tsx` (add `onEdit` prop)
- [ ] `src/components/PartnerDetailModal.tsx` (add `onEdit` prop)

### Files to Test

- All created files (unit tests)
- Integration tests for flows
- E2E tests for critical paths

---

## Appendix B: URL Reference

### Final URL Structure

```
Speakers:
  Board:       /speakers
  Detail:      /speakers/:speakerId
  Edit:        /speakers/:speakerId/edit

Service Projects:
  Board:       /projects
  Detail:      /projects/:projectId
  Edit:        /projects/:projectId/edit

Members:
  Directory:   /members
  Detail:      /members/:memberId
  Edit:        /members/:memberId/edit

Partners:
  List:        /partners
  Detail:      /partners/:partnerId
  Edit:        /partners/:partnerId/edit

Calendar:
  View:        /calendar
  Event Detail: /calendar/events/:eventId
  Event Edit:   /calendar/events/:eventId/edit
  Holiday Detail: /calendar/holidays/:holidayId
  Holiday Edit:   /calendar/holidays/:holidayId/edit
```

---

## Appendix C: Testing Checklist

### Per Entity Testing

For each entity (speakers, projects, members, partners, events, holidays):

**Functional tests:**
- [ ] Direct URL to detail view works
- [ ] Direct URL to edit view works
- [ ] Card click opens detail modal
- [ ] URL updates when modal opens
- [ ] Close button navigates back
- [ ] Browser back closes modal
- [ ] Edit button navigates to edit view
- [ ] Save returns to detail view
- [ ] Cancel returns to detail view
- [ ] Invalid ID redirects to board
- [ ] Non-existent ID redirects to board

**Navigation flow tests:**
- [ ] Board → Detail → Close → Board
- [ ] Board → Detail → Edit → Save → Detail → Close → Board
- [ ] Board → Detail → Edit → Cancel → Detail → Close → Board
- [ ] Direct URL → Detail → Edit → Save → Detail → Close → Board
- [ ] Multiple rapid clicks don't break navigation

**Browser tests:**
- [ ] Works in Chrome
- [ ] Works in Safari
- [ ] Works in Firefox
- [ ] Works in Edge
- [ ] Works in Mobile Safari (iOS)
- [ ] Works in Mobile Chrome (Android)

**Sharing tests:**
- [ ] Copy URL from address bar works
- [ ] Share button (if present) shares correct URL
- [ ] Paste URL in new tab/window opens modal
- [ ] Share via Slack/email/text works

**Bookmark tests:**
- [ ] Cmd+D bookmarks modal view
- [ ] Click bookmark opens modal

**Performance tests:**
- [ ] Modal opens in <100ms (from card click)
- [ ] Direct URL loads in <500ms
- [ ] Browser back is instant
- [ ] No memory leaks on repeated open/close

**Accessibility tests:**
- [ ] Escape key closes modal
- [ ] Tab navigation works
- [ ] Focus trap works in modal
- [ ] Focus returns to card on close
- [ ] Screen reader announces modal
- [ ] ARIA attributes correct

---

## Appendix D: Code Snippets

### Loading Modal Component

```typescript
// src/components/LoadingModal.tsx
export default function LoadingModal() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
```

### Error Modal Component

```typescript
// src/components/ErrorModal.tsx
interface ErrorModalProps {
  message: string
  onClose: () => void
}

export default function ErrorModal({ message, onClose }: ErrorModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md">
        <div className="flex items-center text-red-600 mb-4">
          <AlertCircle className="w-6 h-6 mr-2" />
          <h2 className="text-lg font-semibold">Error</h2>
        </div>
        <p className="text-gray-700 mb-4">{message}</p>
        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  )
}
```

---

**Plan Status:** Ready for implementation
**Next Step:** Review and approve, then begin Phase 0
