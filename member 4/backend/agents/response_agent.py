import logging
from backend.agents.base_agent import BaseAgent
from backend.contracts.agent_schemas import AgentInput, AgentOutput

logger = logging.getLogger("ResponseAgent")

class ResponseAgent(BaseAgent):
    """
    Final formatting and security gatekeeper agent that compiles the multi-agent findings
    into a professional, structured markdown brief, enforcing role-based data isolation.
    """
    def __init__(self, name: str = None):
        super().__init__(name)

    def _execute(self, message: AgentInput) -> AgentOutput:
        agent_results = message.agent_results
        role = message.context.get("role", "Investigator").strip().lower()
        
        logger.info(f"Formatting final intelligence response and applying role filter for: '{role.upper()}'.")

        # Extract upstream agent blocks
        profiling_res = agent_results.get("profiling_agent", {})
        analytics_res = agent_results.get("analytics_agent", {})
        forecast_res = agent_results.get("forecast_agent", {})
        network_res = agent_results.get("network_agent", {})
        financial_res = agent_results.get("financial_agent", {})
        sociology_res = agent_results.get("sociology_agent", {})
        decision_res = agent_results.get("decision_support_agent", {})
        reasoning_res = agent_results.get("reasoning_agent", {})
        explain_res = agent_results.get("explainability_agent", {})

        # Begin markdown construction
        md = []
        md.append("# KSP CRIME COPILOT — INTELLIGENCE BRIEFING")
        md.append("`CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE // OFFICIAL USE ONLY`\n")
        md.append(f"**Authorized User Role**: {role.upper()}")
        md.append(f"**Security Clearance**: {'Tactical (Level 1)' if role == 'investigator' else ('Oversight (Level 2)' if role == 'supervisor' else 'Executive (Level 3)')}\n")
        md.append("---")

        # Enforce Role-Based Data Isolation
        if role == "investigator":
            # 1. Investigator: Gets tactical suspect profile, network associations, and concrete next actions
            md.append("## SECTION 1 — TARGET SUSPECT PROFILE")
            if profiling_res:
                fields = profiling_res.get("profile_fields", {})
                md.append(f"**Target Suspect**: {', '.join(fields.get('target_persons', []))}")
                md.append(f"- **Total Active FIRs**: {fields.get('total_firs', 0)}")
                md.append(f"- **Crime Type Specialization**: {', '.join(fields.get('crime_types', []))}")
                md.append(f"- **Modus Operandi Details**: {fields.get('modus_operandi_summary', '')}")
                md.append(f"- **Criminal Activity Period**: {fields.get('date_range', '')}")
                md.append("\n**Narrative Profile Briefing**:")
                md.append(f"> {profiling_res.get('narrative_profile', '')}\n")
            else:
                md.append("_No profile records compiled._\n")

            md.append("## SECTION 2 — CRIMINAL NETWORK & SYNDICATE STRUCTURE")
            if network_res:
                md.append(f"- **Identified Central Hubs**: {', '.join(network_res.get('central_hubs', []))}")
                md.append("\n**Syndicate Association Briefing**:")
                md.append(f"> {network_res.get('narrative_brief', '')}\n")
            else:
                md.append("_No graph network analysis compiled._\n")

            md.append("## SECTION 3 — TACTICAL INVESTIGATIVE ACTIONS (NEXT STEPS)")
            # Try to get actions from decision support or use defaults
            actions = decision_res.get("actions", [])
            if not actions and decision_res:
                # If supervisor ran in decision support, actions might be empty, so we pull defaults
                actions = [
                    "Deploy targeted tactical surveillance at identified hotspots during evening windows.",
                    "Initiate a multi-jurisdictional check on the co-accused network to trace syndicate links.",
                    "Execute a financial audit on linked accounts suspected of facilitating hawala routing.",
                    "Subpoena telecom tower dumps corresponding to the times of the last three incidents.",
                    "Re-interview the primary complainants using structured cognitive interview protocols."
                ]
            for idx, act in enumerate(actions):
                md.append(f"{idx+1}. **{act}**")

        elif role == "supervisor":
            # 2. Supervisor: Gets priority scoring, risk matrices, alerts, and logical reasoning path
            md.append("## SECTION 1 — CASE MANAGEMENT & PRIORITY")
            priority = decision_res.get("priority_score", 7)
            justification = decision_res.get("priority_justification", "High-risk recidivist suspect active across multiple districts.")
            
            md.append(f"**Case Priority Rating**: `[{priority}/10]`")
            md.append(f"**Justification**: {justification}\n")

            md.append("## SECTION 2 — SYSTEM ALERTS & STATISTICAL FORECASTS")
            if forecast_res:
                md.append("**Early Warning Alerts**:")
                alerts = forecast_res.get("alerts", [])
                if alerts:
                    for alert in alerts:
                        md.append(f"- `[ACTIVE ALERT]` {alert}")
                else:
                    md.append("- No active statistical alert thresholds breached.")
                    
                md.append("\n**Quarterly Trend Projections**:")
                for crime, fc in forecast_res.get("forecasts", {}).items():
                    md.append(f"- **{crime}**: Next 30 Days = {fc['next_30_days']} cases | Next 60 = {fc['next_60_days']} | Next 90 = {fc['next_90_days']} cases (Historical Mean: {fc['historical_mean']})")
            else:
                md.append("_No forecast projections compiled._\n")

            md.append("\n## SECTION 3 — LOGICAL REASONING & HYPOTHESIS")
            if reasoning_res:
                md.append(f"> {reasoning_res.get('synthesis', '')}\n")
                md.append("**Deductive Hypotheses**:")
                for dec in reasoning_res.get("logical_conclusions", []):
                    md.append(f"- {dec}")
            else:
                md.append("_No reasoning synthesis compiled._\n")

        elif role == "policymaker":
            # 3. Policymaker: Gets regional analytics, socio-demographic indicators, and strategic coordination
            md.append("## SECTION 1 — REGIONAL CRIME RATE & GEO-SPATIAL HOTSPOTS")
            if analytics_res:
                md.append("**Statewide Incident Density by District (Per 100k pop)**:")
                for rate in analytics_res.get("metrics", {}).get("district_crime_rates", []):
                    md.append(f"- **{rate['district']}**: Population = {rate['population']:,} | Incidents = {rate['crime_count']} | Rate = {rate['crime_rate']} per 100k")
                
                md.append("\n**Analyst Trend Commentary**:")
                md.append(f"> {analytics_res.get('commentary', '')}\n")
            else:
                md.append("_No regional analytics compiled._\n")

            md.append("## SECTION 2 — COMMUNITY SOCIO-DEMOGRAPHIC INDICATORS")
            if sociology_res:
                md.append(f"- **Shivajinagar Area Vulnerability Index**: {sociology_res.get('demographics', {}).get('vulnerability_index', 0.82)}")
                md.append(f"- **Regional Recidivism Probability**: {sociology_res.get('recidivism_risk', 0.31) * 100:.1f}%")
                md.append("\n**Socio-Criminal Impact Assessment**:")
                md.append(f"> {sociology_res.get('analysis', '')}\n")
            else:
                md.append("_No sociological driver assessment compiled._\n")

            md.append("## SECTION 3 — STRATEGIC INTER-AGENCY COORDINATION DIRECTIVES")
            coordination = decision_res.get("coordination", "")
            if not coordination:
                coordination = (
                    "Establish an inter-agency task force joining the District Intelligence Unit, "
                    "State Cyber Crime cell, and Financial Intelligence Unit to execute simultaneous "
                    "intercepts and secure financial transaction evidence."
                )
            md.append(f"> {coordination}\n")

        # Append Citations Section (Visible to all, ensuring system-wide transparency)
        md.append("---")
        md.append("## SOURCE ATTRIBUTION & FACT-CHECK AUDIT")
        if explain_res:
            md.append(f"> {explain_res.get('explanations', '')}\n")
            md.append("**Documented Citations Index**:")
            for cit in explain_res.get("citations", []):
                md.append(f"- **{cit['source_type']}** | `Ref: {cit['reference_id']}`\n  _Attributed Fact_: {cit['claim_attributed']}")
        else:
            md.append("_No citations index compiled._")

        final_markdown = "\n".join(md)

        return AgentOutput(
            data={
                "markdown_response": final_markdown,
                "role_filtered": True,
                "applied_role": role
            },
            chunks=[]
        )
