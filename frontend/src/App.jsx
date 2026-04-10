import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import MedicalOrganizer from './pages/MedicalOrganizer';
import MedicalExtractor from './pages/MedicalExtractor';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function NavBar() {
  const [qaStatus, setQaStatus] = useState({ hasData: false, count: 0, pendientesCount: 0 });

  useEffect(() => {
    const check = () => {
      fetch(`${API_BASE}/api/qa-status`)
        .then(res => res.json())
        .then(data => setQaStatus(data))
        .catch(() => {});
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="global-navbar">
      <div className="navbar-logo">
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem', marginLeft: '1rem' }}>AI CORE</span>
      </div>
      <div className="navbar-links">
        <NavLink
          to="/organizer"
          className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
        >
          📁 Medical Organizer
        </NavLink>
        <NavLink
          to="/extractor"
          className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          style={{ position: 'relative' }}
        >
          ⚡ Medical Extractor
          {qaStatus.hasData && (
            <span className="qa-badge-pulse">
              {qaStatus.count}
            </span>
          )}
        </NavLink>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div className="global-layout">
        <NavBar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<MedicalOrganizer />} />
            <Route path="/organizer" element={<MedicalOrganizer />} />
            <Route path="/extractor" element={<MedicalExtractor />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
