-- migration: create_jokes
-- הטבלה public.jokes נעולה: RLS דולק בלי policy, וגישה רק ל-service_role.

create table public.jokes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  topic text,
  text text not null,
  laughs integer not null default 0
);

alter table public.jokes enable row level security;

revoke all on public.jokes from anon, authenticated;
grant select, insert, update on public.jokes to service_role;

-- מוסיפה צחוק אחד בעדכון אחד, ומחזירה את המספר החדש. אין שורה כזו: null.
create function public.add_laugh(joke_id uuid)
returns integer
language sql
security invoker
set search_path = ''
as $$
  update public.jokes
  set laughs = laughs + 1
  where id = joke_id
  returning laughs;
$$;

revoke execute on function public.add_laugh(uuid) from public, anon, authenticated;
grant execute on function public.add_laugh(uuid) to service_role;
