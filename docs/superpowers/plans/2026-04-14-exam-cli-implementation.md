# Exam CLI Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a repository-local CLI that validates, previews, and reviews exam bundles, while using an English-only YAML content format designed for AI-assisted generation and human review, and leaving remote writes to GitHub Actions.

**Architecture:** The CLI runs in Node.js and TypeScript. AI remains responsible for semantic question generation, while the local CLI handles deterministic validation, preview, and review rendering. GitHub Actions owns Supabase import and publish-state synchronization by using repository secrets and the internal `sync-bundles` command.

**Tech Stack:** Node.js, TypeScript, tsx, Vitest, Zod, js-yaml, Supabase JS

---

### Task 1: Scaffold The CLI Runtime

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tools/exam-cli/src/index.ts`
- Create: `tools/exam-cli/src/lib/paths.ts`
- Create: `content/exams/.gitkeep`
- Test: `tools/exam-cli/tests/paths.test.ts`

- [ ] Step 1: Write a failing test for CLI path helpers.
- [ ] Step 2: Run the test and confirm failure.
- [ ] Step 3: Add root Node tooling and minimal path utilities.
- [ ] Step 4: Re-run the test and confirm pass.

### Task 2: Define The Exam Bundle Schema

**Files:**
- Create: `tools/exam-cli/src/lib/schema.ts`
- Create: `docs/exam-content-schema.md`
- Create: `content/exams/README.md`
- Test: `tools/exam-cli/tests/schema.test.ts`

- [ ] Step 1: Write failing tests for valid and invalid bundle shapes.
- [ ] Step 2: Run the schema tests and confirm failure.
- [ ] Step 3: Implement the Zod schema and export parse helpers.
- [ ] Step 4: Re-run the schema tests and confirm pass.
- [ ] Step 5: Document the English-only YAML contract.

### Task 3: Implement Preview Rendering

**Files:**
- Create: `tools/exam-cli/src/lib/preview.ts`
- Create: `tools/exam-cli/src/commands/validate.ts`
- Create: `tools/exam-cli/src/commands/preview.ts`
- Test: `tools/exam-cli/tests/preview.test.ts`

- [ ] Step 1: Write a failing test for preview summary rendering.
- [ ] Step 2: Run the preview test and confirm failure.
- [ ] Step 3: Implement bundle validation and preview rendering.
- [ ] Step 4: Re-run the preview test and confirm pass.

### Task 4: Implement CI-Oriented Supabase Apply Logic

**Files:**
- Create: `tools/exam-cli/src/lib/supabase-admin.ts`
- Create: `tools/exam-cli/src/lib/importer.ts`
- Create: `tools/exam-cli/src/commands/apply.ts`
- Test: `tools/exam-cli/tests/importer.test.ts`

- [ ] Step 1: Write a failing test for import payload normalization and update sequencing.
- [ ] Step 2: Run the importer test and confirm failure.
- [ ] Step 3: Implement GitHub Actions-invoked import logic using:
  - `public.exams`
  - `public.questions`
  - `public.upsert_answer_record(...)`
  - `public.upsert_exam_access_password_hash(...)`
- [ ] Step 4: Re-run the importer test and confirm pass.

### Task 5: Implement Publish Control

**Files:**
- Create: `tools/exam-cli/src/commands/publish.ts`
- Test: `tools/exam-cli/tests/publish.test.ts`

- [ ] Step 1: Write a failing test for publish-state mutation.
- [ ] Step 2: Run the publish test and confirm failure.
- [ ] Step 3: Implement exam publish and unpublish helpers.
- [ ] Step 4: Re-run the publish test and confirm pass.

### Task 6: Implement GitHub Actions Sync Orchestration

**Files:**
- Create: `tools/exam-cli/src/commands/sync-bundles.ts`
- Create: `docs/exam-cli-operator-guide.md`
- Test: `tools/exam-cli/tests/sync-bundles.test.ts`

- [ ] Step 1: Write a failing test for CI-only sync gating.
- [ ] Step 2: Run the sync test and confirm failure.
- [ ] Step 3: Implement orchestration:
  - validate
  - apply
  - publish if requested
- [ ] Step 4: Block local execution outside GitHub Actions.
- [ ] Step 5: Re-run the sync test and confirm pass.
- [ ] Step 6: Document operator usage and review gates.

### Task 7: Add Command Wiring And Example Output

**Files:**
- Modify: `tools/exam-cli/src/index.ts`
- Create: `tools/exam-cli/src/commands/help.ts`
- Create: `content/exams/examples/intro-macro-quiz-01.yaml`
- Create: `content/exams/examples/intro-macro-quiz-01.review.md`

- [ ] Step 1: Wire all commands into the CLI entry point.
- [ ] Step 2: Add a realistic example bundle and review file.
- [ ] Step 3: Verify command help output and example parsing manually.

### Task 8: Run Verification And Update Project Records

**Files:**
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

- [ ] Step 1: Run `npm test` for CLI tests.
- [ ] Step 2: Run a targeted manual preview command against the example bundle.
- [ ] Step 3: Update planning records with outcomes and known limitations.

## Known First-Version Limitation

The first delivered CLI will not embed a standalone LLM provider. AI-assisted question generation remains agent-driven at the conversation layer. The local CLI owns deterministic validation, preview, and review; GitHub Actions owns import and publish synchronization.
