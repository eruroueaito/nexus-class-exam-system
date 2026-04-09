-- Access control layer for the online exam system.
-- This migration adds the admin helper, the public exam catalog view, and
-- row-level security policies for the base tables.

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

create or replace view public.exam_catalog
with (security_invoker = true)
as
select
  id,
  title,
  created_at,
  is_active
from public.exams
where is_active = true;

grant select on public.exam_catalog to anon, authenticated;

grant select on public.exams to anon, authenticated;
grant select, insert, update, delete on public.exams to authenticated;
grant select, insert, update, delete on public.questions to authenticated;
grant select, insert, update, delete on public.submissions to authenticated;
grant select, insert, update, delete on public.submission_items to authenticated;

revoke all on schema app_private from public;
revoke all on schema app_private from anon;
revoke all on schema app_private from authenticated;
grant usage on schema app_private to service_role;
grant select, insert, update, delete on all tables in schema app_private to service_role;

alter table public.exams enable row level security;
alter table public.questions enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_items enable row level security;
alter table app_private.exam_access enable row level security;
alter table app_private.answers_library enable row level security;

create policy exams_public_read_active
on public.exams
for select
to anon, authenticated
using (is_active or public.is_admin());

create policy exams_admin_manage
on public.exams
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy questions_admin_manage
on public.questions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy submissions_admin_manage
on public.submissions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy submission_items_admin_manage
on public.submission_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy exam_access_admin_manage
on app_private.exam_access
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy answers_library_admin_manage
on app_private.answers_library
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
