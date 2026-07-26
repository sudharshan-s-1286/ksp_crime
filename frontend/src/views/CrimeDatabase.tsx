import React, { useState } from 'react';
import { useCrimeDatabase } from '../hooks/useCrimeDatabase';
import type { CrimeRecord } from '../types';
import { 
  Search, 
  Filter, 
  Download, 
  ArrowUpDown, 
  Eye, 
  X, 
  Calendar, 
  MapPin, 
  FileText, 
  User,
  Clock,
  NotebookTabs,
  Paperclip,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const PAGE_SIZE = 5;

export const CrimeDatabase: React.FC = () => {
  const [selectedRecord, setSelectedRecord] = useState<CrimeRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterDistrict, setFilterDistrict] = useState('All');
  const [page, setPage] = useState(1);

  // Debounce search input
  const handleSearch = (val: string) => {
    setSearchQuery(val);
    clearTimeout((window as any).__searchTimer);
    (window as any).__searchTimer = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 350);
  };

  const { data, isLoading, isError, error, isFetching } = useCrimeDatabase({
    search: debouncedSearch,
    type: filterType,
    district: filterDistrict,
    page,
    limit: PAGE_SIZE
  });

  const records = data?.records || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const statusStyle = (status: string) => {
    if (status === 'Arrested') return 'bg-red-500/10 border-red-500/20 text-red-400';
    if (status === 'Under Investigation') return 'bg-[#FF7A00]/10 border-[#FF7A00]/20 text-[#FF7A00]';
    if (status === 'Chargesheet Filed') return 'bg-[#00A3FF]/10 border-[#00A3FF]/20 text-[#00A3FF]';
    return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'; // Closed
  };

  return (
    <div className="w-full p-8 flex flex-col animate-fade-in">

      {/* Header section */}
      <div className="flex justify-between items-center border-b border-white/[0.05] pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white font-heading uppercase tracking-tight">Crime Records Database</h1>
          <p className="text-sm text-zinc-400 mt-4 leading-relaxed">Audit, search, and filter official First Information Reports (FIRs) from the Karnataka State Police database.</p>
        </div>
        <div className="flex items-center gap-3">
          {isFetching && !isLoading && (
            <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00]"></span>
              Syncing...
            </span>
          )}
          <button 
            onClick={() => window.open(`http://localhost:8000/api/export-records?type=${filterType}&district=${filterDistrict}&search=${debouncedSearch}`, '_blank')}
            className="btn-glow text-xs flex items-center gap-2"
          >
            <Download size={14} />
            <span>Export Records</span>
          </button>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by FIR ID, suspect, crime type, district..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="input-field w-full pl-10 pr-4 py-2 text-sm"
          />
        </div>

        <div>
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="input-field w-full py-2 text-sm font-sans"
          >
            <option value="All">All Crime Types</option>
            <option value="Burglary">Burglary</option>
            <option value="Theft">Theft</option>
            <option value="Extortion">Extortion</option>
            <option value="Cyber Crime">Cyber Crime</option>
            <option value="Assault">Assault</option>
            <option value="Financial Fraud">Financial Fraud</option>
          </select>
        </div>

        <div>
          <select
            value={filterDistrict}
            onChange={(e) => { setFilterDistrict(e.target.value); setPage(1); }}
            className="input-field w-full py-2 text-sm font-sans"
          >
            <option value="All">All Districts</option>
            <option value="Bangalore Central">Bangalore Central</option>
            <option value="Bangalore East">Bangalore East</option>
            <option value="Mysore">Mysore</option>
            <option value="Mangalore">Mangalore</option>
            <option value="Shivajinagar">Shivajinagar</option>
          </select>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center justify-between mb-3 text-xs text-zinc-500 font-mono">
        <span>
          Showing <strong className="text-zinc-300">{records.length}</strong> of{' '}
          <strong className="text-zinc-300">{total}</strong> records
        </span>
        <span>Page {page} of {totalPages || 1}</span>
      </div>

      {/* Main Table view */}
      <div className="glass-panel relative bg-zinc-950/40 overflow-auto">
        {/* Loading Skeleton */}
        {isLoading && (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 shimmer-loader rounded-lg" />
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="p-10 flex flex-col items-center gap-4 text-center">
            <AlertTriangle size={32} className="text-red-500" />
            <p className="text-sm text-zinc-400">{error?.message || 'Failed to load crime records.'}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && records.length === 0 && (
          <div className="p-12 text-center text-zinc-500 text-sm">
            No records match your search criteria.
          </div>
        )}

        {/* Records Table */}
        {!isLoading && !isError && records.length > 0 && (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-zinc-950 border-b border-white/[0.05] text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono z-10">
              <tr>
                <th className="p-4">FIR ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Crime Type</th>
                <th className="p-4">District</th>
                <th className="p-4">Suspect</th>
                <th className="p-4">Status</th>
                <th className="p-4">Time</th>
                <th className="p-4 text-center">View</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-white/[0.03]">
              {records.map((r) => (
                <tr
                  key={r.fir_id}
                  className="hover:bg-white/[0.02] cursor-pointer transition-colors group"
                  onClick={() => setSelectedRecord(r)}
                >
                  <td className="p-4 font-mono font-semibold text-white group-hover:text-[#FF7A00] transition-colors">{r.fir_id}</td>
                  <td className="p-4 text-zinc-300 font-mono">{r.occurrence_date}</td>
                  <td className="p-4 text-zinc-300">{r.crime_type}</td>
                  <td className="p-4 text-zinc-300">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-zinc-500" />
                      <span>{r.district}</span>
                    </div>
                  </td>
                  <td className="p-4 text-white truncate max-w-[150px]">{r.suspect_name}</td>
                  <td className="p-4">
                    <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border ${statusStyle(r.case_status)}`}>
                      {r.case_status}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-400 font-mono">{r.occurrence_time}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedRecord(r); }}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1 disabled:opacity-30"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <div className="flex gap-1.5">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-8 h-8 rounded text-xs font-mono font-bold transition-all ${
                  page === i + 1
                    ? 'bg-[#FF7A00] text-white border border-[#FF7A00]'
                    : 'text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1 disabled:opacity-30"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Side Sliding Drawer Detail View */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end animate-fade-in">
          <div className="flex-1" onClick={() => setSelectedRecord(null)} />
          <div className="w-[500px] bg-zinc-950 border-l border-white/[0.08] h-full flex flex-col shadow-2xl animate-slide-left p-6 relative overflow-y-auto">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-6 right-6 p-2 rounded-lg hover:bg-white/[0.05] text-zinc-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="border-b border-white/[0.05] pb-4 mb-5">
              <span className="text-[10px] font-bold text-[#FF7A00] font-mono tracking-widest uppercase">FIR Details Drawer</span>
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

    </div>
  );
};
