import React, { useState, useEffect, useRef } from 'react';
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
  Languages,
  X,
  Calendar,
  MapPin,
  Clock,
  FileText,
  Paperclip,
  Eye,
  Loader2
} from 'lucide-react';
import { fetchCrimeDatabase } from '../services/api';
import type { CrimeRecord } from '../types';

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

  // Search-specific states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<CrimeRecord[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<CrimeRecord | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query fetching
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsLoadingResults(true);
    const delayDebounceFn = setTimeout(() => {
      fetchCrimeDatabase({ search: searchQuery, limit: 5 })
        .then((data) => {
          setSearchResults(data.records);
          setIsLoadingResults(false);
        })
        .catch((err) => {
          console.error(err);
          setIsLoadingResults(false);
        });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const statusStyle = (status: string) => {
    if (status === 'Arrested') return 'bg-red-500/10 border-red-500/20 text-red-400';
    if (status === 'Under Investigation') return 'bg-[#FF7A00]/10 border-[#FF7A00]/20 text-[#FF7A00]';
    if (status === 'Chargesheet Filed') return 'bg-[#00A3FF]/10 border-[#00A3FF]/20 text-[#00A3FF]';
    return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'; // Closed
  };

  return (
    <>
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
        <div 
          ref={dropdownRef}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '320px', height: '40px', position: 'relative' }}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Interactive Search Button */}
            <button 
              type="button"
              onClick={() => {
                inputRef.current?.focus();
                setShowDropdown(true);
              }}
              style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 5,
                color: '#a1a1aa',
                transition: 'all 0.2s ease',
              }}
              className="hover:text-white hover:bg-white/[0.05]"
              title="Search database"
            >
              <Search size={15} />
            </button>

            <input 
              ref={inputRef}
              type="text" 
              placeholder="Search FIRs, suspects, cases..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="input-field w-full"
              style={{ 
                height: '100%', 
                paddingLeft: '38px', 
                paddingRight: searchQuery ? '36px' : '12px', 
                fontSize: '13px', 
                borderColor: '#27272a', 
                background: 'rgba(9,9,11,0.6)', 
                borderRadius: '10px' 
              }}
            />

            {/* Interactive Clear Button */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  inputRef.current?.focus();
                }}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#71717a',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 5,
                }}
                className="hover:text-white transition-colors duration-200"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          {/* Autocomplete dropdown list */}
          {showDropdown && searchQuery.trim() && (
            <div 
              className="glass-panel border border-zinc-800 shadow-2xl z-50 bg-zinc-950/95"
              style={{ 
                position: 'absolute', 
                top: '44px', 
                left: 0, 
                right: 0, 
                maxHeight: '280px', 
                overflowY: 'auto',
                borderRadius: '12px', 
                backdropFilter: 'blur(12px)',
                padding: '6px 0',
              }}
            >
              {isLoadingResults ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#71717a', fontSize: '11px', padding: '12px 14px' }}>
                  <Loader2 size={12} className="animate-spin text-[#FF7A00]" />
                  <span>Searching intelligence database...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '4px 14px', fontSize: '9px', textTransform: 'uppercase', color: '#71717a', fontWeight: 700, letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                    Matching Intelligence
                  </div>
                  {searchResults.map((r) => (
                    <div
                      key={r.fir_id}
                      onClick={() => {
                        setSelectedRecord(r);
                        setShowDropdown(false);
                      }}
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                      className="hover:bg-white/[0.04] group"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#FF7A00' }}>{r.fir_id}</span>
                        <span style={{ fontSize: '9px', color: '#71717a', textTransform: 'uppercase', fontWeight: 600 }}>{r.crime_type}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: '2px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: '#fff' }}>{r.suspect_name}</span>
                        <span style={{ fontSize: '10px', color: '#a1a1aa' }}>{r.district}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '16px 14px', fontSize: '12px', color: '#71717a', textAlign: 'center' }}>
                  No matching intelligence found
                </div>
              )}
            </div>
          )}
          
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

      {/* Side Sliding Drawer Detail View (Global Search Results) */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end animate-fade-in">
          <div className="flex-1" onClick={() => setSelectedRecord(null)} />
          <div className="w-[500px] bg-zinc-950 border-l border-white/[0.08] h-full flex flex-col shadow-2xl animate-slide-left p-6 relative overflow-y-auto" style={{ zIndex: 9999 }}>
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-6 right-6 p-2 rounded-lg hover:bg-white/[0.05] text-zinc-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="border-b border-white/[0.05] pb-4 mb-5">
              <span className="text-[10px] font-bold text-[#FF7A00] font-mono tracking-widest uppercase">Global Search FIR Drawer</span>
              <h2 className="text-xl font-bold font-heading text-white mt-1">{selectedRecord.fir_id}</h2>
              <div className="flex flex-wrap gap-2 mt-3 text-[10px] font-mono">
                <span className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded flex items-center gap-1">
                  <Calendar size={10} /> {selectedRecord.occurrence_date}
                </span>
                <span className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded flex items-center gap-1">
                  <MapPin size={10} /> {selectedRecord.district}
                </span>
                <span className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded flex items-center gap-1">
                  <Clock size={10} /> {selectedRecord.occurrence_time}
                </span>
                <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${statusStyle(selectedRecord.case_status)}`}>
                  {selectedRecord.case_status}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Crime Type</span>
                <p className="text-xs font-semibold text-white bg-zinc-900 border border-zinc-800 p-2.5 rounded">{selectedRecord.crime_type}</p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Modus Operandi</span>
                <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-3 border border-white/[0.03] rounded-lg">
                  {selectedRecord.modus_operandi}
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono flex items-center gap-1">
                  <User size={12} className="text-[#FF7A00]" /> Involved Persons
                </span>
                <div className="p-3 bg-zinc-900/60 rounded border border-zinc-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Primary Suspect:</span>
                    <strong className="text-white">{selectedRecord.suspect_name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Coordinates:</span>
                    <span className="text-zinc-300 font-mono">{selectedRecord.lat.toFixed(4)}, {selectedRecord.lng.toFixed(4)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Evidence Attachments</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 border border-zinc-800 rounded bg-zinc-900 flex items-center gap-2 hover:border-[#FF7A00] cursor-pointer">
                    <FileText size={14} className="text-zinc-400" />
                    <span className="truncate flex-1">case_report.pdf</span>
                    <Paperclip size={12} className="text-zinc-600" />
                  </div>
                  <div className="p-2 border border-zinc-800 rounded bg-zinc-900 flex items-center gap-2 hover:border-[#FF7A00] cursor-pointer">
                    <FileText size={14} className="text-zinc-400" />
                    <span className="truncate flex-1">evidence_log.xlsx</span>
                    <Paperclip size={12} className="text-zinc-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.05] mt-6 flex gap-3">
              <button
                onClick={() => setSelectedRecord(null)}
                className="flex-1 btn-secondary text-xs justify-center py-2.5 font-bold"
              >
                Close Drawer
              </button>
              <button className="flex-1 btn-glow text-xs justify-center py-2.5 font-bold">
                Open in AI Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
