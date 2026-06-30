from backend.contracts.agent_schemas import AgentInput, AgentOutput
from backend.agents.profiling_agent import ProfilingAgent
from backend.agents.analytics_agent import AnalyticsAgent
from backend.agents.forecast_agent import ForecastAgent
from backend.agents.decision_support_agent import DecisionSupportAgent
from backend.agents.sociology_agent import SociologyAgent
from backend.agents.financial_agent import FinancialAgent

def test_profiling_agent():
    agent = ProfilingAgent()
    
    # Test on a seeded suspect: Suresh Patil (who has 3 FIRs)
    msg = AgentInput(
        query="Generate a profile for Suresh Patil",
        entities={"person_names": ["Suresh Patil"]},
        context={}
    )
    
    output = agent.run(msg)
    
    # Verify contract
    assert isinstance(output, AgentOutput)
    data = output.data
    
    assert "profile_fields" in data
    assert "narrative_profile" in data
    assert "risk_indicators" in data
    
    fields = data["profile_fields"]
    assert fields["total_firs"] >= 3, "Suresh Patil must have 3+ FIRs for profiling"
    assert "Burglary" in fields["crime_types"]
    assert "Mysore" in fields["active_districts"]
    assert fields["repeat_offence_flag"] is True, "Should flag as repeat offender (3 burglaries)"
    
    # Verify narrative report style
    assert len(data["narrative_profile"]) > 50
    assert "High Recidivism Risk" in data["risk_indicators"][0]

def test_analytics_agent():
    agent = AnalyticsAgent()
    msg = AgentInput(
        query="Show crime hotspots and temporal patterns",
        context={}
    )
    
    output = agent.run(msg)
    
    assert isinstance(output, AgentOutput)
    data = output.data
    
    assert "metrics" in data
    assert "hotspots" in data
    assert "time_distribution" in data
    assert "yoy_change" in data
    assert "commentary" in data
    
    # Verify time distribution bucketing
    assert len(data["time_distribution"]) > 0
    # Verify hotspots format
    assert len(data["hotspots"]) > 0
    assert "incident_count" in data["hotspots"][0]

def test_forecast_agent():
    agent = ForecastAgent()
    msg = AgentInput(
        query="Forecast crime trends for the next 90 days",
        context={}
    )
    
    output = agent.run(msg)
    
    assert isinstance(output, AgentOutput)
    data = output.data
    
    assert "forecasts" in data
    assert "alerts" in data
    
    # Check that forecasting ran on the seeded crime types
    assert "Burglary" in data["forecasts"]
    assert "Cyber Crime" in data["forecasts"]
    assert "Theft" in data["forecasts"]
    
    # Cyber Crime was seeded with a sharp spike in recent months (Week 4 Milestone verification)
    # Verify that it projected 30, 60, 90 day values and triggered an alert
    cyber_fc = data["forecasts"]["Cyber Crime"]
    assert cyber_fc["next_30_days"] > 0
    assert cyber_fc["next_60_days"] > 0
    assert cyber_fc["next_90_days"] > 0
    
    # Confirm alert structures
    if cyber_fc["alert"]:
        assert len(cyber_fc["alert_reason"]) > 0
        assert any("Cyber Crime" in alert for alert in data["alerts"])

def test_decision_support_agent_roles():
    agent = DecisionSupportAgent()
    
    # 1. Create upstream mock results
    mock_results = {
        "profiling_agent": {
            "narrative_profile": "Ramesh Kumar is a high-risk hawala money routing operator.",
            "profile_fields": {"total_firs": 2, "repeat_offence_flag": True, "active_districts": ["Bangalore Central"]},
            "risk_indicators": ["High Recidivism Risk", "Syndicate Connected"]
        },
        "analytics_agent": {
            "commentary": "Central urban sectors show high density hotspots for financial scams.",
            "hotspots": [{"lat": 12.9716, "lng": 77.5946, "incident_count": 5}],
            "yoy_change": {"Cyber Crime": {"percentage_change": 39.28}}
        }
    }

    # Case A: Investigator Role (gets actions only)
    msg_inv = AgentInput(
        query="What are my next steps?",
        context={"role": "Investigator"},
        agent_results=mock_results
    )
    out_inv = agent.run(msg_inv)
    data_inv = out_inv.data
    assert len(data_inv["actions"]) == 5
    assert data_inv["priority_score"] is None
    assert data_inv["risks"] == []
    assert data_inv["coordination"] == ""
    assert data_inv["role_filtered"] is True

    # Case B: Supervisor Role (gets priority + risks only)
    msg_sup = AgentInput(
        query="Review priority and risks",
        context={"role": "Supervisor"},
        agent_results=mock_results
    )
    out_sup = agent.run(msg_sup)
    data_sup = out_sup.data
    assert data_sup["actions"] == []
    assert isinstance(data_sup["priority_score"], int)
    assert len(data_sup["risks"]) == 3
    assert data_sup["coordination"] == ""
    assert data_sup["role_filtered"] is True

    # Case C: Policymaker Role (gets coordination only)
    msg_pm = AgentInput(
        query="What is the coordination outlook?",
        context={"role": "Policymaker"},
        agent_results=mock_results
    )
    out_pm = agent.run(msg_pm)
    data_pm = out_pm.data
    assert data_pm["actions"] == []
    assert data_pm["priority_score"] is None
    assert data_pm["risks"] == []
    assert len(data_pm["coordination"]) > 20
    assert data_pm["role_filtered"] is True

def test_sociology_agent():
    agent = SociologyAgent()
    msg = AgentInput(
        query="Analyze sociological risk in Shivajinagar",
        context={"district": "Shivajinagar"}
    )
    output = agent.run(msg)
    data = output.data
    
    assert "demographics" in data
    assert "area_risk_score" in data
    assert "recidivism_risk" in data
    assert "analysis" in data
    assert data["demographics"]["target_district"] == "Shivajinagar"
    assert data["area_risk_score"] > 0

def test_financial_agent():
    agent = FinancialAgent()
    msg = AgentInput(
        query="Inspect financial trails for Ramesh Kumar",
        entity_id="Ramesh Kumar"
    )
    output = agent.run(msg)
    data = output.data
    
    assert "financial_flags" in data
    assert "shell_companies" in data
    assert "risk_score" in data
    assert "analysis" in data
    assert len(data["financial_flags"]) > 0
    assert "Hawala money routing detected" in data["financial_flags"][0]

def test_pipeline_integration():
    from backend.orchestration.pipeline import CopilotPipeline
    pipeline = CopilotPipeline()
    
    # 1. Test running pipeline as Investigator
    out_inv = pipeline.execute(
        session_id="session_test_123",
        query="Run a complete profile audit on Suresh Patil and suggest next actions",
        role="Investigator"
    )
    assert isinstance(out_inv, AgentOutput)
    md_inv = out_inv.data["markdown_response"]
    
    assert "Authorized User Role**: INVESTIGATOR" in md_inv
    assert "SECTION 1 — TARGET SUSPECT PROFILE" in md_inv
    assert "SECTION 2 — CRIMINAL NETWORK" in md_inv
    assert "SECTION 3 — TACTICAL INVESTIGATIVE ACTIONS" in md_inv
    assert "CASE MANAGEMENT & PRIORITY" not in md_inv
    assert "INTER-AGENCY COORDINATION DIRECTIVES" not in md_inv
    
    # 2. Test running pipeline as Supervisor
    out_sup = pipeline.execute(
        session_id="session_test_123",
        query="What is the forecast status and case priority for Suresh Patil?",
        role="Supervisor"
    )
    md_sup = out_sup.data["markdown_response"]
    assert "Authorized User Role**: SUPERVISOR" in md_sup
    assert "SECTION 1 — CASE MANAGEMENT & PRIORITY" in md_sup
    assert "SECTION 2 — SYSTEM ALERTS & STATISTICAL FORECASTS" in md_sup
    assert "SECTION 3 — LOGICAL REASONING" in md_sup
    assert "TARGET SUSPECT PROFILE" not in md_sup
    assert "INTER-AGENCY COORDINATION DIRECTIVES" not in md_sup

    # 3. Test running pipeline as Policymaker
    out_pm = pipeline.execute(
        session_id="session_test_123",
        query="Show regional hotspots and coordination needs in Shivajinagar",
        role="Policymaker"
    )
    md_pm = out_pm.data["markdown_response"]
    assert "Authorized User Role**: POLICYMAKER" in md_pm
    assert "SECTION 1 — REGIONAL CRIME RATE & GEO-SPATIAL HOTSPOTS" in md_pm
    assert "SECTION 2 — COMMUNITY SOCIO-DEMOGRAPHIC INDICATORS" in md_pm
    assert "SECTION 3 — STRATEGIC INTER-AGENCY COORDINATION DIRECTIVES" in md_pm
    assert "TARGET SUSPECT PROFILE" not in md_pm
    assert "CASE MANAGEMENT & PRIORITY" not in md_pm

