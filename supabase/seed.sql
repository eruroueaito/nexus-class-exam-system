-- Local development seed for the online exam system.
-- This seed creates one active exam with sample questions, answers, and a small
-- submission history so both the student flow and future analytics work can be
-- exercised against a real local Supabase stack.

insert into public.exams (id, title, created_at, is_active)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'Microeconomics - Midterm Assessment',
    timezone('utc', now()) - interval '3 days',
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Macroeconomics - Exercise Set 04',
    timezone('utc', now()) - interval '1 day',
    false
  );

insert into app_private.exam_access (exam_id, password_hash)
values (
  '11111111-1111-1111-1111-111111111111',
  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'
);

insert into public.questions (id, exam_id, content, type, order_index, created_at)
values
  (
    '11111111-aaaa-aaaa-aaaa-111111111111',
    '11111111-1111-1111-1111-111111111111',
    jsonb_build_object(
      'stem', 'What does opportunity cost describe?',
      'options', jsonb_build_array(
        jsonb_build_object('id', 'A', 'text', 'Money already spent on a choice'),
        jsonb_build_object('id', 'B', 'text', 'The next best alternative foregone'),
        jsonb_build_object('id', 'C', 'text', 'The market price of a good')
      ),
      'media', jsonb_build_array(),
      'hint', null,
      'points', 1
    ),
    'radio',
    1,
    timezone('utc', now()) - interval '3 days'
  ),
  (
    '22222222-bbbb-bbbb-bbbb-222222222222',
    '11111111-1111-1111-1111-111111111111',
    jsonb_build_object(
      'stem', 'Select every characteristic that fits a perfectly competitive market.',
      'options', jsonb_build_array(
        jsonb_build_object('id', 'A', 'text', 'Many buyers and sellers'),
        jsonb_build_object('id', 'B', 'text', 'Identical products'),
        jsonb_build_object('id', 'C', 'text', 'Strong barriers to entry')
      ),
      'media', jsonb_build_array(),
      'hint', null,
      'points', 1
    ),
    'checkbox',
    2,
    timezone('utc', now()) - interval '3 days'
  ),
  (
    '33333333-cccc-cccc-cccc-333333333333',
    '11111111-1111-1111-1111-111111111111',
    jsonb_build_object(
      'stem', 'Name the market structure with many sellers and differentiated products.',
      'media', jsonb_build_array(),
      'hint', 'Use the standard textbook term.',
      'points', 1
    ),
    'text',
    3,
    timezone('utc', now()) - interval '3 days'
  );

insert into app_private.answers_library (id, question_id, correct_answer, explanation, created_at)
values
  (
    'aaaa1111-1111-1111-1111-111111111111',
    '11111111-aaaa-aaaa-aaaa-111111111111',
    '["B"]'::jsonb,
    'Opportunity cost is the value of the next best option that must be given up when a choice is made.',
    timezone('utc', now()) - interval '3 days'
  ),
  (
    'bbbb2222-2222-2222-2222-222222222222',
    '22222222-bbbb-bbbb-bbbb-222222222222',
    '["A","B"]'::jsonb,
    'Perfect competition requires many firms and standardized products, but not barriers to entry.',
    timezone('utc', now()) - interval '3 days'
  ),
  (
    'cccc3333-3333-3333-3333-333333333333',
    '33333333-cccc-cccc-cccc-333333333333',
    jsonb_build_object('keywords', jsonb_build_array('monopolistic competition')),
    'Monopolistic competition combines many firms with product differentiation and relatively free entry.',
    timezone('utc', now()) - interval '3 days'
  );

insert into public.submissions (id, exam_id, user_name, score, duration, submitted_at)
values
  (
    'aaaa4444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'Alice Chen',
    1,
    782,
    timezone('utc', now()) - interval '2 days'
  ),
  (
    'bbbb5555-5555-5555-5555-555555555555',
    '11111111-1111-1111-1111-111111111111',
    'David Park',
    0.6666666667,
    901,
    timezone('utc', now()) - interval '1 day'
  );

insert into public.submission_items (
  id,
  submission_id,
  question_id,
  user_answer,
  is_correct,
  correct_answer_snapshot,
  explanation_snapshot,
  answered_at
)
values
  (
    '44444444-1111-1111-1111-111111111111',
    'aaaa4444-4444-4444-4444-444444444444',
    '11111111-aaaa-aaaa-aaaa-111111111111',
    '["B"]'::jsonb,
    true,
    '["B"]'::jsonb,
    'Opportunity cost is the value of the next best option that must be given up when a choice is made.',
    timezone('utc', now()) - interval '2 days'
  ),
  (
    '55555555-2222-2222-2222-222222222222',
    'aaaa4444-4444-4444-4444-444444444444',
    '22222222-bbbb-bbbb-bbbb-222222222222',
    '["A","B"]'::jsonb,
    true,
    '["A","B"]'::jsonb,
    'Perfect competition requires many firms and standardized products, but not barriers to entry.',
    timezone('utc', now()) - interval '2 days'
  ),
  (
    '66666666-3333-3333-3333-333333333333',
    'aaaa4444-4444-4444-4444-444444444444',
    '33333333-cccc-cccc-cccc-333333333333',
    '"Monopolistic competition"'::jsonb,
    true,
    jsonb_build_object('keywords', jsonb_build_array('monopolistic competition')),
    'Monopolistic competition combines many firms with product differentiation and relatively free entry.',
    timezone('utc', now()) - interval '2 days'
  ),
  (
    '77777777-4444-4444-4444-444444444444',
    'bbbb5555-5555-5555-5555-555555555555',
    '11111111-aaaa-aaaa-aaaa-111111111111',
    '["A"]'::jsonb,
    false,
    '["B"]'::jsonb,
    'Opportunity cost is the value of the next best option that must be given up when a choice is made.',
    timezone('utc', now()) - interval '1 day'
  ),
  (
    '88888888-5555-5555-5555-555555555555',
    'bbbb5555-5555-5555-5555-555555555555',
    '22222222-bbbb-bbbb-bbbb-222222222222',
    '["A","B"]'::jsonb,
    true,
    '["A","B"]'::jsonb,
    'Perfect competition requires many firms and standardized products, but not barriers to entry.',
    timezone('utc', now()) - interval '1 day'
  ),
  (
    '99999999-6666-6666-6666-666666666666',
    'bbbb5555-5555-5555-5555-555555555555',
    '33333333-cccc-cccc-cccc-333333333333',
    '"Oligopoly"'::jsonb,
    false,
    jsonb_build_object('keywords', jsonb_build_array('monopolistic competition')),
    'Monopolistic competition combines many firms with product differentiation and relatively free entry.',
    timezone('utc', now()) - interval '1 day'
  );
