import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PlayerSelection from './PlayerSelection';
import Scorer from './Scorer';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PlayerSelection />} />
        <Route path="/scorer" element={<Scorer />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
