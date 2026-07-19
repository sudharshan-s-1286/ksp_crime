import { useQuery } from '@tanstack/react-query';
import { fetchAgentStatus } from '../services/api';
import type { AgentResult } from '../types';

export const useAgentMonitoring = () => {
  return useQuery<AgentResult[], Error>({
    queryKey: ['agentStatus'],
    queryFn: fetchAgentStatus,
    refetchInterval: 15000, // refresh every 15 seconds for live feel
    staleTime: 10000,
  });
};
