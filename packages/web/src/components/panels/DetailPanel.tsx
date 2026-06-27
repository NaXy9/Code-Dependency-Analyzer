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
    ? (graphData?.nodes.find((n) => n.id === selectedNode) ?? null)
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
  const filename = node.id.replace(/\\/g, '/').split('/').pop() ?? node.id;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute top-0 right-0 w-80 h-full z-20 flex flex-col bg-[#0a0a12]/95 backdrop-blur-md border-l border-white/[0.08] shadow-2xl"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/[0.06] bg-white/[0.02] flex items-start justify-between">
        <div className="min-w-0 flex-1 mr-2">
          <div className="font-mono text-sm font-semibold text-white/90 truncate">
            {filename}
          </div>
          <div className="font-mono text-xs text-white/40 truncate mt-0.5" title={node.id}>
            {node.id}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-white/[0.12] bg-white/[0.05] text-white/60 uppercase">
              {type}
            </span>
          </div>
        </div>
        <button
          onClick={() => setSelectedNode(null)}
          className="text-white/30 hover:text-white/70 hover:bg-white/[0.06] rounded p-1 transition-colors cursor-pointer flex-shrink-0"
        >
          <X size={15} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* FAN_IN / FAN_OUT */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded border border-white/[0.08] bg-white/[0.03] flex flex-col">
            <span className="font-mono text-[10px] text-white/40 mb-1">FAN_IN</span>
            <span className="font-mono text-2xl font-light text-white/90">{node.fanIn}</span>
          </div>
          <div className="p-3 rounded border border-white/[0.08] bg-white/[0.03] flex flex-col">
            <span className="font-mono text-[10px] text-white/40 mb-1">FAN_OUT</span>
            <span className="font-mono text-2xl font-light text-white/90">{node.fanOut}</span>
          </div>
        </div>

        {/* IMPORTS */}
        <div>
          <div className="font-mono text-[10px] font-bold text-white/40 tracking-widest uppercase mt-4 mb-2">
            IMPORTS ({imports.length})
          </div>
          {imports.length === 0 ? (
            <p className="font-mono text-[11px] text-white/20 italic">— none</p>
          ) : (
            <div className="space-y-1">
              {imports.slice(0, MAX_VISIBLE).map((id) => (
                <div key={id} className="flex items-center gap-2 py-1.5 px-2 rounded border border-white/[0.06] bg-white/[0.02] font-mono text-xs">
                  <span className="text-violet-400 shrink-0">→</span>
                  <span className="text-white/70 truncate" title={id}>
                    {id.replace(/\\/g, '/').split('/').pop()}
                  </span>
                </div>
              ))}
              {imports.length > MAX_VISIBLE && (
                <p className="font-mono text-[11px] text-white/20">… and {imports.length - MAX_VISIBLE} more</p>
              )}
            </div>
          )}
        </div>

        {/* IMPORTED_BY */}
        <div>
          <div className="font-mono text-[10px] font-bold text-white/40 tracking-widest uppercase mt-4 mb-2">
            IMPORTED_BY ({importedBy.length})
          </div>
          {importedBy.length === 0 ? (
            <p className="font-mono text-[11px] text-white/20 italic">— none</p>
          ) : (
            <div className="space-y-1">
              {importedBy.slice(0, MAX_VISIBLE).map((id) => (
                <div key={id} className="flex items-center gap-2 py-1.5 px-2 rounded border border-white/[0.06] bg-white/[0.02] font-mono text-xs">
                  <span className="text-violet-400 shrink-0">←</span>
                  <span className="text-white/70 truncate" title={id}>
                    {id.replace(/\\/g, '/').split('/').pop()}
                  </span>
                </div>
              ))}
              {importedBy.length > MAX_VISIBLE && (
                <p className="font-mono text-[11px] text-white/20">… and {importedBy.length - MAX_VISIBLE} more</p>
              )}
            </div>
          )}
        </div>

        {/* EXTERNAL_DEPS */}
        {node.externalImports.length > 0 && (
          <div>
            <div className="font-mono text-[10px] font-bold text-white/40 tracking-widest uppercase mt-4 mb-2">
              EXTERNAL_DEPS ({node.externalImports.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {node.externalImports.map((pkg) => (
                <span key={pkg} className="inline-flex font-mono text-[10px] px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.04] text-white/50">
                  {pkg}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
