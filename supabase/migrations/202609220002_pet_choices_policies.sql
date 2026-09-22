-- Contrato de pet_choices: quien propone firma, quien confirma es la otra persona y lo confirmado no cambia.

drop policy if exists "Friends decide together" on public.pet_choices;

drop policy if exists "Friends read their choices" on public.pet_choices;
create policy "Friends read their choices"
on public.pet_choices for select to authenticated
using (public.is_pet_member(pet_id));

drop policy if exists "Friends propose choices" on public.pet_choices;
create policy "Friends propose choices"
on public.pet_choices for insert to authenticated
with check (
  public.is_pet_member(pet_id)
  and proposed_by = auth.uid()
  and confirmed_by is null
  and confirmed_at is null
);

drop policy if exists "Friends settle open choices" on public.pet_choices;
create policy "Friends settle open choices"
on public.pet_choices for update to authenticated
using (public.is_pet_member(pet_id) and confirmed_at is null)
with check (
  public.is_pet_member(pet_id)
  and (
    (confirmed_at is null and confirmed_by is null and proposed_by = auth.uid())
    or (confirmed_at is not null and confirmed_by = auth.uid() and proposed_by <> auth.uid())
  )
);

alter table public.pet_choices drop constraint if exists pet_choices_confirmation_pair;
alter table public.pet_choices
  add constraint pet_choices_confirmation_pair check ((confirmed_by is null) = (confirmed_at is null));

alter table public.pet_choices drop constraint if exists pet_choices_payload_object;
alter table public.pet_choices
  add constraint pet_choices_payload_object check (jsonb_typeof(payload) = 'object');

create or replace function public.freeze_confirmed_choice()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.confirmed_at is not null and new.payload is distinct from old.payload then
    raise exception 'Una decisión confirmada no cambia.';
  end if;
  return new;
end;
$$;

drop trigger if exists pet_choices_freeze_confirmed on public.pet_choices;
create trigger pet_choices_freeze_confirmed
before update on public.pet_choices
for each row execute function public.freeze_confirmed_choice();

revoke update on table public.pets from authenticated;
grant update (outfit) on table public.pets to authenticated;
