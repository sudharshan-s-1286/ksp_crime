import React, { useState } from 'react';
import { useReports } from '../hooks/useReports';
import { 
  FileText, 
  Download, 
  Plus, 
  Calendar, 
  User, 
  MapPin, 
  Loader2,
  CheckCircle,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';

interface ReportTemplate {
  id: string;
  title: string;
  type: 'PDF' | 'Excel' | 'Word';
  desc: string;
  size: string;
}

export const Reports: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('investigation_summary');

  const templates: ReportTemplate[] = [
    { id: 'investigation_summary', title: 'Case Investigation Dossier Brief', type: 'PDF', desc: 'Complete timeline compilation, network diagram link list, financial audits, and AI agent statements.', size: '4.8 MB' },
    { id: 'district_analytics', title: 'District Crime Frequency Grid', type: 'Excel', desc: 'Raw statistics listing case types, district codes, IPC section frequency, and response logs.', size: '1.2 MB' },
    { id: 'forecasting_assessment', title: 'AI Grid Threat Forecasting Summary', type: 'PDF', desc: 'Chronological forecast scores mapping future probability overlays onto police beats.', size: '3.4 MB' }
  ];

  const { data: fetchedReports, isLoading: reportsLoading } = useReports();

  const recentReports = fetchedReports
    ? fetchedReports.map(r => ({ name: r.title + '.' + r.type.toLowerCase(), date: r.date + ' 09:00', size: r.size, creator: 'KSP System' }))
    : [
        { name: 'Suresh Patil Extortion Network Dossier.pdf', date: '2026-06-30 14:15', size: '4.8 MB', creator: 'Insp. R. Gowda' },
        { name: 'Bengaluru Central Crime Load Analysis.xlsx', date: '2026-06-29 11:20', size: '2.1 MB', creator: 'SI K. Patil' },
        { name: 'Belagavi Co-op Bank Security Incident Dossier.pdf', date: '2026-06-25 09:30', size: '3.1 MB', creator: 'SI M. Hubli' }
      ];

  const handleGenerate = () => {
    setIsGenerating(true);
    setProgress(0);
    setStatusText('Ingesting RAG database entries...');

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsGenerating(false);
            setProgress(0);
          }, 800);
          return 100;
        }
        
        // Dynamic status updates based on progress percentage
        if (prev === 25) setStatusText('Querying Neo4j relationship lines...');
        if (prev === 50) setStatusText('Fetching Qdrant semantic indexes...');
        if (prev === 75) setStatusText('Compiling PDF report brief templates...');
        
        return prev + 5;
      });
    }, 150);
  };

  return (
    <div className="w-full p-8 flex flex-col bg-zinc-950/20">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/[0.05] pb-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-heading uppercase tracking-tight flex items-center gap-2">
            <FileText className="text-[#FF7A00]" /> Intelligence Report Center
          </h1>
          <p className="text-sm text-zinc-400 mt-4 leading-relaxed">Generate compliance reports, investigation dossiers, and raw analytical data formats.</p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left side: templates & settings */}
        <div className="xl:col-span-2 flex flex-col gap-6 overflow-y-auto pr-1">
          
          {/* Templates list */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Report Templates</h3>
            
            <div className="space-y-3">
              {templates.map((temp) => (
                <div 
                  key={temp.id}
                  onClick={() => setSelectedTemplate(temp.id)}
                  className={`p-4 rounded-lg border text-xs cursor-pointer transition-all flex justify-between items-start gap-4 ${
                    selectedTemplate === temp.id 
                      ? 'bg-orange-500/10 text-white border-orange-500/30' 
                      : 'bg-zinc-950/40 text-zinc-400 border-zinc-850 hover:text-white hover:border-zinc-800'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex justify-between items-baseline">
                      <strong className="text-white font-heading">{temp.title}</strong>
                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.25 rounded border ${
                        temp.type === 'PDF' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      }`}>{temp.type}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">{temp.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Configuration Form */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Parameters & Scope</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Case File Filter</span>
                <select className="input-field bg-zinc-900 border-zinc-800 text-white">
                  <option>Suresh Patil Network</option>
                  <option>Belagavi Cyber Fraud</option>
                  <option>All Cases</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Select District</span>
                <select className="input-field bg-zinc-900 border-zinc-800 text-white">
                  <option>Bengaluru Central</option>
                  <option>Hubballi North</option>
                  <option>All Districts</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">File Format Export</span>
                <select className="input-field bg-zinc-900 border-zinc-800 text-white">
                  <option>Standard Secure PDF</option>
                  <option>Excel Worksheet (.xlsx)</option>
                  <option>Structured Raw JSON</option>
                </select>
              </div>
            </div>

            {/* Generation Status Indicator */}
            {isGenerating ? (
              <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-zinc-400 flex items-center gap-2">
                    <Loader2 size={13} className="animate-spin text-[#FF7A00]" />
                    {statusText}
                  </span>
                  <span className="font-mono text-[#FF7A00] font-bold">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                  <div className="bg-[#FF7A00] h-full rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <button 
                onClick={handleGenerate}
                className="w-full btn-glow py-3 justify-center text-xs font-bold"
              >
                <span>COMPILE & GENERATE REPORT</span>
              </button>
            )}
          </div>

        </div>

        {/* Right side: recent reports list */}
        <div className="xl:col-span-1 glass-panel p-5 flex flex-col justify-between h-full bg-zinc-900/10">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Recently Compiled Reports</h3>
            
            <div className="space-y-3.5 text-xs">
              {recentReports.map((rep, idx) => (
                <div key={idx} className="p-3 bg-zinc-950 border border-zinc-850 rounded hover:border-[#FF7A00]/40 transition-colors flex items-start gap-3">
                  {rep.name.endsWith('.xlsx') ? (
                    <FileSpreadsheet size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <FileText size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  
                  <div className="flex-1 space-y-1.5 overflow-hidden">
                    <h4 className="font-semibold text-white truncate leading-tight" title={rep.name}>{rep.name}</h4>
                    <div className="flex justify-between items-center text-[10px] text-zinc-500">
                      <span>{rep.size} | {rep.creator}</span>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono block">{rep.date}</span>
                  </div>

                  <button className="p-1.5 rounded hover:bg-zinc-850 text-zinc-400 hover:text-white" title="Download Report">
                    <Download size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
