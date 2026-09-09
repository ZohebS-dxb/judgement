"use client";
import { BarChart3, Check, LoaderCircle, Wifi, WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Card, ClientGameState } from "@/lib/game/types";
import { Brand } from "./brand";
import { PlayingCard } from "./playing-card";

type ActionInput = { type: "place_bid"; bid: number } | { type: "play_card"; card: Card } | { type: "scorecard_ready" };
const cid = (card: Card) => `${card.rank}-${card.suit}`;
const suits = { clubs: "♣ Clubs", diamonds: "♦ Diamonds", hearts: "♥ Hearts", spades: "♠ Spades" } as const;

export function GameTable({ gameId }: { gameId: string }) {
  const [state, setState] = useState<ClientGameState | null>(null); const [participantId, setParticipantId] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [scores, setScores] = useState(false);
  const [selected, setSelected] = useState<Card | null>(null); const [now, setNow] = useState(Date.now()); const [cardConfirmation, setCardConfirmation] = useState(true);
  const load = useCallback(async () => { const response = await fetch(`/api/games/${gameId}/state`, { cache: "no-store" }); const body = await response.json(); if (response.ok) { setState(body.state); setParticipantId(body.participantId); setCardConfirmation(body.cardConfirmation); setError(""); } else setError(body.error); }, [gameId]);
  useEffect(() => {
    void load(); const poll = setInterval(load, 3000); const clock = setInterval(() => setNow(Date.now()), 250);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; const client = url && key ? createClient(url, key) : null;
    const channel = client?.channel(`game-${gameId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "game_updates", filter: `game_id=eq.${gameId}` }, () => void load()).subscribe();
    const resume = () => { if (document.visibilityState === "visible") void load(); }; document.addEventListener("visibilitychange", resume); window.addEventListener("pageshow", resume); window.addEventListener("online", resume);
    return () => { clearInterval(poll); clearInterval(clock); document.removeEventListener("visibilitychange", resume); window.removeEventListener("pageshow", resume); window.removeEventListener("online", resume); if (client && channel) void client.removeChannel(channel); };
  }, [gameId, load]);
  async function act(action: ActionInput) { if (busy) return; setBusy(true); setError(""); const response = await fetch(`/api/games/${gameId}/action`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...action, actionId: crypto.randomUUID() }) }); const body = await response.json(); setBusy(false); if (response.ok) { setState(body.state); setSelected(null); } else { setError(body.error); void load(); } }
  const meIndex = state?.players.findIndex((player) => player.id === participantId) ?? 0;
  const seats = useMemo(() => state?.players.map((_, relative) => state.players[(meIndex + relative) % state.players.length]) ?? [], [state, meIndex]);
  if (!state) return <main className="game-page"><div className="center-message"><LoaderCircle className="spin"/><p>{error || "Restoring your seat…"}</p></div></main>;
  const locations = state.players.length === 3 ? ["bottom","left","right"] : ["bottom","left","top","right"];
  const me = state.players[meIndex]; const active = state.players[state.activePlayerIndex]; const myTurn = state.phase === "playing" && active.id === participantId;
  const bidSeconds = state.biddingEndsAt ? Math.max(0, Math.ceil((new Date(state.biddingEndsAt).getTime() - now) / 1000)) : null;
  const scoreSeconds = state.scorecardEndsAt ? Math.max(0, Math.ceil((new Date(state.scorecardEndsAt).getTime() - now) / 1000)) : 0;
  const connected = (id: string) => now - new Date(state.presence[id] ?? 0).getTime() < 20_000;
  const winners = state.phase === "game_complete" ? state.players.filter((player) => player.totalScore === Math.max(...state.players.map((p) => p.totalScore))) : [];
  function chooseCard(card: Card) { if (!state?.legalCardIds.includes(cid(card)) || busy) return; if (!cardConfirmation || selected && cid(selected) === cid(card)) void act({ type: "play_card", card }); else setSelected(card); }

  return <main className="game-page">
    <header className="game-hud"><Brand/><div className="hud-center"><span className="badge">R <strong>{state.roundNumber}/{state.roundSizes.length}</strong></span><span className="badge trump"><strong>{suits[state.trump]}</strong></span><span className="badge"><strong>{state.direction === "clockwise" ? "↻ CW" : "↺ CCW"}</strong></span></div><button className="button ghost icon-button" aria-label="Scores" onClick={() => setScores(!scores)}><BarChart3 size={19}/></button></header>
    <div className="table-stage"><div className="table-felt">
      {seats.map((player, relative) => <div className={`player-seat ${locations[relative]}`} key={player.id}><div className={`player-info ${active.id === player.id && state.phase === "playing" ? "active" : ""}`}><span className="connection" title={connected(player.id) ? "Connected" : "Reconnecting"}>{connected(player.id) ? <Wifi size={11}/> : <WifiOff size={11}/>}</span><span className="player-avatar">{player.name[0]}</span><div className="player-meta">{player.name}{player.id === participantId ? " · You" : ""}<div className="player-score">{state.phase === "bidding" ? player.id === participantId && player.bid !== null ? "Bid submitted" : player.id !== participantId && player.bid !== null ? "Ready" : "Choosing…" : `Bid ${player.bid} · Won ${player.tricksWon} · ${player.totalScore}`}</div></div>{state.dealerIndex === state.players.findIndex((p) => p.id === player.id) && <span className="dealer-dot">D</span>}</div>
        {relative !== 0 && <div className="card-backs">{Array.from({ length: Math.min(state.opponentCardCounts[player.id] ?? 0, 8) }, (_, i) => <i className="mini-back" key={i}/>)}</div>}
        {relative === 0 && <div className="hand">{state.hand.map((card, index) => { const legal = state.legalCardIds.includes(cid(card)); const isSelected = selected && cid(selected) === cid(card); const angle = (index - (state.hand.length - 1) / 2) * 2.5; return <button className={`hand-card ${isSelected ? "selected" : ""} ${legal ? "legal" : ""}`} style={{ zIndex: index, transform: `rotate(${angle}deg)` }} disabled={!legal || busy} onClick={() => chooseCard(card)} key={cid(card)}><PlayingCard card={card}/></button>; })}</div>}
      </div>)}
      <div className="trick-area"><AnimatePresence>{state.currentTrick.map((play) => { const relative = (state.players.findIndex((p) => p.id === play.playerId) - meIndex + state.players.length) % state.players.length; const position = state.players.length === 3 && relative === 2 ? 3 : relative; return <motion.div className={`played-card p${position}`} initial={{opacity:0,scale:.7}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.5}} key={`${play.playerId}-${cid(play.card)}`}><PlayingCard card={play.card}/></motion.div>; })}</AnimatePresence></div>
      {state.phase === "playing" && state.currentTrick.length > 0 && <div className="turn-chip">{myTurn ? "Your turn" : `${active.name}'s turn`}</div>}
      {state.phase === "bidding" && <div className="panel bid-dock"><div className={`bid-timer ${bidSeconds !== null && bidSeconds <= 5 ? "urgent" : ""}`}>{bidSeconds ?? "∞"}</div>{me.bid === null ? <><strong>Your secret bid</strong><div className="bid-options">{Array.from({length:state.cardsDealt+1},(_,bid)=><button className="bid-chip" disabled={busy} onClick={()=>act({type:"place_bid",bid})} key={bid}>{bid}</button>)}</div></> : <div className="submitted"><Check size={18}/> Bid submitted. Waiting for the table…</div>}</div>}
      {selected && myTurn && <div className="play-confirm"><button className="button" disabled={busy} onClick={() => act({type:"play_card",card:selected})}>Play {selected.rank} {suits[selected.suit].split(" ")[0]}</button><button className="button ghost" onClick={() => setSelected(null)}>Cancel</button></div>}
      {state.phase === "playing" && state.currentTrick.length === 0 && <div className="center-message"><div className="turn-label">{myTurn ? "Your turn to lead" : `${active.name} leads`}</div></div>}
      {state.phase === "playing" && state.autoBidPlayerIds.includes(participantId) && <div className="auto-bid-note">Time expired. Bid 0 submitted automatically.</div>}
      {state.phase === "round_complete" && <div className="modal-backdrop scorecard-backdrop"><section className="panel mobile-scorecard"><div className="score-countdown">{scoreSeconds}</div><div className="eyebrow">Round {state.roundNumber} complete</div><h2>Scorecard</h2><div className="round-results">{state.lastRoundResults.map((result) => { const player = state.players.find((p) => p.id === result.playerId)!; return <div className="result-row" key={result.playerId}><strong>{player.name}</strong><span>Bid {result.bid}</span><span>Won {result.tricksWon}</span><span className={result.roundScore >= 0 ? "positive" : "negative"}>{result.roundScore > 0 ? "+" : ""}{result.roundScore}</span><b>{result.totalScore}</b></div>; })}</div><button className="button ready-button" disabled={busy || state.readyPlayerIds.includes(participantId)} onClick={() => act({type:"scorecard_ready"})}>{state.readyPlayerIds.includes(participantId) ? "Ready ✓" : "OK · Ready"}</button></section></div>}
      {state.phase === "game_complete" && <div className="modal-backdrop winner-backdrop"><motion.section className="panel mobile-scorecard winner-card" initial={{scale:.85,opacity:0}} animate={{scale:1,opacity:1}}><div className="eyebrow">Game complete</div><h2>{winners.length > 1 ? `${winners.map((p) => p.name).join(" & ")} win!` : `${winners[0]?.name} wins!`}</h2><div className="round-results">{[...state.players].sort((a,b)=>b.totalScore-a.totalScore).map((player)=><div className="result-row" key={player.id}><strong>{player.name}</strong><span></span><span></span><span></span><b>{player.totalScore}</b></div>)}</div><a className="button ready-button" href="/">Back home</a></motion.section></div>}
    </div></div>
    {scores && <aside className="panel score-drawer"><div className="eyebrow">Current scores</div><h2>Round {state.roundNumber}</h2>{[...state.players].sort((a,b)=>b.totalScore-a.totalScore).map((player)=><div className="result-row" key={player.id}><strong>{player.name}</strong><span>Bid {state.phase === "bidding" ? "?" : player.bid}</span><span>Won {player.tricksWon}</span><span></span><b>{player.totalScore}</b></div>)}<button className="button secondary ready-button" onClick={()=>setScores(false)}>Close</button></aside>}
    {error && <div className="toast-error">{error}</div>}
  </main>;
}
