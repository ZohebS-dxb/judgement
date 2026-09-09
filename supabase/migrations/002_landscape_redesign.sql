alter table public.admin_config alter column bidding_timer_seconds set default 20;
alter table public.admin_config drop constraint if exists admin_config_bidding_timer_seconds_check;
alter table public.admin_config add constraint admin_config_bidding_timer_seconds_check check (bidding_timer_seconds between 5 and 60 and bidding_timer_seconds % 5 = 0);
update public.admin_config set bidding_timer_seconds = 20 where bidding_timer_seconds < 20;

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
left join public.game_participants gp on gp.player_id=p.id
left join public.games g on g.id=gp.game_id
group by p.id,p.name;
revoke all on public.career_stats from anon,authenticated;
