import { useMetrics } from '../../hooks';
import type { MetricEntry } from '../../types';

export function MetricsPanel() {
  const { data, isLoading, error } = useMetrics(15);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="font-mono text-sm text-zinc-500 animate-pulse">
          COMPUTING_METRICS...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="font-mono text-sm text-orange-500">
          ERROR: {(error as Error).message}
        </span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto px-6 py-5">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <MetricTable
          title="TOP_FAN_IN"
          subtitle="most imported — high coupling risk"
          entries={data?.topByFanIn ?? []}
          metricKey="fanIn"
          accentColor="#6366f1"
        />
        <MetricTable
          title="TOP_FAN_OUT"
          subtitle="most dependencies — refactor candidates"
          entries={data?.topByFanOut ?? []}
          metricKey="fanOut"
          accentColor="#f59e0b"
        />
      </div>
    </div>
  );
}

function MetricTable({
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
    <div className="border border-zinc-800/80 rounded bg-[#0f0f17] overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800/60">
        <div className="font-mono text-xs text-zinc-300 uppercase tracking-widest">
          {title}
        </div>
        <div className="font-mono text-[10px] text-zinc-700 mt-0.5">{subtitle}</div>
      </div>

      {entries.length === 0 ? (
        <div className="px-4 py-6 font-mono text-[11px] text-zinc-700 text-center">
          NO_DATA
        </div>
      ) : (
        <ul className="divide-y divide-zinc-800/40">
          {entries.map((entry, i) => {
            const val = entry[metricKey];
            const pct = (val / max) * 100;
            const filename = entry.filePath.split('/').pop() ?? entry.filePath;
            const dir = entry.filePath.includes('/')
              ? entry.filePath.slice(0, entry.filePath.lastIndexOf('/') + 1)
              : '';

            return (
              <li
                key={entry.filePath}
                className="px-4 py-2.5 hover:bg-zinc-800/20 transition-colors"
              >
                <div className="flex items-baseline justify-between gap-3 mb-1.5">
                  <div className="flex items-baseline gap-1.5 overflow-hidden">
                    <span
                      className="font-mono text-[10px] flex-shrink-0"
                      style={{ color: `${accentColor}60` }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      className="font-mono text-[11px] truncate"
                      title={entry.filePath}
                    >
                      <span className="text-zinc-600">{dir}</span>
                      <span className="text-zinc-300">{filename}</span>
                    </span>
                  </div>
                  <span
                    className="font-mono text-sm flex-shrink-0 tabular-nums"
                    style={{ color: accentColor }}
                  >
                    {val}
                  </span>
                </div>
                <div className="h-px bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: accentColor, opacity: 0.7 }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
