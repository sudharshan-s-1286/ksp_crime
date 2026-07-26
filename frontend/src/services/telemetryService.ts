import { apiClient } from '../api/client';

export interface SystemMetrics {
  cpu_percent: number;
  ram_percent: number;
  python_memory_mb: number;
  uptime_seconds: number;
  postgresql_status: string;
  neo4j_status: string;
  faiss_status: string;
  active_users: number;
  active_requests: number;
}

export interface PipelineStage {
  name: string;
  status: 'Waiting' | 'Running' | 'Completed' | 'Failed';
  start_time: string | null;
  finish_time: string | null;
  latency_ms: number;
}

export interface AgentMetric {
  name: string;
  status: string;
  task: string;
  execution_time_ms: number;
  confidence: number;
  memory_mb: number;
  cpu_percent: number;
  input_tokens: number;
  output_tokens: number;
  documents_processed: number;
  errors: number;
  retry_count: number;
  last_execution: string | null;
}

export interface DbMetrics {
  sql_query_count: number;
  sql_rows_returned: number;
  sql_execution_time_ms: number;
  neo4j_traversal_count: number;
  neo4j_nodes_visited: number;
  neo4j_edges_traversed: number;
  neo4j_execution_time_ms: number;
  vector_documents_retrieved: number;
  chunks_ranked: number;
  avg_similarity_score: number;
  vector_retrieval_time_ms: number;
  total_db_time_ms: number;
}

export interface TelemetryLog {
  id: number;
  timestamp: string;
  level: string;
  category: string;
  message: string;
}

export interface TelemetryState {
  current_active_query: string;
  current_pipeline_stage: string;
  system_metrics: SystemMetrics;
  pipeline_stages: Record<string, PipelineStage>;
  db_metrics: DbMetrics;
  agents_metrics: Record<string, AgentMetric>;
  logs: TelemetryLog[];
}

export const fetchTelemetrySnapshot = async (): Promise<TelemetryState> => {
  const response = await apiClient.get('/api/telemetry');
  return response.data;
};

export const fetchSystemMetrics = async (): Promise<SystemMetrics> => {
  const response = await apiClient.get('/api/system');
  return response.data;
};

export const fetchAgentsMetrics = async (): Promise<Record<string, AgentMetric>> => {
  const response = await apiClient.get('/api/agents');
  return response.data;
};

export const fetchPipelineStages = async (): Promise<Record<string, PipelineStage>> => {
  const response = await apiClient.get('/api/pipeline');
  return response.data.stages;
};

export const fetchLogs = async (): Promise<TelemetryLog[]> => {
  const response = await apiClient.get('/api/logs');
  return response.data;
};

export const subscribeTelemetryStream = (onMessage: (data: any) => void): (() => void) => {
  const baseURL = apiClient.defaults.baseURL || 'http://127.0.0.1:8000';
  const url = `${baseURL.replace(/\/$/, '')}/api/telemetry/stream`;
  
  let eventSource: EventSource | null = null;
  try {
    eventSource = new EventSource(url);
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        onMessage(payload);
      } catch (err) {
        console.error('Error parsing SSE event data:', err);
      }
    };
    eventSource.onerror = (err) => {
      console.warn('SSE stream error, client reconnecting...', err);
    };
  } catch (err) {
    console.error('Failed to create EventSource:', err);
  }

  return () => {
    if (eventSource) {
      eventSource.close();
    }
  };
};
