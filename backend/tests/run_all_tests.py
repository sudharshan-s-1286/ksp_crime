import sys
import traceback

from backend.tests.test_agents import (
    test_profiling_agent, test_analytics_agent, test_forecast_agent,
    test_decision_support_agent_roles, test_sociology_agent, test_financial_agent,
    test_pipeline_integration
)
from backend.tests.test_rag import (
    test_sql_retriever_basic, test_sql_retriever_hotspots_and_rates,
    test_graph_retriever, test_analytics_retriever, test_vector_retriever
)

tests = [
    ('test_sql_retriever_basic', test_sql_retriever_basic),
    ('test_sql_retriever_hotspots_and_rates', test_sql_retriever_hotspots_and_rates),
    ('test_graph_retriever', test_graph_retriever),
    ('test_analytics_retriever', test_analytics_retriever),
    ('test_vector_retriever', test_vector_retriever),
    ('test_profiling_agent', test_profiling_agent),
    ('test_analytics_agent', test_analytics_agent),
    ('test_forecast_agent', test_forecast_agent),
    ('test_decision_support_agent_roles', test_decision_support_agent_roles),
    ('test_sociology_agent', test_sociology_agent),
    ('test_financial_agent', test_financial_agent),
    ('test_pipeline_integration', test_pipeline_integration),
]

passed = 0
failed = 0
for name, test in tests:
    try:
        test()
        print(f'PASS: {name}')
        passed += 1
    except Exception as e:
        print(f'FAIL: {name} -> {str(e)[:200]}')
        failed += 1
print(f'Total: {passed} passed, {failed} failed')
if failed > 0:
    sys.exit(1)