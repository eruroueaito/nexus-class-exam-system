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

Environment:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The CLI is a trusted local operator tool. Do not expose these secrets to the browser.

## GitHub Actions Mode

The recommended production path is GitHub Actions execution:

- the local machine handles generation, validation, preview, and review
- GitHub Actions handles `apply` and publish-state synchronization
- secrets live in GitHub Actions secrets instead of local shell history

Required repository secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
