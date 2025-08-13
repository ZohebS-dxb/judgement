import React from "react";
import { Routes, Route } from "react-router-dom";
import PlayerSelectStep1 from "./components/PlayerSelectStep1";
import CallsStep2 from "./pages/CallsStep2";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PlayerSelectStep1 />} />
      <Route path="/calls" element={<CallsStep2 />} />
    </Routes>
  );
}
