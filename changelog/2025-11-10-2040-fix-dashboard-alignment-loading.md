# 2025-11-10-2040: Fix Dashboard Alignment Loading Error

## What Changed

- Fixed `useDashboardData` hook to query `alignments` table directly instead of non-existent `alignment_status_view`
- Simplified ui_status mapping to use alignment.status directly

## Why

**Root Cause:**
The dashboard was failing to load alignments with the error "Error loading alignments" because the code was querying a database view `alignment_status_view` that **doesn't exist in production**.

**Impact:**
- Users saw "Error loading alignments" on dashboard
- No alignments were displayed even if they had created them
- The entire dashboard experience was broken

## How

### Code Changes (app/lib/hooks/useDashboardData.ts)

**Line 106-119:** Changed query from view to table
```typescript
// OLD (broken):
const { data: alignmentsData, error: queryError } = await supabase
  .from('alignment_status_view')  // This view doesn't exist!
  .select(...)

// NEW (working):
const { data: alignmentsData, error: queryError } = await supabase
  .from('alignments')  // Query the actual table
  .select(...)
```

**Line 128-131:** Simplified status mapping
```typescript
// OLD:
ui_status: (alignment.ui_status as UIStatus) || (alignment.status as UIStatus),

// NEW:
ui_status: alignment.status as UIStatus,
```

## Issues Encountered

1. **Missing database view:** The `alignment_status_view` was referenced in code but never created in the database schema
2. **No error visibility:** The error was only visible in production when users tried to use the dashboard
3. **Over-engineered solution:** The view was unnecessary - the status field already exists on the alignments table

## Dependencies Added/Changed

None - only modified existing code

## Testing Performed

- Verified query now targets existing `alignments` table
- Confirmed participants relationship still works correctly
- Ready for production testing

## Next Steps

- Test dashboard in production to confirm alignments load
- Monitor for any other references to `alignment_status_view` that need fixing
- Consider removing view references from type definitions if they exist

## Keywords

dashboard, alignments, database, query-error, alignment_status_view, useDashboardData, critical-bug-fix
