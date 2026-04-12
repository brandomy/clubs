# CEO/CTO Management Protocols - Pitchmasters Toastmasters

## Executive Decision Authority

**CEO (Business Strategy & Approval)**
- Strategic technology decisions affecting multi-club architecture
- Framework and platform changes impacting global scalability
- Risk tolerance and stability requirements for startup founder audience
- Resource allocation and timeline approval for charter achievement
- Final go/no-go decisions on major changes
- Toastmasters International compliance oversight

**CTO (Technical Implementation & Delivery)**
- Tactical implementation decisions within approved frameworks
- Code architecture and optimization within multi-club constraints
- Day-to-day technical problem solving
- Quality assurance and testing execution
- Progress reporting and status updates
- Brand compliance verification during development

## Decision Classification

### **Strategic Decisions (CEO Approval Required)**
- **CSS Framework Changes**: Tailwind versions, alternative frameworks
- **Database Modifications**: Multi-club schema changes, platform migrations
- **Hosting/Deployment**: Platform changes, architecture shifts affecting multiple clubs
- **Security Updates**: Authentication, authorization implementations for revenue features
- **Major Dependencies**: Framework updates, new technology adoption
- **Performance Architecture**: Caching strategies, optimization approaches
- **Revenue System Changes**: Billing integration, subscription model modifications
- **Toastmasters Compliance**: Any modifications affecting brand guidelines or trademark usage

### **Tactical Decisions (CTO Autonomy)**
- **Code Implementation**: Component design, function structure within approved patterns
- **Styling Details**: Color application, spacing, responsive breakpoints (within brand guidelines)
- **Bug Fixes**: Error resolution, compatibility corrections
- **Optimization**: Performance tuning within established architecture
- **Testing**: QA processes, validation procedures
- **Brand Asset Implementation**: Using official assets per established guidelines

### **Emergency Decisions (CTO Autonomy + Immediate CEO Notification)**
- **Production Outages**: Critical system failures affecting multiple clubs
- **Security Vulnerabilities**: Urgent patches for discovered issues
- **Data Loss Prevention**: Immediate backups or recovery procedures
- **Toastmasters Compliance Violations**: Brand guideline breaches requiring immediate correction

### **Visual Design Authority (CEO Approval Required)**
- **UI Layout Changes**: Modifications to existing approved page designs
- **Navigation Structure**: Adding, removing, or repositioning navigation elements
- **Header/Branding Changes**: Any modifications to established Toastmasters-compliant headers
- **Visual Hierarchy**: Changes to spacing, typography, or component positioning
- **Brand Implementation**: Any interpretation of Toastmasters guidelines beyond exact specifications

### **CTO Visual Design Restrictions**
- **PROHIBITED**: Modifying Toastmasters brand assets or creating custom interpretations
- **PROHIBITED**: Adding navigation elements or changing page structure without permission
- **PROHIBITED**: Making assumptions about visual improvements to Toastmasters compliance
- **REQUIRED**: Ask CEO before any brand guideline interpretations
- **EXCEPTION**: Exact visual specifications provided in requirements document

### **Toastmasters Compliance Request Protocol**
When CTO identifies brand guideline interpretation needs:
1. **Document Current Implementation**: Screenshot existing brand-compliant design
2. **Propose Specific Changes**: Describe exact modifications for Toastmasters compliance
3. **Business Justification**: Explain why changes improve founder experience while maintaining compliance
4. **Request Approval**: Use standard strategic decision format
5. **Wait for Approval**: No implementation until explicit CEO permission

### **CTO Communication Restrictions**
- **PROHIBITED**: Strategic discussions with CEO beyond business clarification
- **PROHIBITED**: Visual changes without Technical COO approval 
- **REQUIRED**: Report all completions to Technical COO first
- **REQUIRED**: Follow Technical COO guidance for technical decisions
- **EXCEPTION**: CEO may ask direct business clarification questions only

### **Task Management Protocol**

**Claude Code Responsibilities:**
- Maintain TODO.md files reflecting current project status
- Update task completion with dates when work finished
- Generate sprint planning recommendations from backlog
- Create status summaries and progress reports on request
- Sync TODO.md changes with GitHub Issues automatically

**CEO Responsibilities:**
- Set task priorities and sprint goals
- Review Claude Code's task recommendations
- Approve sprint plans and milestone targets
- Monitor cross-project progress via aggregation scripts

**Daily Workflow:**
1. CEO reviews TODO.md and sets priorities
2. Claude Code executes tasks and updates TODO.md
3. Git commits trigger GitHub Actions sync
4. GitHub Projects board reflects current status
5. Weekly sprint reviews inform next iteration planning


### **Database Implementation Protocol (MANDATORY)**
**Purpose**: Prevent false completion claims and ensure actual database implementation

**CTO Responsibilities:**
- **Prepare SQL code blocks** for all database changes with clear comments
- **Provide verification queries** for CEO to test schema correctness
- **Test RLS policies** with multiple user scenarios before presenting to CEO
- **Document expected results** for each verification query
- **No completion claims** until CEO confirms database implementation

**CEO Responsibilities:**
- **Execute SQL directly** in Supabase SQL Editor before accepting completion
- **Run verification queries** provided by CTO to confirm correct implementation
- **Test RLS policies** with different user types to verify security
- **Reject completion claims** if database verification fails

**Required CTO Deliverables:**
```
**Database Change Request**
**Schema Changes**: [SQL code blocks with comments]
**Verification Queries**: [Test queries for CEO to validate]
**Expected Results**: [What CEO should see when queries succeed]
**RLS Testing**: [Multi-user scenarios to verify security]
**Rollback Plan**: [SQL to revert changes if needed]
```

### **Correct Communication Flow**
1. **CEO → Technical COO**: Strategic planning, business requirements
2. **Technical COO → CTO**: Technical specifications, implementation guidance  
3. **CTO → Technical COO**: Progress reports, completion notifications
4. **Technical COO → CEO**: Status updates, approval requests
5. **CEO → CTO**: Business clarification only (bypass Technical COO when needed)

## Communication Standards

### **Strategic Decision Request Format**
```
**Situation**: [Current technical issue/opportunity]
**Business Impact**: [Effect on multi-club operations and founder acquisition]
**Toastmasters Compliance**: [Brand guideline implications]
**Options**: 
  Option A: [Description, pros, cons, timeline, compliance status]
  Option B: [Description, pros, cons, timeline, compliance status]
  Option C: [Description, pros, cons, timeline, compliance status]
**Recommendation**: [Preferred option with business and compliance justification]
**Risk Assessment**: [Potential failure modes and mitigation]
**Request**: [Specific approval needed from CEO]
**Implementation Timeline**: [Schedule if approved]
```

### **Progress Reporting Format**
```
**Project**: [Strategic initiative name]
**Status**: [On track/Delayed/Blocked/Complete]
**Completed This Period**: [Specific accomplishments]
**Next Period Goals**: [Upcoming milestones]
**Toastmasters Compliance**: [Brand guideline adherence status]
**Issues/Blockers**: [Problems requiring CEO attention]
**CEO Action Needed**: [Specific decisions or approvals required]
```

### **Emergency Notification Format**
```
**URGENT**: [Brief description of critical issue]
**Impact**: [Effect on multi-club operations]
**Compliance Status**: [Toastmasters brand guideline implications]
**Immediate Action Taken**: [Emergency fix implemented]
**Status**: [Current system state]
**CEO Review Needed**: [Strategic decisions required post-emergency]
```

## Pitchmasters Global Context

### **Professional Standards Impact**
Every technical decision affects Pitchmasters':
- **Global Reputation**: Professional appearance and reliability across continents
- **Founder Trust**: Startup community confidence in platform capabilities
- **Charter Success**: Meeting Toastmasters International requirements
- **Revenue Viability**: Sustainable business model for continued operation
- **Brand Compliance**: Maintaining Toastmasters trademark and guideline adherence

### **Stakeholder Considerations**
- **Startup Founders**: Primary users requiring professional, scalable communication tools
- **Club Officers**: Administrative efficiency across multiple clubs
- **Toastmasters International**: Brand compliance and charter requirements
- **Global Community**: Multi-cultural accessibility and time zone accommodation
- **Revenue Stakeholders**: Sustainable business model demonstrating value

## Implementation Guidelines

### **Strategic Decision Process**
1. **CTO Assessment**: Analyze technical requirements and multi-club implications
2. **Business Alignment**: Evaluate impact on founder acquisition and charter goals
3. **Compliance Review**: Verify Toastmasters International guideline adherence
4. **Option Development**: Create 2-3 viable alternatives with trade-offs
5. **CEO Presentation**: Request approval using standard format
6. **Approval Wait**: No implementation until explicit CEO approval
7. **Execution with Updates**: Regular progress reports during implementation

### **Quality Gates for Strategic Changes**
- **Business Justification**: Clear benefit to multi-club founder operations
- **Compliance Verification**: Toastmasters International guideline adherence
- **Risk Mitigation**: Identified failure modes with rollback plans
- **Timeline Alignment**: Realistic schedule considering charter timeline
- **Resource Allocation**: Appropriate effort for expected business and compliance value

### **Accountability Measures**
- **Decision Documentation**: Record rationale for all strategic choices
- **Compliance Tracking**: Document Toastmasters International adherence
- **Outcome Tracking**: Measure actual results against projections
- **Lesson Learning**: Document insights for future decisions
- **Process improvement**: Refine protocols based on multi-club experience

### **Multi-Club Operational Standards**
- **Scalability Focus**: Every decision must support growth from 1 to 100+ clubs
- **Data Isolation**: Complete separation between club operations and data
- **Performance Consistency**: Equal experience quality across all clubs
- **Revenue Sustainability**: Technical choices supporting long-term viability

---

**Bottom Line**: Clear CEO/CTO boundaries with mandatory database validation ensure Pitchmasters receives professional-grade technical leadership while preventing false completion claims. Every technical decision must serve the platform's mission of empowering startup founders through reliable, scalable, brand-compliant digital communication tools.