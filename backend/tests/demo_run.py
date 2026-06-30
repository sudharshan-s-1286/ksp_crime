import sys
import os
import traceback

# Fix sys.path automatically inside demo_run.py so it works when run from backend folder.
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
parent_dir = os.path.dirname(backend_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

print("==================================================")
print("KSP CRIME COPILOT DEMO RUN")
print("==================================================")
print()

overall_status = "PASS"

# Mock LLM call to gracefully handle missing API keys
try:
    from backend.config import settings
    original_call_llm = getattr(settings, 'call_llm', None)
    def mock_call_llm(prompt: str, *args, **kwargs) -> str:
        return "[MOCK LLM RESPONSE] API unavailable or bypassed for demo."
    settings.call_llm = mock_call_llm
except ImportError as e:
    print(f"[FAIL] Failed to import settings for mocking: {e}")
    overall_status = "FAIL"

try:
    # Patch call_llm in all potential modules to be safe
    import backend.agents.financial_agent
    backend.agents.financial_agent.call_llm = mock_call_llm
except Exception:
    pass

try:
    import backend.agents.network_agent
    backend.agents.network_agent.call_llm = mock_call_llm
except Exception:
    pass

try:
    import backend.agents.sociology_agent
    backend.agents.sociology_agent.call_llm = mock_call_llm
except Exception:
    pass


# Import Retrievers and Agents individually to handle missing dependencies gracefully
VectorRetriever = GraphRetriever = AnalyticsRetriever = None
FinancialAgent = NetworkAgent = SociologyAgent = AgentInput = None

try:
    from backend.contracts.agent_schemas import AgentInput
except Exception as e:
    print(f"[FAIL] AgentInput import failed: {e}")

try:
    from backend.rag.vector_retriever import VectorRetriever
except Exception as e:
    print(f"[FAIL] VectorRetriever import failed: {e}")

try:
    from backend.rag.graph_retriever import GraphRetriever
except Exception as e:
    print(f"[FAIL] GraphRetriever import failed: {e}")

try:
    from backend.rag.analytics_retriever import AnalyticsRetriever
except Exception as e:
    print(f"[FAIL] AnalyticsRetriever import failed: {e}")

try:
    from backend.agents.financial_agent import FinancialAgent
except Exception as e:
    print(f"[FAIL] FinancialAgent import failed: {e}")

try:
    from backend.agents.network_agent import NetworkAgent
except Exception as e:
    print(f"[FAIL] NetworkAgent import failed: {e}")

try:
    from backend.agents.sociology_agent import SociologyAgent
except Exception as e:
    print(f"[FAIL] SociologyAgent import failed: {e}")



# SECTION 1: RAG TESTS
print("SECTION 1: RAG TESTS")
print("-" * 50)

try:
    vr = VectorRetriever()
    vr_res = vr.retrieve("Ramesh Kumar financial crimes", k=1)
    print("[PASS] VectorRetriever")
    print(f"  -> Retrieved {len(vr_res)} chunks")
except Exception as e:
    print(f"[FAIL] VectorRetriever: {e}")
    overall_status = "FAIL"

try:
    gr = GraphRetriever()
    gr_res = gr.retrieve(["Suresh Patil"])
    print("[PASS] GraphRetriever")
    print(f"  -> Retrieved {len(gr_res)} chunks")
except Exception as e:
    print(f"[FAIL] GraphRetriever: {e}")
    overall_status = "FAIL"

try:
    ar = AnalyticsRetriever()
    ar_res = ar.retrieve("Shivajinagar")
    print("[PASS] AnalyticsRetriever")
    print(f"  -> Retrieved {len(ar_res)} chunks")
except Exception as e:
    print(f"[FAIL] AnalyticsRetriever: {e}")
    overall_status = "FAIL"

print("\nSECTION 2: AGENT TESTS")
print("-" * 50)



def print_agent_output(agent_name, output):
    status = output.data.get("status", "success")
    if status == "error":
        print(f"[FAIL] {agent_name} (Internal Error)")
        print(f"  -> error: {output.data.get('error_message')}")
        global overall_status
        overall_status = "FAIL"
        return

    print(f"[PASS] {agent_name}")
    print(f"  -> success: True")
    # Confidence is not strictly defined in all output schemas, but we can print if exists
    if "confidence" in output.data:
        print(f"  -> confidence: {output.data['confidence']}")
    print(f"  -> output keys: {list(output.data.keys())}")
    
    # Print important metrics if present
    metrics = ["risk_score", "central_hubs", "area_risk_score", "recidivism_risk"]
    for m in metrics:
        if m in output.data:
            print(f"  -> {m}: {output.data[m]}")

try:
    fa = FinancialAgent()
    mock_input1 = AgentInput(
        query="Ramesh Kumar financial crimes",
        entity_id="Ramesh Kumar",
        entities={"person_names": ["Ramesh Kumar"]}
    ) if AgentInput else {"query": "Ramesh Kumar financial crimes", "entity_id": "Ramesh Kumar", "entities": {"person_names": ["Ramesh Kumar"]}}
    fa_out = fa.run(mock_input1)
    print_agent_output("FinancialAgent", fa_out)
except Exception as e:
    print(f"[FAIL] FinancialAgent: {e}")
    overall_status = "FAIL"

try:
    na = NetworkAgent()
    mock_input2 = AgentInput(
        query="criminal network around Suresh Patil",
        entity_id="Suresh Patil",
        entities={"person_names": ["Suresh Patil"]}
    ) if AgentInput else {"query": "criminal network around Suresh Patil", "entity_id": "Suresh Patil", "entities": {"person_names": ["Suresh Patil"]}}
    na_out = na.run(mock_input2)
    print_agent_output("NetworkAgent", na_out)
except Exception as e:
    print(f"[FAIL] NetworkAgent: {e}")
    overall_status = "FAIL"

try:
    sa = SociologyAgent()
    mock_input3 = AgentInput(
        query="crime trends in Shivajinagar",
        entity_id="Shivajinagar",
        entities={"locations": ["Shivajinagar"]}
    ) if AgentInput else {"query": "crime trends in Shivajinagar", "entity_id": "Shivajinagar", "entities": {"locations": ["Shivajinagar"]}}
    sa_out = sa.run(mock_input3)
    print_agent_output("SociologyAgent", sa_out)
except Exception as e:
    print(f"[FAIL] SociologyAgent: {e}")
    overall_status = "FAIL"

print("\nSECTION 3: SUMMARY")
print("-" * 50)
print(f"OVERALL STATUS: {overall_status}")
if overall_status == "FAIL":
    sys.exit(1)
