alter table public.profiles
add column if not exists email_verified boolean not null default false,
add column if not exists account_status text not null default 'pending_verification',
add column if not exists email text;

alter table public.profiles
drop constraint if exists profiles_account_status_check;

alter table public.profiles
add constraint profiles_account_status_check
check (account_status in ('pending_verification', 'active', 'suspended', 'disabled'));

create index if not exists profiles_email_idx on public.profiles(email);
