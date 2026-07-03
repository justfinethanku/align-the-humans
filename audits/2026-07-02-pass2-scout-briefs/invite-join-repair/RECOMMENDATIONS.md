# invite-join-repair scout

## Current state

- Fixed on main: token generation and validation now agree. `generateToken()` returns 32 random bytes as 43-character base64url at `app/lib/invite-tokens.ts:25-27`, and `isValidTokenFormat()` now accepts exactly 43 base64url characters at `app/lib/invite-tokens.ts:45-60`.
- Still broken: anonymous invite preview is RLS-bound. `app/join/[token]/page.tsx:79-100` hashes the token and selects `alignment_invitations` with `createServerClient()`, which uses the anon key at `app/lib/supabase-server.ts:61-64`. The only invitation SELECT visibility is creator/manage and existing-participant visibility at `supabase/migrations/20251110133651_add_alignment_invitations.sql:38-52`, so a logged-out invite bearer sees "Invitation Not Found". The preview also selects/passes `description` at `app/join/[token]/page.tsx:88-97` and `app/join/[token]/page.tsx:350-354`, which is more than the requested anonymous preview contract.
- Still broken: authenticated partner join is RLS-bound and non-atomic across app code. `app/api/alignment/join/route.ts:141-145` reads the invite through the RLS client before the user is a participant. `app/api/alignment/join/route.ts:225-231` then inserts the partner row through the same client, but `participants_insert_creator` only allows alignment creators to insert participants at `supabase/migrations/20251111011843_fix_all_participant_policies.sql:26-34`. The route also checks usage before existing participation at `app/api/alignment/join/route.ts:176-206`, and the page has the same bad ordering at `app/join/[token]/page.tsx:235-327`.
- Still broken: signup drops the return URL. The join client sends `/signup?redirectTo=/join/<token>` at `app/join/[token]/JoinAlignmentClient.tsx:86-88`, but the signup page does not read `redirectTo` or include a hidden input in the form at `app/(auth)/signup/page.tsx:36-86`. The signup action sends `emailRedirectTo` to plain `/auth/callback` at `app/(auth)/signup/actions.ts:145-153` and redirects immediate-session signups to `/dashboard` at `app/(auth)/signup/actions.ts:213-215`. The callback defaults successful non-recovery token-hash confirmations to `/dashboard` at `app/auth/callback/route.ts:120-124`. Login already preserves this with `redirectTo` at `app/(auth)/login/page.tsx:37-39`, `app/(auth)/login/page.tsx:123-127`, and `app/(auth)/login/actions.ts:130-133`.
- Still broken: creator invite UI exists but is not mounted in the create flow. `components/alignment/InviteStatus.tsx:31-34` fetches participants once, renders partner-joined from local state at `components/alignment/InviteStatus.tsx:98-139`, and nests `ShareLinkButton` at `components/alignment/InviteStatus.tsx:172-175`. `components/alignment/ShareLinkButton.tsx:40-70` loads/generates the invite link, but repo search found no usage outside the component definitions. The waiting page already knows `hasPartnerJoined` at `app/alignment/[id]/waiting/page.tsx:72-79` and subscribes to partner joins at `app/alignment/[id]/waiting/waiting-client.tsx:64-72`; the reusable hook emits partner joins at `app/lib/hooks/useAlignmentUpdates.ts:212-228`.
- Available but should not be the default fix: `createAdminClient()` exists at `app/lib/supabase-server.ts:98-131` and can bypass RLS from server code. It would solve visibility, but the join acceptance still needs a transaction to claim usage and insert the participant safely.

## Recommendations

### [P0] SECURITY DEFINER invite preview and redemption RPCs

Files:
- `supabase/migrations/20260703000100_fix_invite_join_rpc.sql`
- `app/lib/database.types.ts`
- `app/join/[token]/page.tsx`
- `app/join/[token]/JoinAlignmentClient.tsx`
- `app/api/alignment/join/route.ts`

Plan:
1. Use SECURITY DEFINER RPCs, not service-role route code, for the core fix. Keep `alignment_invitations` and `alignment_participants` RLS strict; do not add an anon SELECT policy to `alignment_invitations`, and do not loosen `participants_insert_creator`. The service-role alternative is easier to type in the API route, but it moves broad database authority into application code and still needs a database transaction or RPC for concurrent single-use claims. A narrow RPC gives the token bearer only the fields the function returns, uses `auth.uid()` for the joining user, locks the invite row, checks existing participation before usage, increments usage and inserts the participant in one transaction, and keeps the route as request validation plus error mapping.
2. Add this full migration:

```sql
-- SECURITY DEFINER invite preview and redemption for token join flow.
-- Keeps table RLS locked down while exposing narrow token-bearing operations.

drop function if exists public.get_alignment_invite_preview(text);

create function public.get_alignment_invite_preview(p_token_hash text)
returns table (
  status text,
  title text,
  creator_name text,
  expires_at timestamptz,
  already_participant boolean,
  redirect_alignment_id uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invite record;
  v_user_id uuid := auth.uid();
  v_already_participant boolean := false;
begin
  select
    ai.id,
    ai.alignment_id,
    ai.expires_at,
    ai.max_uses,
    ai.current_uses,
    ai.invalidated_at,
    a.title,
    a.status as alignment_status,
    coalesce(pr.display_name, 'Someone') as creator_name
  into v_invite
  from public.alignment_invitations ai
  join public.alignments a on a.id = ai.alignment_id
  left join public.profiles pr on pr.id = a.created_by
  where ai.token_hash = p_token_hash
  limit 1;

  if not found then
    return query select 'not_found'::text, null::text, null::text, null::timestamptz, false, null::uuid;
    return;
  end if;

  if v_user_id is not null then
    select exists (
      select 1
      from public.alignment_participants ap
      where ap.alignment_id = v_invite.alignment_id
        and ap.user_id = v_user_id
    )
    into v_already_participant;
  end if;

  -- Existing participants get an idempotent redirect even after a single-use link is consumed.
  if v_already_participant then
    return query select
      'already_participant'::text,
      coalesce(v_invite.title, 'Alignment')::text,
      v_invite.creator_name::text,
      v_invite.expires_at,
      true,
      v_invite.alignment_id;
    return;
  end if;

  if v_invite.invalidated_at is not null then
    return query select 'revoked'::text, null::text, null::text, null::timestamptz, false, null::uuid;
    return;
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at <= now() then
    return query select 'expired'::text, null::text, null::text, null::timestamptz, false, null::uuid;
    return;
  end if;

  if v_invite.alignment_status = 'complete' then
    return query select 'closed'::text, null::text, null::text, null::timestamptz, false, null::uuid;
    return;
  end if;

  if v_invite.max_uses is not null
     and coalesce(v_invite.current_uses, 0) >= v_invite.max_uses then
    return query select 'used'::text, null::text, null::text, null::timestamptz, false, null::uuid;
    return;
  end if;

  -- Anonymous/non-participant preview contract: title, creator name, expiration only.
  -- No description, current/max uses, alignment id, status, participant list, or creator id.
  return query select
    'valid'::text,
    coalesce(v_invite.title, 'Alignment')::text,
    v_invite.creator_name::text,
    v_invite.expires_at,
    false,
    null::uuid;
end;
$$;

revoke all on function public.get_alignment_invite_preview(text) from public;
grant execute on function public.get_alignment_invite_preview(text) to anon, authenticated;

drop function if exists public.redeem_alignment_invite(text);

create function public.redeem_alignment_invite(p_token_hash text)
returns table (
  ok boolean,
  code text,
  alignment_id uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invite record;
  v_user_id uuid := auth.uid();
  v_existing_participant boolean := false;
begin
  if v_user_id is null then
    return query select false, 'unauthorized'::text, null::uuid;
    return;
  end if;

  select
    ai.id,
    ai.alignment_id,
    ai.expires_at,
    ai.max_uses,
    ai.current_uses,
    ai.invalidated_at,
    a.status as alignment_status
  into v_invite
  from public.alignment_invitations ai
  join public.alignments a on a.id = ai.alignment_id
  where ai.token_hash = p_token_hash
  for update of ai;

  if not found then
    return query select false, 'not_found'::text, null::uuid;
    return;
  end if;

  select exists (
    select 1
    from public.alignment_participants ap
    where ap.alignment_id = v_invite.alignment_id
      and ap.user_id = v_user_id
  )
  into v_existing_participant;

  -- Idempotency must happen before usage-limit rejection.
  if v_existing_participant then
    return query select true, 'already_participant'::text, v_invite.alignment_id;
    return;
  end if;

  if v_invite.invalidated_at is not null then
    return query select false, 'revoked'::text, null::uuid;
    return;
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at <= now() then
    return query select false, 'expired'::text, null::uuid;
    return;
  end if;

  if v_invite.alignment_status = 'complete' then
    return query select false, 'closed'::text, null::uuid;
    return;
  end if;

  if v_invite.max_uses is not null
     and coalesce(v_invite.current_uses, 0) >= v_invite.max_uses then
    return query select false, 'used'::text, null::uuid;
    return;
  end if;

  begin
    insert into public.alignment_participants (alignment_id, user_id, role)
    values (v_invite.alignment_id, v_user_id, 'partner');

    update public.alignment_invitations
    set
      current_uses = coalesce(current_uses, 0) + 1,
      updated_at = now()
    where id = v_invite.id;
  exception
    when unique_violation then
      -- If another path added this same user while we were joining, treat it as success
      -- and do not count a second invite use.
      return query select true, 'already_participant'::text, v_invite.alignment_id;
      return;
  end;

  return query select true, 'joined'::text, v_invite.alignment_id;
end;
$$;

revoke all on function public.redeem_alignment_invite(text) from public;
grant execute on function public.redeem_alignment_invite(text) to authenticated;

-- The join route should stop calling these legacy helpers. Remove direct app access
-- because any authenticated caller with an invite UUID can otherwise mutate usage.
revoke execute on function public.increment_invite_usage(uuid) from authenticated;
revoke execute on function public.decrement_invite_usage(uuid) from authenticated;
```

3. Update `app/lib/database.types.ts` `Functions` with:
   - `get_alignment_invite_preview`: args `{ p_token_hash: string }`, returns an array of `{ status: string; title: string | null; creator_name: string | null; expires_at: string | null; already_participant: boolean; redirect_alignment_id: string | null }`.
   - `redeem_alignment_invite`: args `{ p_token_hash: string }`, returns an array of `{ ok: boolean; code: string; alignment_id: string | null }`.
4. Rewrite `app/join/[token]/page.tsx` to call `get_alignment_invite_preview` after the existing 43-character format check. Keep using `createServerClient()` so auth cookies are present when available. Do not query `alignment_invitations` directly. Map status codes as follows: `not_found` -> Invitation Not Found; `revoked` -> Invitation Revoked; `expired` -> Invitation Expired; `used` -> Invitation Limit Reached; `closed` -> Alignment Completed; `already_participant` -> redirect to `/alignment/${redirect_alignment_id}`. Only render the invite card for `valid`, and pass only `{ title, creatorName }` plus expiration text into the client component.
5. Update `app/join/[token]/JoinAlignmentClient.tsx` so the preview prop no longer includes `alignment.id` or `description`. On successful POST, use `data.alignment_id` from `/api/alignment/join` and route to `/alignment/${data.alignment_id}` instead of `/alignment/${alignment.id}/clarity`; the top-level alignment router already sends users to the correct phase at `app/alignment/[id]/page.tsx:36-55`.
6. Rewrite `app/api/alignment/join/route.ts` after token validation to call `redeem_alignment_invite` with the hash. Remove the direct invitation SELECT, participant SELECT, `increment_invite_usage`, manual participant insert, and `decrement_invite_usage` rollback. Map `joined` and `already_participant` to 200 success with `alignment_id`; map `not_found`, `revoked`, `expired`, `used`, and `closed` to the existing user-facing validation/alignment errors. Keep the IP rate limit and `requireAuth()` before the RPC.

Risk:
- SECURITY DEFINER functions can become privilege-escalation bugs if they return too much or accept a user id parameter. This version returns a fixed narrow shape, derives the user from `auth.uid()`, grants preview only to `anon/authenticated`, grants redemption only to `authenticated`, and keeps raw tokens out of SQL and logs.
- The migration revokes app access to the old usage helpers; verify no remaining code calls `increment_invite_usage` or `decrement_invite_usage` after the route rewrite.
- Verify with `npm run type-check`, `npm run lint`, a local migration reset/apply, and a two-browser manual flow: anonymous `/join/<token>` shows title/creator only, logged-in partner joins once, `current_uses` becomes 1, refreshing the same consumed link as that partner redirects into the alignment, and a third user opening the same single-use token sees the usage-limit state.

### [P0] Preserve signup redirectTo through confirmation

Files:
- `app/(auth)/signup/page.tsx`
- `app/(auth)/signup/actions.ts`
- `app/auth/callback/route.ts`

Plan:
1. In `app/(auth)/signup/page.tsx`, mirror login: import `useSearchParams`, read `const redirectTo = searchParams.get('redirectTo')`, and add `<input type="hidden" name="redirectTo" value={redirectTo} />` inside the `<form>` when present. Also preserve the return URL on the "Already have an account?" link by rendering `/login?redirectTo=${encodeURIComponent(redirectTo)}` when `redirectTo` exists.
2. In `app/(auth)/signup/actions.ts`, copy the same safe relative-path guard used by login at `app/(auth)/login/actions.ts:33-46`:

```ts
function isSafeRedirectPath(dest: string | null | undefined): dest is string {
  return (
    !!dest &&
    dest.startsWith('/') &&
    !dest.startsWith('//') &&
    !dest.startsWith('/\\')
  );
}
```

3. In `signupAction`, read `const redirectTo = formData.get('redirectTo') as string | null;` after the existing form fields. Compute `const destination = isSafeRedirectPath(redirectTo) ? redirectTo : '/dashboard';` before `supabase.auth.signUp`.
4. Change signup `emailRedirectTo` from plain `/auth/callback` to the callback with a safe `next`:

```ts
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const callbackUrl = new URL('/auth/callback', appUrl);
callbackUrl.searchParams.set('next', destination);

const { data: authData, error: authError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { display_name: username },
    emailRedirectTo: callbackUrl.toString(),
  },
});
```

5. Change the immediate-session branch from `redirect('/dashboard')` to `redirect(destination)`.
6. In `app/auth/callback/route.ts`, harden the existing token-hash destination resolution against the custom auth-email hook wrapping a callback URL inside `redirect_to`. Add a helper after `resolveSafeDestination`:

```ts
function unwrapCallbackDestination(destination: string, requestUrl: URL): string {
  const nested = new URL(destination, requestUrl.origin);
  if (nested.pathname !== '/auth/callback') return destination;

  const nestedNext = resolveSafeDestination(nested.searchParams.get('next'), requestUrl);
  return nestedNext ?? '/dashboard';
}
```

Then wrap the successful token-hash branch destination before redirect:

```ts
const destination =
  resolveSafeDestination(next, requestUrl) ??
  resolveSafeDestination(redirectToParam, requestUrl) ??
  (type === 'recovery' ? '/auth/reset-password' : '/dashboard');
return NextResponse.redirect(new URL(unwrapCallbackDestination(destination, requestUrl), request.url));
```

The PKCE code branch already honors `next` at `app/auth/callback/route.ts:96-108`, so this covers both default Supabase confirmation and the custom token-hash email hook.

Risk:
- The risk is an open redirect if signup accepts arbitrary URLs. Keep the same single-leading-slash guard as login, and test `/signup?redirectTo=//evil.example`, `/signup?redirectTo=/\\evil.example`, and `/signup?redirectTo=/join/<token>`.
- Confirmation behavior differs depending on whether Supabase hosted templates or the custom auth-email hook sends the message. Verify both shapes if possible: `/auth/callback?code=...&next=/join/<token>` and `/auth/callback?token_hash=...&type=signup&redirect_to=<encoded /auth/callback?next=/join/token>`.

### [P1] Mount creator invite UI in the create flow

Files:
- `app/alignment/[id]/clarity/page.tsx`
- `app/alignment/[id]/clarity/ClarityForm.tsx`
- `app/alignment/[id]/waiting/page.tsx`
- `app/alignment/[id]/waiting/waiting-client.tsx`
- `components/alignment/InviteStatus.tsx`

Plan:
1. Make the share surface creator-only. In `app/alignment/[id]/clarity/page.tsx`, pass `isCreator={alignment.created_by === user.id}` into `ClarityForm`. In `app/alignment/[id]/waiting/page.tsx`, pass the same `isCreator` boolean into `WaitingClient`.
2. Update `ClarityFormProps` with `isCreator: boolean`. Import `InviteStatus` from `@/components/alignment/InviteStatus`. Mount `<InviteStatus alignmentId={alignmentId} />` only when `isCreator` is true. Exact placement: inside the main `space-y-4 px-4` stack, immediately after the "Who are you aligning with?" accordion closes at `app/alignment/[id]/clarity/ClarityForm.tsx:732` and before the "What does success look like?" accordion starts at `app/alignment/[id]/clarity/ClarityForm.tsx:734`. This puts the token link next to the partner-selection moment, before the creator advances.
3. Update `WaitingClientProps` with `isCreator: boolean`. Import `ShareLinkButton` from `@/components/alignment/ShareLinkButton`. Mount `<ShareLinkButton alignmentId={alignmentId} />` below the status cards, only when `isCreator && !partnerJoined && !partnerSubmitted`. Exact placement: after the status-card container ends at `app/alignment/[id]/waiting/waiting-client.tsx:213` and before the connection status at `app/alignment/[id]/waiting/waiting-client.tsx:215`. This directly supports the existing "Share the invite link with your partner" copy at `app/alignment/[id]/waiting/waiting-client.tsx:202-206`.
4. Make `InviteStatus` live, since it will now be visible. Import `useCallback` and `useAlignmentUpdates`. Wrap `fetchParticipants` in `useCallback`, call it on mount, and call it from `onPartnerJoin` so the component moves from waiting to joined without refresh. Add a `visibilitychange` listener that refetches when the tab becomes visible as the fallback path.
5. Do not show `InviteStatus` or `ShareLinkButton` to joined partners. The invite endpoints at `app/api/alignment/[id]/invite/route.ts:44-50` and `app/api/alignment/[id]/generate-invite/route.ts:72-78` are creator-only, so mounting them for a partner would produce avoidable 403s.

Risk:
- The UI can duplicate status if `InviteStatus` and `WaitingClient` both render waiting cards in the same view. Use `InviteStatus` on clarity and bare `ShareLinkButton` on waiting to avoid redundant status cards.
- Realtime may not fire in local/dev. Verify the fallback by joining in a second browser, then returning focus to the creator tab; `InviteStatus` should refetch and show Partner Joined. Also verify the creator can generate/copy/regenerate on clarity before submitting, and can still share from waiting after submitting if the partner has not joined.
