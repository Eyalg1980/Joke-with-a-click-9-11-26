-- migration: create_votes
-- הטבלה public.votes: קול אחד לכל משתמש לכל בדיחה. נעולה: RLS דולק בלי policy, וגישה רק ל-service_role.
-- העמודה laughs והפונקציה add_laugh נשארות כמו שהן.

create table public.votes (
  user_id uuid not null references auth.users (id) on delete cascade,
  joke_id uuid not null references public.jokes (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  voted_at timestamptz not null default now(),
  primary key (user_id, joke_id)
);

create index votes_joke_id_idx on public.votes (joke_id);

alter table public.votes enable row level security;

revoke all on public.votes from anon, authenticated;
revoke all on public.votes from service_role;
grant select, insert, update, delete on public.votes to service_role;

-- הצבעה: 1 או 1- נשמרים (או מחליפים קול קודם), 0 מוחק. כל ערך אחר: שגיאה 22023.
-- בדיחה שלא קיימת: שגיאה P0002. מחזירה את likes, dislikes ו-my_vote של הבדיחה.
create function public.cast_vote(voter uuid, target uuid, new_value smallint)
returns table (likes integer, dislikes integer, my_vote smallint)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if voter is null or target is null then
    raise exception 'voter and target are required' using errcode = '22023';
  end if;
  if new_value is null or new_value not in (-1, 0, 1) then
    raise exception 'invalid vote value' using errcode = '22023';
  end if;
  if not exists (select 1 from public.jokes j where j.id = target) then
    raise exception 'joke not found' using errcode = 'P0002';
  end if;

  if new_value = 0 then
    delete from public.votes v where v.user_id = voter and v.joke_id = target;
  else
    insert into public.votes as v (user_id, joke_id, value)
    values (voter, target, new_value)
    on conflict (user_id, joke_id)
    do update set value = excluded.value, voted_at = now();
  end if;

  return query
    select
      (count(*) filter (where c.value = 1))::integer,
      (count(*) filter (where c.value = -1))::integer,
      (select m.value from public.votes m where m.user_id = voter and m.joke_id = target)
    from public.votes c
    where c.joke_id = target;
end;
$$;

-- הרשימות: new מהחדשה, top רק עם like אחד לפחות (לפי likes פחות dislikes, ואז likes),
-- liked רק מה ש-viewer סימן 1 (לפי voted_at). viewer הוא null לאורח. max_rows בין 1 ל-50.
create function public.joke_feed(viewer uuid, mode text, max_rows integer default 20)
returns table (
  id uuid,
  created_at timestamptz,
  topic text,
  text text,
  author_name text,
  likes integer,
  dislikes integer,
  my_vote smallint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with counts as (
    select
      c.joke_id,
      (count(*) filter (where c.value = 1))::integer as likes,
      (count(*) filter (where c.value = -1))::integer as dislikes
    from public.votes c
    group by c.joke_id
  )
  select
    j.id,
    j.created_at,
    j.topic,
    j.text,
    j.author_name,
    coalesce(k.likes, 0),
    coalesce(k.dislikes, 0),
    m.value
  from public.jokes j
  left join counts k on k.joke_id = j.id
  left join public.votes m on m.joke_id = j.id and m.user_id = viewer
  where case mode
    when 'new' then true
    when 'top' then coalesce(k.likes, 0) >= 1
    when 'liked' then m.value = 1
    else false
  end
  order by
    case when mode = 'liked' then m.voted_at end desc nulls last,
    case when mode = 'top' then coalesce(k.likes, 0) - coalesce(k.dislikes, 0) end desc nulls last,
    case when mode = 'top' then coalesce(k.likes, 0) end desc nulls last,
    j.created_at desc
  limit greatest(1, least(coalesce(max_rows, 20), 50));
$$;

revoke execute on function public.cast_vote(uuid, uuid, smallint) from public, anon, authenticated;
grant execute on function public.cast_vote(uuid, uuid, smallint) to service_role;

revoke execute on function public.joke_feed(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.joke_feed(uuid, text, integer) to service_role;
