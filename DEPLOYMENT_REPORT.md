# KSP Crime Copilot Dashboard — Deployment Report

## 1. Project Overview

### Project Name
KSP Crime Copilot Dashboard

### Purpose
A full-stack AI-powered crime investigation and analytics platform for the Karnataka State Police (KSP). The application combines a Python backend with a multi-agent AI pipeline and a React + TypeScript frontend dashboard for real-time crime data analysis, forecasting, reporting, and criminal network intelligence.

### Architecture
The system follows a monorepo-style layout with two loosely coupled services:
- **Frontend**: React 19 single-page application (SPA) built with Vite.
- **Backend**: Custom Python HTTP server using `http.server.ThreadingHTTPServer` that exposes a REST API and an SSE telemetry stream. It orchestrates 12 specialized AI agents through a central pipeline and performs hybrid RAG (SQL + Graph + Vector) retrieval.

### Monorepo or Multi-Service
Single repository containing two independently runnable services (`frontend/` and `backend/`). They communicate over HTTP via REST and SSE.

### Folder Structure
```
.
├── .env                          # Root environment variables (API keys)
├── .gitignore
├── .kilo/                        # Kilo CLI configuration
├── README.md
├── package.json                  # Root devDependencies (Playwright only)
├── playwright.config.ts          # E2E test configuration
├── playwright-tests/             # E2E test suites
├── playwright-report/            # Playwright HTML reports
├── test-results/                 # Test artifacts
├── frontend/                     # React + TypeScript frontend
├── backend/                      # Python backend
│   ├── app.py                    # Main HTTP server entry point
│   ├── requirements.txt          # Python dependencies
│   ├── .env                      # Backend env file
│   ├── run_demo.py               # Demo/test runner with mock LLM
│   ├── final_report.md           # Backend improvement audit
│   ├── agents/                   # 12 specialized AI agents
│   ├── static/                   # Standalone HTML dashboard served by backend
│   ├── config/                   # Settings and LLM client initialization
│   ├── contracts/                # Pydantic schemas (AgentInput/AgentOutput)
│   ├── db/                       # Database clients (Postgres, Neo4j, FAISS)
│   ├── orchestration/            # Pipeline, Router, Memory, Context Manager
│   ├── rag/                      # Retrievers (SQL, Graph, Vector, Analytics)
│   ├── telemetry/                # Telemetry manager and SSE broadcasting
│   ├── tests/                    # Backend unit tests and demo runner
│   └── utils/                    # PDF generation utilities
├── frontend.bat                  # Windows shortcut: start frontend dev server
├── backend.bat                   # Windows shortcut: start backend server
└── ksp.bat                       # Windows shortcut: start both
```

### Frontend Technologies
- **Framework**: React 19
- **Language**: TypeScript (~6.0.2)
- **Build Tool**: Vite (8.1.1)
- **State/Server**: TanStack React Query (5.x)
- **HTTP Client**: Axios (1.x)
- **Icons**: Lucide React
- **Testing**: Playwright (root-level)
- **Linting**: Oxlint (1.71.0)

### Backend Technologies
- **Runtime**: Python 3.11+
- **HTTP Server**: Custom `http.server` + `socketserver.ThreadingMixIn`
- **Data Validation**: Pydantic v2
- **AI/LLM**: `anthropic` SDK, `sentence-transformers`, raw `urllib` Gemini calls
- **Vector Store**: FAISS (CPU) with Pure-Python TF-IDF fallback
- **Graph**: Neo4j driver with in-memory mock fallback
- **Relational**: SQLite (in-memory default) + psycopg2 (optional PostgreSQL)
- **PDF**: ReportLab
- **Testing**: Pytest (>=7.0.0)
- **Telemetry**: In-process SSE broadcaster with `queue.Queue`

### AI Technologies
- Multi-agent architecture (12 agents)
- LLM orchestration with role-based data isolation
- Hybrid RAG pipeline (relational + graph + vector)
- Statistical forecasting using `numpy.polyfit`

### Databases
- **SQLite** (primary, in-memory): `backend/rag/sql_retriever.py` seeds tables at runtime
- **PostgreSQL** (optional): Enabled via `USE_POSTGRES=true`
- **Neo4j** (optional): Enabled via `USE_NEO4J=true`
- **FAISS** (vector index): Local file persistence at `backend/backend/db/faiss_index_docs.pkl`

### External Services
- Google Gemini API
- Anthropic (Claude) API
- No SMTP or third-party notification services detected

### APIs Used
- `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`
- Anthropic Messages API (configurable model, default `claude-3-5-sonnet-20241022`)

---

## 2. Repository Structure

```
Application Full Model/
├── .env
├── .git/
├── .gitignore
├── .kilo/
├── .pytest_cache/
├── agent_monitoring_audit.md
├── backend.bat
├── backend/
│   ├── __init__.py
│   ├── __pycache__/
│   ├── .env
│   ├── .pytest_cache/
│   ├── app.py                    # HTTP server entry point
│   ├── requirements.txt
│   ├── run_demo.py
│   ├── final_report.md
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── analytics_agent.py
│   │   ├── base_agent.py
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
│   ├── backend/
│   │   └── db/
│   │       └── faiss_index_docs.pkl
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py
│   ├── contracts/
│   │   ├── __init__.py
│   │   └── agent_schemas.py
│   ├── db/
│   │   ├── __init__.py
│   │   ├── faiss_client.py
│   │   ├── neo4j_client.py
│   │   └── postgres_client.py
│   ├── orchestration/
│   │   ├── __init__.py
│   │   ├── context_manager.py
│   │   ├── memory.py
│   │   ├── pipeline.py
│   │   └── router.py
│   ├── rag/
│   │   ├── __init__.py
│   │   ├── analytics_retriever.py
│   │   ├── graph_retriever.py
│   │   ├── sql_retriever.py
│   │   └── vector_retriever.py
│   ├── static/
│   │   └── index.html
│   ├── telemetry/
│   │   └── telemetry_manager.py
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── __pycache__/
│   │   ├── demo_run.py
│   │   ├── run_all_tests.py
│   │   ├── run_tests.py
│   │   ├── test_agents.py
│   │   └── test_rag.py
│   └── utils/
│       └── pdf_generator.py
├── frontend/
│   ├── .env
│   ├── .gitignore
│   ├── .oxlintrc.json
│   ├── dist/
│   ├── index.html
│   ├── node_modules/
│   ├── package-lock.json
│   ├── package.json
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── README.md
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── api/client.ts
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── views/
│   │   └── assets/
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── frontend.bat
├── ksp.bat
├── node_modules/
├── package-lock.json
├── package.json
├── playwright-report/
├── playwright-tests/
├── playwright.config.ts
├── rag_and_agent_quality_report.md
├── README.md
└── test-results/
```

### Important Folder Purposes

| Folder | Purpose |
| --- | --- |
| `backend/app.py` | Single-file HTTP server with request routing and multi-threaded dispatching. |
| `backend/agents/` | 12 specialized AI agents (profiling, analytics, forecasting, network, etc.). |
| `backend/orchestration/` | Router, memory, context enrichment, and the central multi-agent pipeline. |
| `backend/rag/` | Hybrid retrievers for SQL, graph, vector, and analytics data sources. |
| `backend/db/` | Database access layers with fallback modes (Postgres, Neo4j, FAISS). |
| `backend/telemetry/` | Real-time SSE telemetry broadcasting for the frontend monitoring UI. |
| `backend/static/` | Standalone HTML dashboard that can be served without the React build step. |
| `backend/utils/` | PDF generation for exports and compliance reports. |
| `frontend/src/` | React source: API client, hooks, components, views, types, and services. |

---

## 3. Frontend Analysis

### Detected Characteristics

| Attribute | Value |
| --- | --- |
| Framework | React 19 (^19.2.7) |
| Build Tool | Vite (^8.1.1) |
| Node Version Required | 18+ (README) |
| Package Manager | npm |
| Build Output Folder | `frontend/dist/` |
| API Base URL | `import.meta.env.VITE_API_URL` or `http://localhost:8000` fallback |
| Routing | Internal state-based tab routing in `App.tsx` |
| SSR Used | No |
| React Router Used | No |
| Vite Config | `vite.config.ts` with `@vitejs/plugin-react` |
| TypeScript Config | `tsconfig.json` project references |

### package.json Scripts
```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "oxlint",
  "preview": "vite preview"
}
```

### Static Assets
- `frontend/public/favicon.svg`
- `frontend/public/icons.svg`
- `frontend/src/assets/vite.svg`
- `frontend/src/assets/react.svg`

### Environment Variables
| Variable | Description | Required | Default | Secret | Example |
| --- | --- | --- | --- | --- | --- |
| `VITE_API_URL` | Backend API base URL | No | `http://localhost:8000` | No | `https://api.example.com` |

### Dependencies
**Runtime**:
- `@tanstack/react-query` ^5.101.2
- `axios` ^1.18.1
- `lucide-react` ^1.23.0
- `react` ^19.2.7
- `react-dom` ^19.2.7

**Dev**:
- `@types/node` ^24.13.2
- `@types/react` ^19.2.17
- `@types/react-dom` ^19.2.3
- `@vitejs/plugin-react` ^6.0.3
- `oxlint` ^1.71.0
- `typescript` ~6.0.2
- `vite` ^8.1.1

---

## 4. Backend Analysis

### Identified Characteristics

| Attribute | Value |
| --- | --- |
| Python Version | 3.11+ |
| Framework | Custom HTTP server built on Python stdlib `http.server` |
| Server Type | `socketserver.ThreadingMixIn` + `HTTPServer` |
| Entry Point | `backend/app.py` |
| Startup Command | `python backend\app.py` (Windows) or `python backend/app.py` (Unix) |
| HTTP Server Implementation | stdlib `http.server.BaseHTTPRequestHandler` |
| Port Used | 8000 (default, configurable via first CLI arg) |
| Threading Model | `daemon_threads = True` via `ThreadingMixIn` |
| Middleware | None (pure stdlib). CORS handled manually per endpoint. |
| API Endpoints | See table below |
| Static File Serving | Serves `backend/static/` with manual MIME guessing |
| Logging | `logging.basicConfig(level=logging.INFO)` with per-module loggers |
| Health Endpoint | `GET /api/system` (returns system metrics) |
| CORS Configuration | `Access-Control-Allow-Origin: *` on JSON, files, SSE, PDFs, and OPTIONS |

### API Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/` | Serves `backend/static/index.html` |
| GET | `/index.html` | Serves `backend/static/index.html` |
| GET | `/*` (static files) | Serves JS/CSS/JSON/PNG from `backend/static/` |
| POST | `/api/chat` | Submit query to multi-agent pipeline |
| GET | `/api/dossiers` | List suspect dossiers |
| POST | `/api/dossiers` | Register new suspect dossier |
| GET | `/api/export-records` | Export FIR records as PDF |
| GET | `/api/export-analytics` | Export analytics report as PDF |
| GET | `/api/beat-plan` | Generate preventive beat plan (TXT) |
| GET | `/api/generate-report` | Generate compliance report PDF |
| GET | `/api/download-report` | Download compliance report PDF |
| GET | `/api/telemetry` | Full telemetry JSON |
| GET | `/api/system` | System metrics (health) |
| GET | `/api/agents` | Agent performance metrics |
| GET | `/api/pipeline` | Current pipeline state |
| GET | `/api/logs` | Application logs |
| GET | `/api/telemetry/stream` | SSE stream for real-time telemetry |
| OPTIONS | `/*` | CORS preflight |

### Python Packages

**Declared in `backend/requirements.txt`**:
- `pydantic>=2.0.0`
- `numpy>=1.20.0`
- `pandas>=1.3.0`
- `faiss-cpu>=1.7.0`
- `sentence-transformers>=2.2.0`
- `anthropic>=0.5.0`
- `pytest>=7.0.0`
- `python-dotenv>=0.19.0`

**Used but not declared**:
- `psycopg2` (optional PostgreSQL)
- `neo4j` (optional graph driver)
- `reportlab` (PDF generation — **missing from requirements.txt**)

---

## 5. AI Pipeline

### Agent Architecture
The backend implements a 12-agent modular architecture under `backend/agents/`:

1. `MasterAgent` — Query decomposition and execution planning.
2. `CrimeQueryAgent` — Hybrid retrieval across SQL, Graph, and Vector stores.
3. `AnalyticsAgent` — Spatial, temporal, and demographic aggregation.
4. `ForecastAgent` — Linear regression forecasting and anomaly detection.
5. `ProfilingAgent` — Offender history and MO synthesis.
6. `NetworkAgent` — Graph traversal, centrality, HVT flagging.
7. `FinancialAgent` — Hawala, shell company, and transaction pattern detection.
8. `SociologyAgent` — District demographics and recidivism drivers.
9. `DecisionSupportAgent` — Priority scoring, risk matrices, action recommendations.
10. `ReasoningAgent` — Multi-hop Chain-of-Thought synthesis.
11. `ExplainabilityAgent` — Dynamic citation generation and audit logging.
12. `ResponseAgent` — Final markdown formatting and role-based security filtering.

All agents inherit from `BaseAgent` (ABC) and validate input/output via Pydantic (`AgentInput`, `AgentOutput`).

### Orchestration Flow (`backend/orchestration/pipeline.py`)
1. **MasterAgent** parses intent and builds an execution blueprint.
2. **ContextManager** enriches context with role-based security clearances.
3. **Router** maps the query to a subset of specialized agents based on keyword intent.
4. **Routed agents** execute sequentially:
   - `CrimeQueryAgent` runs hybrid RAG (SQL + Graph + Vector) and accumulates chunks.
   - Specialized agents execute based on router output.
5. **ReasoningAgent** performs evidence-driven logical synthesis over all upstream results.
6. **ExplainabilityAgent** generates dynamic citations from actual retrieved chunks.
7. **ResponseAgent** compiles the final markdown intelligence brief and enforces role-based data isolation.

### RAG Pipeline
- **SQL Retriever**: Queries in-memory SQLite (or PostgreSQL) tables (`firs`, `populations`, `monthly_stats`, `suspect_dossiers`).
- **Graph Retriever**: Queries Neo4j (or mock in-memory graph) for co-accused networks.
- **Vector Retriever**: Queries FAISS (or Pure-Python TF-IDF fallback) for semantic intelligence briefs.
- **Analytics Retriever**: Returns pre-computed trend benchmarks and seasonal indices.

### Embedding Model
- `sentence-transformers` model `all-MiniLM-L6-v2` (used by `FaissClient` when FAISS is available).

### LLM Providers
- **Primary**: Google Gemini API (`gemini-3.5-flash`) called via direct HTTP POST.
- **Secondary**: Anthropic Claude API via `anthropic` SDK.
- **Fallback**: Professional mock engine when neither key is available.

### Vector Database
- FAISS (`IndexFlatIP` with L2-normalized embeddings for cosine similarity).
- Persistent file cache at `backend/backend/db/faiss_index_docs.pkl`.
- Falls back to `PurePythonVectorStore` (TF-IDF + cosine similarity) when `faiss-cpu` is missing.

### Memory
- In-process `Memory` class storing conversation history in a `Dict[str, List]`.
- Sliding window compression when history exceeds 10 messages.
- No Redis or external session store.

### Prompt Pipeline
- Each agent constructs a structured system prompt with synthesized data.
- Prompts vary by role (e.g., `DecisionSupportAgent` tailors output to Investigator/Supervisor/Policymaker).
- `settings.call_llm` is the single entry point that selects Gemini → Claude → Mock.

### Request Travel Path
1. Frontend sends `POST /api/chat` with `query`, `role`, `session_id`, `context`.
2. Backend `CopilotHTTPHandler.do_POST` reads JSON and invokes `pipeline.execute(...)`.
3. The pipeline runs the 7-stage multi-agent flow described above.
4. Final JSON response includes `markdown_response`, `agent_results`, and optional widget data (`hotspots`, `time_distribution`, `forecasts`, `alerts`, `profiling`).
5. Frontend renders markdown and updates dashboard widgets.

---

## 6. Database Analysis

### PostgreSQL
- **Status**: Optional (disabled by default).
- **Connection**: `USE_POSTGRES=true` enables psycopg2 `ThreadedConnectionPool`.
- **Connection String / Env Vars**:
  - `PGHOST` (default: `localhost`)
  - `PGPORT` (default: `5432`)
  - `PGDATABASE` (default: `ksp_crime_db`)
  - `PGUSER` (default: `postgres`)
  - `PGPASSWORD` (default: empty string)
- **Migration Requirements**: None. Schema is created inline via `CREATE TABLE IF NOT EXISTS`.
- **Seed Data**: Hardcoded in `db/postgres_client.py` (sample crimes).
- **Startup Requirements**: `psycopg2` installed and a running PostgreSQL instance.

### Neo4j
- **Status**: Optional (disabled by default).
- **Connection**: `USE_NEO4J=true` connects via `neo4j.GraphDatabase.driver`.
- **Connection String / Env Vars**:
  - `NEO4J_URI` (default: `bolt://localhost:7687`)
  - `NEO4J_USER` (default: `neo4j`)
  - `NEO4J_PASSWORD` (required when enabled)
- **Migration Requirements**: None. No Cypher schema migration files.
- **Seed Data**: None (runs against existing Neo4j data or mock fallback).
- **Startup Requirements**: `neo4j` driver installed and running.

### SQLite
- **Status**: Primary datastore (always active).
- **Connection**: In-memory SQLite (`:memory:`) with `check_same_thread=False`.
- **Seed Data**: `rag/sql_retriever.py` seeds 13 FIRs, 5 populations, 24 months of stats, and 3 dossiers.

### FAISS
- **Status**: Primary vector store.
- **Files**:
  - `backend/backend/db/faiss_index_docs.pkl`
  - `backend/backend/db/faiss_index.index`
- **Embedding Model**: `all-MiniLM-L6-v2`.

### Local Files
- `backend/backend/db/faiss_index_docs.pkl`
- `backend/backend/db/faiss_index.index`

---

## 7. Environment Variables

| Variable | Description | Required | Default | Secret | Example |
| --- | --- | --- | --- | --- | --- |
| `GEMINI_API_KEY` | Google Gemini API key for LLM calls | No | — | Yes | `AIzaSy...` |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude LLM calls | No | — | Yes | `sk-ant-...` |
| `LLM_MODEL` | LLM model identifier for Anthropic | No | `claude-3-5-sonnet-20241022` | No | `claude-3-5-sonnet-20241022` |
| `USE_POSTGRES` | Enable PostgreSQL mode | No | `false` | No | `true` |
| `PGHOST` | PostgreSQL host | Conditional | `localhost` | No | `db.example.com` |
| `PGPORT` | PostgreSQL port | Conditional | `5432` | No | `5432` |
| `PGDATABASE` | PostgreSQL database name | Conditional | `ksp_crime_db` | No | `ksp_crime_db` |
| `PGUSER` | PostgreSQL username | Conditional | `postgres` | No | `ksp_user` |
| `PGPASSWORD` | PostgreSQL password | Conditional | `""` | Yes | `s3cret` |
| `USE_NEO4J` | Enable Neo4j mode | No | `false` | No | `true` |
| `NEO4J_URI` | Neo4j bolt URI | Conditional | `bolt://localhost:7687` | No | `bolt://neo4j:7687` |
| `NEO4J_USER` | Neo4j username | Conditional | `neo4j` | No | `neo4j` |
| `NEO4J_PASSWORD` | Neo4j password | Conditional | — | Yes | `neo4j_pw` |
| `VITE_API_URL` | Frontend API base URL | No | `http://localhost:8000` | No | `https://api.example.com` |
| `PORT` | Backend listen port (custom server) | No | `8000` | No | `8000` |

### Notes
- At least one LLM key should be provided for production-quality AI responses. Without them, the system falls back to a deterministic mock engine.
- PostgreSQL, Neo4j, and FAISS are all optional with automatic fallbacks.

---

## 8. External Dependencies

| Dependency | Usage | Authentication | Fallback |
| --- | --- | --- | --- |
| Google Gemini API | `urllib.request` POST for LLM inference | API key as query param | Anthropic SDK → Mock engine |
| Anthropic (Claude) | `anthropic.Anthropic` SDK for LLM inference | API key in SDK constructor | Mock engine |
| HuggingFace | `sentence-transformers` downloads `all-MiniLM-L6-v2` | None required for public model | Pure-Python TF-IDF vector store |
| PostgreSQL (optional) | Relational datastore when `USE_POSTGRES=true` | Username/password via env | In-memory SQLite |
| Neo4j (optional) | Graph datastore when `USE_NEO4J=true` | Username/password via env | Mock in-memory graph |
| SMTP / Email | None | — | — |

---

## 9. Build Process

### Frontend Build
```bash
cd frontend
npm install
npm run build
```
- `npm install` installs dependencies into `frontend/node_modules/`.
- `npm run build` runs `tsc -b && vite build`, emitting to `frontend/dist/`.
- Working directory: `frontend/`.

### Backend
No build step. Python modules are imported directly.
```bash
pip install -r backend/requirements.txt
```
- Working directory: project root.

### Full Build
```bash
cd frontend && npm install && npm run build
pip install -r backend/requirements.txt
```

---

## 10. Deployment Requirements

### Frontend
| Requirement | Value |
| --- | --- |
| Runtime | Node.js 18+ (build only) |
| Memory | 512 MB+ |
| CPU | 1 vCPU+ |
| Ports | 80/443 if served directly; none if CDN |
| Persistent Storage | None (static bundle) |
| File Uploads | None |
| Environment Variables | `VITE_API_URL` should point to backend |
| Health Checks | Static asset existence (e.g., `/index.html`) |

### Backend
| Requirement | Value |
| --- | --- |
| Runtime | Python 3.11+ |
| Memory | 1.5–2 GB+ |
| CPU | 1 vCPU+ (2+ recommended) |
| Ports | 8000 (configurable via CLI arg or env) |
| Persistent Storage | `backend/backend/db/` for FAISS index |
| File Uploads | None |
| Temporary Files | In-memory PDFs (`io.BytesIO`) |
| Environment Variables | See Section 7 |
| Health Checks | `GET /api/system` |

---

## 11. Zoho Catalyst Compatibility

### AppSail
**Partially Compatible**.

**Why**:
- Supports Python runtimes. The backend is standard Python.
- The custom server binds to `''` (all interfaces) and listens on `8000` by default.

**Required Changes**:
1. **Port Binding**: Read `PORT` (or `PORT_HTTP`) from environment in `backend/app.py`.
2. **WSGI/ASGI Adapter**: Wrap the handler or migrate to Flask/FastAPI for AppSail compatibility.
3. **Static Files**: Deploy React `frontend/dist/` to Catalyst Web Client, or copy build into `backend/static/`.
4. **Dependencies**: Ensure `psycopg2`, `neo4j`, `faiss-cpu`, `sentence-transformers`, `reportlab` install cleanly.

### Functions
**Not Recommended**. The app is a long-running multi-threaded HTTP server. SSE streams and 30+ second AI pipelines are incompatible with a function-as-a-service invocation model.

### Web Client
**Compatible for the Frontend Only**.
- Build and deploy the React SPA to Catalyst Web Client.
- API calls must be routed to the AppSail backend.
- `VITE_API_URL` must point to the AppSail backend URL.

---

## 12. Docker Readiness

### Existing Dockerfiles
None. No `Dockerfile`, `docker-compose.yml`, or `.dockerignore` found.

### Feasibility
**Yes, the project is Docker-ready**.

### What Would Be Needed
1. **Frontend Image**: `node:18-alpine` → `npm ci` → `npm run build`.
2. **Backend Image**: `python:3.11-slim` → install system libs (`libgomp1`) → `pip install -r backend/requirements.txt`.
3. **Multi-stage Build**: Copy `frontend/dist/` into `backend/static/` within the Python image for a single-container deployment.
4. **Optional Compose**: Add `postgres:16` and `neo4j:5` services.
5. **No code modifications required** other than adding the `Dockerfile` and optional `docker-compose.yml`.

---

## 13. Startup Commands

### Frontend (Development)
```bash
cd frontend
npm install
npm run dev
```
- Serves on `http://localhost:5173`.

### Backend (Local)
```bash
python backend\app.py
```
- Serves on `http://localhost:8000`.

### Backend with Explicit Port
```bash
python backend\app.py 9000
```

### Combined Startup (Windows)
```powershell
ksp.bat
```

### Production (Manual)
```bash
cd frontend && npm run build
xcopy /E /I /Y frontend\dist backend\static\dist
cd ..
set PYTHONPATH=.
python backend\app.py
```

---

## 14. Production Checklist

### Hardcoded localhost URLs
- `frontend/src/api/client.ts`: `import.meta.env.VITE_API_URL || 'http://localhost:8000'`
- `frontend/src/views/Settings.tsx`: same pattern.
- `backend/config/settings.py`: Hardcoded debug path `C:/Users/vishw/.gemini/antigravity-ide/gemini_debug.txt`.

### Debug Code
- `backend/app.py`: `print(f"DEBUG: do_GET called with path {path}", flush=True)` and similar prints.
- `backend/config/settings.py`: Debug write block to hardcoded local path.

### Missing Environment Variables
- Production should set `GEMINI_API_KEY` or `ANTHROPIC_API_KEY`.
- `VITE_API_URL` should be set in deployed environment.

### Missing Secrets
- `.env` files contain live API keys. **Secrets must be rotated and removed from source control.**

### Missing Requirements
- `reportlab` is used but **not listed** in `backend/requirements.txt`.

### Potential Deployment Issues
1. **Threading + In-Memory SQLite**: `:memory:` databases do not survive process restarts.
2. **No Graceful Shutdown**: `serve_forever()` only catches `KeyboardInterrupt`.
3. **No Request Timeouts**: A slow client can block a thread indefinitely.
4. **SSE Stream Hard Limit**: SSE connections timeout after 30 seconds.
5. **Large Response Bodies**: PDF exports and telemetry responses are not paginated.
6. **Static HTML vs React Build**: `backend/static/index.html` differs from the React build.

---

## 15. Deployment Risks

| Problem | Reason | Severity | Recommended Solution |
| --- | --- | --- | --- |
| **Secrets committed to repo** | `.env` files contain live `GEMINI_API_KEY` values. | CRITICAL | Rotate keys immediately and purge from git history. |
| **Hardcoded debug file path** | `settings.py` writes to `C:/Users/vishw/...`. | HIGH | Remove debug write path before production. |
| **Threaded HTTP server without WSGI** | Cloud platforms often expect WSGI/ASGI adapters. | MEDIUM | Wrap handler with WSGI/ASGI adapter or migrate to FastAPI/Flask. |
| **Port not env-configurable** | Server defaults to 8000; cloud platforms inject `PORT`. | HIGH | Read `PORT` from environment if present. |
| **Missing `reportlab`** | PDF generation imports `reportlab` but it is missing from requirements. | HIGH | Add `reportlab` to `backend/requirements.txt`. |
| **In-memory session store** | `Memory` class uses plain dict; no Redis. | MEDIUM | Externalize session state for multi-instance deployments. |
| **No graceful shutdown** | `serve_forever()` only catches `KeyboardInterrupt`. | MEDIUM | Catch `SystemExit` and `SIGTERM` to close DB pools. |
| **Mock LLM fallback** | If no API keys are set, responses are stubs. | HIGH | Enforce API key presence at startup and fail fast. |
| **CORS `*` in production** | `Access-Control-Allow-Origin: *` may be too permissive. | LOW | Restrict to production frontend domain. |

---

## 16. Required Configuration Changes

1. **Environment Variables** — Set `GEMINI_API_KEY` or `ANTHROPIC_API_KEY`, `VITE_API_URL`, and `PORT` in the deployment environment.
2. **Secrets Rotation** — Rotate the exposed `GEMINI_API_KEY` and purge from history.
3. **Dependencies** — Add `reportlab` to `backend/requirements.txt`.
4. **Port Binding** — Modify `backend/app.py` to read `os.getenv("PORT", "8000")`.
5. **Static File Alignment** — Decide whether to serve React `frontend/dist/` or `backend/static/index.html`. If serving React, copy build into `backend/static/`.
6. **Frontend Build** — Execute `npm run build` and deploy `dist/`.
7. **Persistent Storage** — Provision a persistent volume for `backend/backend/db/` so the FAISS index survives restarts.
8. **Graceful Shutdown** — Ensure the process manager sends `SIGTERM` and the server shuts down cleanly.

---

## 17. Dependency Summary

### Python Packages

| Package | Version Spec | Purpose |
| --- | --- | --- |
| `pydantic` | >=2.0.0 | Agent schemas and validation |
| `numpy` | >=1.20.0 | Linear regression forecasting |
| `pandas` | >=1.3.0 | Declared dependency |
| `faiss-cpu` | >=1.7.0 | Vector indexing |
| `sentence-transformers` | >=2.2.0 | Embedding generation |
| `anthropic` | >=0.5.0 | Claude API client |
| `pytest` | >=7.0.0 | Testing framework |
| `python-dotenv` | >=0.19.0 | Environment loading |
| `reportlab` | (missing) | PDF generation |

### Node Packages

| Package | Version Spec | Purpose |
| --- | --- | --- |
| `react` | ^19.2.7 | UI framework |
| `react-dom` | ^19.2.7 | DOM renderer |
| `@tanstack/react-query` | ^5.101.2 | Server state caching |
| `axios` | ^1.18.1 | HTTP client |
| `lucide-react` | ^1.23.0 | Icon components |
| `typescript` | ~6.0.2 | Language |
| `vite` | ^8.1.1 | Build tool / dev server |
| `@vitejs/plugin-react` | ^6.0.3 | Vite React integration |
| `oxlint` | ^1.71.0 | Linting |
| `@types/react` | ^19.2.17 | Type definitions |
| `@types/react-dom` | ^19.2.3 | Type definitions |
| `@types/node` | ^24.13.2 | Type definitions |

---

## 18. Final Deployment Plan

### Recommended Order

| Step | Component | Action | Why |
| --- | --- | --- | --- |
| 1 | Secrets | Rotate exposed API keys and inject them via secure env vars or secret managers. | Prevents unauthorized API usage before anything else is live. |
| 2 | Dependencies | Add `reportlab` to `backend/requirements.txt` and lock versions. | Fixes missing PDF generation dependency. |
| 3 | Backend | Configure `PORT` env handling, set `PYTHONPATH`, and install Python deps. | Prepares the backend to start reliably on delegated ports. |
| 4 | Databases | Provision PostgreSQL and/or Neo4j (optional) and set connection env vars. | Allows switching from in-memory SQLite to durable stores. |
| 5 | Vector Index | Pre-build or mount the FAISS index at `backend/backend/db/`. | Avoids cold-start model download and index rebuild. |
| 6 | Frontend | Run `npm run build`, copy `frontend/dist/` into `backend/static/`. | Ensures the backend serves the correct production UI. |
| 7 | Backend Startup | Start the Python server and verify `GET /api/system` returns healthy metrics. | Validates core API, DB connectivity, and telemetry. |
| 8 | Smoke Tests | Hit `/api/chat`, `/api/export-records`, and SSE `/api/telemetry/stream`. | Confirms multi-agent pipeline, PDF export, and live telemetry work end-to-end. |
| 9 | Frontend Delivery | Serve the static bundle via CDN, reverse proxy, or directly from backend. | Makes the dashboard accessible to end users. |
| 10 | Monitoring | Attach health checks, logging, and alerting to `/api/system` and process metrics. | Production observability and incident response readiness. |
