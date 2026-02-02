# Monorepo Architecture Decision Brief

**Context:** This document outlines the decision criteria and trade-offs for adopting a monorepo structure, intended to help evaluate whether this approach is suitable for your project.

---

## When to Use a Monorepo

### Strong Indicators (Monorepo Recommended)

| Indicator | Why It Matters |
|-----------|----------------|
| **Multiple related apps** | Sites/apps that share branding, components, or business logic benefit from code reuse |
| **Shared design system** | Logo, colors, typography, and UI components need consistency across products |
| **Common business types** | TypeScript interfaces for users, projects, or domain entities used in multiple places |
| **Coordinated releases** | When app A and package B need to update together atomically |
| **Small-to-medium team** | Under ~15 developers can effectively share a single repository |
| **Unified tooling** | Same linter, formatter, testing framework across all packages |

### Weak Indicators (Consider Alternatives)

| Indicator | Alternative Approach |
|-----------|---------------------|
| **Single application** | Standard single-repo with modular folder structure |
| **Completely independent apps** | Separate repos with shared npm packages published to registry |
| **Large distributed team** | Micro-repos with clear ownership boundaries |
| **Different tech stacks** | Language-specific repos (avoid mixing Python/Go/Node in one monorepo) |
| **Strict security boundaries** | Separate repos with different access controls |

---

## Architecture Comparison

### Option A: Monorepo (Recommended for HuaQiao)

```
huaqiao/
├── apps/
│   ├── bridge/         # bridge.huaqiao.asia
│   └── main/           # huaqiao.asia
├── packages/
│   ├── shared/         # Logo, Footer, types, utilities
│   └── config/         # Shared ESLint, TypeScript configs
├── turbo.json          # Build orchestration
└── pnpm-workspace.yaml # Workspace definition
```

**Pros:**
- Single source of truth for brand assets
- Atomic commits across packages
- Shared dependency management (one `node_modules`)
- Easy refactoring across package boundaries
- Built-in consistency through shared configs
- Great for learning modern patterns

**Cons:**
- Initial setup complexity
- Requires understanding of workspaces
- Build times can grow (mitigated by Turborepo caching)
- Git history includes all packages

### Option B: Multi-Repo

```
huaqiao-bridge/         # bridge.huaqiao.asia
huaqiao-main/           # huaqiao.asia
huaqiao-shared/         # Published to npm registry
```

**Pros:**
- Simple to understand
- Clear ownership boundaries
- Independent release cycles
- Isolated CI/CD pipelines

**Cons:**
- Version synchronization challenges
- Duplicate tooling configuration
- Cross-repo changes require multiple PRs
- "Diamond dependency" problems with shared packages

---

## Tool Stack for Monorepos

| Tool | Purpose | Alternative |
|------|---------|-------------|
| **pnpm** | Fast, disk-efficient package manager with workspace support | npm workspaces, yarn workspaces |
| **Turborepo** | Build system with smart caching and parallel execution | Nx, Lerna |
| **TypeScript Project References** | Cross-package type checking | tsconfig paths only |

---

## Decision Checklist

Use this checklist to evaluate whether monorepo is right for your project:

- [ ] **Do you have 2+ related apps or packages?** → Monorepo helps
- [ ] **Will packages share types or components?** → Monorepo strongly recommended
- [ ] **Same tech stack across apps?** → Monorepo works well
- [ ] **Team size under 15?** → Monorepo scales well
- [ ] **Need coordinated releases?** → Monorepo simplifies this
- [ ] **Different security/access requirements per app?** → Consider separate repos
- [ ] **Apps are truly independent (no shared code)?** → Separate repos may be simpler

**Scoring:**
- 4+ "helps/recommended" → Monorepo is a good fit
- 2-3 "helps" → Either approach works; choose based on team preference
- 1 or fewer → Stick with separate repos

---

## HuaQiao Foundation Decision

**Decision:** Monorepo with pnpm + Turborepo

**Rationale:**
1. **Two related sites** (bridge.huaqiao.asia + huaqiao.asia) sharing brand identity
2. **Shared components** including Logo, Footer, navigation patterns
3. **Common types** for Projects, Clubs, Partners across both sites
4. **Small team** where coordination is manageable
5. **Same tech stack** (React + TypeScript + Tailwind) for both apps
6. **Learning opportunity** for modern development patterns

---

## Getting Started Commands

```bash
# Install all dependencies
pnpm install

# Run specific app
pnpm dev:bridge          # Run Bridge app
pnpm dev:main            # Run Main site

# Build all apps
pnpm build

# Add dependency to specific package
pnpm add lodash --filter @huaqiao/bridge

# Add shared dependency
pnpm add zod --filter @huaqiao/shared
```

---

## Further Reading

- [Turborepo Handbook](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Monorepo Explained (Nrwl)](https://monorepo.tools/)
