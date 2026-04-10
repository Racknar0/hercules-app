import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import MedicalOrganizer from './pages/MedicalOrganizer';
import MedicalExtractor from './pages/MedicalExtractor';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function NavBar() {
  const [qaStatus, setQaStatus] = useState({ hasData: false, count: 0, pendientesCount: 0 });
  const [connStatus, setConnStatus] = useState(null); // null=not tested, 'ok', 'error'

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

  const testConnection = async () => {
    setConnStatus('testing');
    const targetUrl = `${API_BASE}/api/health`;
    try {
      const t0 = Date.now();
      const res = await fetch(targetUrl);
      const latency = Date.now() - t0;
      const data = await res.json();
      setConnStatus('ok');
      alert(
        `✅ CONEXIÓN OK (${latency}ms)\n\n` +
        `🔗 API_BASE: ${API_BASE || '(vacío)'}\n` +
        `📡 URL probada: ${targetUrl}\n` +
        `⏱️ Uptime: ${data.uptime}\n` +
        `🖥️ Node: ${data.node} (${data.platform})\n` +
        `🧠 Memoria: ${data.memory.heap} RSS:${data.memory.rss}\n` +
        `🔑 Gemini Key: ${data.env.GEMINI_API_KEY}\n` +
        `📂 Docs en caché: ${data.data.tempDocs}\n` +
        `💾 DB: ${data.data.dbExists ? `${data.data.dbSizeKB}KB, ${data.data.lotes} lotes` : 'No existe'}\n` +
        `🌐 Origin detectado: ${data.requestOrigin}`
      );
    } catch (err) {
      setConnStatus('error');
      alert(
        `❌ CONEXIÓN FALLIDA\n\n` +
        `🔗 API_BASE: ${API_BASE || '(vacío → fallback localhost:3000)'}\n` +
        `📡 URL probada: ${targetUrl}\n` +
        `💥 Error: ${err.message}\n\n` +
        `POSIBLES CAUSAS:\n` +
        `• VITE_API_URL vacía o incorrecta en .env.production\n` +
        `• Backend no corriendo (PM2: pm2 status)\n` +
        `• Puerto 3000 bloqueado por firewall\n` +
        `• CORS no habilitado en el server`
      );
    }
  };

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
        <button
          onClick={testConnection}
          style={{
            background: connStatus === 'ok' ? 'rgba(0,200,83,0.3)' : connStatus === 'error' ? 'rgba(255,0,68,0.3)' : 'rgba(255,255,255,0.1)',
            color: connStatus === 'ok' ? '#00c853' : connStatus === 'error' ? '#ff4d4d' : '#8b8d99',
            border: `1px solid ${connStatus === 'ok' ? '#00c853' : connStatus === 'error' ? '#ff4d4d' : 'rgba(255,255,255,0.2)'}`,
            borderRadius: '8px',
            padding: '4px 10px',
            fontSize: '0.7rem',
            cursor: 'pointer',
            marginLeft: '8px',
            transition: 'all 0.2s',
          }}
          title={`Test API: ${API_BASE || 'localhost:3000'}`}
        >
          {connStatus === 'testing' ? '⏳' : connStatus === 'ok' ? '🟢' : connStatus === 'error' ? '🔴' : '🔌'} API
        </button>
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
