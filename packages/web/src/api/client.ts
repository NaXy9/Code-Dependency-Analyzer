import type {
  AnalyzeSummary,
  GraphResponse,
  ImpactResponse,
  MetricsResponse,
} from '../types';

const BASE = '/api';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  /**
   * Upload a .zip archive for analysis.
   * projectId must match the id stored in the frontend project list so that
   * the in-memory store and the persistence layer use the same key.
   */
  analyze: (file: File, projectId: string) => {
    const body = new FormData();
    body.append('archive', file);
    body.append('projectId', projectId);
    return request<AnalyzeSummary>(`${BASE}/analyze`, { method: 'POST', body });
  },

  graph:   (projectId: string) =>
    request<GraphResponse>(`${BASE}/graph?projectId=${encodeURIComponent(projectId)}`),

  cycles:  (projectId: string) =>
    request<string[][]>(`${BASE}/cycles?projectId=${encodeURIComponent(projectId)}`),

  metrics: (projectId: string, topN = 15) =>
    request<MetricsResponse>(`${BASE}/metrics?projectId=${encodeURIComponent(projectId)}&topN=${topN}`),

  impact:  (projectId: string, file: string) =>
    request<ImpactResponse>(
      `${BASE}/impact?projectId=${encodeURIComponent(projectId)}&file=${encodeURIComponent(file)}`
    ),

  /** Remove a project's analysis from the server store and disk. Best-effort. */
  deleteProject: (projectId: string) =>
    request<{ ok: boolean }>(`${BASE}/analyze/${encodeURIComponent(projectId)}`, {
      method: 'DELETE',
    }),
};
