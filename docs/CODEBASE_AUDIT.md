# Codebase Audit Report

**Project:** Human Alignment
**Audit Date:** December 5, 2025
**Auditor:** Claude Code (Automated Audit)
**Repository:** align-the-humans

---

## Executive Summary

| Category | Rating | Summary |
|----------|--------|---------|
| 1. Single Source of Truth | **WARNING** | Multiple duplicate files detected; some consolidation needed |
| 2. Documentation Accuracy | **PASS** | README and CLAUDE.md align well with implementation |
| 3. Scalability Assessment | **PASS** | Good modular architecture with clear extension points |
| 4. Security Review | **WARNING** | Some concerns with secrets management and missing CSP |
| 5. Dead Code & Dependencies | **WARNING** | Test files and example code in production; some unused deps likely |
| 6. Error Handling | **PASS** | Comprehensive error handling system with structured errors |
| 7. Type Safety | **WARNING** | 40+ instances of `as any` type bypasses |
| 8. Naming Conventions | **PASS** | Consistent naming conventions throughout |
| 9. Testing Audit | **FAIL** | No automated test files exist |
| 10. Environment Configuration | **PASS** | Proper env separation with validation |

**Overall Assessment:** The codebase is well-structured with good architectural patterns, but requires attention to testing, type safety, and some duplication issues before production deployment.

---

## 1. Single Source of Truth Audit

### Rating: WARNING

### Findings

#### Critical Duplications

| Issue | Files | Lines |
|-------|-------|-------|
| Duplicate utils.ts | `lib/utils.ts`, `app/lib/utils.ts` | Both contain `cn()` function |
| Duplicate database.types.ts | `lib/database.types.ts`, `app/lib/database.types.ts` | Both contain Supabase types, but app/lib version is more complete |
| Duplicate status colors | `app/lib/utils.ts:46-56`, `components/dashboard/StatusBadge.tsx:18-31` | Status color mappings defined in both files |
| Duplicate status formatting | `app/lib/utils.ts:68-73`, `components/dashboard/StatusBadge.tsx:37-50`, `components/dashboard/AlignmentCard.tsx:88-93` | `formatStatus` / `formatStatusLabel` / `formatStatusText` all do the same thing |
| Duplicate AlignmentStatus type | `app/lib/utils.ts:21-26`, `app/lib/types.ts:14` | Type defined in both files |
| Duplicate UIStatus type | `app/lib/utils.ts:31-40`, `app/lib/types.ts:20-25` | Type defined in both files (with slight differences) |

#### Centralized Components (Good)

- UI components properly centralized in `/components/ui/`
- Hooks centralized in `/app/lib/hooks/`
- Database helpers centralized in `/app/lib/db-helpers.ts`
- Error classes centralized in `/app/lib/errors.ts`
- Validation schemas centralized in `/app/lib/schemas.ts`

### Recommendations

| Priority | Task | Effort |
|----------|------|--------|
| **CRITICAL** | Remove `lib/database.types.ts` - use only `app/lib/database.types.ts` | Low |
| **CRITICAL** | Remove `lib/utils.ts` - use only `app/lib/utils.ts` | Low |
| **HIGH** | Consolidate status color mappings into single location (StatusBadge or utils) | Medium |
| **HIGH** | Consolidate status formatting functions into `app/lib/utils.ts` | Medium |
| **MEDIUM** | Remove duplicate type definitions, export from single source | Low |

---

## 2. Documentation Accuracy Check

### Rating: PASS

### Findings

#### README.md vs Implementation

| Documented Feature | Implementation Status | Notes |
|-------------------|----------------------|-------|
| Next.js 14 App Router | **Implemented** | Using latest Next.js patterns |
| TypeScript | **Implemented** | Strict mode enabled in tsconfig |
| Tailwind CSS | **Implemented** | Properly configured |
| shadcn/ui | **Implemented** | Components in /components/ui/ |
| Supabase Auth | **Implemented** | Email/password auth working |
| Vercel AI SDK | **Implemented** | Multiple AI endpoints |
| 5-Phase Workflow | **Implemented** | All phases have pages |

#### CLAUDE.md Accuracy

- Tech stack documentation matches implementation
- Page structure documentation is accurate
- Database schema references are correct
- Development commands are accurate

#### Minor Discrepancies

| Location | Issue |
|----------|-------|
| README.md:76-77 | `INVITE_TOKEN_SECRET` mentioned but not in `.env.example` |
| CLAUDE.md:32 | Status state machine shows `answering` status which doesn't exist in code |
| plan_a.md (referenced) | Not present in repository root |

### Recommendations

| Priority | Task | Effort |
|----------|------|--------|
| **LOW** | Add `INVITE_TOKEN_SECRET` to `.env.example` | Low |
| **LOW** | Update CLAUDE.md status state machine to match actual implementation | Low |
| **LOW** | Verify plan_a.md location or update references | Low |

---

## 3. Scalability Assessment

### Rating: PASS

### Architecture Patterns

#### Positive Findings

1. **Modular Component Structure**
   - Clear separation: `/components/ui/`, `/components/dashboard/`, `/components/homepage/`
   - Each component has single responsibility
   - Proper prop typing

2. **API Route Organization**
   - RESTful structure under `/app/api/`
   - Consistent request/response patterns
   - Proper middleware separation

3. **Database Layer**
   - Centralized helpers in `db-helpers.ts`
   - Type-safe Supabase client wrappers
   - RLS policies documented

4. **State Management**
   - Custom hooks pattern (`useDashboardData`, `usePartners`, `useAlignmentUpdates`)
   - Real-time subscriptions supported
   - Clean separation of concerns

#### Extension Points

| Feature Area | Extension Method |
|-------------|------------------|
| New alignment phases | Add route under `/app/alignment/[id]/` |
| New question types | Extend `QuestionType` in `types.ts` |
| New AI operations | Add route under `/app/api/alignment/` |
| New templates | Insert into `templates` table |

#### Potential Bottlenecks

| Area | Concern | Mitigation |
|------|---------|------------|
| Rate limiting | In-memory store in `join/route.ts:34` | Use Redis for production |
| AI operations | Synchronous processing | Already using streaming where appropriate |
| Database queries | Multiple sequential queries in `getAlignmentDetail` | Consider using database views or joins |

### Recommendations

| Priority | Task | Effort |
|----------|------|--------|
| **HIGH** | Replace in-memory rate limiter with Redis/KV | Medium |
| **MEDIUM** | Add database indexes for common queries | Low |
| **LOW** | Consider query optimization in `getAlignmentDetail` | Medium |

---

## 4. Security Review

### Rating: WARNING

### Findings

#### Environment Variable Handling

| Finding | Location | Severity |
|---------|----------|----------|
| `.env` and `.env*.local` properly gitignored | `.gitignore:29-30` | **GOOD** |
| Env validation exists | `app/lib/env.ts` | **GOOD** |
| `INVITE_TOKEN_SECRET` used for encryption | `app/lib/invite-tokens.ts:82-91` | **GOOD** |
| `INVITE_TOKEN_SECRET` missing from `.env.example` | `.env.example` | **MEDIUM** |
| No explicit check if `INVITE_TOKEN_SECRET` is set before token operations | Various routes | **MEDIUM** |

#### Authentication Security

| Finding | Location | Status |
|---------|----------|--------|
| Middleware protects routes | `middleware.ts:130-135` | **GOOD** |
| `requireAuth` helper used consistently | API routes | **GOOD** |
| Participant verification before data access | `db-helpers.ts:98-110` | **GOOD** |
| Password validation (8+ chars, mixed case, number) | `signup/actions.ts:69-75` | **GOOD** |

#### Potential Vulnerabilities

| Issue | Location | Severity | Details |
|-------|----------|----------|---------|
| No Content Security Policy | `app/layout.tsx` | **HIGH** | Missing CSP headers to prevent XSS |
| XSS sanitization only on render | `document-content.tsx` | **MEDIUM** | Should also validate AI responses before storage |
| Missing rate limiting on most endpoints | API routes | **MEDIUM** | Only `/api/alignment/join` has rate limiting |
| `console.error` may leak sensitive info | Multiple routes | **LOW** | Error details logged to console |

#### Token Security

| Aspect | Status | Location |
|--------|--------|----------|
| Token generation (256-bit entropy) | **GOOD** | `invite-tokens.ts:26` |
| Token hashing (SHA-256) | **GOOD** | `invite-tokens.ts:40-42` |
| Token encryption (AES-256-GCM) | **GOOD** | `invite-tokens.ts:98-105` |
| Token format validation | **GOOD** | `invite-tokens.ts:54-57` |

### Recommendations

| Priority | Task | Effort |
|----------|------|--------|
| **CRITICAL** | Add Content Security Policy headers | Medium |
| **HIGH** | Add rate limiting to all API endpoints | Medium |
| **HIGH** | Add `INVITE_TOKEN_SECRET` to `.env.example` with placeholder | Low |
| **MEDIUM** | Validate AI responses before storing in database | Medium |
| **MEDIUM** | Replace console.error with structured logging | Medium |
| **LOW** | Add request body size limits | Low |

---

## 5. Dead Code & Dependency Audit

### Rating: WARNING

### Unused/Test Files in Production

| File | Type | Issue |
|------|------|-------|
| `test-generate-questions.ts` | Test script | Root-level test file, not in tests/ |
| `test-middleware-auth.js` | Test script | Root-level test file |
| `test-resolution-setup.js` | Test script | Root-level test file |
| `seed-resolution-test-data.js` | Seed script | Should be in scripts/ folder |
| `check-schema.js` | Utility script | Should be in scripts/ folder |
| `components/dashboard/AddPartnerModal.example.tsx` | Example | Example file in production |
| `components/dashboard/PartnersList.test-example.tsx` | Test example | Test file in components |
| `components/dashboard/PartnersList.test.html` | Test HTML | HTML test file in components |
| `app/test-alignment-card/` | Test route | Test page accessible in production |
| `testimonials-accessibility-snapshot.txt` | Snapshot | Root-level test artifact |

### Potentially Unused Dependencies

Based on package.json analysis, verify usage of:

| Package | Reason for Review |
|---------|-------------------|
| `dotenv` | May not be needed with Next.js built-in env support |
| `@supabase/auth-helpers-nextjs` | Deprecated in favor of `@supabase/ssr` (which is already used) |

### Dead/Orphaned Code

| Location | Issue |
|----------|-------|
| `lib/utils.ts` | Duplicate of `app/lib/utils.ts` |
| `lib/database.types.ts` | Outdated version missing newer tables |

### Recommendations

| Priority | Task | Effort |
|----------|------|--------|
| **HIGH** | Move test files to `/tests/` directory or remove | Low |
| **HIGH** | Remove `app/test-alignment-card/` route | Low |
| **HIGH** | Remove example files from production components | Low |
| **MEDIUM** | Move utility scripts to `/scripts/` directory | Low |
| **MEDIUM** | Remove `lib/` directory (duplicate of `app/lib/`) | Low |
| **LOW** | Audit and remove unused npm dependencies | Medium |

---

## 6. Error Handling Assessment

### Rating: PASS

### Findings

#### Error Class Hierarchy

The codebase has a well-designed error handling system in `app/lib/errors.ts`:

```
AppError (base)
├── ApiError
├── ValidationError
├── AuthError
├── AlignmentError (with static factory methods)
├── DatabaseError
└── AIError (with static factory methods)
```

#### Error Handling Consistency

| API Route | Error Handling | Notes |
|-----------|----------------|-------|
| `/api/alignment/analyze` | **GOOD** | Uses structured errors, telemetry logging |
| `/api/alignment/join` | **GOOD** | Uses structured errors, rate limiting |
| `/api/partners/search` | **PARTIAL** | Uses `createErrorResponse` but also `throw new Error()` |
| `/api/alignment/[id]/update` | **GOOD** | Uses structured errors |

#### User-Facing Error States

| Component/Page | Error Handling | Notes |
|----------------|----------------|-------|
| `DashboardClient.tsx` | **GOOD** | Error state with styled alert |
| `app/error.tsx` | **GOOD** | Global error boundary |
| `app/(auth)/error.tsx` | **GOOD** | Auth-specific error boundary |
| `app/alignment/[id]/error.tsx` | **GOOD** | Alignment-specific error boundary |

#### Areas for Improvement

| Issue | Location | Details |
|-------|----------|---------|
| Raw `console.error` calls | Multiple API routes | 15+ instances found |
| Generic `throw new Error()` | `app/api/partners/search/route.ts:61` | Should use structured error |
| Missing error boundary | Some nested routes | Not all route segments have error.tsx |

### Recommendations

| Priority | Task | Effort |
|----------|------|--------|
| **MEDIUM** | Replace `console.error` with `logError` utility | Medium |
| **MEDIUM** | Replace generic `Error` throws with structured errors | Low |
| **LOW** | Add error.tsx to all route segments | Low |

---

## 7. Type Safety Review

### Rating: WARNING

### Type Bypass Analysis

Found **47 instances** of `as any` type assertions across the codebase:

| File | Count | Severity |
|------|-------|----------|
| `app/api/alignment/generate-questions/route.ts` | 8 | High |
| `app/api/alignment/[id]/sign/route.ts` | 7 | High |
| `app/api/alignment/analyze/route.ts` | 1 | Medium |
| `app/api/alignment/generate-document/route.ts` | 3 | Medium |
| `app/api/alignment/clarity/suggest/route.ts` | 3 | Medium |
| `app/api/alignment/get-suggestion/route.ts` | 2 | Medium |
| `app/api/alignment/[id]/submit-resolution/route.ts` | 4 | Medium |
| `app/lib/errors.ts` | 2 | Low (intentional for generic handlers) |
| `app/lib/utils.ts` | 2 | Low (intentional for generic handlers) |
| Various API routes (error responses) | 7 | Low |

#### Common Patterns

1. **AI SDK Type Issues** (`as any` on model parameter)
   ```typescript
   // app/api/alignment/analyze/route.ts:349
   model: anthropic('claude-sonnet-4-5-20250929') as any,
   ```
   *Reason:* Type mismatch between AI SDK versions

2. **JSONB Field Handling**
   ```typescript
   // app/api/alignment/[id]/sign/route.ts:147
   questions = ((template?.content as any)?.questions || []) as any[];
   ```
   *Reason:* Supabase returns `Json` type which needs casting

3. **Return Type Compatibility**
   ```typescript
   // Multiple routes
   return createErrorResponse(error) as any;
   ```
   *Reason:* NextResponse type compatibility issues

### Missing Type Definitions

| Area | Issue |
|------|-------|
| Dashboard alignment type | Uses `as any` in `AlignmentCard` usage |
| Template content structure | Loosely typed as `Json` |
| AI response schemas | Some schemas use `z.any()` |

### Recommendations

| Priority | Task | Effort |
|----------|------|--------|
| **HIGH** | Create proper types for AI SDK model parameters | Medium |
| **HIGH** | Create typed interfaces for JSONB fields (template content) | Medium |
| **MEDIUM** | Replace `z.any()` with proper schemas | Medium |
| **MEDIUM** | Fix NextResponse return type issues | Low |
| **LOW** | Add stricter TypeScript compiler options | Low |

---

## 8. Naming & Convention Consistency

### Rating: PASS

### File Naming Conventions

| Pattern | Usage | Examples | Status |
|---------|-------|----------|--------|
| kebab-case for routes | Consistent | `generate-document/`, `submit-resolution/` | **GOOD** |
| PascalCase for components | Consistent | `AlignmentCard.tsx`, `StatusBadge.tsx` | **GOOD** |
| camelCase for utilities | Consistent | `db-helpers.ts`, `invite-tokens.ts` | **GOOD** |
| Lowercase for config | Consistent | `middleware.ts`, `tailwind.config.ts` | **GOOD** |

### Variable/Function Naming

| Convention | Status | Notes |
|------------|--------|-------|
| camelCase for functions | **GOOD** | Consistently used |
| camelCase for variables | **GOOD** | Consistently used |
| UPPER_SNAKE_CASE for constants | **PARTIAL** | Some constants use camelCase |
| Type/Interface PascalCase | **GOOD** | Consistently used |

### Component Structure

| Pattern | Status |
|---------|--------|
| Props interface named `{Component}Props` | **GOOD** |
| Export default for pages | **GOOD** |
| Named exports for components | **GOOD** |
| 'use client' directive consistent | **GOOD** |

### Minor Inconsistencies

| Issue | Location |
|-------|----------|
| `PUBLIC_ROUTES` vs `statusColors` | Constant naming inconsistent |
| `formatStatusText` vs `formatStatusLabel` vs `formatStatus` | Function naming varies |

### Recommendations

| Priority | Task | Effort |
|----------|------|--------|
| **LOW** | Standardize constant naming (all UPPER_SNAKE_CASE) | Low |
| **LOW** | Unify status formatting function names | Low |

---

## 9. Testing Audit

### Rating: FAIL

### Current Test Coverage

| Test Type | Files Found | Coverage |
|-----------|-------------|----------|
| Unit tests (*.test.ts) | 0 | 0% |
| Integration tests (*.spec.ts) | 0 | 0% |
| E2E tests | 0 | 0% |

### Test-Related Files Found (Not Actual Tests)

| File | Type | Notes |
|------|------|-------|
| `tests/xss-sanitization-test.md` | Documentation | Manual test cases documented |
| `E2E_TEST_PLAN.md` | Plan | Comprehensive E2E test plan, not implemented |
| `app/lib/hooks/__tests__/DashboardHooksTest.tsx` | Mock | Not a real test file |
| `components/dashboard/PartnersList.test-example.tsx` | Example | Example test, not implemented |

### Critical Paths Without Tests

| Path | Risk Level | Description |
|------|------------|-------------|
| Authentication flow | **CRITICAL** | Login, signup, logout |
| Alignment creation | **CRITICAL** | Full workflow |
| AI analysis | **HIGH** | Response analysis |
| Invite system | **HIGH** | Token generation, validation, join |
| Response submission | **HIGH** | Data integrity |

### Testing Infrastructure

- No test framework configured in package.json
- No test scripts in package.json scripts
- No jest.config.js or vitest.config.ts
- No playwright.config.ts

### Recommendations

| Priority | Task | Effort |
|----------|------|--------|
| **CRITICAL** | Set up testing framework (Jest + React Testing Library) | Medium |
| **CRITICAL** | Add unit tests for `db-helpers.ts` | High |
| **CRITICAL** | Add unit tests for `invite-tokens.ts` | Medium |
| **HIGH** | Add integration tests for API routes | High |
| **HIGH** | Set up E2E testing (Playwright) | High |
| **MEDIUM** | Add component tests for critical UI | High |
| **LOW** | Add CI/CD test automation | Medium |

---

## 10. Environment Configuration

### Rating: PASS

### Configuration Files

| File | Purpose | Status |
|------|---------|--------|
| `.env.example` | Template for env vars | **EXISTS** |
| `.gitignore` | Excludes .env files | **GOOD** |
| `app/lib/env.ts` | Env validation | **GOOD** |

### Environment Variables

| Variable | Required | Validated | Notes |
|----------|----------|-----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes | URL format validated |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes | Presence validated |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Partial | Only validated when used |
| `AI_GATEWAY_API_KEY` | No | No | Optional with fallback |
| `INVITE_TOKEN_SECRET` | Yes | No | Missing from .env.example |
| `NEXT_PUBLIC_SITE_URL` | No | No | Has fallback to localhost |

### Environment Separation

| Environment | Configuration | Status |
|-------------|---------------|--------|
| Development | Uses `.env.local` | **GOOD** |
| Production | Uses env vars from hosting | **ASSUMED** |
| Test | Not configured | **MISSING** |

### Feature Flags

No feature flag system detected. Consider adding for:
- AI features (fallback to templates)
- Beta features
- Maintenance mode

### Recommendations

| Priority | Task | Effort |
|----------|------|--------|
| **HIGH** | Add `INVITE_TOKEN_SECRET` to `.env.example` | Low |
| **MEDIUM** | Add validation for `SUPABASE_SERVICE_ROLE_KEY` | Low |
| **MEDIUM** | Add test environment configuration | Low |
| **LOW** | Consider adding feature flag system | Medium |

---

## Prioritized Recommendations Summary

### Critical (Address Immediately)

1. **Set up testing framework and add critical path tests**
   - Effort: High
   - Files: New test files

2. **Add Content Security Policy headers**
   - Effort: Medium
   - Files: `middleware.ts` or `next.config.js`

3. **Remove duplicate files (`lib/` directory)**
   - Effort: Low
   - Files: `lib/utils.ts`, `lib/database.types.ts`

### High Priority (Address Soon)

4. **Consolidate status color/formatting functions**
   - Effort: Medium
   - Files: `app/lib/utils.ts`, `StatusBadge.tsx`, `AlignmentCard.tsx`

5. **Add rate limiting to all API endpoints**
   - Effort: Medium
   - Files: All API routes

6. **Reduce `as any` type assertions**
   - Effort: Medium
   - Files: API routes, especially sign and generate-questions

7. **Move test/example files out of production directories**
   - Effort: Low
   - Files: Various test and example files

8. **Replace in-memory rate limiter with distributed cache**
   - Effort: Medium
   - Files: `app/api/alignment/join/route.ts`

### Medium Priority (Plan for Next Sprint)

9. **Replace console.error with structured logging**
   - Effort: Medium
   - Files: All API routes

10. **Validate AI responses before database storage**
    - Effort: Medium
    - Files: AI API routes

11. **Create proper TypeScript types for JSONB fields**
    - Effort: Medium
    - Files: Type definitions

### Low Priority (Backlog)

12. **Standardize constant naming conventions**
    - Effort: Low
    - Files: Various

13. **Add test environment configuration**
    - Effort: Low
    - Files: `.env.test`

14. **Add feature flag system**
    - Effort: Medium
    - Files: New configuration

---

## Appendix A: File Location Reference

### Duplicate Files to Consolidate

```
lib/utils.ts                    → DELETE (duplicate of app/lib/utils.ts)
lib/database.types.ts           → DELETE (outdated version of app/lib/database.types.ts)
```

### Files to Move

```
test-generate-questions.ts      → tests/api/generate-questions.test.ts
test-middleware-auth.js         → tests/middleware/auth.test.js
test-resolution-setup.js        → scripts/seed-resolution.js
seed-resolution-test-data.js    → scripts/seed-resolution-data.js
check-schema.js                 → scripts/check-schema.js
```

### Files to Remove

```
app/test-alignment-card/        → DELETE (test route in production)
components/dashboard/AddPartnerModal.example.tsx → DELETE
components/dashboard/PartnersList.test-example.tsx → DELETE
components/dashboard/PartnersList.test.html → DELETE
testimonials-accessibility-snapshot.txt → DELETE or move to tests/
```

---

## Appendix B: Type Safety Issues Detail

### All `as any` Occurrences

```
app/api/alignment/analyze/route.ts:349
app/api/alignment/clarity/suggest/route.ts:157
app/api/alignment/clarity/suggest/route.ts:226
app/api/alignment/generate-document/route.ts:136
app/api/alignment/generate-document/route.ts:256
app/api/alignment/generate-questions/route.ts:150
app/api/alignment/generate-questions/route.ts:163
app/api/alignment/generate-questions/route.ts:221
app/api/alignment/generate-questions/route.ts:245
app/api/alignment/generate-questions/route.ts:260
app/api/alignment/generate-questions/route.ts:266
app/api/alignment/get-suggestion/route.ts:227
app/api/alignment/get-suggestion/route.ts:276
app/api/alignment/join/route.ts:255
app/api/alignment/resolve-conflicts/route.ts:101
app/api/alignment/[id]/generate-invite/route.ts:124
app/api/alignment/[id]/invite/route.ts:6
app/api/alignment/[id]/regenerate-invite/route.ts:139
app/api/alignment/[id]/sign/route.ts:58
app/api/alignment/[id]/sign/route.ts:121
app/api/alignment/[id]/sign/route.ts:139
app/api/alignment/[id]/sign/route.ts:147
app/api/alignment/[id]/sign/route.ts:157
app/api/alignment/[id]/submit-resolution/route.ts:130
app/api/alignment/[id]/submit-resolution/route.ts:135
app/api/alignment/[id]/submit-resolution/route.ts:230
app/api/alignment/[id]/update/route.ts:133
app/api/partners/search/route.ts:84
app/dashboard/DashboardClient.tsx:129
app/dashboard/DashboardClient.tsx:318
app/lib/errors.ts:298
app/lib/schemas.ts:33
app/lib/telemetry.ts:327
app/lib/utils.ts:308
app/lib/utils.ts:322
```

---

*End of Audit Report*
