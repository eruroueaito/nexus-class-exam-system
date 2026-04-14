# Progress Log

## Current Status

- Project state: production-capable MVP with active GitHub Pages + Supabase integration
- Frontend status: student flow, admin auth flow, analytics, exam editor, and password rotation UI are implemented
- Backend status: Supabase schema, RLS, helper RPCs, and Edge Functions are implemented
- Deployment status: GitHub Pages workflow is configured; Supabase migrations and functions exist in-repo
- Content operations status: repository-local exam CLI v1 scaffolding is implemented for validation, preview, review, import planning, publish control, and pipeline gating

## Completed Milestones

### 1. Architecture and Planning
- Wrote the main implementation document in [docs/online-exam-system-development-plan.md](docs/online-exam-system-development-plan.md).
- Established file-based planning in:
  - [task_plan.md](task_plan.md)
  - [findings.md](findings.md)
  - [progress.md](progress.md)
- Recorded the Apple-style prototype as the visual baseline in [docs/reference/nexus-class-prototype.html](docs/reference/nexus-class-prototype.html).

### 2. Database and Security Foundation
- Created the base schema migrations for:
  - `public.exams`
  - `public.questions`
  - `public.submissions`
  - `public.submission_items`
  - `app_private.exam_access`
  - `app_private.answers_library`
- Added RLS, grants, and the public `exam_catalog` view.
- Added helper RPC migrations to avoid direct `app_private` access from Edge Functions.
- Added the password-rotation helper RPC:
  - `public.upsert_exam_access_password_hash(...)`

### 3. Student Experience
- Implemented the student assignment list, access modal, quiz flow, submission flow, and result page.
- Unified seeded exam passwords to `123`.
- Removed the extra “Student Access” landing layer so students enter directly through the assignment list.
- Fixed the result-page P0 where explanations existed in the payload but were hidden by the nested scroll layout.
- Fixed the homepage progress bar so it only appears after the student enters an exam.

### 4. Admin Experience
- Implemented admin login with Supabase Auth and `app_metadata.role === 'admin'`.
- Implemented the admin dashboard with:
  - exam switching
  - summary cards
  - score distribution
  - question heat drill-down
- Implemented the exam editor with:
  - question CRUD
  - option editing
  - publish/unpublish
  - delete exam
  - password rotation input
- Added a safe password UX boundary:
  - the current plaintext password is never shown again after hashing
  - the editor only supports password rotation, not password readback

### 5. Deployment and Production Integration
- Added GitHub Pages deployment workflow in [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml).
- Configured Vite base-path support in [web/vite.config.ts](web/vite.config.ts).
- Verified the live frontend uses:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- Verified the live backend returns explanation-bearing `submit-exam` payloads.

### 6. Exam CLI v1
- Added a root-level Node.js + TypeScript CLI runtime with:
  - `npm run exam -- validate`
  - `npm run exam -- preview`
  - `npm run exam -- review`
  - `npm run exam -- sync-bundles` as a CI-only internal command
- Added the YAML bundle schema and operator docs:
  - [docs/exam-content-schema.md](docs/exam-content-schema.md)
  - [docs/exam-cli-operator-guide.md](docs/exam-cli-operator-guide.md)
  - [docs/exam-generation-prompt-contract.md](docs/exam-generation-prompt-contract.md)
- Added example content:
  - [content/exams/examples/intro-macro-quiz-01.yaml](content/exams/examples/intro-macro-quiz-01.yaml)
  - [content/exams/examples/intro-macro-quiz-01.review.md](content/exams/examples/intro-macro-quiz-01.review.md)
- Added the schema extension migration:
  - [supabase/migrations/20260414012000_add_exam_slug_and_metadata.sql](supabase/migrations/20260414012000_add_exam_slug_and_metadata.sql)

### 7. GitHub Actions Sync Mode
- Added the GitHub Actions workflow:
  - [.github/workflows/sync-exam-bundles.yml](.github/workflows/sync-exam-bundles.yml)
- Added the CI-oriented command:
  - `npm run exam -- sync-bundles <bundle...>`
- Limited automatic syncing to `content/exams/*.yaml` so example files do not trigger production writes.
- Added an explicit secrets preflight for:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Removed the documented local remote-write path:
  - deleted local `full-pipeline`
  - deleted the local env template for remote writes
  - restricted `sync-bundles` to GitHub Actions only

## Password Chain Audit

### Secure Path
1. Admin enters a new password in the editor.
2. Frontend sends `access_password` to `save-exam-draft`.
3. Edge Function validates admin auth, then uses the service-role client.
4. Shared service hashes the plaintext with SHA-256.
5. Service calls `public.upsert_exam_access_password_hash(...)`.
6. Student `start-exam` calls `public.get_exam_access_password_hash(...)`.
7. Student plaintext password is hashed and compared server-side.

### Verified Guarantees
- Plaintext passwords are not stored in `public.exams`.
- Plaintext passwords are not returned by `load-exam-draft`.
- Password rotation is preserved by tests in:
  - [web/tests/exam-service.test.ts](web/tests/exam-service.test.ts)

## Key Verification Evidence

### Local Quality Gates
- `cd web && npm test` passes
- `cd web && npm run build` passes
- `npm test` passes for exam CLI tests
- `npm run exam -- validate content/exams/examples/intro-macro-quiz-01.yaml` passes
- `npm run exam -- preview content/exams/examples/intro-macro-quiz-01.yaml` passes
- `npm run exam -- review content/exams/examples/intro-macro-quiz-01.yaml` passes
- `npm run exam -- sync-bundles ...` now fails locally with a GitHub-Actions-only guard, which confirms the remote-write boundary is no longer exposed through the public local CLI path

### Targeted Regressions Locked
- Homepage progress bar is hidden on the assignment list and appears only after entering an exam.
- Saving a new access password invalidates the old password in the shared service tests.
- Student result-page explanation rendering remains covered by the shell page tests.

### Production-Side Evidence
- `submit-exam` for the live Game Theory exam returns `items` plus `explanation` text.
- Hosted bundle contains the configured hosted Supabase URL and publishable key.

## Current Risks / Non-Blocking Follow-Ups

- Bundle size warning remains during Vite production build.
- Admin secure-load flow still uses a local fallback when function invocation fails; this is usable for development but not ideal for strict production observability.
- End-to-end remote admin password rotation smoke testing still depends on a valid admin login credential, not just the admin email.
- CLI v1 does not embed a standalone LLM provider. AI-generated exam drafting remains conversation-driven; the local CLI owns deterministic validation, preview, and review, while GitHub Actions owns import and publish synchronization.
- GitHub Actions sync mode still requires repository secrets to be configured before the first real production bundle push.

## Important Files

- Main design and implementation doc:
  - [docs/online-exam-system-development-plan.md](docs/online-exam-system-development-plan.md)
- Local Supabase setup note:
  - [docs/local-supabase-development.md](docs/local-supabase-development.md)
- Frontend app:
  - [web](web)
- Supabase project:
  - [supabase](supabase)

## Last Significant Update

- Date: 2026-04-10
- Theme: repository documentation sync for the exam CLI era, including content-layer docs, migration notes, and GitHub Actions-based remote exam bundle execution

## 2026-04-14 Content Operation

- Generated a new production bundle at [content/exams/intro-macroeconomics-basics-01.yaml](content/exams/intro-macroeconomics-basics-01.yaml).
- Local CLI verification passed:
  - `npm run exam -- validate content/exams/intro-macroeconomics-basics-01.yaml`
  - `npm run exam -- preview content/exams/intro-macroeconomics-basics-01.yaml`
  - `npm run exam -- review content/exams/intro-macroeconomics-basics-01.yaml`

## 2026-04-14 Workflow Tightening

- Removed the documented local `apply/publish/full-pipeline` release path.
- Kept GitHub Actions as the only supported remote-write boundary for exam bundles.
- Updated the README, operator guide, content guide, design spec, and implementation plan so they all describe the same CI-first publishing model.
