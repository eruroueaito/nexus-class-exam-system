# Docs Directory

This directory contains the human- and agent-facing documentation for the Nexus Class exam system.

## Primary Documents

- `online-exam-system-development-plan.md`
  - The main architecture and implementation plan.
- `agent-migration-guide.md`
  - A detailed handoff guide for another AI agent that forks the repository and must recreate the environment.
- `exam-cli-spec.md`
  - The entry point for the repository-local exam CLI initiative.
- `exam-content-schema.md`
  - The English-only YAML schema used by Git-tracked exam bundles.
- `exam-cli-operator-guide.md`
  - The operator flow for validating, reviewing, and syncing exam bundles.
- `exam-generation-prompt-contract.md`
  - The standard prompt contract for asking an AI to generate new exam sets.
- `local-supabase-development.md`
  - The minimum local setup for running the app against a real local Supabase stack.

## Subdirectories

- `reference/`
  - Visual and design baseline artifacts.
- `test-data/`
  - Structured seed or sample payloads for testing and migration.
- `superpowers/plans/`
  - Session-specific execution plans generated during development.
- `superpowers/specs/`
  - Durable design specs written before major implementation work.

## Reading Order for New Maintainers

1. `../README.md`
2. `agent-migration-guide.md`
3. `online-exam-system-development-plan.md`
4. `../progress.md`
5. `../findings.md`
