# Frontend Integration-Oriented Tests

This directory stores tests that exercise shared backend-style logic from the frontend workspace.

## Current File

- `exam-service.test.ts`
  - Exercises the shared exam service with an in-memory fake client.

## Why This Exists

The shared exam service lives under `supabase/functions/_shared/`, but it is useful to validate that logic with the frontend test runner because:

- the repository already uses Vitest in `web/`
- the tests are fast
- the tests do not require a live Supabase stack

If additional shared-service tests are added, keep them here unless the project introduces a dedicated backend test runner.
