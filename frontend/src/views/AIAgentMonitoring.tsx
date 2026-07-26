import React, { useState } from 'react';
import { useAgentMonitoring } from '../hooks/useAgentMonitoring';
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
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';

interface AgentStatus {
  id: string;
  name: string;
  status: 'Idle' | 'Executing' | 'Aggregating';
  latency: number;
  confidence: number;
  memory: string;
  task: string;
  icon: any;
}

export const AIAgentMonitoring: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>('master');
  const { data: liveAgents } = useAgentMonitoring();

  const agents: AgentStatus[] = [
    { id: 'master', name: 'Master Orchestrator', status: 'Idle', latency: liveAgents?.[0]?.execution_time_ms ?? 8, confidence: liveAgents?.[0]?.confidence ?? 99, memory: '110 MB', task: 'Directing intents to sub-agent blocks', icon: Brain },
    { id: 'crime', name: 'Crime Intelligence Agent', status: 'Executing', latency: liveAgents?.[1]?.execution_time_ms ?? 45, confidence: liveAgents?.[1]?.confidence ?? 94, memory: '185 MB', task: 'Ingesting FIR summaries from Karnataka database', icon: Sparkles },
    { id: 'network', name: 'Network Graph Agent', status: 'Idle', latency: liveAgents?.[3]?.execution_time_ms ?? 12, confidence: liveAgents?.[3]?.confidence ?? 91, memory: '140 MB', task: 'Mapping accomplice nodes via Neo4j cypher', icon: Network },
    { id: 'analytics', name: 'Analytics Core Agent', status: 'Idle', latency: liveAgents?.[1]?.execution_time_ms ?? 18, confidence: liveAgents?.[1]?.confidence ?? 95, memory: '95 MB', task: 'Compiling weekly district incident aggregates', icon: TrendingUp },
    { id: 'financial', name: 'Financial Fraud Agent', status: 'Executing', latency: liveAgents?.[4]?.execution_time_ms ?? 62, confidence: liveAgents?.[4]?.confidence ?? 89, memory: '210 MB', task: 'Cross-auditing wire transfers against shell bank list', icon: Wallet },
    { id: 'forecast', name: 'Forecast Predictor Agent', status: 'Idle', latency: liveAgents?.[2]?.execution_time_ms ?? 24, confidence: liveAgents?.[2]?.confidence ?? 82, memory: '130 MB', task: 'Synthesizing historical clusters for upcoming intervals', icon: Clock },
    { id: 'explain', name: 'Explainability Core Agent', status: 'Idle', latency: 14, confidence: 98, memory: '80 MB', task: 'Tracing reasoning vectors for validation audit logs', icon: ShieldCheck }
  ];

  // Pipeline stages for the visual Hybrid RAG graph
  const pipelineStages = [
    { id: '1', label: 'User Query', desc: 'Natural Language Ingestion', status: 'Complete', latency: '4ms' },
    { id: '2', label: 'Master Orchestrator', desc: 'Intent Parser & Router', status: 'Complete', latency: '8ms' },
    { id: '3', label: 'Parallel Retrievers', desc: 'SQL / Graph / Vector index search', status: 'Active', latency: '48ms' },
    { id: '4', label: 'Evidence Aggregator', desc: 'Consolidated Context Pool', status: 'Pending', latency: '--' },
    { id: '5', label: 'Reasoning Engine', desc: 'Gemini synthesis & filter', status: 'Pending', latency: '--' },
    { id: '6', label: 'Explainability Output', desc: 'Structured logs & references', status: 'Pending', latency: '--' }
  ];

  return (
    <div className="w-full p-8 flex flex-col bg-zinc-950/20">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/[0.05] pb-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-heading uppercase tracking-tight flex items-center gap-2">
            <Activity className="text-[#FF7A00]" /> Agent Core Monitoring
          </h1>
          <p className="text-sm text-zinc-400 mt-4 leading-relaxed">Real-time resource utilization, response times, and RAG workflow tracing for active system agent units.</p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Col 3: Hybrid RAG Pipeline visualization + Agent grid */}
        <div className="xl:col-span-3 flex flex-col gap-6 overflow-y-auto pr-1">
          
          {/* RAG pipeline visualization */}
          <div className="glass-panel p-5 h-[340px] flex flex-col justify-between bg-zinc-950/80 relative">
            
            <div className="flex justify-between items-center border-b border-white/[0.05] pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Network size={14} className="text-[#FF7A00]" />
                Hybrid RAG Pipeline Tracing
              </h3>
              <span className="text-[9px] bg-[#FF7A00]/10 border border-[#FF7A00]/20 text-[#FF7A00] px-2 py-0.5 rounded font-mono font-bold">
                LATENCY ACCUMULATOR: 74ms
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center py-4 relative">
              <svg viewBox="0 0 600 160" className="w-full h-full max-h-[140px] overflow-visible">
                <defs>
                  <marker id="ragArrow" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#FF7A00" />
                  </marker>
                </defs>
                
                {/* Horizontal pipeline flow nodes */}
                {pipelineStages.map((stage, idx) => {
                  const nodeX = 50 + idx * 100;
                  const nodeY = 80;
                  const isActive = stage.status === 'Active';
                  const isComplete = stage.status === 'Complete';
                  const strokeColor = isActive ? '#FF7A00' : isComplete ? '#00E575' : 'rgba(255,255,255,0.05)';
                  
                  return (
                    <g key={stage.id} transform={`translate(${nodeX}, ${nodeY})`}>
                      {/* Connecting Line to next node */}
                      {idx < pipelineStages.length - 1 && (
                        <line 
                          x1="18" 
                          y1="0" 
                          x2="82" 
                          y2="0" 
                          stroke={isComplete ? '#00E575' : isActive ? '#FF7A00' : 'rgba(255,255,255,0.05)'} 
                          strokeWidth="1.5" 
                          strokeDasharray={!isComplete && !isActive ? '3 3' : 'none'}
                          markerEnd="url(#ragArrow)"
                        />
                      )}

                      {/* Glowing Ring for Active/Complete */}
                      {(isActive || isComplete) && (
                        <circle 
                          r="18" 
                          fill="none" 
                          stroke={strokeColor} 
                          strokeWidth="1.5" 
                          className="animate-ping" 
                          style={{ animationDuration: '3.5s' }} 
                        />
                      )}

                      {/* Main Node bubble */}
                      <circle 
                        r="14" 
                        fill="#090909" 
                        stroke={strokeColor} 
                        strokeWidth="2" 
                      />

                      {/* Stage Index inside bubble */}
                      <text 
                        y="3" 
                        fill={isComplete || isActive ? '#fff' : '#525252'} 
                        fontSize="8" 
                        fontWeight="bold" 
                        textAnchor="middle"
                        fontFamily="var(--font-mono)"
                      >
                        0{stage.id}
                      </text>

                      {/* Title label */}
                      <text 
                        y="-22" 
                        fill="#fff" 
                        fontSize="8" 
                        fontWeight="bold" 
                        textAnchor="middle"
                        fontFamily="var(--font-heading)"
                      >
                        {stage.label}
                      </text>

                      {/* Subtitle description */}
                      <text 
                        y="28" 
                        fill="#525252" 
                        fontSize="7" 
                        textAnchor="middle"
                        className="font-sans truncate max-w-[80px]"
                      >
                        {stage.desc}
                      </text>

                      {/* Latency info bubble */}
                      {(isComplete || isActive) && (
                        <text 
                          y="38" 
                          fill={isComplete ? '#00E575' : '#FF7A00'} 
                          fontSize="7" 
                          fontWeight="bold" 
                          textAnchor="middle"
                          fontFamily="var(--font-mono)"
                        >
                          {stage.latency}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
            
            <div className="p-3 border-t border-white/[0.05] bg-zinc-950/40 text-[10px] text-zinc-500 font-mono">
              Orchestrator pipeline sync rate: 99.4% precision index. Zero retrieval timeout failures reported.
            </div>
          </div>

          {/* Sub-Agent Monitoring Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => {
              const AgentIcon = agent.icon;
              const isSelected = selectedAgent === agent.id;
              
              return (
                <div 
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`glass-panel p-4 flex flex-col justify-between hover:translate-y-[-1px] transition-all cursor-pointer ${
                    isSelected ? 'border-[#FF7A00] bg-orange-500/[0.02]' : 'border-white/[0.05]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded bg-zinc-900 border ${
                        isSelected ? 'border-[#FF7A00] text-[#FF7A00]' : 'border-zinc-800 text-zinc-400'
                      }`}>
                        <AgentIcon size={14} />
                      </div>
                      <span className="text-xs font-bold text-white tracking-tight">{agent.name}</span>
                    </div>
                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.25 rounded ${
                      agent.status === 'Executing' 
                        ? 'bg-orange-500/10 text-orange-500 animate-pulse' 
                        : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {agent.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-1.5 text-[10px] font-mono border-t border-white/[0.03] pt-3">
                    <div>
                      <span className="text-zinc-500 block">Latency:</span>
                      <strong className="text-white">{agent.latency}ms</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Conf:</span>
                      <strong className="text-emerald-400">{agent.confidence}%</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Memory:</span>
                      <strong className="text-zinc-400">{agent.memory}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right side: Selected agent active telemetry log panel */}
        <div className="xl:col-span-1 glass-panel p-5 flex flex-col justify-between h-full bg-zinc-900/10">
          
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/[0.05] pb-3 mb-2 flex items-center gap-2">
              <Cpu size={14} className="text-[#FF7A00]" />
              Agent Telemetry Brief
            </h3>
            
            {selectedAgent ? (
              <div className="space-y-4 text-xs font-sans animate-slide-up">
                <div>
                  <span className="text-[9px] bg-[#FF7A00]/10 border border-[#FF7A00]/20 text-[#FF7A00] px-2 py-0.5 rounded font-mono font-bold uppercase">
                    {agents.find(a => a.id === selectedAgent)?.status}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-2.5">{agents.find(a => a.id === selectedAgent)?.name}</h4>
                </div>

                <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg space-y-2 font-mono text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Agent UID:</span>
                    <span className="text-zinc-300">copilot_agent_{selectedAgent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Avg execution:</span>
                    <span className="text-white">{agents.find(a => a.id === selectedAgent)?.latency} ms</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Running Task Description</span>
                  <p className="text-zinc-300 leading-relaxed font-sans bg-zinc-950/60 p-3 rounded border border-white/[0.02]">
                    {agents.find(a => a.id === selectedAgent)?.task}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-zinc-500 text-xs">
                Select an agent card to inspect active pipeline telemetry and thread logs.
              </div>
            )}
          </div>
          
          <button className="w-full btn-secondary text-xs justify-center py-2.5 font-bold">
            <span>RUN RE-CALIBRATION SWEEP</span>
          </button>
        </div>

      </div>
    </div>
  );
};
