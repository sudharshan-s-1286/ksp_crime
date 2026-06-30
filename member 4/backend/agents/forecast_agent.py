import logging
import numpy as np
from typing import Dict, List, Any
from backend.agents.base_agent import BaseAgent
from backend.contracts.agent_schemas import AgentInput, AgentOutput
from backend.rag.sql_retriever import SQLRetriever

logger = logging.getLogger("ForecastAgent")

class ForecastAgent(BaseAgent):
    """
    Agent that uses statistical linear regression (numpy.polyfit) to project
    crime trends 30, 60, and 90 days into the future and flags anomalies 
    based on historical standard deviations.
    """
    def __init__(self, name: str = None):
        super().__init__(name)
        self.sql_retriever = SQLRetriever()

    def _execute(self, message: AgentInput) -> AgentOutput:
        # 1. Fetch monthly crime counts for the last 24 months
        query = """
            SELECT year_month, crime_type, crime_count 
            FROM monthly_stats 
            ORDER BY year_month ASC
        """
        retrieved_chunks = self.sql_retriever.retrieve(query)
        
        # Group data by crime type
        crime_data: Dict[str, List[int]] = {}
        for chunk in retrieved_chunks:
            row = chunk["data"]
            ct = row["crime_type"]
            count = row["crime_count"]
            if ct not in crime_data:
                crime_data[ct] = []
            crime_data[ct].append(count)

        forecasts = {}
        alerts = []

        # 2. Iterate and forecast for each crime type
        for crime_type, counts in crime_data.items():
            num_months = len(counts)
            if num_months <= 12:
                logger.warning(f"Insufficient historical data for {crime_type} (has {num_months} months, needs >12). Skipping forecast.")
                continue

            # Linear regression: y = slope * x + intercept
            y = np.array(counts, dtype=float)
            x = np.arange(num_months, dtype=float)

            # Fit the line (1st degree polynomial)
            slope, intercept = np.polyfit(x, y, 1)

            # Project next 3 months: index N, N+1, N+2
            next_30_idx = num_months
            next_60_idx = num_months + 1
            next_90_idx = num_months + 2

            next_30_val = slope * next_30_idx + intercept
            next_60_val = slope * next_60_idx + intercept
            next_90_val = slope * next_90_idx + intercept

            # Clamp to 0 to prevent negative crime predictions
            next_30 = int(round(max(0.0, next_30_val)))
            next_60 = int(round(max(0.0, next_60_val)))
            next_90 = int(round(max(0.0, next_90_val)))

            # 3. Calculate mean and standard deviation
            mean_val = float(np.mean(y))
            std_val = float(np.std(y))
            threshold = mean_val + 2 * std_val

            # Check for Early Warning Alert
            alert = False
            alert_reason = ""
            
            highest_projection = max(next_30, next_60, next_90)
            if highest_projection > threshold:
                alert = True
                alert_reason = (
                    f"Early Warning Alert: Projected crime count of {highest_projection} "
                    f"exceeds statistical threshold of mean + 2*std ({threshold:.2f}). "
                    f"Historical mean: {mean_val:.2f}, std: {std_val:.2f}."
                )
                alerts.append(f"{crime_type}: {alert_reason}")

            forecasts[crime_type] = {
                "next_30_days": next_30,
                "next_60_days": next_60,
                "next_90_days": next_90,
                "historical_mean": round(mean_val, 2),
                "historical_std": round(std_val, 2),
                "alert": alert,
                "alert_reason": alert_reason
            }

        return AgentOutput(
            data={
                "forecasts": forecasts,
                "alerts": alerts
            },
            chunks=retrieved_chunks
        )
