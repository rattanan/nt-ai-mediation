create table if not exists public.mediator_trust_scores (
  id uuid primary key default gen_random_uuid(),
  mediator_id uuid not null unique references public.mediator_profiles(id) on delete cascade,
  overall_score integer not null default 0 check (overall_score between 0 and 100),
  rating_score integer not null default 0 check (rating_score between 0 and 100),
  success_rate_score integer not null default 0 check (success_rate_score between 0 and 100),
  experience_score integer not null default 0 check (experience_score between 0 and 100),
  response_score integer not null default 0 check (response_score between 0 and 100),
  reliability_score integer not null default 0 check (reliability_score between 0 and 100),
  qualification_score integer not null default 0 check (qualification_score between 0 and 100),
  review_count integer not null default 0,
  average_rating numeric(3, 2) not null default 0,
  completed_cases integer not null default 0,
  successful_cases integer not null default 0,
  badge_code text not null default 'new_mediator' check (badge_code in ('gold_elite', 'platinum', 'trusted', 'verified', 'new_mediator')),
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists mediator_trust_scores_ranking_idx
on public.mediator_trust_scores(overall_score desc, review_count desc, completed_cases desc, calculated_at desc);

alter table public.mediator_trust_scores enable row level security;

drop policy if exists "trust_scores_select_public_approved" on public.mediator_trust_scores;
create policy "trust_scores_select_public_approved"
on public.mediator_trust_scores for select
to anon, authenticated
using (
  exists (
    select 1
    from public.mediator_profiles mp
    where mp.id = mediator_trust_scores.mediator_id
      and mp.status = 'approved'
  )
);

drop policy if exists "trust_scores_select_owner_admin" on public.mediator_trust_scores;
create policy "trust_scores_select_owner_admin"
on public.mediator_trust_scores for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.mediator_profiles mp
    where mp.id = mediator_trust_scores.mediator_id
      and mp.user_id = (select auth.uid())
  )
);

drop policy if exists "trust_scores_manage_admin" on public.mediator_trust_scores;
create policy "trust_scores_manage_admin"
on public.mediator_trust_scores for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
