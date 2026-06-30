import sys
import os
import traceback

# 1. Fix sys.path automatically
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

def print_section(title: str):
    print("\n" + "="*80)
    print(f" {title.upper()} ".center(80, "="))
    print("="*80)

overall_status = "PASS"

# 2. Mock LLM to handle missing API keys gracefully
print("Initializing Environment and Mocking Dependencies...")
try:
    from backend.config import settings
    original_call_llm = getattr(settings, 'call_llm', None)
    def mock_call_llm(prompt: str, *args, **kwargs) -> str:
        return "[MOCK LLM RESPONSE] API unavailable or bypassed for demo."
    settings.call_llm = mock_call_llm
except Exception as e:
    print(f"[FAIL] Failed to import settings for mocking: {e}")
    overall_status = "FAIL"

# Patch call_llm directly in all agents just in case they imported it directly
agent_modules = [
    "profiling_agent", "analytics_agent", "forecast_agent",
    "decision_support_agent", "sociology_agent", "financial_agent",
    "network_agent", "master_agent", "crime_query_agent",
    "reasoning_agent", "explainability_agent", "response_agent"
]
for mod_name in agent_modules:
    try:
        mod = __import__(f"backend.agents.{mod_name}", fromlist=["call_llm"])
        if hasattr(mod, "call_llm"):
            mod.call_llm = mock_call_llm
    except Exception:
        pass

# Import Agent schemas
AgentInput = None
try:
    from backend.contracts.agent_schemas import AgentInput
except Exception as e:
    print(f"[FAIL] Failed to import AgentInput: {e}")
    overall_status = "FAIL"

# Import Retrievers
SQLRetriever = VectorRetriever = GraphRetriever = AnalyticsRetriever = None
try:
    from backend.rag.sql_retriever import SQLRetriever
except Exception: pass

try:
    from backend.rag.vector_retriever import VectorRetriever
except Exception: pass

try:
    from backend.rag.graph_retriever import GraphRetriever
except Exception: pass

try:
    from backend.rag.analytics_retriever import AnalyticsRetriever
except Exception: pass


# Import Agents
ProfilingAgent = AnalyticsAgent = ForecastAgent = None
DecisionSupportAgent = SociologyAgent = FinancialAgent = NetworkAgent = None
CopilotPipeline = None

try: from backend.agents.profiling_agent import ProfilingAgent
except Exception: pass
try: from backend.agents.analytics_agent import AnalyticsAgent
except Exception: pass
try: from backend.agents.forecast_agent import ForecastAgent
except Exception: pass
try: from backend.agents.decision_support_agent import DecisionSupportAgent
except Exception: pass
try: from backend.agents.sociology_agent import SociologyAgent
except Exception: pass
try: from backend.agents.financial_agent import FinancialAgent
except Exception: pass
try: from backend.agents.network_agent import NetworkAgent
except Exception: pass
try: from backend.orchestration.pipeline import CopilotPipeline
except Exception: pass


def run_tests():
    global overall_status

    print_section("SECTION 1: RAG RETRIEVERS")

    # 1. SQLRetriever
    try:
        if not SQLRetriever: raise Exception("SQLRetriever import failed")
        sr = SQLRetriever()
        res = sr.retrieve("SELECT * FROM firs LIMIT 1")
        print("[PASS] SQLRetriever")
    except Exception as e:
        print(f"[FAIL] SQLRetriever: {e}")
        overall_status = "FAIL"

    # 2. VectorRetriever
    try:
        if not VectorRetriever: raise Exception("VectorRetriever import failed")
        vr = VectorRetriever()
        res = vr.retrieve("financial crimes", k=1)
        print("[PASS] VectorRetriever")
    except Exception as e:
        print(f"[FAIL] VectorRetriever: {e}")
        overall_status = "FAIL"

    # 3. GraphRetriever
    try:
        if not GraphRetriever: raise Exception("GraphRetriever import failed")
        gr = GraphRetriever()
        res = gr.retrieve(["Suresh Patil"])
        print("[PASS] GraphRetriever")
    except Exception as e:
        print(f"[FAIL] GraphRetriever: {e}")
        overall_status = "FAIL"

    # 4. AnalyticsRetriever
    try:
        if not AnalyticsRetriever: raise Exception("AnalyticsRetriever import failed")
        ar = AnalyticsRetriever()
        res = ar.retrieve("Shivajinagar")
        print("[PASS] AnalyticsRetriever")
    except Exception as e:
        print(f"[FAIL] AnalyticsRetriever: {e}")
        overall_status = "FAIL"

    
    print_section("SECTION 2: INDIVIDUAL AGENTS")

    prof_data = {}
    anal_data = {}
    fore_data = {}

    # ProfilingAgent
    try:
        if not ProfilingAgent: raise Exception("ProfilingAgent import failed")
        agent = ProfilingAgent()
        inp = AgentInput(
            query="Analyze Suresh Patil",
            entities={"person_names": ["Suresh Patil"]}
        ) if AgentInput else {"query": "Analyze Suresh Patil", "entities": {"person_names": ["Suresh Patil"]}}
        out = agent.run(inp)
        prof_data = out.data
        if out.data.get("status") == "error": raise Exception(out.data.get("error_message"))
        print("[PASS] ProfilingAgent")
        print(f"  -> Target: {out.data.get('profile_fields', {}).get('target_persons')}")
        print(f"  -> Risk Indicators: len={len(out.data.get('risk_indicators', []))}")
    except Exception as e:
        print(f"[FAIL] ProfilingAgent: {e}")
        overall_status = "FAIL"

    # AnalyticsAgent
    try:
        if not AnalyticsAgent: raise Exception("AnalyticsAgent import failed")
        agent = AnalyticsAgent()
        inp = AgentInput(query="Aggregate hotspots") if AgentInput else {"query": "Aggregate hotspots"}
        out = agent.run(inp)
        anal_data = out.data
        if out.data.get("status") == "error": raise Exception(out.data.get("error_message"))
        print("[PASS] AnalyticsAgent")
        print(f"  -> Hotspots count: {len(out.data.get('hotspots', []))}")
    except Exception as e:
        print(f"[FAIL] AnalyticsAgent: {e}")
        overall_status = "FAIL"

    # ForecastAgent
    try:
        if not ForecastAgent: raise Exception("ForecastAgent import failed")
        agent = ForecastAgent()
        inp = AgentInput(query="Project crime trends") if AgentInput else {"query": "Project crime trends"}
        out = agent.run(inp)
        fore_data = out.data
        if out.data.get("status") == "error": raise Exception(out.data.get("error_message"))
        print("[PASS] ForecastAgent")
        print(f"  -> Forecasts count: {len(out.data.get('forecasts', {}))}")
        print(f"  -> Alerts count: {len(out.data.get('alerts', []))}")
    except Exception as e:
        print(f"[FAIL] ForecastAgent: {e}")
        overall_status = "FAIL"

    # DecisionSupportAgent
    try:
        if not DecisionSupportAgent: raise Exception("DecisionSupportAgent import failed")
        agent = DecisionSupportAgent()
        inp = AgentInput(
            query="Generate decision support",
            context={"role": "Supervisor"},
            agent_results={
                "profiling_agent": prof_data,
                "analytics_agent": anal_data,
                "forecast_agent": fore_data
            }
        ) if AgentInput else {
            "query": "Generate decision support",
            "context": {"role": "Supervisor"},
            "agent_results": {
                "profiling_agent": prof_data,
                "analytics_agent": anal_data,
                "forecast_agent": fore_data
            }
        }
        out = agent.run(inp)
        if out.data.get("status") == "error": raise Exception(out.data.get("error_message"))
        print("[PASS] DecisionSupportAgent")
        print(f"  -> Priority Score: {out.data.get('priority_score')}")
    except Exception as e:
        print(f"[FAIL] DecisionSupportAgent: {e}")
        overall_status = "FAIL"

    # SociologyAgent
    try:
        if not SociologyAgent: raise Exception("SociologyAgent import failed")
        agent = SociologyAgent()
        inp = AgentInput(
            query="Assess demographics",
            context={"district": "Shivajinagar"}
        ) if AgentInput else {"query": "Assess demographics", "context": {"district": "Shivajinagar"}}
        out = agent.run(inp)
        if out.data.get("status") == "error": raise Exception(out.data.get("error_message"))
        print("[PASS] SociologyAgent")
        print(f"  -> Area Risk Score: {out.data.get('area_risk_score')}")
        print(f"  -> Recidivism Risk: {out.data.get('recidivism_risk')}")
    except Exception as e:
        print(f"[FAIL] SociologyAgent: {e}")
        overall_status = "FAIL"

    # FinancialAgent
    try:
        if not FinancialAgent: raise Exception("FinancialAgent import failed")
        agent = FinancialAgent()
        inp = AgentInput(
            query="Detect money laundering",
            entities={"person_names": ["Ramesh Kumar"]}
        ) if AgentInput else {"query": "Detect money laundering", "entities": {"person_names": ["Ramesh Kumar"]}}
        out = agent.run(inp)
        if out.data.get("status") == "error": raise Exception(out.data.get("error_message"))
        print("[PASS] FinancialAgent")
        print(f"  -> Risk Score: {out.data.get('risk_score')}")
        print(f"  -> Shell Companies: len={len(out.data.get('shell_companies', []))}")
    except Exception as e:
        print(f"[FAIL] FinancialAgent: {e}")
        overall_status = "FAIL"
        
    # NetworkAgent
    try:
        if not NetworkAgent: raise Exception("NetworkAgent import failed")
        agent = NetworkAgent()
        inp = AgentInput(
            query="Analyze network",
            entities={"person_names": ["Suresh Patil"]}
        ) if AgentInput else {"query": "Analyze network", "entities": {"person_names": ["Suresh Patil"]}}
        out = agent.run(inp)
        if out.data.get("status") == "error": raise Exception(out.data.get("error_message"))
        print("[PASS] NetworkAgent")
        print(f"  -> Central Hubs: {out.data.get('central_hubs')}")
    except Exception as e:
        print(f"[FAIL] NetworkAgent: {e}")
        overall_status = "FAIL"


    print_section("SECTION 3: INTEGRATED PIPELINE")

    try:
        if not CopilotPipeline: raise Exception("CopilotPipeline import failed")
        pipeline = CopilotPipeline()
        out = pipeline.execute(
            session_id="test_session_123",
            query="Provide a complete intelligence audit on suspect Suresh Patil",
            role="Investigator"
        )
        if out.data.get("status") == "error": raise Exception(out.data.get("error_message"))
        print("[PASS] CopilotPipeline (End-to-End)")
        print("  -> Response length:", len(out.data.get("markdown_response", "")))
    except Exception as e:
        print(f"[FAIL] CopilotPipeline: {e}")
        overall_status = "FAIL"

    print_section("FINAL SUMMARY")
    print(f"OVERALL STATUS: {overall_status}")
    
    if overall_status == "FAIL":
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
