import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { AnimatePresence } from 'framer-motion';
import { ChevronLeft, GitBranch, RefreshCw, BarChart2 } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { GraphCanvas } from '../components/graph/GraphCanvas';
import { DetailPanel } from '../components/panels/DetailPanel';
import { CyclesPanel } from '../components/panels/CyclesPanel';
import { StatsPanel } from '../components/panels/StatsPanel';
import { UploadArchiveDialog } from '../components/UploadArchiveDialog';
import { useApp } from '../store/AppContext';
import { useGraph } from '../hooks';

type ActiveTab = 'graph' | 'cycles' | 'stats';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { projects, setCurrentProject, selectedNode, setSelectedNode, currentProjectKey } = useApp();
  const [activeTab, setActiveTab] = useState<ActiveTab>('graph');
  const [reanalyzeOpen, setReanalyzeOpen] = useState(false);

  const project = projects.find((p) => p.id === id) ?? null;

  useEffect(() => {
    if (id) setCurrentProject(id);
  }, [id, setCurrentProject]);

  useEffect(() => {
    if (!project) navigate('/');
  }, [project, navigate]);

  useEffect(() => {
    if (activeTab !== 'graph') setSelectedNode(null);
  }, [activeTab, setSelectedNode]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedNode(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setSelectedNode]);

  // Auto-open the re-upload dialog when the server has no data for this project.
  // This is a safety net for cases where the persistence file is missing
  const { error: graphError } = useGraph(currentProjectKey);
  useEffect(() => {
    if (graphError && (graphError as Error).message.includes('No analysis available')) {
      setReanalyzeOpen(true);
    }
  }, [graphError]);

  if (!project) return null;

  const { name, summary } = project;
  const framework = summary.framework ?? 'zip';

  return (
    <AppShell>
      {/* ── Header ── */}
      <header className="flex-none px-6 py-4 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="font-mono text-xl font-bold text-white/90 flex items-center gap-3">
              {name}
              <span className="font-mono text-xs px-2 py-0.5 rounded border border-violet-500/30 bg-violet-500/10 text-violet-400">
                {framework}
              </span>
            </h1>
            <div className="flex items-center gap-4 mt-1 font-mono text-xs text-white/40">
              <span>NODES: {summary.fileCount}</span>
              <span>EDGES: {summary.edgeCount}</span>
              <span className={summary.cycleCount > 0 ? 'text-orange-400' : 'text-green-400'}>
                CYCLES: {summary.cycleCount}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setReanalyzeOpen(true)}
          className="font-mono text-xs tracking-widest px-3 py-1.5 rounded border border-white/10 text-white/40 hover:text-violet-400 hover:border-violet-500/30 hover:bg-violet-500/10 transition-colors cursor-pointer"
        >
          REANALYZE
        </button>
      </header>

      {/* ── Tab bar ── */}
      <div className="flex-none px-6 pt-4 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-t font-mono text-xs transition-colors cursor-pointer ${
              activeTab === 'graph'
                ? 'bg-violet-500/20 text-violet-400 border border-violet-500/20 border-b-0'
                : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
            }`}
          >
            <GitBranch size={13} /> DEPENDENCY_GRAPH
          </button>
          <button
            onClick={() => setActiveTab('cycles')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-t font-mono text-xs transition-colors cursor-pointer ${
              activeTab === 'cycles'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20 border-b-0'
                : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
            }`}
          >
            <RefreshCw size={13} /> CYCLES ({summary.cycleCount})
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-t font-mono text-xs transition-colors cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-violet-500/20 text-violet-400 border border-violet-500/20 border-b-0'
                : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
            }`}
          >
            <BarChart2 size={13} /> STATISTICS
          </button>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'graph' && (
          <div className="flex-1 relative overflow-hidden">
            <GraphCanvas />
            <AnimatePresence>
              {selectedNode && <DetailPanel key={selectedNode} />}
            </AnimatePresence>
          </div>
        )}
        {activeTab === 'cycles' && (
          <div className="flex-1 overflow-auto">
            <CyclesPanel />
          </div>
        )}
        {activeTab === 'stats' && (
          <div className="flex-1 overflow-auto">
            <StatsPanel />
          </div>
        )}
      </div>

      <UploadArchiveDialog
        open={reanalyzeOpen}
        onOpenChange={setReanalyzeOpen}
        projectId={id}
        onDone={() => setReanalyzeOpen(false)}
      />
    </AppShell>
  );
}
