import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { 
  FileText, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  MapPin, 
  TrendingUp, 
  ArrowUpRight, 
  Zap, 
  Layers,
  ChevronRight,
  Filter
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { data: stats, isLoading, isError, error, refetch } = useDashboard();

  if (isLoading) {
    return (
      <div className="w-full p-8 space-y-8 bg-black">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 shimmer-loader rounded-md" />
          <div className="h-10 w-32 shimmer-loader rounded-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 shimmer-loader rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[420px] shimmer-loader rounded-xl" />
          <div className="h-[420px] shimmer-loader rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="w-full p-8 flex items-center justify-center min-h-[500px] bg-black">
        <div className="glass-panel p-8 text-center flex flex-col items-center gap-4 max-w-md">
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-white uppercase tracking-wider">Dashboard Synching Failed</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {error?.message || 'Failed to establish connection to the Karnataka State Police core server.'}
          </p>
          <button 
            onClick={() => refetch()}
            className="btn-glow mt-2 py-2 px-6 font-bold"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Bind real counts to the metric display configuration
  const metrics = [
    { label: 'Total FIRs', count: stats.totalFirs, change: stats.totalFirsChange, icon: FileText, sparkline: [10, 15, 8, 20, 18, 25, 32], color: '#FF7A00' },
    { label: 'Active Cases', count: stats.activeCases, change: stats.activeCasesChange, icon: Clock, sparkline: [30, 25, 28, 22, 24, 18, 15], color: '#00A3FF' },
    { label: 'Pending Investigations', count: stats.pendingInvestigations, change: stats.pendingInvestigationsChange, icon: Layers, sparkline: [12, 14, 15, 10, 12, 9, 8], color: '#00E575' },
    { label: 'High Risk Offenders', count: stats.highRiskOffenders, countOverride: stats.highRiskOffenders.toString(), change: stats.highRiskOffendersChange, icon: ShieldAlert, sparkline: [5, 8, 12, 10, 15, 18, 24], color: '#FF3B30' },
    { label: 'Crime Hotspots', count: 0, countOverride: stats.crimeHotspots, change: 'Stable', icon: MapPin, sparkline: [8, 8, 9, 9, 10, 9, 10], color: '#00A3FF' },
    { label: 'AI Risk Warnings', count: stats.aiRiskWarnings, change: 'Critical', icon: AlertTriangle, sparkline: [1, 2, 1, 3, 2, 4, 3], color: '#FF7A00' }
  ];

  // Helper to find hotspot count for scaling
  const getHotspotCount = (name: string): number => {
    return stats.hotspots.find(h => h.district.toLowerCase().includes(name.toLowerCase()))?.incident_count || 1;
  };

  return (
    <div className="w-full p-8 space-y-8 bg-gradient-to-b from-black to-zinc-950">
      {/* Top Welcome Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white font-heading tracking-tight flex items-center gap-3">
            COMMAND CENTER <span className="text-zinc-500 font-normal text-2xl">| Overview</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-4 leading-relaxed">Real-time crime intelligence &amp; predictive analysis dashboard.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary text-xs flex items-center gap-2">
            <Filter size={14} />
            <span>District: All</span>
          </button>
          <button className="btn-glow text-xs flex items-center gap-2">
            <Zap size={14} />
            <span>Force Live Feed</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div 
              key={m.label} 
              className="glass-panel p-4 flex flex-col justify-between hover:translate-y-[-2px] transition-transform duration-300 relative overflow-hidden group"
            >
              {/* Top Row inside card */}
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider leading-none mt-1">{m.label}</span>
                <div className="p-1.5 rounded-md bg-white/[0.03] group-hover:bg-[#FF7A00]/10 text-zinc-400 group-hover:text-[#FF7A00] transition-colors">
                  <Icon size={16} />
                </div>
              </div>

              {/* Number and Sparkline */}
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <h3 className="text-2xl font-bold font-heading text-white tracking-tight leading-none">
                    {m.countOverride !== undefined ? m.countOverride : m.count.toLocaleString()}
                  </h3>
                  <span className={`text-[10px] font-bold mt-1.5 block ${
                    m.change.startsWith('+') ? 'text-red-500' : m.change.startsWith('-') ? 'text-emerald-500' : 'text-zinc-400'
                  }`}>
                    {m.change}
                  </span>
                </div>
                
                {/* SVG sparkline */}
                <svg className="w-16 h-8 opacity-75 group-hover:opacity-100 transition-opacity">
                  <polyline
                    fill="none"
                    stroke={m.color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={m.sparkline.map((val, idx) => `${(idx / (m.sparkline.length - 1)) * 64},${32 - (val / 35) * 30}`).join(' ')}
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts & Heatmap Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Crime Heatmap (SVG Map) */}
        <div className="lg:col-span-2 glass-panel p-5 flex flex-col justify-between h-[420px] relative">
          <div className="flex justify-between items-center border-b border-white/[0.05] pb-3">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers size={14} className="text-[#FF7A00]" />
              Interactive District Crime Heatmap
            </h2>
            <div className="flex items-center gap-4 text-[10px] text-zinc-400">
              <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-600"></span> High Risk</div>
              <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-orange-500"></span> Moderate</div>
              <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Low</div>
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            <svg viewBox="0 0 600 300" className="w-full h-full max-h-[280px]">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5"/>
                </pattern>
                <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#FF7A00" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Dynamic sizes based on real data counts */}
              {/* Bengaluru */}
              <circle cx="380" cy="220" r={30 + getHotspotCount("Central") * 5} fill="url(#mapGlow)" />
              <circle cx="380" cy="220" r="6" fill="#FF3B30" className="animate-ping" style={{ animationDuration: '2s' }} />
              <circle cx="380" cy="220" r="4" fill="#FF3B30" />
              <text x="380" y="245" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-heading)">Bengaluru (High Alert)</text>
              
              {/* Mysuru */}
              <circle cx="310" cy="250" r={20 + getHotspotCount("Mysore") * 3} fill="none" stroke="rgba(255, 122, 0, 0.2)" strokeDasharray="3 3" />
              <circle cx="310" cy="250" r="4" fill="#FF7A00" className="animate-ping" />
              <circle cx="310" cy="250" r="4" fill="#FF7A00" />
              <text x="310" y="270" fill="#a1a1aa" fontSize="9" textAnchor="middle">Mysuru</text>

              {/* Hubballi-Dharwad */}
              <circle cx="240" cy="120" r="30" fill="none" stroke="rgba(0, 163, 255, 0.2)" />
              <circle cx="240" cy="120" r="4" fill="#00A3FF" />
              <text x="240" y="140" fill="#a1a1aa" fontSize="9" textAnchor="middle">Hubballi-Dharwad</text>

              {/* Belagavi */}
              <circle cx="180" cy="80" r="4" fill="#FF3B30" />
              <text x="180" y="70" fill="#a1a1aa" fontSize="9" textAnchor="middle">Belagavi</text>

              {/* Mangaluru */}
              <circle cx="220" cy="210" r="4" fill="#00E575" />
              <text x="220" y="225" fill="#a1a1aa" fontSize="9" textAnchor="middle">Mangaluru</text>

              {/* Kalaburagi */}
              <circle cx="390" cy="60" r="4" fill="#FF7A00" />
              <text x="390" y="80" fill="#a1a1aa" fontSize="9" textAnchor="middle">Kalaburagi</text>

              {/* Connecting grid lines */}
              <path d="M180,80 L240,120 M240,120 L310,250 M310,250 L380,220 M380,220 L390,60 M240,120 L220,210 M220,210 L310,250" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </svg>
          </div>
          
          <div className="border-t border-white/[0.05] pt-3 flex justify-between items-center text-xs text-zinc-400">
            <span>Grid Scan Rate: <strong className="text-white font-mono">2.4 GHz</strong></span>
            <span>Data Sync: <strong className="text-[#FF7A00]">Active (1s ago)</strong></span>
          </div>
        </div>

        {/* Recent AI Alerts */}
        <div className="glass-panel p-5 flex flex-col h-[420px]">
          <div className="flex justify-between items-center border-b border-white/[0.05] pb-3 mb-4">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={14} className="text-[#FF7A00]" />
              Recent AI Intelligence Alerts
            </h2>
            <span className="text-[9px] bg-[#FF7A00]/10 border border-[#FF7A00]/20 text-[#FF7A00] px-1.5 py-0.5 rounded font-bold uppercase font-mono">Live</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            {stats.recentAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className="p-3 rounded-lg border border-white/[0.03] bg-zinc-950/40 hover:border-zinc-800 transition-colors flex gap-3 group cursor-pointer"
              >
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                  alert.type === 'critical' ? 'bg-red-500 animate-pulse' : alert.type === 'warning' ? 'bg-[#FF7A00]' : 'bg-zinc-500'
                }`} />
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-xs font-bold text-white group-hover:text-[#FF7A00] transition-colors">{alert.title}</h4>
                    <span className="text-[9px] text-zinc-500 font-mono">{alert.time}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{alert.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 btn-secondary py-2 justify-center text-xs text-zinc-300 hover:text-white font-medium">
            <span>View All Anomalies</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

      </div>

      {/* Bottom Section: Trend Graph & Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Crime Trend Graph (SVG chart) */}
        <div className="lg:col-span-2 glass-panel p-5 h-[320px] flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-white/[0.05] pb-3">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={14} className="text-[#FF7A00]" />
              Crime Trend Graph (Weekly Incidents)
            </h2>
            <div className="flex items-center gap-3 text-[10px]">
              <div className="flex items-center gap-1 text-zinc-400"><span className="w-2.5 h-2.5 rounded-full bg-[#FF7A00]"></span> Current Week</div>
              <div className="flex items-center gap-1 text-zinc-400"><span className="w-2.5 h-2.5 rounded-full bg-zinc-700"></span> Previous Week</div>
            </div>
          </div>

          <div className="flex-1 relative flex items-end justify-center py-4">
            <svg viewBox="0 0 500 150" className="w-full h-full max-h-[140px] overflow-visible">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#FF7A00" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3 3" />
              
              <path 
                d="M0,130 Q80,110 160,115 T320,60 T500,80" 
                fill="none" 
                stroke="rgba(255, 255, 255, 0.15)" 
                strokeWidth="1.5" 
                strokeDasharray="4 4"
              />

              <path 
                d="M0,150 L0,120 Q80,100 160,80 T320,40 T500,50 L500,150 Z" 
                fill="url(#areaGradient)" 
              />
              
              <path 
                d="M0,120 Q80,100 160,80 T320,40 T500,50" 
                fill="none" 
                stroke="#FF7A00" 
                strokeWidth="2.5" 
                strokeLinecap="round"
              />

              <circle cx="320" cy="40" r="5" fill="#FF7A00" className="animate-ping" />
              <circle cx="320" cy="40" r="3.5" fill="#FF7A00" stroke="#fff" strokeWidth="1" />
              <text x="320" y="25" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle" className="font-mono">Peak (Weekend)</text>
              
              <text x="5" y="148" fill="#525252" fontSize="8" fontFamily="var(--font-mono)">MON</text>
              <text x="83" y="148" fill="#525252" fontSize="8" fontFamily="var(--font-mono)">TUE</text>
              <text x="166" y="148" fill="#525252" fontSize="8" fontFamily="var(--font-mono)">WED</text>
              <text x="250" y="148" fill="#525252" fontSize="8" fontFamily="var(--font-mono)">THU</text>
              <text x="333" y="148" fill="#525252" fontSize="8" fontFamily="var(--font-mono)">FRI</text>
              <text x="416" y="148" fill="#525252" fontSize="8" fontFamily="var(--font-mono)">SAT</text>
              <text x="490" y="148" fill="#525252" fontSize="8" fontFamily="var(--font-mono)" textAnchor="end">SUN</text>
            </svg>
          </div>
          
          <div className="border-t border-white/[0.05] pt-3 flex justify-between items-center text-xs text-zinc-400">
            <span>Total weekly cases: <strong className="text-white font-mono">1,142</strong></span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span>Weekly Trend Down -1.4%</span>
            </span>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="glass-panel p-5 h-[320px] flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-white/[0.05] pb-3 mb-3">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock size={14} className="text-[#FF7A00]" />
              Live Activity Feed
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] text-emerald-400 font-bold font-mono uppercase tracking-wider">Stream Live</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
            {stats.liveActivity.map((t) => (
              <div key={t.id} className="flex gap-3 border-l border-white/[0.05] pl-3 relative ml-1.5 pb-1">
                <div className="absolute -left-1 top-1.5 w-2 h-2 rounded-full bg-[#FF7A00] border border-black" />
                <div className="flex-1">
                  <div className="flex justify-between items-center text-zinc-400">
                    <span className="font-mono text-[10px] text-zinc-500 font-bold">{t.time} | {t.location}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{t.badge}</span>
                  </div>
                  <p className="text-white font-medium mt-1 tracking-tight">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 btn-secondary py-2 justify-center text-xs text-zinc-300 hover:text-white font-medium">
            <span>Access Terminal Logs</span>
            <ChevronRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
};
