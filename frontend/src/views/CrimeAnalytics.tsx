import React, { useState } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  Clock, 
  Filter, 
  Download, 
  Layers,
  AlertTriangle
} from 'lucide-react';

export const CrimeAnalytics: React.FC = () => {
  const [analyticsPeriod, setAnalyticsPeriod] = useState('Quarter');
  const { data: analyticsData, isLoading, isError } = useAnalytics();

  // Use real data from backend when available, otherwise fall back to defaults
  const crimesByType = analyticsData?.crimesByType || [];
  const maxCount = Math.max(...crimesByType.map(c => c.count), 1);

  const districtFrequency = [
    { district: 'Bengaluru Central', count: 1850, percentage: 85 },
    { district: 'Hubballi-Dharwad', count: 1200, percentage: 65 },
    { district: 'Mysuru Town', count: 980, percentage: 55 },
    { district: 'Belagavi Rural', count: 850, percentage: 48 },
    { district: 'Mangaluru Port', count: 710, percentage: 38 },
    { district: 'Kalaburagi City', count: 540, percentage: 28 }
  ];

  const timeOfDayDistribution = [
    { period: 'Morning (06:00 - 12:00)', count: 240, color: '#00E575' },
    { period: 'Afternoon (12:00 - 18:00)', count: 320, color: '#00A3FF' },
    { period: 'Evening (18:00 - 24:00)', count: 680, color: '#FF7A00' },
    { period: 'Night (00:00 - 06:00)', count: 480, color: '#FF3B30' }
  ];

  const weekdayAnalysis = [
    { day: 'Mon', count: 140 },
    { day: 'Tue', count: 155 },
    { day: 'Wed', count: 130 },
    { day: 'Thu', count: 125 },
    { day: 'Fri', count: 190 },
    { day: 'Sat', count: 245 },
    { day: 'Sun', count: 220 }
  ];

  if (isLoading) {
    return (
      <div className="w-full p-8 space-y-6 animate-fade-in">
        <div className="h-10 w-72 shimmer-loader rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_,i) => <div key={i} className="h-48 shimmer-loader rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_,i) => <div key={i} className="h-60 shimmer-loader rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-8 flex flex-col bg-zinc-950/20">
      {/* API-sourced Crime Type Breakdown */}
      {crimesByType.length > 0 && (
        <div className="glass-panel p-5 mb-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart3 size={14} className="text-[#FF7A00]" /> Live Crime Type Breakdown (KSP Database)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {crimesByType.map(c => (
              <div key={c.type} className="flex flex-col gap-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400 truncate">{c.type}</span>
                  <span className="text-white font-mono font-bold">{c.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-800">
                  <div className="h-full rounded-full bg-[#FF7A00] transition-all duration-500" style={{ width: `${(c.count / maxCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/[0.05] pb-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-heading uppercase tracking-tight flex items-center gap-2">
            <BarChart3 className="text-[#FF7A00]" /> Crime Analytics Dashboard
          </h1>
          <p className="text-sm text-zinc-400 mt-4 leading-relaxed">Multi-dimensional analytics reporting on crime metrics, district rankings, and chronological distributions.</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={analyticsPeriod} 
            onChange={(e) => setAnalyticsPeriod(e.target.value)}
            className="input-field py-1.5 text-xs bg-zinc-900 border-zinc-800 text-white font-sans"
          >
            <option value="Month">Last 30 Days</option>
            <option value="Quarter">Last 90 Days</option>
            <option value="Year">Full Calendar Year</option>
          </select>
          <button 
            onClick={() => window.open(`http://localhost:8000/api/export-analytics?period=${analyticsPeriod}`, '_blank')}
            className="btn-glow text-xs flex items-center gap-2"
          >
            <Download size={14} />
            <span>Generate PDF Report</span>
          </button>
        </div>
      </div>

      {/* Main Grid Scroll container */}
      <div className="overflow-y-auto space-y-6 pr-1">
        
        {/* Row 1: District Rankings & Time Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Horizontal Bar Chart (District Frequency) */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/[0.05] pb-3">
              <MapPin size={14} className="text-[#FF7A00]" />
              Crime Frequency by Police District
            </h3>
            
            <div className="space-y-4">
              {districtFrequency.map((item, idx) => (
                <div key={idx} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-white">{item.district}</span>
                    <span className="font-mono text-zinc-400">{item.count} incidents</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#FF7A00]/80 to-[#FF7A00] h-full rounded-full transition-all duration-1000"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Time-of-day Donut/Pie Chart */}
          <div className="glass-panel p-5 flex flex-col justify-between h-[360px]">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/[0.05] pb-3">
              <Clock size={14} className="text-[#FF7A00]" />
              Time-Of-Day Incident Distribution
            </h3>

            <div className="flex-1 flex flex-col sm:flex-row items-center justify-around py-4">
              {/* Custom SVG Donut chart */}
              <svg width="150" height="150" viewBox="0 0 100 100" className="rotate-[-90deg]">
                {/* Night Section (Red: 28%) */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#FF3B30" strokeWidth="12" strokeDasharray="70 251.2" strokeDashoffset="0" />
                {/* Evening Section (Orange: 40%) */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#FF7A00" strokeWidth="12" strokeDasharray="100.5 251.2" strokeDashoffset="-70" />
                {/* Afternoon Section (Blue: 19%) */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#00A3FF" strokeWidth="12" strokeDasharray="47.7 251.2" strokeDashoffset="-170.5" />
                {/* Morning Section (Green: 13%) */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#00E575" strokeWidth="12" strokeDasharray="33 251.2" strokeDashoffset="-218.2" />
                
                {/* Inner center cutout */}
                <circle cx="50" cy="50" r="30" fill="#090909" />
              </svg>

              {/* Legends */}
              <div className="space-y-2 text-xs">
                {timeOfDayDistribution.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-zinc-400 font-medium">{item.period}:</span>
                    <strong className="text-white font-mono">{item.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Row 2: Weekday Analysis & Incident Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Weekday Column Chart */}
          <div className="lg:col-span-2 glass-panel p-5 h-[320px] flex flex-col justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/[0.05] pb-3">
              <Calendar size={14} className="text-[#FF7A00]" />
              Weekly Incident Load Analysis
            </h3>

            <div className="flex-1 flex items-end justify-between py-6 px-4">
              {weekdayAnalysis.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                  <span className="text-[10px] font-mono text-zinc-500 font-bold group-hover:text-white transition-colors">{item.count}</span>
                  <div className="w-6 sm:w-10 bg-zinc-900 border border-zinc-800 rounded-t-sm relative h-36 flex items-end overflow-hidden">
                    <div 
                      className="bg-[#FF7A00]/80 group-hover:bg-[#FF7A00] w-full rounded-t-sm transition-all duration-500 group-hover:scale-y-105 origin-bottom"
                      style={{ height: `${(item.count / 260) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 font-mono mt-1 group-hover:text-[#FF7A00] transition-colors">{item.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Core Analytics alerts */}
          <div className="glass-panel p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/[0.05] pb-3 mb-4 flex items-center gap-2">
                <Layers size={14} className="text-[#FF7A00]" />
                Statistical Summary
              </h3>
              
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-zinc-900/60 rounded border border-zinc-800 space-y-1">
                  <span className="text-[9px] text-[#FF7A00] font-mono font-bold uppercase tracking-wider">Anomalous Peak</span>
                  <p className="font-semibold text-white">Friday night robbery clusters identified.</p>
                  <p className="text-sm text-zinc-400 mt-4 leading-relaxed">Robbery incident frequency increased by +34% compared to weekday averages.</p>
                </div>
                
                <div className="p-3 bg-zinc-900/60 rounded border border-zinc-800 space-y-1">
                  <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-wider">Trend Decline</span>
                  <p className="font-semibold text-white">Mysuru district reports -14% reduction.</p>
                  <p className="text-sm text-zinc-400 mt-4 leading-relaxed">Patrolling adjustments in sector 2 helped suppress drug smuggling attempts.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
