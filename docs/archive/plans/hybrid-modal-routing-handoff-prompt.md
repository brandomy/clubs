# Handoff Prompt: Implement Hybrid Modal + URL Routing for Georgetown

**Use this prompt to start a fresh Claude Code session for implementation.**

---

## Prompt for New Session

```
I need you to implement hybrid modal + URL routing for the Georgetown Rotary club management app.

CONTEXT:
- Georgetown is a React 19 app using React Router 7, TypeScript, Vite, and Supabase
- Currently uses component-based modal state (useState) for card details/editing
- Need to migrate to URL-based routing while keeping modal visual UX identical
- This enables shareable URLs, browser history, bookmarking, and deep linking

DOCUMENTATION:
Read these files BEFORE starting:
1. /Users/randaleastman/dev/clubs/docs/knowledge-transfer/hybrid-modal-url-routing-tdd.md
2. /Users/randaleastman/dev/clubs/docs/plans/hybrid-modal-routing-implementation-plan.md
3. /Users/randaleastman/dev/clubs/apps/georgetown/CLAUDE.md (Georgetown-specific context)

IMPLEMENTATION APPROACH:
Follow the implementation plan exactly:
- Start with Phase 0 (Setup & Preparation)
- Then implement Phase 1 (Speakers - Detail View) as PILOT
- Test thoroughly before proceeding to Phase 2 (Speakers - Edit View)
- Only continue to other entities after Speakers is proven to work

CRITICAL REQUIREMENTS:
✅ Visual UX must remain IDENTICAL (modals look/behave the same)
✅ Incremental implementation (one entity at a time)
✅ Test each phase thoroughly before proceeding
✅ URL structure must match the spec in the TDD
✅ Browser back button must close modals
✅ Direct URLs must open modals automatically

STARTING POINT:
Begin with Phase 0 of the implementation plan:
1. Create src/routes directory
2. Review current modal implementations
3. Create shared utilities (RouteUtils.ts)
4. Document current URL structure

Then move to Phase 1 (Speakers Detail View):
1. Create SpeakerDetailRoute.tsx
2. Update SpeakerDetailModal.tsx (add onEdit prop)
3. Create SpeakersPage.tsx wrapper
4. Update App.tsx router config
5. Update SpeakerCard.tsx (use navigate instead of state)
6. Test thoroughly

TESTING CHECKLIST (after each phase):
- [ ] Direct URLs work (e.g., /speakers/[uuid])
- [ ] Card clicks update URL and open modal
- [ ] Close button navigates back to board
- [ ] Browser back button closes modal
- [ ] Invalid IDs redirect to board gracefully
- [ ] Visual UX unchanged (modal looks identical)
- [ ] No console errors or warnings

QUESTIONS TO ASK ME:
- After Phase 0: "Setup complete. Ready to implement Speakers detail view (Phase 1)?"
- After Phase 1: "Speakers detail view complete. Should I proceed to edit view (Phase 2)?"
- After Phase 2: "Speakers complete and tested. Should I proceed to Service Projects (Phase 3)?"
- Continue pattern for remaining phases

IMPORTANT:
- Do NOT implement everything at once
- Do NOT skip testing between phases
- Do NOT change modal visual styling
- DO ask before proceeding to next phase
- DO commit after each successful phase

Ready to begin? Start with Phase 0 (Setup & Preparation).
```

---

## Alternative: Jump Straight to Implementation

If you want to skip the questions and just implement everything:

```
Implement hybrid modal + URL routing for Georgetown following the plan in:
- /Users/randaleastman/dev/clubs/docs/plans/hybrid-modal-routing-implementation-plan.md

Read the TDD first for context:
- /Users/randaleastman/dev/clubs/docs/knowledge-transfer/hybrid-modal-url-routing-tdd.md

Implement all phases (0-7) incrementally:
1. Setup & preparation
2. Speakers (detail + edit)
3. Service Projects
4. Members
5. Partners
6. Calendar (events + holidays)
7. Testing & polish

Test each entity thoroughly before moving to the next. Keep visual UX identical to current modal implementation.

Start now with Phase 0.
```

---

## Alternative: Speakers Pilot Only

If you want to start with just speakers as proof-of-concept:

```
Implement hybrid modal + URL routing for SPEAKERS ONLY as a pilot.

Read these files first:
- /Users/randaleastman/dev/clubs/docs/knowledge-transfer/hybrid-modal-url-routing-tdd.md
- /Users/randaleastman/dev/clubs/docs/plans/hybrid-modal-routing-implementation-plan.md

Implement Phases 0-2:
- Phase 0: Setup & Preparation
- Phase 1: Speakers - Detail View
- Phase 2: Speakers - Edit View

Test thoroughly:
- Direct URLs (/speakers/[uuid])
- Card clicks
- Browser back button
- Edit flow
- Share URLs

CRITICAL: Visual UX must remain identical. This is a proof-of-concept to validate the approach before implementing for other entities.

Start with Phase 0 setup.
```

---

## Handoff Context Summary

### What This Achieves

**Before (Current):**
```typescript
// Component state
const [isModalOpen, setIsModalOpen] = useState(false)

// URL stays at /speakers
<SpeakerCard onClick={() => setIsModalOpen(true)} />
```

**After (Hybrid):**
```typescript
// URL-based routing
const navigate = useNavigate()

// URL updates to /speakers/[id]
<SpeakerCard onClick={() => navigate(`/speakers/${speaker.id}`)} />
```

**User benefits:**
- Share links to specific speakers/projects
- Browser back button works
- Bookmark specific items
- Deep linking from external apps

**Visual experience:** Identical (modals look/behave the same)

---

### Current Architecture (Georgetown)

**Router:** React Router 7 (already installed)

**Current routes (flat):**
```typescript
<Routes>
  <Route path="/speakers" element={<KanbanBoard />} />
  <Route path="/projects" element={<ServiceProjectsPage />} />
  <Route path="/members" element={<MemberDirectory />} />
  <Route path="/partners" element={<PartnersPage />} />
  <Route path="/calendar" element={<CalendarView />} />
</Routes>
```

**Target routes (nested):**
```typescript
<Routes>
  <Route path="/speakers" element={<SpeakersPage />}>
    <Route path=":speakerId" element={<SpeakerDetailRoute />} />
    <Route path=":speakerId/edit" element={<SpeakerEditRoute />} />
  </Route>
  {/* Repeat for other entities */}
</Routes>
```

---

### Files to Reference

**Read BEFORE starting:**
1. `docs/knowledge-transfer/hybrid-modal-url-routing-tdd.md` - Full technical design
2. `docs/plans/hybrid-modal-routing-implementation-plan.md` - Step-by-step plan
3. `apps/georgetown/CLAUDE.md` - Georgetown-specific context

**Existing files to understand:**
- `apps/georgetown/src/App.tsx` - Current router config
- `apps/georgetown/src/components/SpeakerCard.tsx` - Current card implementation
- `apps/georgetown/src/components/SpeakerDetailModal.tsx` - Current modal
- `apps/georgetown/src/components/SpeakerModal.tsx` - Current edit modal
- `apps/georgetown/src/components/KanbanBoard.tsx` - Current board

**Files to create:**
- `apps/georgetown/src/routes/RouteUtils.ts` - Shared utilities
- `apps/georgetown/src/routes/SpeakerDetailRoute.tsx` - Detail route
- `apps/georgetown/src/routes/SpeakerEditRoute.tsx` - Edit route
- `apps/georgetown/src/components/SpeakersPage.tsx` - Page wrapper
- (Repeat pattern for other entities)

---

### Key Implementation Patterns

#### Pattern 1: Route Component (loads data, renders modal)

```typescript
// src/routes/SpeakerDetailRoute.tsx
export default function SpeakerDetailRoute() {
  const { speakerId } = useParams()
  const navigate = useNavigate()
  const [speaker, setSpeaker] = useState<Speaker | null>(null)

  useEffect(() => {
    loadSpeaker(speakerId).then(setSpeaker)
  }, [speakerId])

  const handleClose = () => navigate('/speakers')

  if (!speaker) return <LoadingModal />

  return <SpeakerDetailModal speaker={speaker} onClose={handleClose} />
}
```

#### Pattern 2: Page Wrapper (renders board + outlet)

```typescript
// src/components/SpeakersPage.tsx
export default function SpeakersPage() {
  return (
    <>
      <KanbanBoard />  {/* Always visible */}
      <Outlet />       {/* Modal renders here when URL matches */}
    </>
  )
}
```

#### Pattern 3: Card Component (navigate instead of state)

```typescript
// src/components/SpeakerCard.tsx
const navigate = useNavigate()

const handleCardClick = () => {
  navigate(`/speakers/${speaker.id}`)  // URL updates
}

return <div onClick={handleCardClick}>{/* Card UI */}</div>
// Remove: Modal rendering (now handled by router)
```

---

### Testing Requirements

**After each phase, verify:**

1. **Direct URL access**
   ```
   Open: http://localhost:5180/speakers/[actual-uuid]
   Expected: Board loads, modal opens for that speaker
   ```

2. **Card click**
   ```
   Click speaker card
   Expected: URL updates to /speakers/[uuid], modal opens
   ```

3. **Close modal**
   ```
   Click X button
   Expected: URL returns to /speakers, modal closes
   ```

4. **Browser back**
   ```
   Open modal, press browser back button
   Expected: URL returns to /speakers, modal closes
   ```

5. **Visual UX unchanged**
   ```
   Compare modal appearance/behavior
   Expected: Identical to before (same animations, styling, positioning)
   ```

6. **No console errors**
   ```
   Check browser console
   Expected: No errors or warnings
   ```

---

### Success Criteria

**Functional:**
- ✅ Direct URLs open correct modal
- ✅ Browser back closes modal
- ✅ Share button copies correct URL
- ✅ Bookmarks work
- ✅ Edit flow works (detail → edit → save → detail)

**Non-functional:**
- ✅ Visual UX identical
- ✅ Modal opens in <100ms
- ✅ No breaking changes
- ✅ No console errors

**Code quality:**
- ✅ TypeScript types correct
- ✅ Follows existing patterns
- ✅ Consistent naming

---

### Common Pitfalls to Avoid

**❌ DON'T:**
- Implement all entities at once (hard to debug)
- Change modal visual styling (requirement is identical UX)
- Skip testing between phases (risks cascading issues)
- Use replace mode for navigation (breaks back button in most cases)
- Forget to validate UUID format (security issue)

**✅ DO:**
- Implement one entity at a time
- Test thoroughly after each phase
- Ask before proceeding to next phase
- Keep modal components mostly unchanged
- Use navigate() for all modal opens/closes
- Handle loading states
- Handle error cases (404, network errors)

---

### Rollback Strategy

If something goes wrong:

```bash
# Rollback specific entity (e.g., speakers)
git checkout HEAD~1 src/components/SpeakerCard.tsx
git checkout HEAD~1 src/App.tsx

# Or full rollback
git revert <commit-hash>
```

**Risk mitigation:**
- Small commits (one phase at a time)
- Easy to identify what broke
- Can rollback individual entities

---

### Timeline Estimate

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 0: Setup | 1 hour | 1 hour |
| Phase 1: Speakers Detail | 3-4 hours | 4-5 hours |
| Phase 2: Speakers Edit | 2-3 hours | 6-8 hours |
| Phase 3: Projects | 3-4 hours | 9-12 hours |
| Phase 4: Members | 2-3 hours | 11-15 hours |
| Phase 5: Partners | 2-3 hours | 13-18 hours |
| Phase 6: Calendar | 3-4 hours | 16-22 hours |
| Phase 7: Testing | 3-4 hours | 19-26 hours |

**Recommendation:** Start with Phases 0-2 (Speakers) as pilot before committing to full implementation.

---

### Questions to Ask During Implementation

**After Phase 0:**
> "Setup complete. I've created the routes directory and shared utilities. Ready to implement Speakers detail view (Phase 1)?"

**After Phase 1:**
> "Speakers detail view complete. I've tested direct URLs, card clicks, close button, and browser back. All working. Should I proceed to edit view (Phase 2) or do you want to test first?"

**After Phase 2:**
> "Speakers fully implemented (detail + edit). Tested full flow: Board → Detail → Edit → Save → Detail → Close. All working, visual UX unchanged. Should I proceed to Service Projects (Phase 3)?"

**After each subsequent phase:**
> "[Entity] complete. Tested thoroughly. Proceed to [next entity]?"

**If issues found:**
> "Found issue: [description]. Suggested fix: [approach]. Should I proceed or would you like to review?"

---

### Related Projects (Future)

**After Georgetown proven:**
- HuaQiao (similar club management app)
- BrandMine (business application)

**Use Georgetown as template:**
- Same patterns apply
- Reuse route components structure
- Reuse shared utilities
- Adjust for specific entity types

---

## Quick Start Checklist

Before starting implementation, ensure:

- [ ] Georgetown app runs locally (`pnpm dev:georgetown`)
- [ ] You can access http://localhost:5180
- [ ] Read TDD document (understanding why)
- [ ] Read implementation plan (understanding how)
- [ ] Read Georgetown CLAUDE.md (understanding context)
- [ ] Ready to implement incrementally (one phase at a time)
- [ ] Ready to test thoroughly between phases

---

## Example Session Flow

**You:**
```
[Paste main handoff prompt from top of document]
```

**Claude:**
```
I'll implement hybrid modal + URL routing for Georgetown. Let me start by reading the documentation...

[Reads TDD and implementation plan]

I understand the goal: Enable shareable URLs while keeping modal UX identical. I'll implement incrementally starting with Phase 0.

Phase 0: Setup & Preparation

1. Creating routes directory...
[Creates directory]

2. Creating shared utilities...
[Creates RouteUtils.ts with UUID validation]

3. Reviewing current modal implementations...
[Reads SpeakerCard.tsx, SpeakerDetailModal.tsx, etc.]

4. Documenting current URL structure...
[Documents current routes]

Setup complete. Ready to implement Speakers detail view (Phase 1)?
```

**You:**
```
Yes, proceed with Phase 1.
```

**Claude:**
```
Phase 1: Speakers - Detail View

1. Creating SpeakerDetailRoute.tsx...
[Creates route component]

2. Updating SpeakerDetailModal.tsx...
[Adds onEdit prop]

3. Creating SpeakersPage.tsx wrapper...
[Creates page wrapper with Outlet]

4. Updating App.tsx router config...
[Adds nested routes]

5. Updating SpeakerCard.tsx...
[Replaces useState with navigate]

6. Testing...
[Runs through test checklist]

Results:
✅ Direct URLs work
✅ Card clicks update URL
✅ Close button works
✅ Browser back works
✅ Visual UX unchanged
✅ No console errors

Phase 1 complete. Should I proceed to Phase 2 (Speakers Edit View)?
```

**You:**
```
Yes, proceed.
```

**Claude:**
```
[Continues with Phase 2...]
```

---

## Post-Implementation Validation

After full implementation, validate:

**Test all entities:**
```bash
# Speakers
http://localhost:5180/speakers/[uuid]
http://localhost:5180/speakers/[uuid]/edit

# Projects
http://localhost:5180/projects/[uuid]
http://localhost:5180/projects/[uuid]/edit

# Members
http://localhost:5180/members/[uuid]
http://localhost:5180/members/[uuid]/edit

# Partners
http://localhost:5180/partners/[uuid]
http://localhost:5180/partners/[uuid]/edit

# Calendar
http://localhost:5180/calendar/events/[uuid]
http://localhost:5180/calendar/holidays/[uuid]
```

**Cross-browser test:**
- Chrome ✅
- Safari ✅
- Firefox ✅
- Mobile Safari ✅
- Mobile Chrome ✅

**Performance check:**
- Modal open time < 100ms ✅
- Direct URL load < 500ms ✅
- No memory leaks ✅

**Accessibility check:**
- Keyboard navigation ✅
- Screen reader ✅
- Focus management ✅

---

## Final Deliverables

After implementation, you should have:

1. **Working hybrid routing** for all 6 entity types
2. **No visual UX changes** (modals look identical)
3. **Shareable URLs** for all items
4. **Browser history** working correctly
5. **Tests passing** (manual or automated)
6. **No console errors** or warnings
7. **Documentation** updated (if needed)

---

## Support & Questions

If issues arise during implementation:

1. **Check TDD** - Likely covered in technical design
2. **Check implementation plan** - Likely in detailed steps
3. **Check Georgetown CLAUDE.md** - May be app-specific
4. **Ask specific question** - Include error message, what you tried

Example question format:
> "In Phase 1, Step 1.4 (updating SpeakerCard), I'm getting error: [error message]. I tried [approach]. The relevant code is [snippet]. What should I do?"

---

**Ready to start?** Copy the main prompt from the top of this document and paste into a new Claude Code session.

**Want to customize?** Use one of the alternative prompts for different starting points (full implementation, pilot only, etc.).

**Questions?** Review the TDD and implementation plan first - most questions are answered there.

---

**Document Status:** Ready for use
**Last Updated:** 2025-12-17
**Next Step:** Copy prompt and start fresh session
