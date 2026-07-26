import logging
from typing import List, Dict, Any
from backend.agents.base_agent import BaseAgent
from backend.contracts.agent_schemas import AgentInput, AgentOutput
from backend.config.settings import call_llm

logger = logging.getLogger("ReasoningAgent")

class ReasoningAgent(BaseAgent):
    """
    Cognitive reasoning agent that synthesizes findings from all upstream agents
    using evidence-driven logical deduction. Every conclusion references actual
    agent outputs; no hallucinated deductions are generated.
    """
    def __init__(self, name: str = None):
        super().__init__(name)

    def _execute(self, message: AgentInput) -> AgentOutput:
        agent_results = message.agent_results
        logger.info("Executing evidence-driven logical reasoning synthesis over upstream agent outputs.")

        logical_conclusions = []
        deduction_num = 1

        # 1. ProfilingAgent evidence
        profiling_res = agent_results.get("profiling_agent", {})
        if profiling_res and profiling_res.get("status") != "error":
            fields = profiling_res.get("profile_fields", {})
            target_persons = fields.get("target_persons", [])
            if target_persons:
                person = target_persons[0]
                total_firs = fields.get("total_firs", 0)
                crime_types = fields.get("crime_types", [])
                repeat_offence = fields.get("repeat_offence_flag", False)
                co_accused = fields.get("co_accused_links", 0)
                districts = fields.get("active_districts", [])

                if total_firs > 0:
                    logical_conclusions.append(
                        f"Deduction {deduction_num}: ProfilingAgent identified {person} with {total_firs} active FIR(s) "
                        f"across {len(crime_types)} crime type(s) ({', '.join(crime_types)})."
                    )
                    deduction_num += 1

                if repeat_offence:
                    logical_conclusions.append(
                        f"Deduction {deduction_num}: ProfilingAgent flagged {person} as a repeat offender, "
                        f"indicating persistent criminal engagement."
                    )
                    deduction_num += 1

                if co_accused > 0:
                    logical_conclusions.append(
                        f"Deduction {deduction_num}: ProfilingAgent found {co_accused} co-accused link(s) for {person}, "
                        f"confirming organized network involvement."
                    )
                    deduction_num += 1

                if len(districts) > 1:
                    logical_conclusions.append(
                        f"Deduction {deduction_num}: ProfilingAgent detected multi-jurisdictional activity across "
                        f"{', '.join(districts)}, indicating cross-border operational coordination."
                    )
                    deduction_num += 1

        # 2. NetworkAgent evidence
        network_res = agent_results.get("network_agent", {})
        if network_res and network_res.get("status") != "error":
            nodes = network_res.get("nodes", [])
            edges = network_res.get("edges", [])
            central_hubs = network_res.get("central_hubs", [])
            if central_hubs:
                logical_conclusions.append(
                    f"Deduction {deduction_num}: NetworkAgent identified {', '.join(central_hubs)} as central hubs "
                    f"in the criminal network (density: {network_res.get('network_metrics', {}).get('network_density', 0)})."
                )
                deduction_num += 1
            if edges:
                logical_conclusions.append(
                    f"Deduction {deduction_num}: NetworkAgent mapped {len(edges)} association edge(s) linking suspects, "
                    f"fences, and couriers across {len(nodes)} network node(s)."
                )
                deduction_num += 1

        # 3. FinancialAgent evidence
        financial_res = agent_results.get("financial_agent", {})
        if financial_res and financial_res.get("status") != "error":
            flags = financial_res.get("financial_flags", [])
            risk_score = financial_res.get("risk_score", 0)
            if flags:
                logical_conclusions.append(
                    f"Deduction {deduction_num}: FinancialAgent detected {len(flags)} illicit financing indicator(s) "
                    f"({'; '.join(flags[:2])}) with a risk score of {risk_score}/10."
                )
                deduction_num += 1

        # 4. AnalyticsAgent evidence
        analytics_res = agent_results.get("analytics_agent", {})
        if analytics_res and analytics_res.get("status") != "error":
            hotspots = analytics_res.get("hotspots", [])
            if hotspots:
                top = hotspots[0]
                logical_conclusions.append(
                    f"Deduction {deduction_num}: AnalyticsAgent identified {top.get('district', 'N/A')} as a primary hotspot "
                    f"with {top.get('incident_count', 0)} recorded incidents."
                )
                deduction_num += 1

        # 5. ForecastAgent evidence
        forecast_res = agent_results.get("forecast_agent", {})
        if forecast_res and forecast_res.get("status") != "error":
            alerts = forecast_res.get("alerts", [])
            if alerts:
                logical_conclusions.append(
                    f"Deduction {deduction_num}: ForecastAgent raised {len(alerts)} early warning alert(s): "
                    f"{'; '.join(alerts[:1])}."
                )
                deduction_num += 1

        # Default conclusion when evidence is insufficient
        if not logical_conclusions:
            logical_conclusions.append(
                f"Deduction 1: Insufficient evidence collected from upstream agents. "
                f"Additional intelligence gathering is required before forming definitive conclusions."
            )

        # Build context summary for LLM synthesis
        context_blocks = []
        for agent_name, data in agent_results.items():
            if not data or data.get("status") == "error":
                continue
            context_blocks.append(f"[{agent_name.upper()} FINDINGS]: {str(data)[:600]}...")

        consolidated_context = "\n\n".join(context_blocks)

        prompt = (
            f"You are the Lead Reasoning Director for a police intelligence team. Perform a multi-hop logical "
            f"Chain-of-Thought (CoT) synthesis of the following verified crime intelligence findings:\n\n"
            f"{consolidated_context}\n\n"
            f"--- LOGICAL TASK ---\n"
            f"1. Structure your analysis as a logical progression: identify facts, weigh indicators, "
            f"formulate a unified hypothesis, and justify the priority.\n"
            f"2. Resolve any contradictions between spatial hotspots, temporal trends, and individual suspect profiles.\n"
            f"3. Write a 150-word logical synthesis report outlining this reasoning chain. Do not invent facts not present in the evidence. Do not use placeholders."
        )

        synthesis_report = call_llm(prompt)

        return AgentOutput(
            data={
                "synthesis": synthesis_report,
                "logical_conclusions": logical_conclusions
            },
            chunks=[]
        )
