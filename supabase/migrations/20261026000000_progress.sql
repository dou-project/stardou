-- Finished games follow the player to other devices.
--
-- `results` holds the public numbers for the boards; this keeps the game itself (the guesses,
-- hint level, time...) so another browser can show the puzzle as played. Guesses end in the
-- answer, so unlike `results` a row is readable by its owner only.

create table public.progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  mode text not null check (mode in ('chengyu', 'wuyan', 'qiyan')),
  -- same ids as `results`: `d<day>` or `e:<key>:<index>`
  puzzle text not null check (char_length(puzzle) between 2 and 64),
  -- the browser's TriesMeta for this puzzle, as stored in localStorage
  meta jsonb not null check (jsonb_typeof(meta) = 'object' and pg_column_size(meta) < 16384),
  updated_at timestamptz not null default now(),
  primary key (user_id, mode, puzzle)
);

alter table public.progress enable row level security;

create policy "read your own games" on public.progress for select
  to authenticated using ((select auth.uid()) = user_id);
create policy "save your own games" on public.progress for insert
  to authenticated with check ((select auth.uid()) = user_id);
create policy "update your own games" on public.progress for update
  to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
