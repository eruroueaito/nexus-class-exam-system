# Shared Function Utilities

This directory contains modules shared by multiple Supabase Edge Functions.

## Files

- `http.ts`
  - Common response helpers, CORS handling, service-role client creation, and admin session verification.
- `exam-service.ts`
  - Shared business logic for starting exams, submitting exams, loading drafts, saving drafts, and draft lifecycle operations.

## Rule of Use

If a behavior is part of more than one function or represents domain logic rather than HTTP transport logic, it should probably live here.

Keep each function entry point thin and keep exam business rules centralized in `exam-service.ts`.
