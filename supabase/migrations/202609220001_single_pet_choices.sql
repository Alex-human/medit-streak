-- Una mascota por amistad: lo que lleva puesto y las decisiones que la pareja toma a dos.

alter table public.pets add column if not exists outfit jsonb not null default '{}'::jsonb;

create table if not exists public.pet_choices (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  life integer not null check (life >= 1),
  milestone_day integer not null check (milestone_day >= 1),
  payload jsonb not null,
  proposed_by uuid not null references public.profiles(user_id) on delete cascade,
  proposed_at timestamptz not null default now(),
  confirmed_by uuid references public.profiles(user_id) on delete set null,
  confirmed_at timestamptz,
  constraint pet_choices_two_people check (confirmed_by is null or confirmed_by <> proposed_by),
  unique (pet_id, life, milestone_day)
);

create or replace function public.is_pet_member(target_pet_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.pets pet
    join public.friendships friendship on friendship.id = pet.friendship_id
    where pet.id = target_pet_id
      and friendship.status = 'accepted'
      and auth.uid() in (friendship.requester_id, friendship.addressee_id)
  );
$$;

revoke all on function public.is_pet_member(uuid) from public;
grant execute on function public.is_pet_member(uuid) to authenticated;

alter table public.pet_choices enable row level security;

drop policy if exists "Friends decide together" on public.pet_choices;
create policy "Friends decide together"
on public.pet_choices for all to authenticated
using (public.is_pet_member(pet_id))
with check (public.is_pet_member(pet_id));
