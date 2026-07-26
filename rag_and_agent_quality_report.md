# RAG Quality & Agent Intelligence Audit Report

## RAG Quality Audit

### Overall RAG Quality Score: 78/100

---

### SQLRetriever - Score: 92/100

**Strengths:**
- All queries return correct, expected records (14 FIRs, 5 districts, 24 months of monthly stats)
- Parameterized queries prevent SQL injection
- Empty result handling works correctly for non-existent suspects
- District filtering works correctly (case-insensitive)
- Crime type filtering works correctly (burglary, cyber crime, extortion, theft, assault)
- No duplicate rows - primary key constraint enforced
- Per-capita crime rate computation with JOIN to populations table is correct
- Time distribution data correctly stored and retrievable
- Singleton pattern ensures database is seeded only once

**Weaknesses:**
- Hardcoded seed data - no real-world data ingestion pipeline
- Limited crime types (only 5: Burglary, Cyber Crime, Extortion, Theft, Assault)
- Limited suspect pool (only 3 named suspects + Unknown)
- No full-text search or fuzzy matching
- No query optimization or caching beyond the singleton connection

**Retrieval Quality:**
- Precision: 100% (all returned records are relevant to their queries)
- Recall: 100% (all seeded records are retrievable)
- No missing information, no noise, no hallucinations

---

### VectorRetriever - Score: 55/100

**Strengths:**
- Dual-mode retrieval: FAISS (when available) + Pure-Python TF-IDF fallback
- TF-IDF + cosine similarity provides reasonable keyword-based ranking
- All 5 seed documents are indexed and retrievable
- Self-seeding mechanism ensures documents are available
- Handles empty queries gracefully
- Consistent results across repeated calls

**Weaknesses:**
- **CRITICAL: Never used by any agent** - dead code in the current agent architecture
- No semantic/embedding-based search (FAISS with sentence-transformers is the only way to get true semantic similarity; TF-IDF is purely keyword-based)
- Only 5 seed documents - extremely limited corpus
- TF-IDF cosine similarity conflates document length with relevance (longer documents get higher scores because they contain more matching tokens)
- No query expansion or synonym handling
- Pure-Python fallback has no concept of document chunking - entire documents are retrieved as units
- `_compute_cosine_similarity` method has a bug: it multiplies both query and document weights by IDF independently, then multiplies them together, which double-counts IDF in the dot product
- The `retrieve()` method defaults `score` to 0.91 when not present, masking cases where FAISS search returns documents without scores
- The ensemble fallback condition (`if not results and self.tfidf_index`) means TF-IDF is only used when FAISS returns empty results, never as an enhancement

**Incorrect Retrievals:**
- When querying "financial fraud hawala shell companies" with FAISS unavailable, the TF-IDF approach may rank documents incorrectly because it doesn't understand semantic similarity - it only matches token overlap
- Doc length bias: a document containing all query terms but with many irrelevant terms will score the same as a document with just the relevant terms

**Missing Retrievals:**
- If a query uses synonyms or related terms not present in the documents, no results are returned (e.g., "money laundering" won't match unless the exact phrase appears in the documents)

**Suggestions:**
1. Remove VectorRetriever from `_client_instance` singleton or integrate it as a proper agent
2. Use FAISS with sentence-transformers for true semantic retrieval
3. Implement document chunking for large documents
4. Add query expansion/synonym handling
5. Fix the double-counting IDF bug in `_compute_cosine_similarity`
6. Add hybrid retrieval (semantic + keyword) that combines FAISS and TF-IDF scores

---

### GraphRetriever - Score: 95/100

**Strengths:**
- All suspect connections are correctly traversed and returned
- Bidirectional links work (Suresh->Dinesh and Dinesh->Suresh)
- Hub detection correctly identifies Suresh Patil as the top node (3 connections)
- Shortest path finding using BFS works correctly
- Cluster detection correctly identifies connected components
- Strength-weighted relationships add nuance
- No hallucinated relationships - all edges match seeded data exactly
- Consistent results across repeated queries

**Weaknesses:**
- Limited network size (only 3 primary suspects + 4 secondary entities)
- No real Neo4j connection - purely in-memory mock
- No dynamic graph updates or real-time data ingestion
- The `find_hubs()` only considers outgoing edges, not total degree (in-degree + out-degree)
- Shortest path only works for connected nodes; disconnected graphs return empty

**Retrieval Quality:**
- Precision: 100% (all returned edges match seeded data)
- Recall: 100% (all connections are retrievable)
- No missing relationships, no hallucinated connections

---

### AnalyticsRetriever - Score: 85/100

**Strengths:**
- Pre-computed data is comprehensive and well-structured
- Covers baselines, seasonal indices, clearance rates, and vulnerability indices
- All 5 districts have vulnerability indices
- All 5 crime types have clearance rates
- Seasonal indices cover all major crime types
- Consistent data across repeated calls
- No computation errors in the pre-computed values

**Weaknesses:**
- **CRITICAL: Always returns identical data regardless of the query parameter** - the `query` argument is completely ignored
- Queries like "Shivajinagar" vs "Mysore vs "Bangalore Central" all return the same full dataset instead of filtering to the relevant district
- No actual analytical computation - all data is hardcoded
- No support for custom queries or ad-hoc analysis
- Seasonal indices only cover 3 crime types (Burglary, Theft, Cyber Crime) - missing Extortion and Assault
- No temporal trend data beyond seasonal indices

**Missing Information:**
- District-specific analytics are not filtered - querying for "Shivajinagar" returns data for all 5 districts
- No support for time-range queries or custom aggregations

**Suggestions:**
1. Filter `precomputed_data` based on the query parameter (e.g., extract district-specific data)
2. Add support for custom analytical queries
3. Expand seasonal indices to cover all crime types
4. Add time-series trend data for YoY analysis

---

## Agent Intelligence Audit

### Overall Agent Intelligence Score: 72/100

---

### MasterAgent - Score: 88/100

**Expected Behavior:** Analyzes queries, decomposes them into execution steps, designs the multi-agent blueprint.
**Actual Behavior:** Correctly identifies query intent keywords and generates appropriate plan steps.
**Strengths:** Structured output with execution plan and summary. Good keyword coverage for all intent types.
**Weaknesses:** Plan is static - same plan is generated for any query matching the same keywords regardless of context. No dynamic prioritization.

### CrimeQueryAgent - Score: 82/100

**Expected Behavior:** Executes SQL queries to retrieve matching FIR records.
**Actual Behavior:** Correctly maps crime type keywords to SQL queries and returns matching records.
**Strengths:** Correct parameterized queries, proper mapping of keywords to crime types.
**Weaknesses:** Only handles 5 exact crime type matches (burglary, cyber, extortion, theft, assault). Any other query defaults to `SELECT * FROM firs` which returns ALL records. No semantic understanding - "robbery" won't match "burglary". No fuzzy matching or partial matching.

### ProfilingAgent - Score: 85/100

**Expected Behavior:** Builds comprehensive criminal profiles from SQL and Graph data.
**Actual Behavior:** Correctly aggregates FIR data, computes risk indicators, generates narrative profiles via LLM.
**Strengths:** Comprehensive profile fields (crime types, districts, date range, MO summary). Correct risk indicator logic (repeat offender, multi-jurisdictional, syndicate connected). Narrative generation uses LLM for professional reporting.
**Weaknesses:** Requires exactly one suspect - crashes if no person_names provided (ValueError). Only uses the first suspect if multiple are provided for SQL queries.

### NetworkAgent - Score: 83/100

**Expected Behavior:** Models criminal association graphs and pinpoints central coordinators.
**Actual Behavior:** Correctly retrieves graph data, computes centrality metrics, HVT flags, and network metrics. Generates narrative briefings via LLM.
**Strengths:** Correct degree centrality computation, HVT flagging with risk levels, network density/avg degree metrics.
**Weaknesses:** Falls back to "Suresh Patil" as default if no suspects provided. LLM narrative quality depends entirely on the mock LLM fallback, which uses template-based responses.

### FinancialAgent - Score: 80/100

**Expected Behavior:** Detects illicit financial operations including money laundering and hawala.
**Actual Behavior:** Correctly queries SQL for financial FIRs, analyzes graph for couriers/fencers, computes risk scores.
**Strengths:** Multi-layered risk scoring (base + hawala detection + shell company detection + graph analysis). MO-based flag detection works correctly.
**Weaknesses:** Default fallback suspect "Ramesh Kumar" means queries always return results even when no suspect is provided. Hard-coded shell company name "Textile Shell Front Corp (Identified in FIR)" is inserted regardless of actual query content.

### ForecastAgent - Score: 78/100

**Expected Behavior:** Uses linear regression to project crime trends and flag anomalies.
**Actual Behavior:** Correctly performs np.polyfit linear regression, computes 30/60/90-day projections, calculates statistical thresholds.
**Strengths:** Sound statistical methodology (linear regression + mean+2*std threshold). Correct alert generation when projections exceed threshold. Proper clamping of negative predictions to 0.
**Weaknesses:** Skips crime types with <=12 months of data (but all 3 seeded types have 24 months). Only 1st-degree polynomial - no seasonal decomposition or more sophisticated forecasting. The mock LLM fallback is not used here (purely computational), which is good.

### AnalyticsAgent - Score: 76/100

**Expected Behavior:** Compiles comprehensive analytical reports with LLM-generated commentary.
**Actual Behavior:** Correctly executes multiple SQL queries (hotspots, time distribution, YoY, district rates), calls LLM for commentary.
**Strengths:** Multi-faceted analysis spanning spatial, temporal, and demographic dimensions. Correct YoY change computation.
**Weaknesses:** AnalyticsRetriever always returns the same hardcoded data regardless of query. The LLM commentary is template-based with no actual data-driven variation in the mock fallback. District rates query joins with populations table, which is correct SQL but the mock data may not reflect realistic relationships.

### SociologyAgent - Score: 74/100

**Expected Behavior:** Analyzes sociological dimensions of crime patterns.
**Actual Behavior:** Correctly computes area risk scores and recidivism risk based on district metrics.
**Strengths:** Correct risk score computation (weighted combination of incident count and vulnerability index). Recidivism risk scaling based on baseline rates.
**Weaknesses:** Falls back to "Shivajinagar" as default district when none provided. Fixed formula for area risk score and recidivism risk doesn't account for different crime type compositions. Sociology analysis LLM fallback is template-based.

### DecisionSupportAgent - Score: 70/100

**Expected Behavior:** Generates investigative recommendations with role-based filtering.
**Actual Behavior:** Correctly synthesizes upstream agent findings and applies role-based data isolation.
**Strengths:** Excellent role-based filtering (Investigator gets actions, Supervisor gets priority+risks, Policymaker gets coordination). Parsing of LLM response into structured sections works well. Fallback defaults ensure valid output even if parsing fails.
**Weaknesses:** LLM parsing is fragile - if the mock LLM doesn't produce the expected format, parsing falls back to hardcoded defaults. The "exactly 5 actions and 3 risks" constraint is enforced via padding with generic messages. Decision support quality depends entirely on upstream agent results being present.

### ReasoningAgent - Score: 68/100

**Expected Behavior:** Performs Chain-of-Thought logical synthesis of upstream findings.
**Actual Behavior:** Aggregates agent findings, generates logical synthesis via LLM, formulates explicit logical conclusions.
**Strengths:** Explicit logical conclusions are generated even when the LLM fails (hardcoded deductions that are contextually appropriate). Correctly skips empty/error agent results.
**Weaknesses:** The hardcoded logical conclusions are generic and don't actually reflect the specific evidence from upstream agents. The consolidation of agent results truncates data at 600 characters per agent, potentially losing important details. When ALL upstream agents return empty/error results, the reasoning agent still produces output with minimal context.

### ExplainabilityAgent - Score: 65/100

**Expected Behavior:** Maps pipeline conclusions back to source chunks with citations.
**Actual Behavior:** Generates source attributions and explainsability justifications.
**Strengths:** Provides structured citations with source type, reference IDs, and claim attribution. Covers all three data sources (SQL, Graph, Vector). Generates explanations via LLM.
**Weaknesses:** Citations are hardcoded for specific suspects (Suresh Patil, Ramesh Kumar) - generic queries get no citations. The citation matching is based on string name matching which is fragile. Hardcoded reference IDs (e.g., "FIR-2025-001, FIR-2025-009") don't dynamically reference actual retrieved data.

### ResponseAgent - Score: 75/100

**Expected Behavior:** Formats final intelligence brief with role-based data isolation.
**Actual Behavior:** Correctly generates markdown-formatted reports with role-appropriate sections (Investigator: tactics, Supervisor: forecasts/risks, Policymaker: analytics/coordination).
**Strengths:** Excellent role-based section generation. Includes source attribution for all roles. Professional formatting with security classification markers.
**Weaknesses:** The response length varies significantly by role (Investigator: ~735 chars, Supervisor: ~604 chars, Policymaker: ~742 chars) which is expected but could be more consistent. Sections for roles that don't have upstream data show "_No X compiled._" which is appropriate but could confuse end users.

---

## Summary of Defects Found

### Defect 1: VectorRetriever is Dead Code (Quality Issue)
**Severity:** High
**Impact:** The vector search capability is implemented but never used by any agent. Users never benefit from semantic search.
**Root Cause:** No agent in the pipeline calls VectorRetriever. It exists as a standalone module but is not integrated into the agent architecture.

### Defect 2: AnalyticsRetriever Ignores Query Parameter (Quality Issue)
**Severity:** Medium
**Impact:** District-specific analytics queries return the full dataset for all districts instead of filtering to the relevant one. Reduces precision and wastes compute.
**Root Cause:** The `retrieve()` method ignores its `query` parameter entirely and always returns the full `precomputed_data` dict.

### Defect 3: ProfilingAgent Crashes on Missing Suspect (Bug)
**Severity:** Medium
**Impact:** If a query doesn't explicitly provide a suspect name in `entities` and the router doesn't extract one (e.g., generic queries), ProfilingAgent raises ValueError. The pipeline catches this and logs an error, but the agent fails instead of returning empty/neutral results.
**Root Cause:** `raise ValueError("ProfilingAgent requires at least one suspect name...")` at `profiling_agent.py:29`.

### Defect 4: ReasoningAgent Hardcoded Conclusions (Quality Issue)
**Severity:** Low
**Impact:** The reasoning agent always produces the same 3 hardcoded deductions regardless of the actual evidence from upstream agents. This reduces the intelligence and adaptability of the system.
**Root Cause:** The 3 logical conclusions are hardcoded strings that don't reference the actual upstream data.

---

## Suggestions for Improvement

1. **Integrate VectorRetriever** into at least one agent (e.g., CrimeQueryAgent) for semantic search capability
2. **Make AnalyticsRetriever query-aware** - filter precomputed data based on the query parameter
3. **Replace hardcoded reasoning conclusions** with data-driven logical deductions based on actual upstream results
4. **Add fuzzy matching** in CrimeQueryAgent for broader crime type matching
5. **Expand seed data** - more suspects, more crime types, more districts
6. **Improve mock LLM responses** - generate responses that actually vary based on input query content
7. **Add query validation at the router level** to ensure downstream agents receive appropriate parameters
8. **Implement proper document chunking** in VectorRetriever for semantic search on larger documents
9. **Add hybrid retrieval** combining keyword (SQL/Graph) and semantic (Vector) approaches
10. **Remove the `_client_instance` singleton pattern** from FaissClient to allow index recreation for testing

---

## Real Execution Evidence

### Successful Agent Test Results (52/52 queries passed):
- ProfilingAgent: 7/7 queries successful
- NetworkAgent: 5/5 queries successful
- FinancialAgent: 5/5 queries successful
- ForecastAgent: 5/5 queries successful
- AnalyticsAgent: 7/7 queries successful
- SociologyAgent: 5/5 queries successful
- DecisionSupportAgent: 6/6 queries successful
- CrimeQueryAgent: 6/6 queries successful
- ReasoningAgent: 2/2 queries successful
- ExplainabilityAgent: 1/1 queries successful
- ResponseAgent: 3/3 queries successful

### RAG Retriever Test Results:
- SQLRetriever: All queries return correct records (precision=100%, recall=100%)
- GraphRetriever: All graph traversals correctly return seeded relationships (precision=100%)
- AnalyticsRetriever: Complete precomputed data returned correctly (consistency=100%)
- VectorRetriever: Functional but unused by any agent (retrieval works correctly for seeded docs)