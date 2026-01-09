# Project Backlog

**Last Updated**: 2025-12-18

See [Backlog Management System](docs/backlog-management-system.md) for process and best practices.

## Active Backlog

| ID | Priority | Status | Feature | Project | Type | Estimate | Added | Notes |
|----|----------|--------|---------|---------|------|----------|-------|-------|
| MONO-001 | P2 | Done | Setup backlog management system | Monorepo | Docs | XS | 2025-12-17 | ✅ Complete - Moved archive to docs/archive/ |
| MONO-002 | P1 | Done | Migrate from npm to pnpm workspaces | Monorepo | Tech Debt | M | 2025-12-17 | ✅ Complete - Commit e0764d8 |
| GEO-001 | P2 | Backlog | Add web sharing capability | Georgetown | Feature | M | 2025-12-17 | Enable sharing of events, speakers, and content via Web Share API |
| GEO-002 | P2 | Backlog | Add Umami analytics integration | Georgetown | Feature | S | 2025-12-17 | Integrate Umami analytics for usage tracking |
| GEO-003 | P2 | Backlog | Add screenshots to PWA manifest | Georgetown | Feature | S | 2025-12-17 | Add app screenshots to manifest for better app store presentation |
| GEO-004 | P2 | Backlog | Add language switcher | Georgetown | Feature | M | 2025-12-17 | Enable users to switch between English and Chinese language options |
| GEO-005 | P1 | Backlog | Verify Facebook OG preview works | Georgetown | Bug | XS | 2025-12-18 | Check https://developers.facebook.com/tools/debug/ for rotary-club.app after 24-48hr cache expiration. See docs/troubleshooting-logs/troubleshooting-log-2025-12-18-facebook-og-preview.md |
| HUA-001 | P2 | Backlog | Add Umami analytics integration | HuaQiao | Feature | S | 2025-12-17 | Integrate Umami analytics for usage tracking |
| HUA-002 | P2 | Backlog | Add screenshots to PWA manifest | HuaQiao | Feature | S | 2025-12-17 | Add app screenshots to manifest for better app store presentation |
| PIT-001 | P2 | Backlog | Add Umami analytics integration | Pitchmasters | Feature | S | 2025-12-17 | Integrate Umami analytics for usage tracking |
| PIT-002 | P2 | Backlog | Add screenshots to PWA manifest | Pitchmasters | Feature | S | 2025-12-17 | Add app screenshots to manifest for better app store presentation |

## Legend

### Priority
- **P0** - Critical (blocking, security, data loss)
- **P1** - High (core features, significant bugs)
- **P2** - Medium (nice-to-have, minor bugs)
- **P3** - Low (future ideas, polish)

### Status
- **Backlog** - Not started
- **In Progress** - Currently being worked on
- **Blocked** - Waiting on dependency/decision
- **Done** - Completed
- **Cancelled** - No longer needed

### Project
- **Georgetown** - Georgetown Rotary app
- **Pitchmasters** - Pitchmasters app
- **Monorepo** - Infrastructure/build/shared config
- **Shared** - Shared components/libraries

### Type
- **Feature** - New functionality
- **Bug** - Something broken
- **Enhancement** - Improvement to existing feature
- **Refactor** - Code quality/structure improvement
- **Docs** - Documentation
- **Tech Debt** - Technical debt cleanup

### Estimate
- **XS** - Less than 2 hours
- **S** - 2-4 hours
- **M** - 4-8 hours (half to full day)
- **L** - 1-2 days
- **XL** - 2-5 days
- **XXL** - More than 5 days (consider breaking down)

## Quick Stats

- **Total Items**: 11
- **P0/P1 Items**: 1
- **In Progress**: 0
- **Blocked**: 0
- **Done (pending archive)**: 2

---

💡 **Tip**: Keep backlog focused and lean (max 30-50 items). Archive completed items quarterly to [docs/archive/backlog-2025.md](docs/archive/backlog-2025.md).
