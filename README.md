# Nexus Class Exam System

Agent-oriented migration and operations guide for a static GitHub Pages frontend backed by Supabase.

This repository contains a production-style online exam system with:

- a static React frontend in [`web/`](web/)
- a Supabase project in [`supabase/`](supabase/)
- a Git-tracked exam content layer in [`content/exams/`](content/exams/)
- a repository-local exam CLI in [`tools/exam-cli/`](tools/exam-cli/)
- architecture and execution notes in [`docs/`](docs/)

The system is intentionally split so that:

- public GitHub Pages only renders UI and calls APIs
- all sensitive exam logic runs through Supabase Edge Functions
- answers and password hashes never live in public tables
- exam content is reviewed in YAML before it is imported into Supabase

## Who This README Is For

This document is written for another AI agent or engineer who forks this repository and needs to make it run in a brand-new environment with no inherited local setup.

If you are taking over the project, read these in order:

1. [`README.md`](README.md)
2. [`docs/agent-migration-guide.md`](docs/agent-migration-guide.md)
3. [`docs/online-exam-system-development-plan.md`](docs/online-exam-system-development-plan.md)
4. [`progress.md`](progress.md)
5. [`findings.md`](findings.md)

## What Is Decoupled vs What Must Be Rewritten

### Decoupled and portable

These parts should migrate with little or no redesign:

- React application structure
- student flow UI
- admin dashboard and editor UI
- Supabase SQL migrations
- RLS strategy
- helper RPC pattern for private schema access
- Edge Function contracts:
  - `start-exam`
  - `submit-exam`
  - `load-exam-draft`
  - `save-exam-draft`
  - `create-exam-draft`
  - `delete-exam-draft`
- GitHub Pages workflow shape

### Environment-bound and must be replaced after a fork

These parts are not portable and must be reconfigured:

- Supabase project URL
- Supabase publishable key
- Supabase service-role / secret key usage in server environments
- GitHub repository name and Pages base path
- GitHub repository variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- admin user bootstrap
- exam seed data, if you do not want the demo data
- any live passwords and any analytics history

## Minimum Prerequisites

### Required accounts

- GitHub account
- Supabase account

### Required local tools

- Node.js 22+
- npm
- Docker Desktop
- Supabase CLI

### Optional but supported

- Codex / Claude / agent environment with Supabase MCP access

## Fast Migration Checklist

If you need the shortest safe path after a fork:

1. Create a new Supabase project.
2. Apply all SQL migrations from [`supabase/migrations/`](supabase/migrations/).
3. Deploy all Edge Functions from [`supabase/functions/`](supabase/functions/).
4. Seed the database using [`supabase/seed.sql`](supabase/seed.sql) or replace it with your own data.
5. Create an admin user in Supabase Auth and set `app_metadata.role = "admin"`.
6. Set GitHub repository variables for `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
7. Enable GitHub Pages and push to `main`.
8. Verify:
   - student exam list loads
   - access password works
   - submit flow returns explanations
   - admin login works
   - admin editor saves exam content
9. Configure GitHub Actions secrets for exam bundle sync:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Repository Layout

```text
.
├── docs/
│   ├── agent-migration-guide.md
│   ├── exam-cli-operator-guide.md
│   ├── exam-content-schema.md
│   ├── exam-generation-prompt-contract.md
│   ├── local-supabase-development.md
│   ├── online-exam-system-development-plan.md
│   └── reference/
├── content/
│   └── exams/
├── supabase/
│   ├── functions/
│   ├── migrations/
│   └── seed.sql
├── tools/
│   └── exam-cli/
├── web/
│   ├── src/
│   ├── tests/
│   └── vite.config.ts
├── task_plan.md
├── findings.md
└── progress.md
```

## Directory Guides

These directory-level guides exist so a new maintainer or agent can open a folder and immediately understand its purpose:

- [`docs/README.md`](docs/README.md)
- [`docs/reference/README.md`](docs/reference/README.md)
- [`docs/test-data/README.md`](docs/test-data/README.md)
- [`content/exams/README.md`](content/exams/README.md)
- [`supabase/README.md`](supabase/README.md)
- [`supabase/migrations/README.md`](supabase/migrations/README.md)
- [`supabase/functions/README.md`](supabase/functions/README.md)
- [`supabase/functions/_shared/README.md`](supabase/functions/_shared/README.md)
- [`web/src/README.md`](web/src/README.md)
- [`web/tests/README.md`](web/tests/README.md)

## Exam Content Workflow

The recommended workflow for new exam sets is now:

1. Ask the AI to draft an English-only exam bundle.
2. Save the bundle under [`content/exams/`](content/exams/).
3. Run:
   - `npm run exam -- validate <bundle>`
   - `npm run exam -- preview <bundle>`
   - `npm run exam -- review <bundle>`
4. Review the generated YAML and review summary.
5. Push the approved bundle to `main`.
6. Let GitHub Actions run [`sync-exam-bundles.yml`](.github/workflows/sync-exam-bundles.yml) to apply and publish the bundle remotely.

Supporting docs:

- [`docs/exam-cli-spec.md`](docs/exam-cli-spec.md)
- [`docs/exam-content-schema.md`](docs/exam-content-schema.md)
- [`docs/exam-cli-operator-guide.md`](docs/exam-cli-operator-guide.md)
- [`docs/exam-generation-prompt-contract.md`](docs/exam-generation-prompt-contract.md)

## Security Model Summary

- The frontend uses only the Supabase publishable key.
- Password hashes live in `app_private.exam_access`.
- Correct answers live in `app_private.answers_library`.
- The browser never reads those tables directly.
- Edge Functions use service-role credentials server-side.
- Private table access from functions is routed through `public` helper RPCs.
- The exam CLI uses a trusted service-role client only in local tooling or GitHub Actions, never in the browser.

## Password Control Boundary

The admin editor supports password rotation, not password readback.

That is intentional:

- plaintext passwords are never stored in public tables
- the current password is not recoverable from the hash
- the UI therefore allows “set a new password and save” rather than “show current password”

## Migration Detail

The full migration playbook is here:

- [`docs/agent-migration-guide.md`](docs/agent-migration-guide.md)

## Local Development

For local Supabase usage, read:

- [`docs/local-supabase-development.md`](docs/local-supabase-development.md)

## Current Known Non-Blocking Issues

- Frontend bundle size is still larger than ideal.
- Some admin secure-load flows still fall back to local mock data if the remote function call fails.
- The first exam CLI version still relies on AI conversation flow for semantic question generation; the CLI currently owns deterministic validation, preview, review, import, publish, and Git-oriented delivery steps.

## Current Demo Expectations

The in-repo seed currently includes multiple economics exams and uses `123` as the demo access password. Replace demo data before real deployment.
