// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import PlayerSelectStep1 from "./components/PlayerSelectStep1"; // ← your original landing
import CallsStep2 from "./pages/CallsStep2";
import Stats from "./pages/Stats";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PlayerSelectStep1 />} />
      <Route path="/calls" element={<CallsStep2 />} />
      <Route path="/stats" element={<Stats />} />
    </Routes>
  );
}
