# Exam CLI Specification Index

This document is the entry point for the repository-local exam CLI initiative.

Primary design spec:

- `docs/superpowers/specs/2026-04-14-exam-cli-design.md`

The CLI will standardize:

- natural-language exam generation
- YAML exam-bundle authoring
- schema validation
- human review summaries
- GitHub Actions-triggered controlled Supabase import
- GitHub Actions-triggered publish control

The local operator surface is intentionally limited to generate, validate, preview, and review. Remote apply and publish are reserved for the GitHub Actions sync workflow. This file exists to give future maintainers a stable top-level pointer.
