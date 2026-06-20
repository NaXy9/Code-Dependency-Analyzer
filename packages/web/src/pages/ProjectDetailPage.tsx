import { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { GraphCanvas } from '../components/graph/GraphCanvas';
import { DetailPanel } from '../components/panels/DetailPanel';
import { CyclesPanel } from '../components/panels/CyclesPanel';
import { StatsPanel } from '../components/panels/StatsPanel';
import { useApp } from '../store/AppContext';
import { api } from '../api/client';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const {
    projects,
    setCurrentProject,
    updateProject,
    selectedNode,
    setSelectedNode,
  } = useApp();

  const queryClient = useQueryClient();
  const project = projects.find((p) => p.id === id) ?? null;

  useEffect(() => {
    if (id) setCurrentProject(id);
  }, [id, setCurrentProject]);

  // Guard: project doesn't exist in store
  useEffect(() => {
    if (!project) navigate('/');
  }, [project, navigate]);

  // ESC deselects node
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedNode(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setSelectedNode]);

  const reanalyzeMutation = useMutation({
    mutationFn: () => api.analyze(project!.path),
    onSuccess: (data) => {
      updateProject(id!, {
        summary: data,
        lastAnalyzed: new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ['graph', project!.path] });
      queryClient.invalidateQueries({ queryKey: ['cycles', project!.path] });
      queryClient.invalidateQueries({ queryKey: ['metrics', project!.path] });
    },
  });

  if (!project) return null;

  return (
    <AppShell>
      <TopBar
        title={project.name}
        subtitle={project.path}
        actions={
          <Button
            variant="outline"
            onClick={() => reanalyzeMutation.mutate()}
            disabled={reanalyzeMutation.isPending}
            className="font-mono text-[11px] tracking-widest h-8 px-3"
            style={{
              borderColor: 'rgba(99,102,241,0.3)',
              color: reanalyzeMutation.isPending ? '#6b7280' : '#6366f1',
              background: 'rgba(99,102,241,0.06)',
            }}
          >
            {reanalyzeMutation.isPending ? 'ANALYZING\u2026' : 'REANALYZE'}
          </Button>
        }
      />

      <Tabs
        defaultValue="graph"
        className="flex-1 flex flex-col overflow-hidden"
        onValueChange={() => setSelectedNode(null)}
      >
        {/* Tab strip */}
        <div
          className="flex-shrink-0 px-6"
          style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}
        >
          <TabsList className="h-10 gap-0 rounded-none bg-transparent p-0">
            {(['graph', 'cycles', 'stats'] as const).map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="
                  font-mono text-[11px] uppercase tracking-widest
                  rounded-none h-10 px-5 bg-transparent border-b-2
                  border-transparent text-zinc-600
                  data-[state=active]:border-indigo-500
                  data-[state=active]:text-indigo-400
                  data-[state=active]:bg-transparent
                  data-[state=active]:shadow-none
                  hover:text-zinc-400 transition-colors
                "
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* GRAPH */}
        <TabsContent
          value="graph"
          className="flex-1 flex overflow-hidden mt-0 data-[state=inactive]:hidden"
        >
          <GraphCanvas />
          <AnimatePresence>{selectedNode && <DetailPanel />}</AnimatePresence>
        </TabsContent>

        {/* CYCLES */}
        <TabsContent
          value="cycles"
          className="flex-1 overflow-auto mt-0 data-[state=inactive]:hidden"
        >
          <CyclesPanel />
        </TabsContent>

        {/* STATS */}
        <TabsContent
          value="stats"
          className="flex-1 overflow-auto mt-0 data-[state=inactive]:hidden"
        >
          <StatsPanel />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
