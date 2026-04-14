# Supabase Migrations

This directory stores ordered SQL migrations for the backend database.

## What Belongs Here

- schema creation
- table changes
- indexes
- RLS policies
- helper RPC functions
- grants and revokes

## Key Design Constraints

- Public exam metadata may live in `public`.
- Password hashes and correct answers must remain outside publicly readable tables.
- Helper RPCs in `public` are used to bridge Edge Functions to `app_private` safely.

## Important Existing Migration Themes

- Initial schema creation
- RLS and `exam_catalog`
- private helper RPCs
- password hash upsert helper
- exam CLI support fields such as stable `slug` and portable `metadata`

## Newer CLI-Oriented Migration

- `20260414012000_add_exam_slug_and_metadata.sql`
  - adds `public.exams.slug`
  - adds `public.exams.metadata`
  - backfills slug values for existing rows
  - creates a unique index for slug-based content sync

## Working Rule

Create new migrations in chronological order. Do not pack unrelated changes into a single migration when the changes represent separate deployment events.
