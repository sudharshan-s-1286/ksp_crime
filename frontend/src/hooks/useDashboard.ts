import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats } from '../services/api';
import type { DashboardStats } from '../types';

export const useDashboard = () => {
  return useQuery<DashboardStats, Error>({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
    staleTime: 60000, // 1 minute stale time
    refetchOnWindowFocus: false,
  });
};
