# Agent Monitoring Implementation & Telemetry Audit Report

**Date:** July 23, 2026  
**Target View:** Agent Core Monitoring (`AIAgentMonitoring.tsx`)  
**Workspace:** KSP Crime Copilot  

---

## Executive Summary

An architectural audit was performed on the **Agent Monitoring** interface in the KSP Crime Copilot application. The audit examined frontend component implementations, data fetching hooks, API services, and backend server endpoints.

**Key Finding:** The Agent Monitoring dashboard is **entirely disconnected from real backend telemetry and active agent execution**. All displayed metrics—including pipeline stages, agent statuses, RAM/memory usage, latency accumulators, and execution metrics—are powered by **hardcoded static constants** and **in-memory local mock JSON objects**.

---

## 1. Responsible React Components

| File / Component | Role / Purpose |
| :--- | :--- |
| [`AIAgentMonitoring.tsx`](file:///c:/Users/sudha/Downloads/Application%20Full%20Model%20%283%29/Application%20Full%20Model/frontend/src/views/AIAgentMonitoring.tsx#L29) | Main UI component rendering the RAG pipeline graph, agent cards, and telemetry sidebar panel. |
| [`useAgentMonitoring.ts`](file:///c:/Users/sudha/Downloads/Application%20Full%20Model%20%283%29/Application%20Full%20Model/frontend/src/hooks/useAgentMonitoring.ts#L5) | React Query hook executing a periodic poll (`refetchInterval: 15000`) for agent status. |
| [`api.ts`](file:///c:/Users/sudha/Downloads/Application%20Full%20Model%20%283%29/Application%20Full%20Model/frontend/src/services/api.ts#L170) | Contains `fetchAgentStatus`, which simulates network latency via `setTimeout` and returns static mock data. |
| [`App.tsx`](file:///c:/Users/sudha/Downloads/Application%20Full%20Model%20%283%29/Application%20Full%20Model/frontend/src/App.tsx#L80) | Container view routing `'agent-monitoring'` key to `<AIAgentMonitoring />`. |

---

## 2. Field-by-Field Data Source Trace

Every field displayed on the Agent Monitoring page was traced back to its declaration:

```
[UI Dashboard View]
       │
       ├── Hybrid RAG Pipeline Tracing SVG ───► Static Array (pipelineStages) in AIAgentMonitoring.tsx
       ├── Latency Accumulator ("74ms")     ───► Hardcoded String in AIAgentMonitoring.tsx (L81)
       ├── Agent Status ("Idle"/"Executing")───► Hardcoded String in agents[] in AIAgentMonitoring.tsx
       ├── Memory Usage ("185 MB", etc.)   ───► Hardcoded String in agents[] in AIAgentMonitoring.tsx
       ├── Agent Tasks & UID Strings       ───► Hardcoded String in agents[] in AIAgentMonitoring.tsx
       │
       └── Latency & Confidence Metrics
               │
               ▼ (via fallback operator ??)
       useAgentMonitoring Hook (refetchInterval: 15s)
               │
               ▼
       fetchAgentStatus() in api.ts (setTimeout 500ms delay)
               │
               ▼
       In-Memory Mock JSON Array (5 hardcoded items)
```

### Detailed Breakdown

| Field / UI Element | Displayed Location | Code Location & Source | Classification |
| :--- | :--- | :--- | :--- |
| **Pipeline Progress / Stages** | Hybrid RAG Pipeline SVG | [`AIAgentMonitoring.tsx` L44-51](file:///c:/Users/sudha/Downloads/Application%20Full%20Model%20%283%29/Application%20Full%20Model/frontend/src/views/AIAgentMonitoring.tsx#L44-L51) (`pipelineStages` constant) | **Hardcoded** |
| **Pipeline Stage Latencies** | Below SVG Nodes ('4ms', '8ms', '48ms', '--') | [`AIAgentMonitoring.tsx` L45-50](file:///c:/Users/sudha/Downloads/Application%20Full%20Model%20%283%29/Application%20Full%20Model/frontend/src/views/AIAgentMonitoring.tsx#L45-L50) | **Hardcoded** |
| **Latency Accumulator** | Header badge ("LATENCY ACCUMULATOR: 74ms") | [`AIAgentMonitoring.tsx` L81](file:///c:/Users/sudha/Downloads/Application%20Full%20Model%20%283%29/Application%20Full%20Model/frontend/src/views/AIAgentMonitoring.tsx#L81) | **Hardcoded** |
| **Orchestrator Sync Rate** | Pipeline footer text ("99.4% precision index...") | [`AIAgentMonitoring.tsx` L191-193](file:///c:/Users/sudha/Downloads/Application%20Full%20Model%20%283%29/Application%20Full%20Model/frontend/src/views/AIAgentMonitoring.tsx#L191-L193) | **Hardcoded** |
| **Active Agents List** | 7 Agent Cards (Master, Crime, Network, Analytics, Financial, Forecast, Explainability) | [`AIAgentMonitoring.tsx` L33-41](file:///c:/Users/sudha/Downloads/Application%20Full%20Model%20%283%29/Application%20Full%20Model/frontend/src/views/AIAgentMonitoring.tsx#L33-L41) (`agents` constant) | **Hardcoded** |
| **Agent Status** | Card badge ("Idle" vs "Executing") | [`AIAgentMonitoring.tsx` L34-40](file:///c:/Users/sudha/Downloads/Application%20Full%20Model%20%283%29/Application%20Full%20Model/frontend/src/views/AIAgentMonitoring.tsx#L34-L40) | **Hardcoded** |
| **Latency (ms)** | Card latency metric | Derived from `liveAgents?.[i]?.execution_time_ms ?? default` via [`useAgentMonitoring`](file:///c:/Users/sudha/Downloads/Application%20Full%20Model%20%283%29/Application%20Full%20Model/frontend/src/hooks/useAgentMonitoring.ts#L5) and [`api.ts` L170](file:///c:/Users/sudha/Downloads/Application%20Full%20Model%20%283%29/Application%20Full%20Model/frontend/src/services/api.ts#L170) | **Mock JSON / Polling** |
| **Confidence (%)** | Card confidence metric | Derived from `liveAgents?.[i]?.confidence ?? default` via [`useAgentMonitoring`](file:///c:/Users/sudha/Downloads/Application%20Full%20Model%20%283%29/Application%20Full%20Model/frontend/src/hooks/useAgentMonitoring.ts#L5) and [`api.ts` L170](file:///c:/Users/sudha/Downloads/Application%20Full%20Model%20%283%29/Application%20Full%20Model/frontend/src/services/api.ts#L170) | **Mock JSON / Polling** |
| **Memory Usage** | Card memory metric ("110 MB", "185 MB", etc.) | [`AIAgentMonitoring.tsx` L34-40](file:///c:/Users/sudha/Downloads/Application%20Full%20Model%20%283%29/Application%20Full%20Model/frontend/src/views/AIAgentMonitoring.tsx#L34-L40) | **Hardcoded** |
| **CPU / RAM Usage** | Mentioned in header description | No actual CPU or system RAM metric calculations or components exist | **Not Implemented** |
| **Database Status** | Text in agent task descriptions ("Ingesting FIR summaries from Karnataka database", etc.) | [`AIAgentMonitoring.tsx` L35, L36, L38](file:///c:/Users/sudha/Downloads/Application%20Full%20Model%20%283%29/Application%20Full%20Model/frontend/src/views/AIAgentMonitoring.tsx#L35) | **Hardcoded** |
| **Telemetry Panel** | "Agent Telemetry Brief" sidebar | Reads from `selectedAgent` (Local React state) and selected item in `agents` array | **Local React state** |
| **Execution Times** | Telemetry Panel "Avg execution" | Reflects agent latency from `agents` array / `liveAgents` fallback | **Mock JSON** |
| **Re-Calibration Action** | "RUN RE-CALIBRATION SWEEP" button | [`AIAgentMonitoring.tsx` L292](file:///c:/Users/sudha/Downloads/Application%20Full%20Model%20%283%29/Application%20Full%20Model/frontend/src/views/AIAgentMonitoring.tsx#L292) | **Unbound Stub** |

---

## 3. Data Source Classification Summary

- **Hardcoded:** Pipeline stages, stage statuses, node latencies, accumulator text, agent names/icons/tasks, memory strings, sync rate index.
- **Randomly generated:** None.
- **Mock JSON / Local React state:** `fetchAgentStatus()` returns static mock objects inside `api.ts`; active card selection and telemetry panel rendering managed via `selectedAgent` state in `AIAgentMonitoring.tsx`.
- **Backend API:** None used by this page.
- **WebSocket:** None.
- **Server-Sent Events (SSE):** None.
- **Polling:** React Query polls `fetchAgentStatus` every 15 seconds, but `fetchAgentStatus` returns static mock JSON without network requests.
- **Real telemetry:** None.

---

## 4. API Endpoints Used by This Page

**Zero HTTP API endpoints are called.**

The frontend service function `fetchAgentStatus()` in [`frontend/src/services/api.ts`](file:///c:/Users/sudha/Downloads/Application%20Full%20Model%20%283%29/Application%20Full%20Model/frontend/src/services/api.ts#L170) does not invoke `fetch()`, `axios`, or any HTTP client. It simply resolves an in-memory array after 500ms:

```typescript
export const fetchAgentStatus = async (): Promise<AgentResult[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [
    { agent_name: "Profiling Agent", status: "Active", confidence: 94, execution_time_ms: 140 },
    { agent_name: "Analytics Agent", status: "Active", confidence: 96, execution_time_ms: 220 },
    { agent_name: "Forecast Agent", status: "Active", confidence: 91, execution_time_ms: 310 },
    { agent_name: "Network Agent", status: "Active", confidence: 95, execution_time_ms: 180 },
    { agent_name: "Financial Agent", status: "Active", confidence: 290 } // ...
  ];
};
```

---

## 5. Backend Telemetry Endpoints Audit

An inspection of the backend Python web server ([`backend/app.py`](file:///c:/Users/sudha/Downloads/Application%20Full%20Model%20%283%29/Application%20Full%20Model/backend/app.py)) reveals that the server only defines two routes:

1. `GET /` & static file routes: Serves `index.html` and static assets.
2. `POST /api/chat`: Runs `CopilotPipeline.execute()` and returns chat responses.

**Conclusion:** The backend currently **does not expose any telemetry, agent health, execution metrics, or system resource endpoints** (e.g., no `/api/telemetry`, `/api/agents/status`, or `/api/system/metrics`).

---

## 6. Live Execution Event Verification

An audit of the backend pipeline ([`backend/orchestration/pipeline.py`](file:///c:/Users/sudha/Downloads/Application%20Full%20Model%20%283%29/Application%20Full%20Model/backend/orchestration/pipeline.py#L53)) was conducted to verify live event generation during query processing.

- **Pipeline Execution:** `CopilotPipeline.execute()` runs in a standard synchronous sequential loop over `routed_agents`.
- **Event Streaming:** No WebSocket server, Server-Sent Events (SSE) handler, or message queue consumer is present.
- **Telemetry Emission:** While individual agents log operational details to Python's console logger (`logger.info`), no telemetry events, progress updates, or execution timers are broadcast or recorded for external consumption.

---

## 7. Comparison: Frontend Expectations vs. Backend Reality

| Feature / Metric | Frontend Expectation | Backend Implementation | Gap / Status |
| :--- | :--- | :--- | :--- |
| **Agent Status Tracking** | Real-time status ('Executing', 'Idle', 'Aggregating') per agent | No agent status tracking state or API exposed | **Disconnected** |
| **Pipeline Visualization** | Live step-by-step RAG progress with stage latencies | Pipeline runs monolithically during POST `/api/chat` without streaming intermediate steps | **Disconnected** |
| **Latency Metrics** | Real per-agent execution times | Backend logs total pipeline time to server console; individual timings are not stored or exposed | **Disconnected** |
| **Resource Utilization** | Memory & RAM consumption per agent block | No system metrics collection (e.g. `psutil`) | **Disconnected** |
| **Telemetry Actions** | Trigger re-calibration sweep | No re-calibration backend handler or endpoint exists | **Disconnected** |

---

## 8. Summary of Findings

The Agent Monitoring page is currently a **visual prototype**. It provides a polished presentation of RAG pipeline architecture and agent cards, but relies entirely on static definitions and local mock promises rather than live telemetry streams or real backend APIs.
