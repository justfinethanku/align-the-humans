# Claude Code Prompt: Build Human Alignment App

## Project Overview

Build a complete Next.js application called "Align the Humans" that helps people reach mutual agreements through AI-facilitated structured conversations. This is a prototype that will be hosted on Vercel with Supabase for auth/database and Vercel AI SDK for AI features.

## Implementation Status

✅ **Database Setup Complete** (2025-11-10)
- Supabase project linked (ref: `qvzfcezbuzmvglgiolmh`)
- All 8 core tables created with RLS enabled
- Privacy-preserving policies implemented
- Performance indexes on all critical columns
- State machine validation for status transitions
- Realtime broadcast triggers configured
- See `context/supabase_cli.md` for full documentation

✅ **Migrations Deployed**
- `20251110051815_init_human_alignment.sql` - Core schema
- `20251110052038_realtime_policies.sql` - Realtime RLS

✅ **Reference Implementation**
- Production-ready Next.js realtime example in `context/examples/realtime-example.md`

✅ **Feature-Builder Sub-Agent** (2025-11-10)
- Autonomous implementation agent configured in `.claude/agents/feature-builder.md`
- Designed for zero-token coding: orchestrator delegates, agent implements
- Handles components, pages, API routes, database queries, AI SDK integrations
- Returns structured JSON completion reports
- See "Implementation Strategy with Feature-Builder" section below

✅ **Chrome DevTools MCP Integration** (2025-11-10)
- Visual regression testing via screenshots and snapshots
- Accessibility validation (keyboard nav, ARIA, screen readers)
- Performance monitoring (Core Web Vitals, network, console)
- Responsive design verification at multiple viewport sizes
- Feature-builders use DevTools for quality assurance before completion
- See "Chrome DevTools Validation Strategy" section below

✅ **Core Application Implementation Complete** (2025-11-10)
- Next.js 14 project initialized with TypeScript, Tailwind CSS, shadcn/ui
- Authentication system with Supabase Auth (signup, login, middleware)
- Homepage with all sections (Hero, Flow, Stats, Use Cases, Testimonials, CTA)
- Dashboard with real-time alignment updates and partner management
- All 5 alignment workflow pages:
  - `/alignment/new` - Template selection and custom alignment creation
  - `/alignment/[id]/clarity` - AI-assisted clarification with partner selection
  - `/alignment/[id]/questions` - Dynamic questionnaire with AI help
  - `/alignment/[id]/analysis` - AI-powered response analysis with conflict detection
  - `/alignment/[id]/resolution` - Conflict resolution interface with AI suggestions
- Complete page implemented (document generation + signatures)
- All 5 AI API routes deployed:
  - `/api/ai/clarify` - AI-powered clarification suggestions
  - `/api/ai/analyze` - Response comparison and conflict detection
  - `/api/ai/suggest` - Context-aware answer suggestions
  - `/api/ai/generate` - Final document generation
  - `/api/alignment/create` - Alignment creation with partner invitation
- Partner management system with search and invitation
- Error boundaries and loading states on all routes
- Dark/light mode support across all pages
- Responsive design (mobile, tablet, desktop)

✅ **TypeScript Compilation** (2025-11-10)
- All TypeScript compilation errors resolved
- Strict mode enabled and passing
- Type definitions for all Supabase tables, API responses, and components

⚠️ **Requires Testing** (2025-11-10)
- End-to-end browser testing with Chrome DevTools MCP
- Partner profile queries need testing with real data (currently uses Supabase client but needs validation)
- Real-time updates need verification across multiple browser sessions
- AI API routes need testing with actual Anthropic API calls
- Signature flow needs end-to-end testing

## Recent Fixes (2025-11-10)

✅ **Vercel AI SDK v5 API Compatibility**
- Fixed deprecated maxTokens → maxOutputTokens in all AI API routes
- Updated usage token references: maxTokens → maxOutputTokens, promptTokens → inputTokens, completionTokens → outputTokens
- All AI routes now compatible with ai@4.1.10

✅ **Dashboard Logo Fix**
- Replaced broken dashboard logo SVG with HeartHandshake icon from lucide-react
- Consistent icon usage across navigation

✅ **Partner Management Implementation**
- Removed mock data from dashboard partner queries
- Implemented real Supabase partner profile lookups
- Added proper error handling for missing partner profiles
- Partner search now queries profiles table with real-time updates

✅ **Error Handling & Loading States**
- Added error.tsx to all route segments
- Added loading.tsx to all route segments
- Implemented graceful error recovery with user-friendly messages
- Loading skeletons match design system

✅ **Middleware & Auth Protection**
- Fixed middleware to properly protect authenticated routes
- Public routes: /, /auth/login, /auth/signup
- Protected routes: /dashboard, /alignment/*
- Proper redirects on auth state changes

## Next Steps

🔲 **End-to-End Browser Testing**
- Use Chrome DevTools MCP to test complete user flows
- Verify pixel-perfect design matching against page_design_templates
- Test accessibility (keyboard nav, screen readers, ARIA labels)
- Validate responsive layouts at mobile, tablet, desktop sizes
- Monitor performance (Core Web Vitals, network requests, console errors)

🔲 **Real Data Testing**
- Test partner invitation flow with real email addresses
- Verify alignment creation with two actual users
- Test full alignment workflow from setup → completion
- Validate real-time updates across multiple browser sessions
- Test AI API routes with actual Anthropic API calls

🔲 **Polish & Refinement**
- Address any visual deviations found during browser testing
- Fix accessibility issues discovered in DevTools snapshots
- Optimize performance based on Core Web Vitals measurements
- Add missing error states or edge case handling

🔲 **Deployment Preparation**
- Verify environment variables are correctly configured
- Test Vercel AI Gateway authentication (OIDC)
- Validate Supabase RLS policies with real multi-user data
- Create deployment checklist

---

---

## Technical Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Auth/Database:** Supabase
- **AI:** Vercel AI SDK (using Anthropic Claude)
- **Hosting:** Vercel
- **UI Components:** shadcn/ui (for consistent, professional UI)

---

## Design Source of Truth

- Every screen has a corresponding package under `page_design_templates/<theme>/<slug>/`.
- Each package contains `screen.png` (visual reference) and `code.html` (fully fleshed HTML + Tailwind config).
- When implementing a page/component:
1. Open the relevant `code.html`, compare its inline Tailwind config against `design-system/tailwind.preset.ts`, and copy only the truly unique overrides (new gradients, layout-specific utilities) into the preset or per-component styles.
  2. Break the HTML into React components (Hero, FlowVisualization, etc.) keeping the exact class names so the UI matches the mockup pixel-for-pixel.
  3. Mirror both dark/light variants by extracting shared structure and toggling Tailwind’s `dark` classes; use the PNGs to verify spacing/typography.
- Treat these files as the canonical design spec; any divergence should be reconciled by updating the source templates first.
- Shared Tailwind tokens + utilities now live in `design-system/tailwind.preset.ts` and `design-system/styles/design-system.css`. After scaffolding Next.js, import that preset via Tailwind’s `presets` option and include the CSS file in `app/globals.css` to get the same palettes, shadows, and helper classes used in the mocks.

---

## Implementation Strategy with Feature-Builder

**Overview:** This project uses a custom `feature-builder` sub-agent to implement all coding tasks autonomously. The orchestrator (Claude Code) delegates discrete features to feature-builder instances, receives structured completion reports, and synthesizes results without burning tokens on actual implementation.

### When to Use Feature-Builder

Delegate to feature-builder for:
- **Components** - Individual UI components (Hero, Card, Form, etc.)
- **Pages** - Complete route pages with data fetching
- **API Routes** - Backend endpoints with AI SDK integration
- **Database Queries** - Supabase client setup and RLS-aware queries
- **Integration Tasks** - Assembling multiple components into complete features

### Delegation Patterns

**1. Parallel Deployment** - Multiple independent feature-builders working simultaneously:
```
Example: Building homepage
- Feature-builder "Hero Harry" → Hero section
- Feature-builder "Flow Fiona" → Flow visualization
- Feature-builder "Stats Steve" → Stats section
- Feature-builder "Cases Cassie" → Use cases cards
All work in parallel, no dependencies
```

**2. Sequential Deployment** - Chained feature-builders where each builds on previous output:
```
Example: Authentication system
- Feature-builder "Auth Alex" → Login/signup pages
- Feature-builder "Policy Patty" → Test RLS with auth (waits for Alex)
- Feature-builder "Auth Auditor Andy" → Security review (waits for Patty)
```

**3. Parallel + Integration Pattern** - Build components in parallel, then integrate:
```
Example: Dashboard
- Parallel: AlignmentCard, PartnersList, SearchModal, StatusBadge components
- Sequential: Data layer hooks → Dashboard page assembly
```

### Task Specification Format

When delegating to feature-builder, provide:
1. **Spec References**: Line numbers from plan_a.md (e.g., "lines 684-709")
2. **Design Templates**: Path to design files in `page_design_templates/`
3. **Context**: Database schema references, existing patterns to follow
4. **Success Criteria**: Expected outputs, validation requirements

Example delegation:
```
Task: "Build Hero section component per plan_a.md lines 249-268 and design template at page_design_templates/dark_mode/ai_guided_conversations_homepage/human_alignment_homepage/. Component should support dark/light mode and match pixel-perfect styling."
```

### Expected Outputs

Feature-builder returns structured JSON reports containing:
- Files created/modified
- Dependencies added
- Validation results (TypeScript check, compilation)
- Blockers (if any)
- Next steps
- Testing instructions

### Mandatory Changelog Requirement

**Every feature-builder agent MUST create a changelog entry before reporting completion.**

Required steps:
1. **Create session changelog** in `/changelog/YYYY-MM-DD-HHMM-descriptive-keywords.md`
2. **Follow format** from `/changelog.md`:
   - Header with keywords, session info
   - What Changed, Why, How, Issues Encountered
   - Dependencies, Testing Notes, Next Steps
   - Impact Assessment, Lessons Learned
3. **Add summary entry** to `/changelog/README` with keywords and description
4. **Only then** report `status: "complete"`

Example changelog filename for "Hero Harry" agent:
- `/changelog/2025-11-10-1430-hero-section-component.md`
- Keywords: [COMPONENT] [HOMEPAGE] [UI] [TAILWIND]

This ensures complete audit trail and searchable history for all implemented features.

### Token Efficiency

**Without feature-builder**: ~300K tokens for full implementation (exceeds budget)
**With feature-builder**: ~35K tokens for orchestration (88% reduction)

Orchestrator only burns tokens on:
- Reading specifications (one-time)
- Launching agents (~500 tokens per delegation)
- Synthesizing results (~1K tokens per phase)
- Handling ambiguities/architectural decisions

### How to Invoke Feature-Builder

Use the Task tool with `subagent_type: "feature-builder"`:

```typescript
// Single agent
Task({
  subagent_type: "feature-builder",
  description: "Build Hero section component",
  prompt: `Build the Hero section component per plan_a.md lines 249-268.

  Design template: page_design_templates/dark_mode/ai_guided_conversations_homepage/human_alignment_homepage/

  Requirements:
  - Support dark/light mode
  - Match pixel-perfect styling from design template
  - Use Tailwind CSS with design system preset
  - Export as /components/homepage/Hero.tsx

  Return structured JSON completion report.`
})

// Parallel agents (multiple Task calls in single message)
Task({ subagent_type: "feature-builder", description: "Hero section", prompt: "..." })
Task({ subagent_type: "feature-builder", description: "Flow visualization", prompt: "..." })
Task({ subagent_type: "feature-builder", description: "Stats section", prompt: "..." })
```

The orchestrator then synthesizes completion reports and manages dependencies between phases.

---

## Chrome DevTools Validation Strategy

**Overview:** Feature-builders use Chrome DevTools MCP server to validate their implementations before reporting completion. This ensures pixel-perfect design matching, accessibility compliance, and performance standards.

### When Feature-Builders Use DevTools

**UI Components (Required):**
- Take snapshots to verify element structure and accessibility tree
- Take screenshots to compare against design templates
- Test dark/light mode variants
- Verify responsive layouts at multiple viewport sizes
- Check keyboard navigation and focus management
- Validate ARIA labels and screen reader compatibility

**Pages (Required):**
- Navigate to implemented page and verify it loads without errors
- Check console for warnings/errors
- Test user interactions (clicks, form fills, navigation)
- Verify network requests (API calls, correct endpoints)
- Measure Core Web Vitals (LCP, CLS, FID)

**API Routes (Optional):**
- Use network monitoring to verify request/response payloads
- Check response times and error handling

### DevTools Validation Workflow

**Step 1: Visual Verification**
```typescript
// 1. Start dev server
npm run dev

// 2. Navigate to page
navigate_page({ type: "url", url: "http://localhost:3000/page-path" })

// 3. Take snapshot for accessibility check
take_snapshot({ verbose: true })

// 4. Take screenshots for visual comparison
take_screenshot({ fullPage: true, format: "png" })

// 5. Test dark mode
evaluate_script({ function: "() => document.documentElement.classList.toggle('dark')" })
take_screenshot({ fullPage: true, format: "png", filePath: "./screenshots/dark-mode.png" })

// 6. Test responsive layouts
resize_page({ width: 375, height: 667 })  // Mobile
take_screenshot({ filePath: "./screenshots/mobile.png" })
resize_page({ width: 768, height: 1024 }) // Tablet
take_screenshot({ filePath: "./screenshots/tablet.png" })
resize_page({ width: 1920, height: 1080 }) // Desktop
take_screenshot({ filePath: "./screenshots/desktop.png" })
```

**Step 2: Accessibility Testing**
```typescript
// 1. Take accessibility snapshot
const snapshot = take_snapshot({ verbose: true })

// 2. Verify keyboard navigation
press_key({ key: "Tab" })  // Navigate through focusable elements
press_key({ key: "Enter" }) // Activate buttons
press_key({ key: "Escape" }) // Close modals

// 3. Check for accessibility issues in snapshot
// - Missing ARIA labels
// - Incorrect heading hierarchy
// - Missing alt text on images
// - Insufficient color contrast (if visible in snapshot)
```

**Step 3: Performance Validation**
```typescript
// 1. Start performance trace
performance_start_trace({ reload: true, autoStop: false })

// 2. Interact with page (click buttons, fill forms, etc.)
click({ uid: "button-uid" })
fill({ uid: "input-uid", value: "test data" })

// 3. Stop trace and get insights
performance_stop_trace()
// Review Core Web Vitals, LCP breakdown, layout shifts

// 4. Check network performance
const requests = list_network_requests({
  resourceTypes: ["fetch", "xhr"],
  pageSize: 20
})
// Verify API calls are efficient, no unnecessary requests
```

**Step 4: Console & Error Monitoring**
```typescript
// Check for console errors/warnings
const messages = list_console_messages({ types: ["error", "warn"] })
// Ensure no errors during normal operation
```

**Step 5: Interaction Testing**
```typescript
// Test user flows
fill_form({ elements: [
  { uid: "email-input", value: "test@example.com" },
  { uid: "password-input", value: "testpass123" }
]})
click({ uid: "submit-button" })
wait_for({ text: "Login successful" })

// Verify navigation works
click({ uid: "nav-link" })
wait_for({ text: "Expected page content" })
```

### DevTools Integration by Agent Type

**Component Builders** (Hero, Card, Form components):
- ✅ Snapshot for accessibility tree verification
- ✅ Screenshots for visual regression (compare to design templates)
- ✅ Dark/light mode screenshots
- ✅ Responsive screenshots (mobile, tablet, desktop)
- ✅ Keyboard navigation test
- ⚠️ Performance trace (optional for heavy components)

**Page Builders** (Homepage, Dashboard, Auth pages):
- ✅ All component builder checks PLUS:
- ✅ Full page performance trace with Core Web Vitals
- ✅ Network request monitoring
- ✅ Console error checking
- ✅ Complete user flow testing

**API Route Builders**:
- ✅ Network monitoring to verify endpoints
- ✅ Response payload validation
- ✅ Error handling verification
- ⚠️ Visual testing not applicable

**Integration/Assembly Agents** (Composer Carl, Dashboard Dave):
- ✅ All page builder checks
- ✅ Multi-page navigation testing
- ✅ State persistence across navigation
- ✅ Realtime update testing (if applicable)

**Review/Audit Agents** (Pixel-Perfect Petra, Auth Auditor Andy):
- ✅ Screenshot comparison against design templates
- ✅ Accessibility audit via snapshots
- ✅ Performance benchmarking
- ✅ Security testing (XSS, injection attempts)

### Validation Checklist Template

Feature-builders include this in their completion reports:

```json
{
  "devToolsValidation": {
    "visualRegression": {
      "screenshotsTaken": [
        "./screenshots/light-mode.png",
        "./screenshots/dark-mode.png",
        "./screenshots/mobile.png",
        "./screenshots/tablet.png",
        "./screenshots/desktop.png"
      ],
      "comparedAgainstDesign": true,
      "deviations": []
    },
    "accessibility": {
      "snapshotTaken": true,
      "keyboardNavigationTested": true,
      "ariaLabelsVerified": true,
      "issues": []
    },
    "performance": {
      "traceCompleted": true,
      "coreWebVitals": {
        "LCP": "1.2s",
        "CLS": "0.01",
        "FID": "< 100ms"
      },
      "issues": []
    },
    "console": {
      "errors": 0,
      "warnings": 0
    },
    "networkRequests": {
      "apiCallsVerified": true,
      "averageResponseTime": "< 200ms",
      "issues": []
    }
  }
}
```

### Screenshot Storage Convention

Store validation screenshots in:
- `/screenshots/validation/[agent-name]-[timestamp]/`
  - `light-mode.png`
  - `dark-mode.png`
  - `mobile-375w.png`
  - `tablet-768w.png`
  - `desktop-1920w.png`

Include paths in changelog for future reference.

### Performance Benchmarks

**Acceptable Thresholds:**
- **LCP (Largest Contentful Paint):** < 2.5s
- **CLS (Cumulative Layout Shift):** < 0.1
- **FID (First Input Delay):** < 100ms
- **API Response Time:** < 500ms (local dev)
- **Console Errors:** 0
- **Console Warnings:** < 5 (must document if present)

### Benefits of DevTools Integration

1. **Pixel-Perfect Verification** - Screenshots prove design template matching
2. **Accessibility Compliance** - Snapshots catch missing ARIA labels early
3. **Performance Accountability** - Core Web Vitals tracked for every page
4. **Visual Regression Prevention** - Compare before/after screenshots
5. **Responsive Design Validation** - Test all viewport sizes automatically
6. **Audit Trail** - Screenshots in changelog document implementation quality
7. **Faster Debugging** - Console monitoring catches errors immediately

---

## Environment Variables Needed

Create `.env.local` with placeholders:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key
```

**AI Gateway Authentication:**

For local development, set `AI_GATEWAY_API_KEY` in `.env.local`. When deployed to Vercel, authentication is handled automatically via OIDC.

To use OIDC locally, run `vercel env pull` to download tokens (note: tokens expire after 12 hours if not using `vercel dev`).

---

## Database Schema (Supabase)

**Status:** ✅ Deployed to production

All tables created via migrations in `supabase/migrations/`. See `context/supabase_cli.md` for detailed schema documentation.

### Core Tables (8)

**`profiles`** - User profiles linked to auth.users
- id (uuid, PK, references auth.users)
- display_name (text)
- created_at, updated_at (timestamptz)

**`partners`** - Partnership relationships
- id (uuid, PK)
- created_by (uuid, references auth.users)
- created_at, updated_at (timestamptz)

**`alignments`** - Alignment workflow instances
- id (uuid, PK)
- partner_id (uuid, references partners)
- status (text) - Validated state machine: `draft → active → analyzing → resolving → complete`
- current_round (int, default 1)
- title (text)
- created_by (uuid, references auth.users)
- created_at, updated_at (timestamptz)

**`alignment_participants`** - User-to-alignment membership
- id (uuid, PK)
- alignment_id (uuid, references alignments)
- user_id (uuid, references auth.users)
- role (text) - 'owner' or 'partner'
- created_at (timestamptz)
- UNIQUE(alignment_id, user_id)

**`templates`** - Reusable question sets
- id (uuid, PK)
- name (text)
- version (int, default 1)
- schema (jsonb) - Optional JSON Schema validation
- content (jsonb) - Question list and structure
- created_by (uuid, references auth.users)
- created_at, updated_at (timestamptz)

**`alignment_responses`** - Per-user answers per round
- id (uuid, PK)
- alignment_id (uuid, references alignments)
- user_id (uuid, references auth.users)
- round (int)
- response_version (int, default 1)
- answers (jsonb) - Structured as `{"response_version": 1, "answers": {...}, "metadata": {...}}`
- metadata (jsonb)
- submitted_at (timestamptz, nullable)
- created_at, updated_at (timestamptz)
- UNIQUE(alignment_id, user_id, round)
- **Realtime:** Broadcasts to `alignment:<alignment_id>:responses` on INSERT/UPDATE/DELETE

**`alignment_analyses`** - AI analysis results per round
- id (uuid, PK)
- alignment_id (uuid, references alignments)
- round (int)
- summary (jsonb) - Compact UI summary
- details (jsonb) - Full model output
- created_by (uuid, references auth.users, nullable)
- created_at (timestamptz)
- UNIQUE(alignment_id, round)

**`alignment_signatures`** - Digital signatures for finalized agreements
- id (uuid, PK)
- alignment_id (uuid, references alignments)
- user_id (uuid, references auth.users)
- round (int)
- canonical_snapshot (jsonb) - Frozen copy of signed content
- signature (text) - Hash or cryptographic signature
- created_at (timestamptz)
- UNIQUE(alignment_id, user_id, round)

### Security (RLS)

✅ All tables have Row-Level Security enabled
✅ Privacy-preserving policies:
- Users only see alignments where they're participants
- Partner responses hidden until both submit for current round
- Policies use `EXISTS` subqueries for performance
✅ Indexes on all RLS-referenced columns

### Performance

✅ Indexes on:
- All foreign keys
- RLS policy columns (user_id, alignment_id, round, status, submitted_at)
- JSONB columns (GIN index on answers using jsonb_path_ops)

### Triggers

✅ `updated_at` auto-update on all relevant tables
✅ State transition validation on `alignments.status`
✅ Realtime broadcast on `alignment_responses` changes

---

## Project Structure

```
/supabase                          ✅ COMPLETE
  /migrations/
    20251110051815_init_human_alignment.sql
    20251110052038_realtime_policies.sql
  config.toml                     # Project link config

/context                          ✅ COMPLETE
  /supabase_cli.md                # Full CLI documentation + best practices
  /examples/
    realtime-example.md           # Production-ready Next.js example

/app                              🔲 TODO
  /lib/
    supabase-browser.ts           # Browser client helper
    types.ts                      # TypeScript definitions
  /layout.tsx
  /page.tsx (homepage)
  /(auth)
    /login/page.tsx
    /signup/page.tsx
  /dashboard
    /page.tsx
    /layout.tsx
  /alignment
    /new/page.tsx
    /[id]
      /clarity/page.tsx
      /questions/page.tsx
      /analysis/page.tsx
      /resolution/page.tsx
      /document/page.tsx
      page.tsx                    # Realtime test page (from example)
  /api
    /alignment
      /create/route.ts
      /analyze/route.ts
      /generate-questions/route.ts
      /resolve-conflicts/route.ts
      /generate-document/route.ts
    /alignment-responses/
      route.ts                    # Test route (from example)
    /partners
      /search/route.ts
      /add/route.ts

/components                       🔲 TODO
  /ui (shadcn components)
  /homepage
    /Hero.tsx
    /AboutSection.tsx
    /FlowVisualization.tsx
    /UseCases.tsx
    /Testimonials.tsx
  /dashboard
    /AlignmentCard.tsx
    /PartnersList.tsx
  /alignment
    /TemplateSelector.tsx
    /ClarityForm.tsx
    /QuestionCard.tsx
    /AnalysisReport.tsx
    /ConflictResolution.tsx
    /AlignmentDocument.tsx
```

---

## Detailed Feature Implementation

### 1. Homepage (`/app/page.tsx`)

**Design Reference:** Use `page_design_templates/dark_mode/ai_guided_conversations_homepage/human_alignment_homepage/{screen.png,code.html}` and the matching light-mode folder as the canonical markup.

**Components needed:**
- Hero section with title "Human Alignment" and tagline
- About section explaining the concept
- Flow visualization with 5-step diagram (use Lucide React icons for steps)
- Stats section (placeholder numbers):
  - "89% Success Rate"
  - "Average 2.3 days to alignment"
  - "10,000+ agreements reached"
- Use cases cards:
  - "Business Partnerships"
  - "Cofounder Agreements"
  - "Living Arrangements"
  - "Strategic Decisions"
- Testimonials (3-4 fake but realistic ones)
- Login/Sign Up button (prominent CTA)

---

### 2. Authentication (`/app/(auth)/login` and `/signup`)

**Design Reference:**
- Login: `page_design_templates/{dark_mode,light_mode}/login_page_for_align_the_humans/*/{screen.png,code.html}`
- Signup: `page_design_templates/{dark_mode,light_mode}/signup_page_for_align_the_humans/*/{screen.png,code.html}`

Use Supabase Auth with email/password.
- Login page: email, password, "Forgot password?" link
- Signup page: username, email, password, confirm password
- After signup, create profile in `profiles` table
- Redirect to dashboard after successful auth

---

### 3. Dashboard (`/app/dashboard/page.tsx`)

**Design Reference:** `page_design_templates/{dark_mode,light_mode}/dashboard_current_alignments/*/{screen.png,code.html}`

**Layout:**

**Top Section: "Current Alignments"**
- Grid/list of alignment cards
- Each card shows:
  - Title
  - Description (truncated)
  - Status badge with color coding:
    - Waiting for Partner Response (yellow)
    - In Conflict Resolution (Round X) (orange)
    - Aligned - Awaiting Signatures (blue)
    - Complete (green)
    - Stalled (gray)
  - Progress bar (calculate based on status)
  - "Next steps" text
  - Click to view/continue

**Middle: "New Alignment" button**
- Large, prominent button
- Opens alignment creation flow

**Bottom: "Your Partners" section**
- List of partners you've aligned with
- Search bar (username or email)
- "Add Partner" button:
  - Opens modal with:
    - Search by username/email
    - OR manual entry (sends invite link)

**Data fetching:**
- Fetch alignments where user is participant
- Fetch partners from `partners` table
- Show loading states

---

### 4. Alignment Flow Part 1: Initiation (`/app/alignment/new/page.tsx`)

**Design Reference:** `page_design_templates/{dark_mode,light_mode}/start_new_alignment_flow/*/{screen.png,code.html}`

**UI:**
- "Start New Alignment" heading
- Two sections:

**Section 1: "Choose a Template"**
Grid of template cards:
1. **Operating Agreement** - "Comprehensive business partnership terms"
2. **Cofounder Equity Split** - "Negotiate equity and roles"
3. **Roommate Agreement** - "Living arrangement terms"
4. **Marketing Strategy** - "Align on marketing decisions"
5. **Business Operations** - "Day-to-day operational alignment"
6. **Custom** - "Describe your own alignment needs"

Each template card shows icon, title, description, "Select" button.

**Section 2: "Or Describe Your Own"**
- Text area for custom alignment description
- "Continue" button

**On selection:**
- Store template type
- Navigate to clarity page

---

### 5. Alignment Flow Part 2: Clarity Page (`/app/alignment/[id]/clarity/page.tsx`)

**Design Reference:** `page_design_templates/{dark_mode,light_mode}/define_alignment_clarity_page/*/{screen.png,code.html}`

**AI-Assisted Clarification Form:**

Show three sections (one at a time or all visible):

1. **What are you aligning over?**
   - Text area with user's input (pre-filled from template or custom)
   - AI suggestions below (call API endpoint that uses Claude to refine/clarify)
   - "Use suggestion" buttons

2. **Who are you aligning with?**
   - Partner search/selection
   - Can search existing partners or enter new email
   - If new email, sends invite link

3. **What's the desired result?**
   - Text area describing success criteria
   - AI provides suggestions for clarity

**Implementation:**
- Use Vercel AI SDK to call Claude for suggestions
- Store clarification data in alignment record
- "Continue" button navigates to questions page
- Send notification/invite to partner

---

### 6. Alignment Flow Part 3: Questions Page (`/app/alignment/[id]/questions/page.tsx`)

**Design Reference:** `page_design_templates/{dark_mode,light_mode}/alignment_questionnaire_financial_goal/*/{screen.png,code.html}`

**Dynamic Q&A Interface:**

Based on template type and clarity, generate appropriate questions.

**Question types to support:**
- Text input (short answer)
- Text area (long answer)
- Multiple choice (radio buttons)
- Checkboxes (multiple selections)
- Number input
- Range slider

**AI Features per question:**
- "Explain this question" button (shows AI explanation)
- "Show examples" button (AI provides relevant examples)
- "Get suggestions" button (AI suggests answers based on context)

**Templates for questions:**

Even though the UI references starter categories (Operating Agreement, Roommate Agreement, etc.), the long-term experience is AI-first:

1. Capture intent on the clarity page (problem description, partners, desired outcome).
2. Send that structured intent plus any chosen seed template to the AI to generate a bespoke question set.
3. Validate the AI output against a strict schema before rendering it in the UI.

```typescript
type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'multiple_choice'
  | 'checkbox'
  | 'number'
  | 'scale';

interface AlignmentQuestion {
  id: string; // slug, e.g., "equity_split_ratio"
  prompt: string;
  description?: string;
  type: QuestionType;
  required: boolean;
  options?: Array<{ id: string; label: string }>; // for choice/scale types
  followUps?: AlignmentQuestion[];               // optional nested questions
  aiHints?: {
    explainPrompt?: string;     // seed text for "Explain this"
    examplePrompt?: string;     // seed text for "Show examples"
    suggestionPrompt?: string;  // seed text for "Get suggestions"
  };
  metadata?: Record<string, any>; // category tags, round, etc.
}
```

The generator endpoint returns `AlignmentQuestion[]`. A Zod validator enforces this shape before persisting.

**Persisting generated templates:**

- Store every AI-produced template in Supabase so both partners answer the same list. Either reuse `templates` (with `content` holding the array) or add an `alignment_templates` table keyed to `alignment_id` + `version`.
- Sanitize stored templates (strip names/emails, swap sensitive specifics with placeholders) and flag reusable ones as `is_public`. High-quality sanitized templates become few-shot exemplars and backup options if generation fails.
- Version everything: if the user edits or regenerates questions mid-flow, append a new version so history/audit is preserved.

**Fallback library:** keep a small set of hand-authored templates in `/lib/templates.ts` for demos, offline testing, and as few-shot context for the AI when generating bespoke templates.

**Monitoring & tuning loop:**

- Log every generated template (prompt, question count, validation results, completion rates) so we can spot weak outputs quickly.
- Give users lightweight feedback controls (thumbs up/down, "question unclear" flags) that feed a review queue.
- Periodically mine the best-performing sanitized templates and feed them back into the AI prompt as few-shot examples.
- Auto-regenerate or fall back to curated templates when validation fails (missing required fields, duplicate IDs, etc.).

**Flow:**
- Load questions based on template/AI output
- User answers all questions
- Progress indicator shows completion
- Save responses to `alignment_responses` table
- "Submit Responses" button
- After submit, show confirmation: "Your responses are saved. Waiting for [partner name] to complete theirs."
- Update alignment status to `active` and rely on the derived `ui_status = 'waiting_partner'` mapping described in `context/supabase_cli.md`

---

### 7. Alignment Flow Part 4: Analyzer (`/app/alignment/[id]/analysis/page.tsx`)

**Design Reference:** `page_design_templates/{dark_mode,light_mode}/cofounder_agreement_report/*/{screen.png,code.html}`

**Trigger:** Automatically runs when BOTH users have submitted responses for current round.

**Backend Analysis (`/api/alignment/analyze/route.ts`):**

Use Claude to analyze both responses:

```typescript
// Pseudo-code for analysis
import { generateObject } from 'ai';
import { z } from 'zod';

const analysisSchema = z.object({
  alignedItems: z.array(z.string()),
  conflicts: z.array(z.object({
    severity: z.enum(['critical', 'moderate', 'minor']),
    topic: z.string(),
    personA_position: z.string(),
    personB_position: z.string(),
    suggestions: z.array(z.string())
  })),
  hiddenAssumptions: z.array(z.string()),
  gaps: z.array(z.string()),
  imbalances: z.array(z.string())
});

const prompt = `
You are analyzing two people's responses to alignment questions.

Person A's responses: ${JSON.stringify(responseA)}
Person B's responses: ${JSON.stringify(responseB)}

Analyze and provide:
1. ALIGNED ITEMS: Where they completely agree (be specific)
2. CONFLICTS: Where they disagree (with severity: critical, moderate, minor)
3. HIDDEN ASSUMPTIONS: Things one person assumes that the other hasn't addressed
4. GAPS: Important topics neither person addressed
5. IMBALANCES: Structural issues that could cause problems
`;

// Use Vercel AI SDK Gateway to call Claude
const { object: analysis } = await generateObject({
  model: 'anthropic/claude-sonnet-4.5',
  schema: analysisSchema,
  prompt
});
```

**Frontend Display:**

Show analysis report with sections:

**✅ Aligned (Build Momentum)**
- List of items where they agree
- Green checkmarks, positive messaging

**⚠️ Conflicts Requiring Resolution**
- Categorized by severity (critical first)
- For each conflict:
  - Show both positions
  - AI explanation of the conflict
  - Suggested compromises
  - Examples of how others resolved it

**🔍 Hidden Assumptions**
- Things one person assumes but other hasn't confirmed
- Need explicit discussion

**📋 Gaps**
- Important topics neither addressed
- AI explains why these matter

**⚖️ Imbalances**
- Structural issues detected
- Fairness concerns

**Buttons:**
- If fully aligned: "Generate Final Document"
- If conflicts exist: "Resolve Conflicts" (goes to Part 5)

Store analysis in `alignment_analyses` table.

---

### 8. Alignment Flow Part 5: Conflict Resolution (`/app/alignment/[id]/resolution/page.tsx`)

**Design Reference:** `page_design_templates/{dark_mode,light_mode}/conflict_resolution_office_location/*/{screen.png,code.html}`

**UI Structure:**

For each conflict/gap from analysis, show resolution interface:

**Conflict Card:**
- **Conflict Title:** e.g., "Equity Split"
- **Your Position:** "60/40 split"
- **Partner's Position:** "50/50 split"
- **Why This Matters:** AI explanation
- **Resolution Options:**
  - Radio buttons for AI-suggested compromises (3-4 options)
  - "Accept my position" button
  - "Accept partner's position" button
  - "Custom solution" text area
- **AI Assistance:**
  - "Show examples" - real-world solutions
  - "Show implications" - what each choice means
  - "Suggest middle ground" - AI generates new options

**Implementation:**
- User works through all conflicts
- Can save progress
- Submit when complete
- Partner gets notified to complete their resolution round
- After both submit, run analyzer again (increment round number)

**Loop Logic:**
- If analyzer shows full alignment → Generate document
- If still conflicts → Another resolution round
- Track rounds to detect stalling (e.g., after 5 rounds, flag as "stalled")

---

### 9. Final Document (`/app/alignment/[id]/document/page.tsx`)

**Design Reference:** `page_design_templates/{dark_mode,light_mode}/final_document_page_for_align_the_humans/*/{screen.png,code.html}`

**Structure:**

**Top Section: Executive Summary**
- Alignment title
- Date completed
- Participants
- Key terms at a glance (bullet points)
- Success message: "You've reached alignment!"

**Middle Section: Full Agreement Document**
- Well-formatted document with sections
- Generated by AI based on final aligned positions
- Organized by categories (equity, governance, operations, etc.)
- Professional language
- Include reasoning where helpful

**Example structure:**
```
ALIGNMENT AGREEMENT

Between: [Person A] and [Person B]
Date: [Date]
Subject: [Alignment Topic]

EXECUTIVE SUMMARY
- Equity: 60/40 split reflecting capital contributions
- Decision Making: Tiered system with $10K threshold
- Revenue: Quarterly distributions with 30% reinvestment
[... more key points]

DETAILED TERMS

1. EQUITY & OWNERSHIP
[Generated content based on responses]

2. CAPITAL CONTRIBUTIONS
[Generated content]

3. DECISION MAKING & GOVERNANCE
[Generated content]

[... more sections]
```

**Bottom Section: Actions**

**If not yet signed:**
- Digital signature interface for each user
- "I agree to these terms" checkbox
- "Sign Agreement" button
- Status: "Waiting for [partner] to sign"

**Once both signed:**
- Timestamps for both signatures
- "Download Agreement" button (generates PDF)
- "Share Link" button (shareable URL)
- Status badge: "Complete ✓"

**API Endpoint for Document Generation:**
`/api/alignment/generate-document/route.ts`

Use Claude to generate the document:
```typescript
const prompt = `
Generate a professional alignment agreement document.

Context:
- Template type: ${alignment.template_type}
- Participants: ${participants}
- Aligned positions: ${JSON.stringify(finalPositions)}

Create a well-structured document with:
1. Executive summary (3-5 bullet points)
2. Detailed terms organized by category
3. Professional but readable language
4. Include reasoning where helpful

Format as HTML for web display.
`;
```

---

## AI Integration Details

### API Contracts & Payloads

Each AI endpoint is an App Router route (`route.ts`). All requests are `POST` with `Content-Type: application/json`. Successful responses return `200` with a `data` payload; failures return the same envelope with an `error` object `{ code, message, details? }`.

**1. `/api/alignment/generate-questions/route.ts`**
- **Request body:**
  ```json
  {
    "alignmentId": "uuid",
    "templateSeed": "operating_agreement" | "custom",
    "clarity": {
      "topic": "string",
      "participants": ["person a", "person b"],
      "desiredOutcome": "string"
    },
    "seedTemplateId": "uuid | null"
  }
  ```
- **Response body:**
  ```json
  {
    "data": {
      "templateId": "uuid",
      "version": 1,
      "source": { "type": "ai", "model": "anthropic/claude-haiku-4.5" },
      "questions": AlignmentQuestion[]
    }
  }
  ```
- **Failure modes:** `400` invalid clarity payload, `422` schema validation failed, `502` AI generation error → fall back to curated template.

**2. `/api/alignment/analyze/route.ts`**
- **Request body:**
  ```json
  {
    "alignmentId": "uuid",
    "round": 1,
    "responses": [
      { "userId": "uuid", "answers": { "q1": {"value": "..."} } },
      { "userId": "uuid", "answers": { "q1": {"value": "..."} } }
    ]
  }
  ```
- **Response body:**
  ```json
  {
    "data": {
      "analysis": {
        "alignedItems": string[],
        "conflicts": [{
          "id": "conflict_equity",
          "topic": "Equity Split",
          "severity": "critical",
          "personA_position": "60/40",
          "personB_position": "50/50",
          "suggestions": string[]
        }],
        "hiddenAssumptions": string[],
        "gaps": string[],
        "imbalances": string[]
      }
    }
  }
  ```
- **Failure modes:** `409` if not all participants submitted, `502` AI analysis error (surface message + allow retry).

**3. `/api/alignment/resolve-conflicts/route.ts`**
- **Request body:**
  ```json
  {
    "alignmentId": "uuid",
    "conflict": {
      "topic": "Office location",
      "personA": "Remote-first",
      "personB": "Hybrid in NYC",
      "constraints": ["budget <= 5k", "team of 12"]
    }
  }
  ```
- **Response body:**
  ```json
  {
    "data": {
      "options": [
        {
          "id": "compromise_1",
          "summary": "Hybrid with quarterly in-person weeks",
          "pros": string[],
          "cons": string[],
          "nextSteps": string[]
        }
      ],
      "implications": string[],
      "examples": string[]
    }
  }
  ```

**4. `/api/alignment/generate-document/route.ts`**
- **Request body:**
  ```json
  {
    "alignmentId": "uuid",
    "templateId": "uuid",
    "finalPositions": {
      "equity": "60/40",
      "governance": "Tiered voting"
    },
    "participants": ["Alice", "Bob"],
    "summary": ["Key bullet 1", "Key bullet 2"]
  }
  ```
- **Response body:**
  ```json
  {
    "data": {
      "documentHtml": "<article>...</article>",
      "sections": [
        { "id": "equity", "heading": "Equity & Ownership", "body": "..." }
      ]
    }
  }
  ```

**5. `/api/alignment/get-suggestion/route.ts`**
- **Request body:**
  ```json
  {
    "question": AlignmentQuestion,
    "currentAnswer": "string | null",
    "mode": "explain" | "examples" | "suggest",
    "alignmentContext": { "topic": "...", "round": 1 }
  }
  ```
- **Response body:**
  ```json
  {
    "data": {
      "text": "Model response",
      "confidence": 0.87
    }
  }
  ```

Across endpoints, wrap Supabase writes in transactions where needed, and emit telemetry (`event`, `alignmentId`, `latencyMs`, `model`) for the monitoring loop described earlier to keep the overall experience consistent with the app’s goals.

### Vercel AI SDK Gateway Implementation:

**Important:** Use Vercel AI SDK with AI Gateway routing. Authentication is handled via `AI_GATEWAY_API_KEY` environment variable (development) or OIDC (Vercel deployments) or BYOK (team settings).

```typescript
import { generateObject, generateText, streamText } from 'ai';
import { z } from 'zod';

// Example 1: Structured output with generateObject
export async function analyzeAlignment(responseA, responseB) {
  const { object } = await generateObject({
    model: 'anthropic/claude-sonnet-4.5', // AI Gateway string format
    schema: z.object({
      alignedItems: z.array(z.string()),
      conflicts: z.array(z.object({
        severity: z.enum(['critical', 'moderate', 'minor']),
        topic: z.string(),
        personA_position: z.string(),
        personB_position: z.string(),
        suggestions: z.array(z.string())
      })),
      // ... more fields
    }),
    prompt: createAnalysisPrompt(responseA, responseB)
  });

  return object;
}

// Example 2: Streaming responses (for real-time UI updates)
export async function generateSuggestions(context: string) {
  const result = await streamText({
    model: 'anthropic/claude-sonnet-4.5',
    prompt: `Provide suggestions for: ${context}`
  });

  return result.toDataStreamResponse();
}

// Example 3: Simple text generation
export async function getClarification(description: string) {
  const { text } = await generateText({
    model: 'anthropic/claude-haiku-4.5', // Use Haiku for faster/cheaper operations
    prompt: `Clarify and refine this alignment description: ${description}`
  });

  return text;
}
```

**Model Selection Guide:**
- `anthropic/claude-sonnet-4.5` - Complex analysis, conflict resolution, document generation
- `anthropic/claude-haiku-4.5` - Quick suggestions, clarifications, simple Q&A
- `anthropic/claude-opus-4.1` - Specialized reasoning tasks (if needed)

**Authentication Setup:**
- Development: Set `AI_GATEWAY_API_KEY` in `.env.local`
- Vercel Deployment: OIDC automatically handled (no manual configuration)

---

## UI/UX Guidelines

**Design References:** All visual designs are available in `/page_design_templates/` with both dark_mode and light_mode variants. Reference these templates for:
- Layout structure and component positioning
- Color schemes and theming
- Typography and spacing
- Interactive element styling
- Overall visual hierarchy

**Design System:**
- Use shadcn/ui components for consistency
- Implement both light and dark mode support (see template variants)
- Typography: Clean, readable fonts
- Spacing: Generous whitespace
- Animations: Subtle, smooth transitions

**Key UX Principles:**
- Clear progress indicators
- Helpful empty states
- Loading states for AI operations
- Error handling with friendly messages
- Responsive design (mobile-friendly)
- Accessibility (keyboard navigation, ARIA labels)

**Status Badges:**
Use Supabase’s canonical statuses (`draft`, `active`, `analyzing`, `resolving`, `complete`) plus the derived UI badges documented in `context/supabase_cli.md`. The view `alignment_status_view` emits `ui_status`, so the UI only needs to style those values:

```typescript
const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  active: 'bg-indigo-100 text-indigo-800',
  analyzing: 'bg-purple-100 text-purple-800',
  resolving: 'bg-orange-100 text-orange-800',
  complete: 'bg-green-100 text-green-800',
  waiting_partner: 'bg-yellow-100 text-yellow-800',
  in_conflict_resolution: 'bg-orange-100 text-orange-800',
  aligned_awaiting_signatures: 'bg-blue-100 text-blue-800',
  stalled: 'bg-gray-100 text-gray-800'
};
```

---

## Additional Features to Implement

### Notifications
- Email notifications when partner completes action
- In-app notifications for alignment updates
- Use Supabase Realtime for live updates (optional enhancement)

### Partner Invite System
- Generate unique invite links
- Store pending invitations
- Auto-add to partners list when invite accepted

### Progress Persistence
- Auto-save form responses
- Allow users to exit and return
- Show "Last saved" timestamp

### Validation
- Validate all form inputs
- Ensure both users complete responses before analysis
- Prevent duplicate alignments

### Error Handling
- Graceful API error handling
- User-friendly error messages
- Retry mechanisms for AI failures

---

## Testing Checklist

Before considering complete, test:

✅ User signup and login  
✅ Create alignment with template  
✅ Create alignment with custom description  
✅ Clarity page AI suggestions work  
✅ Questions page loads correct template  
✅ AI explanations and suggestions work  
✅ Response submission and storage  
✅ Partner invitation and joining  
✅ Both users can submit responses  
✅ Analyzer runs automatically  
✅ Analysis report displays correctly  
✅ Conflict resolution interface works  
✅ Multiple resolution rounds loop correctly  
✅ Final document generation  
✅ Digital signatures  
✅ PDF download  
✅ Dashboard shows correct statuses  
✅ Partner search and add  
✅ All responsive layouts work  

---

## Deployment Notes

**Vercel:**
- Deploy from GitHub repo
- Add environment variables in Vercel dashboard:
  - Supabase: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- AI Gateway authentication is handled automatically via OIDC on Vercel deployments

**Supabase:**
- Create tables using SQL editor
- Set up Row Level Security (RLS) policies
- Enable email auth

**Post-Deployment:**
- Test production environment
- Verify AI endpoints work
- Check database connections
- Test invite emails

---

## Future Enhancements (Not in Prototype)

- Multiple participant support (>2 users)
- Version history for alignments
- Alignment templates marketplace
- Integration with DocuSign for legal signatures
- AI chat assistant during resolution
- Analytics dashboard
- Team/organization accounts
- Custom branding options

---

## Start Building with Feature-Builder!

**Implementation Approach:** Delegate all coding tasks to feature-builder sub-agents. Orchestrator focuses on planning, delegation, and synthesis.

### Phase 1: Project Initialization (Parallel)
Delegate to 4 parallel feature-builders:
1. **"Scaffolder Sally"** - Initialize Next.js project with TypeScript, Tailwind, folder structure
2. **"Schema Sam"** - Create TypeScript types, Supabase client helpers, type guards
3. **"Config Connie"** - Set up environment variables, error handling utilities, telemetry
4. **"Design Danny"** - Install shadcn/ui components, configure design system preset

### Phase 2: Authentication (Sequential)
Delegate to 3 sequential feature-builders:
1. **"Auth Alex"** - Build login/signup pages per design templates (lines 271-282)
2. **"Policy Patty"** - Test RLS policies work with auth, verify isolation
3. **"Auth Auditor Andy"** - Security review, accessibility check, error handling polish

### Phase 3: Homepage (Parallel + Integration)
Delegate to 6 parallel feature-builders for components:
1. **"Hero Harry"** - Hero section (lines 249-268)
2. **"Flow Fiona"** - 5-step flow visualization
3. **"Stats Steve"** - Stats section with placeholder numbers
4. **"Cases Cassie"** - Use cases cards
5. **"Testimonial Tina"** - Testimonials section
6. **"CTA Charlie"** - Login/signup CTA buttons

Then delegate to sequential integrators:
7. **"Composer Carl"** - Assemble components into `/app/page.tsx`
8. **"Pixel-Perfect Petra"** - Verify against design templates

### Phase 4: Dashboard (Parallel + Sequential Hybrid)
Parallel component builders (4 agents):
1. **"Card Kevin"** - AlignmentCard component
2. **"Partner Paula"** - PartnersList component
3. **"Search Sarah"** - Partner search/add modal
4. **"Status Stan"** - Status badge component (lines 913-926)

Sequential data & integration (2 agents):
5. **"Query Quinn"** - Build Supabase query hooks
6. **"Dashboard Dave"** - Assemble dashboard page with data wiring

### Phase 5: Alignment Flow (Massive Parallel)
**Wave 1** - API Endpoints (5 parallel agents):
1. **"Question Generator Quinn"** - `/api/alignment/generate-questions/route.ts` (lines 684-709)
2. **"Analyzer Annie"** - `/api/alignment/analyze/route.ts` (lines 711-744)
3. **"Resolver Rick"** - `/api/alignment/resolve-conflicts/route.ts` (lines 747-776)
4. **"Document Doug"** - `/api/alignment/generate-document/route.ts` (lines 778-802)
5. **"Suggestion Susie"** - `/api/alignment/get-suggestion/route.ts` (lines 804-823)

**Wave 2** - Frontend Pages (5 parallel agents, wait for Wave 1):
6. **"New Alignment Nancy"** - `/app/alignment/new/page.tsx` (lines 324-351)
7. **"Clarity Chloe"** - `/app/alignment/[id]/clarity/page.tsx` (lines 353-381)
8. **"Questions Quincy"** - `/app/alignment/[id]/questions/page.tsx` (lines 383-464)
9. **"Analysis Ava"** - `/app/alignment/[id]/analysis/page.tsx` (lines 467-550)
10. **"Resolution Ruby"** - `/app/alignment/[id]/resolution/page.tsx` (lines 553-588)

**Wave 3** - Components & Polish (5 parallel agents, wait for Wave 2):
11. **"Template Tara"** - TemplateSelector component
12. **"Question Card Quinn"** - QuestionCard with AI assistance UI
13. **"Analysis Report Ron"** - AnalysisReport with severity styling
14. **"Conflict Card Cara"** - ConflictResolution component
15. **"Document Viewer Vince"** - AlignmentDocument with signature UI

### Phase 6: Integration Testing (Parallel)
Delegate to 6 parallel test agents:
1. **"Signup Tester Theo"** - Test signup → dashboard flow
2. **"Template Tester Tess"** - Test template-based alignment
3. **"Custom Tester Carl"** - Test custom alignment
4. **"Analysis Tester Amy"** - Test response → analysis flow
5. **"Resolution Tester Ray"** - Test multi-round resolution
6. **"Signature Tester Sasha"** - Test document → signature flow

### Phase 7: Bug Fixes (Dynamic Parallel)
Based on test results, delegate N parallel feature-builders (one per bug) for targeted fixes.

### Phase 8: Deployment
Final verification and deploy to Vercel.

---

**Token Budget:** ~35K for orchestration (vs. 300K+ for manual implementation)
**This is a prototype.** Focus on functionality over polish. Get the core alignment flow working first, then refine UI/UX.
