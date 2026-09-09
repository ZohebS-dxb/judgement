alter table public.players
  add column if not exists stats_reset_at timestamptz;

create or replace function public.finalize_game(p_game_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status public.game_status;
  game_state jsonb;
  highest_score integer;
  lowest_score integer;
begin
  select status into current_status from public.games where id = p_game_id for update;
  if current_status is null then raise exception 'Game not found'; end if;
  if current_status = 'completed' then return false; end if;
  if current_status <> 'in_progress' then raise exception 'Only a finished active game can be finalized'; end if;

  select state into game_state from public.game_states where game_id = p_game_id;
  if game_state is null or game_state->>'phase' <> 'game_complete' then
    raise exception 'The final Scoreboard is not ready';
  end if;

  select max((player->>'totalScore')::integer), min((player->>'totalScore')::integer)
    into highest_score, lowest_score
    from jsonb_array_elements(game_state->'players') player;

  update public.game_participants participant
  set final_score = (player->>'totalScore')::integer,
      finishing_position = 1 + (
        select count(*) from jsonb_array_elements(game_state->'players') higher
        where (higher->>'totalScore')::integer > (player->>'totalScore')::integer
      ),
      is_winner = (player->>'totalScore')::integer = highest_score,
      is_last = (player->>'totalScore')::integer = lowest_score
  from jsonb_array_elements(game_state->'players') player
  where participant.game_id = p_game_id and participant.id::text = player->>'id';

  update public.games set status = 'completed', completed_at = now() where id = p_game_id;
  return true;
end;
$$;

revoke all on function public.finalize_game(uuid) from public, anon, authenticated;
grant execute on function public.finalize_game(uuid) to service_role;

drop view if exists public.career_stats;
create view public.career_stats as
select p.id as player_id,p.name,
  count(gp.id)::int as games_played,
  coalesce(round(avg(gp.finishing_position),2),0) as average_position,
  count(gp.id) filter (where gp.is_winner)::int as wins,
  count(gp.id) filter (where gp.finishing_position <= 3)::int as podiums,
  count(gp.id) filter (where gp.is_last)::int as last_place_finishes,
  coalesce(max(gp.final_score),0)::int as high_score
from public.players p
join public.game_participants gp on gp.player_id=p.id
join public.games g on g.id=gp.game_id and g.status='completed'
  and (p.stats_reset_at is null or g.completed_at > p.stats_reset_at)
group by p.id,p.name
having count(gp.id) > 0;
revoke all on public.career_stats from anon,authenticated;
