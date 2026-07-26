import React, { useState } from 'react';
import { 
  TrendingUp, 
  MapPin, 
  Zap, 
  AlertTriangle, 
  Brain, 
  ChevronRight,
  Gauge
} from 'lucide-react';

export const CrimeForecasting: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState('Hebbal Sector');

  const forecastZones = [
    { zone: 'Hebbal Sector', district: 'Bengaluru Central', crime: 'Cyber Extortion', risk: 86, timeframe: 'Next 48 Hours', details: 'Forecast Agent projects surge in extortive cold-calls targeting technology merchants. Historical correlates indicate Friday night peaks.' },
    { zone: 'Hubballi North', district: 'Hubballi-Dharwad', crime: 'Commercial Robbery', risk: 78, timeframe: 'July 03 - July 05', details: 'MO matches lock-cutter signatures. High correlation with weekend night patrols reductions.' },
    { zone: 'Belagavi Central', district: 'Belagavi Rural', crime: 'Co-op Bank Ransom', risk: 64, timeframe: 'Next 5 Days', details: 'Anomalous network scans flagged. Potential ransomware attempts targeted at financial servers.' }
  ];

  return (
    <div className="w-full p-8 flex flex-col bg-zinc-950/20">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/[0.05] pb-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-heading uppercase tracking-tight flex items-center gap-2">
            <TrendingUp className="text-[#FF7A00]" /> AI Crime Forecasting
          </h1>
          <p className="text-sm text-zinc-400 mt-4 leading-relaxed">Predictive analysis engines mapping statistical vectors onto regional coordinates for upcoming intervals.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 bg-[#FF7A00]/10 border border-[#FF7A00]/20 text-[#FF7A00] px-2.5 py-1 rounded font-mono text-[10px] font-bold">
            <Zap size={11} className="animate-pulse" />
            <span>PREDICTIVE SHIELD GRID ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Col 1-3: Prediction map (SVG) */}
        <div className="xl:col-span-3 glass-panel relative bg-zinc-950/80 overflow-hidden h-full flex flex-col justify-between">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-[10px] text-zinc-400 font-mono">
            <span>Coordinate grid scan: active</span>
          </div>
          
          <div className="flex-1 flex items-center justify-center relative">
            {/* Custom SVG cyber mapping scan grid */}
            <svg viewBox="0 0 600 350" className="w-full h-full max-h-[320px]">
              <defs>
                <pattern id="scanGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.01)" strokeWidth="0.5" />
                </pattern>
                
                {/* Glowing red pulse radial */}
                <radialGradient id="highRiskPulse" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FF3B30" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#FF3B30" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#scanGrid)" />

              {/* Grid cell highlights */}
              {/* Hebbal */}
              <rect x="340" y="160" width="60" height="60" fill="url(#highRiskPulse)" />
              <rect x="340" y="160" width="60" height="60" fill="none" stroke="#FF3B30" strokeWidth="0.75" strokeOpacity="0.4" />
              <circle cx="370" cy="190" r="4" fill="#FF3B30" className="animate-ping" style={{ animationDuration: '2s' }} />
              <circle cx="370" cy="190" r="3" fill="#FF3B30" />
              <text x="370" y="150" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-heading)">Hebbal (86% Peak)</text>
              
              {/* Hubballi */}
              <rect x="180" y="100" width="60" height="60" fill="none" stroke="#FF7A00" strokeWidth="0.5" strokeDasharray="3 3" />
              <circle cx="210" cy="130" r="3" fill="#FF7A00" className="animate-ping" style={{ animationDuration: '3s' }} />
              <circle cx="210" cy="130" r="3" fill="#FF7A00" />
              <text x="210" y="90" fill="#A3A3A3" fontSize="8" textAnchor="middle">Hubballi North (78%)</text>
              
              {/* Belagavi */}
              <circle cx="120" cy="70" r="3" fill="#00A3FF" />
              <text x="120" y="60" fill="#A3A3A3" fontSize="8" textAnchor="middle">Belagavi Central</text>

              {/* Connectors */}
              <path d="M120,70 L210,130 M210,130 L370,190" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </svg>
          </div>

          <div className="p-4 border-t border-white/[0.05] bg-zinc-950/60 text-xs flex items-center justify-between">
            <span className="text-zinc-500 font-mono">Scan overlay frequency: <strong className="text-white">62.8 FPS</strong></span>
            <span className="text-zinc-500 font-mono">Precision rate: <strong className="text-emerald-400">92.4% Verified</strong></span>
          </div>
        </div>

        {/* Col 4: Selected zone details */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          
          {/* Details Card */}
          <div className="glass-panel p-5 space-y-4 bg-zinc-900/10">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/[0.05] pb-3">
              <Brain size={14} className="text-[#FF7A00]" />
              Forecast Intelligence Brief
            </h3>
            
            <div className="space-y-4">
              {forecastZones.map((fz) => (
                <button
                  key={fz.zone}
                  onClick={() => setSelectedZone(fz.zone)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-colors space-y-1.5 ${
                    selectedZone === fz.zone 
                      ? 'bg-orange-500/10 text-white border-orange-500/30' 
                      : 'bg-zinc-950/40 text-zinc-400 border-zinc-850 hover:text-white hover:border-zinc-800'
                  }`}
                >
                  <div className="flex justify-between items-baseline font-semibold">
                    <span className="truncate">{fz.zone}</span>
                    <strong className="text-[#FF7A00] font-mono">{fz.risk}% Risk</strong>
                  </div>
                  <p className="text-[10px] text-zinc-500">Crime: {fz.crime} | Time: {fz.timeframe}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Probability Detail panel */}
          {selectedZone && (
            <div className="glass-panel p-5 flex-1 flex flex-col justify-between bg-zinc-900/20 text-xs animate-slide-up">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                  <span className="text-[10px] font-bold text-[#FF7A00] font-mono tracking-widest uppercase">Target Details</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Sector grid coordinate</span>
                </div>
                
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1">
                    <MapPin size={12} className="text-[#FF7A00]" />
                    {selectedZone}
                  </h4>
                  <p className="text-sm text-zinc-400 mt-4 leading-relaxed">District: {forecastZones.find(f => f.zone === selectedZone)?.district}</p>
                </div>

                <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg space-y-1.5 leading-relaxed font-sans text-zinc-300">
                  <span className="text-[9px] text-[#FF7A00] font-mono font-bold uppercase block">AI Analysis Description</span>
                  {forecastZones.find(f => f.zone === selectedZone)?.details}
                </div>
              </div>

              <button className="w-full mt-4 btn-secondary text-xs justify-center py-2.5 font-bold">
                <span>GENERATE PREVENTIVE BEAT PLAN</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
