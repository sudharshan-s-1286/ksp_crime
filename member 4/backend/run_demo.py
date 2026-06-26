import json
import sys
from backend.contracts.agent_schemas import AgentInput
from backend.agents.profiling_agent import ProfilingAgent
from backend.agents.analytics_agent import AnalyticsAgent
from backend.agents.forecast_agent import ForecastAgent
from backend.agents.decision_support_agent import DecisionSupportAgent
from backend.agents.sociology_agent import SociologyAgent
from backend.agents.financial_agent import FinancialAgent

def print_section(title: str):
    print("\n" + "="*80)
    print(f" {title.upper()} ".center(80, "="))
    print("="*80)

def main():
    print_section("ksp crime copilot - member 4 intelligence pipeline demo")
    print("Initializing Agents and Database Retrievers...")
    
    # Instantiate all agents
    profiling_agent = ProfilingAgent()
    analytics_agent = AnalyticsAgent()
    forecast_agent = ForecastAgent()
    decision_agent = DecisionSupportAgent()
    sociology_agent = SociologyAgent()
    financial_agent = FinancialAgent()
    
    print("Initialization completed successfully.\n")

    # --- 1. PROFILING AGENT DEMO ---
    print_section("1. Profiling Agent (Target: Suresh Patil)")
    profiling_input = AgentInput(
        query="Analyze offender records and network for Suresh Patil",
        entities={"person_names": ["Suresh Patil"]}
    )
    profiling_output = profiling_agent.run(profiling_input)
    prof_data = profiling_output.data
    
    print(f"Suspect Names Analysed: {prof_data['profile_fields']['target_persons']}")
    print(f"Total FIRs Found: {prof_data['profile_fields']['total_firs']}")
    print(f"Active Districts: {prof_data['profile_fields']['active_districts']}")
    print(f"Crime Categories: {prof_data['profile_fields']['crime_types']}")
    print(f"Criminal Activity Date Range: {prof_data['profile_fields']['date_range']}")
    print(f"Co-accused Network Connections: {prof_data['profile_fields']['co_accused_links']} active links")
    print(f"Repeat Offender Flag: {prof_data['profile_fields']['repeat_offence_flag']}")
    print(f"Modus Operandi Summary: {prof_data['profile_fields']['modus_operandi_summary']}")
    print(f"Identified Risk Indicators: {prof_data['risk_indicators']}")
    print("\nNarrative Intelligence Profile Report:")
    print("-" * 50)
    print(prof_data['narrative_profile'])
    print("-" * 50)

    # --- 2. ANALYTICS AGENT DEMO ---
    print_section("2. Analytics Agent (Regional & Temporal Trends)")
    analytics_input = AgentInput(query="Aggregate statewide crime hotspots and spatial patterns")
    analytics_output = analytics_agent.run(analytics_input)
    anal_data = analytics_output.data
    
    print("Top Geo-Spatial Hotspots (Lat, Lng, Density):")
    for idx, hotspot in enumerate(anal_data["hotspots"]):
        print(f"  [{idx+1}] District: {hotspot['district']} | Lat/Lng: {hotspot['lat']:.4f}, {hotspot['lng']:.4f} | Incidents: {hotspot['incident_count']}")
    
    print("\nTemporal Incident Distribution (Time of Day):")
    for bucket, count in anal_data["time_distribution"].items():
        print(f"  - {bucket}: {count} incidents")
        
    print("\nYear-over-Year (YoY) Crime Volume Changes:")
    for crime, trend in anal_data["yoy_change"].items():
        print(f"  - {crime}: Prev Year = {trend['previous_year_count']} | Current = {trend['current_year_count']} | Change = {trend['percentage_change']}%")
        
    print("\nDistrict-level Per-Capita Crime Rates (Per 100k population):")
    for rate in anal_data["metrics"]["district_crime_rates"]:
        print(f"  - {rate['district']}: Population = {rate['population']:,} | Incidents = {rate['crime_count']} | Rate = {rate['crime_rate']} per 100k")

    print("\nAnalyst Commentary (LLM Generated):")
    print("-" * 50)
    print(anal_data["commentary"])
    print("-" * 50)

    # --- 3. FORECAST AGENT DEMO ---
    print_section("3. Forecast Agent (Linear Regression Projections)")
    forecast_input = AgentInput(query="Project crime trends for the next quarter")
    forecast_output = forecast_agent.run(forecast_input)
    fore_data = forecast_output.data
    
    print("30, 60, and 90-Day Statistical Projections:")
    for crime, fc in fore_data["forecasts"].items():
        print(f"\n  * Crime Type: {crime.upper()}")
        print(f"    - Historical Monthly Mean: {fc['historical_mean']} (Std Dev: {fc['historical_std']})")
        print(f"    - Projected (Next 30 Days): {fc['next_30_days']} cases")
        print(f"    - Projected (Next 60 Days): {fc['next_60_days']} cases")
        print(f"    - Projected (Next 90 Days): {fc['next_90_days']} cases")
        print(f"    - Early Warning Alert Triggered: {fc['alert']}")
        if fc['alert']:
            print(f"      Reason: {fc['alert_reason']}")

    if fore_data["alerts"]:
        print("\nActive System Alerts:")
        for alert in fore_data["alerts"]:
            print(f"  [ALERT] {alert}")

    # --- 4. DECISION SUPPORT AGENT DEMO ---
    print_section("4. Decision Support Agent (Role-based Filtering)")
    
    # Synthesizing upstream results to feed Decision Support
    upstream_results = {
        "profiling_agent": prof_data,
        "analytics_agent": anal_data
    }
    
    # A. Investigator Role
    print(">>> A. Running for Role: INVESTIGATOR (Authorized for Tactical Action Steps)")
    dec_input_inv = AgentInput(
        query="Generate decision support briefing",
        context={"role": "Investigator"},
        agent_results=upstream_results
    )
    dec_output_inv = decision_agent.run(dec_input_inv)
    print("  Investigator Outputs (Action Steps):")
    for idx, act in enumerate(dec_output_inv.data["actions"]):
        print(f"    {idx+1}. {act}")
    print(f"  Supervisor Data Blocked (Priority Score): {dec_output_inv.data['priority_score'] is None}")
    print(f"  Policymaker Data Blocked (Coordination Needs): {dec_output_inv.data['coordination'] == ''}")

    # B. Supervisor Role
    print("\n>>> B. Running for Role: SUPERVISOR (Authorized for Priority Scoring & Risk Matrices)")
    dec_input_sup = AgentInput(
        query="Generate decision support briefing",
        context={"role": "Supervisor"},
        agent_results=upstream_results
    )
    dec_output_sup = decision_agent.run(dec_input_sup)
    print(f"  Supervisor Priority Score: {dec_output_sup.data['priority_score']}/10")
    print(f"  Priority Justification: {dec_output_sup.data['priority_justification']}")
    print("  Identified Risks to Monitor:")
    for idx, risk in enumerate(dec_output_sup.data["risks"]):
        print(f"    - {risk}")
    print(f"  Investigator Data Blocked (Action Steps): {dec_output_sup.data['actions'] == []}")
    print(f"  Policymaker Data Blocked (Coordination Needs): {dec_output_sup.data['coordination'] == ''}")

    # C. Policymaker Role
    print("\n>>> C. Running for Role: POLICYMAKER (Authorized for Inter-agency Strategic Coordination)")
    dec_input_pm = AgentInput(
        query="Generate decision support briefing",
        context={"role": "Policymaker"},
        agent_results=upstream_results
    )
    dec_output_pm = decision_agent.run(dec_input_pm)
    print("  Policymaker Strategic Coordination Directives:")
    print(f"    {dec_output_pm.data['coordination']}")
    print(f"  Investigator Data Blocked (Action Steps): {dec_output_pm.data['actions'] == []}")
    print(f"  Supervisor Data Blocked (Priority Score): {dec_output_pm.data['priority_score'] is None}")

    # --- 5. SOCIOLOGY & FINANCIAL AGENT DEMO ---
    print_section("5. Sociology & Financial Agents (Supplementary intelligence)")
    
    print(">>> A. Sociology Agent - Social Risk Assessment for Shivajinagar")
    soc_input = AgentInput(query="Assess demographics", context={"district": "Shivajinagar"})
    soc_output = sociology_agent.run(soc_input)
    print(f"  Area Vulnerability Index: {soc_output.data['demographics']['vulnerability_index']}")
    print(f"  Calculated Community Risk Score: {soc_output.data['area_risk_score']}/10")
    print(f"  Recidivism Risk Probability: {soc_output.data['recidivism_risk'] * 100:.1f}%")
    print("  Socio-Criminal Impact Narrative:")
    print(f"    {soc_output.data['analysis']}")
    
    print("\n>>> B. Financial Agent - Hawala Tracking for Ramesh Kumar")
    fin_input = AgentInput(query="Detect money laundering links", entity_id="Ramesh Kumar")
    fin_output = financial_agent.run(fin_input)
    print(f"  Detected Shell Fronts: {fin_output.data['shell_companies']}")
    print(f"  Financial Risk Score: {fin_output.data['risk_score']}/10")
    print("  Security Flags Triggered:")
    for flag in fin_output.data["financial_flags"]:
        print(f"    - {flag}")
    print("  Money Laundering Route Analysis:")
    print(f"    {fin_output.data['analysis']}")

    # --- 6. INTEGRATED PIPELINE DEMO ---
    print_section("6. Integrated Copilot Pipeline (End-to-End)")
    from backend.orchestration.pipeline import CopilotPipeline
    pipeline = CopilotPipeline()
    
    print("Executing End-to-End Pipeline for Investigator...")
    inv_brief = pipeline.execute(
        session_id="session_456",
        query="Provide a complete intelligence audit on suspect Suresh Patil, including history, co-accused network, and next steps.",
        role="Investigator"
    )
    print("\n[INVESTIGATOR OUTPUT BRIEFING]")
    print("=" * 60)
    print(inv_brief.data["markdown_response"])
    print("=" * 60)

    print("\nExecuting End-to-End Pipeline for Supervisor...")
    sup_brief = pipeline.execute(
        session_id="session_456",
        query="Review the forecast risk and priority score for Suresh Patil",
        role="Supervisor"
    )
    print("\n[SUPERVISOR OUTPUT BRIEFING]")
    print("=" * 60)
    print(sup_brief.data["markdown_response"])
    print("=" * 60)

    print_section("demo run completed successfully")

if __name__ == "__main__":
    main()
