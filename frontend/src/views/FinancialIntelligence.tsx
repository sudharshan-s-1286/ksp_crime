import React from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  CreditCard, 
  ArrowDownLeft, 
  AlertTriangle, 
  Zap,
  TrendingUp,
  TrendingDown,
  ShieldAlert
} from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  sender: string;
  receiver: string;
  amount: number;
  type: string;
  status: 'Flagged' | 'Under Audit' | 'Cleared';
  threat: 'Critical' | 'High' | 'Medium' | 'Low';
}

export const FinancialIntelligence: React.FC = () => {
  const transactions: Transaction[] = [
    { id: 'TX-82918', date: '2026-06-29 14:10', sender: 'Karnataka Merchant Assoc', receiver: 'Suresh Patil Broker Acct', amount: 15000, type: 'Wire Transfer', status: 'Flagged', threat: 'Critical' },
    { id: 'TX-81023', date: '2026-06-28 09:30', sender: 'Suresh Patil Broker Acct', receiver: 'Ramesh Patil Shell Acct', amount: 12000, type: 'Inter-Bank Transfer', status: 'Flagged', threat: 'High' },
    { id: 'TX-72901', date: '2026-06-24 16:45', sender: 'Anand Hegde Transit', receiver: 'Ramesh Patil Shell Acct', amount: 8000, type: 'Cryptocurrency Swap', status: 'Under Audit', threat: 'Medium' },
    { id: 'TX-61298', date: '2026-06-20 11:20', sender: 'Sankeshwar Bank Vault', receiver: 'Glow-Red BTC Wallet', amount: 18500, type: 'Crypto Ransom', status: 'Flagged', threat: 'Critical' },
    { id: 'TX-49210', date: '2026-06-18 10:15', sender: 'Anand Hegde Transit', receiver: 'Offshore Hub Cayman', amount: 24000, type: 'Export Payment', status: 'Cleared', threat: 'Low' }
  ];

  return (
    <div className="w-full p-8 flex flex-col bg-zinc-950/20">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/[0.05] pb-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-heading uppercase tracking-tight flex items-center gap-2">
            <Wallet className="text-[#FF7A00]" /> Financial Intelligence Dashboard
          </h1>
          <p className="text-sm text-zinc-400 mt-4 leading-relaxed">Cross-referencing bank audit data, wire histories, and blockchain ledgers for laundering networks.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 bg-[#FF7A00]/10 border border-[#FF7A00]/20 text-[#FF7A00] px-2.5 py-1 rounded font-mono text-[10px] font-bold">
            <Zap size={11} className="animate-pulse" />
            <span>AI FRAUD SCORING ENABLED</span>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Col 1-2: Money Flow Graph (SVG) & Transactions */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* Money Flow Canvas */}
          <div className="glass-panel p-5 flex flex-col gap-4 bg-zinc-950/70" style={{ minHeight: '260px' }}>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/[0.05] pb-3">
              <ShieldAlert size={14} className="text-[#FF7A00]" />
              Wire flow & Laundering Channels
            </h3>
            
            <div className="flex-1 flex items-center justify-center py-2 relative">
              <svg viewBox="0 0 600 200" className="w-full h-full max-h-[160px]">
                <defs>
                  <marker id="financialArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#FF7A00" />
                  </marker>
                  <marker id="redArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#FF3B30" />
                  </marker>
                  <marker id="blueArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#00A3FF" />
                  </marker>
                  <marker id="greenArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#00E575" />
                  </marker>
                </defs>
                
                {/* Node 1: Extorted Merchants */}
                <g transform="translate(60, 100)">
                  <circle r="22" fill="#090909" stroke="#A3A3A3" strokeWidth="1.5" />
                  <text y="3" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">Merchants</text>
                  <text y="34" fill="#525252" fontSize="7" fontStyle="italic" textAnchor="middle">Source Pool</text>
                </g>
 
                {/* Node 2: Suresh Patil Acct */}
                <g transform="translate(200, 45)">
                  <circle r="24" fill="#090909" stroke="#FF3B30" strokeWidth="2" className="animate-pulse" />
                  <text y="3" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">Suresh Patil</text>
                  <text y="36" fill="#FF3B30" fontSize="7" fontWeight="bold" textAnchor="middle">Broker Acct</text>
                </g>
 
                {/* Node 3: Ramesh Patil Shell */}
                <g transform="translate(360, 100)">
                  <circle r="22" fill="#090909" stroke="#FF7A00" strokeWidth="1.5" />
                  <text y="3" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">Ramesh Patil</text>
                  <text y="34" fill="#FF7A00" fontSize="7" textAnchor="middle">Shell Acct</text>
                </g>
 
                {/* Node 4: Cayman Island offshore */}
                <g transform="translate(510, 100)">
                  <circle r="22" fill="#090909" stroke="#00E575" strokeWidth="1.5" />
                  <text y="3" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">Cayman Hub</text>
                  <text y="34" fill="#525252" fontSize="7" textAnchor="middle">Offshore</text>
                </g>
 
                {/* Node 5: Anand Hegde Crypto */}
                <g transform="translate(200, 155)">
                  <circle r="22" fill="#090909" stroke="#00A3FF" strokeWidth="1.5" />
                  <text y="3" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">Anand Hegde</text>
                  <text y="34" fill="#00A3FF" fontSize="7" textAnchor="middle">Transit Acct</text>
                </g>
 
                {/* Connection paths with exact start/end border coordinates */}
                <path d="M81,92 L177,54" fill="none" stroke="#FF3B30" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#redArrow)" />
                <path d="M81,108 L180,147" fill="none" stroke="#00A3FF" strokeWidth="1" markerEnd="url(#blueArrow)" />
                <path d="M223,53 L339,93" fill="none" stroke="#FF7A00" strokeWidth="2" markerEnd="url(#financialArrow)" />
                <path d="M221,148 L339,107" fill="none" stroke="#FF7A00" strokeWidth="1" markerEnd="url(#financialArrow)" />
                <path d="M382,100 L488,100" fill="none" stroke="#00E575" strokeWidth="1.5" markerEnd="url(#greenArrow)" />
              </svg>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="flex-1 glass-panel p-5 overflow-auto bg-zinc-950/40">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Audited Case Transactions</h3>
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-zinc-950 border-b border-white/[0.05] text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono">
                <tr>
                  <th className="pb-2">TXID</th>
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Sender Node</th>
                  <th className="pb-2">Recipient Node</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Method</th>
                  <th className="pb-2">Threat Rating</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-white/[0.02]">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] cursor-pointer">
                    <td className="py-2.5 font-mono text-zinc-400 font-bold">{tx.id}</td>
                    <td className="py-2.5 font-mono text-zinc-500 text-[10px]">{tx.date}</td>
                    <td className="py-2.5 text-zinc-300 truncate max-w-[100px]">{tx.sender}</td>
                    <td className="py-2.5 text-zinc-300 truncate max-w-[100px]">{tx.receiver}</td>
                    <td className="py-2.5 text-white font-mono font-semibold">${tx.amount.toLocaleString()}</td>
                    <td className="py-2.5 text-zinc-400">{tx.type}</td>
                    <td className="py-2.5">
                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.25 rounded border ${
                        tx.threat === 'Critical' 
                          ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                          : tx.threat === 'High' 
                          ? 'bg-orange-500/10 border-orange-500/20 text-orange-500'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                      }`}>
                        {tx.threat}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Col 3: AI Fraud score card & alerts */}
        <div className="xl:col-span-1 flex flex-col gap-6 overflow-y-auto">
          
          {/* Fraud score card */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/[0.05] pb-3">
              <ShieldAlert size={14} className="text-[#FF7A00]" />
              AI Laundering Probability
            </h3>
            
            <div className="flex flex-col items-center gap-2.5 py-4 bg-zinc-950 border border-white/[0.02] rounded-xl">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Fraud network correlation</span>
              
              {/* Score text */}
              <div className="flex items-baseline">
                <span className="text-4xl font-extrabold font-heading text-red-500 tracking-tight">91.4</span>
                <span className="text-xs text-zinc-500 font-bold ml-1 font-mono">/ 100</span>
              </div>
              <span className="text-[8px] bg-red-500/15 text-red-500 border border-red-500/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">CRITICAL PATTERN MATCH</span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Wallet Traces:</span>
                <strong className="text-white font-mono">3 Wallet connections</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Offshore transfer rate:</span>
                <strong className="text-red-500 font-mono">+180% spikes</strong>
              </div>
            </div>
          </div>

          {/* Suspicious alerts */}
          <div className="glass-panel p-5 flex-1 flex flex-col justify-between bg-zinc-900/10">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Suspicious Transaction Alerts</h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-zinc-950 border border-zinc-850 rounded hover:border-[#FF7A00]/40 transition-colors cursor-pointer space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <strong className="text-white">Wire to Offshore Hub</strong>
                    <span className="text-[9px] text-red-500 font-mono font-bold">14h ago</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">$24,000 sent from Anand Hegde account flagged as export disguise.</p>
                </div>

                <div className="p-3 bg-zinc-950 border border-zinc-850 rounded hover:border-[#FF7A00]/40 transition-colors cursor-pointer space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <strong className="text-white">Multiple cryptos swaps</strong>
                    <span className="text-[9px] text-orange-500 font-mono font-bold">2d ago</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">Sequence of rapid Bitcoin transactions routed through mixer platforms.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
