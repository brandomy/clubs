# Monorepo Best Practices 2025: Supabase + React + Turborepo

*Research conducted December 2025*

---

## Executive Summary

The 2025 consensus for React + Supabase monorepos converges on **pnpm workspaces + Turborepo** as the gold standard. Key innovations include treating Supabase as a first-class workspace, automated type generation pipelines, and smart caching strategies that can reduce CI costs by 90%.

---

## Recommended Project Structure

```
monorepo/
├── apps/
│   ├── web/              # Main web app (Next.js/Vite)
│   ├── mobile/           # React Native (if applicable)
│   └── docs/             # Storybook/documentation
├── packages/
│   ├── ui/               # Shared React components
│   ├── types/            # Generated Supabase types + shared types
│   ├── config/           # ESLint, TypeScript, Tailwind configs
│   └── supabase-client/  # Abstracted Supabase client (optional)
├── supabase/             # ⭐ Supabase as its own workspace
│   ├── migrations/
│   ├── seed.sql
│   └── package.json
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Best Practice #1: Supabase as a Workspace

**Why:** Makes Supabase a first-class citizen in the build pipeline, enabling dependency tracking and caching.

### Implementation

**supabase/package.json:**
```json
{
  "name": "@org/supabase",
  "private": true,
  "scripts": {
    "start": "supabase status || supabase start",
    "stop": "supabase stop",
    "reset": "supabase db reset || supabase start",
    "test": "supabase db test",
    "lint": "supabase db lint",
    "deploy": "supabase link && supabase db push"
  }
}
```

**pnpm-workspace.yaml:**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'supabase'  # ← Supabase as workspace
```

**Key insight:** The `||` pattern (`supabase status || supabase start`) ensures idempotency—works whether Supabase is running or not.

---

## Best Practice #2: Shared Types Package

**Why:** End-to-end type safety from database to UI. All apps consume the same generated types.

### Implementation

**packages/types/package.json:**
```json
{
  "name": "@org/types",
  "scripts": {
    "generate": "(cd ../../ && supabase gen types typescript --local > ./packages/types/src/database.ts) && prettier --write src/"
  }
}
```

**Usage in apps:**
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@org/types'

const supabase = createClient<Database>(url, key)
// Full intellisense for tables, columns, constraints
```

---

## Best Practice #3: Turborepo Task Dependencies

**Why:** Smart dependency graphs ensure Supabase starts only when needed, saving 60-90 seconds of CI time.

### Implementation

**turbo.json:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalEnv": [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_KEY"
  ],
  "tasks": {
    "@org/supabase#start": {
      "cache": false,
      "outputs": []
    },
    "@org/types#generate": {
      "dependsOn": ["@org/supabase#start"],
      "outputs": ["src/database.ts"]
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["@org/supabase#start", "^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**Key insight:** Database schema changes are infrequent—90% of test/lint runs will use cached results.

---

## Best Practice #4: Shared Supabase Client Package

**Why:** Centralizes client configuration, SSR/CSR handling, and auth logic.

### Implementation (Optional)

**packages/supabase-client/src/client.ts:**
```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@org/types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Caveat:** Server-side clients need cookie handling, which may require app-specific configuration.

---

## Best Practice #5: Environment Variable Management

**Why:** Consistent env vars across all workspaces, with validation.

### Implementation

**turbo.json globalEnv:**
```json
{
  "globalEnv": [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_KEY",
    "DATABASE_URL"
  ]
}
```

**packages/config/env.ts (with Zod):**
```typescript
import { z } from 'zod'

export const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1).optional(),
})

export const env = envSchema.parse(process.env)
```

---

## Best Practice #6: Testing Strategy

**Why:** Real database tests catch issues mocks miss.

### Recommendations

1. **Use local Supabase for tests** - Spin up instance with seeded data
2. **Don't mock Supabase** - Maintaining mocks is painful and inaccurate
3. **Task dependencies** - Tests depend on `@org/supabase#start`

```json
{
  "test:e2e": {
    "dependsOn": ["@org/supabase#start"],
    "cache": false
  }
}
```

---

## Best Practice #7: CI/CD Optimization

**Why:** Turborepo caching can reduce CI costs by 90%.

### GitHub Actions Example

```yaml
- uses: pnpm/action-setup@v2
- uses: actions/cache@v3
  with:
    path: .turbo
    key: turbo-${{ github.sha }}
    restore-keys: turbo-

- run: pnpm install
- run: pnpm turbo run build test lint --cache-dir=.turbo
```

### Type Generation in CI

```yaml
- name: Generate Supabase types
  run: npx supabase gen types --lang=typescript --project-id $PROJECT_REF > packages/types/src/database.ts
```

---

## Best Practice #8: Preventing Package Manager Conflicts

**Why:** Mixed lock files cause dependency hell.

### Implementation

**package.json:**
```json
{
  "packageManager": "pnpm@10.24.0",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "preinstall": "npx only-allow pnpm"
  }
}
```

---

## Common Pitfalls to Avoid

| Pitfall | Solution |
|---------|----------|
| Installing Supabase separately per app | Use shared types package |
| Mocking Supabase in tests | Use local Supabase instance |
| Not caching Supabase start | It's intentionally uncached (stateful) |
| Forgetting `composite: true` in shared tsconfig | Required for project references |
| Publishing internal packages to npm | Use `workspace:*` protocol |

---

## Sources

- [Set up a monorepo with Supabase and Turborepo](https://philipp.steinroetter.com/posts/supabase-turborepo) - Philipp Steinrötter
- [2025 Monorepo That Actually Scales](https://medium.com/@TheblogStacker/2025-monorepo-that-actually-scales-turborepo-pnpm-for-next-js-ab4492fbde2a) - Medium
- [Supabase TypeScript Types Documentation](https://supabase.com/docs/guides/api/rest/generating-types)
- [turborepo-launchpad](https://github.com/JadRizk/turborepo-launchpad) - GitHub Template
- [supasample](https://github.com/psteinroe/supasample) - Sample Monorepo
- [Complete Monorepo Guide: pnpm + Workspace + Changesets](https://jsdev.space/complete-monorepo-guide/)
- [MakerKit Turbo Starter Documentation](https://makerkit.dev/docs/next-supabase-turbo/technical-details)
