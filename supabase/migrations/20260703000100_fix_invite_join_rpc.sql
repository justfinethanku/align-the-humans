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
