# Frontend Source

This directory contains the production frontend source for the GitHub Pages application.

## Top-Level Structure

- `app/`
  - Router and providers.
- `features/`
  - Feature-oriented modules such as shell, auth, admin, and exams.
- `lib/`
  - Shared runtime helpers such as environment parsing and Supabase client setup.
- `test/`
  - Test setup glue for Vitest and Testing Library.

## Design Rule

Feature code should stay modular:

- UI components and pages stay in feature folders.
- Browser-to-backend contracts stay in feature API modules.
- Generic runtime helpers stay in `lib/`.

Avoid pushing feature-specific state back into generic root-level files.
