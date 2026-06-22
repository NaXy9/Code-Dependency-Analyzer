import { useState } from 'react';
import { useLocation } from 'wouter';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { ProjectCard } from '../components/ProjectCard';
import { UploadArchiveDialog } from '../components/UploadArchiveDialog';
import { useApp } from '../store/AppContext';

export function ProjectsPage() {
  const { projects, setCurrentProject } = useApp();
  const [, navigate] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDone = (projectId: string) => {
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
        actions={
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-1.5 font-mono text-xs tracking-widest h-8 px-3 rounded border transition-colors"
            style={{
              borderColor: 'rgba(99,102,241,0.3)',
              color: '#6366f1',
              background: 'rgba(99,102,241,0.06)',
            }}
          >
            + UPLOAD_ARCHIVE
          </button>
        }
      />

      <UploadArchiveDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onDone={handleDone}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {projects.length === 0 ? (
            <EmptyState onUpload={() => setDialogOpen(true)} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <button
      onClick={onUpload}
      className="w-full flex flex-col items-center justify-center h-64 rounded-lg transition-colors hover:border-indigo-500/25"
      style={{ border: '1px dashed rgba(99,102,241,0.15)' }}
    >
      <div
        className="font-mono text-[10px] uppercase tracking-widest mb-2"
        style={{ color: '#6b7280' }}
      >
        NO_PROJECTS
      </div>
      <div className="font-mono text-[11px]" style={{ color: '#374151' }}>
        click to upload a .zip archive
      </div>
    </button>
  );
}
