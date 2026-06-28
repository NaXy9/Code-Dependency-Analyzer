import type { AnalyzeSummary } from '../types';

export interface Project {
  id: string;
  name: string;         // display name (zip filename without extension)
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

/**
 * @param id  Optional pre-generated UUID. Pass this when the ID was sent to the
 *            API before the project was created in the store (new upload flow),
 *            so that the frontend and backend share the same identifier.
 */
export function makeProject(
  fileName: string,
  summary: AnalyzeSummary,
  id?: string
): Project {
  return {
    id: id ?? crypto.randomUUID(),
    name: fileName.replace(/\.zip$/i, ''),
    fileName,
    summary,
    lastAnalyzed: new Date().toISOString(),
  };
}
