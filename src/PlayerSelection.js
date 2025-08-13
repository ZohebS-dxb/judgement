// src/pages/PlayerSelection.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const players = [
  'Zo', 'Divya',
  'Ashu', 'Saurabh',
  'Ashish', 'Sid',
  'Anas', 'Kritika',
  'Neha', 'Varnika',
  'Guest', 'Guest 2',
];

export default function PlayerSelection() {
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const navigate = useNavigate();

  const togglePlayer = (name) => {
    setSelectedPlayers((prev) => {
      if (prev.includes(name)) return prev.filter(p => p !== name);
      if (prev.length >= 6) return prev; // keep your max 6 rule
      return [...prev, name];
    });
  };

  const isSelected = (name) => selectedPlayers.includes(name);

  const handleStartGame = () => {
    if (selectedPlayers.length < 2) {
      alert('Pick at least 2 players to start.');
      return;
    }

    // Clear previous game state so the new game starts fresh
    try {
      localStorage.removeItem('judgement_scores');
      localStorage.removeItem('judgement_step2');
      localStorage.setItem('judgement_round', '1');
      localStorage.setItem('judgement_suitIdx', '0');
    } catch {}

    // Save selection in the shape Page 2 expects
    // (both fields set to the chosen names)
    try {
      localStorage.setItem(
        'judgement_step1',
        JSON.stringify({
          players: selectedPlayers,
          selected: selectedPlayers,
        })
      );
    } catch {}

    // Navigate to your scorer page (keeping your original route)
    navigate('/scorer', { state: { selectedPlayers } });
  };

  return (
    <div className="min-h-screen bg-[#B6B4DC] flex flex-col items-center py-8 font-poppins">
      <h1 className="text-4xl font-extrabold text-white mb-8">JUDGEMENT</h1>

      <div className="grid grid-cols-2 gap-4 px-6">
        {players.map((name, index) => (
          <button
            key={index}
            onClick={() => togglePlayer(name)}
            className={
              "text-lg font-bold px-6 py-3 rounded-2xl shadow-md transition-colors duration-200 " +
              (isSelected(name) ? 'bg-[#9C99C7] text-white' : 'bg-[#F8EEE0] text-[#B6B4DC]')
            }
          >
            {name.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="mt-10 w-full px-6 space-y-4">
        <button
          onClick={handleStartGame}
          className="w-full bg-[#9C99C7] text-white font-bold py-3 rounded-xl shadow-md disabled:opacity-60"
          disabled={selectedPlayers.length < 2}
        >
          Start Game
        </button>
        <button className="w-full bg-[#E5E3F3] text-[#6C6A9A] font-bold py-3 rounded-xl shadow-md">
          Statistics
        </button>
      </div>
    </div>
  );
}
