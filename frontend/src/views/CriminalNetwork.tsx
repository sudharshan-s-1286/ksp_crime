import React, { useState } from 'react';
import { useCriminalNetwork } from '../hooks/useCriminalNetwork';
import { 
  Share2, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Filter, 
  Brain, 
  AlertTriangle, 
  User, 
  MapPin, 
  Phone, 
  CreditCard, 
  ShieldCheck,
  Zap
} from 'lucide-react';

interface NetworkNode {
  id: string;
  label: string;
  type: 'Suspect' | 'Victim' | 'Location' | 'Phone' | 'Account' | 'Vehicle';
  risk: 'High' | 'Medium' | 'Low';
  x: number;
  y: number;
  details: string;
}

interface NetworkEdge {
  from: string;
  to: string;
  label: string;
  animated?: boolean;
}

export const CriminalNetwork: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>({
    id: 'suresh_patil',
    label: 'Suresh Patil',
    type: 'Suspect',
    risk: 'High',
    x: 300,
    y: 150,
    details: 'Primary Target. Wanted for multi-district extortion ring and money laundering. Financial nodes connect to shell bank account.'
  });

  const [zoomLevel, setZoomLevel] = useState(1);
  const [filterType, setFilterType] = useState('All');

  const { data: liveNetwork, isFetching: networkFetching } = useCriminalNetwork();

  const nodes: NetworkNode[] = [
    { id: 'suresh_patil', label: 'Suresh Patil', type: 'Suspect', risk: 'High', x: 300, y: 150, details: 'Primary Target. Wanted for multi-district extortion ring and money laundering. Financial nodes connect to shell bank account.' },
    { id: 'laxman_naik', label: 'Laxman Naik', type: 'Suspect', risk: 'High', x: 180, y: 110, details: 'Field Operator. Executed jewellery store robbery. Matches lock-cutting modus operandi.' },
    { id: 'anand_hegde', label: 'Anand Hegde', type: 'Suspect', risk: 'Medium', x: 420, y: 100, details: 'Customs Liaison. Facilitates transit and smuggling pipelines. Financial accounts show direct transfers.' },
    { id: 'ramesh_patil', label: 'Acct #9982 (Ramesh)', type: 'Account', risk: 'High', x: 300, y: 260, details: 'State Bank account registered to Ramesh Patil. Flatted for anomalous transfers totaling $45,000.' },
    { id: 'aravind_shop', label: 'Aravind Jewellery', type: 'Location', risk: 'Low', x: 120, y: 220, details: 'Scene of armed robbery FIR #980/2026. CCTV disabled during loot.' },
    { id: 'phone_suresh', label: 'Ph: +91 9845X XXXXX', type: 'Phone', risk: 'High', x: 420, y: 220, details: 'Primary SIM card associated with Suresh Patil. Call logs connect to Anand Hegde and offshore proxies.' },
    { id: 'vehicle_ka03', label: 'KA-03-ME-9080', type: 'Vehicle', risk: 'Medium', x: 180, y: 250, details: 'Black Mahindra SUV. Spotted at Hebbal Toll Plaza on June 29 shortly after transaction.' }
  ];

  const edges: NetworkEdge[] = [
    { from: 'suresh_patil', to: 'laxman_naik', label: 'Direct Associate', animated: true },
    { from: 'suresh_patil', to: 'anand_hegde', label: 'Financial Handler' },
    { from: 'suresh_patil', to: 'ramesh_patil', label: 'Laundering Source', animated: true },
    { from: 'suresh_patil', to: 'phone_suresh', label: 'Registered SIM' },
    { from: 'laxman_naik', to: 'aravind_shop', label: 'Robbed Store' },
    { from: 'laxman_naik', to: 'vehicle_ka03', label: 'Driver/Occupant' },
    { from: 'anand_hegde', to: 'ramesh_patil', label: 'Wire Transfer' },
    { from: 'phone_suresh', to: 'anand_hegde', label: 'Log Connections' }
  ];

  const filteredNodes = nodes.filter(n => filterType === 'All' || n.type === filterType);
  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = edges.filter(e => filteredNodeIds.has(e.from) && filteredNodeIds.has(e.to));

  const getNodeColor = (node: NetworkNode) => {
    if (selectedNode?.id === node.id) return '#FF7A00';
    switch (node.type) {
      case 'Suspect': return node.risk === 'High' ? '#FF3B30' : '#FF7A00';
      case 'Location': return '#00A3FF';
      case 'Phone': return '#A855F7';
      case 'Account': return '#00E575';
      case 'Vehicle': return '#F59E0B';
      default: return '#71717A';
    }
  };

  const getNodeIcon = (type: NetworkNode['type']) => {
    switch (type) {
      case 'Suspect': return <User size={12} />;
      case 'Location': return <MapPin size={12} />;
      case 'Phone': return <Phone size={12} />;
      case 'Account': return <CreditCard size={12} />;
      default: return <Share2 size={12} />;
    }
  };

  return (
    <div className="w-full p-8 flex flex-col bg-zinc-950/20">
      
      {/* Top Welcome Title */}
      <div className="flex justify-between items-center border-b border-white/[0.05] pb-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-heading uppercase tracking-tight flex items-center gap-2">
            <Share2 className="text-[#FF7A00]" /> Criminal Network Graph
          </h1>
          <p className="text-sm text-zinc-400 mt-4 leading-relaxed">Interactive relationship analyzer connecting criminals, accounts, phones, and location assets.</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field py-1.5 text-xs bg-zinc-900 border-zinc-800 text-white font-sans"
          >
            <option value="All">All Entities</option>
            <option value="Suspect">Suspects</option>
            <option value="Location">Locations</option>
            <option value="Phone">Phones</option>
            <option value="Account">Bank Accounts</option>
          </select>
        </div>
      </div>

      {/* Main Graph Area */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 min-h-[600px]">
        
        {/* Graph Canvas */}
        <div className="xl:col-span-3 glass-panel relative bg-zinc-950/80 overflow-hidden flex flex-col" style={{ minHeight: '560px' }}>
          
          {/* Canvas HUD Overlay */}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <button 
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.1, 1.5))}
              className="p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <button 
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.1, 0.7))}
              className="p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <button 
              onClick={() => setZoomLevel(1)}
              className="p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
              title="Reset Viewport"
            >
              <Maximize size={14} />
            </button>
          </div>

          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-[#FF7A00]/10 border border-[#FF7A00]/20 text-[#FF7A00] px-2 py-0.5 rounded font-mono text-[9px] font-bold">
            <Zap size={11} className="animate-pulse" />
            <span>NEO4J SYNCHRONIZED</span>
          </div>

          {/* Graph Workspace (SVG canvas) */}
          <div className="flex-1 flex items-center justify-center relative cursor-grab active:cursor-grabbing">
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 600 400"
              style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-out' }}
            >
              {/* Custom patterns for grid background */}
              <defs>
                <pattern id="graphGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="1"/>
                </pattern>
                
                {/* Glowing Marker for glowing lines */}
                <marker id="arrow" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#FF7A00" />
                </marker>
              </defs>
              <rect width="100%" height="100%" fill="url(#graphGrid)" />

              {/* Draw Edges */}
              {filteredEdges.map((edge, idx) => {
                const fromNode = nodes.find(n => n.id === edge.from);
                const toNode = nodes.find(n => n.id === edge.to);
                if (!fromNode || !toNode) return null;

                return (
                  <g key={idx}>
                    {/* Outer glowing path */}
                    <line 
                      x1={fromNode.x} 
                      y1={fromNode.y} 
                      x2={toNode.x} 
                      y2={toNode.y} 
                      stroke="#FF7A00" 
                      strokeWidth="2.5" 
                      strokeOpacity={edge.animated ? 0.35 : 0.1}
                      className={edge.animated ? 'animate-pulse' : ''}
                    />
                    
                    {/* Primary link line */}
                    <line 
                      x1={fromNode.x} 
                      y1={fromNode.y} 
                      x2={toNode.x} 
                      y2={toNode.y} 
                      stroke={edge.animated ? '#FF7A00' : 'rgba(255,255,255,0.1)'} 
                      strokeWidth="1" 
                      markerEnd="url(#arrow)"
                    />
                    
                    {/* Edge Label text in middle */}
                    <text 
                      x={(fromNode.x + toNode.x) / 2} 
                      y={(fromNode.y + toNode.y) / 2 - 4} 
                      fill="#525252" 
                      fontSize="7" 
                      fontWeight="bold" 
                      textAnchor="middle"
                      fontFamily="var(--font-mono)"
                    >
                      {edge.label}
                    </text>
                  </g>
                );
              })}

              {/* Draw Nodes */}
              {filteredNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const nodeColor = getNodeColor(node);

                return (
                  <g 
                    key={node.id} 
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer group"
                  >
                    {/* Pulse glow background for high risk/selected nodes */}
                    {(node.risk === 'High' || isSelected) && (
                      <circle 
                        r="20" 
                        fill={nodeColor} 
                        fillOpacity="0.08" 
                        className="animate-ping" 
                        style={{ animationDuration: '3s' }} 
                      />
                    )}
                    
                    {/* Node circle */}
                    <circle 
                      r="12" 
                      fill="#090909" 
                      stroke={nodeColor} 
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                      className="transition-all duration-300 group-hover:scale-110"
                    />

                    {/* Node inner details */}
                    <circle r="4" fill={nodeColor} />

                    {/* Node text label */}
                    <text 
                      y="26" 
                      fill={isSelected ? '#fff' : '#A3A3A3'} 
                      fontSize="9" 
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      textAnchor="middle"
                      className="font-heading transition-colors"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Graph footer intelligence brief */}
          <div className="p-4 border-t border-white/[0.05] bg-zinc-950/60 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain size={14} className="text-[#FF7A00]" />
              <span className="text-zinc-400 font-sans">
                AI Inference: <strong className="text-white">Active loop identified.</strong> Suspect **Suresh Patil** linked to shell accounts laundered by Anand Hegde.
              </span>
            </div>
            <button className="text-[10px] text-orange-500 font-bold hover:underline">RUN PROPAGATION ANALYSIS</button>
          </div>
        </div>

        {/* Right Details Panel */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          
          {/* Selected Node Profile */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/[0.05] pb-3">
              <ShieldCheck size={14} className="text-[#FF7A00]" />
              Entity Intelligence Brief
            </h3>
            
            {selectedNode ? (
              <div className="space-y-4 text-xs animate-slide-up">
                <div>
                  <span className="text-[9px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono font-semibold uppercase">{selectedNode.type}</span>
                  <h4 className="text-sm font-bold text-white mt-2">{selectedNode.label}</h4>
                </div>
                
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-mono">Risk Assessment:</span>
                    <strong className={`font-bold ${
                      selectedNode.risk === 'High' ? 'text-red-500' : 'text-[#FF7A00]'
                    }`}>{selectedNode.risk} Risk</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-mono">Entity ID:</span>
                    <span className="font-mono text-zinc-300">ksp_{selectedNode.id}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Investigator Logs</span>
                  <p className="text-zinc-300 leading-relaxed font-sans bg-zinc-950/60 p-3 rounded border border-white/[0.02]">
                    {selectedNode.details}
                  </p>
                </div>
                
                <button className="w-full btn-glow py-2.5 justify-center font-bold">
                  <span>Open Dossier File</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-10 text-zinc-500 text-xs">
                Select a network node to inspect direct associations.
              </div>
            )}
          </div>

          {/* Direct Relationships Checklist */}
          <div className="glass-panel p-5 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Linked Associations</h3>
              <div className="space-y-3.5 text-xs">
                {selectedNode ? (
                  edges
                    .filter(e => e.from === selectedNode.id || e.to === selectedNode.id)
                    .map((edge, idx) => {
                      const otherNodeId = edge.from === selectedNode.id ? edge.to : edge.from;
                      const otherNode = nodes.find(n => n.id === otherNodeId);
                      return (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between p-2 rounded bg-zinc-900 border border-zinc-800 hover:border-[#FF7A00]/40 transition-colors cursor-pointer"
                          onClick={() => otherNode && setSelectedNode(otherNode)}
                        >
                          <div className="flex items-center gap-2">
                            {otherNode && getNodeIcon(otherNode.type)}
                            <span className="font-semibold text-white truncate max-w-[120px]">{otherNode?.label}</span>
                          </div>
                          <span className="text-[9px] font-mono text-zinc-500 font-semibold">{edge.label}</span>
                        </div>
                      );
                    })
                ) : (
                  <span className="text-zinc-600">No node selected.</span>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
