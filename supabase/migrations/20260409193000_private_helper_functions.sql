-- Restricted helper functions for Edge Functions that need app_private data.
-- These helpers keep app_private tables unexposed to browser clients while
-- allowing the service-role client inside Edge Functions to read and write the
-- required data safely through SECURITY DEFINER functions.

create or replace function public.get_exam_access_password_hash(target_exam_id uuid)
returns text
language sql
security definer
set search_path = public, app_private, pg_temp
as $$
  select exam_access.password_hash
  from app_private.exam_access
  where exam_access.exam_id = target_exam_id
  limit 1;
$$;

create or replace function public.list_exam_answer_records(target_exam_id uuid)
returns table (
  question_id uuid,
  correct_answer jsonb,
  explanation text
)
language sql
security definer
set search_path = public, app_private, pg_temp
as $$
  select
    answers_library.question_id,
    answers_library.correct_answer,
    answers_library.explanation
  from app_private.answers_library
  inner join public.questions on questions.id = answers_library.question_id
  where questions.exam_id = target_exam_id
  order by questions.order_index asc;
$$;

create or replace function public.create_exam_access_record(
  target_exam_id uuid,
  target_password_hash text
)
returns void
language sql
security definer
set search_path = public, app_private, pg_temp
as $$
  insert into app_private.exam_access (exam_id, password_hash)
  values (target_exam_id, target_password_hash);
$$;

create or replace function public.upsert_answer_record(
  target_question_id uuid,
  target_correct_answer jsonb,
  target_explanation text
)
returns void
language sql
security definer
set search_path = public, app_private, pg_temp
as $$
  insert into app_private.answers_library (
    question_id,
    correct_answer,
    explanation
  )
  values (
    target_question_id,
    target_correct_answer,
    target_explanation
  )
  on conflict (question_id) do update
  set
    correct_answer = excluded.correct_answer,
    explanation = excluded.explanation;
$$;

revoke all on function public.get_exam_access_password_hash(uuid) from public;
revoke all on function public.list_exam_answer_records(uuid) from public;
revoke all on function public.create_exam_access_record(uuid, text) from public;
revoke all on function public.upsert_answer_record(uuid, jsonb, text) from public;

grant execute on function public.get_exam_access_password_hash(uuid) to service_role;
grant execute on function public.list_exam_answer_records(uuid) to service_role;
grant execute on function public.create_exam_access_record(uuid, text) to service_role;
grant execute on function public.upsert_answer_record(uuid, jsonb, text) to service_role;
