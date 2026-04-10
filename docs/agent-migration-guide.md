# Agent Migration Guide

This guide is written for an AI agent that has just forked this repository and must make the system run in a brand-new environment.

Assumption: the new agent has repository access, shell access, and can edit files, but does **not** inherit any of the original Supabase project, local environment, GitHub variables, admin credentials, or MCP setup.

---

## 1. Mission

Your goal is to migrate this repository into a new, working deployment without relying on the original operator's environment.

You must treat the following as external dependencies that need replacement:

- Supabase project
- GitHub repository variables
- admin user account
- live exam data
- any remote MCP registration

---

## 2. System Boundary

### 2.1 What the project already gives you

You inherit:

- frontend source code
- backend SQL migrations
- backend Edge Functions
- test suite
- GitHub Pages workflow
- implementation plan and progress notes

These are reusable and portable.

### 2.2 What you must recreate after a fork

You must recreate or replace:

- a new Supabase project
- a new admin user
- a new GitHub Pages deployment target
- a new set of project-level environment variables
- optionally a new exam seed dataset

These are environment-bound and are not portable from the original deployment.

---

## 3. Repository Files You Must Read First

Read these before changing anything:

1. [`README.md`](../README.md)
2. [`docs/online-exam-system-development-plan.md`](online-exam-system-development-plan.md)
3. [`findings.md`](../findings.md)
4. [`progress.md`](../progress.md)
5. [`docs/local-supabase-development.md`](local-supabase-development.md)

Then inspect:

- [`supabase/migrations/`](../supabase/migrations/)
- [`supabase/functions/`](../supabase/functions/)
- [`web/src/`](../web/src/)
- [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml)

---

## 4. Architecture You Must Preserve

### 4.1 Frontend

- Static React + Vite application
- Deployable to GitHub Pages
- Uses only:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`

### 4.2 Backend

- Supabase Postgres for data
- Supabase Auth for admin login
- Supabase Edge Functions for sensitive operations
- `public` helper RPCs for private-schema access

### 4.3 Security constraints

Do not break these:

- never embed a secret or service-role key in frontend code
- never expose `app_private.exam_access` directly to the browser
- never expose `app_private.answers_library` directly to the browser
- never move access passwords into `public.exams`
- never let students directly query `public.questions`

---

## 5. Required Accounts and Credentials

You need:

- a GitHub account with permission to manage Pages and repository variables
- a Supabase account that can create projects

You will need to obtain or create:

- Supabase project URL
- Supabase publishable key
- Supabase secret/service-role key
- at least one admin email
- a password for that admin account

---

## 6. Required Local Tooling

Install or verify:

- Node.js 22+
- npm
- Docker Desktop
- Supabase CLI

Recommended checks:

```bash
node -v
npm -v
docker --version
npx supabase@2.88.1 --version
```

---

## 7. Supabase Project Bootstrap

### 7.1 Create a new Supabase project

From the Supabase dashboard:

1. Create a new project.
2. Save the following values:
   - project URL
   - publishable key
   - secret key or service-role key

### 7.2 Apply migrations

Apply every SQL file in:

- [`supabase/migrations/`](../supabase/migrations/)

Important migrations include:

- initial schema
- RLS and policies
- helper RPCs for private schema access
- password hash upsert helper

If you are using the Supabase CLI:

```bash
npx supabase@2.88.1 db push
```

If you are using the SQL editor manually:

- apply the migration files in chronological order

### 7.3 Seed demo data

Default seed file:

- [`supabase/seed.sql`](../supabase/seed.sql)

Apply it if you want the current economics demo data and password `123`.

If you do not want demo data:

- replace `supabase/seed.sql`
- keep the same relational model and private answer/password structure

---

## 8. Edge Function Deployment

Deploy these functions:

- `start-exam`
- `submit-exam`
- `load-exam-draft`
- `save-exam-draft`
- `create-exam-draft`
- `delete-exam-draft`

Shared logic lives in:

- [`supabase/functions/_shared/exam-service.ts`](../supabase/functions/_shared/exam-service.ts)
- [`supabase/functions/_shared/http.ts`](../supabase/functions/_shared/http.ts)

### 8.1 Required function secrets

Ensure the deployed functions have access to:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 8.2 Do not regress private-schema access

The production-safe pattern is:

- function code calls `public` helper RPCs
- helper RPCs use `SECURITY DEFINER`
- direct browser access to `app_private` remains blocked

Do **not** switch back to direct `app_private` Data API access from Edge Functions unless you fully rework the exposure model.

---

## 9. Admin User Bootstrap

### 9.1 What the system expects

The admin UI accepts a logged-in Supabase Auth user only if:

- the user exists
- the user can sign in with email + password
- the user's `app_metadata.role` equals `"admin"`

This check is enforced by:

- [`supabase/functions/_shared/http.ts`](../supabase/functions/_shared/http.ts)

### 9.2 How to create the admin user

You need:

- an email address
- a password

Then either:

1. create the user through Supabase Auth UI and later set `app_metadata.role = "admin"`, or
2. create/update the user via an admin API or secure script

### 9.3 Required metadata

The user must end up with:

```json
{
  "role": "admin"
}
```

inside `app_metadata`.

Without that metadata, admin Edge Functions will return `403 admin_required`.

---

## 10. Frontend Environment Configuration

### 10.1 Local development

Copy:

```bash
cp web/.env.example web/.env.local
```

Then set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

### 10.2 GitHub Pages build variables

The Pages workflow expects repository variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

These are read in:

- [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml)

### 10.3 Base path handling

Vite uses:

- `VITE_BASE_PATH`

via:

- [`web/vite.config.ts`](../web/vite.config.ts)

If your forked repository name changes, the GitHub Pages base path changes automatically through the workflow.

---

## 11. GitHub Pages Deployment

### 11.1 Enable Pages

In GitHub repository settings:

1. enable GitHub Pages
2. allow GitHub Actions to deploy Pages

### 11.2 Workflow behavior

On push to `main`, the workflow:

1. checks out the repo
2. installs frontend dependencies
3. runs frontend tests
4. builds with the repository-scoped base path
5. uploads the Pages artifact
6. deploys the site

### 11.3 What must be changed after a fork

Usually nothing in the workflow file itself.

But you must ensure:

- the repository variables are set
- Pages is enabled for the new repo
- `main` is the deployment branch

---

## 12. Password Module: Correct Interpretation

### 12.1 What the admin editor can do

- rotate the exam access password
- save the new password
- leave the field blank to keep the current password

### 12.2 What the admin editor must not do

- display the current plaintext password
- fetch the plaintext password from the database
- store the plaintext password in public tables

### 12.3 Why this matters

Passwords are stored only as hashes in the private access table. After hashing, the original plaintext cannot be reconstructed.

If a future agent tries to “restore” current-password readback, treat that as a security regression unless the entire storage model is intentionally redesigned.

---

## 13. What Is Already Decoupled

These parts are intentionally reusable across deployments:

- SQL schema shape
- private/public table separation
- Edge Function contracts
- student flow routing
- admin editor state model
- analytics read model pattern
- GitHub Pages static-hosting pattern

This means a fork does **not** need to redesign the system architecture. It mainly needs new infrastructure bindings.

---

## 14. What Must Be Rewritten or Rebound After Migration

These parts are project-specific and must be rebound:

### 14.1 Infrastructure bindings

- Supabase project URL
- Supabase publishable key
- Supabase secret/service role
- GitHub Pages repository path

### 14.2 Identity bindings

- admin email
- admin password
- admin metadata

### 14.3 Content bindings

- seeded exams
- seeded questions
- answer explanations
- demo passwords
- analytics history

### 14.4 Optional workflow bindings

- MCP registrations
- local agent skill configuration
- project-specific GitHub secrets or repository variables

---

## 15. MCP / Agent Environment Notes

### 15.1 MCP is optional for runtime

The app itself does **not** require MCP to run in production.

MCP is only useful for:

- development
- debugging
- migrations
- database inspection
- function deployment assistance

### 15.2 If you want MCP in a new agent environment

You need to:

1. register the Supabase MCP server for the new project
2. authenticate the MCP client
3. point the MCP integration at the new Supabase project reference

### 15.3 What is not portable

Any previous local MCP login state is not portable to another machine or another fork.

Treat MCP auth as a fresh setup task in every new environment.

---

## 16. Recommended Migration Order

Use this order exactly:

1. Read docs.
2. Create the new Supabase project.
3. Apply migrations.
4. Seed demo data or replace the seed.
5. Deploy Edge Functions.
6. Create the admin user and set `app_metadata.role = "admin"`.
7. Configure local frontend env.
8. Verify local student flow.
9. Verify local admin login.
10. Set GitHub repository variables.
11. Enable Pages.
12. Push to `main`.
13. Verify the hosted student flow.
14. Verify the hosted admin flow.
15. Replace demo passwords and demo exams if the deployment is not just for testing.

---

## 17. Verification Checklist

### 17.1 Student flow

- assignment list loads
- clicking an exam opens the access modal
- password validation works
- exam starts
- submit works
- result page shows score, answers, and explanations

### 17.2 Admin flow

- login succeeds
- dashboard loads
- exam list loads
- editor opens
- question save works
- publish/unpublish works
- password rotation save works

### 17.3 Password chain

Verify all of these:

- password field blank leaves the current password unchanged
- saving a new password invalidates the old password
- student login works with the new password
- no plaintext password is exposed in any public API response

---

## 18. Known Design Constraints

- Students must not directly select from `questions`.
- Access passwords must not live in a public table.
- The admin editor should not fake success on backend failure.
- The result page must render explanations from `submit-exam` and keep them visible in a single reliable scroll container.

---

## 19. Current Known Non-Blocking Issues

- Frontend bundle size is still large.
- Some admin data loaders still fall back to mock data in development-oriented ways that may be too forgiving for strict production operations.

---

## 20. Recommended First Actions for a New Agent

If you are the first agent touching a fork, do this immediately:

1. replace the boilerplate or inherited project metadata
2. create the new Supabase project
3. write down the new project URL and keys in your own planning files
4. confirm Pages variables are set before your first production build
5. verify the password helper RPCs are present before testing `start-exam`

If you skip those steps, you will waste time debugging a deployment that is still pointing at someone else's infrastructure assumptions.
