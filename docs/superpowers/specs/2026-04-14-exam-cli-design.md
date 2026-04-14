# Exam CLI Design Spec

## Status

Approved design baseline. Later narrowed so remote writes run only in GitHub Actions.

## Objective

Introduce a repository-local CLI that standardizes the full exam-content workflow:

1. accept a natural-language exam request
2. generate a structured English-only exam bundle file
3. validate the bundle deterministically
4. render a human-review summary
5. pause for approval
6. commit and push the approved bundle
7. let GitHub Actions import the approved bundle into Supabase
8. let GitHub Actions synchronize the publish state

The CLI must make content operations reproducible, reviewable, and safe for AI-driven usage while avoiding documented local high-privilege release commands.

## Non-Goals

- Replacing the existing admin editor UI
- Allowing direct browser writes to private Supabase tables
- Supporting multilingual content in the first version
- Auto-publishing without an explicit review gate
- Replacing the current student or admin web flows

## Why This Exists

The current repository can already create exams, edit questions, rotate passwords, and publish exams through the admin UI. That is sufficient for small manual edits, but it is not a strong operator workflow for:

- adding entire exam sets quickly
- versioning exam content in Git
- validating AI-generated content before import
- repeating the same import flow consistently across operators
- reducing production mistakes around passwords, publish state, and answer formatting

The CLI becomes the canonical content-operations layer, while the web admin editor remains the fallback manual editor.

## Design Principles

1. English-only content rules
2. File-first reviewability
3. Deterministic validation before any remote mutation
4. Explicit approval before any remote mutation
5. Server-side enforcement for password and answer security
6. Git-tracked content as the source of truth
7. Minimal operator surface area

## Recommended Implementation Stack

Use a repository-local Node.js + TypeScript CLI.

Rationale:

- matches the current repo stack
- can reuse TypeScript, Zod, and `supabase-js`
- is easy to run with `npm`
- keeps schemas and tooling aligned with the frontend codebase

## High-Level Workflow

### Phase A: Generate

Input:

- a natural-language request from the user

Output:

- one normalized YAML exam bundle
- one Markdown review summary

No remote mutation happens here.

### Phase B: Review

Input:

- generated YAML bundle
- generated Markdown review summary

Output:

- explicit human approval or requested edits

No publish or import happens here.

### Phase C: Sync

Input:

- approved YAML bundle

Output:

- Git commit and Git push completed
- GitHub Actions imports or updates the exam in Supabase
- GitHub Actions rotates the password if provided
- GitHub Actions updates the published or unpublished state

## Repository Structure

```text
content/
  exams/
    2026-04-14-intro-macro-quiz-01.yaml

docs/
  exam-cli-spec.md
  exam-content-schema.md
  exam-cli-operator-guide.md
  superpowers/
    specs/
      2026-04-14-exam-cli-design.md

tools/
  exam-cli/
    src/
      index.ts
      commands/
        generate.ts
        validate.ts
        preview.ts
        sync-bundles.ts
      lib/
        schema.ts
        slug.ts
        normalize.ts
        prompt-builder.ts
        review-summary.ts
        supabase-admin.ts
      templates/
        exam-template.yaml
```

## Canonical Content Format

Use YAML as the canonical exam-bundle format.

Why YAML:

- easier for humans to review than JSON
- easier for AI to produce than deeply nested SQL
- cleaner Git diffs
- better fit for mixed metadata and question content

### Bundle Shape

```yaml
version: 1
exam:
  slug: intro-macro-quiz-01
  title: Introductory Macroeconomics - Quiz 01
  language: en
  topic: introductory macroeconomics
  access_password: "123"
  publish: false
  randomize_questions: true
  randomize_options: false
  time_limit_minutes: null

questions:
  - id: q01
    type: radio
    stem: What does GDP measure?
    options:
      - id: A
        text: Total exports only
      - id: B
        text: The market value of final goods and services produced domestically
      - id: C
        text: Government revenue only
      - id: D
        text: Household savings only
    correct_answer:
      - B
    explanation: GDP measures the market value of final goods and services produced within a country over a period.
    points: 1
```

## English-Only Content Rules

All content and generated operator artifacts must be written in English:

- exam titles
- stems
- options
- explanations
- CLI-generated review summaries
- schema examples
- validation messages intended for operators

This is a strict rule for the CLI workflow.

## Content Constraints

1. Every question must include an explanation.
2. Every choice question must include stable option IDs.
3. `radio` questions must contain exactly one correct answer.
4. `checkbox` questions must contain one or more correct answers.
5. `text` questions must define deterministic accepted answers.
6. Default point value is `1` unless overridden.
7. No HTML in stems or explanations unless explicitly justified.
8. Password is write-only in the content workflow.
9. Publish behavior must never bypass validation.

## CLI Commands

### `npm run exam -- generate --prompt "..."`

Purpose:

- convert a natural-language request into a normalized YAML exam bundle
- emit a Markdown review summary next to it

Output:

- `content/exams/<slug>.yaml`
- `content/exams/<slug>.review.md`

No remote writes.

### `npm run exam -- validate <bundle>`

Purpose:

- validate the YAML bundle against the exam schema
- reject malformed content before review or import

Checks:

- required fields present
- valid question types
- valid option shapes
- valid answer cardinality
- non-empty explanation fields
- English-only compliance heuristic

### `npm run exam -- preview <bundle>`

Purpose:

- print a compact operator preview in the terminal

Preview fields:

- title
- slug
- topic
- language
- question count
- question type breakdown
- password configured yes or no
- publish target state

### `npm run exam -- sync-bundles <bundle...>`

Purpose:

- internal CI-only command
- validate approved bundles inside GitHub Actions
- import or update exam metadata, questions, answers, and password state
- synchronize publish state from the bundle file

This command must fail loudly on any remote mismatch or schema error and must reject execution outside GitHub Actions.

### Push-Triggered Delivery Flow

Purpose:

- run the complete reviewed delivery workflow through GitHub Actions

Required sequence:

1. generate
2. validate
3. preview
4. stop for approval
5. Git commit
6. Git push
7. GitHub Actions sync
8. GitHub Actions publish-state update

The review gate happens before the push. No documented local command may bypass that gate and mutate production directly.

## Supabase Integration Strategy

The CLI should not directly mutate every table from the client side.

Recommended design:

- add one dedicated backend import surface such as `import-exam-bundle`
- the CLI sends the normalized exam bundle to that controlled endpoint
- the backend handles:
  - exam creation or update
  - question creation or update
  - answer-library writes
  - password rotation
  - publish-state mutation

This is preferable to simulating the admin editor with repeated `save-exam-draft` calls.

## Security Boundaries

The CLI must preserve the same boundaries already enforced by the live app:

- no plaintext password is ever read back from production
- password writes are one-way rotation operations
- answers remain in private storage paths
- import operations must run through a trusted backend path

## Review Artifacts

For every generated exam bundle, the system must create a Markdown review summary containing:

- exam title
- topic
- difficulty or intended audience if provided
- question count
- question type breakdown
- publish target state
- one-line summary per question
- risk notes such as repetition, ambiguity, or weak distractors

## One-Line Operator Experience

Target operator behavior:

```text
Generate an introductory macroeconomics quiz with 10 single-choice questions, password 123, publish after approval.
```

The system should then:

1. generate YAML
2. generate review summary
3. present both for approval
4. after approval, commit and push
5. GitHub Actions imports to Supabase
6. GitHub Actions synchronizes publish state

## Acceptance Criteria

The CLI design is acceptable only if it supports all of the following:

- file-first review before import
- English-only exam output
- deterministic validation
- secure password rotation
- CI-controlled publish control
- Git-backed audit trail
- operator-friendly preview
- a single reviewed path from bundle push to GitHub Actions sync

## Recommended Delivery Phases

### Phase 1: Specification

- write the design spec
- write the YAML schema spec
- write the operator guide

### Phase 2: Core Content Tooling

- implement `generate`
- implement `validate`
- implement `preview`

### Phase 3: Delivery Pipeline

- implement backend import endpoint or service-role-backed CI sync
- implement `sync-bundles`
- implement the GitHub Actions workflow

## Open Decisions Already Resolved

- Tool shape: repository-local CLI
- Input style: both natural language and structured file
- End-to-end target: generate, review, commit, push, then let GitHub Actions import and publish
- Language rule: English-only content and specs

## Immediate Next Step

Write the implementation plan for this CLI system, then start implementation only after the written spec is reviewed and approved.
