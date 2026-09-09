import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { legalCards, sortHand } from "./cards";
import { maximumCards, roundSizes, trumpForRound } from "./config";
import { applyAction, applyTimedTransitions, createGameState, directionForRound, toClientState, traverse } from "./engine";
import { competitionPositions, scoreRound, trickWinner } from "./rules";
import type { Card, GameState } from "./types";
import { activeParticipantIds } from "./lifecycle";
import { bidCallStatus } from "./bidding";

const c=(rank:Card["rank"],suit:Card["suit"]):Card=>({rank,suit});
const people=(count=4)=>Array.from({length:count},(_,seat)=>({id:`p${seat+1}`,profileId:`profile${seat+1}`,name:`P${seat+1}`,seat}));
const actionId=(n:number)=>`action-${n.toString().padStart(4,"0")}`;

describe("round configuration and dealing",()=>{
  it("uses intentional maximum hand sizes",()=>{expect(maximumCards(3)).toBe(17);expect(maximumCards(4)).toBe(12);});
  it("builds half and full sequences",()=>{expect(roundSizes("half",3)).toEqual(Array.from({length:17},(_,i)=>i+1));expect(roundSizes("full",4)).toHaveLength(23);expect(roundSizes("full",4)).toEqual([12,11,10,9,8,7,6,5,4,3,2,1,2,3,4,5,6,7,8,9,10,11,12]);});
  it("deals 51 unique cards at the three-player maximum and exposes no undealt card",()=>{const state=createGameState("g",people(3),"full",10,15,new Date(0),0);const dealt=Object.values(state.hands).flat();expect(state.cardsDealt).toBe(17);expect(dealt).toHaveLength(51);expect(new Set(dealt.map(card=>`${card.rank}-${card.suit}`)).size).toBe(51);expect(state).not.toHaveProperty("deck");});
  it("deals 48 cards at the four-player maximum",()=>{const state=createGameState("g",people(4),"full",10,15,new Date(0),0);expect(state.cardsDealt).toBe(12);expect(Object.values(state.hands).flat()).toHaveLength(48);});
  it("always rotates trump from spades",()=>{expect([1,2,3,4,5].map(trumpForRound)).toEqual(["spades","hearts","diamonds","clubs","spades"]);});
});

describe("tricks",()=>{
  it("requires following suit",()=>{const hand=[c("A","hearts"),c("2","clubs")];expect(legalCards(hand,"hearts")).toEqual([c("A","hearts")]);expect(legalCards(hand,"spades")).toEqual(hand);});
  it("highest trump wins",()=>{expect(trickWinner([{playerId:"p1",card:c("A","hearts")},{playerId:"p2",card:c("2","spades")},{playerId:"p3",card:c("K","hearts")}],"spades")).toBe("p2");});
  it("highest led suit wins and unrelated off-suit cannot",()=>{expect(trickWinner([{playerId:"p1",card:c("10","clubs")},{playerId:"p2",card:c("A","hearts")},{playerId:"p3",card:c("K","clubs")}],"spades")).toBe("p3");});
  it("ranks ace high",()=>{expect(trickWinner([{playerId:"p1",card:c("K","diamonds")},{playerId:"p2",card:c("A","diamonds")},{playerId:"p3",card:c("2","diamonds")}],"clubs")).toBe("p2");});
  it("sorts hands by suit and descending rank",()=>{expect(sortHand([c("2","clubs"),c("K","hearts"),c("A","spades"),c("3","hearts")])).toEqual([c("A","spades"),c("K","hearts"),c("3","hearts"),c("2","clubs")]);});
  it("keeps a completed round visible for one second and uses the configured scoreboard timer",()=>{const base=createGameState("g",people(3),"custom",1,20,new Date(0),0);let state:GameState={...base,phase:"playing",activePlayerIndex:0,players:base.players.map(p=>({...p,bid:0})),hands:{p1:[c("A","spades")],p2:[c("K","spades")],p3:[c("Q","spades")]}};state=applyAction(state,"p1",{type:"play_card",card:c("A","spades"),actionId:actionId(31)},20,new Date(100));state=applyAction(state,"p2",{type:"play_card",card:c("K","spades"),actionId:actionId(32)},20,new Date(200));state=applyAction(state,"p3",{type:"play_card",card:c("Q","spades"),actionId:actionId(33)},20,new Date(300));expect(state.phase).toBe("trick_complete");expect(state.currentTrick).toHaveLength(3);expect(state.trickWinnerId).toBe("p1");expect(applyTimedTransitions(state,20,new Date(1000),45).phase).toBe("trick_complete");const scored=applyTimedTransitions(state,20,new Date(1300),45);expect(scored.phase).toBe("round_complete");expect(scored.scorecardEndsAt).toBe(new Date(46_300).toISOString());});
});

describe("direction",()=>{
  it("traverses clockwise and counter-clockwise",()=>{expect(traverse(1,4,"clockwise")).toBe(2);expect(traverse(1,4,"counter_clockwise")).toBe(0);});
  it("reverses only after the one-card full-game round",()=>{const sizes=roundSizes("full",4);expect(directionForRound("full",sizes,12)).toBe("clockwise");expect(directionForRound("full",sizes,13)).toBe("counter_clockwise");});
  it("chooses the first leader immediately after dealer",()=>{const cw=createGameState("g",people(4),"custom",3,15,new Date(0),2);expect(cw.activePlayerIndex).toBe(3);const full=createGameState("g2",people(4),"full",10,15,new Date(0),2);expect(full.activePlayerIndex).toBe(3);});
  it("progresses the dealer in the new direction after reversal",()=>{let state=createGameState("g",people(4),"full",10,15,new Date(0),3);state={...state,roundNumber:12,phase:"round_complete",cardsDealt:1,direction:"clockwise",scorecardEndsAt:new Date(20_000).toISOString(),presence:Object.fromEntries(people(4).map(p=>[p.id,new Date(0).toISOString()]))};for(let i=0;i<4;i++)state=applyAction(state,`p${i+1}`,{type:"scorecard_ready",actionId:actionId(i)},15,new Date(1_000));expect(state.roundNumber).toBe(13);expect(state.direction).toBe("counter_clockwise");expect(state.dealerIndex).toBe(2);});
});

describe("secret bidding and timers",()=>{
  it("accepts simultaneous bids and hides them until all submit",()=>{let state=createGameState("g",people(3),"custom",2,15,new Date(0),0);state=applyAction(state,"p2",{type:"place_bid",bid:1,actionId:actionId(1)},15,new Date(1));expect(state.phase).toBe("bidding");expect(toClientState(state,"p1").players.find(p=>p.id==="p2")?.bid).toBeNull();state=applyAction(state,"p1",{type:"place_bid",bid:0,actionId:actionId(2)},15,new Date(2));state=applyAction(state,"p3",{type:"place_bid",bid:1,actionId:actionId(3)},15,new Date(3));expect(state.phase).toBe("playing");expect(toClientState(state,"p1").players.find(p=>p.id==="p2")?.bid).toBe(1);});
  it("locks duplicate bids",()=>{let state=createGameState("g",people(3),"custom",2);state=applyAction(state,"p1",{type:"place_bid",bid:0,actionId:actionId(1)});expect(()=>applyAction(state,"p1",{type:"place_bid",bid:1,actionId:actionId(2)})).toThrow("already locked");});
  it("auto-submits zero at the authoritative deadline",()=>{const state=createGameState("g",people(3),"custom",2,15,new Date(0),0);const timed=applyTimedTransitions(state,15,new Date(15_000));expect(timed.phase).toBe("playing");expect(timed.players.every(p=>p.bid===0)).toBe(true);expect(timed.autoBidPlayerIds).toHaveLength(3);});
  it("does not restart or repeat a timer transition after refresh",()=>{const state=createGameState("g",people(3),"custom",2,15,new Date(0),0);const once=applyTimedTransitions(state,15,new Date(16_000));const twice=applyTimedTransitions(once,15,new Date(17_000));expect(twice.version).toBe(once.version);expect(twice.biddingEndsAt).toBeNull();});
  it("reports under call, over call and exact only after every bid is known",()=>{expect(bidCallStatus([{bid:1},{bid:null},{bid:2}],5)).toBeNull();expect(bidCallStatus([{bid:1},{bid:1},{bid:1}],5)).toBe("UNDER CALL");expect(bidCallStatus([{bid:2},{bid:2},{bid:2}],5)).toBe("OVER CALL");expect(bidCallStatus([{bid:2},{bid:2},{bid:1}],5)).toBe("EXACT");});
});

describe("scoring and ranking",()=>{
  it("scores successful, failed and zero bids",()=>{expect(scoreRound(4,4)).toBe(40);expect(scoreRound(4,1)).toBe(-40);expect(scoreRound(0,0)).toBe(10);expect(scoreRound(0,1)).toBe(-10);});
  it("gives tied winners and tied last shared competition positions",()=>{expect(competitionPositions([{id:"a",score:100},{id:"b",score:100},{id:"c",score:70},{id:"d",score:50}])).toEqual({a:1,b:1,c:3,d:4});expect(competitionPositions([{id:"a",score:100},{id:"b",score:50},{id:"c",score:50}])).toEqual({a:1,b:2,c:2});});
  it("excludes abandoned games in the statistics view",()=>{const sql=readFileSync("supabase/migrations/001_initial_schema.sql","utf8");expect(sql).toContain("g.status='completed'");});
});

describe("integrity and reconnect",()=>{
  it("makes duplicate action IDs idempotent",()=>{let state=createGameState("g",people(3),"custom",2);const action={type:"place_bid" as const,bid:0,actionId:actionId(1)};state=applyAction(state,"p1",action);const duplicate=applyAction(state,"p1",action);expect(duplicate).toBe(state);});
  it("rejects duplicate card submission",()=>{const base=createGameState("g",people(3),"custom",1);let state:GameState={...base,phase:"playing",activePlayerIndex:0,players:base.players.map(p=>({...p,bid:0})),hands:{p1:[c("A","spades")],p2:[c("K","spades")],p3:[c("Q","spades")]}};const action={type:"play_card" as const,card:c("A","spades"),actionId:actionId(1)};state=applyAction(state,"p1",action);expect(applyAction(state,"p1",action)).toBe(state);});
  it("retains seat and private hand across disconnect and reconnect",()=>{const state=createGameState("g",people(3),"custom",3);const view=toClientState(state,"p2");expect(view.players.find(p=>p.id==="p2")?.seat).toBe(1);expect(view.hand).toEqual(state.hands.p2);expect(view).not.toHaveProperty("hands");});
  it("lets any seated player end early, records who did it, and keeps current totals",()=>{const base=createGameState("g",people(3),"custom",3);const state={...base,players:base.players.map((p,i)=>({...p,totalScore:(i+1)*10}))};const ended=applyAction(state,"p2",{type:"end_game",actionId:actionId(99)});expect(ended.phase).toBe("game_complete");expect(ended.endedEarly).toBe(true);expect(ended.endedByPlayerId).toBe("p2");expect(ended.players.map(p=>p.totalScore)).toEqual([10,20,30]);expect(ended.hands).toEqual({});});
  it("never carries participants from completed or abandoned games into the active lobby",()=>{const games=[{id:"old",status:"completed"},{id:"abandoned",status:"abandoned"},{id:"new",status:"lobby"}];const participants=[{id:"old-player",gameId:"old"},{id:"abandoned-player",gameId:"abandoned"},{id:"new-player",gameId:"new"}];expect(activeParticipantIds(games,participants)).toEqual(["new-player"]);});
  it("keeps completed game state pending until the admin-only idempotent database finalizer runs",()=>{const persistence=readFileSync("lib/server/persist.ts","utf8");const migration=readFileSync("supabase/migrations/004_admin_finalization_and_stats_reset.sql","utf8");expect(persistence).not.toContain("final_score:");expect(persistence).not.toContain('status: "completed"');expect(migration).toContain("for update");expect(migration).toContain("if current_status = 'completed' then return false");expect(migration).toContain("game_state->>'phase' <> 'game_complete'");});
  it("resets statistics with a cutoff while preserving the player and historical rows",()=>{const migration=readFileSync("supabase/migrations/004_admin_finalization_and_stats_reset.sql","utf8");const endpoint=readFileSync("app/api/admin/players/[id]/reset-stats/route.ts","utf8");expect(migration).toContain("add column if not exists stats_reset_at");expect(migration).toContain("g.completed_at > p.stats_reset_at");expect(endpoint).toContain("requireAdmin()");expect(endpoint).toContain("stats_reset_at");expect(endpoint).not.toContain('.delete()');});
});
