# React Hooks for Human Alignment

Client-side React hooks for data fetching and real-time subscriptions.

## Available Hooks

### `useDashboardData()`

Fetches user's alignments with UI status and participant info.

**Features:**
- Uses `alignment_status_view` for derived UI status labels
- Includes participant data via join
- Automatic loading and error states
- Manual refetch capability

**Usage:**
```tsx
'use client';

import { useDashboardData } from '@/app/lib/hooks';

export function DashboardPage() {
  const { alignments, loading, error, refetch } = useDashboardData();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {alignments.map((alignment) => (
        <div key={alignment.id}>
          <h3>{alignment.title || 'Untitled'}</h3>
          <p>Status: {alignment.ui_status}</p>
          <p>Participants: {alignment.participants.length}</p>
        </div>
      ))}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

**Return Type:**
```typescript
interface UseDashboardDataReturn {
  alignments: AlignmentWithStatus[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```

---

### `usePartners()`

Fetches user's partners with alignment counts.

**Features:**
- Fetches partners created by current user
- Includes alignment count per partner
- Automatic loading and error states
- Manual refetch capability

**Usage:**
```tsx
'use client';

import { usePartners } from '@/app/lib/hooks';

export function PartnersPage() {
  const { partners, loading, error, refetch } = usePartners();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {partners.map((partner) => (
        <div key={partner.id}>
          <p>Partner ID: {partner.id}</p>
          <p>Alignments: {partner.alignment_count}</p>
        </div>
      ))}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

**Return Type:**
```typescript
interface UsePartnersReturn {
  partners: PartnerWithCount[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```

---

### `useAlignmentUpdates(options)`

Real-time subscription to alignment changes.

**Features:**
- Subscribes to Supabase Realtime for alignment changes
- Supports INSERT, UPDATE, DELETE events
- Can subscribe to specific alignment or all user's alignments
- Automatic cleanup on unmount
- Handles authentication for private channels

**Usage:**
```tsx
'use client';

import { useAlignmentUpdates } from '@/app/lib/hooks';
import { useState } from 'react';

export function RealtimeDashboard() {
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const { connected, error, disconnect } = useAlignmentUpdates({
    onUpdate: (alignment) => {
      console.log('Alignment updated:', alignment);
      setLastUpdate(alignment.title || 'Untitled');
      // Trigger data refetch or update local state
    },
    onInsert: (alignment) => {
      console.log('New alignment:', alignment);
    },
    enabled: true, // Optional: control subscription
  });

  return (
    <div>
      <p>Realtime Status: {connected ? 'Connected' : 'Disconnected'}</p>
      {error && <p>Error: {error.message}</p>}
      {lastUpdate && <p>Last update: {lastUpdate}</p>}
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}
```

**Options:**
```typescript
interface UseAlignmentUpdatesOptions {
  onInsert?: (alignment: AlignmentRow) => void;
  onUpdate?: (alignment: AlignmentRow) => void;
  onDelete?: (alignment: AlignmentRow) => void;
  alignmentId?: string; // Subscribe to specific alignment
  enabled?: boolean; // Control subscription (default: true)
}
```

**Return Type:**
```typescript
interface UseAlignmentUpdatesReturn {
  connected: boolean;
  error: Error | null;
  disconnect: () => void;
}
```

---

## Combining Hooks

You can combine hooks for powerful real-time dashboards:

```tsx
'use client';

import { useDashboardData, useAlignmentUpdates } from '@/app/lib/hooks';

export function LiveDashboard() {
  const { alignments, loading, refetch } = useDashboardData();

  // Auto-refresh when alignments change
  useAlignmentUpdates({
    onUpdate: () => refetch(),
    onInsert: () => refetch(),
    enabled: !loading,
  });

  // Render dashboard...
}
```

---

## Best Practices

1. **Loading States**: Always handle loading states in UI
2. **Error Handling**: Display error messages to users
3. **Cleanup**: Hooks automatically clean up subscriptions on unmount
4. **Refetch**: Use manual refetch for pull-to-refresh UX
5. **Real-time**: Combine data hooks with update hooks for live dashboards
6. **Authentication**: Hooks automatically handle user auth - ensure user is logged in

---

## TypeScript Support

All hooks are fully typed with TypeScript. Import types from the hooks module:

```typescript
import type {
  UseDashboardDataReturn,
  AlignmentWithStatus,
  UsePartnersReturn,
  PartnerWithCount,
  UseAlignmentUpdatesOptions,
  UseAlignmentUpdatesReturn,
} from '@/app/lib/hooks';
```

---

## Testing

See `__tests__/DashboardHooksTest.tsx` for a test component that verifies all hooks work correctly.
