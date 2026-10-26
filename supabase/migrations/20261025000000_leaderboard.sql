-- 开兜 StarDou: accounts, avatars and the leaderboards
--
-- Every finished puzzle is one row in `results`, written once and never changed.
-- 今日榜 ranks one daily puzzle and is read straight from `results`;
-- 总榜 (`overall_board`) counts solved puzzles per player.
-- Solved = guessed right within the mode's tries (成语 10, 诗句 15).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 16),
  -- bumped on every upload to `avatars/<id>/avatar`; null = no avatar.
  -- A version rather than a URL, so a profile can only ever show its own upload.
  avatar_v bigint,
  created_at timestamptz not null default now()
);

create table public.results (
  user_id uuid not null references public.profiles (id) on delete cascade,
  mode text not null check (mode in ('chengyu', 'wuyan', 'qiyan')),
  -- `d<day>` for the daily puzzle, `e:<key>:<index>` for endless mode
  puzzle text not null check (char_length(puzzle) between 2 and 64),
  tries int not null check (tries between 1 and 200),
  hint_level int not null default 0 check (hint_level between 0 and 6),
  passed boolean not null,
  -- time spent on the puzzle, last tiebreak on 今日榜
  duration_ms int check (duration_ms between 0 and 7 * 86400000),
  created_at timestamptz not null default now(),
  primary key (user_id, mode, puzzle)
);

alter table public.profiles enable row level security;
alter table public.results enable row level security;

create policy "profiles are public" on public.profiles for select using (true);
create policy "rename yourself" on public.profiles for update
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "results are public" on public.results for select using (true);
-- insert only: no update or delete policy, so a finished result can't be rewritten later
create policy "record your own results" on public.results for insert
  to authenticated with check ((select auth.uid()) = user_id);

-- the nickname comes from sign-up metadata
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'nickname'), ''), '无名氏'), 16)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create view public.overall_board with (security_invoker = true) as
with scored as (
  select r.*, (r.passed and r.tries <= case r.mode when 'chengyu' then 10 else 15 end) as solved
  from public.results r
)
select
  coalesce(s.mode, 'all') as mode,
  s.user_id,
  p.nickname,
  p.avatar_v,
  count(*)::int as games,
  count(*) filter (where s.solved)::int as solved,
  round(avg(s.tries) filter (where s.solved), 2)::float8 as avg_tries,
  sum(s.hint_level)::int as hints
from scored s
join public.profiles p on p.id = s.user_id
group by grouping sets ((s.user_id, p.nickname, p.avatar_v, s.mode), (s.user_id, p.nickname, p.avatar_v));

grant select on public.overall_board to anon, authenticated;

-- avatars: one small image per user at `<user id>/avatar`, readable by anyone
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 300 * 1024, array['image/webp', 'image/jpeg', 'image/png']);

create policy "avatars are public" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "upload your own avatar" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "replace your own avatar" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

