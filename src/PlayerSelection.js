import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PlayerSelectStep1() {
  // Brand / colors (your swapped palette)
  const brand = useMemo(
    () => ({
      bg: "#748DAE",          // page background
      chipIdle: "#6B82A4",    // unselected tiles (slightly darker than bg)
      selected: "#9ECAD6",    // selected tiles (solid)
      textPrimary: "#FFFFFF", // main text color on bg
      textSecondary: "rgba(255,255,255,0.85)",
      ringClass: "focus:outline-none focus:ring-4 focus:ring-[#9ECAD6]/45",
    }),
    []
  );

  const defaultPlayers = ["Zoheb", "Ashu", "Divya", "Saurabh", "Siddhant", "Ashish", "Anas"];
  const [players, setPlayers] = useState(defaultPlayers);
  const [selected, setSelected] = useState(() => new Set());
  const [newName, setNewName] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Load saved step1 (players + selected)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("judgement_step1") || "null");
      if (saved && Array.isArray(saved.players) && Array.isArray(saved.selected)) {
        setPlayers(saved.players);
        setSelected(new Set(saved.selected));
      }
    } catch {}
  }, []);

  // Persist step1
  useEffect(() => {
    try {
      localStorage.setItem(
        "judgement_step1",
        JSON.stringify({ players, selected: Array.from(selected) })
      );
    } catch {}
  }, [players, selected]);

  const toggleSelect = (name) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const addName = () => {
    const trimmed = newName.trim().replace(/\s+/g, " ");
    if (!trimmed) return;
    const exists = players.some((p) => p.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setNewName("");
      inputRef.current?.focus();
      return;
    }
    setPlayers((prev) => [...prev, trimmed]);
    setNewName("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const canContinue = selected.size >= 2;

  return (
    <div
      className="min-h-dvh w-full"
      style={{
        background: brand.bg,
        color: brand.textPrimary,
        fontFamily: "'Poppins', sans-serif", // ensure Poppins
      }}
    >
      <div className="mx-auto max-w-md px-4 pb-24 pt-8 sm:pt-10">
        {/* Centered title */}
        <header className="mb-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="font-extrabold leading-tight tracking-tight"
            style={{ fontSize: "2.8rem" }}
          >
            Judgement
          </motion.h1>
        </header>

        {/* Player grid (no subtext, bigger names) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          {players.map((name) => {
            const isOn = selected.has(name);
            return (
              <button
                key={name}
                onClick={() => toggleSelect(name)}
                className={`group select-none rounded-2xl px-4 py-6 text-center font-bold transition-all active:scale-[0.98] ${brand.ringClass}`}
                style={{
                  minHeight: 70,
                  background: isOn ? brand.selected : brand.chipIdle,
                  color: isOn ? "#000000" : brand.textPrimary,
                  fontSize: "1.4rem",
                }}
              >
                {name}
              </button>
            );
          })}
        </motion.div>

        {/* Add-a-name row (70/30 split so the button always fits) */}
        <section className="mt-10 mb-16 sm:mb-20">
          <div
            className="rounded-2xl border shadow-inner p-3"
            style={{
              borderColor: "rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.16)",
            }}
          >
            <label
              htmlFor="newName"
              className="mb-2 block text-xs"
              style={{ color: brand.textSecondary }}
            >
              Add another player
            </label>

            <div className="flex items-stretch gap-2">
              <input
                id="newName"
                ref={inputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addName();
                }}
                autoComplete="off"
                inputMode="text"
                placeholder="Type a name…"
                className="rounded-xl border px-4 py-3 text-[15px]"
                style={{
                  borderColor: "rgba(255,255,255,0.35)",
                  background: "rgba(255,255,255,0.9)",
                  color: "#000",
                  width: "70%", // input shrunk to keep button inside
                }}
              />
              <button
                onClick={addName}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[15px] font-semibold"
                style={{
                  background: brand.selected,
                  color: "#000",
                  width: "30%",
                }}
              >
                <Plus className="h-5 w-5" /> Add
              </button>
            </div>
          </div>
        </section>

        {/* Sticky footer */}
        <div className="sticky bottom-0 z-10 -mx-4 px-4 pb-4">
          <div
            className="rounded-2xl border p-2"
            style={{
              background: brand.bg,
              borderColor: "rgba(255,255,255,0.25)",
            }}
          >
            <div className="flex items-center justify-between px-2 py-1">
              <div className="text-sm" style={{ color: brand.textSecondary }}>
                {selected.size > 0 ? (
                  <span>
                    <span className="font-semibold">{selected.size}</span> selected
                  </span>
                ) : (
                  <span>Select at least 2 players</span>
                )}
              </div>
              <button
                disabled={!canContinue}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-[15px] font-semibold transition-all"
                style={{
                  background: canContinue ? brand.selected : "rgba(255,255,255,0.25)",
                  color: canContinue ? "#000" : brand.textSecondary,
                }}
                onClick={() => {
                  // Persist (already persisted), then go to Step 2
                  navigate("/calls");
                }}
              >
                Continue <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
