import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function useGraph(projectKey: string | null) {
  return useQuery({
    queryKey: ['graph', projectKey],
    queryFn: api.graph,
    enabled: !!projectKey,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useCycles(projectKey: string | null) {
  return useQuery({
    queryKey: ['cycles', projectKey],
    queryFn: api.cycles,
    enabled: !!projectKey,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useMetrics(projectKey: string | null, topN = 15) {
  return useQuery({
    queryKey: ['metrics', projectKey, topN],
    queryFn: () => api.metrics(topN),
    enabled: !!projectKey,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useImpact(projectKey: string | null, file: string | null) {
  return useQuery({
    queryKey: ['impact', projectKey, file],
    queryFn: () => api.impact(file!),
    enabled: !!projectKey && file !== null,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
