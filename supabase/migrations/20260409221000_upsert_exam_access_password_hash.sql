-- Allow service-role Edge Functions to rotate exam access passwords without
-- exposing app_private.exam_access to browser clients or the public Data API.

create or replace function public.upsert_exam_access_password_hash(
  target_exam_id uuid,
  target_password_hash text
)
returns void
language sql
security definer
set search_path = public, app_private, pg_temp
as $$
  insert into app_private.exam_access (
    exam_id,
    password_hash
  )
  values (
    target_exam_id,
    target_password_hash
  )
  on conflict (exam_id) do update
  set
    password_hash = excluded.password_hash,
    updated_at = timezone('utc', now());
$$;

revoke all on function public.upsert_exam_access_password_hash(uuid, text) from public;
grant execute on function public.upsert_exam_access_password_hash(uuid, text) to service_role;
