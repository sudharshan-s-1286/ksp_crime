import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  Clock,
  Terminal
} from 'lucide-react';

interface AuditLogEntry {
  timestamp: string;
  user: string;
  action: string;
  module: string;
  status: 'Success' | 'Alert' | 'Warning';
  ip_address: string;
  clearance: 'L3' | 'L5' | 'L7';
}

export const AuditLogs: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState('All');

  const logEntries: AuditLogEntry[] = [
    { timestamp: '2026-07-01 19:42:15', user: 'Insp. R. Gowda', action: 'Requested Neo4j relationship expansion Suresh Patil', module: 'Criminal Network', status: 'Success', ip_address: '10.14.88.24', clearance: 'L3' },
    { timestamp: '2026-07-01 19:40:02', user: 'SI K. Patil', action: 'Modified Case Checklist Task #3 status to Complete', module: 'Investigations', status: 'Success', ip_address: '10.14.88.42', clearance: 'L3' },
    { timestamp: '2026-07-01 19:35:10', user: 'Insp. Suresh Patil', action: 'Failed authentication attempt (Incorrect security key PIN)', module: 'Security Gateway', status: 'Warning', ip_address: '192.168.1.104', clearance: 'L3' },
    { timestamp: '2026-07-01 19:28:45', user: 'Master Agent', action: 'Orchestrated intent validation call for Hebbal toll plaza search', module: 'AI Copilot RAG', status: 'Success', ip_address: 'System-Internal', clearance: 'L7' },
    { timestamp: '2026-07-01 19:10:30', user: 'Supervisor Gowda', action: 'Authorized dossier data export Suresh Patil Brief (PDF)', module: 'Reports', status: 'Success', ip_address: '10.14.88.10', clearance: 'L5' },
    { timestamp: '2026-07-01 18:45:00', user: 'Financial Agent', action: 'Flagged transaction TX-82918 - Laundering suspect matching score exceeded 90%', module: 'AI Financial Agent', status: 'Alert', ip_address: 'System-Internal', clearance: 'L7' }
  ];

  const filteredLogs = logEntries.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ip_address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesModule = filterModule === 'All' || log.module.includes(filterModule);

    return matchesSearch && matchesModule;
  });

  const handleExportLogs = () => {
    const headers = ['Timestamp', 'System User', 'Audited Action Event', 'Module Class', 'Event Status', 'Source IP', 'Clearance'];
    const rows = filteredLogs.map(log => [
      `"${log.timestamp}"`,
      `"${log.user}"`,
      `"${log.action.replace(/"/g, '""')}"`,
      `"${log.module}"`,
      `"${log.status}"`,
      `"${log.ip_address}"`,
      `"${log.clearance}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ksp_audit_logs.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full p-8 flex flex-col bg-zinc-950/20">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/[0.05] pb-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-heading uppercase tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-[#FF7A00]" /> Compliance Audit Logs
          </h1>
          <p className="text-sm text-zinc-400 mt-4 leading-relaxed">Authorized compliance tracking records documenting system changes, AI executions, and credential access histories.</p>
        </div>
        <button 
          onClick={handleExportLogs}
          className="btn-glow text-xs flex items-center gap-2"
        >
          <Download size={14} />
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* Filter panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-xs font-sans">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search by user name, action keyword, IP address..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field w-full pl-10 pr-4 py-2 bg-zinc-950 border-zinc-800 text-sm"
          />
        </div>

        <div>
          <select 
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="input-field w-full py-2 bg-zinc-950 border-zinc-800 text-sm font-sans"
          >
            <option value="All">All Modules</option>
            <option value="Network">Criminal Network</option>
            <option value="Investigations">Investigations</option>
            <option value="Security">Security Gateway</option>
            <option value="AI">AI Copilot RAG</option>
            <option value="Reports">Reports</option>
          </select>
        </div>
      </div>

      {/* Table grid */}
      <div className="flex-1 overflow-auto glass-panel relative bg-zinc-950/40">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-zinc-950 border-b border-white/[0.05] text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono z-10">
            <tr>
              <th className="p-4">Timestamp</th>
              <th className="p-4">System User</th>
              <th className="p-4">Audited Action Event</th>
              <th className="p-4">Module Class</th>
              <th className="p-4">Event Status</th>
              <th className="p-4">Source IP</th>
              <th className="p-4 text-center">Clearance</th>
            </tr>
          </thead>
          <tbody className="text-xs divide-y divide-white/[0.02]">
            {filteredLogs.map((log, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02] cursor-pointer">
                <td className="p-4 font-mono text-zinc-400 font-bold text-[10px]">{log.timestamp}</td>
                <td className="p-4 text-white font-semibold">{log.user}</td>
                <td className="p-4 text-zinc-300 font-sans leading-relaxed">{log.action}</td>
                <td className="p-4 text-zinc-400 font-mono text-[10px]">{log.module}</td>
                <td className="p-4">
                  <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border ${
                    log.status === 'Warning' 
                      ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                      : log.status === 'Alert' 
                      ? 'bg-orange-500/10 border-orange-500/20 text-orange-500'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}>
                    {log.status}
                  </span>
                </td>
                <td className="p-4 text-zinc-400 font-mono">{log.ip_address}</td>
                <td className="p-4 text-center">
                  <span className="text-[9px] font-mono text-white font-bold bg-zinc-800 border border-zinc-700 px-1.5 py-0.25 rounded">
                    {log.clearance}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
