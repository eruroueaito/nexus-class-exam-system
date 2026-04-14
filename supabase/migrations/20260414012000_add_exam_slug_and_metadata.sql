-- Add stable content identifiers and portable metadata for exam bundle imports.
-- The CLI uses slug as the stable external identifier and metadata as a safe
-- expansion surface for non-sensitive exam-level content settings.

alter table public.exams
add column if not exists slug text,
add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.exams
set slug = trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g'))
where slug is null;

alter table public.exams
alter column slug set not null;

create unique index if not exists exams_slug_key
  on public.exams (slug);
