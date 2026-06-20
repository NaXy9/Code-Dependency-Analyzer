import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { useImpact, useGraph } from '../../hooks';
import { detectNodeType, NODE_COLORS } from '../../lib/nodeType';

export function DetailPanel() {
  const { selectedNode, setSelectedNode, currentProjectPath } = useApp();
  const { data: graphData } = useGraph(currentProjectPath);
  const { data: impact, isLoading: impactLoading } = useImpact(
    currentProjectPath,
    selectedNode
  );

  if (!selectedNode) return null;
  const node = graphData?.nodes.find((n) => n.id === selectedNode);
  if (!node) return null;

  const type = detectNodeType(node.id);
  const color = NODE_COLORS[type];
  const filename = node.id.split('/').pop() ?? node.id;
  const dir = node.id.includes('/') ? node.id.slice(0, node.id.lastIndexOf('/') + 1) : '';

  return (
    <motion.aside
      key={selectedNode}
      initial={{ x: 288, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 288, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="w-72 flex-shrink-0 flex flex-col overflow-hidden"
      style={{
        background: '#0f0f1a',
        borderLeft: '1px solid rgba(99,102,241,0.12)',
      }}
    >
      {/* header */}
      <div
        className="h-12 flex items-center justify-between px-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}
      >
        <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#6b7280' }}>
          FILE_INSPECTOR
        </span>
        <button
          onClick={() => setSelectedNode(null)}
          className="p-1 rounded transition-colors hover:bg-white/5"
          style={{ color: '#6b7280' }}
        >
          <X size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* identity */}
        <section>
          <Label>FILE</Label>
          <div className="font-mono text-[11px] break-all leading-relaxed mt-1.5">
            <span style={{ color: '#6b7280' }}>{dir}</span>
            <span style={{ color: '#e2e8f0' }}>{filename}</span>
          </div>
          <span
            className="inline-block mt-2 px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-widest"
            style={{
              background: `${color}1a`,
              color,
              border: `1px solid ${color}33`,
            }}
          >
            {type}
          </span>
        </section>

        {/* metrics */}
        <section>
          <Label>METRICS</Label>
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            <MetricBox label="FAN_IN" value={node.fanIn} />
            <MetricBox label="FAN_OUT" value={node.fanOut} />
          </div>
        </section>

        {/* external deps */}
        {node.externalImports.length > 0 && (
          <section>
            <Label>EXTERNAL_DEPS ({node.externalImports.length})</Label>
            <ul className="mt-1.5 space-y-1">
              {node.externalImports.map((pkg) => (
                <li
                  key={pkg}
                  className="font-mono text-[11px] truncate px-2 py-1 rounded"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(99,102,241,0.08)',
                    color: '#9ca3af',
                  }}
                  title={pkg}
                >
                  {pkg}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* impact */}
        <section>
          <Label>IMPACT_ANALYSIS</Label>
          {impactLoading ? (
            <div className="mt-1.5 font-mono text-[11px] animate-pulse" style={{ color: '#6b7280' }}>
              RESOLVING...
            </div>
          ) : impact ? (
            <div className="mt-1.5 space-y-4">
              <ImpactList label="DIRECT" items={impact.direct} color="#6366f1" />
              <ImpactList label="TRANSITIVE" items={impact.transitive} color="#9ca3af" />
            </div>
          ) : null}
        </section>
      </div>
    </motion.aside>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#6b7280' }}>
      {children}
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded p-3"
      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(99,102,241,0.1)' }}
    >
      <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#6b7280' }}>
        {label}
      </div>
      <div className="font-mono text-xl leading-none mt-1 tabular-nums" style={{ color: '#6366f1' }}>
        {value}
      </div>
    </div>
  );
}

function ImpactList({
  label,
  items,
  color,
}: {
  label: string;
  items: string[];
  color: string;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-widest mb-1.5" style={{ color }}>
        {label} <span style={{ color: 'rgba(148,163,184,0.4)' }}>({items.length})</span>
      </div>
      {items.length === 0 ? (
        <div className="font-mono text-[11px]" style={{ color: '#374151' }}>
          NONE
        </div>
      ) : (
        <ul className="space-y-0.5 max-h-36 overflow-y-auto">
          {items.map((f) => (
            <li
              key={f}
              className="font-mono text-[11px] truncate transition-colors hover:text-zinc-300"
              style={{ color: '#6b7280' }}
              title={f}
            >
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
