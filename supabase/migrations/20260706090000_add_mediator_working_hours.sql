create table if not exists public.mediator_working_hours (
  id uuid primary key default gen_random_uuid(),
  mediator_id uuid not null references public.mediator_profiles(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  is_enabled boolean not null default true,
  start_time time,
  end_time time,
  break_start time,
  break_end time,
  slot_duration_minutes integer not null default 60 check (slot_duration_minutes > 0),
  buffer_before_minutes integer not null default 15 check (buffer_before_minutes >= 0),
  buffer_after_minutes integer not null default 15 check (buffer_after_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mediator_working_hours_time_order check (
    (is_enabled = false and start_time is null and end_time is null)
    or (is_enabled = true and start_time is not null and end_time is not null and end_time > start_time)
  ),
  constraint mediator_working_hours_break_order check (
    break_start is null
    or break_end is null
    or break_end > break_start
  ),
  constraint mediator_working_hours_mediator_weekday_unique unique (mediator_id, weekday)
);

drop trigger if exists set_mediator_working_hours_updated_at on public.mediator_working_hours;
create trigger set_mediator_working_hours_updated_at
before update on public.mediator_working_hours
for each row execute function public.set_updated_at();

alter table public.mediator_working_hours enable row level security;

drop policy if exists "working_hours_select_scoped" on public.mediator_working_hours;
create policy "working_hours_select_scoped"
on public.mediator_working_hours for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.mediator_profiles mp
    where mp.id = mediator_working_hours.mediator_id
      and (mp.user_id = (select auth.uid()) or mp.status = 'approved')
  )
);

drop policy if exists "working_hours_write_owner_admin" on public.mediator_working_hours;
create policy "working_hours_write_owner_admin"
on public.mediator_working_hours for all
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.mediator_profiles mp
    where mp.id = mediator_working_hours.mediator_id
      and mp.user_id = (select auth.uid())
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.mediator_profiles mp
    where mp.id = mediator_working_hours.mediator_id
      and mp.user_id = (select auth.uid())
  )
);
