create extension if not exists pgcrypto;
create type public.game_status as enum ('lobby', 'in_progress', 'completed', 'abandoned');
create type public.round_mode as enum ('custom', 'half', 'full');

create table public.players (
  id uuid primary key default gen_random_uuid(), name text not null unique check (char_length(name) between 1 and 40),
  pin_hash text, created_at timestamptz not null default now(), active boolean not null default true, archived_at timestamptz
);
insert into public.players(name) values ('Zoheb'),('Divya'),('Saurabh'),('Ashu'),('Ashish'),('Anas'),('Sid') on conflict (name) do nothing;

create table public.login_sessions (
  id uuid primary key default gen_random_uuid(), player_id uuid not null references public.players(id) on delete cascade,
  token_hash text not null unique, created_at timestamptz not null default now(), expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(), user_agent text
);
create index login_sessions_token_idx on public.login_sessions(token_hash);

create table public.admin_config (
  singleton boolean primary key default true check (singleton), admin_pin_hash text,
  bidding_timer_seconds smallint not null default 15 check (bidding_timer_seconds in (0,5,10,15,20,30,45,60)),
  card_confirmation boolean not null default true, updated_at timestamptz not null default now()
);
insert into public.admin_config(singleton) values (true);
create table public.admin_sessions (
  id uuid primary key default gen_random_uuid(), token_hash text not null unique,
  created_at timestamptz not null default now(), expires_at timestamptz not null
);

create table public.pin_login_attempts (
  id bigint generated always as identity primary key, login_kind text not null check (login_kind in ('player','admin')),
  subject text not null, ip_hash text not null, succeeded boolean not null, attempted_at timestamptz not null default now()
);
create index pin_attempt_lookup_idx on public.pin_login_attempts(login_kind,subject,ip_hash,attempted_at desc);

create table public.games (
  id uuid primary key default gen_random_uuid(), created_by_player_id uuid references public.players(id),
  mode public.round_mode not null, custom_rounds smallint, player_count smallint check (player_count in (3,4)),
  created_at timestamptz not null default now(), started_at timestamptz, completed_at timestamptz,
  status public.game_status not null default 'lobby'
);
create unique index only_one_active_game on public.games ((true)) where status in ('lobby','in_progress');

create table public.game_participants (
  id uuid primary key default gen_random_uuid(), game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid references public.players(id), guest_name text, guest_token_hash text,
  seat_position smallint not null check (seat_position between 0 and 3), joined_at timestamptz not null default now(),
  final_score integer, finishing_position smallint, is_winner boolean, is_last boolean,
  check ((player_id is not null and guest_name is null and guest_token_hash is null) or
         (player_id is null and guest_name is not null and guest_token_hash is not null)),
  unique (game_id,seat_position)
);
create unique index one_profile_per_game on public.game_participants(game_id,player_id) where player_id is not null;

create table public.game_states (
  game_id uuid primary key references public.games(id) on delete cascade, version integer not null default 1,
  state jsonb not null, updated_at timestamptz not null default now()
);
create table public.game_updates (
  id bigint generated always as identity primary key, game_id uuid not null references public.games(id) on delete cascade,
  version integer not null, created_at timestamptz not null default now()
);

alter table public.players enable row level security;
alter table public.login_sessions enable row level security;
alter table public.admin_config enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.pin_login_attempts enable row level security;
alter table public.games enable row level security;
alter table public.game_participants enable row level security;
alter table public.game_states enable row level security;
alter table public.game_updates enable row level security;
create policy "opaque realtime signals" on public.game_updates for select to anon using (true);
alter publication supabase_realtime add table public.game_updates;

create or replace view public.career_stats as
select p.id as player_id,p.name,count(gp.id) filter (where g.status='completed')::int as games_played,
  coalesce(round(avg(gp.finishing_position) filter (where g.status='completed'),2),0) as average_position,
  count(gp.id) filter (where g.status='completed' and gp.is_winner)::int as wins,
  coalesce(round(100.0*count(gp.id) filter (where g.status='completed' and gp.is_winner)/nullif(count(gp.id) filter (where g.status='completed'),0),1),0) as win_percentage,
  count(gp.id) filter (where g.status='completed' and gp.is_last)::int as last_place_finishes
from public.players p left join public.game_participants gp on gp.player_id=p.id left join public.games g on g.id=gp.game_id
where p.archived_at is null group by p.id,p.name;
revoke all on public.career_stats from anon,authenticated;

create or replace function public.prune_auth_records() returns void language sql security definer as $$
  delete from public.login_sessions where expires_at<now();
  delete from public.admin_sessions where expires_at<now();
  delete from public.pin_login_attempts where attempted_at<now()-interval '7 days';
$$;
