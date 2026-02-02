# Development Journals & Troubleshooting Logs

This directory contains systematic troubleshooting logs for monorepo-wide issues.

## Directory Purpose

**Troubleshooting logs** created when debugging complex technical issues that:
- Span multiple failed attempts (3+)
- Involve circular debugging
- Affect the monorepo structure itself
- Involve shared dependencies or workspace configuration

## Naming Convention

`YYYY-MM-DD-[problem-slug]-troubleshooting.md`

Examples:
- `2025-12-17-pnpm-workspace-dependency-conflict-troubleshooting.md`
- `2025-12-18-cloudflare-deployment-build-failure-troubleshooting.md`
- `2025-12-20-typescript-version-mismatch-troubleshooting.md`

## App-Specific Troubleshooting

For issues specific to an individual app:
- **Georgetown**: Use `apps/georgetown/docs/dev-journals/`
- **Pitchmasters**: Use `apps/pitchmasters/docs/dev-journals/`

## How to Use

### When Troubleshooting is Needed

1. **Trigger conditions**:
   - 3 failed attempts to fix same issue
   - Circular debugging (repeating approaches)
   - Multiple possible causes (3+ hypotheses)
   - Manual activation: "Use troubleshooting protocol"

2. **Create log**:
   ```bash
   # Copy template
   cp docs/templates/troubleshooting-log-template.md \
      docs/dev-journals/$(date +%Y-%m-%d)-[problem-slug]-troubleshooting.md
   ```

3. **Follow protocol**:
   - See [docs/protocols/systematic-troubleshooting.md](../protocols/systematic-troubleshooting.md)
   - Document every attempt and hypothesis
   - Update log after each investigation
   - Mark as RESOLVED when fixed

### Log Lifecycle

**Status progression**:
1. **IN PROGRESS** - Active debugging
2. **RESOLVED** - Problem solved, lessons documented
3. **BLOCKED** - Waiting on external resource/decision
4. **ABANDONED** - Approach abandoned, new log created

**Maintenance**:
- Keep logs forever (institutional knowledge)
- Link to related backlog items
- Reference from app-specific docs if pattern should be documented

## Quick Reference

**Template**: [docs/templates/troubleshooting-log-template.md](../templates/troubleshooting-log-template.md)

**Protocol**: [docs/protocols/systematic-troubleshooting.md](../protocols/systematic-troubleshooting.md)

**Activation phrases**:
- "Use troubleshooting protocol"
- "Activate systematic troubleshooting"
- "Start troubleshooting protocol"

---

**Last Updated**: 2025-12-17
