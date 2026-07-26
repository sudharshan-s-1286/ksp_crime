# KSP Crime Copilot Dashboard

A full-stack AI-powered crime investigation and analytics platform for the Karnataka State Police (KSP). The application combines a Python backend with a multi-agent AI pipeline and a React + TypeScript frontend dashboard for real-time crime data analysis, forecasting, and reporting.

## Features

- **Multi-Agent AI Pipeline** — Orchestrates specialized agents (crime query, analytics, forecasting, profiling, financial intelligence, network analysis, decision support, and more) for comprehensive crime investigation.
- **Crime Database** — Query and search FIR records with filters by type, district, and search terms.
- **Forecasting & Analytics** — Predictive crime forecasting with hotspot visualization and time-distribution analysis.
- **Offender Profiling** — AI-generated offender profiles based on historical crime data patterns.
- **Financial Intelligence** — Track financial transactions and hawala networks linked to criminal activity.
- **Criminal Network Analysis** — Visualize co-accused networks and syndicate connections.
- **Investigation Workspace** — Centralized workspace for managing cases, dossiers, and evidence.
- **Audit Logs** — Track all AI-generated insights and user actions for compliance.
- **Reports** — Generate PDF reports (compliance, analytics, records export) with one click.
- **Real-Time Telemetry** — Live monitoring of pipeline stages, agent metrics, and system health.

## Tech Stack

### Backend
- **Python 3** — HTTP server with multi-threaded request handling
- **FastAPI-style** custom HTTP server (`http.server`)
- **FAISS** — Vector similarity search for RAG
- **Neo4j** — Graph database for criminal network relationships
- **PostgreSQL** — Primary relational database for FIR records
- **LangChain / Anthropic SDK** — LLM integration (Gemini / Claude)
- **Pydantic** — Data validation and agent schemas
- **Sentence-Transformers** — Embedding generation

### Frontend
- **React 19** — UI components
- **TypeScript** — Type-safe development
- **Vite** — Build tool and dev server
- **TanStack React Query** — Server state management
- **Axios** — HTTP client for API communication
- **Lucide React** — Icon library
- **Oxlint** — Linting

### Testing
- **Playwright** — End-to-end testing
- **Pytest** — Python backend testing

## Project Structure

```
ksp_crime/
├── backend/                  # Python backend server
│   ├── app.py               # Main HTTP server entry point
│   ├── agents/              # AI agent modules
│   │   ├── base_agent.py
│   │   ├── analytics_agent.py
│   │   ├── crime_query_agent.py
│   │   ├── decision_support_agent.py
│   │   ├── explainability_agent.py
│   │   ├── financial_agent.py
│   │   ├── forecast_agent.py
│   │   ├── master_agent.py
│   │   ├── network_agent.py
│   │   ├── profiling_agent.py
│   │   ├── reasoning_agent.py
│   │   ├── response_agent.py
│   │   └── sociology_agent.py
│   ├── config/              # Configuration and settings
│   ├── contracts/           # Agent schemas and contracts
│   ├── db/                  # Database clients (Postgres, Neo4j, FAISS)
│   ├── orchestration/       # Pipeline, router, context manager, memory
│   ├── rag/                 # RAG retrievers (vector, graph, SQL, analytics)
│   ├── telemetry/           # Telemetry and monitoring
│   ├── tests/               # Backend tests
│   ├── utils/               # Utilities (PDF generator)
│   ├── static/              # Static HTML for the dashboard
│   └── requirements.txt     # Python dependencies
├── frontend/                # React + TypeScript frontend
│   ├── src/
│   │   ├── api/             # API client and services
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React context providers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # Frontend service layer
│   │   ├── types/           # TypeScript type definitions
│   │   └── views/           # Page-level views
│   ├── public/              # Static assets
│   └── package.json         # Frontend dependencies
├── .env                     # Environment variables (API keys)
├── .gitignore
├── ksp.bat                  # Start both frontend and backend
├── frontend.bat             # Start frontend dev server
├── backend.bat              # Start backend server
├── package.json             # Root-level dev dependencies
├── playwright.config.ts     # Playwright E2E test config
└── README.md
```

## Setup & Running

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL database
- Neo4j database (optional, for graph features)

### Backend Setup

1. Navigate to the project root and install Python dependencies:
   ```
   pip install -r backend/requirements.txt
   ```

2. Configure environment variables in `.env`:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

3. Start the backend server:
   ```
   backend.bat
   ```
   Or manually:
   ```
   set PYTHONPATH=.
   python backend\app.py
   ```
   The backend runs on `http://localhost:8000`.

### Frontend Setup

1. Navigate to the frontend directory and install dependencies:
   ```
   cd frontend
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```
   The frontend runs on `http://localhost:5173`.

### Quick Start (Both)

Run the combined startup script from the project root:
```
ksp.bat
```
This launches both the frontend and backend servers simultaneously.

## API Endpoints

The backend exposes the following REST API endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Serve the dashboard HTML |
| GET | `/api/export-records` | Export FIR records as PDF |
| GET | `/api/export-analytics` | Export analytics report as PDF |
| GET | `/api/beat-plan` | Generate preventive beat plan |
| GET | `/api/dossiers` | List all suspect dossiers |
| POST | `/api/dossiers` | Register a new suspect dossier |
| POST | `/api/chat` | Submit a query to the AI copilot pipeline |
| GET | `/api/telemetry` | Get full telemetry data |
| GET | `/api/system` | Get system metrics |
| GET | `/api/agents` | Get agent performance metrics |
| GET | `/api/pipeline` | Get current pipeline state |
| GET | `/api/logs` | Get application logs |
| GET | `/api/telemetry/stream` | SSE stream for real-time telemetry |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key for LLM calls | — |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude LLM calls | — |
| `LLM_MODEL` | LLM model identifier | `claude-3-5-sonnet-20241022` |

## License

This project is for official law enforcement use only.