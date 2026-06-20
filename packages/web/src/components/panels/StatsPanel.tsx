import { useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useMetrics, useGraph } from '../../hooks';
import { useApp } from '../../store/AppContext';
import type { MetricEntry } from '../../types';

export function StatsPanel() {
  const { currentProjectPath } = useApp();
  const { data: metrics, isLoading: metricsLoading } = useMetrics(currentProjectPath, 12);
  const { data: graphData } = useGraph(currentProjectPath);

  const fileTypes = useMemo(() => {
    if (!graphData) return [];
    const counts = new Map<string, number>();
    for (const node of graphData.nodes) {
      const ext = node.id.includes('.')
        ? '.' + node.id.split('.').at(-1)!
        : 'no-ext';
      counts.set(ext, (counts.get(ext) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([ext, count]) => ({ ext, count }));
  }, [graphData]);

  const totalFiles = graphData?.nodes.length ?? 0;

  if (metricsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="font-mono text-sm animate-pulse" style={{ color: '#6b7280' }}>
          COMPUTING_STATS...
        </span>
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-5 max-w-5xl mx-auto">
      {/* TOP_FAN_IN */}
      <MetricCard
        title="TOP_FAN_IN"
        subtitle="most imported — high coupling risk"
        entries={metrics?.topByFanIn ?? []}
        metricKey="fanIn"
        accentColor="#6366f1"
      />

      {/* TOP_FAN_OUT */}
      <MetricCard
        title="TOP_FAN_OUT"
        subtitle="most dependencies — refactor candidates"
        entries={metrics?.topByFanOut ?? []}
        metricKey="fanOut"
        accentColor="#f59e0b"
      />

      {/* FILE_TYPES */}
      {fileTypes.length > 0 && (
        <Card
          className="xl:col-span-2"
          style={{ background: '#0f0f1a', border: '1px solid rgba(99,102,241,0.12)' }}
        >
          <CardHeader className="pb-0">
            <SectionTitle title="FILE_TYPES" subtitle={`${totalFiles} files total`} />
          </CardHeader>
          <CardContent className="pt-3">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {fileTypes.map(({ ext, count }) => {
                const pct = totalFiles > 0 ? (count / totalFiles) * 100 : 0;
                return (
                  <div
                    key={ext}
                    className="rounded p-3"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(99,102,241,0.08)',
                    }}
                  >
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="font-mono text-xs" style={{ color: '#e2e8f0' }}>
                        {ext}
                      </span>
                      <span className="font-mono text-sm tabular-nums" style={{ color: '#6366f1' }}>
                        {count}
                      </span>
                    </div>
                    <div className="h-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: '#6366f1', opacity: 0.6 }}
                      />
                    </div>
                    <div className="font-mono text-[10px] mt-1" style={{ color: '#6b7280' }}>
                      {pct.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricCard({
  title,
  subtitle,
  entries,
  metricKey,
  accentColor,
}: {
  title: string;
  subtitle: string;
  entries: MetricEntry[];
  metricKey: 'fanIn' | 'fanOut';
  accentColor: string;
}) {
  const max = Math.max(...entries.map((e) => e[metricKey]), 1);

  return (
    <Card style={{ background: '#0f0f1a', border: '1px solid rgba(99,102,241,0.12)' }}>
      <CardHeader className="pb-0">
        <SectionTitle title={title} subtitle={subtitle} />
      </CardHeader>
      <CardContent className="pt-3">
        {entries.length === 0 ? (
          <div className="font-mono text-[11px] text-center py-4" style={{ color: '#374151' }}>
            NO_DATA
          </div>
        ) : (
          <ul className="space-y-2.5">
            {entries.map((entry, i) => {
              const val = entry[metricKey];
              const pct = (val / max) * 100;
              const filename = entry.filePath.split('/').pop() ?? entry.filePath;
              const dir = entry.filePath.includes('/')
                ? entry.filePath.slice(0, entry.filePath.lastIndexOf('/') + 1)
                : '';

              return (
                <li key={entry.filePath}>
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <div className="flex items-baseline gap-1.5 overflow-hidden">
                      <span
                        className="font-mono text-[10px] flex-shrink-0 tabular-nums"
                        style={{ color: `${accentColor}50` }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span
                        className="font-mono text-[11px] truncate"
                        title={entry.filePath}
                      >
                        <span style={{ color: '#374151' }}>{dir}</span>
                        <span style={{ color: '#e2e8f0' }}>{filename}</span>
                      </span>
                    </div>
                    <span
                      className="font-mono text-sm flex-shrink-0 tabular-nums"
                      style={{ color: accentColor }}
                    >
                      {val}
                    </span>
                  </div>
                  <div className="h-px rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: accentColor, opacity: 0.55 }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <div className="font-mono text-xs uppercase tracking-widest" style={{ color: '#e2e8f0' }}>
        {title}
      </div>
      <div className="font-mono text-[10px] mt-0.5" style={{ color: '#6b7280' }}>
        {subtitle}
      </div>
    </div>
  );
}
