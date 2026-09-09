alter table public.admin_config
  add column if not exists scoreboard_timer_seconds smallint not null default 30;
alter table public.admin_config
  drop constraint if exists admin_config_scoreboard_timer_seconds_check;
alter table public.admin_config
  add constraint admin_config_scoreboard_timer_seconds_check
  check (scoreboard_timer_seconds between 5 and 60 and scoreboard_timer_seconds % 5 = 0);
update public.admin_config set scoreboard_timer_seconds = 30 where scoreboard_timer_seconds is null;

alter table public.games
  add column if not exists ended_by_participant_id uuid references public.game_participants(id) on delete set null;

drop view if exists public.career_stats;
create view public.career_stats as
select p.id as player_id,p.name,
  count(gp.id) filter (where g.status='completed')::int as games_played,
  coalesce(round(avg(gp.finishing_position) filter (where g.status='completed'),2),0) as average_position,
  count(gp.id) filter (where g.status='completed' and gp.is_winner)::int as wins,
  count(gp.id) filter (where g.status='completed' and gp.finishing_position <= 3)::int as podiums,
  count(gp.id) filter (where g.status='completed' and gp.is_last)::int as last_place_finishes,
  coalesce(max(gp.final_score) filter (where g.status='completed'),0)::int as high_score
from public.players p
join public.game_participants gp on gp.player_id=p.id
join public.games g on g.id=gp.game_id and g.status='completed'
group by p.id,p.name
having count(gp.id) > 0;
revoke all on public.career_stats from anon,authenticated;
