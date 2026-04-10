# Georgetown Rotary Speaker Management - MVP

## Monorepo Context

**Location**: `apps/georgetown/` within the `clubs` monorepo
**Sibling Apps**: Pitchmasters Toastmasters management (`apps/pitchmasters/`)
**Root Documentation**: See `/CLAUDE.md` for monorepo structure and shared conventions

**Running from monorepo root**:
```bash
npm run dev:georgetown      # Development server (port 5180)
npm run build:georgetown    # Production build
```

**Running from this directory**:
```bash
npm run dev                 # Development server (port 5180)
npm run build               # Production build
```

## Business Context
**Organization**: Georgetown Rotary Club (~50 members)  
**Problem**: Speaker coordination chaos (email chains, double-booking, manual processes)  
**Business Objective**: Program committee efficiency through professional digital tools

## CTO Role & Authority
**Complete Technical Responsibility**: You own all technical decisions, implementation, and delivery
**Business Focus**: Eliminate speaker coordination chaos → enable program committee weekly adoption
**Decision Authority**: Choose optimal technical approaches for Rotary club constraints
**Process**: Confirm business needs → Build complete solutions → Test locally → Iterate based on results
**Communication**: Ask business clarification questions, deliver working solutions with documentation

### **Database Access Constraint (CRITICAL)**
<!-- TEMPORARILY DISABLED - CTO has direct psql access for rapid development -->
<!-- - **CTO CANNOT access Supabase dashboard or SQL Editor** -->
<!-- - **Only CEO can execute SQL in Supabase** -->
<!-- - **Workflow**: CTO writes SQL migration → Provides to CEO → CEO executes → CTO verifies in app -->
<!-- - See [docs/workflows/database-migration-workflow.md](docs/workflows/database-migration-workflow.md) for complete process -->

### **Supabase Database Connection**
**Region**: Southeast Asia (Singapore) - `aws-1-ap-southeast-1`
**Project**: `rmorlqozjwbftzowqmps.supabase.co`

**Connection Details** (stored in `.env.local`):
- **DATABASE_URL** - Pooled connection (port 6543) for application queries
- **DIRECT_URL** - Direct connection (port 5432) for migrations and psql

**Important Notes**:
- **Always use Southeast Asia region** - Do NOT attempt to connect to US servers
- **Password encoding required** - Special characters must be URL-encoded (& becomes %26)
- **For migrations** - Use `DIRECT_URL` with psql for full PostgreSQL features
- **For app queries** - Use `DATABASE_URL` with connection pooling via PgBouncer

**Connection command example**:
```bash
psql "$DIRECT_URL" -c "SELECT version();"
```

### **Development Journal Command**
When implementation is complete, CEO requests: **"Create dev journal entry"**

CTO generates structured documentation using standard Georgetown Rotary format for project tracking and technical accountability.

### CEO Approval Protocol for Major Changes
**Strategic Decisions Require CEO Approval:**
- Framework changes (CSS, database, major libraries)
- Technology migrations (stable version changes)
- Architecture modifications (hosting, deployment, security)

**Required Format for Approval Requests:**
```
**Situation**: [Current technical issue]
**Options**: [2-3 specific alternatives with pros/cons]
**Recommendation**: [Preferred option with business justification]
**Request**: [Specific approval needed from CEO]
**Timeline**: [Implementation schedule if approved]
```

### Session Startup Checklist for CTO
1. Read CLAUDE.md (business context + quality gates + **documentation organization**)
2. Read docs/governance/expert-standards.md (full-stack verification requirements)
3. Read docs/database/README.md (complete implementation standards)
4. Read docs/governance/tech-constraints.md (stability rules)
5. Confirm understanding before proceeding

### **Documentation Organization Protocol**

**MANDATORY: All documentation MUST follow these rules**

**Root Level (`docs/`)** - README and organizational directories only:
- ❌ NEVER create new root-level docs without CEO approval
- ✅ Use subdirectories: governance/, standards/, workflows/, dev-journals/, plans/, adr/, database/, archive/

**Governance (`docs/governance/`)** - Strategic documents:
- BACKLOG.md (with summary table), expert-standards.md, management-protocols.md
- rotary-brand-guide.md, system-architecture.md, tech-constraints.md

**Standards (`docs/standards/`)** - Design and code standards:
- card-view-best-practices.md, icon-usage-standard.md
- kanban-design-standards.md, responsive-design-standard.md

**Dev Journals (`docs/dev-journals/`)** - Implementation logs:
- ✅ ALL completed feature implementations go here
- ✅ Bug fixes with lessons learned
- ✅ Architecture changes or pattern updates
- ✅ Use naming: `YYYY-MM-DD-topic-description.md`
- ❌ NEVER create "feature" or "implementation" directories

**Plans (`docs/plans/`)** - Multi-session implementation plans:
- ✅ Comprehensive plans spanning 3+ sessions
- ✅ Complex features requiring phased rollout
- ✅ Use naming: `YYYY-MM-topic-description.md`
- ✅ README.md tracks all plans with status table
- ✅ Link to dev journals as phases complete

**Prompts (`docs/prompts/`)** - Handoff prompts and instructions:
- ✅ Detailed handoff instructions for other developers
- ✅ Troubleshooting guides with investigation steps
- ✅ Use naming: `topic-handoff.md` or `topic-instructions.md`
- ✅ README.md tracks all prompts with status table
- ✅ Created when work needs to be handed off or resumed later

**ADR (`docs/adr/`)** - Architecture Decision Records:
- ✅ Document WHY behind major technical decisions
- ✅ Framework choices, architecture patterns, technology selections
- ✅ Use naming: `NNN-decision-title.md` (001, 002, 003...)
- ✅ README.md tracks all ADRs in table
- ✅ Include alternatives considered and consequences

**Workflows (`docs/workflows/`)** - Repeatable processes:
- ✅ Step-by-step operational guides (migrations, deployments)
- ✅ Team coordination procedures
- ✅ Use naming: `topic-workflow.md`

**Database (`docs/database/`)** - Schema changes:
- ✅ Numbered migrations: `NNN-description.sql` (001, 002, 003...)
- ✅ Follow conventions in docs/database/README.md
- ❌ NO status reports or completed summaries (archive those)

**Archive (`docs/archive/`)** - Completed/superseded:
- ✅ One-time status reports after completion
- ✅ Superseded migration instructions
- ✅ Historical docs no longer actively used

**Decision Tree for New Documentation:**
1. Is it a major architectural decision? → `docs/adr/NNN-decision.md`
2. Is it a multi-session implementation plan? → `docs/plans/YYYY-MM-topic.md`
3. Is it a handoff or troubleshooting guide? → `docs/prompts/topic-handoff.md`
4. Is it about a completed implementation? → `docs/dev-journals/YYYY-MM-DD-topic.md`
5. Is it a repeatable process? → `docs/workflows/topic-workflow.md`
6. Is it a database migration? → `docs/database/NNN-description.sql`
7. Is it a one-time report? → `docs/archive/` (or `temp/` for CEO review)
8. Is it strategic governance? → Ask CEO before creating root-level doc

**See [docs/README.md](docs/README.md) for complete organization guide**

### **CTO Communication Freedom**
- **Ask CEO business clarification questions anytime** - No restrictions on understanding user needs
- **Propose technical approaches directly** - CEO approves approach before execution
- **Report results to COO for quality review** - Not for permission, but for professional standards
- **Make all technical decisions autonomously** - Database, frameworks, architecture, implementation details

## Tech Stack
Frontend: React 19.1.1 + TypeScript + Vite 7.1.6 | Database: Supabase (PostgreSQL) | Styling: Custom CSS + Tailwind CSS 3.4.17 | Additional: @dnd-kit, React Router DOM 7.9.2, date-fns 4.1.0, Lucide React 0.544.0

## Social Meta Tags (Open Graph)

### Overview

Georgetown Rotary implements comprehensive Open Graph and Twitter Card meta tags for professional social sharing previews across all platforms.

**Platforms Optimized**:
- LinkedIn (primary business network)
- WhatsApp (primary messaging for members)
- Facebook
- Twitter/X
- Telegram
- WeChat (Asia-Pacific partners)
- Slack, Discord, SMS previews

### Implementation Architecture

**Three-Layer Approach**:

1. **Static Base Tags** ([index.html](index.html)):
   - Default meta tags for homepage and generic shares
   - Fallback for platforms that don't execute JavaScript

2. **Dynamic Server-Side Injection** ([functions/_middleware.ts](functions/_middleware.ts)):
   - Cloudflare Functions middleware intercepts crawler requests
   - Fetches content-specific data from Supabase
   - Replaces static tags with personalized values
   - Returns modified HTML to crawler

3. **Client-Side Utilities** (`utils/metaTags.ts`):
   - Dynamic updates for JavaScript-enabled platforms
   - Used for SPA navigation (LinkedIn, Twitter with JS)

### Meta Tags Implemented

**Core Open Graph Tags**:
```html
<meta property="og:site_name" content="Georgetown Rotary">
<meta property="og:type" content="[website|profile|article]">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="[Dynamic Title]">
<meta property="og:description" content="[Dynamic Description]">
<meta property="og:url" content="[Canonical URL]">
```

**Image Tags** (Full Metadata):
```html
<meta property="og:image" content="[Image URL]">
<meta property="og:image:secure_url" content="[HTTPS URL]">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:alt" content="[Accessible Description]">
```

**Twitter Cards**:
```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="[Dynamic Title]">
<meta name="twitter:description" content="[Dynamic Description]">
<meta name="twitter:image" content="[Image URL]">
<meta name="twitter:image:alt" content="[Accessible Description]">
```

**Article Metadata** (Events only):
```html
<meta property="article:published_time" content="[ISO 8601 Date]">
```

### Content-Type Behavior

| Content Type | Route Pattern | og:type | Image Source | Title Pattern |
|--------------|---------------|---------|--------------|---------------|
| Speakers | `/speakers/:uuid` | `profile` | `portrait_url` | `{Name}` |
| Members | `/members/:uuid` | `profile` | `portrait_url` | `{Name}` |
| Events | `/events/:uuid` | `article` | Default fallback | `{Event Title}` |
| Projects | `/projects/:uuid` | `website` | `image_url` | `{Project Name}` |
| Partners | `/partners/:uuid` | `website` | `logo_url` | `{Partner Name} - Georgetown Rotary Partner` |
| Homepage | `/` | `website` | Default fallback | `Georgetown Rotary - Speaker Management` |

**og:type Semantic Meanings**:
- `profile`: Content about a person (has first/last name) → Speakers, Members
- `article`: Time-based content (has publish date) → Events
- `website`: General content → Projects, Partners, Homepage

### Image Specifications

| Purpose | Dimensions | Format | Location |
|---------|------------|--------|----------|
| Default OG Image | 1200×630 | JPG | `/assets/images/social/georgetown-rotary-og-default.jpg` |
| WeChat Fallback | 1024×1024 | JPG | `/assets/images/social/georgetown-rotary-wechat.jpg` |
| Speaker Portraits | Variable | JPG/PNG | Supabase Storage: `portrait_url` |
| Member Portraits | Variable | JPG/PNG | Supabase Storage: `portrait_url` |
| Project Images | Variable | JPG/PNG | Supabase Storage: `image_url` |
| Partner Logos | Variable | PNG | Supabase Storage: `logo_url` |

**Image Requirements**:
- All images must be publicly accessible (no authentication required)
- Absolute URLs only (full `https://` paths)
- Aspect ratio: 1.91:1 ideal (1200×630)
- File size: <200KB recommended for performance

### WeChat Optimization

**Challenge**: WeChat doesn't fully support Open Graph tags.

**Solution**: Hidden `<img>` element as first large image in body:

```html
<body>
  <img src="/assets/images/social/georgetown-rotary-wechat.jpg"
       alt=""
       style="position:absolute;left:-9999px;width:1px;height:1px;"
       aria-hidden="true">
  <!-- Rest of app... -->
</body>
```

**How It Works**:
- WeChat crawler scans HTML for first image >300px
- Finds our hidden 1024×1024 image
- Uses it for chat preview thumbnail
- Doesn't affect page layout (positioned off-screen)

**Limitations**:
- Cannot customize per content type (static fallback only)
- Full WeChat JSSDK integration would require Official Account + backend
- Current approach is "good enough" for occasional sharing

### Crawler Detection

Middleware detects platform crawlers via user-agent strings:

```typescript
const isCrawler =
  userAgent.includes('WhatsApp') ||
  userAgent.includes('Telegram') ||
  userAgent.includes('Slack') ||
  userAgent.includes('facebookexternalhit') ||
  userAgent.includes('Facebot') ||
  userAgent.includes('Twitterbot') ||
  userAgent.includes('LinkedInBot') ||
  userAgent.includes('WeChat') ||
  userAgent.includes('MicroMessenger')
```

**Non-crawler requests** pass through unmodified (React handles routing).

### Testing & Validation

**Pre-Deployment Checks**:
1. Build the app: `npm run build`
2. Inspect `dist/index.html` for correct static tags
3. Verify image URLs are absolute (full `https://` paths)
4. Check TypeScript compilation: `npm run build:functions`

**Post-Deployment Validation Tools**:

| Platform | Tool | URL |
|----------|------|-----|
| LinkedIn | Post Inspector | https://www.linkedin.com/post-inspector/ |
| Facebook | Sharing Debugger | https://developers.facebook.com/tools/debug/ |
| Twitter | Card Validator | https://cards-dev.twitter.com/validator |
| Generic | Open Graph Debugger | https://www.opengraph.xyz/ |

**Manual Testing Checklist**:
- [ ] Test speaker URL: `/speakers/[any-uuid]`
- [ ] Test member URL: `/members/[any-uuid]`
- [ ] Test event URL: `/events/[any-uuid]`
- [ ] Test project URL: `/projects/[any-uuid]`
- [ ] Test partner URL: `/partners/[any-uuid]`
- [ ] Test homepage: `/`
- [ ] WhatsApp share test (mobile)
- [ ] WeChat share test (if accessible)

**Expected Results**:
- Correct title, description, image for each content type
- No broken images
- Professional appearance across all platforms
- Image alt text present (accessibility)

### Troubleshooting

**Issue**: Social preview shows wrong image
- **Cause**: Platform cached old preview
- **Fix**: Use validation tool to force refresh (e.g., Facebook Debugger "Scrape Again")

**Issue**: No image appears in preview
- **Cause**: Image URL not publicly accessible or invalid
- **Fix**: Check Supabase storage permissions, verify URL returns 200 status

**Issue**: Special characters broken in title/description
- **Cause**: HTML escaping issue
- **Fix**: Verify `escapeHtml()` function called on all dynamic content

**Issue**: Dynamic tags not appearing for crawlers
- **Cause**: Middleware not running or user-agent not detected
- **Fix**: Check Cloudflare Functions logs, verify deployment

**Issue**: WeChat preview not working
- **Cause**: Hidden image not found or incorrect size
- **Fix**: Verify `/assets/images/social/georgetown-rotary-wechat.jpg` exists and is >300px

### Performance Notes

**No Impact on Page Load**:
- Meta tags are static HTML (no JavaScript execution)
- Middleware only runs for crawler requests (not normal users)
- Database queries cached by Supabase connection pooling

**Middleware Execution Time**:
- UUID validation: <1ms
- Supabase query: ~20-50ms
- HTML replacement: <5ms
- **Total**: <100ms (acceptable for crawlers)

### Future Enhancements (Not Implemented)

**Considered but deferred**:
- ❌ WeChat JSSDK integration (requires Official Account)
- ❌ Facebook App ID (`fb:app_id`) - not needed without Facebook integration
- ❌ Custom OG images per content (would require image generation service)
- ❌ Secondary WebP images (JPG support universal)
- ❌ Schema.org structured data (separate initiative)

### References

- [Open Graph Protocol Specification](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- Implementation Plan: [docs/plans/2025-12-18-open-graph-enhancement.md](docs/plans/2025-12-18-open-graph-enhancement.md)
- Handoff Document: [docs/handoffs/2025-12-18-open-graph-enhancement-handoff.md](docs/handoffs/2025-12-18-open-graph-enhancement-handoff.md)

## Brand & Image Design Standards

### Overview

Georgetown Rotary uses a **Refined Line Art with Color Fields** visual style for all generated images. This approach:
- Avoids official Rotary logos (cannot be modified per brand rules)
- Creates professional, recognizable brand identity
- Works across all social platforms and print materials
- Maintains consistency while allowing content-specific variation

**Core Design Documents**:
- **Brand Guide**: [docs/governance/rotary-brand-guide.md](docs/governance/rotary-brand-guide.md) (v2.0 - comprehensive)
- **Image Template**: [docs/templates/image-template.md](docs/templates/image-template.md) (AI image generation)

### Visual Style: Refined Line Art with Color Fields

**Key Characteristics**:
- **Line art**: Simple, continuous black or dark blue lines (not detailed/fussy)
- **Color fields**: Large organic shapes in solid Rotary colors (no gradients)
- **Accent shapes**: Small gold elements suggesting meaning (circles, arcs, dots)
- **Background**: Platinum (#E4DFDA) for warmth and accessibility
- **Mood**: Professional, editorial quality (not cartoony)

**Color Palette**:

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Line art | Black | `#000000` | Primary line drawings |
| Line art (alt) | Dark Blue | `#004A8A` | Alternative for variation |
| Primary field | Rotary Azure | `#0067C8` | Default large color block |
| Accent | Rotary Gold | `#F7A81B` | Small accent shapes |
| Background | Platinum | `#E4DFDA` | Warm, colorblind-safe base |

**Areas of Focus Colors** (for service projects):

| Area of Focus | Hex |
|---------------|-----|
| Peacebuilding & Conflict Prevention | `#0067C8` (Azure) |
| Disease Prevention & Treatment | `#E02927` (Red) |
| Water, Sanitation & Hygiene | `#00A2E0` (Light Blue) |
| Maternal & Child Health | `#901F93` (Purple) |
| Basic Education & Literacy | `#FF7600` (Orange) |
| Community Economic Development | `#00ADBB` (Turquoise) |
| Supporting the Environment | `#009739` (Green) |

### Phrase Block Structure (PBS) Templates

**What is PBS?**
- Structured prompt format for AI image generation (ChatGPT, DALL-E, Midjourney)
- Ensures consistent quality and brand adherence
- Organized into clear sections: SUBJECT, STYLE, PALETTE, VISUAL ELEMENTS, COMPOSITION, CONSTRAINTS

**Available Templates** ([docs/templates/image-template.md](docs/templates/image-template.md)):
1. **Generic Georgetown Rotary Image** - Default club branding
2. **Area of Focus Project Image** - Service projects with area-specific colors
3. **Open Graph / Social Media Image** - 1200×630 optimized for social sharing
4. **Ready-to-Use Prompts**:
   - Georgetown Rotary Default OG Image
   - Speaker Event Announcement
   - Service Project Highlight

**Example PBS Structure**:
```
SUBJECT:
organization: Georgetown Rotary Club
narrative focus: community leadership, service above self
values: trusted, established, action-oriented

STYLE:
refined continuous line art with color blocks
editorial illustration quality
professional, warm, confident

PALETTE:
#000000 (black) for line art
#0067C8 (rotary azure) large color field
#F7A81B (rotary gold) accent shape
#E4DFDA (platinum) background

VISUAL ELEMENTS:
single continuous line drawing: interlocking circular forms
one large organic azure shape behind line art
one small gold circle suggesting unity

COMPOSITION:
1200x630 pixels (1.9:1 aspect ratio)
balanced, welcoming, professional energy
negative space on left for text overlay

CONSTRAINTS:
no text, no logos, no words
no literal Rotary wheel
line art simple and continuous
color blocks solid (no gradients)
professional editorial quality, not cartoony
```

### Common Aspect Ratios

| Use Case | Dimensions | Ratio | File Location |
|----------|------------|-------|---------------|
| Open Graph / Social | 1200×630 | 1.9:1 | `/assets/images/social/` |
| WeChat / Square | 1024×1024 | 1:1 | `/assets/images/social/` |
| Hero image | 1536×1024 | 3:2 | `/assets/images/heroes/` |
| LinkedIn banner | 1584×396 | 4:1 | External use |

### Brand Standards Quick Reference

**Mandatory Rules** (from [docs/governance/rotary-brand-guide.md](docs/governance/rotary-brand-guide.md)):

1. **Logo Protection**:
   - ❌ NEVER modify official Rotary wheel logo
   - ❌ NEVER add effects, gradients, or distortions
   - ✅ Use abstract circular forms to suggest Rotary without literal wheel

2. **Color Usage**:
   - ✅ Maximum 3 colors per image (line + field + accent)
   - ✅ Use solid, flat colors (no gradients)
   - ✅ Platinum background for accessibility

3. **Line Art**:
   - ✅ Simple, continuous lines (not detailed/fussy)
   - ✅ Editorial illustration quality
   - ✅ Suggest concepts abstractly (no literal objects)

4. **Typography**:
   - Primary: Open Sans (self-hosted) - clean, professional
   - Accent: Montserrat - optional for headlines
   - Avoid: Decorative, script, or overly casual fonts

5. **Image Quality Checklist**:
   - [ ] Line art is simple and continuous
   - [ ] Color blocks are solid (no gradients)
   - [ ] Maximum 3 colors (line + field + accent)
   - [ ] No resemblance to official Rotary wheel
   - [ ] No text, logos, or labels in image
   - [ ] Renders clearly at target size
   - [ ] Background is Platinum (#E4DFDA)

### Image Generation Workflow

**Using PBS Templates**:

1. **Select Template**: Choose from [docs/templates/image-template.md](docs/templates/image-template.md)
   - Generic club image
   - Area of Focus project
   - Open Graph social media
   - Speaker event
   - Service project highlight

2. **Customize Prompt**:
   - Fill in bracketed placeholders
   - Choose line art subject from reference table
   - Select accent shape and meaning
   - Specify dimensions for use case

3. **Generate Image**:
   - Copy complete PBS prompt to ChatGPT/DALL-E
   - Review against quality checklist
   - Iterate if needed using iteration tips

4. **Optimize & Deploy**:
   - Save to appropriate directory
   - Optimize file size (<200KB for web)
   - Verify aspect ratio and dimensions
   - Update meta tags if used for social sharing

**Iteration Tips** (if AI result isn't right):

| Problem | Request |
|---------|---------|
| Too complex | "Make the line art simpler" |
| Too small | "Make the color field larger" |
| Wrong position | "Move the [element] to [location]" |
| Too busy | "Add more negative space" |
| Wrong mood | "Make it more [warm/professional/energetic]" |
| Gradients appeared | "Use only solid, flat colors" |
| Text appeared | "Remove all text and labels" |

### Brand Resources

**Primary Documents**:
- [Rotary Brand Guide v2.0](docs/governance/rotary-brand-guide.md) - 12-part comprehensive guide
- [Image Template](docs/templates/image-template.md) - Ready-to-use prompts

**External References**:
- [Rotary International Brand Center](https://brandcenter.rotary.org/) - Official resources
- [My Rotary Brand Guidelines](https://my.rotary.org/en/learning-reference/about-rotary/brand-guidelines) - Official standards

**Design Token Files** (for developers):
- CSS variables: See brand guide Part 3
- Tailwind config: See brand guide Part 3
- Typography: Self-hosted Open Sans in `/public/assets/fonts/`

## Commands
- `npm run dev`: Start development server
- `npm run build`: Production build  
- `npm run preview`: Test production build locally

## Task Management Workflow

### Backlog System
**File**: `docs/governance/BACKLOG.md`

**Usage Pattern:**
- **CEO**: "Code, backlog this: [description]" or "CTO, backlog this: [description]"
- **CTO**: Adds item with ID, scope, acceptance criteria, status
- **Tracking**: backlog → in progress → completed

**Ownership:**
- **CTO owns**: All backlog maintenance, status updates, implementation planning
- **CEO does NOT**: Track tasks, manage priorities beyond high/future/ideas
- **COO reviews**: Quality of completed items, not task management

**Purpose**: System tracks tasks, not CEO's memory

## Critical Constraints
- Real-time collaboration (multiple users, shared data)
- **Mobile-first design (members primarily use phones during meetings)**
- Desktop-friendly but mobile-optimized user experience
- Self-hosted Open Sans fonts (no external CDNs)
- Rotary brand colors: Azure (#0067c8 PMS 2175C) primary, Gold (#f7a81b PMS 130C) accent
- NEVER commit secrets (use .env)
- **Proven patterns** - Leverage Georgetown's card-based layouts, modal system, real-time collaboration

## China-Friendly Design Constraints
- **Self-hosted assets only** - No Google Fonts, CDNs, or external dependencies
- **Complete network independence** - System functions without external API calls
- **Local font serving** - Open Sans family hosted in /public/assets/fonts/
- **No blocked services** - Avoid Google, Facebook, or other restricted platforms
- **Cloudflare Pages deployment** - Vercel is blocked in China; use Cloudflare Pages for global accessibility

## Speaker Workflow & Data
**Board Columns**: Ideas → Approached → Agreed → Scheduled → Spoken → Dropped
**Required Fields**: Name, Company, Title, Phone, Email, Topic, Rotary Affiliation, Website, Date, Status

## Customer Discovery Focus
**Current Hypothesis**: Program committee will replace email chains if board interface is intuitive
**Key Metric**: Weekly usage by 3-5 program committee members within first month
**Success Signal**: Zero speaker scheduling conflicts after adoption
**This Week's Learning**: [Update after first user feedback session]

## Quality Gates (Production)
- ✅ **Database schema updated** (verify new fields exist in Supabase)
- ✅ **Full CRUD operations working** (Create, Read, Update, Delete speakers)
- ✅ Drag-and-drop works between all board columns
- ✅ Data persists after browser refresh
- ✅ **Mobile-first responsive (test 320px-414px primary, then desktop)**
- ✅ **Touch-friendly interface (44px minimum touch targets)**
- ✅ Rotary brand colors implemented correctly
- ✅ Self-hosted fonts load properly (check Network tab)
- ✅ **Error boundary prevents crashes** (ErrorBoundary component)
- ✅ **Code splitting active** (377 KB main bundle, 40+ lazy chunks)
- ✅ **Offline detection working** (OfflineBanner component)
- ✅ **Zero TypeScript errors** (strict mode enabled)

## Robustness Enhancements (Completed October 2025)
**Robustness Score**: 9.5/10 (improved from 8.5/10)

### Phase 1: Critical Foundation
- **Error Boundary**: Prevents app crashes with user-friendly fallback UI
- **Code Splitting**: 55% bundle reduction (850 KB → 377 KB) for faster loading
- **RLS Verification**: Security policies verified for Georgetown's collaborative model

### Phase 2: UX Enhancements
- **Offline Detection**: Instant network status feedback with banner notifications
- **Retry Logic**: Automatic retry (3x) for failed API calls with exponential backoff
- **Realtime Hook**: Reusable `useRealtimeSubscription` for DRY realtime patterns
- **URL Validation**: Data quality utility for form inputs

### Phase 3: Polish Utilities
- **Logger**: Development-only console logs (production-ready)
- **Duplicate Detection**: Prevent duplicate speakers/members by email
- **Date Validation**: Business rule validation for scheduled dates
- **Type Safety**: TypeScript interfaces for Supabase realtime payloads

**Documentation**: See `docs/dev-journals/2025-10-17-robustness-phase-*` for implementation details

## Current Status
**Production Ready**: All robustness enhancements merged to main branch
**Performance**: 400-500ms faster on 4G, 1-2s faster on 3G
**Deployment**: Ready for Cloudflare Pages deployment to production