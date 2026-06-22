import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { useGraph } from '../../hooks';
import { detectNodeType, NODE_COLORS } from '../../lib/nodeType';

const MAX_VISIBLE = 12;

export function DetailPanel() {
  const { selectedNode, setSelectedNode, currentProjectKey } = useApp();
  const { data: graphData } = useGraph(currentProjectKey);

  const node = selectedNode
    ? graphData?.nodes.find((n) => n.id === selectedNode) ?? null
    : null;

  const { imports, importedBy } = useMemo(() => {
    if (!selectedNode || !graphData) return { imports: [], importedBy: [] };
    return {
      imports:    graphData.edges.filter((e) => e.source === selectedNode).map((e) => e.target),
      importedBy: graphData.edges.filter((e) => e.target === selectedNode).map((e) => e.source),
    };
  }, [selectedNode, graphData]);

  if (!selectedNode || !node) return null;

  const type = detectNodeType(node.id);
  const color = NODE_COLORS[type];

  return (
    <motion.aside
      key={selectedNode}
      initial={{ x: 288, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 288, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="w-72 flex-shrink-0 flex flex-col overflow-hidden"
      style={{ background: '#0f0f1a', borderLeft: '1px solid rgba(99,102,241,0.12)' }}
    >
      <div className="h-12 flex items-center justify-between px-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">FILE_INSPECTOR</span>
        <button onClick={() => setSelectedNode(null)}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
          <X size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <section>
          <Label>FILE</Label>
          <div className="font-mono text-[11px] break-all leading-relaxed mt-1.5 text-foreground">{node.id}</div>
          <span className="inline-block mt-2 px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-widest"
            style={{ background: `${color}1a`, color, border: `1px solid ${color}33` }}>
            {type}
          </span>
        </section>

        <section>
          <Label>METRICS</Label>
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            <MetricBox label="FAN_IN"  value={node.fanIn} />
            <MetricBox label="FAN_OUT" value={node.fanOut} />
          </div>
        </section>

        {node.externalImports.length > 0 && (
          <section>
            <Label>EXTERNAL_DEPS ({node.externalImports.length})</Label>
            <ul className="mt-1.5 space-y-1">
              {node.externalImports.map((pkg) => (
                <li key={pkg} className="font-mono text-[11px] truncate px-2 py-1 rounded bg-card/30 border border-border/50 text-muted-foreground" title={pkg}>
                  {pkg}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <Label>IMPORTS ({imports.length})</Label>
          <FileList items={imports} prefix="→" color="#9ca3af" />
        </section>

        <section>
          <Label>IMPORTED_BY ({importedBy.length})</Label>
          <FileList items={importedBy} prefix="←" color="#6366f1" />
        </section>
      </div>
    </motion.aside>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{children}</div>;
}

function MetricBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded p-3 bg-card/30 border border-border/50">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-mono text-xl leading-none mt-1 tabular-nums" style={{ color: '#6366f1' }}>{value}</div>
    </div>
  );
}

function FileList({ items, prefix, color }: { items: string[]; prefix: string; color: string }) {
  if (items.length === 0) {
    return <p className="mt-1.5 font-mono text-[11px] text-muted-foreground italic">— none</p>;
  }
  return (
    <ul className="mt-1.5 space-y-0.5">
      {items.slice(0, MAX_VISIBLE).map((id) => (
        <li key={id} className="font-mono text-[11px] truncate" style={{ color }} title={id}>
          {prefix} {id.replace(/\\/g, '/').split('/').pop()}
        </li>
      ))}
      {items.length > MAX_VISIBLE && (
        <li className="font-mono text-[11px] text-muted-foreground/50">… and {items.length - MAX_VISIBLE} more</li>
      )}
    </ul>
  );
}
