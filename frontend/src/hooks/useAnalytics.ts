import { useQuery } from '@tanstack/react-query';
import { fetchAnalytics } from '../services/api';
import type { AnalyticsData } from '../types';

export const useAnalytics = () => {
  return useQuery<AnalyticsData, Error>({
    queryKey: ['analyticsData'],
    queryFn: fetchAnalytics,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
};
