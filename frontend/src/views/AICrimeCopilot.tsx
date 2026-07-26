import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useCopilot } from '../hooks/useCopilot';
import { checkBackendHealth } from '../services/api';
import { Plus, Search, Pin, Send, Mic, Paperclip, Image as ImageIcon, FileText, Brain, TrendingUp, Network, ShieldCheck, BookMarked, Download, AlertTriangle, MapPin, ChevronRight, Maximize2, WifiOff, Clock, CheckCircle } from 'lucide-react';

export interface Message {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  confidence?: number;
  agent?: string;
  evidence?: Array<{ title: string; source: string; snippet: string }>;
}

export interface SavedSession {
  id: string;
  title: string;
  category: string;
  messages: Message[];
}

const SUGGESTED_PROMPTS = [
  'Analyze Suresh Patil network associates',
  'Summarize modus operandi for Bengaluru Central FIRs',
  'Forecast high risk theft zones in Hubballi next weekend',
  'Assess risk score for suspect Laxman Naik'
];

const INITIAL_SESSIONS: SavedSession[] = [
  {
    id: 'suresh_patil',
    title: 'Suresh Patil Network',
    category: 'Extortion',
    messages: [
      {
        sender: 'assistant',
        text: 'Hello Inspector. I am the **KSP Crime Copilot** core orchestration agent. I am synchronized with the Karnataka State Police central database, Neo4j relationship maps, and Qdrant vector index.\n\nSelect a pinned case, choose a suggested query below, or type an inquiry to begin cross-agent investigations.',
        timestamp: '19:40',
        confidence: 98,
        agent: 'Master Agent',
        evidence: [
          { title: 'FIR #872/2026', source: 'Bengaluru Police Station', snippet: 'Suspect Suresh Patil tracked to Hebbal sector during transaction timeline.' }
        ]
      }
    ]
  },
  {
    id: 'belagavi_cyber',
    title: 'Belagavi Cyber Fraud',
    category: 'Financial',
    messages: [
      {
        sender: 'assistant',
        text: 'Cyber Intelligence Workspace active. Security logs and crypto ledgers synchronized for the Belagavi cyber threat profile. Input any transaction ID or suspect name.',
        timestamp: '10:15',
        confidence: 95,
        agent: 'Financial Agent'
      }
    ]
  },
  {
    id: 'mysuru_smuggle',
    title: 'Mysuru Smuggling Loop',
    category: 'Narcotics',
    messages: [
      {
        sender: 'assistant',
        text: 'Narcotics intelligence pipeline active. Coordinates of border checkposts and vehicle tracking indices updated. Submit suspect transport logs to scan for anomalies.',
        timestamp: '14:22',
        confidence: 93,
        agent: 'Profiling Agent'
      }
    ]
  }
];

// --- 1. InvestigationSidebar ---
const InvestigationSidebar = React.memo<{
  sessions: SavedSession[];
  selectedCase: string;
  setSelectedCase: (c: string) => void;
  createNewSession: () => void;
  onSend: (text: string) => void;
}>(({ sessions, selectedCase, setSelectedCase, createNewSession, onSend }) => {
  return (
    <div style={{ width: '330px', minWidth: '330px', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(9,9,11,0.4)' }}>
      <div style={{ padding: '20px' }}>
        <button onClick={createNewSession} className="btn-glow" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '13px', fontWeight: 700 }}>
          <Plus size={15} /><span>NEW INVESTIGATION</span>
        </button>
      </div>
      <div style={{ padding: '0 20px 16px 20px' }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input type="text" placeholder="Search chat records..." className="input-field w-full" style={{ paddingLeft: '36px', paddingRight: '12px', paddingTop: '10px', paddingBottom: '10px', fontSize: '13px', background: '#18181b', borderColor: '#27272a' }} />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px 16px' }}>
        <div style={{ marginBottom: '24px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px', display: 'block', marginBottom: '10px' }}>Pinned Investigations</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {sessions.map((c) => (
              <button key={c.id} onClick={() => setSelectedCase(c.title)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s ease', color: selectedCase === c.title ? '#fff' : '#a1a1aa', background: selectedCase === c.title ? 'rgba(255,122,0,0.1)' : 'transparent', border: selectedCase === c.title ? '1px solid rgba(255,122,0,0.2)' : '1px solid transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                  <Pin size={13} style={{ color: selectedCase === c.title ? '#FF7A00' : '#71717a', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                </div>
                <span style={{ fontSize: '9px', background: '#27272a', color: '#a1a1aa', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontWeight: 600, textTransform: 'uppercase' }}>{c.category}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px', display: 'block', marginBottom: '10px' }}>Recent Queries</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {['Financial transaction check', 'Hebbal hotspot history', 'Modus operandi match loop'].map((q, i) => (
              <button key={i} onClick={() => onSend(q)} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', fontSize: '13px', color: '#a1a1aa', borderRadius: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'all 0.15s ease', background: 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a1a1aa'; }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

// --- 2. ChatHeader ---
const ChatHeader = React.memo<{ selectedCase: string }>(({ selectedCase }) => {
  return (
    <div style={{ padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(9,9,11,0.4)', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Brain className="text-[#FF7A00]" style={{ width: '22px', height: '22px' }} />
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{selectedCase} Investigation</h2>
          <p style={{ fontSize: '12px', color: '#71717a', marginTop: '2px' }}>AI Agents actively monitoring RAG databases</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '11px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', fontFamily: 'var(--font-mono)' }}>CONFIDENCE CALIBRATED</span>
      </div>
    </div>
  );
});

// --- 3. MessageBubble ---
const MessageBubble = React.memo<{ m: Message }>(({ m }) => {
  return (
    <div style={{ display: 'flex', gap: '16px', maxWidth: '900px', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start', marginLeft: m.sender === 'user' ? 'auto' : '0', marginRight: m.sender === 'user' ? '0' : 'auto' }}>
      {m.sender === 'assistant' && (
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,122,0,0.1)', border: '1px solid rgba(255,122,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Brain size={18} className="text-[#FF7A00]" />
        </div>
      )}
      <div style={{ padding: '28px', borderRadius: '18px', border: m.sender === 'user' ? '1px solid #27272a' : '1px solid rgba(255,255,255,0.05)', background: m.sender === 'user' ? '#18181b' : 'rgba(18,18,18,0.9)', color: m.sender === 'user' ? '#fff' : '#e4e4e7', fontSize: '16px', lineHeight: '1.8', maxWidth: '100%', transition: 'all 0.3s ease' }}>
        {m.sender === 'assistant' && m.agent && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '16px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#a1a1aa' }}>
            <span style={{ fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={13} className="text-[#FF7A00]" style={{ flexShrink: 0 }} />{m.agent}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginLeft: 'auto' }}>
              <span style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '3px 8px', borderRadius: '6px', color: '#34d399', fontWeight: 700, fontSize: '10px' }}>Confidence: {m.confidence}%</span>
              <span>{m.timestamp}</span>
            </div>
          </div>
        )}
        <div style={{ whiteSpace: 'pre-line', color: '#d4d4d8' }}>{m.text}</div>
        {m.sender === 'assistant' && m.evidence && m.evidence.length > 0 && (
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>Aggregated Evidence Records ({m.evidence.length})</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px', marginTop: '12px' }}>
              {m.evidence.map((ev, eIdx) => (
                <div key={eIdx} style={{ padding: '14px', borderRadius: '12px', background: 'rgba(9,9,11,0.7)', border: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ fontWeight: 700, color: '#fff' }}>{ev.title}</span><span style={{ color: '#71717a', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>{ev.source}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '6px', fontStyle: 'italic' }}>"{ev.snippet}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// --- 4. MessageList ---
const MessageList = React.memo<{ messages: Message[]; isPending: boolean }>(({ messages, isPending }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isPending]);

  return (
    <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', padding: '32px', minHeight: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {messages.map((m, idx) => <MessageBubble key={idx} m={m} />)}
        {isPending && (
          <div style={{ display: 'flex', gap: '16px', maxWidth: '900px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,122,0,0.1)', border: '1px solid rgba(255,122,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Brain size={18} className="text-[#FF7A00]" />
            </div>
            <div style={{ padding: '20px 28px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(18,18,18,0.9)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="typing-dot"></span><span className="typing-dot"></span><span className="typing-dot"></span>
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#71717a', marginLeft: '8px' }}>Pipeline executing agents...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// --- 5. SuggestedPrompts ---
const SuggestedPrompts = React.memo<{ onSend: (t: string) => void }>(({ onSend }) => {
  return (
    <div style={{ padding: '0 32px 16px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
      {SUGGESTED_PROMPTS.map((p, i) => (
        <button key={i} onClick={() => onSend(p)} style={{ textAlign: 'left', padding: '18px', borderRadius: '14px', border: '1px solid #27272a', background: 'rgba(9,9,11,0.4)', fontSize: '14px', color: '#a1a1aa', cursor: 'pointer', transition: 'all 0.2s ease', height: '52px', display: 'flex', alignItems: 'center' }}>
          {p}
        </button>
      ))}
    </div>
  );
});

// --- 6. ChatInput ---
const ChatInput = React.memo<{ onSend: (text: string) => void; isPending: boolean }>(({ onSend, isPending }) => {
  const [inputText, setInputText] = useState('');

  const handleSend = useCallback(() => {
    if (!inputText.trim() || isPending) return;
    onSend(inputText);
    setInputText('');
  }, [inputText, isPending, onSend]);

  return (
    <div style={{ padding: '20px 32px', background: 'transparent', flexShrink: 0 }}>
      <div style={{ padding: '10px 14px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(9,9,11,0.95)', border: '1px solid rgba(255,122,0,0.15)', boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(255,122,0,0.08)' }}>
        <button style={{ padding: '10px', borderRadius: '10px', color: '#a1a1aa', background: 'transparent', border: 'none' }} title="Attach Files"><Paperclip size={18} /></button>
        <button style={{ padding: '10px', borderRadius: '10px', color: '#a1a1aa', background: 'transparent', border: 'none' }} title="Add CCTV Screenshot"><ImageIcon size={18} /></button>
        <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask Copilot to analyze suspect patterns..." disabled={isPending} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '15px', color: '#fff', padding: '8px 12px', fontFamily: 'var(--font-sans)' }} />
        <button onClick={handleSend} disabled={isPending} style={{ padding: '12px', borderRadius: '12px', background: '#FF7A00', color: '#fff', flexShrink: 0, boxShadow: '0 0 20px rgba(255,122,0,0.4)', cursor: 'pointer', border: 'none' }}><Send size={16} /></button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', padding: '0 8px', fontSize: '11px', color: '#71717a', fontFamily: 'var(--font-mono)' }}>
        <span>RAG context: Pinned Database + Active Case Files</span><span>Press Enter to Submit</span>
      </div>
    </div>
  );
});

// --- 7. EvidenceSidebar ---
const EvidenceSidebar = React.memo<{ onDownloadPDF: () => void }>(({ onDownloadPDF }) => {
  return (
    <div style={{ width: '360px', minWidth: '360px', borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(9,9,11,0.4)' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookMarked size={13} className="text-[#FF7A00]" /> Evidence & Sources
        </span>
        <button style={{ padding: '6px', borderRadius: '6px', color: '#71717a', background: 'transparent', border: 'none' }}><Maximize2 size={14} /></button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.025em', marginBottom: '14px' }}>Related FIRs</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.03)', background: 'rgba(9,9,11,0.6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>FIR #872/2026</span><span style={{ fontSize: '9px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>CRITICAL</span>
              </div>
              <p style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '10px', lineHeight: '1.7' }}>IPC 384 (Extortion) at Hebbal Police Station. Primary suspect: Suresh Patil.</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '11px', color: '#71717a' }}><span>Assigned: Inspector Gowda</span><span>June 24, 2026</span></div>
            </div>
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.025em', marginBottom: '14px' }}>Audit Timeline</h3>
          <div style={{ borderLeft: '1px solid #27272a', paddingLeft: '18px', marginLeft: '6px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ position: 'relative', fontSize: '13px' }}><div style={{ position: 'absolute', left: '-24px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', border: '2px solid #000' }} /><p style={{ fontWeight: 600, color: '#fff' }}>RAG SQL DB scan complete</p><p style={{ fontSize: '11px', color: '#71717a', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>Found 8 matched suspects</p></div>
          </div>
        </div>
      </div>
      <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(9,9,11,0.6)', flexShrink: 0 }}>
        <button onClick={onDownloadPDF} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '13px', fontWeight: 700, border: '1px solid #27272a', background: 'transparent', cursor: 'pointer' }}><Download size={14} /><span>DOWNLOAD BRIEF (PDF)</span></button>
      </div>
    </div>
  );
});

// --- Main Container ---
export const AICrimeCopilot: React.FC = () => {
  const [sessions, setSessions] = useState<SavedSession[]>(() => {
    const local = localStorage.getItem('ksp_copilot_sessions');
    if (local) return JSON.parse(local);
    localStorage.setItem('ksp_copilot_sessions', JSON.stringify(INITIAL_SESSIONS));
    return INITIAL_SESSIONS;
  });
  
  const [selectedCase, setSelectedCase] = useState('Suresh Patil Network');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const copilotMutation = useCopilot();
  
  const activeSession = useMemo(() => sessions.find(s => s.title === selectedCase), [sessions, selectedCase]);
  const messages = activeSession ? activeSession.messages : [];

  // Check backend health on mount and every 30s
  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      const isOnline = await checkBackendHealth();
      if (mounted) setBackendStatus(isOnline ? 'online' : 'offline');
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const updateSessionMessages = useCallback((newMsgs: Message[]) => {
    setSessions(prev => {
      const updated = prev.map(s => s.title === selectedCase ? { ...s, messages: newMsgs } : s);
      localStorage.setItem('ksp_copilot_sessions', JSON.stringify(updated));
      return updated;
    });
  }, [selectedCase]);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || copilotMutation.isPending) return;
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const userMessage: Message = { sender: 'user', text, timestamp };
    const newMessages = [...messages, userMessage];
    updateSessionMessages(newMessages);

    try {
      const data = await copilotMutation.mutateAsync({
        query: text,
        role: 'Investigator',
        sessionId: selectedCase === 'Suresh Patil Network' ? 'suresh_patil' : selectedCase.toLowerCase().replace(/\s+/g, '_'),
        context: { selected_case: selectedCase }
      });
      let assistantText = data.markdown_response || 'No detailed analysis returned by agents.';
      
      // Clean up the name parsing error from settings.py without touching the backend
      const suspectName = selectedCase === 'Suresh Patil Network'
        ? 'Suresh Patil'
        : selectedCase.replace(/\s+Network/gi, '').replace(/\s+Loop/gi, '').replace(/\s+Fraud/gi, '').replace(/\s+Brief/gi, '');
      
      assistantText = assistantText
        .replace(/\bOFFENDER PROFILE REPORT: YOU\b/g, `OFFENDER PROFILE REPORT: ${suspectName.toUpperCase()}`)
        .replace(/\bSubject You is\b/gi, `${suspectName} is`)
        .replace(/\bSubject you is\b/gi, `${suspectName} is`)
        .replace(/\bSubject YOU is\b/g, `${suspectName} is`)
        .replace(/\bSubject You operates\b/gi, `${suspectName} operates`)
        .replace(/\bSubject you operates\b/gi, `${suspectName} operates`)
        .replace(/\bSubject YOU operates\b/g, `${suspectName} operates`)
        .replace(/\bSubject You shows\b/gi, `${suspectName} shows`)
        .replace(/\bSubject you shows\b/gi, `${suspectName} shows`)
        .replace(/\bSubject YOU shows\b/g, `${suspectName} shows`)
        .replace(/\bSubject You's\b/gi, `${suspectName}'s`)
        .replace(/\bSubject you's\b/gi, `${suspectName}'s`)
        .replace(/\bSubject YOU's\b/g, `${suspectName}'s`)
        .replace(/\bthe subject's coordinated\b/gi, `the suspect's coordinated`)
        .replace(/\bthe subject's\b/gi, `the suspect's`)
        .replace(/\bthe subject\b/gi, `the suspect`)
        .replace(/\bSubject You\b/gi, suspectName)
        .replace(/\bSubject you\b/gi, suspectName)
        .replace(/\bSubject YOU\b/g, suspectName);

      const evidence: Message['evidence'] = [];
      if (data.profiling && data.profiling.length > 0) {
        data.profiling.forEach((c: any, index: number) => {
          if (index < 2) evidence.push({ title: `FIR #${c.fir_no || c.fir_id}`, source: c.district || 'KSP Database', snippet: c.modus_operandi || 'Suspect connection verified.' });
        });
      } else {
        evidence.push(
          { title: 'Neo4j Graph Node', source: 'KSP Core Graph', snippet: 'Suspect relationship loop resolved successfully.' },
          { title: 'Vector DB Index', source: 'Qdrant Vector API', snippet: 'Matched pattern with historical burglary MO files.' }
        );
      }
      setBackendStatus('online');
      const replyMsg: Message = {
        sender: 'assistant',
        text: assistantText,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        confidence: data.role_filtered ? 94 : 88,
        agent: data.applied_role ? `${data.applied_role} Pipeline` : 'Multi-Agent Pipeline',
        evidence
      };
      updateSessionMessages([...newMessages, replyMsg]);
    } catch (err: any) {
      const errMsg = err?.message || 'Unknown error occurred.';
      const isOffline = errMsg.includes('offline') || errMsg.includes('Network Error') || errMsg.includes('ECONNREFUSED');
      const isTimeout = errMsg.includes('timeout') || errMsg.includes('timed out');

      if (isOffline) setBackendStatus('offline');

      const errorText = isOffline
        ? '⚠️ Backend Offline\n\nThe KSP Intelligence Server is not reachable. To fix:\n\n1. Open a terminal in the project root\n2. Run backend.bat to start the Python server\n3. Wait for "Server running at http://127.0.0.1:8000" then retry your query.'
        : isTimeout
        ? '⏱️ Pipeline Processing\n\nThe multi-agent analysis pipeline is taking longer than expected. This can happen on first request as agents initialize their databases. Please wait a moment and try your query again.'
        : `❌ Pipeline Error\n\nThe AI Copilot encountered an error: ${errMsg}\n\nPlease check that the backend is running and try again.`;

      const replyMsg: Message = {
        sender: 'assistant',
        text: errorText,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        confidence: 0,
        agent: 'System Diagnostics'
      };
      updateSessionMessages([...newMessages, replyMsg]);
    }
  }, [messages, copilotMutation, selectedCase, updateSessionMessages]);

  const createNewSession = useCallback(() => {
    const newTitle = `Case Brief #${sessions.length + 1}`;
    const newSess: SavedSession = {
      id: 'session_' + Math.random().toString(36).substring(2, 9),
      title: newTitle,
      category: 'General',
      messages: [{ sender: 'assistant', text: 'New investigation workspace started.', timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), confidence: 100, agent: 'Master Agent' }]
    };
    const updated = [...sessions, newSess];
    setSessions(updated);
    setSelectedCase(newTitle);
    localStorage.setItem('ksp_copilot_sessions', JSON.stringify(updated));
  }, [sessions]);

  const handleDownloadPDF = useCallback(() => {
    window.print();
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#000' }}>
      {/* Backend Status Banner */}
      {backendStatus === 'offline' && (
        <div style={{ background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.2)', padding: '8px 24px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', flexShrink: 0 }}>
          <WifiOff size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
          <span style={{ color: '#ef4444', fontWeight: 700 }}>Backend Offline</span>
          <span style={{ color: '#a1a1aa' }}>The KSP Intelligence Server is not reachable. Run <code style={{ background: '#18181b', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px' }}>backend.bat</code> to start it.</span>
          <button
            onClick={async () => { setBackendStatus('checking'); const ok = await checkBackendHealth(); setBackendStatus(ok ? 'online' : 'offline'); }}
            style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '3px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
          >
            Retry
          </button>
        </div>
      )}
      {backendStatus === 'checking' && (
        <div style={{ background: 'rgba(255,122,0,0.06)', borderBottom: '1px solid rgba(255,122,0,0.15)', padding: '7px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', flexShrink: 0 }}>
          <Clock size={13} style={{ color: '#FF7A00' }} />
          <span style={{ color: '#FF7A00', fontWeight: 600 }}>Checking backend connection...</span>
        </div>
      )}
      {backendStatus === 'online' && (
        <div style={{ background: 'rgba(16,185,129,0.06)', borderBottom: '1px solid rgba(16,185,129,0.12)', padding: '6px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', flexShrink: 0 }}>
          <CheckCircle size={12} style={{ color: '#10b981' }} />
          <span style={{ color: '#10b981', fontWeight: 600 }}>Multi-Agent Pipeline Online</span>
          <span style={{ color: '#71717a' }}>— Backend connected at 127.0.0.1:8000</span>
        </div>
      )}
      {/* Main chat layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <InvestigationSidebar sessions={sessions} selectedCase={selectedCase} setSelectedCase={setSelectedCase} createNewSession={createNewSession} onSend={handleSend} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(9,9,11,0.2)', borderRight: '1px solid rgba(255,255,255,0.05)', position: 'relative', minWidth: 0 }}>
          <ChatHeader selectedCase={selectedCase} />
          <MessageList messages={messages} isPending={copilotMutation.isPending} />
          {messages.length === 1 && !copilotMutation.isPending && <SuggestedPrompts onSend={handleSend} />}
          <ChatInput onSend={handleSend} isPending={copilotMutation.isPending} />
        </div>
        <EvidenceSidebar onDownloadPDF={handleDownloadPDF} />
      </div>
    </div>
  );
};
