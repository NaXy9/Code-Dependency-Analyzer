import type { AnalyzeSummary } from '../types';

export interface Project {
  id: string;
  name: string;         // zip filename without extension — display name
  fileName: string;     // original zip filename e.g. "my-project.zip"
  summary: AnalyzeSummary;
  lastAnalyzed: string; // ISO date
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
    // quota or private browsing
  }
}

export function makeProject(fileName: string, summary: AnalyzeSummary): Project {
  return {
    id: crypto.randomUUID(),
    name: fileName.replace(/\.zip$/i, ''),
    fileName,
    summary,
    lastAnalyzed: new Date().toISOString(),
  };
}
