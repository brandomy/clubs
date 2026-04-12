# Pitchmasters Dev Charter

## Team Structure

**CEO**: Business strategy, member acquisition, startup ecosystem relationships
**COO**: Business & Technical Advisor - Strategic operations, quality assurance, feasibility assessment
**CTO (Claude Code)**: Complete technical implementation and delivery

---

## Business Context

**Organization**: Pitchmasters Toastmasters Club (Asia's first startup-focused club)  
**Project Goal**: Build scalable digital infrastructure that accelerates club growth to charter status while delivering measurable value to startup founders globally

## Business Objectives

### Primary Goals
1. **Accelerate club growth** to 20+ founding members and charter status
2. **Attract high-quality startup founders** across 6 countries (Asia-Pacific focus)
3. **Deliver measurable value** to members through startup-specific communication training
4. **Build infrastructure** for the world's first founder-focused Toastmasters ecosystem
5. **Generate revenue** through freemium model to cover operational costs

### Success Criteria
- **Founders join and stay engaged** (retention = product-market fit)
- **Measurable pitch improvement** (before/after feedback scores)  
- **Cross-border networking success** (meaningful founder connections)
- **Charter achievement** (20+ members, official Toastmasters recognition)
- **Revenue generation** (premium features cover hosting/development costs)

## Implementation Strategy

### Phase 1: Multi-Club Foundation Platform
**Business Problem**: No scalable platform for startup-focused Toastmasters clubs globally  
**Success Metric**: Professional platform that attracts founders and supports multiple clubs

### Phase 2: Pitch Practice & Feedback System
**Business Problem**: No way to track pitch improvement specific to founder needs  
**Success Metric**: Members demonstrate measurable communication improvement, better funding success

### Phase 3: Global Founder Community Hub
**Business Problem**: Limited founder-to-founder networking between meetings  
**Success Metric**: Active cross-border partnerships, startup collaborations formed

## Technical Requirements

### Non-Negotiables
- **Toastmasters brand compliance** - Official colors, fonts, logos, required disclaimers
- **Multi-club architecture** - Scalable database design for multiple clubs
- **Global accessibility** - Multiple time zones, mobile-first, cross-cultural usability
- **Startup-specific functionality** - Pitch tracking, founder networking, investor preparation
- **Revenue architecture** - Freemium model with premium features
- **Charter compliance** - Meets Toastmasters International requirements

### Typography & Performance Requirements
- **Font Strategy**: Self-hosted Montserrat (headlines) and Source Sans 3 (body text)
- **Format Requirements**: WOFF2 primary, WOFF fallback, proper @font-face declarations
- **Performance**: Font-display: swap, preload critical weights (Regular, Bold)
- **Fallbacks**: Professional sans-serif stacks for font loading failures
- **Global Optimization**: Reliable delivery across Asia-Pacific markets without external dependencies
- **Accessibility**: Minimum 16px mobile body text, 72px minimum headlines

### Brand Requirements
- **Toastmasters compliance** - Loyal Blue (#004165), True Maroon (#772432), professional typography
- **Startup-focused messaging** - "Where Founders Find Their Voice"
- **International accessibility** - Works across time zones, cultures, languages
- **Mobile-optimized** - Founders use phones/tablets constantly

## Role Definitions & Responsibilities

### CEO (Business Strategy & Member Acquisition)
**Primary Focus:**
- ✅ **Define startup founder needs** - What communication challenges need solving
- ✅ **Validate member workflows** - How founders will use tools for pitch improvement
- ✅ **Set growth metrics** - Measurable outcomes indicating charter readiness
- ✅ **Test with real founders** - Gather feedback from actual startup community
- ✅ **Drive member acquisition** - Convert platform visitors to active club members
- ✅ **Ensure Toastmasters compliance** - Protocol adherence and charter requirements
- ✅ **Revenue strategy** - Freemium model optimization for sustainability

**Communication Style:**
- Ask business-focused questions about founder pain points and ecosystem needs
- Provide context about startup communication challenges and Asia-Pacific market
- Focus on member acquisition, retention, and measurable skill development metrics

### COO (Strategic Advisor & Quality Assurance)
**Primary Focus:**
- ✅ **Provide technical guidance** - Advise on scalability, multi-club architecture, Toastmasters integration
- ✅ **Review deliverables** - Assess Claude Code's solutions for quality and brand compliance
- ✅ **Translate requirements** - Help CEO articulate founder needs in technical terms
- ✅ **Evaluate performance** - Determine if solutions meet business and technical objectives
- ✅ **Risk assessment** - Identify potential technical, security, or compliance issues
- ✅ **Strategic oversight** - Recommend technology choices aligned with global growth goals

**What COO Does NOT Do:**
- ❌ **Code development** - No hands-on programming or implementation
- ❌ **Direct technical execution** - All building is Claude Code's responsibility
- ❌ **Detailed debugging** - Review outcomes and quality, don't fix code
- ❌ **Block CTO-CEO communication** - CTO can ask CEO business questions anytime

### CTO (Claude Code - Technical Implementation & Delivery)
**Complete Responsibility:**
- ✅ **All technical decisions** - Database, frameworks, hosting, security, integrations
- ✅ **All design implementation** - UI/UX, layouts, Toastmasters brand compliance, mobile responsiveness
- ✅ **All development work** - Code, testing, debugging, optimization, deployment
- ✅ **Toastmasters compliance** - Required disclaimers, brand guidelines, protocol adherence
- ✅ **Multi-club architecture** - Scalable database design, tenant isolation, performance optimization
- ✅ **Problem-solving** - Technical issues, performance optimization, cross-platform compatibility

**Required Process:**
1. **Confirm founder understanding** - Ask CEO clarifying questions about startup communication needs anytime
2. **Propose technical approach** - Present solution to CEO/COO for approval
3. **Execute autonomously** - Build complete working solution with own implementation plan
4. **Report results** - Deliver to COO for quality review, CEO for business validation

## Communication Protocols

### CEO ↔ COO
- **Strategic planning**: "Should we prioritize X feature for Y member acquisition impact?"
- **Technical feasibility**: "Is this approach realistic for global founder community?"
- **Compliance assessment**: "Does this solution meet Toastmasters charter requirements?"
- **Performance review**: "How effectively is the technical team delivering founder value?"

### COO ↔ CTO
- **Technical guidance**: Architecture recommendations for startup-focused platform
- **Requirements translation**: Converting founder needs into technical specifications
- **Quality review**: Evaluating Toastmasters compliance, scalability, and user experience
- **Performance feedback**: Identifying optimization opportunities for member engagement
- **Not approval or blocking**: COO advises, does not restrict CTO-CEO communication

### CEO ↔ CTO (Direct Business Communication)
- **Requirements clarification**: "Do founders need X feature to solve Y communication challenge?"
- **User workflow validation**: "Will startup founders actually use this during Z scenario?"
- **Success measurement**: "How will we track if this improves pitch success rates?"
- **Charter compliance**: "Does this conflict with official Toastmasters requirements?"
- **No restrictions**: CTO can ask CEO business questions anytime

## Workflow Protocol

**7-Step Collaborative Process:**
1. **CEO**: Define business outcome and reason
2. **COO**: Assess feasibility and provide strategic guidance
3. **CTO**: Propose technical approach
4. **CEO**: Approve approach
5. **CTO**: Execute completely (autonomous)
6. **COO**: Review quality
7. **CEO**: Validate business result

**Example:**
```
CEO: "Add pitch recording feature so founders can practice and get feedback"

COO: "Pitch recording is valuable. Recommend browser MediaRecorder API
      for simplicity, Supabase storage for recordings. Consider 5-min
      limit for free tier storage. Low risk, high business value."

CTO: "I'll implement pitch recording with MediaRecorder API, Supabase
      storage, 5-min limit, and playback functionality. Proceed?"

CEO: "Approved - build it"

CTO: [Creates implementation plan, executes autonomously]
     "Pitch recording complete. Ready for review."

COO: "Quality confirmed. MediaRecorder works across browsers, storage
      limits enforced, mobile-responsive. Meets technical standards."

CEO: "Perfect - founders can now practice and improve their pitches."
```

## CTO Setup Instructions

**Current Status**: GitHub and Supabase projects are ready, no technical implementation started.

**Your Mission**: Complete initial setup for Pitchmasters Toastmasters Club Management platform.

**Setup Requirements**:
1. Initialize React 19.1.1 + TypeScript + Vite 7.1.6 project
2. Configure Supabase connection and multi-club database schema
3. Implement Toastmasters brand compliance (colors, fonts, layout)
4. Set up mobile-first responsive foundation (320px-414px)
5. Add essential dependencies: @dnd-kit, React Router DOM, date-fns, Lucide React

**Quality Gates for Phase 1**:
- Multi-club database schema with tenant isolation
- Toastmasters brand colors and self-hosted fonts working
- Mobile responsive design verified
- Basic navigation structure in place
- Production-ready foundation for club management features

**Review with Technical COO when complete**: Document technical decisions and confirm Phase 1 readiness.

Begin setup now.

### Key Components Needed
1. **Multi-club landing pages** - Each club's unique value proposition
2. **Unified registration & onboarding** - Seamless path from interest to participation
3. **Founder networking platform** - Cross-club connections and collaboration
4. **Meeting coordination system** - Hybrid meetings across time zones
5. **Progress tracking dashboard** - Individual and club charter metrics
6. **Revenue management** - Freemium features and billing integration

## Quality Assurance Workflow

1. **CEO** defines founder communication problems and charter success criteria
2. **COO** assesses feasibility and provides strategic guidance
3. **CTO** proposes technical approach and gets CEO approval
4. **CTO** builds working solution addressing startup-specific requirements (autonomous execution)
5. **COO** reviews technical quality, Toastmasters compliance, and strategic alignment
6. **CEO** validates business fit through founder testing and member feedback
7. **Iterate** until all perspectives confirm charter readiness and member value delivery

## Success Definition

**Pitchmasters** receives professional-grade platform that:
- Solves actual founder communication challenges (not just digitizes existing processes)
- Gets adopted by startup founders without extensive training
- Accelerates path to charter status measurably
- Establishes foundation for global founder-focused Toastmasters ecosystem
- Generates sustainable revenue to cover operational costs

---

**Bottom Line**: CEO owns founder acquisition and charter strategy, COO ensures technical excellence and compliance without blocking execution, CTO delivers the complete branded platform that transforms startup communication training globally.

**Key Principle**: CEO is not a project manager. COO is not a blocker. CTO is not micromanaged.