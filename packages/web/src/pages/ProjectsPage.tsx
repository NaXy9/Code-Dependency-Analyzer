import { useLocation } from 'wouter';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { ProjectCard } from '../components/ProjectCard';
import { CreateProjectDialog } from '../components/CreateProjectDialog';
import { useApp } from '../store/AppContext';

export function ProjectsPage() {
  const { projects, addProject, setCurrentProject } = useApp();
  const [, navigate] = useLocation();

  const handleOpen = (projectId: string) => {
    setCurrentProject(projectId);
    navigate(`/project/${projectId}`);
  };

  return (
    <AppShell>
      <TopBar
        title="PROJECT_INDEX"
        subtitle={
          projects.length > 0
            ? `${projects.length} project${projects.length !== 1 ? 's' : ''}`
            : undefined
        }
        actions={<CreateProjectDialog onAdd={(path) => addProject(path)} />}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {projects.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpen={() => handleOpen(project.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center h-64 rounded-lg"
      style={{ border: '1px dashed rgba(99,102,241,0.15)' }}
    >
      <div
        className="font-mono text-[10px] uppercase tracking-widest mb-2"
        style={{ color: '#6b7280' }}
      >
        NO_PROJECTS
      </div>
      <div className="font-mono text-[11px]" style={{ color: '#374151' }}>
        click ADD_PROJECT to get started
      </div>
    </div>
  );
}
