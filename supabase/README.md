# Supabase Directory

This directory contains the database, function, and local-stack assets required for the backend of the exam system.

## Contents

- `migrations/`
  - Ordered SQL files that define the schema, RLS rules, helper RPCs, and password helper functions.
- `functions/`
  - Supabase Edge Functions used by both student and admin flows.
- `seed.sql`
  - Demo seed data for local development and testing.
- `config.toml`
  - Local Supabase project configuration.

## Migration Rule

Do not edit a previously applied migration in a live environment unless you are intentionally rewriting history for a disposable local stack.

Prefer creating a new migration for every schema or RPC change.
