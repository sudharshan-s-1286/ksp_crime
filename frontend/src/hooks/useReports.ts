import { useQuery } from '@tanstack/react-query';
import { fetchReports } from '../services/api';
import type { Report } from '../types';

export const useReports = () => {
  return useQuery<Report[], Error>({
    queryKey: ['reportsList'],
    queryFn: fetchReports,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
};
