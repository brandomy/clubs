# Technology Constraints for Pitchmasters Toastmasters Club Management

## Stability Requirements

**Production Systems Only**: Pitchmasters requires proven, stable technology for global club reputation and multi-club reliability.

### Mandatory Stable Versions

**CSS Frameworks:**
- ✅ **Tailwind CSS v3.x** (stable, proven, extensive documentation)
- ❌ **Tailwind CSS v4.x** (beta status, breaking changes, instability risk)

**Frontend Frameworks:**
- ✅ **React 18.x** (stable release with concurrent features)
- ✅ **TypeScript 5.x** (stable, mature type system)
- ✅ **Vite 4.x/5.x** (stable build tool with proven performance)

**Database & Backend:**
- ✅ **Supabase stable features** (auth, database, real-time, multi-tenancy)
- ❌ **Supabase edge functions** (unless explicitly required for revenue features)
- ✅ **PostgreSQL standard features** (proven SQL patterns, row-level security)

### Beta Technology Restrictions

**Automatic Rejection Categories:**
- Alpha/beta CSS frameworks (Tailwind v4, experimental frameworks)
- Experimental React features (not yet stable)
- Unreleased database features
- Unproven build tools or configurations
- External dependencies in beta/preview status

**Approval Required Categories:**
If business need justifies beta technology:
1. **Document business justification** - why stable alternatives insufficient
2. **Risk assessment** - potential failure modes and mitigation
3. **Rollback plan** - complete migration path to stable alternative
4. **CEO approval** - explicit sign-off for production beta usage

### Pitchmasters Global Context

**Multi-Club Standards:**
- Interface quality worthy of Toastmasters International leadership
- Zero tolerance for downtime during meetings across time zones
- Professional appearance reflecting global startup ecosystem reputation
- Scalable architecture supporting growth from 1 to 100+ clubs

**Operational Requirements:**
- **Reliability**: Systems must work consistently for non-technical founders
- **Performance**: Fast loading for mobile users during meetings globally
- **Maintainability**: Simple enough for club officers to understand
- **Scalability**: Support exponential growth without proportional complexity increase
- **Revenue Stability**: Billing and premium features must be rock-solid

### Technology Selection Process

**Required Evaluation Steps:**
1. **Stability Check**: Is this a stable, production-ready release?
2. **Business Alignment**: Does this serve global startup founder needs?
3. **Support Ecosystem**: Documentation, community, long-term viability?
4. **Integration Impact**: How does this affect multi-club architecture?
5. **Maintenance Burden**: Can club officers understand and maintain this?
6. **Revenue Impact**: Does this affect billing or premium feature stability?

**Default to Stability:**
When multiple options exist, always choose the stable, proven option unless clear business advantage justifies additional risk.

### Specific Pitchmasters Constraints

**Font Strategy:**
- Self-hosted Plus Jakarta Sans (headings) and Source Sans 3 (body) — no external CDN dependencies
- Both fonts are variable fonts: subsetted woff2 files served from `/public/assets/fonts/`, covering Latin, Latin-ext, and Vietnamese subsets
- System font fallbacks for reliability
- Professional typography hierarchy matching Toastmasters brand

**Color Implementation:**
- Toastmasters Loyal Blue (#004165) as primary brand color
- True Maroon (#772432) used for accent elements
- Cool Gray (#A9B2B1) for neutral elements
- High contrast ratios for accessibility compliance

**Performance Standards:**
- **Mobile-first responsive design** (320px-414px primary, scales to 1920px)
- **Touch-optimized interfaces** (44px minimum touch targets)
- **Fast mobile loading** (sub-3-second on standard mobile networks globally)
- **Offline-friendly** (graceful degradation when connectivity poor)
- **Lighthouse scores** >90 across all metrics on mobile devices

### **Global Network Independence Requirements**

**China-Friendly Design Standards:**
- **Self-hosted assets** - All fonts, icons, and resources served locally
- **No Google dependencies** - CDN, fonts, analytics, or API calls
- **No external CDN reliance** - Complete functionality without internet dependencies
- **Blocked services avoidance** - Google Fonts, Maps, Analytics, Facebook services

**Asset Self-Hosting Requirements:**
- **Fonts**: Plus Jakarta Sans and Source Sans 3 (variable, subsetted woff2) hosted in /public/assets/fonts/
- **Icons**: All visual assets served from local filesystem
- **Scripts**: No external JavaScript dependencies beyond npm packages
- **Images**: All brand assets and graphics self-contained

**Performance Benefits:**
- Faster loading without DNS lookup delays to external services
- Reliable functionality regardless of network restrictions
- Professional appearance maintained globally
- Zero external dependency failures

### Multi-Club Architecture Constraints

**Database Design Requirements:**
- **Row-Level Security**: PostgreSQL RLS for tenant isolation
- **Scalable Schema**: Designed for 1-100+ clubs without restructuring
- **Performance Optimization**: Indexed queries for multi-tenant patterns
- **Data Isolation**: Complete separation between club data

**Authentication & Authorization:**
- **Supabase Auth**: Proven authentication with multi-tenant support
- **Role-Based Access**: Club officers, members, admin roles
- **Premium Feature Gating**: Stable billing integration patterns

### Quality Assurance Integration

**Pre-Deployment Testing:**
- Cross-browser compatibility (Chrome, Safari, Firefox minimum)
- Mobile device testing across time zones (iOS/Android responsive verification)
- Performance measurement (Network tab resource analysis)
- Accessibility validation (keyboard navigation, screen readers)
- Multi-club data isolation verification

**Failure Response:**
If stable technology requirements are violated:
1. **Immediate assessment** - document impact on global club operations
2. **Migration planning** - timeline to move to stable alternative
3. **Process improvement** - prevent similar stability violations

### Revenue System Stability

**Billing Integration Requirements:**
- **Stripe stable APIs** - No beta payment features
- **Subscription Management** - Proven recurring billing patterns
- **Feature Gating** - Reliable premium feature access control
- **Usage Tracking** - Stable metrics collection for billing

**Financial Security:**
- **PCI Compliance** - Through Stripe's stable infrastructure
- **Data Protection** - GDPR/privacy law compliance
- **Audit Trails** - Complete financial transaction logging

---

**Bottom Line**: Pitchmasters' global reputation and multi-club architecture require technology choices that prioritize stability, reliability, and maintainability over experimental features. Every technical decision must serve the platform's mission of empowering startup founders through efficient, professional, globally-accessible communication training.