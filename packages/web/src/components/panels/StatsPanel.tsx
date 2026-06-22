import { useMemo } from 'react';
import { FileCode2, GitBranch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useGraph, useCycles } from '../../hooks';
import { useApp } from '../../store/AppContext';
import { detectNodeType, NODE_COLORS, type NodeType } from '../../lib/nodeType';

const TYPE_ORDER: NodeType[] = ['component', 'hook', 'util', 'store', 'page', 'module'];

export function StatsPanel() {
  const { currentProjectKey } = useApp();
  const { data: graphData, isLoading } = useGraph(currentProjectKey);
  const { data: cycles } = useCycles(currentProjectKey);

  const totalFiles = graphData?.nodes.length ?? 0;
  const totalDependencies = graphData?.edges.length ?? 0;
  const avgDependenciesPerFile = totalFiles > 0 ? totalDependencies / totalFiles : 0;
  const circularDepsCount = cycles?.length ?? 0;

  const typeBreakdown = useMemo(() => {
    const counts = new Map<NodeType, number>();
    for (const node of graphData?.nodes ?? []) {
      const t = detectNodeType(node.id);
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return TYPE_ORDER
      .map((type) => ({ type, color: NODE_COLORS[type], count: counts.get(type) ?? 0 }))
      .filter(({ count }) => count > 0);
  }, [graphData]);

  const topByFanIn  = useMemo(() => [...(graphData?.nodes ?? [])].sort((a, b) => b.fanIn - a.fanIn).slice(0, 5),  [graphData]);
  const topByFanOut = useMemo(() => [...(graphData?.nodes ?? [])].sort((a, b) => b.fanOut - a.fanOut).slice(0, 5), [graphData]);

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center"><span className="font-mono text-sm text-muted-foreground animate-pulse">COMPUTING_STATS...</span></div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* 4 summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard label="TOTAL_FILES"       value={totalFiles} />
        <SummaryCard label="TOTAL_DEPS"        value={totalDependencies} />
        <SummaryCard label="AVG_DEPS_PER_FILE" value={avgDependenciesPerFile.toFixed(1)} />
        <SummaryCard label="CIRCULAR_DEPS"     value={circularDepsCount}
          valueColor={circularDepsCount > 0 ? 'text-red-500' : 'text-green-500'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* TYPE_BREAKDOWN */}
        <div className="space-y-4">
          <SectionHeader icon={<FileCode2 size={13} />} label="TYPE_BREAKDOWN" />
          <div className="space-y-3">
            {typeBreakdown.map(({ type, color, count }) => {
              const pct = totalFiles > 0 ? (count / totalFiles) * 100 : 0;
              return (
                <div key={type}>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="font-mono text-xs uppercase text-foreground">{type}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{count}&nbsp;·&nbsp;{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MOST_IMPORTED + MOST_DEPENDENT */}
        <div className="space-y-5">
          <div className="space-y-2">
            <SectionHeader icon={<GitBranch size={13} />} label="MOST_IMPORTED (TOP 5)" />
            {topByFanIn.length === 0 ? <Empty /> : (
              <ul className="space-y-1.5">
                {topByFanIn.map((n) => <FileRow key={n.id} filePath={n.id} badge={`${n.fanIn} IMPORTS`} />)}
              </ul>
            )}
          </div>
          <div className="space-y-2">
            <SectionHeader icon={<GitBranch size={13} style={{ transform: 'rotate(180deg)' }} />} label="MOST_DEPENDENT (TOP 5)" />
            {topByFanOut.length === 0 ? <Empty /> : (
              <ul className="space-y-1.5">
                {topByFanOut.map((n) => <FileRow key={n.id} filePath={n.id} badge={`${n.fanOut} DEPS`} />)}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, valueColor = 'text-foreground' }: { label: string; value: string | number; valueColor?: string }) {
  return (
    <div className="bg-card/30 border border-border/50 rounded-lg p-4">
      <div className="font-mono text-[10px] text-muted-foreground tracking-wider mb-2">{label}</div>
      <div className={`font-mono text-2xl font-light tabular-nums ${valueColor}`}>{value}</div>
    </div>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-border/50">
      <span className="text-muted-foreground">{icon}</span>
      <span className="font-mono text-sm font-bold text-muted-foreground tracking-wider">{label}</span>
    </div>
  );
}

function FileRow({ filePath, badge }: { filePath: string; badge: string }) {
  const filename = filePath.replace(/\\/g, '/').split('/').pop() ?? filePath;
  return (
    <li className="flex items-center justify-between gap-3 p-2 bg-card/30 border border-border/50 rounded">
      <span className="font-mono text-xs truncate text-foreground" title={filePath}>{filename}</span>
      <Badge variant="outline" className="font-mono text-[10px] flex-shrink-0 border-border/50">{badge}</Badge>
    </li>
  );
}

function Empty() {
  return <p className="font-mono text-[11px] text-muted-foreground italic">— no data</p>;
}
