import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Settings as SettingsIcon, 
  Brain, 
  Key, 
  ShieldAlert, 
  Database, 
  Save, 
  Eye, 
  EyeOff,
  CheckCircle2,
  Server
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [model, setModel] = useState('gemini-3.5-flash');
  const [ragDepth, setRagDepth] = useState(5);
  const [showKey, setShowKey] = useState(false);
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';


  return (
    <div className="w-full p-8 flex flex-col bg-zinc-950/20">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/[0.05] pb-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-heading uppercase tracking-tight flex items-center gap-2">
            <SettingsIcon className="text-[#FF7A00]" /> Copilot Configuration Settings
          </h1>
          <p className="text-sm text-zinc-400 mt-4 leading-relaxed">Configure multi-agent pipeline parameters, credentials key scopes, and system thresholds.</p>
        </div>
        <button className="btn-glow text-xs flex items-center gap-2">
          <Save size={14} />
          <span>Save Changes</span>
        </button>
      </div>

      {/* System Connection Status */}
      <div className="flex items-center gap-4 mb-6 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
        <div className="flex-1 text-xs">
          <span className="text-zinc-400">Backend API: </span>
          <span className="text-emerald-400 font-mono">{backendUrl}</span>
          {user && (
            <span className="ml-4 text-zinc-400">Session: <strong className="text-white">{user.name}</strong> ({user.role})</span>
          )}
        </div>
        <span className="text-[9px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">CONNECTED</span>
      </div>

      {/* Settings Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto pr-1">
        
        {/* Col 1: AI Settings */}
        <div className="glass-panel p-5 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/[0.05] pb-3">
            <Brain size={14} className="text-[#FF7A00]" />
            AI Orchestrator Preferences
          </h3>
          
          <div className="space-y-4 text-xs font-sans">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Select Foundation Model</span>
              <select 
                value={model} 
                onChange={(e) => setModel(e.target.value)}
                className="input-field bg-zinc-900 border-zinc-800 text-white"
              >
                <option value="gemini-3.5-flash">Gemini 3.5 Flash (Medium)</option>
                <option value="gemini-3.5-pro">Gemini 3.5 Pro (Heavy)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">RAG Vector Fetch Depth ({ragDepth})</span>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={ragDepth}
                onChange={(e) => setRagDepth(Number(e.target.value))}
                className="accent-[#FF7A00] bg-zinc-900 rounded"
              />
              <span className="text-[9px] text-zinc-500">Max semantic chunks loaded during initial RAG pipeline triggers.</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Agent Cohesion Threshold</span>
              <select className="input-field bg-zinc-900 border-zinc-800 text-white">
                <option>High Consensus (Requires 3 Agent matches)</option>
                <option>Moderate consensus (2 Agent matches)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Col 2: Security & API Keys */}
        <div className="glass-panel p-5 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/[0.05] pb-3">
            <Key size={14} className="text-[#FF7A00]" />
            Security & API Credentials
          </h3>
          
          <div className="space-y-4 text-xs font-sans">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Active API Access Key</span>
              <div className="relative flex items-center">
                <input 
                  type={showKey ? 'text' : 'password'} 
                  value="ksp_live_key_9281a_b3e7f42e493e" 
                  disabled
                  className="input-field w-full pr-10 bg-zinc-900 border-zinc-800 text-white font-mono text-[11px]"
                />
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 text-zinc-400 hover:text-white"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">2FA Token Integration</span>
              <button className="btn-secondary py-2 justify-center font-bold">
                Configure YubiKey Auth
              </button>
            </div>
          </div>
        </div>

        {/* Col 3: Database & Node status */}
        <div className="glass-panel p-5 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/[0.05] pb-3">
            <Database size={14} className="text-[#FF7A00]" />
            System Connections
          </h3>
          
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>MySQL Port:</span>
                <strong className="text-emerald-400">3306 Connected</strong>
              </div>
              <div className="flex justify-between">
                <span>Neo4j Port:</span>
                <strong className="text-emerald-400">7687 Connected</strong>
              </div>
              <div className="flex justify-between">
                <span>Qdrant Port:</span>
                <strong className="text-emerald-400">6333 Connected</strong>
              </div>
            </div>
            
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg space-y-1">
              <span className="text-[9px] text-[#FF7A00] font-bold uppercase tracking-wider font-sans block">Vector Index Status</span>
              <p className="font-semibold text-white font-sans text-[11px]">8,420 FIR documents vectorized</p>
              <p className="text-[10px] text-zinc-400 font-sans mt-1">Qdrant collection index updated on June 30, 2026.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
