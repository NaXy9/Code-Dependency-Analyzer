import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

/**
 * projectPath is part of the query key so each project has its own cache slot.
 * The API itself is stateless and just returns the latest analysis — the key
 * controls when we consider the cached data valid vs stale.
 */

export function useGraph(projectPath: string | null) {
  return useQuery({
    queryKey: ['graph', projectPath],
    queryFn: api.graph,
    enabled: !!projectPath,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useCycles(projectPath: string | null) {
  return useQuery({
    queryKey: ['cycles', projectPath],
    queryFn: api.cycles,
    enabled: !!projectPath,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useMetrics(projectPath: string | null, topN = 15) {
  return useQuery({
    queryKey: ['metrics', projectPath, topN],
    queryFn: () => api.metrics(topN),
    enabled: !!projectPath,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useImpact(projectPath: string | null, file: string | null) {
  return useQuery({
    queryKey: ['impact', projectPath, file],
    queryFn: () => api.impact(file!),
    enabled: !!projectPath && file !== null,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
