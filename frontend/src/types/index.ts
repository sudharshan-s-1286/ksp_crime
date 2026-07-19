export interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  clearance: string;
}

export interface AuthSession {
  token: string;
  user: User;
}

export interface CrimeRecord {
  fir_id: string;
  suspect_name: string;
  crime_type: string;
  district: string;
  lat: number;
  lng: number;
  case_status: string;
  occurrence_date: string;
  occurrence_time: string;
  modus_operandi: string;
}

export interface AgentResult {
  agent_name: string;
  status: string;
  output?: string;
  confidence?: number;
  execution_time_ms?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'agent';
  content: string;
  timestamp: string;
  name?: string;
  confidence?: number;
  agent_results?: AgentResult[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastActive: string;
}

export interface Hotspot {
  lat: number;
  lng: number;
  district: string;
  incident_count: number;
}

export interface DashboardStats {
  totalFirs: number;
  totalFirsChange: string;
  activeCases: number;
  activeCasesChange: string;
  pendingInvestigations: number;
  pendingInvestigationsChange: string;
  highRiskOffenders: number;
  highRiskOffendersChange: string;
  crimeHotspots: string;
  aiRiskWarnings: number;
  hotspots: Hotspot[];
  timeDistribution: Record<string, number>;
  recentAlerts: Array<{
    id: string;
    title: string;
    desc: string;
    time: string;
    type: 'critical' | 'warning' | 'info';
  }>;
  liveActivity: Array<{
    id: string;
    time: string;
    location: string;
    desc: string;
    officer: string;
    badge: string;
  }>;
}

export interface AnalyticsData {
  crimesByType: Array<{ type: string; count: number }>;
  monthlyStats: Array<{ month: string; Burglary: number; 'Cyber Crime': number; Theft: number }>;
}

export interface Report {
  id: string;
  title: string;
  date: string;
  size: string;
  type: string;
  status: 'Complete' | 'Generating' | 'Failed';
}

export interface NetworkNode {
  id: string;
  label: string;
  type: 'Suspect' | 'Victim' | 'Location' | 'Phone' | 'Account' | 'Vehicle';
  risk: 'High' | 'Medium' | 'Low';
  x: number;
  y: number;
  details: string;
}

export interface NetworkEdge {
  from: string;
  to: string;
  label: string;
  animated?: boolean;
}

