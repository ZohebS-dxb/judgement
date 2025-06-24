import React, { useState } from 'react';
import { database, ref, get, set, update } from './firebase';
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
    if (selectedPlayers.includes(name)) {
      setSelectedPlayers(selectedPlayers.filter(p => p !== name));
    } else if (selectedPlayers.length < 6) {
      setSelectedPlayers([...selectedPlayers, name]);
    }
  };

  const isSelected = (name) => selectedPlayers.includes(name);

const handleStartGame = async () => {
  try {
    console.log("Selected players:", selectedPlayers);

    for (const name of selectedPlayers) {
      const playerRef = ref(database, `judgementplayers/${name}`);
      const snapshot = await get(playerRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        await update(playerRef, {
          gamesPlayed: (data.gamesPlayed || 0) + 1
        });
      } else {
        await set(playerRef, {
          gamesPlayed: 1,
          gamesWon: 0,
          gamesLastPlace: 0,
          podiums: 0
        });
      }
    }

    console.log("Navigating to scorer...");
    navigate('/scorer', { state: { selectedPlayers } });

  } catch (error) {
    console.error("🔥 Error in handleStartGame:", error);
  }
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
          className="w-full bg-[#9C99C7] text-white font-bold py-3 rounded-xl shadow-md"
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
