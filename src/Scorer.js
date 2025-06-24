import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Scorer() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedPlayers = location.state?.selectedPlayers || [];

  if (selectedPlayers.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#B6B4DC] text-white font-poppins text-center px-6">
        <div>
          <p className="text-xl mb-4">No players selected.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-white text-[#9C99C7] font-bold px-4 py-2 rounded-lg shadow-md"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#B6B4DC] text-white font-poppins p-4">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2">
          <thead>
            <tr>
              <th className="text-left text-xl px-4 py-2">🂡</th>
              {selectedPlayers.map((name, index) => (
                <th key={index} className="text-left text-xl px-4 py-2">
                  {name.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2 text-white font-bold">Score</td>
              {selectedPlayers.map((_, index) => (
                <td key={index} className="px-4 py-2 bg-[#F8EEE0] rounded text-[#6C6A9A] text-center font-semibold">
                  —
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
