import { useMemo } from 'react';
import { FileCode2, GitBranch } from 'lucide-react';
import { useGraph, useCycles } from '../../hooks';
import { useApp } from '../../store/AppContext';
import { detectNodeType, type NodeType } from '../../lib/nodeType';

const TYPE_COLORS: Record<string, string> = {
  component: '#6366f1',
  hook:      '#8b5cf6',
  util:      '#22c55e',
  store:     '#f59e0b',
  page:      '#ec4899',
  module:    '#06b6d4',
  other:     '#6b7280',
};

const TYPE_ORDER: NodeType[] = ['component', 'hook', 'util', 'store', 'page', 'module'];

export function StatsPanel() {
  const { currentProjectKey } = useApp();
  const { data: graphData, isLoading } = useGraph(currentProjectKey);
  const { data: cycles } = useCycles(currentProjectKey);

  const stats = useMemo(() => {
    const nodes = graphData?.nodes ?? [];
    const edges = graphData?.edges ?? [];

    const totalFiles = nodes.length;
    const totalDependencies = edges.length;
    const avgDependenciesPerFile = totalFiles > 0 ? totalDependencies / totalFiles : 0;
    const circularDepsCount = cycles?.length ?? 0;

    // TYPE_BREAKDOWN
    const typeCounts = new Map<string, number>();
    for (const node of nodes) {
      const t = detectNodeType(node.id);
      typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
    }
    const filesByType = TYPE_ORDER
      .map((type) => ({ type, count: typeCounts.get(type) ?? 0 }))
      .filter(({ count }) => count > 0);

    // MOST_IMPORTED — highest fanIn
    const mostImportedFiles = [...nodes]
      .sort((a, b) => b.fanIn - a.fanIn)
      .slice(0, 5)
      .map((n) => ({ path: n.id, count: n.fanIn }));

    // MOST_DEPENDENT — highest fanOut
    const mostImportingFiles = [...nodes]
      .sort((a, b) => b.fanOut - a.fanOut)
      .slice(0, 5)
      .map((n) => ({ path: n.id, count: n.fanOut }));

    return {
      totalFiles,
      totalDependencies,
      avgDependenciesPerFile,
      circularDepsCount,
      filesByType,
      mostImportedFiles,
      mostImportingFiles,
    };
  }, [graphData, cycles]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="font-mono text-sm text-white/40 animate-pulse">
          COMPUTING_STATS...
        </span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* ── 4 summary cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

        <div className="p-4 rounded-lg border border-white/[0.08] bg-white/[0.03] flex flex-col">
          <span className="font-mono text-[10px] text-white/40 mb-2 tracking-widest">
            TOTAL_FILES
          </span>
          <span className="font-mono text-2xl font-light text-white/90">
            {stats.totalFiles}
          </span>
        </div>

        <div className="p-4 rounded-lg border border-white/[0.08] bg-white/[0.03] flex flex-col">
          <span className="font-mono text-[10px] text-white/40 mb-2 tracking-widest">
            TOTAL_DEPS
          </span>
          <span className="font-mono text-2xl font-light text-white/90">
            {stats.totalDependencies}
          </span>
        </div>

        <div className="p-4 rounded-lg border border-white/[0.08] bg-white/[0.03] flex flex-col">
          <span className="font-mono text-[10px] text-white/40 mb-2 tracking-widest">
            AVG_DEPS_PER_FILE
          </span>
          <span className="font-mono text-2xl font-light text-white/90">
            {stats.avgDependenciesPerFile.toFixed(1)}
          </span>
        </div>

        <div className="p-4 rounded-lg border border-white/[0.08] bg-white/[0.03] flex flex-col">
          <span className="font-mono text-[10px] text-white/40 mb-2 tracking-widest">
            CIRCULAR_DEPS
          </span>
          <span className={`font-mono text-2xl font-light ${
            stats.circularDepsCount > 0 ? 'text-orange-400' : 'text-green-400'
          }`}>
            {stats.circularDepsCount}
          </span>
        </div>

      </div>

      {/* ── Two-column section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* TYPE_BREAKDOWN */}
        <div className="space-y-4">
          <h3 className="font-mono text-xs font-bold text-white/40 tracking-widest flex items-center gap-2 border-b border-white/[0.06] pb-2">
            <FileCode2 size={14} /> TYPE_BREAKDOWN
          </h3>

          <div className="space-y-3">
            {stats.filesByType.map(({ type, count }) => {
              const color = TYPE_COLORS[type] ?? TYPE_COLORS.other;
              const pct = stats.totalFiles > 0
                ? Math.round((count / stats.totalFiles) * 100)
                : 0;
              return (
                <div key={type} className="space-y-1.5">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-white/70 uppercase">{type}</span>
                    <span className="text-white/40">{count} · {pct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MOST_IMPORTED + MOST_DEPENDENT */}
        <div className="space-y-8">

          {/* MOST_IMPORTED */}
          <div className="space-y-3">
            <h3 className="font-mono text-xs font-bold text-white/40 tracking-widest flex items-center gap-2 border-b border-white/[0.06] pb-2">
              <GitBranch size={14} /> MOST_IMPORTED (TOP 5)
            </h3>
            <div className="space-y-2">
              {stats.mostImportedFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded border border-white/[0.06] bg-white/[0.02]">
                  <span className="font-mono text-xs text-white/70 truncate mr-3" title={f.path}>
                    {f.path.replace(/\\/g, '/').split('/').pop()}
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.04] text-white/50 whitespace-nowrap shrink-0">
                    {f.count} IMPORTS
                  </span>
                </div>
              ))}
              {stats.mostImportedFiles.length === 0 && (
                <p className="font-mono text-[11px] text-white/20 italic">— no data</p>
              )}
            </div>
          </div>

          {/* MOST_DEPENDENT */}
          <div className="space-y-3">
            <h3 className="font-mono text-xs font-bold text-white/40 tracking-widest flex items-center gap-2 border-b border-white/[0.06] pb-2">
              <GitBranch size={14} style={{ transform: 'rotate(180deg)' }} /> MOST_DEPENDENT (TOP 5)
            </h3>
            <div className="space-y-2">
              {stats.mostImportingFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded border border-white/[0.06] bg-white/[0.02]">
                  <span className="font-mono text-xs text-white/70 truncate mr-3" title={f.path}>
                    {f.path.replace(/\\/g, '/').split('/').pop()}
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.04] text-white/50 whitespace-nowrap shrink-0">
                    {f.count} DEPS
                  </span>
                </div>
              ))}
              {stats.mostImportingFiles.length === 0 && (
                <p className="font-mono text-[11px] text-white/20 italic">— no data</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
