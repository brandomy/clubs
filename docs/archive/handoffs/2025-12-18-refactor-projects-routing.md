# Handoff: Refactor Projects Routing to Match Speakers Pattern

**Date:** 2025-12-18
**Priority:** Medium
**Effort:** Small (< 2 hours)
**Type:** Technical Debt / Standardization

---

## Context

Currently, the application uses **inconsistent routing patterns**:

### Current State

**Speakers** (RESTful path parameters):
```
URL: /speakers/b22acb96-df4b-40bc-aca9-a1f5c20305e3
Pattern: /speakers/:speakerId
```

**Projects** (Query parameters):
```
URL: /projects?id=c55d2a29-c27c-4500-9221-26f9bbda4805
Pattern: /projects (with query string)
```

### Why This Matters

1. **Inconsistency:** Different patterns for similar functionality
2. **SEO:** Path-based URLs are preferred by search engines
3. **UX:** Cleaner, more intuitive URLs
4. **Maintainability:** Single routing pattern easier to understand

---

## Task: Standardize on Path Parameters

**Goal:** Migrate projects from query parameters to path parameters to match speakers.

### Desired End State

**Projects** (RESTful path parameters - like speakers):
```
URL: /projects/c55d2a29-c27c-4500-9221-26f9bbda4805
Pattern: /projects/:projectId
```

---

## Implementation Guide

### Step 1: Update Route Configuration

**File:** `apps/georgetown/src/App.tsx`

**Current (line 51):**
```tsx
<Route path="/projects" element={<ServiceProjectsPage />} />
```

**New:**
```tsx
{/* Projects - Nested routes for consistent pattern with speakers */}
<Route path="/projects" element={<ServiceProjectsPage />}>
  <Route path=":projectId" element={<ProjectDetailRoute />} />
</Route>
```

---

### Step 2: Create ProjectDetailRoute Component

**File:** `apps/georgetown/src/components/ProjectDetailRoute.tsx` (NEW)

**Purpose:** Handle project detail modal with URL routing

**Implementation Pattern:** Copy from `SpeakerDetailRoute.tsx` and adapt

**Key differences:**
- Use `useParams()` to get `projectId` instead of `searchParams.get('id')`
- Pass to `ServiceProjectDetailModal` component
- Handle modal close with `navigate('/projects')`

---

### Step 3: Update ServiceProjectsPage

**File:** `apps/georgetown/src/components/ServiceProjectsPage.tsx`

**Current (line 212):**
```tsx
const projectId = searchParams.get('id')
```

**New:**
```tsx
// Remove searchParams handling - now handled by ProjectDetailRoute
// Keep the grid view and modal handling for inline clicks
```

---

### Step 4: Update Share URL Generation

**File:** `apps/georgetown/src/utils/shareHelpers.ts`

**Current:**
```tsx
export function getProjectShareUrl(projectId: string): string {
  return `${BASE_URL}/projects?id=${projectId}`
}
```

**New:**
```tsx
export function getProjectShareUrl(projectId: string): string {
  return `${BASE_URL}/projects/${projectId}`
}
```

---

### Step 5: Update Middleware

**File:** `apps/georgetown/functions/_middleware.ts`

**Current (line 102-142):**
```typescript
// Process service project URLs: /projects?id=uuid
if (url.pathname === '/projects') {
  const projectId = url.searchParams.get('id')
  // ...
}
```

**New:**
```typescript
// Process service project URLs: /projects/:uuid
const projectMatch = url.pathname.match(/^\/projects\/([^/]+)$/)
if (projectMatch) {
  const projectId = projectMatch[1]

  if (UUID_REGEX.test(projectId)) {
    // ... rest stays the same
  }
}
```

---

### Step 6: Add Backwards Compatibility Redirect

**File:** `apps/georgetown/src/App.tsx`

**Add after line 72:**
```tsx
{/* Redirect old query-based project URLs to new path-based URLs */}
<Route path="/projects" element={<ProjectQueryRedirect />} />
```

**Create redirect component:**
```tsx
// apps/georgetown/src/components/ProjectQueryRedirect.tsx
function ProjectQueryRedirect() {
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('id')

  if (projectId) {
    return <Navigate to={`/projects/${projectId}`} replace />
  }

  return <ServiceProjectsPage />
}
```

---

## Testing Checklist

### After Implementation

- [ ] **Direct URL access works**
  - Navigate to `/projects/[UUID]` shows modal
  - URL updates when opening project from grid

- [ ] **Navigation works**
  - Click project card → URL updates to `/projects/[UUID]`
  - Close modal → Returns to `/projects`

- [ ] **Backwards compatibility**
  - `/projects?id=[UUID]` redirects to `/projects/[UUID]`
  - Old URLs still work (from bookmarks/shares)

- [ ] **Share functionality**
  - Share button generates new URL format
  - Social media previews still work

- [ ] **Middleware**
  - `curl -A "Twitterbot" https://georgetown-rotary.pages.dev/projects/[UUID]`
  - Returns correct Open Graph tags

---

## Files to Modify

1. ✏️ `apps/georgetown/src/App.tsx` - Update route config
2. ✨ `apps/georgetown/src/components/ProjectDetailRoute.tsx` - NEW file
3. ✏️ `apps/georgetown/src/components/ServiceProjectsPage.tsx` - Remove query param handling
4. ✏️ `apps/georgetown/src/utils/shareHelpers.ts` - Update URL generation
5. ✏️ `apps/georgetown/functions/_middleware.ts` - Update pattern matching
6. ✨ `apps/georgetown/src/components/ProjectQueryRedirect.tsx` - NEW file (optional)
7. 🔨 `apps/georgetown/functions/tsconfig.json` - Rebuild functions

---

## Risks and Mitigation

### Risk 1: Breaking Existing Shared URLs
**Mitigation:** Add backwards compatibility redirect (Step 6)
**Impact:** Low - old URLs will still work

### Risk 2: Social Media Cache
**Mitigation:** Old cached previews will naturally expire within 24-48 hours
**Impact:** Low - new shares use new URLs immediately

### Risk 3: Testing Coverage
**Mitigation:** Manual testing checklist above
**Impact:** Low - small change, easy to verify

---

## Success Criteria

✅ Projects use path-based routing like speakers
✅ Old query-based URLs redirect to new format
✅ Social sharing generates new URL format
✅ Middleware handles new URL pattern
✅ No broken functionality
✅ Consistent routing pattern across app

---

## Time Estimate

- **Code changes:** 1 hour
- **Testing:** 30 minutes
- **Deployment & verification:** 15 minutes
- **Total:** ~2 hours

---

## Next Session Prompt

```
I need to refactor the projects routing to use path parameters instead of
query parameters, matching the speakers pattern.

Please:
1. Read docs/architecture/ADR-002-standardize-routing-patterns.md
2. Read docs/handoffs/2025-12-18-refactor-projects-routing.md
3. Implement the changes following the step-by-step guide
4. Test all functionality works
5. Deploy and verify social sharing still works

This is a small refactor to eliminate technical debt and standardize our
routing patterns across the application.
```

---

## Related Documents

- **ADR:** [docs/architecture/ADR-002-standardize-routing-patterns.md](../architecture/ADR-002-standardize-routing-patterns.md) (to be created)
- **Reference:** [apps/georgetown/src/components/SpeakerDetailRoute.tsx](../../apps/georgetown/src/components/SpeakerDetailRoute.tsx)
- **Current implementation:** [apps/georgetown/src/components/ServiceProjectsPage.tsx](../../apps/georgetown/src/components/ServiceProjectsPage.tsx)

---

**Ready for next session!**
Last updated: 2025-12-18
