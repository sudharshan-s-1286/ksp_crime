import React, { useState, useRef } from 'react';
import { 
  FolderGit2, 
  CheckSquare, 
  ListTodo, 
  Layers, 
  Brain, 
  Upload, 
  ArrowRight, 
  User, 
  AlertCircle, 
  ShieldCheck,
  Plus,
  Clock
} from 'lucide-react';

interface KanbanTask {
  id: string;
  title: string;
  assignee: string;
  priority: 'High' | 'Medium' | 'Low';
  due: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
}

export const InvestigationWorkspace: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ingestedFiles, setIngestedFiles] = useState([
    { name: 'cctv_highway_exit.mp4', status: 'Ingested' },
    { name: 'phone_records_suresh.csv', status: 'Indexing' }
  ]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setUploadError(null);
    const filesArray = Array.from(e.target.files);
    
    const allowedExtensions = ['.pdf', '.docx', '.xlsx', '.mp4', '.jpeg', '.jpg'];
    const maxSizeBytes = 100 * 1024 * 1024; // 100MB
    
    const validFiles: File[] = [];
    for (const file of filesArray) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        setUploadError(`Error: "${file.name}" has an unsupported format. Only PDF, DOCX, XLSX, MP4, JPEG are allowed.`);
        return;
      }
      if (file.size > maxSizeBytes) {
        setUploadError(`Error: "${file.name}" exceeds the 100MB size limit.`);
        return;
      }
      validFiles.push(file);
    }
    
    const newFiles = validFiles.map(file => ({
      name: file.name,
      status: 'Indexing'
    }));

    setIngestedFiles(prev => [...prev, ...newFiles]);

    newFiles.forEach(file => {
      setTimeout(() => {
        setIngestedFiles(prev => 
          prev.map(f => f.name === file.name ? { ...f, status: 'Ingested' } : f)
        );
      }, 1500);
    });
  };

  const [activeCase, setActiveCase] = useState('Suresh Patil Extortion Network');
  
  const caseData: Record<string, { summary: string; recommendations: { title: string; detail: string }[] }> = {
    'Suresh Patil Extortion Network': {
      summary: 'Active extortion and money laundering case centering around primary target **Suresh Patil**. Suspect is running protection payouts from local merchant associations. Network connects to suspect **Anand Hegde** (customs agent) and **Laxman Naik** (field operator).',
      recommendations: [
        { title: 'Examine Associate Node "Laxman Naik"', detail: 'Network Agent reports 92% link probability connecting Laxman Naik to Suresh Patil toll booth sightings.' },
        { title: 'Flag Transaction #88921', detail: 'Financial Agent flagged a $12,000 transaction from shell entity to a local car rental agency.' },
        { title: 'Execute Crime Forecast Overlay', detail: 'Forecast Agent projects a 68% probability of robbery in adjacent sector next Saturday night.' }
      ]
    },
    'Belagavi Cyber Fraud': {
      summary: 'A wide-reaching phishing and credential harvesting syndicate operating out of Belagavi district. Primary targets include rural cooperative bank customers.',
      recommendations: [
        { title: 'Suspend Domain bank-coop-verification.in', detail: 'Network Agent detected registration details matching a known cyber threat actor cell.' },
        { title: 'Audit Account #44129', detail: 'Financial Agent flagged rapid micro-transfers to 48 mule accounts within 2 hours.' },
        { title: 'Update Firewall Rules', detail: 'Forecast Agent projects a rise in cyber probes targeting district electricity grids next Monday.' }
      ]
    },
    'Mysuru Smuggling Loop': {
      summary: 'An illicit narcotics and timber transit pipeline moving high-value sandalwood across forest borders. Corresponds to coordinated nocturnal transport routes.',
      recommendations: [
        { title: 'Intercept Vehicle KA-09-XX-9900', detail: 'Network Agent matched toll plaza crossings indicating habitual contraband routes.' },
        { title: 'Audit Mysuru Logistics', detail: 'Financial Agent flagged suspicious warehouse leasing payments to an off-shore escrow account.' },
        { title: 'Deploy Forest Patrols', detail: 'Forecast Agent flags 84% probability of smuggling crossings near Kabini sector between 02:00 and 05:00.' }
      ]
    }
  };

  const currentCaseInfo = caseData[activeCase] || caseData['Suresh Patil Extortion Network'];

  const [tasks, setTasks] = useState<KanbanTask[]>([
    { id: '1', title: 'Audit Account #9982 bank records', assignee: 'Insp. R. Gowda', priority: 'High', due: 'July 02', status: 'in_progress' },
    { id: '2', title: 'Retrieve Hebbal Toll CCTV log (June 29)', assignee: 'Insp. Gowda', priority: 'High', due: 'July 01', status: 'review' },
    { id: '3', title: 'Cross-reference modus operandi of Laxman Naik', assignee: 'SI K. Patil', priority: 'Medium', due: 'July 03', status: 'todo' },
    { id: '4', title: 'Obtain arrest warrant from Metropolitan Court', assignee: 'Insp. R. Gowda', priority: 'High', due: 'July 05', status: 'todo' },
    { id: '5', title: 'Apprehend suspect Anand Hegde at port sector', assignee: 'Insp. M. Shenoy', priority: 'High', due: 'June 30', status: 'done' },
    { id: '6', title: 'Log drug seizure reports in official system', assignee: 'SI M. Hubli', priority: 'Low', due: 'June 29', status: 'done' }
  ]);

  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Register FIR & upload statements', completed: true },
    { id: 2, text: 'Perform semantic search for past matching cases', completed: true },
    { id: 3, text: 'Trace financial transaction flows (Neo4j)', completed: true },
    { id: 4, text: 'Extract suspect vehicle coordinate history', completed: false },
    { id: 5, text: 'Interrogate associate Anand Hegde', completed: false }
  ]);

  const handleToggleChecklist = (id: number) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const moveTask = (taskId: string, newStatus: KanbanTask['status']) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  return (
    <div className="w-full p-8 flex flex-col bg-zinc-950/20">
      
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/[0.05] pb-4 mb-5">
        <div>
          <h1 className="text-3xl font-bold text-white font-heading uppercase tracking-tight flex items-center gap-2">
            <FolderGit2 className="text-[#FF7A00]" /> Investigation Workspace
          </h1>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-400">
            <span>Case Selector:</span>
            <select 
              value={activeCase} 
              onChange={(e) => setActiveCase(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-white cursor-pointer focus:text-[#FF7A00]"
            >
              <option value="Suresh Patil Extortion Network" className="bg-zinc-950 text-white">Suresh Patil Extortion Network</option>
              <option value="Belagavi Cyber Fraud" className="bg-zinc-950 text-white">Belagavi Cyber Fraud</option>
              <option value="Mysuru Smuggling Loop" className="bg-zinc-950 text-white">Mysuru Smuggling Loop</option>
            </select>
          </div>
        </div>

        {/* Case Progression Bar */}
        <div className="flex items-center gap-3 mt-4 md:mt-0 max-w-xs w-full bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg">
          <div className="flex-1">
            <div className="flex justify-between text-[9px] font-mono text-zinc-400 mb-1 font-bold">
              <span>CASE COMPLETION</span>
              <span className="text-[#FF7A00]">60%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="bg-[#FF7A00] h-full rounded-full" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Col 1: Overview & Checklist */}
        <div className="xl:col-span-1 flex flex-col gap-6 overflow-y-auto pr-1">
          {/* AI Case Summary */}
          <div className="glass-panel p-5 space-y-3 bg-zinc-900/40">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Brain size={14} className="text-[#FF7A00] animate-pulse" />
              AI Case Summary
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              {currentCaseInfo.summary.split('**').map((chunk, i) => i % 2 === 1 ? <strong key={i}>{chunk}</strong> : chunk)}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
              <Clock size={11} />
              <span>Last analyzed: 4m ago</span>
            </div>
          </div>

          {/* Checklist */}
          <div className="glass-panel p-5 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <ListTodo size={14} className="text-[#FF7A00]" />
                Investigation Checklist
              </h3>
              <div className="space-y-3.5">
                {checklist.map((item) => (
                  <label 
                    key={item.id} 
                    className="flex items-start gap-3 cursor-pointer group text-xs text-zinc-300"
                  >
                    <input 
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleChecklist(item.id)}
                      className="mt-0.5 rounded accent-[#FF7A00] bg-transparent border-zinc-700"
                    />
                    <span className={`group-hover:text-white transition-colors leading-relaxed ${item.completed ? 'line-through text-zinc-500' : ''}`}>
                      {item.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button 
              onClick={() => {
                const text = window.prompt("Enter new checklist item:");
                if (text && text.trim()) {
                  setChecklist(prev => [...prev, { id: Date.now(), text: text.trim(), completed: false }]);
                }
              }}
              className="w-full mt-4 btn-secondary py-2 justify-center text-xs text-zinc-300 hover:text-white font-medium"
            >
              <Plus size={14} />
              <span>Add Checklist Item</span>
            </button>
          </div>
        </div>

        {/* Col 2-3: Kanban Task Board */}
        <div className="xl:col-span-2 glass-panel p-5 flex flex-col h-full bg-zinc-900/10">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/[0.05] pb-3 mb-4 flex items-center gap-2">
            <Layers size={14} className="text-[#FF7A00]" />
            Kanban Investigation Board
          </h3>

          {/* Kanban Columns */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3 overflow-y-auto pb-2">
            
            {/* COLUMN: To Do */}
            <div className="bg-zinc-950/60 p-3 rounded-lg border border-white/[0.02] flex flex-col h-full">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono">To Do ({tasks.filter(t => t.status === 'todo').length})</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto">
                {tasks.filter(t => t.status === 'todo').map((task) => (
                  <div 
                    key={task.id} 
                    className="p-3 rounded bg-zinc-900 border border-zinc-800 hover:border-[#FF7A00]/40 transition-all cursor-pointer group"
                    onClick={() => moveTask(task.id, 'in_progress')}
                  >
                    <span className={`text-[8px] font-bold font-mono px-1 py-0.25 rounded ${
                      task.priority === 'High' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'
                    }`}>
                      {task.priority}
                    </span>
                    <p className="text-[11px] font-semibold text-white mt-1.5 leading-tight group-hover:text-[#FF7A00] transition-colors">{task.title}</p>
                    <div className="flex justify-between items-center mt-2.5 text-[9px] text-zinc-500">
                      <span>{task.assignee}</span>
                      <span>{task.due}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN: In Progress */}
            <div className="bg-zinc-950/60 p-3 rounded-lg border border-white/[0.02] flex flex-col h-full">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono">In Progress ({tasks.filter(t => t.status === 'in_progress').length})</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto">
                {tasks.filter(t => t.status === 'in_progress').map((task) => (
                  <div 
                    key={task.id} 
                    className="p-3 rounded bg-zinc-900 border border-[#FF7A00]/20 hover:border-[#FF7A00]/60 transition-all cursor-pointer group"
                    onClick={() => moveTask(task.id, 'review')}
                  >
                    <span className="text-[8px] font-bold font-mono px-1 py-0.25 rounded bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/25">
                      ACTIVE
                    </span>
                    <p className="text-[11px] font-semibold text-white mt-1.5 leading-tight group-hover:text-[#FF7A00] transition-colors">{task.title}</p>
                    <div className="flex justify-between items-center mt-2.5 text-[9px] text-zinc-500">
                      <span>{task.assignee}</span>
                      <span>{task.due}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN: Review */}
            <div className="bg-zinc-950/60 p-3 rounded-lg border border-white/[0.02] flex flex-col h-full">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono">Under Review ({tasks.filter(t => t.status === 'review').length})</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto">
                {tasks.filter(t => t.status === 'review').map((task) => (
                  <div 
                    key={task.id} 
                    className="p-3 rounded bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 transition-all cursor-pointer group"
                    onClick={() => moveTask(task.id, 'done')}
                  >
                    <span className="text-[8px] font-bold font-mono px-1 py-0.25 rounded bg-blue-500/10 text-blue-400">
                      REVIEW
                    </span>
                    <p className="text-[11px] font-semibold text-white mt-1.5 leading-tight group-hover:text-[#FF7A00] transition-colors">{task.title}</p>
                    <div className="flex justify-between items-center mt-2.5 text-[9px] text-zinc-500">
                      <span>{task.assignee}</span>
                      <span>{task.due}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN: Done */}
            <div className="bg-zinc-950/60 p-3 rounded-lg border border-white/[0.02] flex flex-col h-full">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono">Completed ({tasks.filter(t => t.status === 'done').length})</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto opacity-70">
                {tasks.filter(t => t.status === 'done').map((task) => (
                  <div 
                    key={task.id} 
                    className="p-3 rounded bg-zinc-900 border border-zinc-800 transition-all cursor-pointer group"
                    onClick={() => moveTask(task.id, 'todo')}
                  >
                    <span className="text-[8px] font-bold font-mono px-1 py-0.25 rounded bg-emerald-500/10 text-emerald-400">
                      DONE
                    </span>
                    <p className="text-[11px] font-semibold text-zinc-400 line-through mt-1.5 leading-tight">{task.title}</p>
                    <div className="flex justify-between items-center mt-2.5 text-[9px] text-zinc-500">
                      <span>{task.assignee}</span>
                      <span>{task.due}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Col 4: AI Recommendations & Evidence upload */}
        <div className="xl:col-span-1 flex flex-col gap-6 overflow-y-auto pr-1">
          {/* AI Recommendations */}
          <div className="glass-panel p-5 space-y-4 bg-zinc-900/20">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Brain size={14} className="text-[#FF7A00]" />
              AI Agent Recommendations
            </h3>
            
            <div className="space-y-3">
              {currentCaseInfo.recommendations.map((rec, i) => (
                <div key={i} className="p-3 rounded-lg border border-white/[0.03] bg-zinc-950/60 hover:border-zinc-800 transition-colors cursor-pointer space-y-1">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1">
                    <AlertCircle size={12} className="text-[#FF7A00]" />
                    {rec.title}
                  </h4>
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">{rec.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Upload */}
          <div className="glass-panel p-5 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Upload size={14} className="text-[#FF7A00]" />
                Evidence Ingestion
              </h3>
              
              {/* Drag and drop mock box */}
              <div 
                onClick={handleUploadClick}
                className="border border-dashed border-zinc-800 rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#FF7A00] transition-colors bg-zinc-950/40"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  multiple 
                  style={{ display: 'none' }} 
                />
                <Upload size={24} className="text-zinc-500 mb-2 group-hover:text-white" />
                <p className="text-xs text-white font-semibold">Upload Case Files</p>
                <p className="text-[10px] text-zinc-500 mt-1">PDF, DOCX, XLSX, MP4, JPEG up to 100MB</p>
              </div>

              {uploadError && (
                <div className="mt-3 p-2.5 bg-red-950/45 border border-red-900/30 rounded text-[10px] text-red-400 flex items-start gap-1.5 animate-fade-in font-sans">
                  <AlertCircle size={12} className="mt-0.5 flex-shrink-0 text-red-500" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>

            <div className="space-y-2 mt-4">
              {ingestedFiles.map((file, idx) => (
                <div key={idx} className="p-2 border border-zinc-800 rounded bg-zinc-900 flex items-center justify-between text-xs">
                  <span className="truncate text-zinc-400 max-w-[180px]">{file.name}</span>
                  <span className={`text-[9px] px-1 py-0.25 rounded font-mono ${
                    file.status === 'Ingested' 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : 'bg-[#FF7A00]/10 text-[#FF7A00] animate-pulse'
                  }`}>
                    {file.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
