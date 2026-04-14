# Exam CLI Operator Guide

This guide describes the first-version operator workflow for the repository-local exam CLI.

Recommended flow:

1. Ask the AI to draft an exam bundle in English.
2. Save the bundle under `content/exams/`.
3. Run `npm run exam -- validate <bundle>`.
4. Run `npm run exam -- preview <bundle>`.
5. Run `npm run exam -- review <bundle>` to generate the Markdown review summary.
6. Review the generated content.
7. Commit and push the approved bundle to `main`.
8. Let GitHub Actions run `sync-exam-bundles.yml` to apply and publish the bundle remotely.

## GitHub Actions Mode

The only supported remote-write path is GitHub Actions execution:

- the local machine handles generation, validation, preview, and review
- GitHub Actions handles `apply` and publish-state synchronization
- secrets live in GitHub Actions secrets instead of local shell history
- `npm run exam -- sync-bundles ...` is a CI-only command and refuses to run outside GitHub Actions

Required repository secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Local CLI Boundary

Supported local commands:

- `npm run exam -- validate <bundle>`
- `npm run exam -- preview <bundle>`
- `npm run exam -- review <bundle>`

Unsupported local commands:

- direct `apply`
- direct `publish`
- direct `unpublish`
- all-in-one local pipeline execution

Those write operations were intentionally removed from the public local operator path to reduce secret sprawl and eliminate environment-specific release drift.
