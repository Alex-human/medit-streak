create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text not null,
  display_name text not null default 'Meditador',
  avatar_url text,
  time_zone text not null default 'Europe/Madrid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_handle_format check (handle ~ '^[a-z0-9_]{3,24}$')
);

create unique index if not exists profiles_handle_lower_unique on public.profiles (lower(handle));

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(user_id) on delete cascade,
  addressee_id uuid not null references public.profiles(user_id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  constraint friendship_two_people check (requester_id <> addressee_id)
);

create unique index if not exists friendships_pair_unique
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  friendship_id uuid not null references public.friendships(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 24),
  hatched_day date not null default ((now() at time zone 'Europe/Madrid')::date),
  died_on date,
  created_by uuid not null references public.profiles(user_id) on delete restrict,
  created_at timestamptz not null default now()
);

create unique index if not exists pets_one_living_per_friendship
  on public.pets (friendship_id) where died_on is null;

create table if not exists public.meditation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  client_id text not null,
  day date not null,
  minutes integer not null check (minutes between 1 and 1440),
  source text not null check (source in ('timer', 'manual', 'import')),
  finished_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id)
);

create index if not exists meditation_sessions_user_day_idx
  on public.meditation_sessions (user_id, day desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists meditation_sessions_touch_updated_at on public.meditation_sessions;
create trigger meditation_sessions_touch_updated_at
before update on public.meditation_sessions
for each row execute function public.touch_updated_at();

create or replace function public.make_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_handle text;
begin
  base_handle := lower(regexp_replace(coalesce(new.raw_user_meta_data ->> 'name', 'meditador'), '[^a-zA-Z0-9]+', '_', 'g'));
  base_handle := trim(both '_' from base_handle);
  base_handle := left(coalesce(nullif(base_handle, ''), 'meditador'), 16);

  insert into public.profiles (user_id, handle, display_name, avatar_url)
  values (
    new.id,
    base_handle || '_' || substr(replace(new.id::text, '-', ''), 1, 6),
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), nullif(new.raw_user_meta_data ->> 'name', ''), 'Meditador'),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists auth_user_created_profile on auth.users;
create trigger auth_user_created_profile
after insert on auth.users
for each row execute function public.make_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.pets enable row level security;
alter table public.meditation_sessions enable row level security;

drop policy if exists "Authenticated people can read social profiles" on public.profiles;
drop policy if exists "People can read connected profiles" on public.profiles;
create policy "People can read connected profiles"
on public.profiles for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.friendships friendship
    where auth.uid() in (friendship.requester_id, friendship.addressee_id)
      and profiles.user_id in (friendship.requester_id, friendship.addressee_id)
  )
);

drop policy if exists "People can update their own profile" on public.profiles;
create policy "People can update their own profile"
on public.profiles for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Friends can read their relationships" on public.friendships;
create policy "Friends can read their relationships"
on public.friendships for select to authenticated
using (requester_id = auth.uid() or addressee_id = auth.uid());

drop policy if exists "Friends can read their pets" on public.pets;
create policy "Friends can read their pets"
on public.pets for select to authenticated
using (
  exists (
    select 1 from public.friendships friendship
    where friendship.id = pets.friendship_id
      and friendship.status = 'accepted'
      and auth.uid() in (friendship.requester_id, friendship.addressee_id)
  )
);

drop policy if exists "Friends can settle their pets" on public.pets;
create policy "Friends can settle their pets"
on public.pets for update to authenticated
using (
  exists (
    select 1 from public.friendships friendship
    where friendship.id = pets.friendship_id
      and friendship.status = 'accepted'
      and auth.uid() in (friendship.requester_id, friendship.addressee_id)
  )
)
with check (
  exists (
    select 1 from public.friendships friendship
    where friendship.id = pets.friendship_id
      and friendship.status = 'accepted'
      and auth.uid() in (friendship.requester_id, friendship.addressee_id)
  )
);

drop policy if exists "People manage their sessions" on public.meditation_sessions;
create policy "People manage their sessions"
on public.meditation_sessions for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Friends can read meditation activity" on public.meditation_sessions;
create policy "Friends can read meditation activity"
on public.meditation_sessions for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.friendships friendship
    where friendship.status = 'accepted'
      and (
        (friendship.requester_id = auth.uid() and friendship.addressee_id = meditation_sessions.user_id)
        or (friendship.addressee_id = auth.uid() and friendship.requester_id = meditation_sessions.user_id)
      )
  )
);

create or replace function public.request_friendship_by_handle(target_handle text)
returns public.friendships
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid;
  created_friendship public.friendships;
begin
  select profile.user_id into target_id
  from public.profiles profile
  where lower(profile.handle) = lower(trim(target_handle));

  if target_id is null then
    raise exception 'No existe ese usuario.';
  end if;
  if target_id = auth.uid() then
    raise exception 'No puedes añadirte a ti mismo.';
  end if;

  insert into public.friendships (requester_id, addressee_id)
  values (auth.uid(), target_id)
  returning * into created_friendship;

  return created_friendship;
exception
  when unique_violation then
    raise exception 'Ya existe una solicitud o amistad con esa persona.';
end;
$$;

create or replace function public.respond_to_friendship(target_friendship_id uuid, accept_request boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if accept_request then
    update public.friendships
    set status = 'accepted', accepted_at = now()
    where id = target_friendship_id and addressee_id = auth.uid() and status = 'pending';
  else
    delete from public.friendships
    where id = target_friendship_id and addressee_id = auth.uid() and status = 'pending';
  end if;

  if not found then
    raise exception 'La solicitud ya no está disponible.';
  end if;
end;
$$;

create or replace function public.remove_friendship(target_friendship_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.friendships
  where id = target_friendship_id and auth.uid() in (requester_id, addressee_id);
  if not found then
    raise exception 'No se encontró esa amistad.';
  end if;
end;
$$;

create or replace function public.create_shared_pet(target_friendship_id uuid, target_pet_name text)
returns public.pets
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_pet public.pets;
begin
  if char_length(trim(target_pet_name)) not between 1 and 24 then
    raise exception 'El nombre debe tener entre 1 y 24 caracteres.';
  end if;

  if not exists (
    select 1 from public.friendships friendship
    where friendship.id = target_friendship_id
      and friendship.status = 'accepted'
      and auth.uid() in (friendship.requester_id, friendship.addressee_id)
  ) then
    raise exception 'No puedes crear una mascota en esa amistad.';
  end if;

  insert into public.pets (friendship_id, name, created_by)
  values (target_friendship_id, trim(target_pet_name), auth.uid())
  returning * into created_pet;

  return created_pet;
exception
  when unique_violation then
    raise exception 'Ya tenéis una mascota viva.';
end;
$$;

revoke all on function public.request_friendship_by_handle(text) from public;
revoke all on function public.respond_to_friendship(uuid, boolean) from public;
revoke all on function public.remove_friendship(uuid) from public;
revoke all on function public.create_shared_pet(uuid, text) from public;
grant execute on function public.request_friendship_by_handle(text) to authenticated;
grant execute on function public.respond_to_friendship(uuid, boolean) to authenticated;
grant execute on function public.remove_friendship(uuid) to authenticated;
grant execute on function public.create_shared_pet(uuid, text) to authenticated;
