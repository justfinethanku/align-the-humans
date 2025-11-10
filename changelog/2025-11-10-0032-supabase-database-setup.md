# Changelog: 2025-11-10-0032 - Supabase Database Setup

**Date:** November 10, 2025, 00:32
**Session Duration:** ~2 hours
**Keywords:** [DATABASE] [SUPABASE] [RLS] [MIGRATIONS] [REALTIME] [INFRASTRUCTURE] [SETUP] [SCHEMA]

---

## What Changed

### 1. Supabase CLI Installation and Configuration
- Installed Supabase CLI as local dev dependency (`npm i supabase --save-dev`)
- Authenticated CLI with Supabase account
- Linked project to remote Supabase instance (ref: `qvzfcezbuzmvglgiolmh`)
- Created and configured `/supabase` directory structure

### 2. Database Schema Implementation
Created comprehensive database schema with 8 core tables:
- **profiles** - User profiles linked to auth.users
- **partners** - Partnership relationships
- **alignments** - Alignment workflow instances with state machine
- **alignment_participants** - User-to-alignment membership
- **templates** - Reusable question sets
- **alignment_responses** - Per-user answers per round with JSONB storage
- **alignment_analyses** - AI analysis results
- **alignment_signatures** - Digital signatures for finalized agreements

### 3. Security & Performance
- **Row-Level Security (RLS)** enabled on all tables
- Privacy-preserving policies ensuring:
  - Users only see alignments where they're participants
  - Partner responses hidden until both submit for current round
  - Policies use `EXISTS` subqueries for optimal performance
- **Performance indexes** on:
  - All foreign keys
  - RLS policy columns (user_id, alignment_id, round, status, submitted_at)
  - JSONB columns using GIN index with jsonb_path_ops

### 4. Database Triggers
- **Auto-updating `updated_at`** on all relevant tables
- **State transition validation** on `alignments.status`:
  - Enforces valid state machine: `draft → active → analyzing → resolving → complete`
  - Prevents invalid status jumps
- **Realtime broadcast trigger** on `alignment_responses`:
  - Automatically broadcasts to `alignment:<alignment_id>:responses` on INSERT/UPDATE/DELETE
  - Uses `realtime.broadcast_changes()` for event propagation

### 5. Realtime Collaboration Setup
- RLS policies on `realtime.messages` table for participant-only access
- Two topic patterns:
  - `alignment:<alignment_id>:responses` - Response changes
  - `alignment:<alignment_id>:events` - General events
- Private channel enforcement with authentication

### 6. Documentation
Created comprehensive documentation:
- **`context/supabase_cli.md`** - Complete CLI reference including:
  - Setup and installation guide
  - Local database commands
  - Migration workflow
  - Remote deployment process
  - Edge Functions usage
  - Project-specific best practices (JSONB structure, RLS patterns, indexes, state machines)
  - Next.js integration checklist
  - Testing guidelines
- **`context/examples/realtime-example.md`** - Production-ready Next.js reference implementation with:
  - Complete authentication flow
  - Private channel subscription
  - Server route handler with RLS
  - Live event display
  - TypeScript types
  - Error handling and cleanup

### 7. Migrations Deployed
- `supabase/migrations/20251110051815_init_human_alignment.sql` - Core schema
- `supabase/migrations/20251110052038_realtime_policies.sql` - Realtime RLS
- Both successfully pushed to production database

### 8. Plan Documentation Updates
Updated `plan_a.md` to reflect:
- Implementation status section
- Completed database setup
- Deployed migrations
- Reference implementation availability
- Updated project structure showing completed vs. TODO items

### 9. Environment Configuration
- Created `.env.local` with actual Supabase credentials
- Created `.env.example` template for repository
- Created `.gitignore` with Next.js defaults and security exclusions
- Added `context/supabase_cli.md` to gitignore to prevent credential leaks
- Updated `context/supabase_cli.md` with project credentials for team reference

### 10. Changelog System Documentation
- Updated `changelog.md` with README summary entry requirements
- Created `context/changelog-system-setup.md` - complete guide for setting up the changelog system in new repositories
- Updated `changelog/README` with this session's entry
- Cleaned keyword index to reflect only existing changelogs

---

## Why

### Business Requirements
- Need multi-user collaborative alignment system with privacy guarantees
- Require real-time updates when partners submit responses
- Must enforce state machine workflow to prevent invalid transitions
- Need scalable, performant database design for JSONB Q&A storage

### Technical Drivers
- Supabase provides PostgreSQL with built-in RLS for row-level security
- Realtime subscriptions enable collaborative features without polling
- JSONB allows flexible question/answer schema without migrations for content changes
- Triggers and functions enforce business rules at database level

### Developer Experience
- Migrations-first approach ensures reproducible schema
- Comprehensive documentation reduces onboarding time
- Production-ready examples accelerate Next.js development
- CLI standardization across team

---

## How

### Installation Process
1. Attempted global npm install (failed - no longer supported)
2. Used local dev dependency: `npm i supabase --save-dev`
3. Authenticated via browser: `npx supabase login`
4. Linked to project: `npx supabase link --project-ref qvzfcezbuzmvglgiolmh`
5. Verified with: `npx supabase projects list`

### Migration Strategy
1. Created base migration: `npx supabase migration new init_human_alignment`
2. Consulted Supabase AI for:
   - JSONB best practices for Q&A responses
   - RLS patterns for multi-user privacy
   - Index recommendations
   - Realtime integration patterns
3. Wrote comprehensive SQL migration with:
   - Table definitions with proper constraints
   - RLS policies with `EXISTS` subqueries
   - Performance indexes
   - Triggers for `updated_at`, state validation, and realtime broadcasting
4. Created second migration for realtime RLS policies
5. Deployed with: `npx supabase db push`

### Supabase AI Consultation
Asked for guidance on:
1. JSONB structure for responses → Got versioned envelope pattern
2. RLS patterns → Got participant-only policies with privacy enforcement
3. Indexing strategy → Got comprehensive index checklist
4. State transitions → Got trigger-based validation
5. Realtime setup → Got broadcast trigger + RLS policies
6. Edge Functions vs Next.js routes → Got decision matrix

Supabase AI also:
- Generated initial migrations
- Created realtime policies
- Applied missing triggers (broadcast and state validation)
- Verified deployment

### Documentation Approach
1. Started with basic CLI commands
2. Iteratively enhanced with Supabase AI feedback
3. Added project-specific best practices section
4. Created production-ready example based on Supabase AI scaffold
5. Updated plan_a.md to show completion status

---

## Issues Encountered

### 1. Global npm Install Not Supported
**Problem:** `npm i -g supabase` failed with error
**Solution:** Used local dev dependency `npm i supabase --save-dev` and prefix all commands with `npx`

### 2. Non-TTY Environment for Login
**Problem:** `npx supabase login` can't open browser in Claude Code environment
**Solution:** User ran login command directly in terminal

### 3. Triggers Not Applied After Initial Migration
**Problem:** Supabase AI detected that realtime broadcast and state validation triggers weren't visible after push
**Solution:** Supabase AI executed trigger creation SQL directly via dashboard/API

### 4. File Location Confusion
**Problem:** Initially created `supabase_cli.md` in root instead of `context/` directory
**Root Cause:** Didn't check existing file structure first
**Solution:** Deleted incorrect file, updated correct file in `context/`
**Lesson:** Always use `Glob` or `Read` to verify file locations before creating/editing

---

## Dependencies Added/Changed

### NPM Packages
```json
{
  "devDependencies": {
    "supabase": "latest"
  }
}
```

### Environment Variables Added
```bash
NEXT_PUBLIC_SUPABASE_URL=https://qvzfcezbuzmvglgiolmh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
SUPABASE_SERVICE_ROLE_KEY=[service_role_key]
AI_GATEWAY_API_KEY=[existing]
```

### Files Created
- `.env.local` - Actual credentials (gitignored)
- `.env.example` - Template for repository
- `.gitignore` - Security and build exclusions

### Future Dependencies (for Next.js implementation)
- `@supabase/supabase-js` - Supabase JavaScript client
- `@supabase/ssr` - Supabase SSR helpers for Next.js

---

## Testing Performed

### Database Verification
- ✅ All 8 tables created successfully
- ✅ RLS enabled on all tables
- ✅ Foreign key constraints working
- ✅ Unique constraints enforced
- ✅ Indexes created on critical columns

### Policy Verification (via Supabase AI)
- ✅ Realtime RLS policies present for both `:responses` and `:events` topics
- ✅ Policies correctly filter by `private = true` and participant membership
- ✅ State transition trigger present and functional

### Manual Testing Recommended
**Realtime broadcast:**
1. Subscribe to private channel `alignment:<uuid>:responses`
2. Insert/update/delete row in `alignment_responses`
3. Expect broadcast with TG_OP event

**State validation:**
1. Valid path: `draft → active → analyzing → resolving → complete` (should succeed)
2. Invalid jump: `draft → analyzing` (should raise "Invalid status transition" error)

---

## Next Steps

### Immediate (Ready to Start)
1. **Initialize Next.js project** with TypeScript and Tailwind CSS
2. **Install dependencies**: `@supabase/supabase-js`, `@supabase/ssr`
3. **Set up environment variables** in `.env.local`
4. **Create Supabase client utilities** (`app/lib/supabase-browser.ts`, `app/lib/types.ts`)
5. **Implement authentication pages** (login, signup) using Supabase Auth

### Short-term
1. Build homepage with hero, flow visualization, use cases
2. Create dashboard showing user's alignments
3. Implement alignment creation flow
4. Build question/answer pages with realtime updates

### Database-related
1. Create seed data (`supabase/seed.sql`) with sample templates
2. Test RLS policies with multiple user accounts
3. Verify realtime subscriptions work with Next.js client
4. Consider adding `pg_jsonschema` validation for strict response schemas (optional)

### Performance Optimization (Future)
- Conditional broadcast (only emit when `submitted_at` or `answers` change)
- Materialized views for complex queries if needed
- Additional indexes based on query patterns

---

## Keywords

[DATABASE] [SUPABASE] [RLS] [MIGRATIONS] [REALTIME] [INFRASTRUCTURE] [SETUP] [SCHEMA] [POSTGRESQL] [SECURITY] [PERFORMANCE] [JSONB] [TRIGGERS] [STATE_MACHINE] [DOCUMENTATION] [CLI] [NEXTJS_INTEGRATION] [ENVIRONMENT] [GITIGNORE] [CHANGELOG_SYSTEM]
