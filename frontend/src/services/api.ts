import { apiClient } from '../api/client';
import type { 
  CrimeRecord, 
  DashboardStats, 
  AnalyticsData, 
  Report, 
  User, 
  AgentResult 
} from '../types';


// Real API call for the Copilot chat pipeline
export const chatCopilot = async (
  query: string, 
  role: string = 'Investigator', 
  sessionId: string = 'web_session_default',
  context: any = {}
) => {
  const response = await apiClient.post('/api/chat', {
    query,
    role,
    session_id: sessionId,
    context
  });
  return response.data;
};

// --- MOCK SERVICE FALLBACKS (as per Rule 6, matching the backend SQLite seed schemas) ---

// In-memory seeded crimes matching backend/rag/sql_retriever.py exactly
const seededCrimes: CrimeRecord[] = [
  { fir_id: "FIR-2025-001", suspect_name: "Suresh Patil", crime_type: "Burglary", district: "Mysore", lat: 12.2958, lng: 76.6394, case_status: "Under Investigation", occurrence_date: "2025-01-15", occurrence_time: "02:15", modus_operandi: "Nocturnal entry via lockpicking. Night surveillance disguised as a technician." },
  { fir_id: "FIR-2025-009", suspect_name: "Suresh Patil", crime_type: "Burglary", district: "Mysore", lat: 12.3082, lng: 76.6450, case_status: "Chargesheet Filed", occurrence_date: "2025-03-22", occurrence_time: "03:40", modus_operandi: "Targeted locked luxury house. Leveraged window latch bypass." },
  { fir_id: "FIR-2025-018", suspect_name: "Suresh Patil", crime_type: "Burglary", district: "Mangalore", lat: 12.9141, lng: 74.8560, case_status: "Under Investigation", occurrence_date: "2025-06-10", occurrence_time: "01:30", modus_operandi: "Bypassed security gate. Conducted prior casing disguised as maintenance staff." },
  { fir_id: "FIR-2025-002", suspect_name: "Ramesh Kumar", crime_type: "Cyber Crime", district: "Bangalore Central", lat: 12.9716, lng: 77.5946, case_status: "Under Investigation", occurrence_date: "2025-01-20", occurrence_time: "11:00", modus_operandi: "Phishing campaign spoofing local bank portals." },
  { fir_id: "FIR-2025-005", suspect_name: "Ramesh Kumar", crime_type: "Financial Fraud", district: "Bangalore Central", lat: 12.9720, lng: 77.5950, case_status: "Chargesheet Filed", occurrence_date: "2025-02-14", occurrence_time: "14:30", modus_operandi: "Hawala transfers routed through textile shell corporations." },
  { fir_id: "FIR-2025-011", suspect_name: "Dinesh Gowda", crime_type: "Extortion", district: "Bangalore East", lat: 12.9784, lng: 77.6408, case_status: "Under Investigation", occurrence_date: "2025-04-05", occurrence_time: "16:45", modus_operandi: "Intimidation of construction site managers for protection money." },
  { fir_id: "FIR-2025-022", suspect_name: "Dinesh Gowda", crime_type: "Extortion", district: "Bangalore East", lat: 12.9800, lng: 77.6420, case_status: "Arrested", occurrence_date: "2025-07-12", occurrence_time: "19:15", modus_operandi: "Threats made to transport operators regarding sand transit permits." },
  { fir_id: "FIR-2025-003", suspect_name: "Anil K.", crime_type: "Theft", district: "Shivajinagar", lat: 12.9856, lng: 77.6056, case_status: "Closed", occurrence_date: "2025-01-25", occurrence_time: "20:30", modus_operandi: "Pickpocketing near public transit node." },
  { fir_id: "FIR-2025-004", suspect_name: "Unknown", crime_type: "Assault", district: "Shivajinagar", lat: 12.9860, lng: 77.6060, case_status: "Under Investigation", occurrence_date: "2025-02-02", occurrence_time: "22:15", modus_operandi: "Physical altercation outside commercial venue." },
  { fir_id: "FIR-2025-006", suspect_name: "Unknown", crime_type: "Theft", district: "Shivajinagar", lat: 12.9858, lng: 77.6058, case_status: "Under Investigation", occurrence_date: "2025-02-18", occurrence_time: "21:00", modus_operandi: "Bicycle theft from residential parking slot." },
  { fir_id: "FIR-2025-007", suspect_name: "Unknown", crime_type: "Assault", district: "Shivajinagar", lat: 12.9862, lng: 77.6062, case_status: "Under Investigation", occurrence_date: "2025-03-01", occurrence_time: "23:00", modus_operandi: "Street fight involving multiple youths." },
  { fir_id: "FIR-2025-008", suspect_name: "Unknown", crime_type: "Cyber Crime", district: "Bangalore Central", lat: 12.9710, lng: 77.5930, case_status: "Under Investigation", occurrence_date: "2025-03-10", occurrence_time: "15:00", modus_operandi: "Card skimming at commercial terminal." },
  { fir_id: "FIR-2025-010", suspect_name: "Unknown", crime_type: "Theft", district: "Mysore", lat: 12.2950, lng: 76.6380, case_status: "Closed", occurrence_date: "2025-03-30", occurrence_time: "09:15", modus_operandi: "Shoplifting from retail mall." },
  { fir_id: "FIR-2025-012", suspect_name: "Unknown", crime_type: "Burglary", district: "Mysore", lat: 12.2960, lng: 76.6400, case_status: "Under Investigation", occurrence_date: "2025-04-12", occurrence_time: "03:00", modus_operandi: "Forced entry through rear door of retail outlet." }
];

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  await new Promise(resolve => setTimeout(resolve, 600)); // Network delay
  
  const total = seededCrimes.length;
  const active = seededCrimes.filter(c => c.case_status === 'Under Investigation').length;
  const pending = seededCrimes.filter(c => c.case_status === 'Chargesheet Filed').length;
  const highRisk = seededCrimes.filter(c => c.suspect_name === 'Suresh Patil').length;

  return {
    totalFirs: total,
    totalFirsChange: '+4.2%',
    activeCases: active,
    activeCasesChange: '+1.8%',
    pendingInvestigations: pending,
    pendingInvestigationsChange: '-2.5%',
    highRiskOffenders: highRisk,
    highRiskOffendersChange: '+12.4%',
    crimeHotspots: '14 Stable',
    aiRiskWarnings: 3,
    hotspots: [
      { lat: 12.9716, lng: 77.5946, district: "Bangalore Central", incident_count: 3 },
      { lat: 12.2958, lng: 76.6394, district: "Mysore", incident_count: 4 },
      { lat: 12.9141, lng: 74.8560, district: "Mangalore", incident_count: 1 },
      { lat: 12.9784, lng: 77.6408, district: "Bangalore East", incident_count: 2 },
      { lat: 12.9856, lng: 77.6056, district: "Shivajinagar", incident_count: 4 }
    ],
    timeDistribution: {
      "Morning": 2,
      "Afternoon": 3,
      "Evening": 4,
      "Night": 5
    },
    recentAlerts: [
      { id: '1', title: 'Gang activity spike predicted in Hebbal', desc: 'Forecast Agent detected 14% risk increase for cyber-crime & extortion.', time: '18m ago', type: 'critical' },
      { id: '2', title: 'Anomalous transactional activity', desc: 'Financial Agent flagged $45,000 transfer connected to suspect Suresh Patil.', time: '45m ago', type: 'warning' },
      { id: '3', title: 'Modus Operandi match detected', desc: 'Crime Agent matched burglar case #908A with offender Laxman Naik profile.', time: '2h ago', type: 'info' }
    ],
    liveActivity: [
      { id: '1', time: '18:45', location: 'Bengaluru Central', desc: 'Robbery FIR #980/2026 registered', officer: 'Insp. R. Gowda', badge: 'Sys-Alert' },
      { id: '2', time: '17:15', location: 'Mysuru Town', desc: 'Offender Suresh Patil spotted on CCTV grid', officer: 'Sys-Alert', badge: 'SI K. Patil' },
      { id: '3', time: '15:30', location: 'Hubballi North', desc: 'Interrogation notes uploaded for Case #820', officer: 'Insp. M. Shenoy', badge: 'Insp. M. Shenoy' }
    ]
  };
};

export const fetchCrimeDatabase = async (filters: { 
  search?: string; 
  type?: string; 
  district?: string; 
  page?: number; 
  limit?: number; 
}): Promise<{ records: CrimeRecord[]; total: number }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let result = [...seededCrimes];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(c => 
      c.fir_id.toLowerCase().includes(q) ||
      c.suspect_name.toLowerCase().includes(q) ||
      c.modus_operandi.toLowerCase().includes(q)
    );
  }

  if (filters.type && filters.type !== 'All') {
    result = result.filter(c => c.crime_type === filters.type);
  }

  if (filters.district && filters.district !== 'All') {
    result = result.filter(c => c.district === filters.district);
  }

  const total = result.length;
  const page = filters.page || 1;
  const limit = filters.limit || 5;
  const start = (page - 1) * limit;
  const paginated = result.slice(start, start + limit);

  return {
    records: paginated,
    total
  };
};

// Alias for use by useCriminalNetwork hook
export const fetchCrimes = fetchCrimeDatabase;


export const fetchAnalytics = async (): Promise<AnalyticsData> => {
  await new Promise(resolve => setTimeout(resolve, 700));

  return {
    crimesByType: [
      { type: 'Burglary', count: 4 },
      { type: 'Theft', count: 3 },
      { type: 'Cyber Crime', count: 2 },
      { type: 'Extortion', count: 2 },
      { type: 'Assault', count: 2 },
      { type: 'Financial Fraud', count: 1 }
    ],
    monthlyStats: [
      { month: 'Jan', Burglary: 15, 'Cyber Crime': 8, Theft: 30 },
      { month: 'Feb', Burglary: 16, 'Cyber Crime': 10, Theft: 28 },
      { month: 'Mar', Burglary: 18, 'Cyber Crime': 12, Theft: 32 },
      { month: 'Apr', Burglary: 17, 'Cyber Crime': 15, Theft: 31 },
      { month: 'May', Burglary: 20, 'Cyber Crime': 19, Theft: 29 },
      { month: 'Jun', Burglary: 22, 'Cyber Crime': 25, Theft: 34 }
    ]
  };
};

export const fetchReports = async (): Promise<Report[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return [
    { id: 'REP-001', title: 'Suresh Patil Network Extortion Ring Analysis', date: '2026-07-02', size: '2.4 MB', type: 'PDF', status: 'Complete' },
    { id: 'REP-002', title: 'District Crime Density Forecast (Q3 2026)', date: '2026-06-28', size: '4.1 MB', type: 'PDF', status: 'Complete' },
    { id: 'REP-003', title: 'Financial Audit Report: Ramesh Patil Shell Accounts', date: '2026-06-15', size: '1.8 MB', type: 'PDF', status: 'Complete' },
    { id: 'REP-004', title: 'Weekly AI Anomalies Summary', date: '2026-07-01', size: '840 KB', type: 'JSON', status: 'Complete' }
  ];
};

export const fetchAgentStatus = async (): Promise<AgentResult[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [
    { agent_name: "Profiling Agent", status: "Active", confidence: 94, execution_time_ms: 140 },
    { agent_name: "Analytics Agent", status: "Active", confidence: 96, execution_time_ms: 220 },
    { agent_name: "Forecast Agent", status: "Active", confidence: 91, execution_time_ms: 310 },
    { agent_name: "Network Agent", status: "Active", confidence: 95, execution_time_ms: 180 },
    { agent_name: "Financial Agent", status: "Active", confidence: 92, execution_time_ms: 290 }
  ];
};
