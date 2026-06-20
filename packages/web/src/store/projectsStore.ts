import type { AnalyzeSummary } from '../types';

export interface Project {
  id: string;
  path: string;
  name: string;
  summary: AnalyzeSummary | null;
  lastAnalyzed: string | null;
}

const STORAGE_KEY = 'cda:projects';

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Project[]) : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // quota or private browsing — silently skip
  }
}

export function makeProject(path: string): Project {
  const name = path.replace(/\\/g, '/').split('/').filter(Boolean).at(-1) ?? path;
  return {
    id: crypto.randomUUID(),
    path,
    name,
    summary: null,
    lastAnalyzed: null,
  };
}
