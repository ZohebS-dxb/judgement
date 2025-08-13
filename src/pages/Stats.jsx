// src/pages/Stats.jsx
import React, { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Stats() {
  const brand = useMemo(
    () => ({
      bg: "#748DAE",
      panel: "rgba(255,255,255,0.14)",
      border: "2px solid rgba(255,255,255,0.18)",
      text: "#FFFFFF",
      subtext: "rgba(255,255,255,0.85)",
      headerSize: "2.2rem",
    }),
    []
  );

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "players"));
        const list = snap.docs.map((d) => {
          const v = d.data() || {};
          const gamesPlayed = toNum(v.gamesPlayed);
          const finishesCount = toNum(v.finishesCount) || gamesPlayed;
          const sumPositions = toNum(v.sumPositions);
          const avgPosition =
            isFiniteNumber(v.avgPosition)
              ? Number(v.avgPosition)
              : safeAvg(sumPositions, finishesCount);

          return {
            id: d.id,
            name: v.name || d.id,
            gamesPlayed,
            gamesWon: toNum(v.gamesWon),
            podiums: toNum(v.podiums),
            lastPlaces: toNum(v.lastPlaces) || toNum(v.gamesLastPlace),
            avgPosition,
            totalScore: toNum(v.totalScore),
            highScoreSingleGame:
              isFiniteNumber(v.highScoreSingleGame) ? Number(v.highScoreSingleGame) : null,
            lastPlayedAt: v.lastPlayedAt || "",
          };
        });

        list.sort((a, b) => {
          const aInf = Number.isFinite(a.avgPosition) ? 0 : 1;
          const bInf = Number.isFinite(b.avgPosition) ? 0 : 1;
          if (aInf !== bInf) return aInf - bInf;
          if (!Number.isFinite(a.avgPosition) && !Number.isFinite(b.avgPosition)) {
            return b.gamesWon - a.gamesWon;
          }
          if (a.avgPosition !== b.avgPosition) return a.avgPosition - b.avgPosition;
          if (a.gamesWon !== b.gamesWon) return b.gamesWon - a.gamesWon;
          return b.podiums - a.podiums;
        });

        setRows(list);
      } catch (e) {
        console.error(e);
        setErr("Could not load stats. Check Firestore rules/connection.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div
      className="min-h-dvh w-full"
      style={{ background: brand.bg, color: brand.text, fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-8">
        <header className="mb-6 text-center">
          <h1 className="font-extrabold tracking-tight" style={{ fontSize: brand.headerSize }}>
            Judgement — Stats
          </h1>
          <p className="mt-1 text-sm" style={{ color: brand.subtext }}>
            Sorted by Average Position (lower is better)
          </p>
        </header>

        {loading ? (
          <div className="text-center opacity-90">Loading…</div>
        ) : err ? (
          <div className="text-center text-red-200">{err}</div>
        ) : rows.length === 0 ? (
          <div className="text-center opacity-90">No player stats yet.</div>
        ) : (
          <>
            {/* Mobile cards */}
            <ul className="grid grid-cols-1 gap-3 sm:hidden">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className="rounded-2xl p-4"
                  style={{ background: brand.panel, border: brand.border }}
                >
                  <div className="font-extrabold text-lg">{r.name}</div>

                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <Stat label="Wins" value={r.gamesWon} />
                    <Stat label="Podiums" value={r.podiums} />
                    <Stat label="Last" value={r.lastPlaces || 0} />
                    <Stat
                      label="Avg Pos"
                      value={Number.isFinite(r.avgPosition) ? r.avgPosition.toFixed(2) : "—"}
                    />
                    <Stat
                      label="High Score (Round)"
                      value={
                        r.highScoreSingleGame === null || r.highScoreSingleGame === undefined
                          ? "—"
                          : r.highScoreSingleGame
                      }
                    />
                    <Stat label="Games Played" value={r.gamesPlayed} />
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <section className="hidden sm:block mt-2">
              <div
                className="rounded-2xl overflow-x-auto"
                style={{ background: brand.panel, border: brand.border }}
              >
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="text-sm">
                      <Th>Player</Th>
                      <Th className="text-right">GP</Th>
                      <Th className="text-right">Wins</Th>
                      <Th className="text-right">Podiums</Th>
                      <Th className="text-right">Last</Th>
                      <Th className="text-right">Avg Position</Th>
                      <Th className="text-right">Total Score</Th>
                      <Th className="text-right">High Score (Round)</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-t border-white/10">
                        <Td strong>{r.name}</Td>
                        <Td right>{r.gamesPlayed}</Td>
                        <Td right>{r.gamesWon}</Td>
                        <Td right>{r.podiums}</Td>
                        <Td right>{r.lastPlaces || 0}</Td>
                        <Td right>
                          {Number.isFinite(r.avgPosition) ? r.avgPosition.toFixed(2) : "—"}
                        </Td>
                        <Td right>{r.totalScore}</Td>
                        <Td right>
                          {r.highScoreSingleGame === null || r.highScoreSingleGame === undefined
                            ? "—"
                            : r.highScoreSingleGame}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs" style={{ color: brand.subtext }}>
                GP = Games Played • Avg Position = Average finishing position (lower is better)
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`px-3 py-2 font-bold ${className}`} style={{ whiteSpace: "nowrap" }}>
      {children}
    </th>
  );
}

function Td({ children, strong = false, right = false }) {
  return (
    <td
      className={`px-3 py-2 ${strong ? "font-extrabold" : ""} ${right ? "text-right" : ""}`}
      style={{ whiteSpace: "nowrap" }}
    >
      {children}
    </td>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="opacity-90">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function safeAvg(sum, count) {
  if (!count) return NaN;
  return sum / count;
}
function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n);
}
