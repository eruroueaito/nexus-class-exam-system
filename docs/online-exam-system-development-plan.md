# Online Exam System Development Plan

> **For agentic workers:** REQUIRED: use `superpowers:subagent-driven-development` or `superpowers:executing-plans` when implementing this plan. Keep task tracking in checkbox form.

**Goal:** Build a GitHub Pages + Supabase online exam and assignment system in which questions, answers, permissions, grading, and analytics are cleanly decoupled, while supporting both student-facing exam delivery and admin-facing exam management.

**Architecture:** The frontend is a static React application deployed to GitHub Pages. All sensitive student operations, including exam start, password verification, grading, and answer retrieval, run through Supabase Edge Functions. The admin side uses Supabase Auth, RLS, and controlled RPC or table access to manage exams and inspect analytics.

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS, React Router, TanStack Query, Supabase Auth, Supabase Postgres, Supabase Edge Functions, Recharts, Vitest, Testing Library, Playwright.

---

## 1. Document Scope

This document is both an architecture brief and an implementation plan. It is meant to be executable. A future maintainer or agent should be able to read it and continue implementation phase by phase without needing an additional “what should happen next?” document.

This document assumes:

- the frontend is hosted on GitHub Pages
- Supabase is available
- the current Codex environment has already authenticated Supabase MCP access
- the project follows an iterative strategy: deliver the secure exam flow first, then deepen analytics, import tooling, and export UX

## 1.1 Current Frontend Visual Baseline

The user provided an Apple-like frontend prototype. All frontend implementation work should treat that prototype as the direct visual baseline instead of reimagining the product from scratch.

Reference file:

- `docs/reference/nexus-class-prototype.html`

Implementation constraints:

- preserve the low-saturation light background, liquid-glass panel treatment, blue accent color, and soft blurred background blobs
- preserve the overall emotional tone and hierarchy across the four core views:
  - login or entry shell
  - exam list
  - quiz view
  - admin workspace
- structural changes are acceptable when required by real business logic, but the visual language should remain aligned with the prototype
- inline styles from the prototype should be translated into maintainable component styles and design tokens in React

## 2. Non-Negotiable Corrections To The Original Requirement

The following issues are not optional optimizations. They must be corrected before implementation proceeds, otherwise rework is guaranteed later.

### 2.1 `questions` Must Not Be Publicly Selectable By Students

The original requirement suggested allowing `SELECT` on the `questions` table for everyone. That directly breaks the access-password model, because any student could bypass the modal and fetch all questions from the browser.

Conclusion:

- students must not query `questions` directly
- starting an exam must go through a controlled backend endpoint
- the backend must verify the exam password before returning question content

### 2.2 `exams.access_password` Must Not Live In The Same Public Table As The Exam Catalog

The homepage needs to display an exam list. If anonymous users can read `exams`, and the password is stored in the same row, the browser can simply read the password too.

Conclusion:

- exam metadata and exam access control must be split
- the recommended design is a private table such as `app_private.exam_access`
- passwords should be stored as hashes, not plaintext

### 2.3 `submissions` Alone Cannot Support Per-Question Error Analytics

`submissions` only stores top-level attempt results such as score and duration. That is not enough to answer questions like:

- which question is most frequently answered incorrectly?
- what answer did each student choose on a specific question?
- how can a historical result page safely replay the answer explanation that was valid at the time of submission?

Conclusion:

- the project needs a `submission_items` table to store per-question answer snapshots and explanation snapshots

### 2.4 Do Not Randomize Questions With `array.sort(() => Math.random() - 0.5)`

That shortcut is easy to write, but it produces biased shuffling and unstable distribution characteristics.

Conclusion:

- use Fisher-Yates for question shuffling
- if stable ordering per attempt is needed later, extend the model with a per-session seed

## 3. Tech Stack Evaluation

### Option A: Vite + React + TypeScript + Tailwind + Supabase

Advantages:

- matches the requested deployment model
- React has the strongest ecosystem for forms, charts, admin tooling, and stateful workflows
- GitHub Pages deployment remains simple
- future AI-assisted exam import and analytics features fit naturally

Tradeoffs:

- GitHub Pages requires deliberate handling of router behavior, environment variables, and static asset base paths
- student-sensitive logic must go through Edge Functions, which prevents frontend shortcuts

### Option B: Next.js + Supabase + Vercel

Advantages:

- server routes and auth wiring feel more natural
- secure question access and grading can be implemented through server routes

Tradeoffs:

- violates the GitHub Pages deployment constraint
- increases coupling to SSR infrastructure and raises operational complexity

### Option C: Astro + React Islands + Supabase

Advantages:

- excellent for static or content-heavy pages
- good performance on content-first sites

Tradeoffs:

- this project is interaction-heavy, not content-heavy
- the exam and admin workflows would still collapse back into React islands
- mental overhead is higher than a direct React solution

### Recommendation

Use **Vite + React + TypeScript + Tailwind + Supabase**.

Why:

- mature ecosystem
- strong community support
- complexity level matches the product
- simple deployment
- best fit for AI-assisted admin workflows, analytics, and GitHub Pages compatibility

## 4. Recommended Architecture

### 4.1 Logical Layers

1. **Static frontend layer**
   - hosted on GitHub Pages
   - responsible for UI, routing, state management, Supabase Auth integration, and Edge Function calls

2. **Controlled application-service layer**
   - implemented with Supabase Edge Functions
   - responsible for exam start, question retrieval, grading, and submission persistence
   - uses server-side elevated access to read private password hashes and answer data

3. **Data layer**
   - Supabase Postgres stores exams, questions, answers, submissions, and submission items
   - RLS protects admin-only mutation and analytics access

4. **Admin interface layer**
   - authenticated admins use the frontend plus Supabase Auth
   - controlled Edge Functions and RPCs handle write paths that touch sensitive data
   - future AI import or sync features should use validated RPC contracts rather than direct browser writes to private structures

### 4.2 Student Flow And Admin Flow Must Stay Separate

Student flow:

- can only see the public exam catalog
- provides a name and exam password
- uses `start_exam` to receive the exam payload
- uses `submit_exam` to receive grading results

Admin flow:

- authenticates with Supabase Auth
- manages exams, questions, answers, and analytics
- can call controlled import or sync endpoints such as `upsert_exam_data`

This separation avoids a common failure mode: collapsing students and admins into one browser-direct database model and accidentally exposing questions or answers.

## 5. Data Model

## 5.1 Core Tables And Support Tables

### `public.exams`

Purpose: exam metadata.

Fields:

- `id UUID PRIMARY KEY`
- `title TEXT NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `is_active BOOLEAN NOT NULL DEFAULT true`

Notes:

- do not store plaintext passwords here
- the homepage may expose only the non-sensitive columns

### `app_private.exam_access`

Purpose: exam access control.

Fields:

- `exam_id UUID PRIMARY KEY REFERENCES public.exams(id) ON DELETE CASCADE`
- `password_hash TEXT NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

Notes:

- store a hash, not plaintext
- only Edge Functions or controlled admin logic should access this table

### `public.questions`

Purpose: prompt and display data.

Fields:

- `id UUID PRIMARY KEY`
- `exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE`
- `content JSONB NOT NULL`
- `type TEXT NOT NULL CHECK (type IN ('radio', 'checkbox', 'text'))`
- `order_index INTEGER NOT NULL DEFAULT 0`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

Notes:

- `ON DELETE CASCADE` guarantees question cleanup when an exam is deleted
- `content` must not store the correct answer

Recommended `content` shape:

```json
{
  "stem": "What is 2 + 2?",
  "options": [
    { "id": "A", "text": "3" },
    { "id": "B", "text": "4" },
    { "id": "C", "text": "5" }
  ],
  "media": [],
  "hint": null,
  "points": 1
}
```

### `app_private.answers_library`

Purpose: correct answers and explanations.

Fields:

- `id UUID PRIMARY KEY`
- `question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE`
- `correct_answer JSONB NOT NULL`
- `explanation TEXT NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

Notes:

- this table belongs in a private schema
- answers must be deleted automatically when a question is deleted

### `public.submissions`

Purpose: one top-level exam attempt record.

Fields:

- `id UUID PRIMARY KEY`
- `exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE`
- `user_name TEXT NOT NULL`
- `score DOUBLE PRECISION NOT NULL`
- `duration INTEGER NOT NULL`
- `submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()`

### `public.submission_items`

Purpose: per-question answer snapshots and analytics support.

Fields:

- `id UUID PRIMARY KEY`
- `submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE`
- `question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE`
- `user_answer JSONB NOT NULL`
- `is_correct BOOLEAN NOT NULL`
- `correct_answer_snapshot JSONB NOT NULL`
- `explanation_snapshot TEXT NOT NULL`
- `answered_at TIMESTAMPTZ NOT NULL DEFAULT now()`

Notes:

- this table is the backbone for question heat analytics
- historical submissions remain valid even if the live question bank changes later

## 5.2 Required Indexes

- `questions(exam_id, order_index)`
- `answers_library(question_id)`
- `submissions(exam_id, submitted_at desc)`
- `submission_items(question_id, is_correct)`
- `submission_items(submission_id)`

## 5.3 Optional Public View

### `public.exam_catalog`

Purpose: safe public exam listing for the homepage.

Fields:

- `id`
- `title`
- `created_at`
- `is_active`

Notes:

- the homepage should read this safe surface instead of raw internal tables
- do not expose any access-control or answer-related data through the public catalog

## 6. Security And Permission Design

## 6.1 Admin Identity

Admins authenticate through Supabase Auth.

Role source:

- use `app_metadata.role = 'admin'`
- do not rely on `user_metadata` for authorization decisions

Recommended helper:

- `app.is_admin()` returns whether the current JWT carries admin role information

## 6.2 RLS Principles

### `public.exams`

- anonymous or standard users: read only through safe public view surfaces, not unrestricted table reads
- admins: may `SELECT/INSERT/UPDATE/DELETE`

### `public.questions`

- students: no direct `SELECT`
- admins: may `SELECT/INSERT/UPDATE/DELETE`

### `app_private.answers_library`

- students: fully denied
- admins: readable and writable only through controlled admin flows
- Edge Functions: may access through service role or helper RPCs

### `public.submissions`

- anonymous students: no general historical read access by default
- admins: may read analytics data
- `submit_exam` Edge Function: may insert

### `public.submission_items`

- anonymous students: no general historical read access by default
- admins: may read analytics data
- `submit_exam` Edge Function: may insert

## 6.3 Security Rules That Must Hold

- the frontend must never hold the Supabase `service_role`
- `answers_library` must never become browser-readable
- exam passwords must be stored as hashes
- grading must always trust database answers, not frontend-provided question type, score, or “correct answer” data
- future views must be checked carefully because some Postgres view patterns can weaken RLS expectations if configured incorrectly

## 7. Backend Interface Design

## 7.1 Student Endpoint: `start_exam`

Type: Supabase Edge Function.

Responsibilities:

- receive `exam_id`, `user_name`, and `access_password`
- verify that the exam is active
- compare the submitted password against the stored hash
- read the exam questions
- return the question payload for frontend-side Fisher-Yates shuffling

Example request:

```json
{
  "exam_id": "uuid",
  "user_name": "Alice",
  "access_password": "123"
}
```

Example response:

```json
{
  "exam": {
    "id": "uuid",
    "title": "Math Quiz"
  },
  "questions": [
    {
      "id": "uuid-q1",
      "type": "radio",
      "content": {
        "stem": "What is 2 + 2?",
        "options": [
          { "id": "A", "text": "3" },
          { "id": "B", "text": "4" }
        ]
      }
    }
  ]
}
```

Failure conditions:

- exam does not exist
- exam is inactive
- password is invalid
- request payload is malformed

## 7.2 Student Endpoint: `submit_exam`

Type: Supabase Edge Function.

Responsibilities:

- receive all student answers
- read private correct answers
- calculate the score
- write `submissions`
- write `submission_items`
- return the data required by the result page

Example request:

```json
{
  "exam_id": "uuid",
  "user_name": "Alice",
  "duration": 412,
  "answers": {
    "question_uuid_1": ["B"],
    "question_uuid_2": ["A", "C"],
    "question_uuid_3": "free text answer"
  }
}
```

Example response:

```json
{
  "submission_id": "uuid-submission",
  "score": 0.83,
  "correct_count": 5,
  "total_count": 6,
  "items": [
    {
      "question_id": "uuid-q1",
      "user_answer": ["B"],
      "correct_answer": ["B"],
      "is_correct": true,
      "explanation": "Because 2 + 2 = 4."
    }
  ]
}
```

## 7.3 Admin Endpoint: `upsert_exam_data`

Type: Supabase RPC.

Responsibilities:

- bulk-create or bulk-update exams, questions, and answers
- update existing questions if the `question.id` already exists
- insert new questions if the id does not exist
- never write correct answers into `questions.content`

Caller:

- admin UI only
- always preceded by schema validation on the frontend and backend

Recommended input:

```json
{
  "exam": {
    "id": "optional-uuid",
    "title": "Biology Quiz",
    "is_active": true,
    "access_password": "optional plain password for rotation"
  },
  "questions": [
    {
      "id": "optional-uuid",
      "type": "radio",
      "order_index": 1,
      "content": {
        "stem": "Question text",
        "options": [
          { "id": "A", "text": "Option A" }
        ]
      },
      "answer": {
        "correct_answer": ["A"],
        "explanation": "Simple explanation for international students."
      }
    }
  ]
}
```

## 8. Frontend Module Design

## 8.1 Routes

- `/#/`: exam catalog page
- `/#/exam/:examId`: quiz page
- `/#/result/:submissionId`: result page
- `/#/admin/login`: admin login
- `/#/admin`: admin dashboard
- `/#/admin/exams/:examId`: exam editor

Notes:

- GitHub Pages should use `HashRouter`
- if the project later moves to a custom domain with proper SPA fallback, `BrowserRouter` can be reconsidered

## 8.2 Frontend Directory Layout

```text
src/
  app/
    router.tsx
    providers.tsx
  components/
    ui/
    layout/
  features/
    exams/
      api/
      components/
      hooks/
      pages/
      types.ts
    admin/
      api/
      components/
      hooks/
      pages/
      schemas.ts
    auth/
      api/
      hooks/
  lib/
    supabase.ts
    query-client.ts
    env.ts
    shuffle.ts
    timer.ts
    errors.ts
  styles/
    index.css
```

## 8.3 Page Responsibilities

### Homepage

- load the public exam catalog
- render exam cards
- open the password and name access modal when an exam is selected

### Quiz Page

- shuffle questions with Fisher-Yates
- start timing with `performance.now()`
- render progress, timer, and questions
- maintain answer state locally

### Result Page

- display score and accuracy
- display per-question correctness, correct answer, and explanation
- support print-friendly rendering

### Admin Workspace

- detect login state
- support exam CRUD
- support question CRUD
- support AI JSON import entry points
- display analytics and question heat surfaces

## 9. Local Development Environment

## 9.1 Recommended Tools

- Node.js LTS
- npm
- Supabase CLI
- Codex or Claude with Supabase MCP access

## 9.2 Setup Steps

- [ ] run `npm create vite@latest web -- --template react-ts`
- [ ] enter `web/` and install dependencies
- [ ] install `tailwindcss`, `@supabase/supabase-js`, `@tanstack/react-query`, `react-router-dom`, `zod`, and `recharts`
- [ ] initialize Supabase locally with `supabase init`
- [ ] start local services with `supabase start`
- [ ] create `.env.local` with:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] configure GitHub Pages build behavior and the `base` option in `vite.config.ts`

## 9.3 Suggested Repository Shape

```text
/
  docs/
  web/
  supabase/
    functions/
      start-exam/
      submit-exam/
    migrations/
    seed.sql
  task_plan.md
  findings.md
  progress.md
```

## 10. Testing Strategy

## 10.1 General Rule

Implementation should follow TDD:

- write a failing test first
- confirm failure
- implement the minimum change
- verify the test passes

## 10.2 Frontend Tests

Tools:

- Vitest
- React Testing Library

Critical coverage:

- access modal validation
- question-type rendering
- timer rendering
- submit-button enable and disable logic
- result-page explanation rendering

## 10.3 Backend Tests

Critical coverage:

- `start_exam` returns 401 or 403 on invalid passwords
- `submit_exam` writes `submissions`
- `submit_exam` writes `submission_items`
- grading logic for radio, checkbox, and text questions
- cascading question and answer deletion

Recommended approach:

- unit tests for Edge Function logic
- local Supabase integration tests
- SQL-level verification of final database state

## 10.4 E2E Tests

Tool:

- Playwright

Minimum user journeys:

- student enters from homepage, completes an exam, and submits
- admin logs in, creates an exam, and adds questions
- AI JSON import updates the admin workspace and the new exam becomes student-readable through the controlled flow

## 11. Phased Implementation Plan

## 11.0 Current Implementation Snapshot

At the current local milestone, the following modules already exist in first usable form:

- public exam catalog
- password-gated student entry
- quiz flow
- submission flow
- result feedback
- Supabase schema, RLS, `start-exam`, and `submit-exam`
- admin login
- first-pass analytics
- question editing
- question CRUD
- option editing
- exam-level create and delete

The following items are still incomplete but do not block the current deployable demo:

- AI JSON import entry point and `upsert_exam_data`
- Playwright E2E coverage
- fully finished print and export UX
- route-level code splitting and bundle optimization for the admin area

Minimum completion items before a new launch wave:

- real exam list in the admin workspace
- GitHub Pages workflow and `vite.config.ts` base-path configuration
- one reusable English game-theory sample exam for realistic integration testing

### Task 1: Initialize Frontend And Supabase Project Skeleton

**Files**

- create `web/package.json`
- create `web/src/main.tsx`
- create `web/src/app/router.tsx`
- create `supabase/config.toml`

- [ ] create the Vite React TypeScript project
- [ ] install Tailwind and base dependencies
- [ ] save and register the user-provided prototype as the implementation reference
- [ ] initialize the local Supabase folder
- [ ] boot both the frontend dev server and local Supabase successfully
- [ ] create an initialization commit

### Task 2: Build Database Migrations And Base Schema

**Files**

- create `supabase/migrations/0001_init_exam_schema.sql`
- create `supabase/seed.sql`

- [ ] write a schema verification checklist first
- [ ] create `exams`, `exam_access`, `questions`, `answers_library`, `submissions`, and `submission_items`
- [ ] add foreign keys and indexes
- [ ] apply the migration locally
- [ ] verify cascading deletion with SQL

### Task 3: Configure RLS And Admin Role Strategy

**Files**

- modify `supabase/migrations/0001_init_exam_schema.sql`
- create `supabase/migrations/0002_rls_and_policies.sql`

- [ ] define the `is_admin()` helper
- [ ] enable RLS on all relevant tables
- [ ] add admin read and write policies
- [ ] add minimum anonymous and student policies
- [ ] verify anonymous users cannot read questions or answers directly

### Task 4: Implement Public Exam Catalog Reading

**Files**

- create `web/src/features/exams/api/listExamCatalog.ts`
- create `web/src/features/exams/pages/ExamCatalogPage.tsx`
- create `web/src/features/exams/components/ExamAccessModal.tsx`

- [ ] write the homepage rendering test first
- [ ] implement the exam catalog interface
- [ ] implement exam cards and the access modal
- [ ] verify empty list, inactive exam, and load-failure states

### Task 5: Implement `start_exam` Edge Function

**Files**

- create `supabase/functions/start-exam/index.ts`
- create `web/src/features/exams/api/startExam.ts`

- [ ] write failure and success tests first
- [ ] implement password-hash verification
- [ ] implement question querying and response mapping
- [ ] connect the frontend to the start-exam interface
- [ ] verify students cannot bypass the interface and read questions directly

### Task 6: Implement Quiz Page And Local Answer State

**Files**

- create `web/src/features/exams/pages/ExamPage.tsx`
- create `web/src/features/exams/components/QuestionRenderer.tsx`
- create `web/src/lib/shuffle.ts`
- create `web/src/lib/timer.ts`

- [ ] write rendering and answer-state tests first
- [ ] implement Fisher-Yates shuffling
- [ ] implement timer and progress UI
- [ ] implement radio, checkbox, and text answer inputs
- [ ] verify a minimum failure-tolerance strategy for refresh and accidental exits

### Task 7: Implement `submit_exam` Edge Function

**Files**

- create `supabase/functions/submit-exam/index.ts`
- create `web/src/features/exams/api/submitExam.ts`

- [ ] write grading tests first
- [ ] implement answer lookup, scoring, and submission persistence
- [ ] write `submission_items`
- [ ] return correct answers and explanations
- [ ] verify the frontend cannot obtain unsubmitted answer keys

### Task 8: Implement Result Page And Print Export

**Files**

- create `web/src/features/exams/pages/ResultPage.tsx`
- create `web/src/styles/print.css`

- [ ] write result-page rendering tests first
- [ ] display score summary and per-question feedback
- [ ] add print styles
- [ ] verify browser print output and the single-file HTML export path

### Task 9: Implement Admin Login And Dashboard Frame

**Files**

- create `web/src/features/auth/api/adminLogin.ts`
- create `web/src/features/admin/pages/AdminDashboardPage.tsx`
- create `web/src/features/admin/components/AdminLayout.tsx`

- [ ] write admin auth-state tests first
- [ ] integrate Supabase Auth
- [ ] implement the hidden entry and admin layout shell
- [ ] verify non-admin users cannot enter the workspace

### Task 10: Implement Exam And Question Management

**Files**

- create `web/src/features/admin/pages/ExamEditorPage.tsx`
- create `web/src/features/admin/components/QuestionEditor.tsx`
- create `web/src/features/admin/api/examAdminApi.ts`

- [ ] write add and edit tests first
- [ ] implement exam CRUD
- [ ] implement question and answer editing
- [ ] verify exam deletion cascades to questions and answers

### Task 11: Implement AI JSON Import Entry

**Files**

- create `web/src/features/admin/components/AiSyncPanel.tsx`
- create `web/src/features/admin/schemas/aiPayloadSchema.ts`
- create `supabase/migrations/0003_upsert_exam_data.sql`

- [ ] write JSON validation tests first
- [ ] validate AI payloads with Zod
- [ ] implement the `upsert_exam_data` RPC
- [ ] show import results and structured errors

### Task 12: Implement Analytics And Charts

**Files**

- create `web/src/features/admin/components/ScoreTrendChart.tsx`
- create `web/src/features/admin/components/QuestionHeatTable.tsx`
- create `web/src/features/admin/api/analyticsApi.ts`

- [ ] write analytics mapping tests first
- [ ] implement score distribution or trend surfaces
- [ ] implement question heat and per-question error analysis
- [ ] verify empty-data and larger-data behavior

### Task 13: Deploy To GitHub Pages

**Files**

- create `.github/workflows/deploy-pages.yml`
- modify `web/vite.config.ts`

- [ ] configure build scripts
- [ ] configure the GitHub Pages workflow
- [ ] set the repository base path
- [ ] verify first deployment, route refresh behavior, and static asset paths

Implementation notes:

- continue using `HashRouter`
- read `base` from environment in `vite.config.ts`
- inject `VITE_BASE_PATH=/<repo-name>/` during GitHub Actions build
- deploy from `web/dist`

Recommended test data:

- use `docs/test-data/game-theory-midterm-sample.json` as a realistic integration sample

## 12. Acceptance Criteria

Version one is only acceptable if all of the following are true:

- students cannot directly query question or answer tables from the browser
- a correct access password allows a student to enter the exam
- a submission immediately returns accuracy and per-question explanations
- deleting an exam cascades to questions and answers
- an admin can log in and maintain exams and questions
- the admin workspace can display score analytics and question heat
- AI JSON import can create or update question data successfully
- GitHub Pages serves the frontend correctly

## 13. Risks And Mitigations

### Risk 1: Student reads directly from a public question table

Impact:

- password gate becomes meaningless
- question leakage

Mitigation:

- force all student reads through Edge Functions

### Risk 2: Only storing total submission scores

Impact:

- no question-level analytics
- no reliable historical answer replay

Mitigation:

- store `submission_items`

### Risk 3: Storing plaintext passwords in a public surface

Impact:

- the browser can read the password directly

Mitigation:

- use a private access table with hashing

### Risk 4: Binding admin role to `user_metadata`

Impact:

- user-controlled metadata can create privilege escalation

Mitigation:

- trust only `app_metadata.role`

## 14. Recommended Implementation Order

If implementation resumes from here, the safest sequence is:

1. database schema and RLS
2. `start_exam`
3. quiz page
4. `submit_exam`
5. result page
6. admin login
7. exam-bank management
8. AI import
9. analytics
10. GitHub Pages deployment

This order gets the highest-value path working first: students can securely take exams and the backend can grade them safely, after which admin capabilities can be layered on top.
