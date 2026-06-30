from backend.rag.sql_retriever import SQLRetriever
from backend.rag.graph_retriever import GraphRetriever
from backend.rag.analytics_retriever import AnalyticsRetriever
from backend.rag.vector_retriever import VectorRetriever

def test_sql_retriever_basic():
    retriever = SQLRetriever()
    
    # 1. Test retrieving suspect FIRs (parameterized)
    firs = retriever.get_firs_by_suspect("Suresh Patil")
    assert len(firs) >= 3, "Suresh Patil must have at least 3 seeded FIRs (Week 3 Milestone requirement)"
    for fir in firs:
        assert fir["suspect_name"] == "Suresh Patil"
        assert fir["crime_type"] == "Burglary"
        assert fir["district"] in ["Mysore", "Mangalore"]

def test_sql_retriever_hotspots_and_rates():
    retriever = SQLRetriever()
    
    # 2. Test district per-capita crime rates query (join table)
    rate_query = """
        SELECT 
            f.district,
            COUNT(f.fir_id) as crime_count,
            p.population,
            ROUND((CAST(COUNT(f.fir_id) as REAL) / p.population) * 100000, 2) as crime_rate
        FROM firs f
        JOIN populations p ON f.district = p.district
        GROUP BY f.district
        ORDER BY crime_rate DESC
    """
    chunks = retriever.retrieve(rate_query)
    assert len(chunks) > 0
    first_row = chunks[0]["data"]
    assert "district" in first_row
    assert "crime_rate" in first_row
    assert "population" in first_row
    assert first_row["crime_rate"] > 0

def test_graph_retriever():
    retriever = GraphRetriever()
    
    # Test retrieving network for Suresh Patil
    chunks = retriever.retrieve(["Suresh Patil"])
    assert len(chunks) == 1
    graph_data = chunks[0]["data"]
    
    assert "nodes" in graph_data
    assert "edges" in graph_data
    
    # Verify nodes
    node_ids = [node["id"] for node in graph_data["nodes"]]
    assert "Suresh Patil" in node_ids
    assert "Dinesh Gowda" in node_ids
    assert "Vinay M." in node_ids
    
    # Verify relationships
    edges = graph_data["edges"]
    assert len(edges) >= 2
    edge_targets = [edge["target"] for edge in edges]
    assert "Dinesh Gowda" in edge_targets or "Vinay M." in edge_targets

def test_analytics_retriever():
    retriever = AnalyticsRetriever()
    
    chunks = retriever.retrieve("general trend")
    assert len(chunks) == 1
    data = chunks[0]["data"]
    
    assert "state_wide_baselines" in data
    assert "seasonal_indices" in data
    assert "category_clearance_rates" in data
    
    assert data["state_wide_baselines"]["recidivism_rate"] == 0.22
    assert data["category_clearance_rates"]["Cyber Crime"] == 0.31

def test_vector_retriever():
    retriever = VectorRetriever()
    
    # Query for financial or burglary-related crimes
    chunks = retriever.retrieve("hawala money laundering", k=2)
    assert len(chunks) == 2
    
    # Verify structures and metadata
    for chunk in chunks:
        assert chunk["source"] == "vector_retriever"
        assert "text" in chunk
        assert "similarity_score" in chunk
        assert "metadata" in chunk
