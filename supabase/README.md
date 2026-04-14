# Supabase Directory

This directory contains the database, function, and local-stack assets required for the backend of the exam system.

## Contents

- `migrations/`
  - Ordered SQL files that define the schema, RLS rules, helper RPCs, password helper functions, and exam CLI support columns.
- `functions/`
  - Supabase Edge Functions used by both student and admin flows.
- `seed.sql`
  - Demo seed data for local development and testing.
- `config.toml`
  - Local Supabase project configuration.

## CLI Integration Note

The repository-local exam CLI does not write to `app_private` tables directly.

Instead it uses:

- public tables such as `public.exams` and `public.questions`
- helper RPCs such as:
  - `upsert_answer_record(...)`
  - `upsert_exam_access_password_hash(...)`

This keeps the CLI aligned with the same private-data boundaries already used by the live app.

## Migration Rule

Do not edit a previously applied migration in a live environment unless you are intentionally rewriting history for a disposable local stack.

Prefer creating a new migration for every schema or RPC change.
