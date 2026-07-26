import React from 'react';
import { 
  Database, 
  Cpu, 
  Activity, 
  Terminal, 
  GitBranch, 
  Zap 
} from 'lucide-react';

interface StatusBarProps {
  role: string;
}

export const StatusBar = React.memo<StatusBarProps>(({ role }) => {
  return (
    <footer 
      style={{ 
        flexShrink: 0,
        height: '38px', 
        borderRadius: 0, 
        backgroundColor: '#090909',
        zIndex: 40,
        color: '#A3A3A3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingInline: '18px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
      }}
    >
      {/* Left side stats: DB status */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1.5">
          <Database size={12} className="text-[#FF7A00]" />
          <span>DB Status:</span>
          <span className="text-emerald-400 font-semibold uppercase tracking-wide">Connected (MySQL, Neo4j, Qdrant)</span>
        </div>
        <div className="flex items-center gap-1.5" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '18px' }}>
          <Cpu size={12} className="text-zinc-400" />
          <span>Active Agents:</span>
          <span style={{ color: '#fff', fontWeight: 600 }}>9 Online</span>
        </div>
        <div className="flex items-center gap-1.5" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '18px' }}>
          <Zap size={12} className="text-zinc-400" />
          <span>Latency:</span>
          <span className="text-emerald-400 font-semibold">42 ms</span>
        </div>
      </div>

      {/* Middle status: Session info */}
      <div className="flex items-center gap-2">
        <Terminal size={11} className="text-zinc-500" />
        <span className="text-zinc-500">Session ID:</span>
        <span style={{ color: '#d4d4d8', fontWeight: 600 }}>ksp_copilot_session_9281a</span>
      </div>

      {/* Right side stats: Memory and Clearance */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1.5">
          <Activity size={12} className="text-zinc-400" />
          <span>System Load:</span>
          <span style={{ color: '#fff', fontWeight: 600 }}>14% CPU | 1.8GB RAM</span>
        </div>
        <div className="flex items-center gap-1.5" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '18px' }}>
          <GitBranch size={12} className="text-[#FF7A00]" />
          <span>Security clearance:</span>
          <span style={{
            color: '#fff',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            background: 'rgba(255, 122, 0, 0.1)',
            border: '1px solid rgba(255, 122, 0, 0.2)',
            padding: '2px 8px',
            borderRadius: '4px',
          }}>
            {role === 'Investigator' ? 'L3 CONFIDENTIAL' : role === 'Supervisor' ? 'L5 SECRET' : 'L7 TOP SECRET'}
          </span>
        </div>
      </div>
    </footer>
  );
});
