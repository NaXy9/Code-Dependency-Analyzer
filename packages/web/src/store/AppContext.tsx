import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import {
  loadProjects,
  saveProjects,
  makeProject,
  type Project,
} from './projectsStore';
import type { AnalyzeSummary, ProjectMetadataDTO } from '../types';
import { api } from '../api/client';

interface AppState {
  projects: Project[];
  currentProjectId: string | null;
  currentProjectKey: string | null;
  selectedNode: string | null;
  sidebarExpanded: boolean;
}

interface AppActions {
  addProject: (fileName: string, summary: AnalyzeSummary, id?: string) => Project;
  removeProject: (id: string) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  setCurrentProject: (id: string | null) => void;
  setSelectedNode: (id: string | null) => void;
  toggleSelectedNode: (id: string) => void;
  toggleSidebar: () => void;
}

type AppContextValue = AppState & AppActions;

const AppContext = createContext<AppContextValue | null>(null);

function dtoToProject(dto: ProjectMetadataDTO): Project {
  return {
    id: dto.id,
    name: dto.name,
    fileName: dto.fileName,
    summary: dto.summary,
    lastAnalyzed: dto.lastAnalyzed,
  };
}

function mergeProjects(serverProjects: Project[], localProjects: Project[]): Project[] {
  const byId = new Map<string, Project>();
  for (const p of serverProjects) byId.set(p.id, p);
  for (const p of localProjects) {
    if (!byId.has(p.id)) byId.set(p.id, p);
  }
  return Array.from(byId.values());
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const currentProjectKey = currentProjectId;

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  useEffect(() => {
    let cancelled = false;

    api.projects()
      .then((dtos) => {
        if (cancelled) return;
        const serverProjects = dtos.map(dtoToProject);
        setProjects((prev) => mergeProjects(serverProjects, prev));
      })
      .catch((err) => {
        console.warn('[projects] Failed to sync project list from server:', err);
      });

    return () => { cancelled = true; };
  }, []);

  const addProject = useCallback(
    (fileName: string, summary: AnalyzeSummary, id?: string): Project => {
      const p = makeProject(fileName, summary, id);
      setProjects((prev) => [...prev, p]);
      return p;
    },
    []
  );

  const removeProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    // Clean up the server-side store and persisted JSON file
    api.deleteProject(id).catch(() => {});
  }, []);

  const updateProject = useCallback((id: string, patch: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  }, []);

  const setCurrentProject = useCallback((id: string | null) => {
    setCurrentProjectId(id);
    setSelectedNode(null);
  }, []);

  const toggleSelectedNode = useCallback((id: string) => {
    setSelectedNode((prev) => (prev === id ? null : id));
  }, []);

  const toggleSidebar = useCallback(() => setSidebarExpanded((v) => !v), []);

  return (
    <AppContext.Provider
      value={{
        projects,
        currentProjectId,
        currentProjectKey,
        selectedNode,
        sidebarExpanded,
        addProject,
        removeProject,
        updateProject,
        setCurrentProject,
        setSelectedNode,
        toggleSelectedNode,
        toggleSidebar,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
