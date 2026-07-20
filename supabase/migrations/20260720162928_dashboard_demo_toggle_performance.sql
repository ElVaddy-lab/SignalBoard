-- Persist demo provenance on activity rows so cleanup remains reliable even
-- after an individual demo project has already been deleted.
alter table public.project_activities add column sample_key text;

alter table public.project_activities
  add constraint project_activities_sample_key_trimmed
  check (sample_key is null or (sample_key = btrim(sample_key) and char_length(sample_key) between 1 and 80));

create index project_activities_user_sample_key_idx
  on public.project_activities (user_id, sample_key)
  where sample_key is not null;

update public.project_activities a
set sample_key = p.sample_key
from public.projects p
where a.project_id = p.id
  and a.user_id = p.user_id
  and p.sample_key is not null;

-- Suppress activity only inside trusted, transaction-scoped maintenance flows.
create or replace function private.record_project_activity()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_changed_fields text[] := '{}'::text[];
  v_changes jsonb := '{}'::jsonb;
  v_type public.project_activity_type;
begin
  if current_setting('signalboard.suppress_project_activity', true) = 'on' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    insert into public.project_activities (
      user_id, project_id, project_title, activity_type, changed_fields, changes, occurred_at, sample_key
    ) values (
      new.user_id,
      new.id,
      new.title,
      'created',
      array['title', 'description', 'status', 'priority', 'project_lead', 'deadline']::text[],
      '{}'::jsonb,
      private.current_activity_time(),
      new.sample_key
    );
    return new;
  end if;

  if tg_op = 'DELETE' then
    insert into public.project_activities (
      user_id, project_id, project_title, activity_type, changed_fields, changes, occurred_at, sample_key
    ) values (
      old.user_id,
      old.id,
      old.title,
      'deleted',
      '{}'::text[],
      '{}'::jsonb,
      private.current_activity_time(),
      old.sample_key
    );
    return old;
  end if;

  if new.title is distinct from old.title then
    v_changed_fields := array_append(v_changed_fields, 'title');
  end if;
  if new.description is distinct from old.description then
    v_changed_fields := array_append(v_changed_fields, 'description');
  end if;
  if new.status is distinct from old.status then
    v_changed_fields := array_append(v_changed_fields, 'status');
    v_changes := v_changes || jsonb_build_object('status', jsonb_build_object('before', old.status::text, 'after', new.status::text));
  end if;
  if new.priority is distinct from old.priority then
    v_changed_fields := array_append(v_changed_fields, 'priority');
    v_changes := v_changes || jsonb_build_object('priority', jsonb_build_object('before', old.priority::text, 'after', new.priority::text));
  end if;
  if new.project_lead is distinct from old.project_lead then
    v_changed_fields := array_append(v_changed_fields, 'project_lead');
    v_changes := v_changes || jsonb_build_object('project_lead', jsonb_build_object('before', old.project_lead, 'after', new.project_lead));
  end if;
  if new.deadline is distinct from old.deadline then
    v_changed_fields := array_append(v_changed_fields, 'deadline');
    v_changes := v_changes || jsonb_build_object('deadline', jsonb_build_object('before', old.deadline, 'after', new.deadline));
  end if;

  if cardinality(v_changed_fields) = 0 then
    return new;
  end if;

  v_type := case when 'status' = any(v_changed_fields) then 'status_changed' else 'updated' end;
  insert into public.project_activities (
    user_id, project_id, project_title, activity_type, changed_fields, changes, occurred_at, sample_key
  ) values (
    new.user_id,
    new.id,
    new.title,
    v_type,
    v_changed_fields,
    v_changes,
    private.current_activity_time(),
    new.sample_key
  );
  return new;
end;
$$;

create function private.toggle_sample_project_set()
returns table (enabled boolean, affected_count integer, total_projects bigint)
language plpgsql
volatile
security definer
set search_path = public, private, auth, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_affected_count integer := 0;
  v_total_projects bigint := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  if exists (
    select 1
    from public.projects p
    where p.user_id = v_user_id
      and p.sample_key is not null
  ) then
    perform set_config('signalboard.suppress_project_activity', 'on', true);

    delete from public.project_activities a
    where a.user_id = v_user_id
      and a.sample_key is not null;

    delete from public.projects p
    where p.user_id = v_user_id
      and p.sample_key is not null;
    get diagnostics v_affected_count = row_count;

    delete from public.sample_project_sets s where s.user_id = v_user_id;
    perform set_config('signalboard.suppress_project_activity', 'off', true);

    select count(*)::bigint into v_total_projects
    from public.projects p
    where p.user_id = v_user_id;

    return query select false, v_affected_count, v_total_projects;
    return;
  end if;

  select loaded.inserted_count, loaded.total_projects
  into v_affected_count, v_total_projects
  from private.load_sample_project_set() loaded;

  return query select true, v_affected_count, v_total_projects;
end;
$$;

revoke all on function private.toggle_sample_project_set() from public, anon, authenticated, service_role;
grant execute on function private.toggle_sample_project_set() to authenticated;

create function public.toggle_sample_project_set()
returns table (enabled boolean, affected_count integer, total_projects bigint)
language sql
volatile
security invoker
set search_path = public, private, auth, pg_temp
as $$
  select * from private.toggle_sample_project_set();
$$;

revoke all on function public.toggle_sample_project_set() from public, anon, authenticated, service_role;
grant execute on function public.toggle_sample_project_set() to authenticated;

create function public.get_dashboard_snapshot(
  p_timezone text default 'UTC',
  p_local_date date default null
)
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'metrics', coalesce((
      select to_jsonb(metrics)
      from public.get_dashboard_metrics(p_timezone, p_local_date) metrics
    ), '{}'::jsonb),
    'status_distribution', coalesce((
      select jsonb_agg(to_jsonb(distribution) order by array_position(
        array['planning', 'active', 'review', 'completed']::text[],
        distribution.status::text
      ))
      from public.get_status_distribution() distribution
    ), '[]'::jsonb),
    'trend', coalesce((
      select jsonb_agg(to_jsonb(trend) order by trend.week_start)
      from public.get_completion_trend(p_timezone) trend
    ), '[]'::jsonb),
    'upcoming', coalesce((
      select jsonb_agg(to_jsonb(upcoming) order by upcoming.deadline, upcoming.title, upcoming.id)
      from public.get_upcoming_deadlines(coalesce(p_local_date, current_date)) upcoming
    ), '[]'::jsonb),
    'recent_projects', coalesce((
      select jsonb_agg(to_jsonb(recent) order by recent.updated_at desc, recent.id desc)
      from (
        select p.id, p.title, p.description, p.status, p.priority, p.project_lead,
          p.deadline, p.created_at, p.updated_at
        from public.projects p
        order by p.updated_at desc, p.id desc
        limit 5
      ) recent
    ), '[]'::jsonb),
    'activity', coalesce((
      select jsonb_agg(to_jsonb(activity) order by activity.occurred_at desc, activity.id desc)
      from (
        select a.id, a.project_id, a.project_title, a.activity_type,
          a.changed_fields, a.changes, a.occurred_at
        from public.project_activities a
        order by a.occurred_at desc, a.id desc
        limit 8
      ) activity
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.get_dashboard_snapshot(text, date) from public, anon, authenticated, service_role;
grant execute on function public.get_dashboard_snapshot(text, date) to authenticated;
