import { useQuery } from '@tanstack/react-query';
import { fetchCrimeDatabase } from '../services/api';
import type { CrimeRecord } from '../types';

interface Filters {
  search?: string;
  type?: string;
  district?: string;
  page?: number;
  limit?: number;
}

export const useCrimeDatabase = (filters: Filters) => {
  return useQuery<{ records: CrimeRecord[]; total: number }, Error>({
    queryKey: ['crimes', filters],
    queryFn: () => fetchCrimeDatabase(filters),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
};
