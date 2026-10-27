-- Shared sliding-window rate limit for serverless instances.
-- The app calls consume_rate_limit with the service role. Callers cannot.

create table public.rate_limit_hits (
  id bigint generated always as identity primary key,
  bucket_key text not null,
  hit_at timestamptz not null
);

create index rate_limit_hits_bucket_key_hit_at_idx
  on public.rate_limit_hits (bucket_key, hit_at);

create index rate_limit_hits_hit_at_idx
  on public.rate_limit_hits (hit_at);

alter table public.rate_limit_hits enable row level security;

revoke all on table public.rate_limit_hits from public, anon, authenticated;
grant select, insert, delete on table public.rate_limit_hits to service_role;

comment on table public.rate_limit_hits is
  'Hits for consume_rate_limit. Keys are SHA-256 hex from the app. Service role only.';

create or replace function public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_ms integer
)
returns table (ok boolean, retry_after integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window interval;
  v_count integer;
  v_oldest timestamptz;
  v_retry_seconds numeric;
begin
  if p_key is null or char_length(p_key) < 1 or char_length(p_key) > 200 then
    raise exception 'invalid rate limit key';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 100000 then
    raise exception 'invalid rate limit';
  end if;
  if p_window_ms is null or p_window_ms < 1000 or p_window_ms > 86400000 then
    raise exception 'invalid rate limit window';
  end if;

  v_window := make_interval(secs => p_window_ms / 1000.0);

  -- Serializes callers of this key across pooled connections. Released at commit.
  perform pg_advisory_xact_lock(hashtextextended(p_key, 0));

  delete from public.rate_limit_hits
  where bucket_key = p_key
    and hit_at <= v_now - v_window;

  select count(*)::integer, min(hit_at)
    into v_count, v_oldest
  from public.rate_limit_hits
  where bucket_key = p_key;

  if coalesce(v_count, 0) >= p_limit then
    v_retry_seconds := extract(epoch from (v_oldest + v_window - v_now));
    return query
      select false, greatest(1, ceil(v_retry_seconds)::integer);
    return;
  end if;

  insert into public.rate_limit_hits (bucket_key, hit_at)
  values (p_key, v_now);

  -- One-off keys (a single IP, then never again) would otherwise linger.
  if random() < 0.02 then
    delete from public.rate_limit_hits
    where ctid in (
      select ctid
      from public.rate_limit_hits
      where hit_at < v_now - interval '1 day'
      limit 200
    );
  end if;

  return query select true, 0;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

comment on function public.consume_rate_limit(text, integer, integer) is
  'Records one hit unless the sliding window is full. One row: ok, retry_after seconds.';

notify pgrst, 'reload schema';
