-- Online exam system base schema.
-- This migration creates the public and private tables required by the first
-- implementation slice. Access control policies are added in a follow-up migration.

create extension if not exists pgcrypto;

create schema if not exists app_private;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz not null default timezone('utc', now()),
  is_active boolean not null default true
);

create table app_private.exam_access (
  exam_id uuid primary key references public.exams(id) on delete cascade,
  password_hash text not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_exam_access_updated_at
before update on app_private.exam_access
for each row
execute function public.set_updated_at();

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  content jsonb not null,
  type text not null check (type in ('radio', 'checkbox', 'text')),
  order_index integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table app_private.answers_library (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null unique references public.questions(id) on delete cascade,
  correct_answer jsonb not null,
  explanation text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  user_name text not null,
  score double precision not null check (score >= 0 and score <= 1),
  duration integer not null check (duration >= 0),
  submitted_at timestamptz not null default timezone('utc', now())
);

create table public.submission_items (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  user_answer jsonb not null,
  is_correct boolean not null,
  correct_answer_snapshot jsonb not null,
  explanation_snapshot text not null,
  answered_at timestamptz not null default timezone('utc', now()),
  unique (submission_id, question_id)
);

create index questions_exam_id_order_index_idx
  on public.questions (exam_id, order_index);

create index answers_library_question_id_idx
  on app_private.answers_library (question_id);

create index submissions_exam_id_submitted_at_idx
  on public.submissions (exam_id, submitted_at desc);

create index submission_items_question_id_is_correct_idx
  on public.submission_items (question_id, is_correct);

create index submission_items_submission_id_idx
  on public.submission_items (submission_id);
