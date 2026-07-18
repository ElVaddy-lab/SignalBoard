begin;

select plan(30);

-- The approved public database seam: schema, policies, trigger side effects and RPC output.
select ok(to_regtype('public.project_status') is not null, 'project_status enum exists');
select ok(to_regclass('public.projects') is not null, 'projects table exists');
select ok(to_regclass('public.project_activities') is not null, 'project_activities table exists');
select ok(to_regprocedure('public.list_projects(text,project_status[],project_priority[],project_deadline_filter,date,text,integer,integer)') is not null, 'list_projects RPC exists');
select ok(to_regprocedure('public.get_dashboard_metrics(text,date)') is not null, 'dashboard metrics RPC exists');
select ok(to_regprocedure('public.load_sample_project_set()') is not null, 'sample loader RPC exists');

insert into auth.users (id, aud, role, email)
values
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'signalboard-a@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'signalboard-b@example.test');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

insert into public.projects (title, description, status, priority, project_lead, deadline)
values ('Contract project', 'Initial description', 'planning', 'medium', 'Ada Lovelace', current_date + 7)
returning id as project_a \gset

select is(
  (select count(*) from public.project_activities where project_id = :'project_a')::integer,
  1,
  'project insert creates one created activity'
);

update public.projects
set description = 'Revised description'
where id = :'project_a';

select is(
  (select count(*) from public.project_activities where project_id = :'project_a')::integer,
  2,
  'material update creates exactly one additional activity'
);

select is(
  (select changed_fields from public.project_activities where project_id = :'project_a' and changed_fields = array['description']::text[] limit 1),
  array['description']::text[],
  'description update records only the changed field'
);

select ok(
  not exists (
    select 1
    from public.project_activities
    where project_id = :'project_a'
      and changes::text ilike '%Revised description%'
  ),
  'description contents never enter activity history'
);

update public.projects
set title = title
where id = :'project_a';

select is(
  (select count(*) from public.project_activities where project_id = :'project_a')::integer,
  2,
  'no-op update creates no activity'
);

update public.projects
set status = 'completed'
where id = :'project_a';

select is(
  (select activity_type::text from public.project_activities where project_id = :'project_a' and activity_type = 'status_changed' and 'status' = any(changed_fields) limit 1),
  'status_changed',
  'status updates are classified as status_changed'
);

select is(
  (select changes #>> '{status,after}' from public.project_activities where project_id = :'project_a' and activity_type = 'status_changed' and 'status' = any(changed_fields) limit 1),
  'completed',
  'status activity retains its safe after value'
);

select is(
  (select count(*) from public.get_dashboard_metrics('UTC', current_date)),
  1::bigint,
  'dashboard metrics returns one typed row'
);

select is(
  (select total_projects from public.get_dashboard_metrics('UTC', current_date)),
  1::bigint,
  'dashboard metrics count current projects'
);

select is(
  (select count(*)::bigint from public.get_completion_trend('UTC') where completion_count = 1),
  1::bigint,
  'completion trend includes a transition into completed'
);

delete from public.projects where id = :'project_a';

select is((select count(*) from public.projects where id = :'project_a')::integer, 0, 'hard delete removes project');
select is((select count(*) from public.project_activities where project_id is null and project_title = 'Contract project')::integer, 4, 'hard delete retains and detaches activity history');
select ok(not has_table_privilege('authenticated', 'public.project_activities', 'insert'), 'authenticated cannot insert activities directly');
select ok(not has_table_privilege('authenticated', 'public.project_activities', 'update'), 'authenticated cannot update activities directly');
select ok(not has_table_privilege('authenticated', 'public.project_activities', 'delete'), 'authenticated cannot delete activities directly');

insert into public.projects (title, description, status, priority, project_lead)
values ('Isolation project', 'Only User A may access this row.', 'active', 'high', 'Grace Hopper')
returning id as isolation_project \gset

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select throws_ok(
  $$
    insert into public.projects (user_id, title, description, status, priority, project_lead)
    values ('11111111-1111-1111-1111-111111111111', 'Spoofed project', 'Must be rejected by RLS.', 'planning', 'medium', 'Mallory')
  $$,
  '42501',
  'new row violates row-level security policy for table "projects"',
  'User B cannot insert a project for User A'
);
select is((select count(*) from public.projects where id = :'isolation_project')::integer, 0, 'User B cannot read User A projects');
select is((select count(*) from public.project_activities where project_title = 'Isolation project')::integer, 0, 'User B cannot read User A activity');
select results_eq(
  format('update public.projects set title = %L where id = %L returning id', 'Leaked title', :'isolation_project'),
  'select null::uuid where false',
  'User B cannot update User A projects'
);
select results_eq(
  format('delete from public.projects where id = %L returning id', :'isolation_project'),
  'select null::uuid where false',
  'User B cannot delete User A projects'
);
select is((select count(*) from public.list_projects())::integer, 0, 'list_projects remains subject to ownership RLS');

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
delete from public.projects where id = :'isolation_project';
select is((select inserted_count from public.load_sample_project_set()), 18, 'first sample load creates 18 projects');
select is((select inserted_count from public.load_sample_project_set()), 0, 'second sample load is idempotent');
select is((select count(*) from public.projects where sample_key is not null)::integer, 18, 'sample set has exactly 18 projects');

select * from finish();
rollback;
