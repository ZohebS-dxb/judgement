import React from 'react';

const players = [
  'Zo', 'Divya',
  'Ashu', 'Saurabh',
  'Ashish', 'Sid',
  'Anas', 'Kritika',
  'Neha', 'Varnika',
  'Guest', 'Guest 2',
];

export default function PlayerSelection() {
  return (
    <div className="min-h-screen bg-[#B6B4DC] flex flex-col items-center py-8 font-poppins">
      <h1 className="text-4xl font-extrabold text-white mb-8">JUDGEMENT</h1>

      <div className="grid grid-cols-2 gap-4 px-6">
        {players.map((name, index) => (
          <button
            key={index}
            className="bg-[#F8EEE0] text-[#B6B4DC] text-lg font-bold px-6 py-3 rounded-2xl shadow-md"
          >
            {name.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="mt-10 w-full px-6 space-y-4">
        <button className="w-full bg-[#9C99C7] text-white font-bold py-3 rounded-xl shadow-md">
          Start Game
        </button>
        <button className="w-full bg-[#E5E3F3] text-[#6C6A9A] font-bold py-3 rounded-xl shadow-md">
          Statistics
        </button>
      </div>
    </div>
  );
}
