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
  analyze: (projectPath: string) =>
    request<AnalyzeSummary>(`${BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectPath }),
    }),

  graph: () => request<GraphResponse>(`${BASE}/graph`),

  cycles: () => request<string[][]>(`${BASE}/cycles`),

  impact: (file: string) =>
    request<ImpactResponse>(`${BASE}/impact?file=${encodeURIComponent(file)}`),

  metrics: (topN = 10) =>
    request<MetricsResponse>(`${BASE}/metrics?topN=${topN}`),
};
