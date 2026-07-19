import { useQuery } from '@tanstack/react-query';
import { fetchCrimes } from '../services/api';
import type { NetworkNode, NetworkEdge } from '../types';

interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export const useCriminalNetwork = (suspectFilter?: string) => {
  return useQuery<NetworkData, Error>({
    queryKey: ['criminalNetwork', suspectFilter],
    queryFn: async () => {
      const crimes = await fetchCrimes({ search: suspectFilter || '', type: 'All', district: 'All', page: 1, limit: 100 });
      // Build a simple network graph from crimes data
      const nodesMap = new Map<string, NetworkNode>();
      const edges: NetworkEdge[] = [];

      let idx = 0;
      crimes.records.forEach((c) => {
        const positions = [
          { x: 300, y: 150 }, { x: 180, y: 110 }, { x: 420, y: 100 },
          { x: 300, y: 260 }, { x: 120, y: 220 }, { x: 420, y: 220 },
          { x: 180, y: 250 }, { x: 240, y: 200 }, { x: 360, y: 180 },
        ];
        if (!nodesMap.has(c.suspect_name)) {
          const pos = positions[idx % positions.length];
          nodesMap.set(c.suspect_name, {
            id: c.suspect_name.toLowerCase().replace(/\s+/g, '_'),
            label: c.suspect_name,
            type: 'Suspect',
            risk: c.case_status === 'Arrested' ? 'High' : c.case_status === 'Under Investigation' ? 'Medium' : 'Low',
            x: pos.x + (idx * 15),
            y: pos.y + (idx * 10),
            details: `${c.crime_type} — ${c.district}. ${c.modus_operandi}`,
          });
          idx++;
        }

        // District node
        const distId = c.district.toLowerCase().replace(/\s+/g, '_');
        if (!nodesMap.has(distId)) {
          const pos = positions[idx % positions.length];
          nodesMap.set(distId, {
            id: distId,
            label: c.district,
            type: 'Location',
            risk: 'Low',
            x: pos.x + (idx * 12),
            y: pos.y + (idx * 8),
            details: `Crime hotspot. ${c.crime_type} reported here.`,
          });
          idx++;
        }

        // Edge
        edges.push({
          from: c.suspect_name.toLowerCase().replace(/\s+/g, '_'),
          to: distId,
          label: c.crime_type,
          animated: c.case_status === 'Under Investigation',
        });
      });

      return { nodes: Array.from(nodesMap.values()), edges };
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
};
