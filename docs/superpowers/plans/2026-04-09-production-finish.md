# Production Finish Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish production integration between GitHub Pages and Supabase so the online exam system is usable end to end.

**Architecture:** Keep the browser on the publishable key and route all sensitive reads and writes through Edge Functions plus security-definer helper RPCs. Finish by redeploying the fixed functions, validating the hosted flows against the real Supabase project, and documenting every production blocker and fix.

**Tech Stack:** Vite, React, TypeScript, Vitest, Supabase Database, Supabase Auth, Supabase Edge Functions, GitHub Actions, GitHub Pages

---

### Task 1: Reconfirm Production Baseline

**Files:**
- Modify: `task_plan.md`
- Modify: `progress.md`
- Modify: `findings.md`

- [ ] Step 1: Re-read the current planning files and git status.
- [ ] Step 2: Record the final production-finish phase in the planning files.
- [ ] Step 3: Note the current known production blocker: custom schema access from Edge Functions.

### Task 2: Verify Function Source Boundaries

**Files:**
- Modify: `supabase/functions/_shared/exam-service.ts`
- Test: `web/tests/exam-service.test.ts`

- [ ] Step 4: Search for any remaining direct `app_private` schema access in function code.
- [ ] Step 5: Keep all sensitive access behind `public` helper RPC calls only.
- [ ] Step 6: Update or extend tests if any direct-schema path remains.

### Task 3: Verify Local Quality Gate

**Files:**
- Test: `web/tests/exam-service.test.ts`
- Test: `web/src/features/admin/api/examAdminApi.test.ts`
- Test: `web/src/features/admin/pages/AdminDashboardPage.test.tsx`
- Test: `web/src/features/shell/pages/NexusShellPage.test.tsx`

- [ ] Step 7: Run the full frontend and shared-service test suite.
- [ ] Step 8: Run the production build with the GitHub Pages base path.
- [ ] Step 9: Record the exact verification evidence in `progress.md`.

### Task 4: Apply Database Helper Migration

**Files:**
- Create: `supabase/migrations/20260409193000_private_helper_functions.sql`

- [ ] Step 10: Verify the helper migration exists locally and matches the intended RPC contract.
- [ ] Step 11: Ensure the remote project has the helper migration applied.
- [ ] Step 12: Confirm the helper functions expose only the minimum required service-role entry points.

### Task 5: Redeploy Fixed Edge Functions

**Files:**
- Modify: `supabase/functions/_shared/exam-service.ts`
- Modify: `supabase/functions/start-exam/index.ts`
- Modify: `supabase/functions/submit-exam/index.ts`
- Modify: `supabase/functions/load-exam-draft/index.ts`
- Modify: `supabase/functions/save-exam-draft/index.ts`
- Modify: `supabase/functions/create-exam-draft/index.ts`
- Modify: `supabase/functions/delete-exam-draft/index.ts`

- [ ] Step 13: Deploy `start-exam` with the RPC-based service layer.
- [ ] Step 14: Deploy `submit-exam` with the RPC-based service layer.
- [ ] Step 15: Deploy `load-exam-draft`, `save-exam-draft`, and `create-exam-draft` with the same shared fix.
- [ ] Step 16: Redeploy `delete-exam-draft` so all admin functions are on a single known-good version set.

### Task 6: Run Production Smoke Tests

**Files:**
- Modify: `progress.md`
- Modify: `findings.md`

- [ ] Step 17: Smoke-test `start-exam` against the live project with a real active exam.
- [ ] Step 18: Smoke-test `submit-exam` against the live project with a valid answer payload.
- [ ] Step 19: Sign in as the admin user and smoke-test `load-exam-draft`.
- [ ] Step 20: If any call fails, inspect the response and logs, fix the root cause, then repeat the test.

### Task 7: Verify Hosted Frontend Integration

**Files:**
- Modify: `.github/workflows/deploy-pages.yml`
- Modify: `web/vite.config.ts`
- Modify: `progress.md`

- [ ] Step 21: Push the latest verified frontend code to GitHub `main`.
- [ ] Step 22: Wait for the GitHub Pages workflow to succeed and confirm the hosted site returns HTTP 200.
- [ ] Step 23: Validate that the hosted frontend is using the publishable key flow, not any secret credential.

### Task 8: Close Documentation Gaps

**Files:**
- Modify: `docs/online-exam-system-development-plan.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

- [ ] Step 24: Compare the current implementation against the original development document.
- [ ] Step 25: Record remaining non-blocking gaps separately from production blockers.
- [ ] Step 26: Document the custom-schema production incident, the fix, and the correct key usage model.

### Task 9: Preserve Real Test Data

**Files:**
- Modify: `docs/test-data/game-theory-midterm-sample.json`
- Modify: `progress.md`

- [ ] Step 27: Reconfirm the game theory sample exam remains valid for production smoke testing.
- [ ] Step 28: Record which live exam IDs and passwords were used for smoke testing.

### Task 10: Final Verification and Delivery

**Files:**
- Modify: `progress.md`

- [ ] Step 29: Re-run the final local verification commands after any fixes.
- [ ] Step 30: Summarize production status with evidence only after all checks pass.
