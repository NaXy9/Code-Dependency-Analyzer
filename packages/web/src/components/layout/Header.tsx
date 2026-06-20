import { useApp, type ActiveTab } from '../../store/AppContext';

const TABS: { id: ActiveTab; label: string }[] = [
  { id: 'graph', label: 'GRAPH' },
  { id: 'cycles', label: 'CYCLES' },
  { id: 'metrics', label: 'METRICS' },
];

export function Header() {
  const { summary, activeTab, setActiveTab } = useApp();

  return (
    <header className="flex-shrink-0 h-12 flex items-center justify-between px-5 border-b border-zinc-800/80 bg-[#0f0f17]">
      {/* left: wordmark + stats */}
      <div className="flex items-center gap-5">
        <span className="font-mono text-xs text-zinc-400 uppercase tracking-[0.18em] select-none">
          CDA
        </span>

        {summary && (
          <div className="flex items-center gap-4">
            <Stat label="FILES" value={summary.fileCount} color="#6366f1" />
            <Stat label="EDGES" value={summary.edgeCount} color="#6366f1" />
            <Stat
              label="CYCLES"
              value={summary.cycleCount}
              color={summary.cycleCount > 0 ? '#f97316' : '#22c55e'}
            />
          </div>
        )}
      </div>

      {/* right: tabs */}
      <nav className="flex gap-0.5">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                font-mono text-[11px] px-3 py-1 rounded tracking-widest transition-all
                ${
                  active
                    ? 'bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30'
                    : 'text-zinc-600 hover:text-zinc-400'
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
        {label}
      </span>
      <span className="font-mono text-sm tabular-nums" style={{ color }}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}
