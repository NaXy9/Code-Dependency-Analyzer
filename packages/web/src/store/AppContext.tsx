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

interface AppState {
  projects: Project[];
  currentProjectId: string | null;
  currentProjectPath: string | null;
  selectedNode: string | null;
  sidebarExpanded: boolean;
}

interface AppActions {
  addProject: (path: string) => Project;
  removeProject: (id: string) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  setCurrentProject: (id: string | null) => void;
  setSelectedNode: (id: string | null) => void;
  toggleSelectedNode: (id: string) => void;
  toggleSidebar: () => void;
}

type AppContextValue = AppState & AppActions;

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const currentProject = projects.find((p) => p.id === currentProjectId) ?? null;
  const currentProjectPath = currentProject?.path ?? null;

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  const addProject = useCallback((path: string): Project => {
    const p = makeProject(path);
    setProjects((prev) => [...prev, p]);
    return p;
  }, []);

  const removeProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
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
        currentProjectPath,
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
