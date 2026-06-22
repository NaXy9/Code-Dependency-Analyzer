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
  /** Upload a .zip archive for analysis. Browser sets Content-Type + boundary automatically. */
  analyze: (file: File) => {
    const body = new FormData();
    body.append('archive', file);
    return request<AnalyzeSummary>(`${BASE}/analyze`, { method: 'POST', body });
  },

  graph:   () => request<GraphResponse>(`${BASE}/graph`),
  cycles:  () => request<string[][]>(`${BASE}/cycles`),
  impact:  (file: string) => request<ImpactResponse>(`${BASE}/impact?file=${encodeURIComponent(file)}`),
  metrics: (topN = 15)    => request<MetricsResponse>(`${BASE}/metrics?topN=${topN}`),
};
