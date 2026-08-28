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
| **Dashboard** | Real-time KPI cards, heat map visualization, bot & scraper activity feeds |
| **Incident Reports** | Filterable, sortable table with multi-select, date range picker, urgency badges |
| **Messenger Bot Logs** | Split-pane chat UI showing full conversation history with citizens |
| **Scraper Feed** | Facebook page comment monitoring for disaster-related posts |
| **Geospatial Map** | Interactive Leaflet map for incident location tracking across barangays |
| **Analytics** | Charts and statistical reports on incident trends and response metrics |
| **Settings** | Dark mode toggle, auto-refresh intervals, notification preferences, user management |

### Key Capabilities

- **Dark / Light Mode** — Fully themeable UI with system preference detection
- **Collapsible Sidebar** — TailAdmin-inspired navigation with icon-only compact mode
- **Responsive Design** — Mobile-first layout that adapts from phones to desktop monitors
- **Real-time Data** — Auto-refresh with configurable intervals (10s to 5min)
- **Multi-language NLP** — BERT/spaCy pipeline for Tagalog, Batangueño, and English
- **Sector Classification** — Automatic categorization into Search & Rescue, Medical, Food/Water, Infrastructure

---

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| [React 19](https://react.dev) | UI library |
| [TypeScript](https://www.typescriptlang.org) | Type safety |
| [Vite](https://vitejs.dev) | Build tool & dev server |
| [Tailwind CSS v4](https://tailwindcss.com) | Utility-first styling |
| [React Router v7](https://reactrouter.com) | Client-side routing |
| [Supabase JS](https://supabase.com/docs/reference/javascript) | Real-time database & client |
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
│   │   ├── Layout.tsx             # Main shell (sidebar + header)
│   │   ├── ThemeContent.tsx       # Dark/light mode context provider
│   │   └── DatePicker.tsx         # Custom date picker component
│   ├── pages/
│   │   ├── Dashboard.tsx          # Overview & heat map
│   │   ├── IncidentReports.tsx    # Incident table with filters
│   │   ├── MessengerBotLogs.tsx   # Chat-style conversation viewer
│   │   ├── ScraperFeed.tsx        # Facebook scraper feed
│   │   ├── GeospatialMap.tsx      # Leaflet map integration
│   │   ├── Analytics.tsx          # Charts & reports
│   │   ├── Settings.tsx           # System preferences & user management
│   │   └── Login.tsx              # Authentication screen
│   ├── App.tsx                    # Route definitions
│   ├── main.tsx                   # Entry point (ThemeProvider wrapper)
│   └── index.css                  # Tailwind v4 directives + custom variants
├── index.html
├── package.json
├── tsconfig.json
└── README.md
```

---

## Getting Started & Setup Guide

### Prerequisites

- [Node.js](https://nodejs.org) 18.0 or higher
- [npm](https://www.npmjs.com) (or yarn / pnpm)
- A [Supabase](https://supabase.com) project with API credentials

---

### Step-by-Step Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/samsonjeff/responde-frontend-reactjs.git
cd responde-frontend-reactjs
```

#### 2. Package Installation

Install all required dependencies using `npm`:

```bash
npm install
```

> **Key dependencies installed:**
> - `@supabase/supabase-js` — Database client & authentication
> - `react` & `react-dom` (v19) — Core UI framework
> - `react-router-dom` (v7) — Page routing
> - `tailwindcss` (v4) & `@tailwindcss/vite` — Styling
> - `leaflet` & `react-leaflet` — Geospatial mapping
> - `framer-motion` & `lucide-react` — UI animations & icons

#### 3. Environment Variables Configuration

Copy the example environment file to create your local `.env` file:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS / Linux (Bash)
cp .env.example .env
```

Open `.env` and fill in your Supabase project credentials:

```env
# Supabase Configuration (Frontend - Vite)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
```

> [!NOTE]
> - **`VITE_SUPABASE_URL`**: Found under your Supabase Dashboard → **Project Settings** → **API** → **Project URL**.
> - **`VITE_SUPABASE_ANON_KEY`**: Found under **Project Settings** → **API** → **Project API Keys** (`anon` / `public` or `sb_publishable_...`).
> - All variables used by Vite must be prefixed with `VITE_` to be accessible in frontend code.

#### 4. Run the Development Server

```bash
npm run dev
```

The application will start locally at:
👉 **`http://localhost:5173`**

---

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts the Vite development server with HMR |
| `npm run debug` | Runs the dev server with verbose Vite debug logging |
| `npm run typecheck` | Validates TypeScript types across the project (`tsc --noEmit`) |
| `npm run build` | Compiles TypeScript and builds production assets in `dist/` |
| `npm run preview` | Locally preview the production build |
| `npm run lint` | Runs ESLint to identify code style and syntax issues |

---

## Screenshots

| Light Mode | Dark Mode |
|------------|-----------|
| ![Dashboard Light](docs/screenshots/dashboard-light.png) | ![Dashboard Dark](docs/screenshots/dashboard-dark.png) |

---


<p align="center">
  <strong>RESPONDE</strong> — Real-Time Disaster Intelligence for Talisay, Batangas
</p>
