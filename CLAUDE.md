# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Human Alignment** is a Next.js web application designed to facilitate mutual agreement between partners through AI-guided structured conversations. The application enables two parties to independently answer questions about a topic, then uses Claude AI to analyze responses, identify conflicts, and guide iterative resolution toward consensus.

**Current Status:** Pre-implementation planning phase. All architectural documentation exists, but no source code has been written yet.

## Project Architecture

### Planned Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Backend:** Supabase (PostgreSQL with Row-Level Security)
- **AI Integration:** Vercel AI SDK with Anthropic Claude (Sonnet 4.5)
- **Hosting:** Vercel

### Database Schema
The application is designed around 8 core tables:
- `profiles` - User accounts and metadata
- `alignments` - Main alignment sessions with status tracking
- `alignment_participants` - Links users to alignments with roles
- `alignment_responses` - Individual answers to questions
- `alignment_analyses` - AI analysis results for each alignment round
- `alignment_signatures` - Digital signatures for finalized agreements
- `partners` - Ongoing partner relationships
- `templates` - Pre-configured alignment question sets

### Application Flow (5-Phase Workflow)
1. **Setup** - Partner selection and template choice
2. **Clarification** - AI-assisted form customization
3. **Answering** - Independent question responses
4. **Analysis** - AI comparison and conflict detection
5. **Resolution** - Iterative negotiation with AI guidance

### Key Directories

**`/` (Project Root)** - Main specification
- **`plan_a.md`** - **PRIMARY SPECIFICATION** (1471 lines) - Lives in ROOT directory, NOT in /context/
  - Complete technical specification with implementation strategy
  - Feature-builder delegation patterns and workflows
  - Chrome DevTools validation requirements
  - Detailed page/component/API specifications
  - **ALWAYS read this file from the root directory when starting implementation**

**`/context/`** - Supporting documentation
- `supabase_cli.md` - Complete database schema and CLI documentation
- `model-integrations.md` - Claude API reference and pricing
- `claude-web-capabilities.md` - Guide for using Claude Code Web
- `examples/realtime-example.md` - Production-ready Next.js realtime patterns

**`/changelog/`** - Session-based development logs
- Each session gets its own markdown file: `YYYY-MM-DD-HHMM-descriptive-keywords.md`
- See `changelog.md` for format requirements

### Page Structure (Planned)
```
/app
├── page.tsx                      # Homepage with hero, use cases, stats
├── auth/
│   ├── login/page.tsx
│   └── signup/page.tsx
├── dashboard/page.tsx            # User dashboard showing alignments
├── alignment/
│   ├── new/page.tsx              # Create new alignment
│   └── [id]/
│       ├── setup/page.tsx        # Phase 1: Configuration
│       ├── clarify/page.tsx      # Phase 2: AI clarification
│       ├── answer/page.tsx       # Phase 3: Question responses
│       ├── analyze/page.tsx      # Phase 4: AI analysis
│       ├── resolve/page.tsx      # Phase 5: Conflict resolution
│       └── complete/page.tsx     # Final agreement + signatures
└── api/
    └── ai/
        ├── clarify/route.ts      # AI form customization
        ├── analyze/route.ts      # AI response comparison
        ├── suggest/route.ts      # AI compromise suggestions
        └── generate/route.ts     # AI document generation
```

## Development Commands

**Note:** Project is not yet initialized. Once implemented, standard Next.js commands will apply:

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Type checking
npm run type-check  # (if configured)

# Linting
npm run lint
```

## AI Integration Points

The application uses Vercel AI SDK (`ai` package) to integrate with Claude:

**Primary Model:** `claude-sonnet-4-5-20250929`
- Context window: 200K tokens (1M with extended beta)
- Supports streaming responses
- Prompt caching enabled for cost optimization

**Key AI Capabilities Required:**
1. **Question Generation** - Create follow-up questions based on user context
2. **Response Analysis** - Compare partner answers and detect conflicts
3. **Conflict Resolution** - Suggest compromises and guide negotiation
4. **Document Generation** - Synthesize final agreements from resolved responses

Reference `/context/model-integrations.md` for complete API details and pricing.

## Implementation Guidelines

### Starting Development
1. Initialize Next.js project with TypeScript template
2. Install core dependencies: `@supabase/supabase-js`, `ai`, `@ai-sdk/anthropic`, `tailwindcss`, `shadcn/ui`
3. Create Supabase project and run schema from `/context/plan_a.md` (lines 200-400)
4. Configure environment variables for Supabase and Anthropic API
5. Set up authentication pages first (login/signup)
6. Build homepage, then dashboard
7. Implement alignment flow phases sequentially

### Database Conventions
- Use Supabase client for all database operations
- Enable Row-Level Security (RLS) policies on all tables
- Use `auth.uid()` in RLS policies to enforce user permissions
- Store timestamps in `timestamptz` format

### AI API Best Practices
- Always use streaming responses for better UX (`streamText` from Vercel AI SDK)
- Implement prompt caching for repeated contexts
- Structure prompts with clear roles: system, user, assistant
- Include conversation history for context in multi-round resolutions
- Set temperature low (0.3-0.5) for analytical tasks, higher (0.7-0.9) for creative suggestions

### Component Architecture
- Use Server Components by default
- Client Components only when needed (forms, interactive UI)
- Implement loading.tsx and error.tsx for each route segment
- Use shadcn/ui components consistently

## Changelog Requirements

Every development session must create a changelog entry in `/changelog/` following this format:

**Filename:** `YYYY-MM-DD-HHMM-descriptive-keywords.md`

**Required Sections:**
- What Changed
- Why
- How
- Issues Encountered
- Dependencies Added/Changed
- Testing Performed
- Next Steps
- Keywords (for searchability)

See `/changelog.md` for complete format specification.

## Critical References

When implementing features, **always consult** `/plan_a.md` (in the ROOT directory) first. It contains:
- Complete database schema with field types
- Detailed UI descriptions for every page
- State management specifications
- API endpoint contracts
- Security considerations
- Error handling patterns

## Authentication & Security

- Use Supabase Auth with email/password (email verification required)
- Implement RLS policies to ensure users can only access their own data
- Validate alignment participation before showing sensitive responses
- Never expose one partner's responses to the other before "analyze" phase
- Sanitize AI-generated content before rendering to prevent XSS

## Testing Strategy (When Implemented)

- Unit tests for utility functions and AI prompt builders
- Integration tests for API routes
- End-to-end tests for critical flows (alignment creation → completion)
- Test AI responses with mock data to avoid API costs during testing

## Common Pitfalls to Avoid

1. **Don't expose partner responses prematurely** - Responses should only be shared after both partners complete answering
2. **Handle AI streaming errors gracefully** - Network issues or rate limits can interrupt streams
3. **Validate alignment status transitions** - Enforce state machine rules (can't skip from "answering" to "complete")
4. **Implement proper loading states** - AI operations can take 5-30 seconds
5. **Cache expensive AI operations** - Use Vercel KV or similar for analysis results

## Status Tracking

Alignments use a strict status state machine:
```
draft → active → answering → analyzing → resolving → complete → cancelled
```

Only valid transitions are allowed. See database schema for status enum definition.

## Template System

Pre-configured templates in the `templates` table define question sets for common scenarios:
- Operating Agreement
- Cofounder Equity
- Relationship Boundaries
- Parenting Plan
- Business Partnership
- Living Arrangements

Templates include question text, types (text, scale, choice, ranking), and AI prompts for context-aware follow-ups.
