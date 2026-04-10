# Supabase Edge Functions

This directory contains the backend HTTP entry points for sensitive runtime operations.

## Student Flow Functions

- `start-exam/`
  - Validates the access password and returns exam questions.
- `submit-exam/`
  - Grades answers, stores submission rows, and returns explanation-bearing results.

## Admin Flow Functions

- `load-exam-draft/`
  - Loads a secure admin editing snapshot.
- `save-exam-draft/`
  - Saves exam metadata, questions, answers, explanations, publication state, and optional password rotation.
- `create-exam-draft/`
  - Creates a new exam draft plus its initial private access record.
- `delete-exam-draft/`
  - Deletes an exam and relies on cascading relationships to remove dependent records.

## Shared Code

- `_shared/`
  - Shared helpers for request handling, auth checks, service clients, and exam business logic.

## Security Reminder

Do not bypass the helper RPC pattern just because a direct table query appears simpler. Private answer and password access must stay behind server-side code paths.
