# Toastmasters Brand Guide for Pitchmasters Club Applications

## Brand Overview

Pitchmasters Toastmasters Club applications must reflect Toastmasters International's professional standards and global brand identity while serving startup founder communication needs.

## Color Palette (Official Toastmasters International + Startup Complements)

### Primary Colors (Use These Most)
* **Loyal Blue** (main): `#004165` - Primary interface elements, headers, navigation
* **True Maroon** (accent): `#772432` - Call-to-action buttons, highlights, secondary elements
* **Cool Gray** (neutral): `#A9B2B1` - Background elements, neutral areas
* **White**: `#ffffff`
* **Black**: `#000000`

### Accent Color (Use Sparingly)
* **Happy Yellow**: `#F2DF74` - Success states, celebration elements, energy highlights

### **NEW**: Startup-Focused Complementary Colors
Carefully selected to complement Toastmasters colors while energizing the startup community experience:

#### Innovation Green
* **Hex**: `#10B981` - Growth mindset, success metrics, positive progress indicators
* **Usage**: Progress bars, success states, growth charts, achievement badges
* **Complements**: True Maroon (creates professional contrast)

#### Founder Orange  
* **Hex**: `#F59E0B` - Energy, creativity, entrepreneurial spirit
* **Usage**: Call-to-action accents, energy highlights, innovation features
* **Complements**: Loyal Blue (creates vibrant contrast without overwhelming)

#### Insight Purple
* **Hex**: `#8B5CF6` - Wisdom, strategic thinking, premium features
* **Usage**: Premium feature highlights, analytics sections, strategic insights
* **Complements**: Happy Yellow (sophisticated contrast)

### Color Science Rationale
- **Innovation Green**: Psychological association with growth, progress, and forward momentum
- **Founder Orange**: Energetic and creative, scientifically proven to stimulate action and optimism  
- **Insight Purple**: Associated with wisdom and strategic thinking, appeals to leadership mindset
- All complement Toastmasters' core palette using color wheel harmony principles
- Maintains accessibility with proper contrast ratios

### Usage Guidelines for Startup Colors
- **Primary Interface**: Stick to Toastmasters core colors (80% usage)
- **Startup Features**: Use complementary colors for innovation-specific elements (15% usage)
- **Energy Accents**: Sparingly use for calls-to-action and success moments (5% usage)
- **Always maintain**: High contrast ratios and brand compliance hierarchy

### Gradient Options (Official)
* **Loyal Blue Gradient**: Loyal Blue (#004165) to Blissful Blue (#006094)
* **True Maroon Gradient**: Deep Maroon (#3B0104) to Rich Maroon (#781327)
* **Cool Gray Gradient**: Cool Gray (#A9B2B1) to Fair Gray (#F5F5F5)

### Color Usage Guidelines
- **Loyal Blue (#004165)**: Primary interface elements, headers, navigation
- **True Maroon (#772432)**: Call-to-action buttons, highlights, accent areas
- **Cool Gray (#A9B2B1)**: Neutral backgrounds, secondary text
- **High contrast**: Ensure WCAG 2.1 AA compliance for accessibility

## Typography (Self-Hosted Implementation)

### Font Hierarchy
- **Headlines**: Montserrat (bold, semi-bold for major headings)
- **Navigation/Subheads**: Montserrat (medium, regular for navigation)
- **Body Text**: Source Sans 3 (regular weight)
- **System Fallbacks**: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif

### Implementation Requirements
- **Self-hosted fonts**: No external CDN dependencies (Google Fonts blocked in some regions)
- **Font loading**: Preload critical font files for performance
- **Fallback strategy**: Graceful degradation to system fonts

### Typography Scale
```css
/* Headlines */
font-family: 'Montserrat', -apple-system, sans-serif;
font-size: 2rem; /* 32px */
font-weight: 700;
letter-spacing: 0.5px;

/* Subheadings */
font-family: 'Montserrat', -apple-system, sans-serif;
font-size: 1.25rem; /* 20px */
font-weight: 600;

/* Body text */
font-family: 'Source Sans 3', -apple-system, sans-serif;
font-size: 1rem; /* 16px */
font-weight: 400;
line-height: 1.6;
```

## Logo Usage Requirements (CRITICAL)

### Official Toastmasters Logos Only
- **Download Source**: toastmasters.org/Logos (official only)
- **Minimum Size**: 72 pixels (web) / 3/4 inches (print)
- **Clear Space**: Equal to wordmark height on all sides
- **Formats**: Full-color, grayscale, white versions available

### Logo Usage Prohibitions (NEVER)
- ❌ Cannot create custom versions for clubs/districts
- ❌ Cannot change colors or proportions
- ❌ Cannot place in perspective or add effects
- ❌ Cannot use on non-brand colors
- ❌ Cannot overlay with text, symbols, or images
- ❌ Cannot place side-by-side with other logos

### Available Logo Formats
- Standard Toastmasters logo
- Logo with "WHERE LEADERS ARE MADE"
- Logo with website URL
- Centennial variations with "Since 1924" (for 2024-2025)

## Visual Design Principles

### Mobile-First Design Standards
- **Primary Experience**: Design for mobile phones (320px-414px) first
- **Touch Interface**: Minimum 44px touch targets, thumb-friendly navigation
- **Meeting Context**: Usable during Toastmasters meetings with one-handed operation
- **Desktop Enhancement**: Desktop provides expanded functionality but mobile drives core UX
- **Progressive Enhancement**: Features scale up from mobile baseline

### Professional Standards
- **Clean layouts**: Generous white space, clear visual hierarchy
- **Modern interface**: Contemporary design patterns appropriate for 2024+
- **Toastmasters-appropriate**: Reflects leadership development and communication excellence
- **Accessibility**: WCAG 2.1 AA compliance minimum

### Component Styling
- **Cards**: Subtle shadows, rounded corners (4-8px radius)
- **Buttons**: Clear primary/secondary distinction using brand colors
- **Forms**: Professional appearance with proper validation states
- **Navigation**: Intuitive structure reflecting Toastmasters' organizational clarity

## Required Website Elements

### Mandatory Disclaimer
**MUST include on all websites:**
```
The information on this website is for the sole use of Toastmasters' 
members, for Toastmasters business only. It is not to be used for 
solicitation and distribution of non-Toastmasters material or information.
```

### Content Restrictions
- **Cannot republish**: Official Toastmasters content requiring membership/payment
- **Cannot rehost**: Official materials from Toastmasters International
- **Must focus**: Solely on Toastmasters business and mission
- **Link policy**: May link to publicly available materials only

## Photography & Imagery Guidelines

### Approved Content (Toastmasters-Compliant)
- People looking engaged, empowered, and supported
- Meeting environments, presentations, speeches
- Networking venues, conferences, training venues
- Speech contests and competitions
- Professional business settings showing diversity

### Prohibited Content
- Landscapes, animals, children as primary subjects
- Food and medicine as main focus
- Architecture as primary focus
- Generic stock imagery unrelated to speaking/leadership
- Any copyrighted/trademarked images without permission

## Illustration Style Standards

### Official Style: "Dynamic Tech-Startup Illustration"

**Primary Visual Style for Generated Content:**
> Modern startup-focused illustrations with dynamic energy, featuring tech-forward visual metaphors, bold geometric elements, and energetic compositions that convey growth, innovation, and professional ambition using Pitchmasters' expanded color palette.

### Style Characteristics
- **Energy Level**: High-octane, dynamic compositions with movement and momentum
- **Visual Metaphors**: Tech-forward elements (network connections, growth arrows, innovation symbols)
- **Geometric Elements**: Bold, clean geometric patterns suggesting connectivity and progress
- **Character Style**: Modern, diverse representation of Asia's startup founder community
- **Composition**: Energetic and professional, avoiding passive or overly minimalist approaches

### Target Audience Alignment
- **SE Asian Startup Community**: Resonates with region's digital-first, fast-moving culture
- **Professional Credibility**: Maintains authority and business legitimacy
- **Cultural Relevance**: More concrete visual metaphors preferred in Asian business context
- **Modern Tech Aesthetic**: Similar to successful startup brands (Slack, Notion, Figma)

### Implementation Guidelines
- **Primary Colors**: Use expanded Pitchmasters palette as foundation
- **Startup Accent Colors**: Strategic use of Innovation Green, Founder Orange, Insight Purple
- **Visual Elements**: Include subtle tech elements like connected nodes, network patterns
- **Composition**: Dynamic angles and perspectives suggesting acceleration and growth
- **Avoid**: Overly calm, static, or abstract minimalist approaches

### Usage Context
- Meeting summary images
- Social media visual content
- Event promotion graphics
- Website illustration elements
- Presentation visual aids

**Rationale**: This style better matches the "high-octane startup energy" positioning and appeals to Asia's ambitious, tech-forward entrepreneurial community while maintaining professional standards appropriate for the startup investment ecosystem.

## Voice & Messaging

### Communication Style (Official Toastmasters)
- **Voice**: Confidence and compassion
- **Tone**: Clear yet respectful, friendly yet professional
- **Attributes**: Positive, upbeat, enthusiastic, serious when necessary, open to exchange

### Communication Standards Checklist
All branded communication must be:
- **Warm** and **Friendly**
- **Clear** and **Professional**
- **Respectful** and **Succinct**
- **Universally understandable**
- **Internationally friendly**

### Approved Marketing Phrases
- "Find Your Voice"
- "Relax, present confidently"
- "Communicate Confidently®"
- "Find your confidence"
- "Become a better leader"
- "Where Leaders Are Made"

## Pitchmasters-Specific Adaptations

### Startup-Focused Messaging
- **Target Audience**: Entrepreneurs, startup founders, business leaders
- **Value Proposition**: Communication skills that transform ideas into funded realities
- **Unique Positioning**: "Where Founders Find Their Voice"
- **Core Benefits**: Pitch mastery, investor presentations, leadership presence

### Global Community Elements
- **Multi-cultural design**: Works across Asia-Pacific markets
- **Time zone flexibility**: Accommodates global membership
- **Professional standards**: Worthy of international startup ecosystem

## Implementation Checklist

### Design Validation
- [ ] Primary colors (Loyal Blue/True Maroon) prominently featured
- [ ] Typography hierarchy clear and readable using self-hosted fonts
- [ ] Official Toastmasters logos used without modification
- [ ] Professional appearance worthy of startup founder audience
- [ ] Mobile responsive design (320px to 1920px)
- [ ] Accessibility compliance verified

### Technical Validation
- [ ] Self-hosted Montserrat and Source Sans 3 fonts loading correctly
- [ ] Color contrast ratios meet WCAG standards
- [ ] Performance optimized (sub-3-second load times)
- [ ] Cross-browser compatibility tested
- [ ] Required disclaimer included on all pages

### Brand Compliance
- [ ] No unauthorized logo modifications or custom club logos
- [ ] Typography follows established hierarchy
- [ ] Visual style reflects Toastmasters' professional standards
- [ ] Messaging uses appropriate leadership-focused language
- [ ] Content restrictions respected (no republishing official materials)

### Startup Ecosystem Integration
- [ ] Messaging resonates with founder audience
- [ ] Professional quality worthy of investment community
- [ ] Clear value proposition for startup communication needs
- [ ] Global accessibility for international entrepreneurs

---

**Bottom Line**: Every Pitchmasters application must maintain strict Toastmasters International brand compliance while effectively serving the global startup founder community. Professional appearance and accessibility are non-negotiable requirements that reflect both Toastmasters' standards and the entrepreneurial ecosystem's expectations.