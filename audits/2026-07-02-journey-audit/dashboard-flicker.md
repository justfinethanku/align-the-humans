# dashboard-flicker audit

## Verdict
ISSUES-FOUND

## Findings

### high CONFIRMED Realtime subscription resubscribes on ordinary dashboard renders
File: app/dashboard/DashboardClient.tsx:85
What happens: `DashboardClient` passes a fresh options object with fresh inline `onUpdate` and `onInsert` callbacks on every render (app/dashboard/DashboardClient.tsx:85-94). `useAlignmentUpdates` destructures those callbacks (app/lib/hooks/useAlignmentUpdates.ts:91-98) and includes them in its effect dependency array (app/lib/hooks/useAlignmentUpdates.ts:260). When any dashboard state changes - initial data load completion, search typing, modal open/close, or the hook's own `setConnected(true)` on subscribe (app/lib/hooks/useAlignmentUpdates.ts:226-230) - React re-renders, the callback identities change, the cleanup removes the channel (app/lib/hooks/useAlignmentUpdates.ts:255-259), and the effect subscribes again. `disconnect()` also sets `connected` false (app/lib/hooks/useAlignmentUpdates.ts:105-110), so the hook can create its own false/true render cycle.
User-visible effect: Realtime can flap or reconnect while the user is simply viewing or interacting with the dashboard. This can amplify flicker by repeatedly changing hook state and increasing the chance of duplicate or missed update handling during rapid renders.
Fix sketch: Pass stable callbacks from `DashboardClient` with `React.useCallback`, or pass `refetchAlignments` directly if typed accordingly. Better still, change `useAlignmentUpdates` to keep event callbacks in refs or `useEffectEvent` so the subscription effect depends only on `enabled`, `alignmentId`, and `disconnect`.

### medium CONFIRMED Realtime INSERT/UPDATE refetch replaces loaded alignments with a spinner
File: app/dashboard/DashboardClient.tsx:85
What happens: On dashboard, `useAlignmentUpdates` is called without `alignmentId` and with inline `onUpdate` and `onInsert` handlers that call `refetchAlignments()` (app/dashboard/DashboardClient.tsx:85-94). The hook subscribes to `postgres_changes` INSERT and UPDATE on `public.alignments` (app/lib/hooks/useAlignmentUpdates.ts:161-187); because no `alignmentId` is supplied, the Supabase filter is `undefined` (app/lib/hooks/useAlignmentUpdates.ts:167, app/lib/hooks/useAlignmentUpdates.ts:181), so this code does not narrow events to a specific alignment. Each delivered INSERT or UPDATE calls one refetch; a burst of N delivered events can start N refetches because there is no debounce or in-flight guard in `fetchAlignments` (app/lib/hooks/useDashboardData.ts:68-142). That refetch immediately calls `setLoading(true)` (app/lib/hooks/useDashboardData.ts:70), and `DashboardClient` renders the alignments loading branch (app/dashboard/DashboardClient.tsx:240-243) instead of the existing grid (app/dashboard/DashboardClient.tsx:313-323) until the query finishes.
User-visible effect: A user with already-loaded alignment cards can see the Current Alignments area blink back to the loading spinner on every realtime alignment INSERT or UPDATE. DELETE events are subscribed (app/lib/hooks/useAlignmentUpdates.ts:190-200) but `DashboardClient` does not pass `onDelete`, so they do not refetch in this screen.
Fix sketch: Separate initial loading from background refreshing; on refetch, keep existing cards visible and show a small non-blocking refresh indicator. Debounce or coalesce realtime events, guard concurrent fetches, and filter the subscription to the relevant alignment ids or user scope rather than relying on table-wide delivered events.

### low CONFIRMED Initial route loading can swap from skeleton to in-page spinners
File: app/dashboard/loading.tsx:6
What happens: The route-level loading UI renders a full dashboard skeleton while the server component is pending (app/dashboard/loading.tsx:6-43). The server page fetches auth and only the current user's profile (app/dashboard/page.tsx:20-35), then returns `DashboardClient` without preloaded alignments or partners (app/dashboard/page.tsx:37-42). The client hooks both initialize with `loading: true` (app/lib/hooks/useDashboardData.ts:65, app/lib/hooks/usePartners.ts:73) and start their real data fetches after mount (app/lib/hooks/useDashboardData.ts:144-147, app/lib/hooks/usePartners.ts:244-247), which renders the in-page alignment spinner (app/dashboard/DashboardClient.tsx:240-243) and partner spinner (app/dashboard/DashboardClient.tsx:356-359).
User-visible effect: On landing, users can see one loading surface replaced by a different loading surface before real data appears. This is not the exact "server fetched dashboard data then client refetched the same data" pattern; the duplicate is visual loading state, not identical alignment or partner data fetching.
Fix sketch: Fetch initial alignments and partners in the server page and hydrate the client hooks with `initialData`, or remove the second full loading phase by rendering the same skeleton or placeholder until both client fetches complete.

## Flow trace

Landing on `/dashboard`:
1. `app/dashboard/page.tsx` creates a server Supabase client, gets the current user, redirects unauthenticated users to `/login`, fetches the user's profile, and returns `DashboardClient` with `userId`, `userEmail`, and `displayName` (app/dashboard/page.tsx:20-42).
2. While that server segment is pending, Next can render `app/dashboard/loading.tsx`, which shows a route-level skeleton (app/dashboard/loading.tsx:6-43).
3. The first client render of `DashboardClient` creates local UI state and calls `useDashboardData`, `usePartners`, and `useAlignmentUpdates` (app/dashboard/DashboardClient.tsx:47-94).
4. `useDashboardData` starts with `loading: true`, then after mount calls `fetchAlignments()`, gets the browser user, fetches the user's `alignment_participants`, fetches matching `alignments`, writes `alignments`, and sets loading false (app/lib/hooks/useDashboardData.ts:63-147).
5. `usePartners` starts with `loading: true`, then after mount gets the browser user, fetches the user's alignment participations, other participants, partner profiles, alignment metadata, partner records, writes `partners`, and sets loading false (app/lib/hooks/usePartners.ts:71-247).
6. `DashboardClient` shows the alignment spinner while `alignmentsLoading` is true and the partners spinner while `partnersLoading` is true (app/dashboard/DashboardClient.tsx:240-243, app/dashboard/DashboardClient.tsx:356-359), then swaps to cards/list or empty/error states.
7. The server component does not fetch alignments or partners, so there is no confirmed server-plus-client duplicate fetch of the same dashboard data. The only server profile fetch in this path is app/dashboard/page.tsx:30-35.
8. No `toast`, `sonner`, or `useToast` call exists in the requested dashboard files, so this segment has no confirmed realtime toast-spam path.

When a realtime alignment update arrives:
1. The current dashboard realtime path does not call `router.refresh()`. The only `router.refresh()` in the requested dashboard client is in `handleLogout`, after `supabase.auth.signOut()` and `router.push('/')` (app/dashboard/DashboardClient.tsx:55-60).
2. `useAlignmentUpdates` creates a private Supabase realtime channel named either `alignment:<id>:updates` or `user:<user.id>:alignments` (app/lib/hooks/useAlignmentUpdates.ts:148-160).
3. Because `DashboardClient` does not pass `alignmentId`, the dashboard subscription registers INSERT, UPDATE, and DELETE handlers for `public.alignments` with an undefined row filter (app/lib/hooks/useAlignmentUpdates.ts:161-200).
4. On an INSERT payload, the hook calls `onInsert`; on an UPDATE payload, it calls `onUpdate`; on DELETE it calls `onDelete` if supplied (app/lib/hooks/useAlignmentUpdates.ts:169-200). Dashboard supplies only `onInsert` and `onUpdate`, and both call `refetchAlignments()` (app/dashboard/DashboardClient.tsx:85-94).
5. `refetchAlignments()` runs `fetchAlignments()`, which immediately sets loading true, clears the error, gets the current user, fetches participation ids, fetches alignments, stores them, and sets loading false (app/lib/hooks/useDashboardData.ts:68-142).
6. During that refetch, `DashboardClient` replaces the current alignment cards with the centered spinner; when the fetch resolves, it renders the grid again (app/dashboard/DashboardClient.tsx:240-243, app/dashboard/DashboardClient.tsx:313-323).
7. The state changes from the refetch and from the subscription status re-render `DashboardClient`. Because the realtime callbacks are inline, those renders change the hook dependencies, triggering cleanup and resubscribe again (app/dashboard/DashboardClient.tsx:85-94, app/lib/hooks/useAlignmentUpdates.ts:255-260).
