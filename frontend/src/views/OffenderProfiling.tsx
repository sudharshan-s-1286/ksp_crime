import React, { useState } from 'react';
import { 
  User, 
  AlertTriangle, 
  MapPin, 
  Calendar, 
  Fingerprint, 
  Activity, 
  Clock, 
  Share2, 
  Brain, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export const OffenderProfiling: React.FC = () => {
  const [selectedSuspect, setSelectedSuspect] = useState('Suresh Patil');

  const suspects = [
    { name: 'Suresh Patil', alias: 'Patil Hegde', status: 'Wanted', risk: 89 },
    { name: 'Laxman Naik', alias: 'Naik Baba', status: 'Under Surveillance', risk: 94 },
    { name: 'Anand Hegde', alias: 'Broker Hegde', status: 'Detained', risk: 65 }
  ];

  return (
    <div className="w-full p-8 flex flex-col bg-zinc-950/20">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/[0.05] pb-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-heading uppercase tracking-tight flex items-center gap-2">
            <Fingerprint className="text-[#FF7A00]" /> Offender Profiling
          </h1>
          <p className="text-sm text-zinc-400 mt-4 leading-relaxed">Cross-agent suspect directory containing intelligence briefs, associate networks, and MO pattern charts.</p>
        </div>
        <div>
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
            <span className="text-xs text-zinc-500 font-mono">Active Dossier:</span>
            <select 
              value={selectedSuspect} 
              onChange={(e) => setSelectedSuspect(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-white cursor-pointer focus:text-[#FF7A00] text-xs"
            >
              {suspects.map(s => (
                <option key={s.name} value={s.name} className="bg-zinc-950 text-white">{s.name} ({s.alias})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Col: Dossier Selection & List */}
        <div className="xl:col-span-1 glass-panel p-5 flex flex-col justify-between h-full bg-zinc-900/10">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Dossier List</h3>
            <div className="space-y-2">
              {suspects.map((s) => (
                <button
                  key={s.name}
                  onClick={() => setSelectedSuspect(s.name)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                    selectedSuspect === s.name 
                      ? 'bg-orange-500/10 text-white border-orange-500/30' 
                      : 'bg-zinc-950/40 text-zinc-400 border-zinc-850 hover:text-white hover:border-zinc-800'
                  }`}
                >
                  <div className="flex justify-between items-baseline font-semibold">
                    <span className="truncate">{s.name}</span>
                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.25 rounded border ${
                      s.status === 'Wanted' 
                        ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                        : s.status === 'Detained'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-[#FF7A00]/10 border-[#FF7A00]/20 text-[#FF7A00]'
                    }`}>{s.status}</span>
                  </div>
                  <div className="flex justify-between mt-2.5 text-[10px] text-zinc-500">
                    <span>Alias: {s.alias}</span>
                    <strong className="text-white font-mono">{s.risk}% Risk</strong>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <button className="w-full btn-glow py-2 justify-center text-xs font-bold">
            <span>REGISTER NEW DOSSIER</span>
          </button>
        </div>

        {/* Center Cols: Profile details & risk meter */}
        <div className="xl:col-span-2 glass-panel p-5 flex flex-col h-full bg-zinc-950/60 overflow-y-auto">
          
          {/* Top bio row */}
          <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-white/[0.05] pb-5 mb-5">
            <div className="w-24 h-24 rounded-lg bg-zinc-850 border border-zinc-700 flex items-center justify-center font-bold text-3xl text-zinc-600 flex-shrink-0 relative overflow-hidden">
              <User size={48} className="text-zinc-500" />
              {/* Photo watermark */}
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80" />
              <span className="absolute bottom-1.5 text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-wider">SECURE DOSSIER</span>
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div>
                <span className="text-[9px] bg-red-500/10 border border-red-500/20 text-red-500 px-2 py-0.5 rounded font-mono font-bold uppercase">WANTED ESCAPEE</span>
                <h2 className="text-xl font-bold font-heading text-white mt-1.5">{selectedSuspect}</h2>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-zinc-400">
                <div>Age: <strong className="text-white">38</strong></div>
                <div>Clearance: <strong className="text-white">Confidential</strong></div>
                <div>Arrests: <strong className="text-white">4</strong></div>
                <div>Convictions: <strong className="text-white">1</strong></div>
              </div>
            </div>

            {/* Risk gauge */}
            <div className="flex flex-col items-center gap-1.5 bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex-shrink-0">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono">AI Risk Assessment</span>
              
              {/* SVG gauge */}
              <svg width="80" height="40" className="overflow-visible">
                {/* Background arc */}
                <path d="M 10 40 A 30 30 0 0 1 70 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" strokeLinecap="round" />
                {/* Colored progress arc (89% fill) */}
                <path d="M 10 40 A 30 30 0 0 1 65 20" fill="none" stroke="#FF7A00" strokeWidth="8" strokeLinecap="round" className="animate-pulse" />
              </svg>
              
              <span className="text-lg font-bold font-mono text-white leading-none mt-1">89%</span>
              <span className="text-[8px] font-mono text-red-500 font-bold tracking-widest uppercase">CRITICAL</span>
            </div>
          </div>

          {/* Modus Operandi & Psychological Brief */}
          <div className="space-y-5 text-xs">
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Modus Operandi</span>
              <p className="text-zinc-300 leading-relaxed font-sans bg-zinc-900/60 p-3 rounded border border-zinc-800">
                Primarily operates via offshore money laundering accounts and digital extortion rings. Uses local field runner nodes (e.g. Laxman Naik) to execute physical cash extortions. Highly coordinated and rarely participates directly in field offenses.
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Brain size={12} className="text-[#FF7A00]" /> AI Cognitive Psychological Profiling
              </span>
              <p className="text-zinc-300 italic leading-relaxed bg-zinc-950 p-3 border border-white/[0.02] rounded-lg">
                "Profile exhibits calculated risk-taking behavior. Highly organized financial strategist. Tracks police frequencies and shifts. Unlikely to remain at registered coordinates for more than 48 hours."
              </p>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Historical Record Timeline</span>
              <div className="space-y-3 border-l border-zinc-800 pl-3.5 ml-1.5 text-xs">
                <div className="relative">
                  <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-black" />
                  <span className="text-[9px] text-zinc-500 font-mono font-bold">June 24, 2026</span>
                  <p className="font-semibold text-white">Extortion FIR #872/2026 registered</p>
                  <p className="text-sm text-zinc-400 mt-3 leading-relaxed">Accused of threatening Karnataka Tech Merchant association.</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-700 border-2 border-black" />
                  <span className="text-[9px] text-zinc-500 font-mono font-bold">May 12, 2025</span>
                  <p className="font-semibold text-zinc-400">Arrested for financial fraud loop (IPC 420)</p>
                  <p className="text-sm text-zinc-400 mt-3 leading-relaxed">Detained by Cyber Cell; later released on bail.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Col: Known Associates list */}
        <div className="xl:col-span-1 glass-panel p-5 flex flex-col justify-between h-full bg-zinc-900/10">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Share2 size={14} className="text-[#FF7A00]" /> Known Associates
            </h3>
            
            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-zinc-950 border border-zinc-850 rounded hover:border-[#FF7A00]/40 cursor-pointer transition-colors space-y-1">
                <div className="flex justify-between items-center">
                  <strong className="text-white">Laxman Naik</strong>
                  <span className="text-[8px] bg-red-500/10 text-red-500 border border-red-500/20 px-1 py-0.25 rounded font-mono font-bold">94% LINK</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">Field Operator. CCTV captures connect suspect vehicles directly.</p>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-850 rounded hover:border-[#FF7A00]/40 cursor-pointer transition-colors space-y-1">
                <div className="flex justify-between items-center">
                  <strong className="text-white">Anand Hegde</strong>
                  <span className="text-[8px] bg-orange-500/10 text-orange-500 border border-orange-500/20 px-1 py-0.25 rounded font-mono font-bold">65% LINK</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">Smuggling Handler. Receives wires into transit clearance nodes.</p>
              </div>
            </div>
          </div>
          
          <button className="w-full btn-secondary text-xs justify-center py-2.5 font-bold">
            <span>EXPORT DOSSIER BRIEF</span>
            <ChevronRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
};
