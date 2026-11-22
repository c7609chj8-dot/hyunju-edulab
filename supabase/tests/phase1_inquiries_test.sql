BEGIN;
SELECT plan(15);

SELECT has_table('public', 'administrator_roles', 'administrator role table exists');
SELECT has_table('public', 'inquiries', 'inquiry table exists');
SELECT has_table('public', 'inquiry_events', 'inquiry event table exists');
SELECT has_table('public', 'administrator_audit_logs', 'administrator audit table exists');

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.administrator_roles'::regclass),
  'administrator roles use RLS'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.inquiries'::regclass),
  'inquiries use RLS'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.inquiry_events'::regclass),
  'inquiry events use RLS'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.administrator_audit_logs'::regclass),
  'administrator audit logs use RLS'
);
SELECT ok(
  not has_table_privilege('anon', 'public.inquiries', 'select'),
  'anonymous users cannot read inquiries directly'
);
SELECT ok(
  not has_table_privilege('authenticated', 'public.inquiries', 'select'),
  'authenticated users cannot read inquiries directly'
);

SELECT is(
  (
    SELECT outcome
      FROM public.create_inquiry(
        '11111111-1111-4111-8111-111111111111',
        'HJ-ABCDEFGHJKLM',
        repeat('a', 64),
        repeat('b', 64),
        'school-safety',
        'safety',
        '테스트 담당자',
        '010-0000-0000',
        'tester@example.test',
        '합성 데이터로 저장 동작을 확인합니다.',
        'temporary-test-v1',
        '2026-11-22T00:00:00Z',
        '2026-12-22T00:00:00Z',
        '2026-11-22T00:00:00Z'
      )
  ),
  'created',
  'a synthetic inquiry is stored'
);
SELECT is(
  (SELECT count(*)::integer FROM public.inquiry_events WHERE inquiry_id = '11111111-1111-4111-8111-111111111111'),
  1,
  'the submitted event is stored with the inquiry'
);
SELECT is(
  (
    SELECT outcome
      FROM public.create_inquiry(
        '22222222-2222-4222-8222-222222222222',
        'HJ-NPQRSTUVWXYZ',
        repeat('a', 64),
        repeat('b', 64),
        'school-safety',
        'safety',
        '테스트 담당자',
        '010-0000-0000',
        'tester@example.test',
        '합성 데이터로 저장 동작을 확인합니다.',
        'temporary-test-v1',
        '2026-11-22T00:00:00Z',
        '2026-12-22T00:00:00Z',
        '2026-11-22T00:00:00Z'
      )
  ),
  'replayed',
  'the same idempotency key and payload replays safely'
);
SELECT is(
  (
    SELECT outcome
      FROM public.create_inquiry(
        '33333333-3333-4333-8333-333333333333',
        'HJ-23456789ABCD',
        repeat('a', 64),
        repeat('c', 64),
        'school-safety',
        'safety',
        '테스트 담당자',
        '010-0000-0000',
        'tester@example.test',
        '다른 본문으로 중복 방지 키를 재사용합니다.',
        'temporary-test-v1',
        '2026-11-22T00:00:00Z',
        '2026-12-22T00:00:00Z',
        '2026-11-22T00:00:00Z'
      )
  ),
  'idempotency_conflict',
  'a reused idempotency key with another payload conflicts'
);
SELECT is(
  (
    SELECT outcome
      FROM public.change_inquiry_status(
        '11111111-1111-4111-8111-111111111111',
        '99999999-9999-4999-8999-999999999999',
        1,
        'reviewing',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      )
  ),
  'forbidden',
  'a user without the administrator role cannot change status'
);

SELECT * FROM finish();
ROLLBACK;
