import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '../store/AppContext';
import { Header } from '../components/layout/Header';
import { GraphCanvas } from '../components/graph/GraphCanvas';
import { CyclesPanel } from '../components/panels/CyclesPanel';
import { MetricsPanel } from '../components/panels/MetricsPanel';
import { DetailPanel } from '../components/panels/DetailPanel';

export function DashboardPage() {
  const { summary, activeTab, selectedNode, setSelectedNode } = useApp();
  const [, navigate] = useLocation();

  // Guard: if someone lands here without an analysis, send back to setup
  useEffect(() => {
    if (!summary) navigate('/');
  }, [summary, navigate]);

  // Close detail panel when switching away from graph tab
  useEffect(() => {
    if (activeTab !== 'graph') setSelectedNode(null);
  }, [activeTab, setSelectedNode]);

  // ESC to deselect
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedNode(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setSelectedNode]);

  if (!summary) return null;

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        background: '#0a0a0f',
        backgroundImage: `
          repeating-linear-gradient(0deg,  transparent, transparent 39px, rgba(99,102,241,0.03) 39px, rgba(99,102,241,0.03) 40px),
          repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(99,102,241,0.03) 39px, rgba(99,102,241,0.03) 40px)
        `,
      }}
    >
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'graph' && <GraphCanvas />}
          {activeTab === 'cycles' && <CyclesPanel />}
          {activeTab === 'metrics' && <MetricsPanel />}
        </main>

        {/* Detail panel only visible on graph tab with a node selected */}
        {activeTab === 'graph' && selectedNode && <DetailPanel />}
      </div>
    </div>
  );
}
