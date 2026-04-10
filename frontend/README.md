<p align="center">
  <h1 align="center">🖥️ MedLegal Organizer — Frontend</h1>
  <p align="center">
    <strong>Modern React 19 interface for AI-powered medical document management</strong>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/React_Router-7.14-CA4245?logo=reactrouter&logoColor=white" />
  <img src="https://img.shields.io/badge/CSS-Dark_Theme-1572B6?logo=css3&logoColor=white" />
</p>

---

## 📋 Overview

This is the **frontend application** for the MedLegal Organizer AI platform. It provides a dark-themed, responsive interface for managing medical document batches, reviewing AI extraction results, and performing quality control operations.

> **Note:** This frontend requires the [backend server](../README.md) running on `http://localhost:3000`.

---

## ✨ Features

### Medical Organizer (`/`)
The primary workspace for batch document processing:

- **📂 Drag & Drop Upload** — Drop entire folders or individual PDFs/images
- **🛡️ Batch Profiling** — Set official client name, DOL, and AI model per batch
- **🔍 QC Mode Toggle** — Enable double-pass AI verification with discrepancy comparison
- **⏱️ Live Timer** — Elapsed time counter during AI processing
- **📡 Real-Time Terminal** — Streaming log output from the backend AI pipeline
- **⚠️ Smart Triage** — Pending documents with dual-row QC view (R1 vs R2)
- **📊 Split Tables** — Separate views for Medical Records and Bills
- **📄 Page-Specific Rescan** — Re-analyze specific pages with range input (`1-5,8,12`)
- **🗑️ Trash & Recovery** — Soft-delete with undo capability
- **📥 Excel Export** — One-click download with duplicate safety check

### Medical Extractor (`/extractor`)
Deep forensic analysis mode for individual document examination.

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.2.4 | UI framework (functional components + hooks) |
| **Vite** | 8.0.4 | Lightning-fast build tool and HMR dev server |
| **React Router DOM** | 7.14.0 | Client-side SPA routing |
| **React Select** | 5.10.2 | Searchable dropdown for batch selection |
| **Vanilla CSS** | — | Custom dark theme with glassmorphism and gradients |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 20.0
- Backend server running on port 3000 (see [root README](../README.md))

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens at **http://localhost:5173** with hot module replacement.

### Production Build

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
frontend/
├── index.html                    # SPA entry point
├── vite.config.js                # Vite configuration (React plugin)
├── package.json                  # Dependencies and scripts
├── eslint.config.js              # ESLint configuration
│
├── public/                       # Static assets
│
├── dist/                         # Production build output
│
└── src/
    ├── main.jsx                  # React DOM root mount
    ├── App.jsx                   # Router + route definitions
    ├── index.css                 # Global styles (design system)
    │
    ├── assets/                   # Images, icons, fonts
    │
    └── pages/
        ├── MedicalOrganizer.jsx  # Main batch workspace (1000+ lines)
        └── MedicalExtractor.jsx  # Forensic deep-analysis view
```

---

## 🎨 Design System

The UI uses a **custom dark theme** with the following design tokens:

```css
--bg:          #0a0a0f          /* Deep dark background */
--surface:     #12121a          /* Card/panel surface */
--accent:      #00d2ff          /* Primary accent (cyan) */
--text:        #e0e0e6          /* Primary text */
--text-muted:  #8b8d99          /* Secondary text */
--danger:      #ff0044          /* Error/delete actions */
--warning:     #ff9800          /* Warning/attention */
--success:     #00c853          /* Success indicators */
--purple:      #8a2be2          /* QC/special actions */
```

### UI Patterns Used
- **Glassmorphism** — Semi-transparent surfaces with blur
- **Gradient Borders** — Animated gradient strokes on interactive elements
- **Streaming Terminal** — Retro-styled log viewer with blinking cursor
- **Responsive Tables** — Fixed-layout tables with overflow handling
- **Badge System** — Color-coded indicators (🟢 ≥70%, 🟡 40-69%, 🔴 <40%)
- **Dual-Row QC View** — Side-by-side comparison for discrepancy review

---

## 🔌 API Integration

The frontend communicates with the backend through the following patterns:

### Streaming (Upload)
```javascript
// Server-Sent Events via chunked transfer encoding
const response = await fetch('/api/upload', { method: 'POST', body: formData });
const reader = response.body.getReader();
// Progressive log parsing...
```

### REST (CRUD)
```javascript
// Standard JSON API calls
await fetch('/api/assign-pendiente', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ pendienteIndex, nombre, dol, selectedRun })
});
```

---

## 📦 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start Vite dev server with HMR |
| `build` | `npm run build` | Create production build |
| `preview` | `npm run preview` | Preview production build locally |
| `lint` | `npm run lint` | Run ESLint checks |

---

## 📜 License

This project is part of [MedLegal Organizer AI](../README.md). Licensed under **ISC License**.
