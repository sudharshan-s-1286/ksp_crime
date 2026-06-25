# Member 2 — Intelligence Retrieval Agents

**Module:** First-layer intelligence retrieval for KSP Crime Copilot  
**Branch:** shanjana  
**Owner:** Member 2

## Folder Structure

```
member_2/
├── rag/
│   └── graph_retriever.py       # Neo4j graph query layer (5 Cypher methods)
├── agents/
│   ├── crime_query_agent.py     # FIR & crime record agent
│   └── network_agent.py         # Criminal network analysis agent
├── tests/
│   └── test_agents.py           # Pytest suite — 6 tests, all pass
├── pytest.ini                   # asyncio_mode = auto
└── PROJECT_DOCUMENTATION.md     # Full implementation details
```

## What This Module Does

- `GraphRetriever` — wraps Neo4j with 5 Cypher queries: network traversal, cluster detection, shortest path, co-accused lookup, hub detection. All outputs are JSON-serializable plain dicts.
- `CrimeQueryAgent` — merges SQL crime records with graph co-accused data, deduplicates by FIR ID, generates a Gemini-powered 150-word investigative summary.
- `NetworkAgent` — computes degree centrality, flags High-Value Targets (centrality > 5), calculates network metrics (density, avg_degree, cluster_count), generates a 200-word intelligence narrative.

## Run Tests

```bash
pip install pytest pytest-asyncio
pytest tests/test_agents.py -v
```

## Integration

All agents use dependency injection via Protocol interfaces.  
Replace mock clients with real `Neo4jClient`, `SQLRetriever`, and `GeminiClient` at integration time — no agent code changes needed.
