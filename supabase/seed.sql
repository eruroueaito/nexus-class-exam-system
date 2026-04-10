-- Local development seed for the online exam system.
-- This seed creates two active exams with private answer records and no
-- historical submissions so each local run starts from a clean grading state.

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
    'Introductory Macroeconomics - Quiz 01',
    timezone('utc', now()) - interval '2 days',
    true
  );

insert into app_private.exam_access (exam_id, password_hash)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'
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
  ),
  (
    '22222222-aaaa-aaaa-aaaa-222222222221',
    '22222222-2222-2222-2222-222222222222',
    jsonb_build_object(
      'stem', 'What does GDP measure in macroeconomics?',
      'options', jsonb_build_array(
        jsonb_build_object('id', 'A', 'text', 'The value of total financial assets held by households'),
        jsonb_build_object('id', 'B', 'text', 'The market value of final goods and services produced within a country'),
        jsonb_build_object('id', 'C', 'text', 'Government tax revenue collected in a year'),
        jsonb_build_object('id', 'D', 'text', 'The number of people employed by large firms')
      ),
      'media', jsonb_build_array(),
      'hint', null,
      'points', 1
    ),
    'radio',
    1,
    timezone('utc', now()) - interval '2 days'
  ),
  (
    '22222222-bbbb-bbbb-bbbb-222222222221',
    '22222222-2222-2222-2222-222222222222',
    jsonb_build_object(
      'stem', 'An increase in the overall price level is called:',
      'options', jsonb_build_array(
        jsonb_build_object('id', 'A', 'text', 'Inflation'),
        jsonb_build_object('id', 'B', 'text', 'Recession'),
        jsonb_build_object('id', 'C', 'text', 'Appreciation'),
        jsonb_build_object('id', 'D', 'text', 'Productivity')
      ),
      'media', jsonb_build_array(),
      'hint', null,
      'points', 1
    ),
    'radio',
    2,
    timezone('utc', now()) - interval '2 days'
  ),
  (
    '22222222-cccc-cccc-cccc-222222222221',
    '22222222-2222-2222-2222-222222222222',
    jsonb_build_object(
      'stem', 'If the unemployment rate rises sharply during a downturn, the economy is most likely in a:',
      'options', jsonb_build_array(
        jsonb_build_object('id', 'A', 'text', 'Boom'),
        jsonb_build_object('id', 'B', 'text', 'Recovery'),
        jsonb_build_object('id', 'C', 'text', 'Recession'),
        jsonb_build_object('id', 'D', 'text', 'Trade surplus')
      ),
      'media', jsonb_build_array(),
      'hint', null,
      'points', 1
    ),
    'radio',
    3,
    timezone('utc', now()) - interval '2 days'
  ),
  (
    '22222222-dddd-dddd-dddd-222222222221',
    '22222222-2222-2222-2222-222222222222',
    jsonb_build_object(
      'stem', 'Which institution is usually responsible for setting monetary policy?',
      'options', jsonb_build_array(
        jsonb_build_object('id', 'A', 'text', 'The central bank'),
        jsonb_build_object('id', 'B', 'text', 'The labor union'),
        jsonb_build_object('id', 'C', 'text', 'The stock exchange'),
        jsonb_build_object('id', 'D', 'text', 'The census bureau')
      ),
      'media', jsonb_build_array(),
      'hint', null,
      'points', 1
    ),
    'radio',
    4,
    timezone('utc', now()) - interval '2 days'
  ),
  (
    '22222222-eeee-eeee-eeee-222222222221',
    '22222222-2222-2222-2222-222222222222',
    jsonb_build_object(
      'stem', 'When the government increases spending to support demand, it is using:',
      'options', jsonb_build_array(
        jsonb_build_object('id', 'A', 'text', 'Fiscal policy'),
        jsonb_build_object('id', 'B', 'text', 'Comparative advantage'),
        jsonb_build_object('id', 'C', 'text', 'Price discrimination'),
        jsonb_build_object('id', 'D', 'text', 'Opportunity cost accounting')
      ),
      'media', jsonb_build_array(),
      'hint', null,
      'points', 1
    ),
    'radio',
    5,
    timezone('utc', now()) - interval '2 days'
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
  ),
  (
    'dddd4444-1111-1111-1111-111111111111',
    '22222222-aaaa-aaaa-aaaa-222222222221',
    '["B"]'::jsonb,
    'GDP tracks the market value of final goods and services produced within a country over a period.',
    timezone('utc', now()) - interval '2 days'
  ),
  (
    'eeee5555-2222-2222-2222-222222222222',
    '22222222-bbbb-bbbb-bbbb-222222222221',
    '["A"]'::jsonb,
    'Inflation means a sustained increase in the general price level.',
    timezone('utc', now()) - interval '2 days'
  ),
  (
    'ffff6666-3333-3333-3333-333333333333',
    '22222222-cccc-cccc-cccc-222222222221',
    '["C"]'::jsonb,
    'Recessions are associated with falling output and rising unemployment.',
    timezone('utc', now()) - interval '2 days'
  ),
  (
    'aaaa7777-4444-4444-4444-444444444444',
    '22222222-dddd-dddd-dddd-222222222221',
    '["A"]'::jsonb,
    'Monetary policy is typically conducted by the central bank.',
    timezone('utc', now()) - interval '2 days'
  ),
  (
    'bbbb8888-5555-5555-5555-555555555555',
    '22222222-eeee-eeee-eeee-222222222221',
    '["A"]'::jsonb,
    'Government spending and taxation decisions are part of fiscal policy.',
    timezone('utc', now()) - interval '2 days'
  );
