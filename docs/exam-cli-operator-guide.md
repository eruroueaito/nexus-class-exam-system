# Exam CLI Operator Guide

This guide describes the first-version operator workflow for the repository-local exam CLI.

Recommended flow:

1. Ask the AI to draft an exam bundle in English.
2. Save the bundle under `content/exams/`.
3. Run `npm run exam -- validate <bundle>`.
4. Run `npm run exam -- preview <bundle>`.
5. Review the generated content.
6. Run `npm run exam -- apply <bundle>` when approved.
7. Run `npm run exam -- publish <bundle>` if the exam should go live.
8. Run `npm run exam -- full-pipeline <bundle> --approved` to combine validation, import, publish, commit, and push.

Environment:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The CLI is a trusted local operator tool. Do not expose these secrets to the browser.
