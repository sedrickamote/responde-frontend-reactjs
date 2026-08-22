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

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/responde-frontend-reactjs.git
cd responde-frontend-reactjs

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
```

Output will be generated in the `dist/` directory.

---

## Environment Variables

Create a `.env` file in the project root if you need to configure API endpoints:

```env
VITE_API_BASE_URL=http://localhost:8000
```

> **Note:** Never commit `.env` files containing secrets to version control.

---

## Screenshots

| Light Mode | Dark Mode |
|------------|-----------|
| ![Dashboard Light](docs/screenshots/dashboard-light.png) | ![Dashboard Dark](docs/screenshots/dashboard-dark.png) |

---

## Team

| Role | Name |
|------|------|
| **Frontend Developer** | Rochelle |
| **Backend Developer** | Jefferson Samson |
| **Adviser** | *[Your Capstone Adviser]* |

**Institution:** Batangas State University (BSU)  
**Program:** Bachelor of Science in Information Technology

---

## Acknowledgments

- Talisay MDRRMO for the opportunity to build a system that serves the community
- Batangas State University — College of Informatics and Computing Sciences

---

## License

This project is developed for academic purposes as part of the BSU Capstone requirements.

---

<p align="center">
  <strong>RESPONDE</strong> — Real-Time Disaster Intelligence for Talisay, Batangas
</p>
