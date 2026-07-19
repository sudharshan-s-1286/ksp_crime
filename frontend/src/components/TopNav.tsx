import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Mic, 
  Globe, 
  Bell, 
  Cpu, 
  Sun, 
  User, 
  ChevronDown,
  Volume2,
  VolumeX,
  Languages
} from 'lucide-react';

interface TopNavProps {
  role: string;
  setRole: (role: string) => void;
}

const roles = [
  { name: 'Investigator', clearance: 'Clearance: L3' },
  { name: 'Supervisor', clearance: 'Clearance: L5' },
  { name: 'Policymaker', clearance: 'Clearance: L7' }
];

export const TopNav = React.memo<TopNavProps>(({ role, setRole }) => {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [activeNotifications, setActiveNotifications] = useState<boolean>(true);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
      setDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);



  return (
    <header 
      style={{ 
        flexShrink: 0,
        height: '70px', 
        borderRadius: 0, 
        backgroundColor: '#090909',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Search and Voice search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '320px', height: '40px' }}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search FIRs, suspects, cases..." 
            className="input-field w-full"
            style={{ height: '100%', paddingLeft: '38px', paddingRight: '12px', fontSize: '13px', borderColor: '#27272a', background: 'rgba(9,9,11,0.6)', borderRadius: '10px' }}
          />
        </div>
        
        {/* Voice Search Button */}
        <button 
          onClick={() => {
            setIsListening(!isListening);
            if (!isListening) {
              setTimeout(() => setIsListening(false), 5000);
            }
          }}
          className={`border transition-all duration-300 relative ${
            isListening 
              ? 'border-[#FF7A00] bg-[#FF7A00]/10 text-[#FF7A00] ai-pulse' 
              : 'border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white'
          }`}
          style={{ height: '40px', width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', flexShrink: 0 }}
          title={isListening ? "Listening... Speak now" : "Voice Search"}
        >
          {isListening ? (
            <div className="flex items-center gap-1">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          ) : (
            <Mic size={16} />
          )}
        </button>
      </div>

      {/* Utilities panel */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', height: '40px' }}>
        
        {/* Clock & Date */}
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', fontFamily: 'var(--font-mono)', borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '16px', justifyContent: 'center', height: '100%' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', letterSpacing: '0.05em', lineHeight: 1.2 }}>{time}</span>
          <span style={{ fontSize: '10px', color: '#a1a1aa', marginTop: '2px', lineHeight: 1 }}>{date}</span>
        </div>

        {/* Global AI Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '16px', height: '100%' }}>
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#d4d4d8', letterSpacing: '0.025em', textTransform: 'uppercase' }}>Copilot Core Online</span>
        </div>

        {/* Role Selector dropdown */}
        <div className="relative" style={{ height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '0 14px', cursor: 'pointer', height: '100%' }}>
            <Cpu size={14} className="text-[#FF7A00]" />
            <div className="flex flex-col text-left">
              <span style={{ fontSize: '9px', color: '#71717a', fontWeight: 700, textTransform: 'uppercase', lineHeight: 1 }}>Access Role</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff', marginTop: '1px' }}>{role}</span>
            </div>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)} 
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              {roles.map(r => (
                <option key={r.name} value={r.name}>{r.name} ({r.clearance})</option>
              ))}
            </select>
            <ChevronDown size={14} style={{ color: '#a1a1aa', marginLeft: '4px' }} />
          </div>
        </div>

        {/* Language switch */}
        <button 
          className="rounded-lg border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5" 
          title="Switch Language"
          style={{ height: '40px', padding: '0 12px', background: 'transparent' }}
        >
          <Globe size={15} />
          <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>EN</span>
        </button>

        {/* Notifications */}
        <div className="relative" style={{ height: '100%' }}>
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setActiveNotifications(false);
            }}
            className="rounded-lg border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors relative"
            title="Notifications"
            style={{ height: '40px', width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}
          >
            <Bell size={15} />
            {activeNotifications && (
              <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF7A00] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF7A00]"></span>
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 glass-panel border border-zinc-800 p-4 shadow-xl z-50 animate-slide-up bg-zinc-950" style={{ borderRadius: '12px' }}>
              <div className="flex items-center justify-between border-b border-white/[0.05] pb-2 mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider">AI Security Alerts</span>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="text-[10px] text-zinc-500 hover:text-white font-semibold"
                >
                  Close
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2 text-xs border-b border-white/[0.03] pb-2">
                  <div className="w-1.5 h-1.5 bg-[#FF7A00] rounded-full mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Anomalous movement detected in Belagavi</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">District forecast score surged by +14%</p>
                    <p className="text-[9px] text-zinc-500 mt-1 font-mono">10m ago</p>
                  </div>
                </div>
                <div className="flex gap-2 text-xs border-b border-white/[0.03] pb-2">
                  <div className="w-1.5 h-1.5 bg-[#FF3B30] rounded-full mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Network match: Suresh Patil case suspect</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Known associate active near Bengaluru Rural</p>
                    <p className="text-[9px] text-zinc-500 mt-1 font-mono">42m ago</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '16px', height: '100%' }}>
          <div className="flex flex-col text-right justify-center" style={{ marginRight: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>Suresh Patil</span>
            <span style={{ fontSize: '9px', color: '#71717a', marginTop: '2px', lineHeight: 1 }}>KSP Inspector</span>
          </div>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: '#27272a',
            border: '1px solid #3f3f46',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '12px',
            color: '#fff',
            flexShrink: 0
          }}>
            SP
          </div>
        </div>

      </div>
    </header>
  );
});
