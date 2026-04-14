# Exam Content Schema

The repository-local exam CLI uses YAML exam bundles stored under `content/exams/`.

Minimum top-level fields:

- `version`
- `exam`
- `questions`

The `exam` block must include:

- `slug`
- `title`
- `language`
- `topic`
- `access_password`
- `publish`
- `randomize_questions`
- `randomize_options`
- `time_limit_minutes`

Each question must include:

- `id`
- `type`
- `stem`
- `correct_answer`
- `explanation`

Choice questions must also include:

- `options`

Rules:

- `radio` questions must have exactly one correct answer.
- `checkbox` questions must have one or more correct answers.
- `text` questions use `correct_answer` as a list of accepted answers or keywords.
- Every explanation must be non-empty.
- All operator-facing content must be in English.
- Quote YAML strings that contain `:` or other characters that can confuse YAML parsing.
