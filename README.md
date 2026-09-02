# RESPONDE

> **Real-Time Disaster Intake & Geospatial Analytics System**  
> Capstone Project — Bachelor of Science in Information Technology  
> Batangas State University (BSU)

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)

---

## Overview

**RESPONDE** is a disaster response command center dashboard built for **Talisay Municipal Disaster Risk Reduction and Management Office (MDRRMO)** in Batangas, Philippines. It consolidates real-time incident reports from Facebook Messenger bots and scrapers, processes them through an NLP pipeline, and presents actionable intelligence through an interactive geospatial map and analytics dashboard.

The system supports **Tagalog**, **Batangueño**, and **English** for natural language understanding, making it accessible to local communities during emergencies.

---

## Features

### Core Modules

| Module | Description |
|--------|-------------|
| **Dashboard** | Real-time KPI cards, Talisay heat map, Messenger bot & scraper activity feeds with click-to-detail modals |
| **Incident Reports** | Full officer verification pipeline with editable review modal, checklist, rejection reasons, bulk actions, and pagination |
| **Messenger Bot Logs** | Split-pane chat UI with PSID-based session grouping, real-time polling (30s), and staggered message animations |
| **Scraper Feed** | Facebook comment monitoring with NLP entity extraction, confidence scoring, and status management |
| **Geospatial Map** | Interactive map consuming only *verified* incidents with coordinate pins (Leaflet + PostGIS) |
| **Analytics** | Charts and statistical reports on incident trends and response metrics |
| **Settings** | Dark mode toggle, auto-refresh intervals, notification preferences, user management |

### Incident Verification Pipeline

```
Incoming (Bot/Scraper)
    │
    ▼
[PENDING] ── officer hasn't reviewed yet
    │
    ▼
[UNDER REVIEW] ── officer opened, possibly editing
    │
    ├─→ [VERIFIED] ── confirmed real → plots on Geospatial Map
    └─→ [REJECTED] ── fake/spam/outside jurisdiction
              │
              ▼
         [RESOLVED] ── team responded, incident closed
```

### Key Capabilities

- **Officer Review & Edit** — Officers can correct NLP mistakes (barangay, type, urgency, coordinates, landmark) while preserving the original raw text
- **Verification Checklist** — 5-point checklist before an incident can be verified and plotted on the map
- **Rejection Reasons** — Structured rejection with enum reasons: `spam_or_fake`, `duplicate`, `outside_jurisdiction`, `not_disaster_related`, `insufficient_info`
- **Bulk Actions** — Multi-select rows to start review, mark resolved, or restore to pending
- **Duplicate Detection** — Simple heuristic warning when same barangay + type appears within 30 minutes
- **Dark / Light Mode** — Fully themeable UI with system preference detection and gradient backgrounds
- **Collapsible Sidebar** — 240px expanded / 89px compact mode with hamburger toggle and active pill indicator
- **Smooth Animations** — Framer Motion page transitions, staggered list entrances, modal scale animations, and button press feedback (`active:scale-[0.97]`)
- **Real-time Data** — Auto-refresh with polling intervals; optimistic UI updates with rollback on error
- **Toast Notifications** — Slide-in feedback for verify, reject, save, and error states
- **Hidden Scrollbars** — Clean UI with functional scrolling (mouse wheel / trackpad) but no visible scrollbars
- **Multi-language NLP** — BERT/spaCy pipeline for Tagalog, Batangueño, and English entity extraction
- **Sector Classification** — Automatic categorization into Search & Rescue, Medical, Food & Water, Infrastructure

---

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| [React 19](https://react.dev) | UI library |
| [TypeScript](https://www.typescriptlang.org) | Type safety |
| [Vite](https://vitejs.dev) | Build tool & dev server |
| [Tailwind CSS v4](https://tailwindcss.com) | Utility-first styling (`@import tailwindcss`) |
| [React Router v7](https://reactrouter.com) | Client-side routing |
| [Framer Motion](https://www.framer.com/motion/) | Page transitions, staggered animations, modals |
| [Supabase JS](https://supabase.com/docs/reference/javascript) | Real-time database client |
| [Lucide React](https://lucide.dev) | Icon library |

### Backend

| Technology | Purpose |
|------------|---------|
| [FastAPI](https://fastapi.tiangolo.com) | Python async web framework |
| [PostgreSQL](https://www.postgresql.org) + [PostGIS](https://postgis.net) | Database with geospatial extensions |
| [BERT](https://huggingface.co/docs/transformers/model_doc/bert) / [spaCy](https://spacy.io) | NLP for entity extraction & intent classification |
| [Facebook Graph API](https://developers.facebook.com/docs/graph-api) | Messenger bot & page scraper integration |

---

## Project Structure

```
responde-frontend-reactjs/
├── public/
│   └── Responde_logo.png          # Application logo
├── src/
│   ├── components/
│   │   ├── Layout.tsx             # Main shell (sidebar + header + page transitions)
│   │   ├── ThemeContent.tsx       # Dark/light mode context provider
│   │   ├── DatePicker.tsx         # Custom date picker component
│   │   ├── DropDown.tsx           # Reusable filter dropdown
│   │   ├── Stagger.tsx            # StaggerContainer & StaggerItem animation wrappers
│   │   └── Transition.tsx         # Page transition wrapper (AnimatePresence)
│   ├── pages/
│   │   ├── Dashboard.tsx          # Overview, heat map, bot/scraper feeds
│   │   ├── IncidentReports.tsx    # Verification pipeline table & review modal
│   │   ├── MessengerBotLogs.tsx   # Chat-style conversation viewer with polling
│   │   ├── ScraperFeed.tsx        # Facebook scraper feed with NLP extraction
│   │   ├── GeospatialMap.tsx      # Leaflet map (verified incidents only)
│   │   ├── Analytics.tsx          # Charts & reports
│   │   ├── Settings.tsx           # System preferences & user management
│   │   └── Login.tsx              # Authentication screen
│   ├── lib/
│   │   └── supabaseClient.ts      # Supabase client initialization
│   ├── App.tsx                    # Route definitions with Transition wrapper
│   ├── main.tsx                   # Entry point (ThemeProvider wrapper)
│   └── index.css                  # Tailwind v4 directives + custom scrollbar hide
├── index.html
├── package.json
├── tsconfig.json
└── README.md
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18.0 or higher
- [npm](https://www.npmjs.com) (or yarn / pnpm)
- A [Supabase](https://supabase.com) project with API credentials

### Step-by-Step Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/samsonjeff/responde-frontend-reactjs.git
cd responde-frontend-reactjs
```

#### 2. Install Dependencies

```bash
npm install
```

> **Key dependencies:**
> - `@supabase/supabase-js` — Database client & auth
> - `react` & `react-dom` (v19)
> - `react-router-dom` (v7)
> - `tailwindcss` (v4) & `@tailwindcss/vite`
> - `framer-motion` — Animations
> - `leaflet` & `react-leaflet` — Geospatial mapping
> - `lucide-react` — Icons

#### 3. Configure Environment Variables

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

Fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=""
VITE_SUPABASE_ANON_KEY=""
```

> All Vite env variables must be prefixed with `VITE_` to be accessible in frontend code.

#### 4. Start the Dev Server

```bash
npm run dev
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run debug` | Dev server with verbose Vite logging |
| `npm run typecheck` | TypeScript validation (`tsc --noEmit`) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint check |

---

## Database Schema Notes

The frontend expects the following Supabase tables:

| Table | Purpose |
|-------|---------|
| `conversations` | Messenger bot messages (`sender_psid`, `sender_name`, `user_message`, `ai_reply`, `timestamp`) |
| `fb_comments` | Scraped Facebook comments (`comment_text`, `user_name`, `barangay`, `incident_type`, `created_at`, `status`) |

For the **Incident Reports** verification workflow, the backend should support:
- `status` enum: `pending`, `under_review`, `verified`, `rejected`, `resolved`
- Officer-editable fields: `barangay`, `type`, `urgency`, `coordinates`, `landmark`, `description`
- Auto-tracked fields: `original_text`, `source`, `reported_at`, `reporter_name`, `verified_by`, `verified_at`, `rejection_reason`

---

## UI/UX Design Notes

- **Tailwind v4** syntax: `@import tailwindcss`, `@custom-variant dark`
- **Dark mode** toggled via `ThemeContext` with `dark:` variants throughout
- **Light background gradient**: `113deg #fff → #f1f5ff → #e5ebff → #e3eaff`
- **Animation easing**: Strong ease-out `[0.23, 1, 0.32, 1]` for UI interactions; no animation on high-frequency actions (tab switching)
- **Modal pattern**: `scale(0.96)` at 250ms with backdrop blur; sections stagger in at 50ms
- **Scrollbars**: Hidden globally via CSS while preserving scroll functionality

---

## Contributors

| Role | Name |
|------|------|
| Frontend & UI/UX | Rochelle Samson |
| Backend & PostGIS | Jefferson Samson |

---

<p align="center">
  <strong>RESPONDE</strong> — Real-Time Disaster Intelligence for Talisay, Batangas
</p>
