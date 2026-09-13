"use client";

import { BarChart3, Check, DoorOpen, LoaderCircle, Minus, Plus, RotateCcw, RotateCw, X } from "lucide-react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Card, ClientGameState, RoundScoreSnapshot } from "@/lib/game/types";
import { bidCallStatus } from "@/lib/game/bidding";
import { PlayingCard } from "./playing-card";
import { preloadCardAssets, suitAsset } from "@/lib/client/card-assets";
import { playGameSound, preloadGameAudio, setSoundEnabled } from "@/lib/client/game-audio";
import { gamePerf } from "@/lib/client/performance";

type ActionInput = { type: "place_bid"; bid: number } | { type: "play_card"; card: Card } | { type: "scorecard_ready" } | { type: "trick_seen" } | { type: "end_game" };
type OptimisticPlay = { card: Card; originalIndex: number; actionId: string };
const cid = (card: Card) => `${card.rank}-${card.suit}`;
const suitLabel = { clubs: "♣ CLUBS", diamonds: "♦ DIAMONDS", hearts: "♥ HEARTS", spades: "♠ SPADES" } as const;
const vibrate = (pattern: number | number[]) => { if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern); };

export function GameTable({ gameId }: { gameId: string }) {
  const [state, setState] = useState<ClientGameState | null>(null); const [participantId, setParticipantId] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [now, setNow] = useState(Date.now()); const [bidValue, setBidValue] = useState(0);
  const [showEnd, setShowEnd] = useState(false); const [showScoreboard, setShowScoreboard] = useState(false); const [autoBidNotice, setAutoBidNotice] = useState(false);
  const [optimisticPlay, setOptimisticPlay] = useState<OptimisticPlay | null>(null); const [optimisticBid, setOptimisticBid] = useState<number | null>(null); const [showSpecial, setShowSpecial] = useState(false);
  const [soundOn, setSoundOn] = useState(true); const lastUrgent = useRef<number | null>(null); const priorPhase = useRef<ClientGameState["phase"] | null>(null); const acknowledgedTrick = useRef(""); const heardDeal = useRef(0); const heardPlay = useRef(""); const audioStateLoaded = useRef(false);

  const load = useCallback(async () => {
    const response = await fetch(`/api/games/${gameId}/state`, { cache: "no-store" }); const body = await response.json();
    if (response.status === 410) { sessionStorage.setItem("judgement_notice", body.error ?? "Game abandoned."); location.replace("/"); return; }
    if (response.ok) { setState(body.state); setParticipantId(body.participantId); setError(""); return true; } else setError(body.error);
    return false;
  }, [gameId]);

  useEffect(() => {
    preloadCardAssets(); preloadGameAudio(); setSoundOn(localStorage.getItem("judgement_sound") !== "off");
    void load(); const poll = setInterval(load, 2500); const clock = setInterval(() => setNow(Date.now()), 200);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; const client = url && key ? createClient(url, key) : null;
    const channel = client?.channel(`game-${gameId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "game_updates", filter: `game_id=eq.${gameId}` }, (payload) => { const broadcastAt = typeof payload.new.created_at === "string" ? new Date(payload.new.created_at).getTime() : Date.now(); void load().then(() => requestAnimationFrame(() => gamePerf("broadcast → remote render", Math.max(0, Date.now() - broadcastAt)))); }).subscribe();
    const resume = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", resume); window.addEventListener("pageshow", resume); window.addEventListener("online", resume);
    return () => { clearInterval(poll); clearInterval(clock); document.removeEventListener("visibilitychange", resume); window.removeEventListener("pageshow", resume); window.removeEventListener("online", resume); if (client && channel) void client.removeChannel(channel); };
  }, [gameId, load]);

  useEffect(() => { setBidValue(0); }, [state?.roundNumber]);
  useEffect(() => { const seconds = state?.biddingEndsAt ? Math.max(0, Math.ceil((new Date(state.biddingEndsAt).getTime() - now) / 1000)) : null; if (seconds !== null && seconds <= 5 && seconds > 0 && lastUrgent.current !== seconds) { lastUrgent.current = seconds; vibrate(10); playGameSound("tick"); } }, [state?.biddingEndsAt, now]);
  useEffect(() => { if (!state || priorPhase.current === state.phase) return; if (state.phase === "trick_complete" && state.trickWinnerId === participantId) { vibrate([18, 28, 18]); playGameSound("round"); } if (state.phase === "game_complete") { vibrate([25, 35, 25]); playGameSound("game"); } priorPhase.current = state.phase; }, [state, participantId]);
  useEffect(() => { if (state?.phase !== "bidding" || heardDeal.current === state.roundNumber) return; heardDeal.current = state.roundNumber; playGameSound("deal"); }, [state?.phase, state?.roundNumber]);
  useEffect(() => {
    if (!state) return;
    if (!audioStateLoaded.current) { audioStateLoaded.current = true; if (state.currentTrick.length) { const existing = state.currentTrick[state.currentTrick.length - 1]; heardPlay.current = `${state.roundNumber}-${state.completedTricks.length}-${state.currentTrick.length}-${existing.playerId}-${cid(existing.card)}`; } return; }
    if (!state.currentTrick.length) return;
    const play = state.currentTrick[state.currentTrick.length - 1]; const key = `${state.roundNumber}-${state.completedTricks.length}-${state.currentTrick.length}-${play.playerId}-${cid(play.card)}`;
    if (heardPlay.current === key) return; heardPlay.current = key; if (play.playerId !== participantId) playGameSound("card");
  }, [state, participantId]);
  useEffect(() => { if (!state?.trickEndsAt) return; const delay = Math.max(0, new Date(state.trickEndsAt).getTime() - Date.now() + 60); const timer = setTimeout(() => void load(), delay); return () => clearTimeout(timer); }, [state?.trickEndsAt, load]);
  useEffect(() => {
    if (state?.phase !== "trick_complete" || busy) return;
    const key = `${state.roundNumber}-${state.completedTricks.length}`; if (acknowledgedTrick.current === key) return;
    acknowledgedTrick.current = key;
    const timer = setTimeout(() => void act({ type: "trick_seen" }), 1_050);
    return () => clearTimeout(timer);
  // The action is intentionally scheduled from the authoritative trick identity.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.phase, state?.roundNumber, state?.completedTricks.length, busy]);
  useEffect(() => { if (state?.phase !== "playing" || !state.autoBidPlayerIds.includes(participantId)) return; setAutoBidNotice(true); const timer = setTimeout(() => setAutoBidNotice(false), 3000); return () => clearTimeout(timer); }, [state?.phase, state?.roundNumber, state?.autoBidPlayerIds.join(","), participantId]);

  async function act(action: ActionInput, actionId = crypto.randomUUID()) {
    if (busy) return false; setBusy(true); setError("");
    const sentAt = Date.now(); const started = performance.now();
    try {
      const response = await fetch(`/api/games/${gameId}/action`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...action, actionId }) });
      const body = await response.json();
      if (response.status === 410) { sessionStorage.setItem("judgement_notice", body.error ?? "Game abandoned."); location.replace("/"); return false; }
      if (!response.ok) { setError(body.error); void load(); return false; }
      setState(body.state); if (body.timing) { gamePerf("action sent → server received", Math.max(0, body.timing.serverReceivedAt - sentAt)); gamePerf("server received → broadcast", Math.max(0, body.timing.broadcastAt - body.timing.serverReceivedAt)); } if (action.type === "place_bid") gamePerf("bid submit → confirmation", performance.now() - started); if (action.type === "play_card") vibrate(18); if (action.type === "place_bid") vibrate(12); if (action.type === "end_game") vibrate([30, 40, 30]); return true;
    } catch { setError("Connection lost. Your card was restored."); void load(); return false; }
    finally { setBusy(false); }
  }

  const meIndex = state?.players.findIndex((player) => player.id === participantId) ?? 0;
  const seats = useMemo(() => state?.players.map((_, relative) => state.players[(meIndex + relative) % state.players.length]) ?? [], [state, meIndex]);
  if (!state) return <main className="game-page"><div className="center-message"><LoaderCircle className="spin"/><span>{error || "Reconnecting…"}</span></div></main>;

  const me = state.players[meIndex]; const active = state.players[state.activePlayerIndex]; const firstPlayerIndex = (state.dealerIndex + (state.direction === "clockwise" ? 1 : state.players.length - 1)) % state.players.length;
  const myTurn = state.phase === "playing" && active.id === participantId; const bidSeconds = state.biddingEndsAt ? Math.max(0, Math.ceil((new Date(state.biddingEndsAt).getTime() - now) / 1000)) : null;
  const scoreSeconds = state.scorecardEndsAt ? Math.max(0, Math.ceil((new Date(state.scorecardEndsAt).getTime() - now) / 1000)) : 0; const connected = (id: string) => now - new Date(state.presence[id] ?? 0).getTime() < 20_000;
  const winners = state.phase === "game_complete" ? state.players.filter((player) => player.totalScore === Math.max(...state.players.map((other) => other.totalScore))) : [];
  const callStatus = state.phase === "bidding" || state.phase === "game_complete" ? null : bidCallStatus(state.players, state.cardsDealt); const totalBids = state.players.reduce((sum, player) => sum + (player.bid ?? 0), 0);
  const displaySeats = state.players.length === 3 ? [seats[1], seats[2], seats[0]] : [seats[1], seats[2], seats[0], seats[3]];
  const visibleHand = optimisticPlay ? state.hand.filter((card, index) => index !== optimisticPlay.originalIndex || cid(card) !== cid(optimisticPlay.card)) : state.hand;
  const handColumns = visibleHand.length > 9 ? Math.ceil(visibleHand.length / 2) : Math.max(1, visibleHand.length);
  const visibleTrick = optimisticPlay && !state.currentTrick.some((play) => play.playerId === participantId && cid(play.card) === cid(optimisticPlay.card)) ? [...state.currentTrick, { playerId: participantId, card: optimisticPlay.card }] : state.currentTrick;
  const playCard = async (card: Card) => { if (!state.legalCardIds.includes(cid(card)) || busy) return; const originalIndex = state.hand.findIndex((candidate) => cid(candidate) === cid(card)); const actionId = crypto.randomUUID(); const tapped = performance.now(); heardPlay.current = `${state.roundNumber}-${state.completedTricks.length}-${state.currentTrick.length + 1}-${participantId}-${cid(card)}`; setOptimisticPlay({ card, originalIndex, actionId }); playGameSound("card"); requestAnimationFrame(() => gamePerf("card tap → local render", performance.now() - tapped)); await act({ type: "play_card", card }, actionId); setOptimisticPlay(null); };
  const turnText = state.phase === "bidding" ? "Place Your Bid" : state.phase === "trick_complete" ? `${state.players.find((player) => player.id === state.trickWinnerId)?.name} won this round` : `${active.name}'s Turn`;

  async function finalHome() {
    setBusy(true); setError("");
    try { const response = await fetch(`/api/games/${gameId}/finalize`, { method: "POST" }); const body = await response.json(); if (!response.ok) { setError(body.error); return; } if (body.showSaurabhLastPlace) setShowSpecial(true); else location.replace("/"); }
    catch { setError("Could not save the result. Please try Home again."); }
    finally { setBusy(false); }
  }

  if (showSpecial) return <main className="special-last-place"><Image src="/saurabh-mehta-last-place.png" alt="Saurabh Mehta last-place surprise" fill priority sizes="100vw"/><button className="primary-button" onClick={() => location.replace("/")}>OK</button></main>;

  return <main className={`game-page portrait-game ${myTurn ? "my-turn" : ""} ${visibleHand.length > 9 ? "large-hand" : ""} ${state.phase === "bidding" ? "bidding-phase" : ""}`}>
    <header className="top-game-bar"><strong className="trump-icon" aria-label={`${state.trump} trump`}><Image src={suitAsset(state.trump)} alt="" width={38} height={38} unoptimized/></strong><span>Deal {state.cardsDealt}</span>{callStatus && <b className={`call-status ${callStatus === "EXACT" ? "exact" : ""}`}>{callStatus} · {totalBids}</b>}<div className="game-header-actions"><button className="end-game-icon sound-toggle" onClick={() => { const next = !soundOn; setSoundOn(next); setSoundEnabled(next); if (next) playGameSound("bid"); }} aria-label={soundOn ? "Mute sounds" : "Enable sounds"} title={soundOn ? "Mute sounds" : "Enable sounds"}><span className="sound-mark">{soundOn ? "SOUND" : "MUTE"}</span></button><button className="end-game-icon" onClick={() => setShowScoreboard(true)} aria-label="Current Scoreboard" title="Current Scoreboard"><BarChart3/></button><button className="end-game-icon" onClick={() => setShowEnd(true)} aria-label="End Game" title="End Game"><DoorOpen/></button></div></header>
    <div className="direction-watermark" aria-hidden="true">{state.direction === "clockwise" ? <RotateCw/> : <RotateCcw/>}</div><div className={`turn-announcement ${myTurn ? "local-turn" : ""}`}>{turnText}</div>
    <section className={`portrait-play-grid players-${state.players.length}`}>{displaySeats.map((player) => { const play = visibleTrick.find((card) => card.playerId === player.id); const winner = state.trickWinnerId === player.id; return <article className={`portrait-player-slot ${winner ? "round-winner" : ""}`} key={player.id}><div className="central-card-slot"><AnimatePresence mode="wait">{play ? <motion.div className="central-played-card" initial={{ opacity: 0, scale: .7, y: player.id === participantId ? 90 : -24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .75 }} transition={{ duration: .18 }} key={cid(play.card)}><PlayingCard card={play.card}/></motion.div> : <div className="empty-card-slot"/>}</AnimatePresence></div><div className="portrait-player-info"><span className={`connection-dot ${connected(player.id) ? "online" : ""}`} aria-label={connected(player.id) ? "Connected" : "Reconnecting"}/><strong>{player.name}{player.id === participantId ? " · You" : ""} <span>({player.tricksWon}/{player.bid ?? "?"})</span></strong>{firstPlayerIndex === state.players.findIndex((candidate) => candidate.id === player.id) && <b className="first-player-badge" aria-label="First player" title="First player">★</b>}</div></article>; })}</section>
    {state.phase === "bidding" && <div className="portrait-bid-panel"><div className={`bid-timer ${bidSeconds !== null && bidSeconds <= 5 ? "urgent" : ""}`}>{bidSeconds ?? "–"}</div>{me.bid === null && optimisticBid === null ? <><div className="bid-stepper"><button onClick={() => setBidValue(Math.max(0, bidValue - 1))} disabled={bidValue === 0}><Minus/></button><strong>{bidValue}</strong><button onClick={() => setBidValue(Math.min(state.cardsDealt, bidValue + 1))} disabled={bidValue === state.cardsDealt}><Plus/></button></div><button className="primary-button bid-submit" disabled={busy} onClick={() => { const bid = bidValue; setOptimisticBid(bid); playGameSound("bid"); void act({ type: "place_bid", bid }).then(() => setOptimisticBid(null)); }}>Submit</button></> : <div className="bid-wait"><Check/>Bid submitted</div>}</div>}
    <section className={`portrait-hand ${visibleHand.length > 9 ? "two-row" : ""}`} style={{ "--hand-columns": handColumns } as CSSProperties} aria-label="Your hand">{visibleHand.map((card, index) => { const legal = state.legalCardIds.includes(cid(card)); const inactive = state.phase !== "playing"; return <motion.button layout className={`hand-card ${inactive ? "view-only" : legal ? "legal" : "illegal"}`} disabled={!legal || busy} onClick={() => void playCard(card)} key={cid(card)} style={{ zIndex: index }} whileTap={legal ? { y: -12 } : undefined}><PlayingCard card={card}/></motion.button>; })}</section>
    {autoBidNotice && <div className="auto-bid-note">Time expired. Bid 0 submitted.</div>}
    {showScoreboard && state.phase !== "round_complete" && state.phase !== "game_complete" && <Scoreboard state={state} history={state.scoreHistory ?? []} mode="current" winners={[]} onAction={() => setShowScoreboard(false)}/>}
    {state.phase === "round_complete" && <Scoreboard state={state} history={state.scoreHistory ?? []} mode="round" countdown={scoreSeconds} ready={state.readyPlayerIds.includes(participantId)} winners={[]} onAction={() => void act({ type: "scorecard_ready" })}/>}
    {state.phase === "game_complete" && <Scoreboard state={state} history={state.scoreHistory ?? []} mode="final" winners={winners.map((player) => player.id)} ready={busy} onAction={() => void finalHome()}/>}
    {showEnd && <EndGameConfirm state={state} onCancel={() => setShowEnd(false)} onConfirm={() => { setShowEnd(false); void act({ type: "end_game" }); }}/>} {error && <div className="toast-error">{error}</div>}
  </main>;
}

function Scoreboard({ state, history, countdown, ready, mode, winners = [], onAction }: { state: ClientGameState; history: RoundScoreSnapshot[]; countdown?: number; ready?: boolean; mode: "current" | "round" | "final"; winners?: string[]; onAction: () => void }) {
  const endedBy = state.endedByPlayerId ? state.players.find((player) => player.id === state.endedByPlayerId)?.name : null; const final = mode === "final";
  return <div className="scoreboard-backdrop"><section className="scoreboard"><div className="scoreboard-title">{final ? "Final Scoreboard" : "Scoreboard"}</div>{final && endedBy && <p className="end-attribution">{endedBy} ended the game.</p>}{mode === "round" && countdown !== undefined && <p className="score-countdown">Next deal in {countdown}s</p>}<div className="score-scroll"><table><thead><tr><th>Trump</th><th>Deal</th>{state.players.map((player) => <th className={winners.includes(player.id) ? "winner-column" : ""} key={player.id}>{player.name}</th>)}</tr></thead><tbody>{history.map((deal) => <tr key={deal.roundNumber}><td className={deal.trump === "hearts" || deal.trump === "diamonds" ? "red-suit" : ""}>{suitLabel[deal.trump]}</td><td>{deal.roundNumber}</td>{state.players.map((player) => <td className={winners.includes(player.id) ? "winner-column" : ""} key={player.id}>{deal.results.find((result) => result.playerId === player.id)?.roundScore ?? ""}</td>)}</tr>)}</tbody><tfoot><tr><td></td><td>Total</td>{state.players.map((player) => <td className={winners.includes(player.id) ? "winner-column" : ""} key={player.id}>{player.totalScore}</td>)}</tr></tfoot></table></div><div className="scoreboard-actions"><button className="primary-button scoreboard-ok" disabled={mode === "round" && ready} onClick={onAction}>{mode === "final" ? ready ? "Saving…" : "Home" : mode === "current" ? "Close" : ready ? "Ready ✓" : "OK"}</button></div></section></div>;
}

function EndGameConfirm({ state, onCancel, onConfirm }: { state: ClientGameState; onCancel: () => void; onConfirm: () => void }) {
  return <div className="modal-backdrop"><section className="brand-modal end-confirm"><button className="icon-link modal-close" onClick={onCancel} aria-label="Close"><X/></button><h2>End this game?</h2><div className="standings">{[...state.players].sort((a, b) => b.totalScore - a.totalScore).map((player) => <div key={player.id}><span>{player.name}</span><strong>{player.totalScore}</strong></div>)}</div><p>The current scores will be shown on the final Scoreboard and counted in Stats when Home is pressed.</p><div className="confirm-actions"><button className="secondary-button" onClick={onCancel}>Cancel</button><button className="danger-button" onClick={onConfirm}>End Game</button></div></section></div>;
}
