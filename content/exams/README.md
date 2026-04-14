# Exam Bundle Content

This directory stores Git-tracked exam bundle files used by the repository-local exam CLI.

Rules:

- Use YAML files as the canonical bundle format.
- Keep all titles, stems, options, and explanations in English.
- Review the bundle before importing it into Supabase.
- Treat these files as the source of truth for exam content operations.

Operational split:

- `content/exams/*.yaml`
  - production-facing bundle files watched by the GitHub Actions sync workflow
- `content/exams/examples/`
  - example bundles and sample review files that must not trigger production sync

Recommended operator flow:

1. Draft or generate a bundle under `content/exams/`
2. Run local CLI checks:
   - `npm run exam -- validate <bundle>`
   - `npm run exam -- preview <bundle>`
   - `npm run exam -- review <bundle>`
3. Push the approved bundle to `main`
4. Let `.github/workflows/sync-exam-bundles.yml` apply and publish remotely
