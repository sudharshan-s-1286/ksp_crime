import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  Brain, 
  Network, 
  TrendingUp, 
  Wallet, 
  UserSquare2, 
  ShieldCheck, 
  CheckCircle,
  Clock,
  Sparkles,
  Database,
  Layers,
  Play,
  RefreshCw,
  Search,
  Server,
  HardDrive,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { 
  fetchTelemetrySnapshot, 
  subscribeTelemetryStream
} from '../services/telemetryService';
import type { TelemetryState, AgentMetric } from '../services/telemetryService';
import { chatCopilot } from '../services/api';

export const AIAgentMonitoring: React.FC = () => {
  const [telemetry, setTelemetry] = useState<TelemetryState | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>('master_agent');
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);
  const [testQueryText, setTestQueryText] = useState("Analyze suspect Suresh Patil's network and financial transactions");
  const [logFilter, setLogFilter] = useState<string>('ALL');

  useEffect(() => {
    // Initial fetch
    fetchTelemetrySnapshot().then(data => setTelemetry(data)).catch(console.error);

    // Subscribe to SSE stream for live updates
    const unsubscribe = subscribeTelemetryStream((event) => {
      if (event.type === 'init' || event.type === 'pipeline_completed' || event.type === 'pipeline_update') {
        setTelemetry(event.data);
      } else {
        // Refresh full snapshot on event notification
        fetchTelemetrySnapshot().then(data => setTelemetry(data)).catch(console.error);
      }
    });

    // Backup polling every 2 seconds to guarantee sync
    const interval = setInterval(() => {
      fetchTelemetrySnapshot().then(data => setTelemetry(data)).catch(console.error);
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleRunTestQuery = async () => {
    if (!testQueryText.trim() || isExecutingQuery) return;
    setIsExecutingQuery(true);
    try {
      await chatCopilot(testQueryText, "Investigator", "telemetry_test_session");
    } catch (err) {
      console.error("Test query execution error:", err);
    } finally {
      setIsExecutingQuery(false);
      // Fetch latest state immediately
      fetchTelemetrySnapshot().then(data => setTelemetry(data)).catch(console.error);
    }
  };

  const stagesOrder = [
    { id: 'master_agent', label: 'Master Agent', desc: 'Intent Ingestion & Session Parse' },
    { id: 'router', label: 'Router', desc: 'Agent Selection & Strategy' },
    { id: 'crime_query_agent', label: 'Crime Query', desc: 'FIR & Offender Search' },
    { id: 'sql_retriever', label: 'SQL Retriever', desc: 'SQLite DB Queries' },
    { id: 'vector_retriever', label: 'Vector Retriever', desc: 'FAISS Intelligence Search' },
    { id: 'graph_retriever', label: 'Graph Retriever', desc: 'Neo4j Associate Traversal' },
    { id: 'reasoning_agent', label: 'Reasoning Agent', desc: 'Synthesis & Deductions' },
    { id: 'explainability_agent', label: 'Explainability', desc: 'Citation & Proof Audit' },
    { id: 'response_agent', label: 'Response Agent', desc: 'Markdown & Role Filter' }
  ];

  const agentIcons: Record<string, any> = {
    master_agent: Brain,
    router: Layers,
    crime_query_agent: Sparkles,
    analytics_agent: TrendingUp,
    profiling_agent: UserSquare2,
    network_agent: Network,
    forecast_agent: Clock,
    reasoning_agent: Cpu,
    explainability_agent: ShieldCheck,
    response_agent: FileText
  };

  const sys = telemetry?.system_metrics || {
    cpu_percent: 0,
    ram_percent: 0,
    python_memory_mb: 0,
    uptime_seconds: 0,
    postgresql_status: 'Connected',
    neo4j_status: 'Connected',
    faiss_status: 'Indexed',
    active_users: 1,
    active_requests: 0
  };

  const db = telemetry?.db_metrics || {
    sql_query_count: 0,
    sql_rows_returned: 0,
    sql_execution_time_ms: 0,
    neo4j_traversal_count: 0,
    neo4j_nodes_visited: 0,
    neo4j_edges_traversed: 0,
    neo4j_execution_time_ms: 0,
    vector_documents_retrieved: 0,
    chunks_ranked: 0,
    avg_similarity_score: 0.91,
    vector_retrieval_time_ms: 0,
    total_db_time_ms: 0
  };

  const stages = telemetry?.pipeline_stages || {};
  const agentsMetrics = telemetry?.agents_metrics || {};
  const logs = (telemetry?.logs || []).filter(l => logFilter === 'ALL' || l.level === logFilter);

  const formatUptime = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${hrs}h ${mins}m ${s}s`;
  };

  return (
    <div className="w-full p-8 flex flex-col bg-zinc-950/20 gap-6 text-zinc-100 font-sans">
      
      {/* Top Bar / Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/[0.08] pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-heading uppercase tracking-tight flex items-center gap-3">
            <Activity className="text-[#FF7A00]" size={30} /> Backend Real-Time Telemetry Engine
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Live execution metrics, RAG retriever timings, agent resource profiling, and hardware status emitted directly by the Python Copilot backend.
          </p>
        </div>

        {/* Live Query Execution Bar */}
        <div className="flex items-center gap-2 bg-zinc-900/90 border border-white/10 p-1.5 rounded-lg w-full md:w-auto">
          <input 
            type="text" 
            value={testQueryText}
            onChange={(e) => setTestQueryText(e.target.value)}
            placeholder="Type query to trace backend telemetry..."
            className="bg-transparent text-xs text-white px-3 py-1.5 focus:outline-none w-64 md:w-80 font-mono"
          />
          <button 
            onClick={handleRunTestQuery}
            disabled={isExecutingQuery}
            className={`px-4 py-2 text-xs font-bold font-mono rounded flex items-center gap-2 transition-all ${
              isExecutingQuery ? 'bg-orange-500/20 text-orange-400 cursor-not-allowed' : 'bg-[#FF7A00] text-black hover:bg-orange-400'
            }`}
          >
            {isExecutingQuery ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} />}
            {isExecutingQuery ? 'EXECUTING...' : 'DISPATCH QUERY'}
          </button>
        </div>
      </div>

      {/* Section 1: System Hardware & Services Health */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="glass-panel p-3 border-white/10 bg-zinc-950/80 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu size={12} className="text-[#FF7A00]" /> CPU LOAD
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-white">{sys.cpu_percent.toFixed(1)}</span>
            <span className="text-xs text-zinc-500">%</span>
          </div>
        </div>

        <div className="glass-panel p-3 border-white/10 bg-zinc-950/80 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Server size={12} className="text-[#FF7A00]" /> RAM UTILIZATION
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-white">{sys.ram_percent.toFixed(1)}</span>
            <span className="text-xs text-zinc-500">%</span>
          </div>
        </div>

        <div className="glass-panel p-3 border-white/10 bg-zinc-950/80 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <HardDrive size={12} className="text-[#FF7A00]" /> PYTHON MEMORY
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-white">{sys.python_memory_mb}</span>
            <span className="text-xs text-zinc-500">MB</span>
          </div>
        </div>

        <div className="glass-panel p-3 border-white/10 bg-zinc-950/80 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={12} className="text-[#FF7A00]" /> BACKEND UPTIME
          </span>
          <div className="mt-2">
            <span className="text-sm font-bold font-mono text-emerald-400">{formatUptime(sys.uptime_seconds)}</span>
          </div>
        </div>

        <div className="glass-panel p-3 border-white/10 bg-zinc-950/80 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">POSTGRES DB</span>
          <span className="mt-2 text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-max">
            ● {sys.postgresql_status}
          </span>
        </div>

        <div className="glass-panel p-3 border-white/10 bg-zinc-950/80 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">NEO4J GRAPH</span>
          <span className="mt-2 text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-max">
            ● {sys.neo4j_status}
          </span>
        </div>

        <div className="glass-panel p-3 border-white/10 bg-zinc-950/80 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">FAISS VECTOR</span>
          <span className="mt-2 text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-max">
            ● {sys.faiss_status}
          </span>
        </div>
      </div>

      {/* Section 2: Live Pipeline Stage Tracking Graph */}
      <div className="glass-panel p-5 bg-zinc-950/90 border-white/10 flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-3">
            <Network className="text-[#FF7A00]" size={18} />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
              Live Pipeline Tracing Flow (Master Agent → Router → Retrievers → Reasoning → Explainability → Response)
            </h3>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-zinc-400">ACTIVE QUERY: <strong className="text-white font-normal">{telemetry?.current_active_query || 'None'}</strong></span>
            <span className="text-[10px] bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/30 px-2 py-0.5 rounded uppercase font-bold">
              STAGE: {telemetry?.current_pipeline_stage || 'Idle'}
            </span>
          </div>
        </div>

        {/* Pipeline Nodes Flow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-9 gap-3 py-2">
          {stagesOrder.map((st, idx) => {
            const stageData = stages[st.id] || { status: 'Waiting', latency_ms: 0, start_time: null, finish_time: null };
            const isRunning = stageData.status === 'Running';
            const isCompleted = stageData.status === 'Completed';
            const isFailed = stageData.status === 'Failed';

            let statusBg = 'bg-zinc-900 border-zinc-800 text-zinc-500';
            if (isRunning) statusBg = 'bg-orange-500/10 border-[#FF7A00] text-orange-400 animate-pulse';
            if (isCompleted) statusBg = 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400';
            if (isFailed) statusBg = 'bg-red-500/10 border-red-500/40 text-red-400';

            return (
              <div key={st.id} className={`p-3 rounded-lg border flex flex-col justify-between h-36 ${statusBg}`}>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono font-bold text-zinc-500">0{idx + 1}</span>
                  <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                    isRunning ? 'bg-[#FF7A00]/20 text-[#FF7A00]' : isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {stageData.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white leading-tight font-heading mt-1">{st.label}</h4>
                  <p className="text-[9px] text-zinc-400 leading-normal mt-1 line-clamp-2">{st.desc}</p>
                </div>

                <div className="border-t border-white/[0.05] pt-1.5 mt-2 text-[9px] font-mono space-y-0.5">
                  <div className="flex justify-between text-zinc-400">
                    <span>LATENCY:</span>
                    <strong className={isCompleted ? 'text-emerald-400' : isRunning ? 'text-orange-400' : 'text-zinc-500'}>
                      {stageData.latency_ms > 0 ? `${stageData.latency_ms.toFixed(1)}ms` : '--'}
                    </strong>
                  </div>
                  {stageData.finish_time && (
                    <div className="flex justify-between text-zinc-500">
                      <span>FINISH:</span>
                      <span>{stageData.finish_time}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Database & Retrieval Metrics Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-4 bg-zinc-950/80 border-white/10 space-y-3">
          <div className="flex justify-between items-center border-b border-white/[0.08] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Database size={14} className="text-[#FF7A00]" /> SQL Retriever Metrics
            </h3>
            <span className="text-[10px] font-mono text-zinc-400">{db.sql_execution_time_ms.toFixed(1)} ms</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-zinc-900/60 p-2.5 rounded border border-white/[0.04]">
              <span className="text-zinc-500 text-[10px] block">TOTAL QUERIES:</span>
              <strong className="text-white text-base">{db.sql_query_count}</strong>
            </div>
            <div className="bg-zinc-900/60 p-2.5 rounded border border-white/[0.04]">
              <span className="text-zinc-500 text-[10px] block">ROWS RETURNED:</span>
              <strong className="text-emerald-400 text-base">{db.sql_rows_returned}</strong>
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 bg-zinc-950/80 border-white/10 space-y-3">
          <div className="flex justify-between items-center border-b border-white/[0.08] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Network size={14} className="text-[#FF7A00]" /> Neo4j Graph Metrics
            </h3>
            <span className="text-[10px] font-mono text-zinc-400">{db.neo4j_execution_time_ms.toFixed(1)} ms</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="bg-zinc-900/60 p-2 rounded border border-white/[0.04]">
              <span className="text-zinc-500 text-[9px] block">TRAVERSALS:</span>
              <strong className="text-white text-sm">{db.neo4j_traversal_count}</strong>
            </div>
            <div className="bg-zinc-900/60 p-2 rounded border border-white/[0.04]">
              <span className="text-zinc-500 text-[9px] block">NODES:</span>
              <strong className="text-emerald-400 text-sm">{db.neo4j_nodes_visited}</strong>
            </div>
            <div className="bg-zinc-900/60 p-2 rounded border border-white/[0.04]">
              <span className="text-zinc-500 text-[9px] block">EDGES:</span>
              <strong className="text-orange-400 text-sm">{db.neo4j_edges_traversed}</strong>
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 bg-zinc-950/80 border-white/10 space-y-3">
          <div className="flex justify-between items-center border-b border-white/[0.08] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Sparkles size={14} className="text-[#FF7A00]" /> Vector Store Metrics
            </h3>
            <span className="text-[10px] font-mono text-zinc-400">{db.vector_retrieval_time_ms.toFixed(1)} ms</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="bg-zinc-900/60 p-2 rounded border border-white/[0.04]">
              <span className="text-zinc-500 text-[9px] block">DOCS FETCHED:</span>
              <strong className="text-white text-sm">{db.vector_documents_retrieved}</strong>
            </div>
            <div className="bg-zinc-900/60 p-2 rounded border border-white/[0.04]">
              <span className="text-zinc-500 text-[9px] block">CHUNKS RANKED:</span>
              <strong className="text-emerald-400 text-sm">{db.chunks_ranked}</strong>
            </div>
            <div className="bg-zinc-900/60 p-2 rounded border border-white/[0.04]">
              <span className="text-zinc-500 text-[9px] block">AVG SIMILARITY:</span>
              <strong className="text-orange-400 text-sm">{db.avg_similarity_score.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Agents Grid & Telemetry Detail Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Sub-Agents Cards Grid */}
        <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(agentsMetrics).map(([key, ag]) => {
            const IconComponent = agentIcons[key] || Cpu;
            const isSelected = selectedAgent === key;
            const isRunning = ag.status === 'Executing' || ag.status === 'Running';
            const isFailed = ag.status === 'Failed';

            return (
              <div 
                key={key}
                onClick={() => setSelectedAgent(key)}
                className={`glass-panel p-4 flex flex-col justify-between cursor-pointer transition-all ${
                  isSelected ? 'border-[#FF7A00] bg-orange-500/[0.03]' : 'border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded ${isSelected ? 'bg-[#FF7A00] text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>
                      <IconComponent size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-tight">{ag.name}</h4>
                      <span className="text-[9px] text-zinc-500 font-mono">ID: {key}</span>
                    </div>
                  </div>
                  <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                    isRunning ? 'bg-orange-500/20 text-orange-400 animate-pulse' : isFailed ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {ag.status}
                  </span>
                </div>

                <p className="text-[10px] text-zinc-400 mt-3 font-sans line-clamp-2 bg-zinc-950/60 p-2 rounded border border-white/[0.03]">
                  {ag.task}
                </p>

                <div className="mt-4 grid grid-cols-3 gap-1 text-[9px] font-mono border-t border-white/[0.05] pt-3 text-zinc-400">
                  <div>
                    <span className="block text-zinc-500 text-[8px]">LATENCY</span>
                    <strong className="text-white">{ag.execution_time_ms}ms</strong>
                  </div>
                  <div>
                    <span className="block text-zinc-500 text-[8px]">TOKENS</span>
                    <strong className="text-emerald-400">{ag.input_tokens + ag.output_tokens}</strong>
                  </div>
                  <div>
                    <span className="block text-zinc-500 text-[8px]">CONF</span>
                    <strong className="text-orange-400">{Math.round(ag.confidence * 100)}%</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Agent Inspector Panel */}
        <div className="xl:col-span-1 glass-panel p-5 bg-zinc-950/90 border-white/10 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/[0.08] pb-3 flex items-center gap-2">
              <Cpu size={16} className="text-[#FF7A00]" /> Agent Telemetry Inspector
            </h3>

            {selectedAgent && agentsMetrics[selectedAgent] ? (
              <div className="space-y-4 text-xs font-sans">
                <div>
                  <span className="text-[9px] bg-[#FF7A00]/20 border border-[#FF7A00]/40 text-[#FF7A00] px-2 py-0.5 rounded font-mono font-bold uppercase">
                    {agentsMetrics[selectedAgent].status}
                  </span>
                  <h4 className="text-base font-bold text-white mt-2">{agentsMetrics[selectedAgent].name}</h4>
                </div>

                <div className="p-3 bg-zinc-900/80 border border-white/10 rounded-lg space-y-2 font-mono text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Agent UID:</span>
                    <span className="text-white">{selectedAgent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Execution Latency:</span>
                    <span className="text-emerald-400">{agentsMetrics[selectedAgent].execution_time_ms} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Memory Usage:</span>
                    <span className="text-white">{agentsMetrics[selectedAgent].memory_mb} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Input / Output Tokens:</span>
                    <span className="text-orange-400">{agentsMetrics[selectedAgent].input_tokens} / {agentsMetrics[selectedAgent].output_tokens}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Docs Processed:</span>
                    <span className="text-white">{agentsMetrics[selectedAgent].documents_processed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Errors / Retries:</span>
                    <span className="text-red-400">{agentsMetrics[selectedAgent].errors} / {agentsMetrics[selectedAgent].retry_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Last Execution:</span>
                    <span className="text-zinc-400">{agentsMetrics[selectedAgent].last_execution || 'Never'}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Current Task Description</span>
                  <p className="text-zinc-300 leading-relaxed bg-zinc-900/50 p-3 rounded border border-white/10 text-xs">
                    {agentsMetrics[selectedAgent].task}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500 text-xs">
                Select an agent card on the left to inspect detailed thread parameters.
              </div>
            )}
          </div>

          <button 
            onClick={handleRunTestQuery}
            disabled={isExecutingQuery}
            className="w-full bg-[#FF7A00] text-black font-bold text-xs py-2.5 rounded hover:bg-orange-400 transition-all font-mono"
          >
            EXECUTE PIPELINE TEST
          </button>
        </div>
      </div>

      {/* Section 5: Real-Time Event Log Buffer */}
      <div className="glass-panel p-5 bg-zinc-950/90 border-white/10 flex flex-col gap-3">
        <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-[#FF7A00]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-heading">
              Centralized Backend Telemetry Logs Feed (`/api/logs`)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {['ALL', 'INFO', 'WARNING', 'ERROR'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setLogFilter(lvl)}
                className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded border transition-all ${
                  logFilter === lvl ? 'bg-[#FF7A00] text-black border-[#FF7A00]' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="h-48 overflow-y-auto font-mono text-[10px] space-y-1 pr-2 bg-zinc-950 p-3 rounded border border-white/[0.05]">
          {logs.length > 0 ? (
            logs.slice().reverse().map(l => (
              <div key={l.id} className="flex items-start gap-3 py-1 border-b border-white/[0.02]">
                <span className="text-zinc-500 w-14 shrink-0">{l.timestamp}</span>
                <span className={`w-14 shrink-0 font-bold ${
                  l.level === 'ERROR' ? 'text-red-400' : l.level === 'WARNING' ? 'text-orange-400' : 'text-emerald-400'
                }`}>
                  [{l.level}]
                </span>
                <span className="text-zinc-400 w-24 shrink-0 font-semibold">{l.category}</span>
                <span className="text-zinc-300">{l.message}</span>
              </div>
            ))
          ) : (
            <div className="text-zinc-600 text-center py-6">No telemetry logs matching filter.</div>
          )}
        </div>
      </div>

    </div>
  );
};
