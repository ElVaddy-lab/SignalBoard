-- Keep trigger and privileged loader functions out of the exposed public schema.
-- The public loader RPC remains an invoker-only authenticated entry point.

alter function public.set_updated_at() set schema private;
alter function public.record_project_activity() set schema private;
alter function public.load_sample_project_set() set schema private;

revoke all on function private.set_updated_at() from public, anon, authenticated, service_role;
revoke all on function private.record_project_activity() from public, anon, authenticated, service_role;
revoke all on function private.load_sample_project_set() from public, anon, authenticated, service_role;

grant usage on schema private to authenticated;
grant execute on function private.load_sample_project_set() to authenticated;

create function public.load_sample_project_set()
returns table (inserted_count integer, total_projects bigint, anchor_date date)
language sql
volatile
security invoker
set search_path = public, private, auth, pg_temp
as $$
  select * from private.load_sample_project_set();
$$;

revoke all on function public.load_sample_project_set() from public, anon, authenticated, service_role;
grant execute on function public.load_sample_project_set() to authenticated;
