# Local Supabase Development

This note defines the minimum local setup required to run the online exam system against a real local Supabase stack instead of the in-app prototype fallback.

## Goal

Use the local database, REST API, and Edge Functions so the student flow can call the real `start-exam` and `submit-exam` endpoints with seeded data.

## Prerequisites

- Docker Desktop must be running.
- Use the pinned CLI invocation because plain `npx supabase ...` previously resolved an unavailable package version in this workspace.

## Start the local stack

From the project root:

```bash
npx supabase@2.88.1 start
```

After the stack is healthy, inspect the local project status:

```bash
npx supabase@2.88.1 status
```

Expected values to copy from the status output:

- API URL
- anon key
- service role key

Notes:

- The frontend variable name remains `VITE_SUPABASE_PUBLISHABLE_KEY`, but for local CLI projects the value should be the local `anon` key. Supabase's hosted publishable keys are not available in the CLI local stack.
- The default local API URL in this repository is `http://127.0.0.1:54321`.

## Seeded local data

The local database seed file is:

- `supabase/seed.sql`

It creates:

- two active exams: `Microeconomics - Midterm Assessment` and `Introductory Macroeconomics - Quiz 01`
- three microeconomics sample questions covering `radio`, `checkbox`, and `text`
- five introductory macroeconomics multiple-choice questions
- private answer records with explanations
- no historical submissions, so each local run starts with a clean answer history

Local student access credentials:

- Exam title: `Microeconomics - Midterm Assessment`
- Access password: `123`
- Exam title: `Introductory Macroeconomics - Quiz 01`
- Access password: `123`

## Frontend environment setup

Copy the template file and fill in the local anon key:

```bash
cp web/.env.example web/.env.local
```

Required variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Then run the frontend:

```bash
cd web
npm run dev
```

## Verification checklist

1. Run `npx supabase@2.88.1 status` and confirm the API URL is reachable.
2. Confirm `web/.env.local` points to the local API URL and anon key.
3. Open the frontend and start the seeded exam with password `123`.
4. Submit a test attempt and confirm a new row appears in `public.submissions`.

## Known limitations

- The current frontend keeps a prototype fallback when the local environment variables are missing.
- The current admin dashboard reads live submissions, so clearing local history will keep analytics empty until you generate new attempts.
