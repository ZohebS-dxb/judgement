// src/pages/CallsStep2.jsx
import React, { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import { collection, doc, getDoc, writeBatch, addDoc } from "firebase/firestore";

export default function CallsStep2() {
  // Brand palette
  const brand = useMemo(
    () => ({
      bg: "#748DAE",
      selected: "#9ECAD6",
      textPrimary: "#FFFFFF",
      ringClass: "focus:outline-none focus:ring-4 focus:ring-[#9ECAD6]/45",
      tick: "#16a34a",
      cross: "#dc2626",
    }),
    []
  );

  // Only these names accrue stats online (custom names are ignored)
  const CORE_PLAYERS = useMemo(
    () => new Set(["Zoheb", "Ashu", "Divya", "Saurabh", "Siddhant", "Ashish", "Anas"]),
    []
  );

  const SUITS = ["♠", "❤", "♢", "♣"];

  // --- Selected players from Step 1 ---
  const [playerList, setPlayerList] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("judgement_step1") || "null");
      if (saved && Array.isArray(saved.players) && Array.isArray(saved.selected)) {
        const selectedNames = saved.players.filter((p) => saved.selected.includes(p));
        if (selectedNames.length) {
          setPlayerList(selectedNames);
          return;
        }
      }
      // Fallback (older key)
      const fallback = JSON.parse(localStorage.getItem("selectedPlayers") || "null");
      setPlayerList(Array.isArray(fallback) ? fallback : []);
    } catch {
      setPlayerList([]);
    }
  }, []);

  // Round + suit
  const [round, setRound] = useState(1);
  const [suitIdx, setSuitIdx] = useState(0);

  // Per-round inputs and current focus
  // calls[name] = { call: number, result: "hit" | "miss" | null }
  const [calls, setCalls] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);

  // Accumulated scores
  const [scores, setScores] = useState({});

  // End-game / winners
  const [gameEnded, setGameEnded] = useState(false);
  const [winners, setWinners] = useState([]);

  // Ping Firestore once (sanity check)
  useEffect(() => {
    (async () => {
      try {
        await addDoc(collection(db, "ping"), {
          message: "hello from CallsStep2",
          at: new Date().toISOString(),
        });
        // console.log("✅ Firestore ping OK");
      } catch (e) {
        // console.error("❌ Firestore ping failed:", e);
      }
    })();
  }, []);

  // Seed & restore
  useEffect(() => {
    const baseCalls = {};
    const baseScores = {};
    playerList.forEach((n) => {
      baseCalls[n] = { call: 0, result: null };
      baseScores[n] = 0;
    });

    // restore calls
    try {
      const stored = JSON.parse(localStorage.getItem("judgement_step2") || "null");
      const next = { ...baseCalls };
      if (stored && typeof stored === "object") {
        Object.keys(next).forEach((n) => {
          if (stored[n]) next[n] = stored[n];
        });
      }
      setCalls(next);
    } catch {
      setCalls(baseCalls);
    }

    // restore scores
    try {
      const stored = JSON.parse(localStorage.getItem("judgement_scores") || "null");
      const next = { ...baseScores };
      if (stored && typeof stored === "object") {
        Object.keys(next).forEach((n) => {
          if (typeof stored[n] === "number") next[n] = stored[n];
        });
      }
      setScores(next);
    } catch {
      setScores(baseScores);
    }

    // restore round/suit
    try {
      setRound(Number(localStorage.getItem("judgement_round")) || 1);
      const sRaw = localStorage.getItem("judgement_suitIdx");
      const s = sRaw === null ? 0 : Number(sRaw);
      setSuitIdx(Number.isFinite(s) ? ((s % SUITS.length) + SUITS.length) % SUITS.length : 0);
    } catch {
      setRound(1);
      setSuitIdx(0);
    }

    setCurrentIdx(0);
    setGameEnded(false);
    setWinners([]);
  }, [playerList]);

  // Persist pieces
  useEffect(() => {
    try {
      localStorage.setItem("judgement_step2", JSON.stringify(calls));
    } catch {}
  }, [calls]);

  useEffect(() => {
    try {
      localStorage.setItem("judgement_scores", JSON.stringify(scores));
    } catch {}
  }, [scores]);

  useEffect(() => {
    try {
      localStorage.setItem("judgement_round", String(round));
    } catch {}
  }, [round]);

  useEffect(() => {
    try {
      localStorage.setItem("judgement_suitIdx", String(suitIdx));
    } catch {}
  }, [suitIdx]);

  // Helpers
  const selectIdx = (idx) => {
    if (idx < 0 || idx >= playerList.length) return;
    setCurrentIdx(idx);
  };
  const nextIdx = () => {
    if (!playerList.length) return;
    setCurrentIdx((i) => (i + 1) % playerList.length);
  };

  // Keypad sets call & auto-advances
  const handleKeypadPress = (digit) => {
    const name = playerList[currentIdx];
    if (!name || gameEnded) return;
    setCalls((prev) => ({
      ...prev,
      [name]: { ...prev[name], call: Number(digit) },
    }));
    nextIdx();
  };

  // ✓ / ✗ toggle (mutually exclusive)
  const toggleResult = (name, type) => {
    if (gameEnded) return;
    setCalls((prev) => {
      const curr = prev[name] ?? { call: 0, result: null };
      const nextResult = curr.result === type ? null : type;
      return { ...prev, [name]: { ...curr, result: nextResult } };
    });
  };

  // Everyone must be answered to enable Next Round
  const allAnswered =
    playerList.length > 0 &&
    playerList.every((n) => {
      const r = calls[n]?.result;
      return r === "hit" || r === "miss";
    });

  // Apply scoring and move to next round
  const handleNextRound = () => {
    if (!allAnswered || gameEnded) return;

    setScores((prev) => {
      const updated = { ...prev };
      playerList.forEach((name) => {
        const row = calls[name] || { call: 0, result: null };
        const callVal = Number(row.call) || 0;
        const magnitude = callVal === 0 ? 10 : 10 * callVal;
        if (row.result === "hit") updated[name] = (updated[name] || 0) + magnitude;
        else if (row.result === "miss") updated[name] = (updated[name] || 0) - magnitude;
      });
      return updated;
    });

    // reset per-round inputs
    const reset = {};
    playerList.forEach((n) => (reset[n] = { call: 0, result: null }));
    setCalls(reset);

    setCurrentIdx(0);
    setRound((r) => r + 1);
    setSuitIdx((i) => (i + 1) % SUITS.length);
  };

  // END GAME — always confirm; then save, clear local, reset state
  const handleEndGame = async () => {
    if (gameEnded) return;

    const ok = window.confirm("Are you sure you want to end the game?");
    if (!ok) return;

    // Standings
    const standings = playerList
      .map((name) => ({ name, score: Number(scores[name] || 0) }))
      .sort((a, b) => b.score - a.score);

    // Competition ranking (1,1,3,... ties)
    const positions = {};
    let pos = 1;
    for (let i = 0; i < standings.length; ) {
      const score = standings[i].score;
      const same = standings.filter((s) => s.score === score);
      same.forEach((s) => (positions[s.name] = pos));
      i += same.length;
      pos = i + 1;
    }

    const winnerNames = standings.filter((s) => positions[s.name] === 1).map((s) => s.name);
    setWinners(winnerNames);
    setGameEnded(true);

    // Snapshot game
    try {
      await addDoc(collection(db, "games"), {
        endedAt: new Date().toISOString(),
        players: standings.map((s) => ({
          name: s.name,
          score: s.score,
          position: positions[s.name],
        })),
      });
    } catch (e) {
      console.warn("Unable to add game snapshot:", e);
    }

    // Update cumulative stats (core players only)
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();
      const lastPositionValue = Math.max(...Object.values(positions));

      for (const { name, score } of standings) {
        if (!CORE_PLAYERS.has(name)) continue;

        const ref = doc(db, "players", name);
        let existing = null;
        try {
          const snap = await getDoc(ref);
          existing = snap.exists() ? snap.data() : null;
        } catch {
          existing = null;
        }

        const currentPos = positions[name];
        const gamesPlayed = (existing?.gamesPlayed || 0) + 1;
        const finishesCount = (existing?.finishesCount || 0) + 1;
        const sumPositions = (existing?.sumPositions || 0) + currentPos;
        const avgPosition = sumPositions / finishesCount;

        const next = {
          name,
          gamesPlayed,
          finishesCount,
          sumPositions,
          avgPosition,
          totalScore: (existing?.totalScore || 0) + score,
          highScoreSingleGame: Math.max(
            existing?.highScoreSingleGame || Number.MIN_SAFE_INTEGER,
            score
          ),
          lastPlayedAt: now,
        };

        if (currentPos === 1) {
          next.gamesWon = (existing?.gamesWon || 0) + 1;
          next.podiums = (existing?.podiums || 0) + 1;
        } else if (currentPos <= 3) {
          next.podiums = (existing?.podiums || 0) + 1;
        }
        if (currentPos === lastPositionValue) {
          next.lastPlaces = (existing?.lastPlaces || 0) + 1;
        }

        batch.set(ref, existing ? { ...existing, ...next } : next);
      }

      await batch.commit();
    } catch (e) {
      console.error("Failed to write player stats:", e);
      alert("Could not save stats online. Check console and Firebase rules.");
    }

    
  };

  return (
    <div
      className="min-h-dvh w-full"
      style={{
        background: brand.bg,
        color: brand.textPrimary,
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div className="mx-auto max-w-md px-4 pb-24 pt-8 sm:pt-10">
        {/* Title */}
        <header className="mb-2 text-center">
          <h1 className="font-extrabold leading-tight tracking-tight" style={{ fontSize: "2.6rem" }}>
            Judgement
          </h1>
          <p className="mt-1 text-sm font-semibold">
            Round {round}{" "}
            <span
              style={{
                marginLeft: 8,
                color: SUITS[suitIdx] === "❤" || SUITS[suitIdx] === "♢" ? "#ff4d4f" : "inherit",
              }}
            >
              {SUITS[suitIdx]}
            </span>
          </p>
        </header>

        {/* Players list */}
        {playerList.length === 0 ? (
          <div className="mt-6 text-center text-sm opacity-90">
            No players found. Go back and select players on Step 1.
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {playerList.map((name, idx) => {
              const row = calls[name] || { call: 0, result: null };
              const isCurrent = idx === currentIdx;
              const isHit = row.result === "hit";
              const isMiss = row.result === "miss";
              const scoreVal = typeof scores[name] === "number" ? scores[name] : 0;
              const isWinner = gameEnded && winners.includes(name);

              return (
                <div
                  key={name}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectIdx(idx)}
                  className={`w-full rounded-2xl px-4 py-3 text-left transition-all ${brand.ringClass}`}
                  style={{
                    background: isWinner
                      ? "#16a34a"
                      : isCurrent
                      ? brand.selected
                      : "rgba(255,255,255,0.15)",
                    color: isWinner ? "#fff" : isCurrent ? "#000" : brand.textPrimary,
                    border: isWinner
                      ? "2px solid rgba(255,255,255,0.7)"
                      : isCurrent
                      ? "2px solid rgba(0,0,0,0.2)"
                      : "2px solid transparent",
                    cursor: gameEnded ? "default" : "pointer",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") selectIdx(idx);
                  }}
                >
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: "70px 1fr 120px", // [Call] [Name/Score] [Actions]
                      rowGap: "0",
                    }}
                  >
                    {/* CALL square (left) */}
                    <div className="row-span-2 flex items-stretch justify-center" style={{ marginLeft: "-10px" }}>
                      <div
                        className="rounded-xl flex items-center justify-center font-extrabold"
                        style={{
                          height: "100%",
                          aspectRatio: "1 / 1",
                          background: "rgba(255,255,255,0.22)",
                          color: isWinner ? "#fff" : isCurrent ? "#000" : brand.textPrimary,
                          border: isWinner
                            ? "2px solid rgba(255,255,255,0.65)"
                            : isCurrent
                            ? "2px solid rgba(0,0,0,0.25)"
                            : "2px solid transparent",
                          fontSize: "2rem",
                        }}
                      >
                        {row.call ?? 0}
                      </div>
                    </div>

                    {/* NAME (top line) */}
                    <div className="flex items-center pr-2" style={{ marginLeft: "10px" }}>
                      <span
                        className="truncate font-extrabold"
                        style={{
                          fontSize: "1.6rem",
                          lineHeight: 1,
                          color: isWinner ? "#fff" : isCurrent ? "#000" : brand.textPrimary,
                        }}
                      >
                        {name}
                      </span>
                    </div>

                    {/* ACTIONS (right) */}
                    <div className="flex items-center justify-end gap-3" style={{ marginTop: "10px" }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleResult(name, "hit");
                        }}
                        className="rounded-2xl px-4 py-3 flex items-center justify-center"
                        style={{
                          background: isHit ? brand.tick : "rgba(255,255,255,0.22)",
                          color: "#fff",
                          border: isHit ? "2px solid rgba(255,255,255,0.35)" : "2px solid transparent",
                          opacity: gameEnded ? 0.6 : 1,
                        }}
                        disabled={gameEnded}
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleResult(name, "miss");
                        }}
                        className="rounded-2xl px-4 py-3 flex items-center justify-center"
                        style={{
                          background: isMiss ? brand.cross : "rgba(255,255,255,0.22)",
                          color: "#fff",
                          border: isMiss ? "2px solid rgba(255,255,255,0.35)" : "2px solid transparent",
                          opacity: gameEnded ? 0.6 : 1,
                        }}
                        disabled={gameEnded}
                      >
                        ✗
                      </button>
                    </div>

                    {/* SCORE (under name) */}
                    <div className="col-start-2 col-span-2" style={{ marginLeft: "10px" }}>
                      <span
                        className="block font-extrabold"
                        style={{
                          marginTop: "-6px",
                          fontSize: "1.2rem",
                          lineHeight: 1,
                          color: isWinner ? "#fff" : isCurrent ? "#000" : brand.textPrimary,
                        }}
                      >
                        {scoreVal}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Keypad 0–9 */}
        <section className="mt-6">
          <div className="grid grid-cols-5 gap-3">
            {[0, 1, 2, 3, 4].map((n) => (
              <button
                key={`kp-${n}`}
                onClick={() => handleKeypadPress(n)}
                className={`rounded-2xl py-4 text-2xl font-extrabold ${brand.ringClass}`}
                style={{
                  background: "rgba(255,255,255,0.22)",
                  color: brand.textPrimary,
                  opacity: gameEnded ? 0.5 : 1,
                }}
                disabled={gameEnded || playerList.length === 0}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-5 gap-3">
            {[5, 6, 7, 8, 9].map((n) => (
              <button
                key={`kp-${n}`}
                onClick={() => handleKeypadPress(n)}
                className={`rounded-2xl py-4 text-2xl font-extrabold ${brand.ringClass}`}
                style={{
                  background: "rgba(255,255,255,0.22)",
                  color: brand.textPrimary,
                  opacity: gameEnded ? 0.5 : 1,
                }}
                disabled={gameEnded || playerList.length === 0}
              >
                {n}
              </button>
            ))}
          </div>
        </section>

        {/* Controls */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleNextRound}
            disabled={!allAnswered || gameEnded || playerList.length === 0}
            className={`w-full rounded-2xl py-4 text-xl font-extrabold ${brand.ringClass}`}
            style={{
              background:
                !allAnswered || gameEnded || playerList.length === 0
                  ? "rgba(255,255,255,0.25)"
                  : brand.selected,
              color:
                !allAnswered || gameEnded || playerList.length === 0
                  ? "rgba(255,255,255,0.7)"
                  : "#000",
              cursor:
                !allAnswered || gameEnded || playerList.length === 0
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            Next Round
          </button>

          {/* End Game is always available */}
          <button
            onClick={handleEndGame}
            disabled={playerList.length === 0}
            className={`w-full rounded-2xl py-4 text-xl font-extrabold ${brand.ringClass}`}
            style={{
              background: "#222",
              color: "#fff",
              opacity: playerList.length === 0 ? 0.6 : 1,
              cursor: playerList.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            End Game
          </button>
        </div>
      </div>
    </div>
  );
}
