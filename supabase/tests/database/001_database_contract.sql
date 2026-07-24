begin;

select plan(53);

-- The approved public database seam: schema, policies, trigger side effects and RPC output.
select ok(to_regtype('public.project_status') is not null, 'project_status enum exists');
select ok(to_regclass('public.projects') is not null, 'projects table exists');
select ok(to_regclass('public.project_activities') is not null, 'project_activities table exists');
select ok(to_regprocedure('public.list_projects(text,project_status[],project_priority[],project_deadline_filter,date,text,integer,integer)') is not null, 'list_projects RPC exists');
select ok(to_regprocedure('public.get_dashboard_metrics(text,date)') is not null, 'dashboard metrics RPC exists');
select ok(to_regprocedure('public.load_sample_project_set()') is not null, 'sample loader RPC exists');
select ok(to_regprocedure('public.toggle_sample_project_set()') is not null, 'sample toggle RPC exists');
select ok(to_regprocedure('public.get_dashboard_snapshot(text,date)') is not null, 'dashboard snapshot RPC exists');

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

insert into public.projects (title, description, status, priority, project_lead)
values ('Retained user project', 'This row and its activity must survive demo cleanup.', 'active', 'high', 'Margaret Hamilton')
returning id as retained_project \gset

select is((select count(*) from public.project_activities where project_id = :'retained_project')::integer, 1, 'user project starts with one activity');
select is((select inserted_count from public.load_sample_project_set()), 18, 'first sample load creates 18 projects');
select is((select inserted_count from public.load_sample_project_set()), 0, 'second sample load is idempotent');
select is((select count(*) from public.projects where sample_key is not null)::integer, 18, 'sample set has exactly 18 projects');

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select is((select inserted_count from public.load_sample_project_set()), 18, 'User B can load an independent sample set');
select is((select count(*) from public.projects where sample_key is not null)::integer, 18, 'User B sees only their 18 sample projects');
select count(*)::integer as user_b_sample_activity_count
from public.project_activities
where sample_key is not null \gset
select cmp_ok(:'user_b_sample_activity_count'::integer, '>', 0, 'User B has independent sample activity');

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select is(
  (public.get_dashboard_snapshot('UTC', current_date) #>> '{metrics,total_projects}')::integer,
  19,
  'dashboard snapshot includes user and demo projects'
);
select is(
  jsonb_typeof(public.get_dashboard_snapshot('UTC', current_date) -> 'activity'),
  'array',
  'dashboard snapshot returns activity as an array'
);

delete from public.projects
where id = (select id from public.projects where sample_key is not null order by sample_key limit 1);
select is((select count(*) from public.projects where sample_key is not null)::integer, 17, 'manually deleting one demo leaves a partial enabled set');

select enabled, affected_count, total_projects from public.toggle_sample_project_set() \gset remove_
select is(:'remove_enabled'::boolean, false, 'toggle disables a partial demo set');
select is(:'remove_affected_count'::integer, 17, 'toggle removes all remaining demo projects');
select is(:'remove_total_projects'::bigint, 1::bigint, 'toggle reports only the retained user project');
select is((select count(*) from public.projects where sample_key is not null)::integer, 0, 'demo cleanup leaves no demo projects');
select is((select count(*) from public.project_activities where sample_key is not null)::integer, 0, 'demo cleanup removes all demo activity including detached history');
select is((select count(*) from public.projects where id = :'retained_project')::integer, 1, 'demo cleanup preserves the user project');
select is((select count(*) from public.project_activities where project_id = :'retained_project')::integer, 1, 'demo cleanup preserves user project activity');
set local role postgres;
select is(
  (select count(*) from public.sample_project_sets where user_id = '11111111-1111-1111-1111-111111111111')::integer,
  0,
  'demo cleanup removes only User A sample set marker'
);
select is(
  (select count(*) from public.sample_project_sets where user_id = '22222222-2222-2222-2222-222222222222')::integer,
  1,
  'demo cleanup preserves User B sample set marker'
);
select is(
  (select count(*) from public.projects where user_id = '22222222-2222-2222-2222-222222222222' and sample_key is not null)::integer,
  18,
  'demo cleanup preserves User B sample projects'
);
select is(
  (select count(*) from public.project_activities where user_id = '22222222-2222-2222-2222-222222222222' and sample_key is not null)::integer,
  :'user_b_sample_activity_count'::integer,
  'demo cleanup preserves User B sample activity'
);
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select enabled, affected_count, total_projects from public.toggle_sample_project_set() \gset restore_
select is(:'restore_enabled'::boolean, true, 'next toggle restores demo mode');
select is(:'restore_affected_count'::integer, 18, 'restoring demo mode inserts exactly 18 projects');
select is((select count(*) from public.projects where sample_key is not null)::integer, 18, 'restored demo set contains exactly 18 projects');

select * from finish();
rollback;
