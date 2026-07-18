-- SignalBoard v1 database contract. Domain rules are defined in CONTEXT.md.

create schema if not exists private;
revoke all on schema private from public;

create extension if not exists pgcrypto with schema extensions;

create type public.project_status as enum ('planning', 'active', 'review', 'completed');
create type public.project_priority as enum ('low', 'medium', 'high');
create type public.project_activity_type as enum ('created', 'updated', 'status_changed', 'deleted');
create type public.project_deadline_filter as enum ('all', 'overdue', 'upcoming', 'no_deadline');

create table public.projects (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status public.project_status not null default 'planning',
  priority public.project_priority not null default 'medium',
  project_lead text not null,
  deadline date,
  sample_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_title_trimmed check (title = btrim(title) and char_length(title) between 3 and 100),
  constraint projects_description_trimmed check (description is null or (description = btrim(description) and char_length(description) <= 1000)),
  constraint projects_project_lead_trimmed check (project_lead = btrim(project_lead) and char_length(project_lead) between 2 and 80),
  constraint projects_sample_key_trimmed check (sample_key is null or (sample_key = btrim(sample_key) and char_length(sample_key) between 1 and 80))
);

create unique index projects_user_sample_key_unique
  on public.projects (user_id, sample_key)
  where sample_key is not null;
create index projects_user_updated_at_idx on public.projects (user_id, updated_at desc, id desc);
create index projects_user_created_at_idx on public.projects (user_id, created_at desc, id desc);
create index projects_user_status_updated_at_idx on public.projects (user_id, status, updated_at desc, id desc);
create index projects_user_priority_updated_at_idx on public.projects (user_id, priority, updated_at desc, id desc);
create index projects_user_deadline_idx on public.projects (user_id, deadline, id) where deadline is not null;

create table public.project_activities (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  project_title text not null,
  activity_type public.project_activity_type not null,
  changed_fields text[] not null default '{}'::text[],
  changes jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  constraint project_activities_title_not_blank check (char_length(btrim(project_title)) between 1 and 100),
  constraint project_activities_changed_fields_allowlist check (
    changed_fields <@ array['title', 'description', 'status', 'priority', 'project_lead', 'deadline']::text[]
  ),
  constraint project_activities_changes_object check (jsonb_typeof(changes) = 'object')
);

create index project_activities_user_occurred_at_idx on public.project_activities (user_id, occurred_at desc, id desc);
create index project_activities_project_occurred_at_idx on public.project_activities (project_id, occurred_at desc, id desc) where project_id is not null;

create table public.sample_project_sets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  anchor_date date not null,
  loaded_at timestamptz not null default now()
);

-- This private, transaction-bound context is the only activity-clock override.
-- It has no authenticated grants; load_sample_project_set creates and removes it.
create table private.activity_clock (
  transaction_id bigint primary key,
  occurred_at timestamptz not null
);
revoke all on private.activity_clock from public, anon, authenticated;

create function private.current_activity_time()
returns timestamptz
language sql
stable
security definer
set search_path = private, pg_temp
as $$
  select coalesce(
    (select occurred_at from private.activity_clock where transaction_id = txid_current()),
    transaction_timestamp()
  );
$$;

create function private.set_activity_clock(p_occurred_at timestamptz)
returns void
language plpgsql
security definer
set search_path = private, pg_temp
as $$
begin
  insert into private.activity_clock (transaction_id, occurred_at)
  values (txid_current(), p_occurred_at)
  on conflict (transaction_id) do update set occurred_at = excluded.occurred_at;
end;
$$;

revoke all on function private.current_activity_time() from public;
revoke all on function private.set_activity_clock(timestamptz) from public;

create function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  new.updated_at := private.current_activity_time();
  return new;
end;
$$;

create function public.record_project_activity()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_changed_fields text[] := '{}'::text[];
  v_changes jsonb := '{}'::jsonb;
  v_type public.project_activity_type;
  v_project_id uuid;
  v_title text;
  v_user_id uuid;
begin
  if tg_op = 'INSERT' then
    insert into public.project_activities (
      user_id, project_id, project_title, activity_type, changed_fields, changes, occurred_at
    ) values (
      new.user_id,
      new.id,
      new.title,
      'created',
      array['title', 'description', 'status', 'priority', 'project_lead', 'deadline']::text[],
      '{}'::jsonb,
      private.current_activity_time()
    );
    return new;
  end if;

  if tg_op = 'DELETE' then
    insert into public.project_activities (
      user_id, project_id, project_title, activity_type, changed_fields, changes, occurred_at
    ) values (
      old.user_id,
      old.id,
      old.title,
      'deleted',
      '{}'::text[],
      '{}'::jsonb,
      private.current_activity_time()
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
    user_id, project_id, project_title, activity_type, changed_fields, changes, occurred_at
  ) values (
    new.user_id,
    new.id,
    new.title,
    v_type,
    v_changed_fields,
    v_changes,
    private.current_activity_time()
  );
  return new;
end;
$$;

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger projects_record_activity_after_insert
after insert on public.projects
for each row execute function public.record_project_activity();

create trigger projects_record_activity_after_update
after update on public.projects
for each row execute function public.record_project_activity();

create trigger projects_record_activity_before_delete
before delete on public.projects
for each row execute function public.record_project_activity();

alter table public.projects enable row level security;
alter table public.project_activities enable row level security;
alter table public.sample_project_sets enable row level security;

create policy projects_select_own on public.projects for select to authenticated using ((select auth.uid()) = user_id);
create policy projects_insert_own on public.projects for insert to authenticated with check ((select auth.uid()) = user_id);
create policy projects_update_own on public.projects for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy projects_delete_own on public.projects for delete to authenticated using ((select auth.uid()) = user_id);
create policy project_activities_select_own on public.project_activities for select to authenticated using ((select auth.uid()) = user_id);

grant usage on schema public to anon, authenticated;
grant usage on type public.project_status, public.project_priority, public.project_activity_type, public.project_deadline_filter to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select on public.project_activities to authenticated;
revoke insert, update, delete on public.project_activities from authenticated;
revoke all on public.sample_project_sets from authenticated, anon;

create function public.list_projects(
  p_query text default null,
  p_status public.project_status[] default null,
  p_priority public.project_priority[] default null,
  p_deadline public.project_deadline_filter default 'all',
  p_local_date date default null,
  p_sort text default 'updated',
  p_page integer default 1,
  p_page_size integer default 12
)
returns table (
  id uuid,
  title text,
  description text,
  status public.project_status,
  priority public.project_priority,
  project_lead text,
  deadline date,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
declare
  v_today date := coalesce(p_local_date, current_date);
  v_query text := nullif(btrim(p_query), '');
begin
  if p_page < 1 or p_page_size < 1 or p_page_size > 12 then
    raise exception 'Invalid pagination';
  end if;
  if p_sort not in ('updated', 'created', 'deadline', 'title', 'priority') then
    raise exception 'Invalid project sort';
  end if;

  return query
  select
    p.id, p.title, p.description, p.status, p.priority, p.project_lead, p.deadline, p.created_at, p.updated_at,
    count(*) over ()::bigint as total_count
  from public.projects p
  where (v_query is null or p.title ilike '%' || v_query || '%' or coalesce(p.description, '') ilike '%' || v_query || '%' or p.project_lead ilike '%' || v_query || '%')
    and (p_status is null or cardinality(p_status) = 0 or p.status = any(p_status))
    and (p_priority is null or cardinality(p_priority) = 0 or p.priority = any(p_priority))
    and (
      p_deadline = 'all'
      or (p_deadline = 'no_deadline' and p.deadline is null)
      or (p_deadline = 'overdue' and p.status <> 'completed' and p.deadline < v_today)
      or (p_deadline = 'upcoming' and p.status <> 'completed' and p.deadline between v_today and v_today + 14)
    )
  order by
    case when p_sort = 'updated' then p.updated_at end desc,
    case when p_sort = 'created' then p.created_at end desc,
    case when p_sort = 'deadline' then p.deadline end asc nulls last,
    case when p_sort = 'title' then lower(p.title) end asc,
    case when p_sort = 'priority' then case p.priority when 'high' then 1 when 'medium' then 2 else 3 end end asc,
    p.id asc
  limit p_page_size offset ((p_page - 1) * p_page_size);
end;
$$;

create function public.get_dashboard_metrics(p_timezone text default 'UTC', p_local_date date default null)
returns table (
  total_projects bigint,
  active_projects bigint,
  completed_projects bigint,
  completion_rate numeric,
  overdue_projects bigint,
  late_completions bigint,
  completed_with_deadline bigint,
  late_completion_rate numeric
)
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
declare
  v_timezone text := 'UTC';
  v_today date;
begin
  if p_timezone is not null and exists (select 1 from pg_timezone_names where name = p_timezone) then
    v_timezone := p_timezone;
  end if;
  v_today := coalesce(p_local_date, (current_timestamp at time zone v_timezone)::date);

  return query
  with current_projects as (
    select p.*,
      (
        select max(a.occurred_at)
        from public.project_activities a
        where a.project_id = p.id
          and a.activity_type = 'status_changed'
          and a.changes #>> '{status,after}' = 'completed'
      ) as latest_completed_at
    from public.projects p
  ), counts as (
    select
      count(*)::bigint as total_projects,
      count(*) filter (where status = 'active')::bigint as active_projects,
      count(*) filter (where status = 'completed')::bigint as completed_projects,
      count(*) filter (where status <> 'completed' and deadline < v_today)::bigint as overdue_projects,
      count(*) filter (where status = 'completed' and deadline is not null)::bigint as completed_with_deadline,
      count(*) filter (
        where status = 'completed'
          and deadline is not null
          and latest_completed_at is not null
          and (latest_completed_at at time zone v_timezone)::date > deadline
      )::bigint as late_completions
    from current_projects
  )
  select
    c.total_projects,
    c.active_projects,
    c.completed_projects,
    case when c.total_projects = 0 then null else round((c.completed_projects::numeric / c.total_projects) * 100, 1) end,
    c.overdue_projects,
    c.late_completions,
    c.completed_with_deadline,
    case when c.completed_with_deadline = 0 then null else round((c.late_completions::numeric / c.completed_with_deadline) * 100, 1) end
  from counts c;
end;
$$;

create function public.get_status_distribution()
returns table (status public.project_status, project_count bigint, percentage numeric)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with statuses(status, position) as (
    values
      ('planning'::public.project_status, 1),
      ('active'::public.project_status, 2),
      ('review'::public.project_status, 3),
      ('completed'::public.project_status, 4)
  ), counts as (
    select p.status, count(*)::bigint as project_count from public.projects p group by p.status
  ), total as (select count(*)::numeric as total_projects from public.projects)
  select s.status, coalesce(c.project_count, 0)::bigint,
    case when t.total_projects = 0 then 0 else round((coalesce(c.project_count, 0)::numeric / t.total_projects) * 100, 1) end
  from statuses s
  left join counts c using (status)
  cross join total t
  order by s.position;
$$;

create function public.get_completion_trend(p_timezone text default 'UTC')
returns table (week_start date, completion_count bigint)
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
declare
  v_timezone text := 'UTC';
  v_current_week date;
begin
  if p_timezone is not null and exists (select 1 from pg_timezone_names where name = p_timezone) then
    v_timezone := p_timezone;
  end if;
  v_current_week := date_trunc('week', current_timestamp at time zone v_timezone)::date;

  return query
  with weeks as (
    select (v_current_week - (series.week_offset * 7))::date as week_start
    from generate_series(0, 11) as series(week_offset)
  ), completion_events as (
    select date_trunc('week', a.occurred_at at time zone v_timezone)::date as week_start, count(*)::bigint as completion_count
    from public.project_activities a
    where a.activity_type = 'status_changed'
      and a.changes #>> '{status,after}' = 'completed'
    group by 1
  )
  select w.week_start, coalesce(e.completion_count, 0)::bigint
  from weeks w
  left join completion_events e using (week_start)
  order by w.week_start;
end;
$$;

create function public.get_upcoming_deadlines(p_local_date date default current_date)
returns table (
  id uuid,
  title text,
  project_lead text,
  status public.project_status,
  priority public.project_priority,
  deadline date
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select p.id, p.title, p.project_lead, p.status, p.priority, p.deadline
  from public.projects p
  where p.status <> 'completed'
    and p.deadline between p_local_date and p_local_date + 14
  order by p.deadline asc, p.title asc, p.id asc;
$$;

create function private.sample_activity_timestamp(p_anchor_date date, p_offset_days integer)
returns timestamptz
language sql
immutable
security definer
set search_path = private, pg_temp
as $$
  select ((p_anchor_date + p_offset_days)::timestamp + time '12:00') at time zone 'UTC';
$$;
revoke all on function private.sample_activity_timestamp(date, integer) from public;

create function public.load_sample_project_set()
returns table (inserted_count integer, total_projects bigint, anchor_date date)
language plpgsql
security definer
set search_path = public, private, auth, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_anchor_date date;
  v_sample record;
  v_project_id uuid;
  v_inserted_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.sample_project_sets (user_id, anchor_date)
  values (v_user_id, (current_timestamp at time zone 'UTC')::date)
  on conflict (user_id) do nothing;

  select s.anchor_date into v_anchor_date
  from public.sample_project_sets s
  where s.user_id = v_user_id
  for update;

  for v_sample in
    select * from (values
      ('website-refresh', 'Website refresh', 'Refresh the portfolio website and publish the updated case studies.', 'planning'::public.project_status, 'planning'::public.project_status, 'high'::public.project_priority, 'Maya Chen', 10, -18, null::integer),
      ('mobile-onboarding', 'Mobile onboarding', 'Improve the first-session experience for new mobile users.', 'active'::public.project_status, 'active'::public.project_status, 'high'::public.project_priority, 'Noah Williams', 5, -28, null::integer),
      ('accessibility-audit', 'Accessibility audit', 'Resolve keyboard and contrast findings from the accessibility review.', 'review'::public.project_status, 'review'::public.project_status, 'medium'::public.project_priority, 'Olivia Brown', 14, -20, null::integer),
      ('billing-copy', 'Billing copy update', 'Clarify plan limits and billing language across the product.', 'active'::public.project_status, 'completed'::public.project_status, 'low'::public.project_priority, 'Ethan Davis', -5, -70, -63),
      ('design-tokens', 'Design token cleanup', 'Consolidate color and spacing tokens used by shared components.', 'active'::public.project_status, 'active'::public.project_status, 'medium'::public.project_priority, 'Emma Wilson', null::integer, -12, null::integer),
      ('analytics-export', 'Analytics export', 'Prepare a concise weekly analytics export for product review.', 'active'::public.project_status, 'completed'::public.project_status, 'high'::public.project_priority, 'Liam Martinez', -14, -76, -58),
      ('api-hardening', 'API hardening', 'Review public endpoint validation and error handling.', 'review'::public.project_status, 'review'::public.project_status, 'high'::public.project_priority, 'Ava Taylor', 3, -9, null::integer),
      ('content-library', 'Content library', 'Organize reusable product copy and empty-state messages.', 'planning'::public.project_status, 'planning'::public.project_status, 'low'::public.project_priority, 'James Anderson', null::integer, -7, null::integer),
      ('performance-budget', 'Performance budget', 'Document a frontend performance budget for the dashboard.', 'active'::public.project_status, 'active'::public.project_status, 'medium'::public.project_priority, 'Sophia Thomas', -2, -16, null::integer),
      ('error-states', 'Error state polish', 'Make recovery guidance consistent across application errors.', 'active'::public.project_status, 'completed'::public.project_status, 'medium'::public.project_priority, 'Benjamin Moore', -20, -84, -60),
      ('search-relevance', 'Search relevance', 'Tune project search labels and no-results guidance.', 'active'::public.project_status, 'active'::public.project_status, 'low'::public.project_priority, 'Isabella Jackson', 8, -21, null::integer),
      ('release-notes', 'Release notes', 'Write release notes for the current product iteration.', 'planning'::public.project_status, 'planning'::public.project_status, 'medium'::public.project_priority, 'Lucas White', null::integer, -4, null::integer),
      ('security-review', 'Security review', 'Complete the scheduled permissions and dependency review.', 'review'::public.project_status, 'review'::public.project_status, 'high'::public.project_priority, 'Mia Harris', 12, -11, null::integer),
      ('customer-interviews', 'Customer interviews', 'Summarize insights from the latest customer interviews.', 'active'::public.project_status, 'completed'::public.project_status, 'low'::public.project_priority, 'Henry Martin', -9, -64, -45),
      ('dashboard-empty-state', 'Dashboard empty state', 'Refine onboarding guidance for empty workspaces.', 'active'::public.project_status, 'active'::public.project_status, 'medium'::public.project_priority, 'Amelia Thompson', 1, -15, null::integer),
      ('localization-qa', 'Localization QA', 'Check long Ukrainian interface copy at all supported widths.', 'planning'::public.project_status, 'planning'::public.project_status, 'medium'::public.project_priority, 'Alexander Garcia', 13, -6, null::integer),
      ('dependency-updates', 'Dependency updates', 'Apply the planned stable dependency updates.', 'active'::public.project_status, 'completed'::public.project_status, 'high'::public.project_priority, 'Charlotte Martinez', -11, -80, -66),
      ('project-archive', 'Project archive', 'Archive completed references and verify retained history.', 'active'::public.project_status, 'active'::public.project_status, 'low'::public.project_priority, 'Daniel Robinson', 6, -10, null::integer)
    ) as samples(sample_key, title, description, initial_status, final_status, priority, project_lead, deadline_offset_days, created_offset_days, completion_offset_days)
  loop
    if not exists (
      select 1 from public.projects p where p.user_id = v_user_id and p.sample_key = v_sample.sample_key
    ) then
      perform private.set_activity_clock(private.sample_activity_timestamp(v_anchor_date, v_sample.created_offset_days));
      insert into public.projects (
        user_id, title, description, status, priority, project_lead, deadline, sample_key, created_at, updated_at
      ) values (
        v_user_id,
        v_sample.title,
        v_sample.description,
        v_sample.initial_status,
        v_sample.priority,
        v_sample.project_lead,
        case when v_sample.deadline_offset_days is null then null else v_anchor_date + v_sample.deadline_offset_days end,
        v_sample.sample_key,
        private.sample_activity_timestamp(v_anchor_date, v_sample.created_offset_days),
        private.sample_activity_timestamp(v_anchor_date, v_sample.created_offset_days)
      ) returning id into v_project_id;

      if v_sample.final_status <> v_sample.initial_status then
        perform private.set_activity_clock(private.sample_activity_timestamp(v_anchor_date, v_sample.completion_offset_days));
        update public.projects set status = v_sample.final_status where id = v_project_id;
      end if;
      v_inserted_count := v_inserted_count + 1;
    end if;
  end loop;

  delete from private.activity_clock where transaction_id = txid_current();
  return query
  select v_inserted_count, count(*)::bigint, v_anchor_date
  from public.projects p
  where p.user_id = v_user_id;
exception when others then
  delete from private.activity_clock where transaction_id = txid_current();
  raise;
end;
$$;

revoke all on function public.set_updated_at() from public;
revoke all on function public.record_project_activity() from public;
revoke all on function public.list_projects(text, public.project_status[], public.project_priority[], public.project_deadline_filter, date, text, integer, integer) from public;
revoke all on function public.get_dashboard_metrics(text, date) from public;
revoke all on function public.get_status_distribution() from public;
revoke all on function public.get_completion_trend(text) from public;
revoke all on function public.get_upcoming_deadlines(date) from public;
revoke all on function public.load_sample_project_set() from public;

grant execute on function public.list_projects(text, public.project_status[], public.project_priority[], public.project_deadline_filter, date, text, integer, integer) to authenticated;
grant execute on function public.get_dashboard_metrics(text, date) to authenticated;
grant execute on function public.get_status_distribution() to authenticated;
grant execute on function public.get_completion_trend(text) to authenticated;
grant execute on function public.get_upcoming_deadlines(date) to authenticated;
grant execute on function public.load_sample_project_set() to authenticated;
