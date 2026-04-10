<p align="center">
  <h1 align="center">🏥 MedLegal Organizer AI</h1>
  <p align="center">
    <strong>Intelligent Medical Document Processing Platform</strong><br>
    Automated extraction, classification, and forensic analysis of medical records and billing documents using Google Gemini AI.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v20+-339933?logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-v5-000000?logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/React-v19-61DAFB?logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-v8-646CFF?logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Google_Gemini-AI-4285F4?logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/License-ISC-blue" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [AI Pipeline](#-ai-pipeline)
- [Quality Control System](#-quality-control-system)

---

## 🔍 Overview

**MedLegal Organizer AI** is an end-to-end platform designed for law firms and medical-legal professionals that need to process, classify, and extract structured data from large batches of medical documents (PDFs, images). The system leverages **Google Gemini's multimodal capabilities** to automatically identify document types, extract patient information, dates of service, billing amounts, provider details, and detect potential intruders (documents belonging to other patients).

The platform supports processing **batches of 30+ documents simultaneously**, with real-time streaming progress, post-extraction validation, and built-in quality control through double-pass AI verification.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI-Powered Extraction** | Uses Google Gemini (Flash/Pro/Lite) with chain-of-thought reasoning to extract structured data from any medical document or bill |
| 📂 **Batch Processing** | Process entire folders of PDFs/images in a single operation with real-time streaming logs |
| 🔍 **Quality Control (QC)** | Optional double-pass extraction with side-by-side comparison to detect discrepancies |
| 🛡️ **Intruder Detection** | Automatically flags documents that don't belong to the case owner using fuzzy name matching (Dice coefficient) |
| ✅ **Post-AI Validation** | 6-rule validation pipeline: data normalization, DOL detection, fuzzy matching, date validation, and anomaly detection |
| 📄 **Page-Specific Rescan** | Re-analyze specific pages of a document (e.g., `1-5`, `3,7,12`) for targeted extraction |
| 📊 **Excel Export** | One-click export of organized data per batch with structured sheets |
| 🗑️ **Trash & Recovery** | Soft-delete with restoration capability for accidentally removed documents |
| ⏱️ **Real-Time Timer** | Live elapsed timer during AI processing for better workflow visibility |
| 🚨 **Pending Review Queue** | Smart triage system that separates clean extractions from those requiring human review |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                    FRONTEND (React 19)               │
│         Vite 8 • React Router • React Select         │
│                                                      │
│  ┌───────────────┐  ┌─────────────────────────────┐  │
│  │   Organizer   │  │        Extractor             │  │
│  │  (Batch Mode) │  │  (Forensic Analysis Mode)    │  │
│  └───────┬───────┘  └──────────────┬──────────────┘  │
└──────────┼─────────────────────────┼─────────────────┘
           │   HTTP / Streaming      │
┌──────────┼─────────────────────────┼─────────────────┐
│          ▼         BACKEND (Express 5)               │
│  ┌───────────────────────────────────────────────┐   │
│  │              REST API Layer                    │   │
│  │   Upload • Rescan • Assign • Delete • Export   │   │
│  └──────────────────┬────────────────────────────┘   │
│                     │                                │
│  ┌──────────┐ ┌─────┴──────┐ ┌───────────┐ ┌──────┐│
│  │ Gemini   │ │ Validation │ │  Master   │ │Excel ││
│  │ Service  │ │  Service   │ │  Service  │ │Svc   ││
│  │(AI Core) │ │(Post-proc) │ │(Data/CRUD)│ │      ││
│  └────┬─────┘ └────────────┘ └───────────┘ └──────┘│
│       │                                             │
│       ▼                                             │
│  Google Gemini API (Flash / Pro / Lite)              │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 20+ | Runtime environment |
| **Express** | 5.2 | REST API framework |
| **@google/genai** | 1.49 | Google Gemini AI SDK with structured schema output |
| **Multer** | 2.1 | Multipart file upload handling |
| **ExcelJS** | 4.4 | Professional Excel report generation |
| **dotenv** | 17.4 | Environment variable management |
| **CORS** | 2.8 | Cross-origin resource sharing |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.2 | UI framework with hooks |
| **Vite** | 8.0 | Build tool and dev server |
| **React Router DOM** | 7.14 | Client-side routing |
| **React Select** | 5.10 | Advanced select/dropdown component |
| **Vanilla CSS** | — | Custom dark theme with glassmorphism design |

### AI & Processing
| Component | Details |
|----------|---------|
| **Model** | Gemini 3 Flash Preview (default), 3.1 Pro, 3.1 Flash Lite |
| **Configuration** | Deterministic: `temperature: 0.0`, `topP: 0.1`, `topK: 1` |
| **Output** | Enforced JSON Schema via `responseMimeType: application/json` |
| **Reasoning** | Chain-of-thought with mandatory `_reasoning` field |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20.0
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/medlegal-organizer-ai.git
cd medlegal-organizer-ai

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Environment Setup

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Running the Application

```bash
# Terminal 1 — Start Backend (port 3000)
npm start

# Terminal 2 — Start Frontend (port 5173)
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 📡 API Reference

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Process batch of documents with AI extraction |
| `POST` | `/api/rescan-document` | Re-analyze a specific document (supports page targeting) |
| `POST` | `/api/assign-pendiente` | Assign a pending document to a batch (supports QC run selection) |
| `DELETE` | `/api/pendiente` | Permanently delete a pending document |
| `DELETE` | `/api/records` | Remove a document from a batch |
| `POST` | `/api/restore-record` | Restore a document from trash |
| `GET` | `/api/lotes` | List all available batches |
| `GET` | `/api/lote-documents` | Get documents for a specific batch |
| `GET` | `/api/pendientes` | Get all documents pending review |
| `GET` | `/api/download` | Export batch data as Excel file |
| `GET` | `/api/documents/:filename` | Serve original document for preview |
| `POST` | `/api/cancel` | Cancel an in-progress batch operation |
| `DELETE` | `/api/reset-db` | Reset the entire database |

### Upload Parameters

```json
{
  "files": "[multipart files]",
  "officialClientName": "JOHN DOE",
  "officialDol": "05/06/2024",
  "aiModel": "gemini-3-flash-preview",
  "enableQC": true
}
```

### Rescan with Page Focus

```json
{
  "archivoOrigen": "document.pdf",
  "nombre": "JOHN DOE",
  "dol": "05/06/2024",
  "pages": "1-3,5,8"
}
```

---

## 📁 Project Structure

```
medlegal-organizer-ai/
│
├── server.js                          # Express API server (main entry)
├── index.js                           # Alternative entry point
├── package.json                       # Backend dependencies
├── .env                               # API keys (not committed)
│
├── src/
│   └── services/
│       ├── gemini.service.js          # Gemini AI integration (prompts, schemas, extraction)
│       ├── validation.service.js      # Post-AI validation (6 rules + QC comparison)
│       ├── master.service.js          # Data persistence layer (JSON-based CRUD)
│       └── excel.service.js           # Excel export generation
│
├── output/                            # Persistent data storage (JSON DB)
│
└── frontend/
    ├── package.json                   # Frontend dependencies
    ├── vite.config.js                 # Vite configuration
    ├── index.html                     # SPA entry point
    │
    └── src/
        ├── main.jsx                   # React root
        ├── App.jsx                    # Router configuration
        ├── index.css                  # Global styles (dark theme)
        │
        └── pages/
            ├── MedicalOrganizer.jsx   # Main workspace: batch processing + review
            └── MedicalExtractor.jsx   # Forensic analysis: deep document examination
```

---

## 🤖 AI Pipeline

### Extraction Flow

```
PDF/Image → Base64 Encoding → Gemini API
                                   │
                    ┌──────────────┘
                    ▼
         Chain-of-Thought Reasoning
         ├── Step 1: Find Patient Name
         ├── Step 2: Find Date of Loss
         ├── Step 3: Classify (Record vs Bill)
         ├── Step 4: Find Doctor/Provider
         └── Step 5: Extract Line Items
                    │
                    ▼
         JSON Schema Enforcement
         (Type-safe, mandatory fields)
                    │
                    ▼
         ValidationService (6 Rules)
         ├── R1: Unwrap nested arrays
         ├── R2: Normalize monetary amounts
         ├── R3: DOL missing detection
         ├── R4: Fuzzy name matching (Dice coefficient)
         ├── R5: Date range validation
         └── R6: Line items integrity check
                    │
                    ▼
         Classification Engine
         ├── Clean → Auto-save to batch
         └── Flagged → Pending review queue
```

### Deterministic Configuration

The AI is configured for **maximum reproducibility**:

```javascript
{
  temperature: 0.0,    // Zero randomness
  topP: 0.1,          // Minimal nucleus sampling
  topK: 1,            // Single token selection
  responseMimeType: 'application/json',
  responseSchema: ORGANIZER_SCHEMA  // Enforced JSON structure
}
```

---

## 🔍 Quality Control System

When **QC mode** is enabled, each document is processed **twice** independently:

```
Document ──┬──→ Run 1 (Extraction) ──┐
           │                          ├── Compare ──→ Consistent? ──→ ✅ Auto-approve
           └──→ Run 2 (Extraction) ──┘                     │
                                                    Discrepancies?
                                                           │
                                                           ▼
                                                  Pending Review
                                              ┌─────────────────────┐
                                              │  R1: DOL 2024-05-06 │
                                              │  R2: Sin Fecha      │
                                              │                     │
                                              │  [✅ R1] [✅ R2]    │
                                              └─────────────────────┘
```

### Comparison Logic

| Field | Method | Threshold |
|-------|--------|-----------|
| Document Type | Exact match | — |
| Client Name | Dice coefficient | ≥ 85% |
| Date of Loss | Exact match | — |
| Provider/Sender | Dice coefficient | ≥ 80% |
| Line Item Count | Exact match | — |
| Dates per line | Exact match | — |
| Doctor per line | Dice coefficient | ≥ 80% |
| Amounts per line | Exact numeric | — |
| Procedures | *Excluded* | *(Natural paraphrase variance)* |

---

## 📜 License

This project is licensed under the **ISC License**.

---

<p align="center">
  <sub>Built with ❤️ using Google Gemini AI • Node.js • React</sub>
</p>
