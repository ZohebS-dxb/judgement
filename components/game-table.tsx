"use client";

import { Check, DoorOpen, LoaderCircle, Minus, Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Card, ClientGameState, RoundScoreSnapshot } from "@/lib/game/types";
import { PlayingCard } from "./playing-card";

type ActionInput = { type: "place_bid"; bid: number } | { type: "play_card"; card: Card } | { type: "scorecard_ready" } | { type: "end_game" };
const cid = (card: Card) => `${card.rank}-${card.suit}`;
const suitLabel = { clubs: "♣ CLUBS", diamonds: "♦ DIAMONDS", hearts: "♥ HEARTS", spades: "♠ SPADES" } as const;
const vibrate = (pattern: number | number[]) => { if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern); };

export function GameTable({ gameId }: { gameId: string }) {
  const [state, setState] = useState<ClientGameState | null>(null);
  const [participantId, setParticipantId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [bidValue, setBidValue] = useState(0);
  const [showEnd, setShowEnd] = useState(false);
  const [autoBidNotice, setAutoBidNotice] = useState(false);
  const lastUrgent = useRef<number | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(`/api/games/${gameId}/state`, { cache: "no-store" });
    const body = await response.json();
    if (response.status === 410) {
      sessionStorage.setItem("judgement_notice", body.error ?? "Game abandoned by Admin.");
      location.replace("/");
      return;
    }
    if (response.ok) { setState(body.state); setParticipantId(body.participantId); setError(""); }
    else setError(body.error);
  }, [gameId]);

  useEffect(() => {
    void load();
    const poll = setInterval(load, 2500);
    const clock = setInterval(() => setNow(Date.now()), 200);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const client = url && key ? createClient(url, key) : null;
    const channel = client?.channel(`game-${gameId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "game_updates", filter: `game_id=eq.${gameId}` }, () => void load()).subscribe();
    const resume = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", resume); window.addEventListener("pageshow", resume); window.addEventListener("online", resume);
    return () => { clearInterval(poll); clearInterval(clock); document.removeEventListener("visibilitychange", resume); window.removeEventListener("pageshow", resume); window.removeEventListener("online", resume); if (client && channel) void client.removeChannel(channel); };
  }, [gameId, load]);

  useEffect(() => { setBidValue(0); }, [state?.roundNumber]);
  useEffect(() => {
    const seconds = state?.biddingEndsAt ? Math.max(0, Math.ceil((new Date(state.biddingEndsAt).getTime() - now) / 1000)) : null;
    if (seconds !== null && seconds <= 5 && seconds > 0 && lastUrgent.current !== seconds) { lastUrgent.current = seconds; vibrate(10); }
  }, [state?.biddingEndsAt, now]);
  useEffect(() => { if (state?.phase === "trick_complete" && state.trickWinnerId === participantId) vibrate([18, 28, 18]); if (state?.phase === "game_complete") vibrate([25, 35, 25]); }, [state?.phase, state?.trickWinnerId, participantId]);
  useEffect(() => { if (!state?.trickEndsAt) return; const delay = Math.max(0, new Date(state.trickEndsAt).getTime() - Date.now() + 60); const timer = setTimeout(() => void load(), delay); return () => clearTimeout(timer); }, [state?.trickEndsAt, load]);
  useEffect(() => { if (state?.phase !== "playing" || !state.autoBidPlayerIds.includes(participantId)) return; setAutoBidNotice(true); const timer = setTimeout(() => setAutoBidNotice(false), 3000); return () => clearTimeout(timer); }, [state?.phase, state?.roundNumber, state?.autoBidPlayerIds.join(","), participantId]);

  async function act(action: ActionInput) {
    if (busy) return;
    setBusy(true); setError("");
    const response = await fetch(`/api/games/${gameId}/action`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...action, actionId: crypto.randomUUID() }) });
    const body = await response.json(); setBusy(false);
    if (response.status === 410) { sessionStorage.setItem("judgement_notice", body.error ?? "Game abandoned by Admin."); location.replace("/"); return; }
    if (response.ok) { setState(body.state); if (action.type === "play_card") vibrate(18); if (action.type === "place_bid") vibrate(12); if (action.type === "end_game") vibrate([30, 40, 30]); }
    else { setError(body.error); void load(); }
  }

  const meIndex = state?.players.findIndex((player) => player.id === participantId) ?? 0;
  const seats = useMemo(() => state?.players.map((_, relative) => state.players[(meIndex + relative) % state.players.length]) ?? [], [state, meIndex]);
  if (!state) return <main className="game-page"><div className="center-message"><LoaderCircle className="spin"/><span>{error || "Reconnecting…"}</span></div></main>;

  const me = state.players[meIndex];
  const active = state.players[state.activePlayerIndex];
  const myTurn = state.phase === "playing" && active.id === participantId;
  const bidSeconds = state.biddingEndsAt ? Math.max(0, Math.ceil((new Date(state.biddingEndsAt).getTime() - now) / 1000)) : null;
  const scoreSeconds = state.scorecardEndsAt ? Math.max(0, Math.ceil((new Date(state.scorecardEndsAt).getTime() - now) / 1000)) : 0;
  const connected = (id: string) => now - new Date(state.presence[id] ?? 0).getTime() < 20_000;
  const winners = state.phase === "game_complete" ? state.players.filter((player) => player.totalScore === Math.max(...state.players.map((other) => other.totalScore))) : [];
  const displaySeats = state.players.length === 3 ? [seats[1], seats[2], seats[0]] : [seats[1], seats[2], seats[0], seats[3]];
  const handColumns = state.hand.length > 9 ? 9 : Math.max(1, state.hand.length);
  const playCard = (card: Card) => { if (!state.legalCardIds.includes(cid(card)) || busy) return; void act({ type: "play_card", card }); };
  const turnText = state.phase === "bidding" ? "Place Your Bid" : state.phase === "trick_complete" ? `${state.players.find((player) => player.id === state.trickWinnerId)?.name} won this round` : `${active.name}'s Turn`;

  return <main className={`game-page portrait-game ${myTurn ? "my-turn" : ""} ${state.hand.length > 9 ? "large-hand" : ""} ${state.phase === "bidding" ? "bidding-phase" : ""}`}>
    <header className="top-game-bar">
      <strong className={state.trump === "hearts" || state.trump === "diamonds" ? "red-suit" : ""}>{suitLabel[state.trump]}</strong>
      <span>Deal {state.cardsDealt}</span>
      <button className="end-game-icon" onClick={() => setShowEnd(true)} aria-label="End Game" title="End Game"><DoorOpen/></button>
    </header>
    <div className={`turn-announcement ${myTurn ? "local-turn" : ""}`}>{turnText}</div>

    <section className={`portrait-play-grid players-${state.players.length}`}>
      {displaySeats.map((player) => {
        const play = state.currentTrick.find((card) => card.playerId === player.id);
        const winner = state.trickWinnerId === player.id;
        return <article className={`portrait-player-slot ${winner ? "round-winner" : ""}`} key={player.id}>
          <div className="central-card-slot"><AnimatePresence mode="wait">{play ? <motion.div className="central-played-card" initial={{ opacity: 0, scale: .7, y: player.id === participantId ? 90 : -24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .75 }} transition={{ duration: .24 }} key={cid(play.card)}><PlayingCard card={play.card}/></motion.div> : <div className="empty-card-slot"/>}</AnimatePresence></div>
          <div className="portrait-player-info"><span className={`connection-dot ${connected(player.id) ? "online" : ""}`} aria-label={connected(player.id) ? "Connected" : "Reconnecting"}/><strong>{player.name}{player.id === participantId ? " · You" : ""} <span>({player.tricksWon}/{player.bid ?? "?"})</span></strong>{state.dealerIndex === state.players.findIndex((candidate) => candidate.id === player.id) && <b className="dealer-badge">D</b>}</div>
        </article>;
      })}
    </section>

    {state.phase === "bidding" && <div className="portrait-bid-panel">
      <div className={`bid-timer ${bidSeconds !== null && bidSeconds <= 5 ? "urgent" : ""}`}>{bidSeconds ?? "–"}</div>
      {me.bid === null ? <><div className="bid-stepper"><button onClick={() => setBidValue(Math.max(0, bidValue - 1))} disabled={bidValue === 0}><Minus/></button><strong>{bidValue}</strong><button onClick={() => setBidValue(Math.min(state.cardsDealt, bidValue + 1))} disabled={bidValue === state.cardsDealt}><Plus/></button></div><button className="primary-button bid-submit" disabled={busy} onClick={() => void act({ type: "place_bid", bid: bidValue })}>Submit</button></> : <div className="bid-wait"><Check/>Bid submitted</div>}
    </div>}

    <section className={`portrait-hand ${state.hand.length > 9 ? "two-row" : ""}`} style={{ "--hand-columns": handColumns } as CSSProperties} aria-label="Your hand">
      {state.hand.map((card, index) => { const legal = state.legalCardIds.includes(cid(card)); const inactive = state.phase !== "playing"; return <motion.button layout className={`hand-card ${inactive ? "view-only" : legal ? "legal" : "illegal"}`} disabled={!legal || busy} onClick={() => playCard(card)} key={cid(card)} style={{ zIndex: index }} whileTap={legal ? { y: -12 } : undefined}><PlayingCard card={card}/></motion.button>; })}
    </section>

    {autoBidNotice && <div className="auto-bid-note">Time expired. Bid 0 submitted.</div>}
    {state.phase === "round_complete" && <Scoreboard state={state} history={state.scoreHistory ?? []} countdown={scoreSeconds} ready={state.readyPlayerIds.includes(participantId)} onReady={() => void act({ type: "scorecard_ready" })}/>}
    {state.phase === "game_complete" && <Scoreboard state={state} history={state.scoreHistory ?? []} final winners={winners.map((player) => player.id)} onReady={() => location.assign("/")}/>}
    {showEnd && <EndGameConfirm state={state} onCancel={() => setShowEnd(false)} onConfirm={() => { setShowEnd(false); void act({ type: "end_game" }); }}/>}
    {error && <div className="toast-error">{error}</div>}
  </main>;
}

function Scoreboard({ state, history, countdown, ready, final, winners = [], onReady }: { state: ClientGameState; history: RoundScoreSnapshot[]; countdown?: number; ready?: boolean; final?: boolean; winners?: string[]; onReady: () => void }) {
  const endedBy = state.endedByPlayerId ? state.players.find((player) => player.id === state.endedByPlayerId)?.name : null;
  return <div className="scoreboard-backdrop"><section className="scoreboard"><div className="scoreboard-title">{final ? "Final Scoreboard" : "Scoreboard"}</div>{final && endedBy && <p className="end-attribution">{endedBy} ended the game.</p>}{countdown !== undefined && <p className="score-countdown">Next deal in {countdown}s</p>}<div className="score-scroll"><table><thead><tr><th>Trump</th><th>Deal</th>{state.players.map((player) => <th className={winners.includes(player.id) ? "winner-column" : ""} key={player.id}>{player.name}</th>)}</tr></thead><tbody>{history.map((deal) => <tr key={deal.roundNumber}><td className={deal.trump === "hearts" || deal.trump === "diamonds" ? "red-suit" : ""}>{suitLabel[deal.trump]}</td><td>{deal.roundNumber}</td>{state.players.map((player) => <td className={winners.includes(player.id) ? "winner-column" : ""} key={player.id}>{deal.results.find((result) => result.playerId === player.id)?.roundScore ?? ""}</td>)}</tr>)}</tbody><tfoot><tr><td></td><td>Total</td>{state.players.map((player) => <td className={winners.includes(player.id) ? "winner-column" : ""} key={player.id}>{player.totalScore}</td>)}</tr></tfoot></table></div><button className="primary-button scoreboard-ok" disabled={ready} onClick={onReady}>{ready ? "Ready ✓" : "OK"}</button></section></div>;
}

function EndGameConfirm({ state, onCancel, onConfirm }: { state: ClientGameState; onCancel: () => void; onConfirm: () => void }) {
  return <div className="modal-backdrop"><section className="brand-modal end-confirm"><button className="icon-link modal-close" onClick={onCancel} aria-label="Close"><X/></button><h2>End this game?</h2><div className="standings">{[...state.players].sort((a, b) => b.totalScore - a.totalScore).map((player) => <div key={player.id}><span>{player.name}</span><strong>{player.totalScore}</strong></div>)}</div><p>Current scores become final and statistics will be recorded.</p><div className="confirm-actions"><button className="secondary-button" onClick={onCancel}>Cancel</button><button className="danger-button" onClick={onConfirm}>End Game</button></div></section></div>;
}
