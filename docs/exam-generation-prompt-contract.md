# Exam Generation Prompt Contract

Use this contract when asking an AI agent to draft a new exam bundle for the repository-local exam CLI.

## Required Prompt Fields

- subject or topic
- intended level
- question count
- question type mix
- language
- access password
- publish target
- whether to randomize questions
- whether to randomize options

## Recommended Prompt Template

```text
Generate an English-only exam bundle for this repository.

Topic: introductory macroeconomics
Level: beginner undergraduate
Question count: 10
Question types: 10 radio questions
Access password: 123
Publish target: no
Randomize questions: yes
Randomize options: no

Requirements:
- Output must follow the repository YAML exam bundle schema.
- Every question must include a clear explanation.
- Use strong distractors for choice questions.
- Avoid HTML.
- Keep the wording suitable for international students.
- Save the bundle under content/exams/<generated-slug>.yaml.
- Generate a matching Markdown review summary.
```

## Output Requirements

The AI should produce:

1. a valid YAML bundle
2. a matching `.review.md` summary
3. no direct database mutation before human approval

## Review Rule

The operator must review the generated bundle and summary before running:

- `npm run exam -- apply <bundle>`
- `npm run exam -- publish <bundle>`
- `npm run exam -- full-pipeline <bundle> --approved`
