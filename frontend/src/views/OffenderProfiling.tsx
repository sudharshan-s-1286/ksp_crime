import React, { useState, useEffect } from 'react';
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

interface Suspect {
  name: string;
  alias: string;
  status: string;
  risk: number;
  age: number;
  clearance: string;
  arrests: number;
  convictions: number;
  modus_operandi: string;
  psychological_brief: string;
}

export const OffenderProfiling: React.FC = () => {
  const [selectedSuspect, setSelectedSuspect] = useState('Suresh Patil');
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  
  // Registration Form Modal States
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [status, setStatus] = useState('Wanted');
  const [risk, setRisk] = useState(50);
  const [age, setAge] = useState(30);
  const [clearance, setClearance] = useState('Restricted');
  const [arrests, setArrests] = useState(0);
  const [convictions, setConvictions] = useState(0);
  const [modusOperandi, setModusOperandi] = useState('');
  const [psychologicalBrief, setPsychologicalBrief] = useState('');

  const fetchDossiers = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/dossiers');
      if (res.ok) {
        const data = await res.json();
        setSuspects(data);
      }
    } catch (e) {
      console.error("Error fetching suspect dossiers", e);
    }
  };

  useEffect(() => {
    fetchDossiers();
  }, []);

  const handleExportBrief = () => {
    const suspect = suspects.find(s => s.name === selectedSuspect) || suspects[0];
    if (!suspect) return;
    const content = `# KSP OFFENDER DOSSIER BRIEF: ${suspect.name.toUpperCase()}
==================================================
CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE // OFFICIAL USE ONLY

SUSPECT NAME: ${suspect.name}
ALIAS: ${suspect.alias}
STATUS: ${suspect.status}
RISK RATING: ${suspect.risk}%
AGE: ${suspect.age}
CLEARANCE: ${suspect.clearance}
ARRESTS: ${suspect.arrests}
CONVICTIONS: ${suspect.convictions}

---
MODUS OPERANDI:
${suspect.modus_operandi}

---
AI COGNITIVE PSYCHOLOGICAL PROFILE:
"${suspect.psychological_brief}"

---
HISTORICAL TIMELINE:
- June 24, 2026: Extortion FIR #872/2026 registered. Accused of threatening Karnataka Tech Merchant association.
- May 12, 2025: Arrested for financial fraud loop (IPC 420). Detained by Cyber Cell; later released on bail.

System Timestamp: ${new Date().toISOString()}
Karnataka State Police Intelligence Platform`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dossier_brief_${suspect.name.toLowerCase().replace(' ', '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const res = await fetch('http://localhost:8000/api/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          alias: alias.trim(),
          status,
          risk: Number(risk),
          age: Number(age),
          clearance,
          arrests: Number(arrests),
          convictions: Number(convictions),
          modus_operandi: modusOperandi.trim(),
          psychological_brief: psychologicalBrief.trim()
        })
      });
      if (res.ok) {
        await fetchDossiers();
        setSelectedSuspect(name.trim());
        setShowModal(false);
        // Clear fields
        setName('');
        setAlias('');
        setStatus('Wanted');
        setRisk(50);
        setAge(30);
        setClearance('Restricted');
        setArrests(0);
        setConvictions(0);
        setModusOperandi('');
        setPsychologicalBrief('');
      } else {
        alert("Failed to save dossier.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving dossier.");
    }
  };

  const currentSuspect = suspects.find(s => s.name === selectedSuspect) || suspects[0];

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
          <button 
            onClick={() => setShowModal(true)}
            className="w-full btn-glow py-2 justify-center text-xs font-bold"
          >
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
                <span className={`text-[9px] border px-2 py-0.5 rounded font-mono font-bold uppercase ${
                  currentSuspect?.status === 'Wanted' 
                    ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                    : currentSuspect?.status === 'Detained'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-[#FF7A00]/10 border-[#FF7A00]/20 text-[#FF7A00]'
                }`}>
                  {currentSuspect?.status || 'WANTED'}
                </span>
                <h2 className="text-xl font-bold font-heading text-white mt-1.5">{selectedSuspect}</h2>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-zinc-400">
                <div>Age: <strong className="text-white">{currentSuspect?.age || 30}</strong></div>
                <div>Clearance: <strong className="text-white">{currentSuspect?.clearance || 'Restricted'}</strong></div>
                <div>Arrests: <strong className="text-white">{currentSuspect?.arrests || 0}</strong></div>
                <div>Convictions: <strong className="text-white">{currentSuspect?.convictions || 0}</strong></div>
              </div>
            </div>

            {/* Risk gauge */}
            <div className="flex flex-col items-center gap-1.5 bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex-shrink-0">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono">AI Risk Assessment</span>
              
              {/* SVG gauge */}
              <svg width="80" height="40" className="overflow-visible">
                {/* Background arc */}
                <path d="M 10 40 A 30 30 0 0 1 70 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" strokeLinecap="round" />
                {/* Colored progress arc based on dynamic risk */}
                <path 
                  d="M 10 40 A 30 30 0 0 1 70 40" 
                  fill="none" 
                  stroke={(currentSuspect?.risk || 50) >= 80 ? '#EF4444' : (currentSuspect?.risk || 50) >= 55 ? '#FF7A00' : '#10B981'} 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                  strokeDasharray={`${(currentSuspect?.risk || 50) * 0.942} 94.2`}
                  className="animate-pulse" 
                />
              </svg>
              
              <span className="text-lg font-bold font-mono text-white leading-none mt-1">{currentSuspect?.risk || 50}%</span>
              <span className={`text-[8px] font-mono font-bold tracking-widest uppercase ${
                (currentSuspect?.risk || 50) >= 80 ? 'text-red-500' : (currentSuspect?.risk || 50) >= 55 ? 'text-[#FF7A00]' : 'text-emerald-400'
              }`}>
                {(currentSuspect?.risk || 50) >= 80 ? 'CRITICAL' : (currentSuspect?.risk || 50) >= 55 ? 'MODERATE' : 'LOW RISK'}
              </span>
            </div>
          </div>

          {/* Modus Operandi & Psychological Brief */}
          <div className="space-y-5 text-xs">
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Modus Operandi</span>
              <p className="text-zinc-300 leading-relaxed font-sans bg-zinc-900/60 p-3 rounded border border-zinc-800">
                {currentSuspect?.modus_operandi || 'No modus operandi registered.'}
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Brain size={12} className="text-[#FF7A00]" /> AI Cognitive Psychological Profiling
              </span>
              <p className="text-zinc-300 italic leading-relaxed bg-zinc-950 p-3 border border-white/[0.02] rounded-lg">
                "{currentSuspect?.psychological_brief || 'No psychological brief available.'}"
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
          
          <button 
            onClick={handleExportBrief}
            className="w-full btn-secondary text-xs justify-center py-2.5 font-bold"
          >
            <span>EXPORT DOSSIER BRIEF</span>
            <ChevronRight size={14} />
          </button>
        </div>

      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 bg-zinc-950 border border-zinc-800 rounded-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/[0.05] pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Fingerprint className="text-[#FF7A00]" /> Register New Dossier
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-zinc-500 hover:text-white text-xs font-mono"
              >
                [CLOSE]
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Suspect Name *</span>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field bg-zinc-900 border-zinc-800 text-white rounded p-2 focus:border-[#FF7A00] outline-none" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Alias *</span>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Baba"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    className="input-field bg-zinc-900 border-zinc-800 text-white rounded p-2 focus:border-[#FF7A00] outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Status</span>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="input-field bg-zinc-900 border-zinc-800 text-white rounded p-2 focus:border-[#FF7A00] outline-none"
                  >
                    <option value="Wanted">Wanted</option>
                    <option value="Under Surveillance">Under Surveillance</option>
                    <option value="Detained">Detained</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Risk Rating (0-100)</span>
                  <input 
                    type="number" 
                    min="0" 
                    max="100"
                    value={risk}
                    onChange={(e) => setRisk(parseInt(e.target.value) || 0)}
                    className="input-field bg-zinc-900 border-zinc-800 text-white rounded p-2 focus:border-[#FF7A00] outline-none" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Age</span>
                  <input 
                    type="number" 
                    min="1" 
                    max="120"
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value) || 30)}
                    className="input-field bg-zinc-900 border-zinc-800 text-white rounded p-2 focus:border-[#FF7A00] outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Clearance Level</span>
                  <select 
                    value={clearance}
                    onChange={(e) => setClearance(e.target.value)}
                    className="input-field bg-zinc-900 border-zinc-800 text-white rounded p-2 focus:border-[#FF7A00] outline-none"
                  >
                    <option value="Confidential">Confidential</option>
                    <option value="Restricted">Restricted</option>
                    <option value="Secret">Secret</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Arrests Count</span>
                  <input 
                    type="number" 
                    min="0" 
                    value={arrests}
                    onChange={(e) => setArrests(parseInt(e.target.value) || 0)}
                    className="input-field bg-zinc-900 border-zinc-800 text-white rounded p-2 focus:border-[#FF7A00] outline-none" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Convictions Count</span>
                  <input 
                    type="number" 
                    min="0" 
                    value={convictions}
                    onChange={(e) => setConvictions(parseInt(e.target.value) || 0)}
                    className="input-field bg-zinc-900 border-zinc-800 text-white rounded p-2 focus:border-[#FF7A00] outline-none" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Modus Operandi</span>
                <textarea 
                  rows={3}
                  placeholder="Describe operations, targets, tactics..."
                  value={modusOperandi}
                  onChange={(e) => setModusOperandi(e.target.value)}
                  className="input-field bg-zinc-900 border-zinc-800 text-white rounded p-2 focus:border-[#FF7A00] outline-none resize-none font-sans" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">AI Cognitive Brief / Psychological Profile</span>
                <textarea 
                  rows={3}
                  placeholder="Psychological evaluation, behavioral trends..."
                  value={psychologicalBrief}
                  onChange={(e) => setPsychologicalBrief(e.target.value)}
                  className="input-field bg-zinc-900 border-zinc-800 text-white rounded p-2 focus:border-[#FF7A00] outline-none resize-none font-sans" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-400 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-glow px-4 py-2 text-white font-bold"
                >
                  Save Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
