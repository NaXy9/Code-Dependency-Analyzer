import { useEffect, useLayoutEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useGraph } from '../../hooks';
import { useApp } from '../../store/AppContext';
import { detectNodeType, NODE_COLORS } from '../../lib/nodeType';

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  fanIn: number;
  fanOut: number;
  externalImports: string[];
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  dynamic: boolean;
}

function nodeRadius(d: SimNode): number {
  return 5 + Math.min(d.fanIn + d.fanOut, 24) * 0.4;
}

const MAX_LABEL_LEN = 18;
function truncate(s: string): string {
  return s.length > MAX_LABEL_LEN ? s.slice(0, MAX_LABEL_LEN - 1) + '…' : s;
}

export function GraphCanvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const { currentProjectKey, toggleSelectedNode, selectedNode } = useApp();
  const { data, isLoading, error } = useGraph(currentProjectKey);

  useLayoutEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const W = svgRef.current.clientWidth || 800;
    const H = svgRef.current.clientHeight || 600;

    // ── prepare data ───────────────────────────────────────────────────────
    const nodes: SimNode[] = data.nodes.map((n) => ({
      ...n,
      x: W / 2 + (Math.random() - 0.5) * Math.min(W, H) * 0.35,
      y: H / 2 + (Math.random() - 0.5) * Math.min(W, H) * 0.35,
    }));

    const nodeById = new Map(nodes.map((n) => [n.id, n]));

    const links: SimLink[] = data.edges
      .filter((e) => nodeById.has(e.source) && nodeById.has(e.target))
      .map((e) => ({
        source: nodeById.get(e.source)!,
        target: nodeById.get(e.target)!,
        dynamic: e.dynamic,
      }));

    // Pre-compute connected node IDs for isolated-node charge tuning
    const connectedIds = new Set(
      data.edges.flatMap((e) => [e.source, e.target])
    );

    // ── clear previous ─────────────────────────────────────────────────────
    svg.select('g.root').remove();
    simRef.current?.stop();

    const root = svg.append('g').attr('class', 'root');
    const linkLayer = root.append('g').attr('class', 'links');
    const nodeLayer = root.append('g').attr('class', 'nodes');

    // ── edges ──────────────────────────────────────────────────────────────
    const link = linkLayer
      .selectAll<SVGLineElement, SimLink>('line')
      .data(links)
      .join('line')
      .attr('stroke', (d) => (d.dynamic ? '#f97316' : '#4b5563'))
      .attr('stroke-width', (d) => (d.dynamic ? 2 : 1.5))
      .attr('stroke-opacity', 0.7)
      .attr('stroke-dasharray', (d) => (d.dynamic ? '5 3' : null))
      .attr('marker-end', (d) => (d.dynamic ? 'url(#arrow-dynamic)' : 'url(#arrow)'));

    // ── nodes ──────────────────────────────────────────────────────────────
    const nodeG = nodeLayer
      .selectAll<SVGGElement, SimNode>('g.node')
      .data(nodes, (d) => d.id)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer');

    nodeG
      .append('circle')
      .attr('r', nodeRadius)
      .attr('fill', (d) => NODE_COLORS[detectNodeType(d.id)])
      .attr('fill-opacity', 0.85)
      .attr('stroke', '#0a0a12')
      .attr('stroke-width', 1.5);

    nodeG
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', 9)
      .attr('fill', '#6b7280')
      .attr('font-family', '"Fira Code", monospace')
      .attr('pointer-events', 'none')
      .attr('y', (d) => nodeRadius(d) + 11)
      .text((d) => truncate(d.label));

    nodeG.append('title').text(
      (d) =>
        `${d.id}\n──────────\nfan-in : ${d.fanIn}\nfan-out: ${d.fanOut}\nexternal: ${
          d.externalImports.join(', ') || '—'
        }`
    );

    nodeG.on('click', (_event, d) => toggleSelectedNode(d.id));

    // ── drag ───────────────────────────────────────────────────────────────
    // alphaTarget(0.2) instead of alpha(1) — gentle warmup, others don't scatter
    nodeG.call(
      d3
        .drag<SVGGElement, SimNode>()
        .on('start', (event, d) => {
          if (!event.active) simRef.current?.alphaTarget(0.2).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          // Only update position — do NOT call restart() here
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simRef.current?.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
    );

    // ── simulation ─────────────────────────────────────────────────────────
    const padding = 60;

    const sim = d3
      .forceSimulation<SimNode, SimLink>(nodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(60)
          .strength(0.8)
      )
      .force(
        'charge',
        d3.forceManyBody<SimNode>().strength((d) =>
          // Isolated nodes get minimal repulsion so they don't fly to screen edge
          connectedIds.has(d.id) ? -180 : -30
        )
      )
      .force('center', d3.forceCenter(W / 2, H / 2).strength(0.08))
      .force('collide', d3.forceCollide<SimNode>().radius(25).strength(0.7))
      // Soft boundary — keeps all nodes within the visible area
      .force('bounds', () => {
        for (const node of nodes) {
          if (node.x === undefined || node.y === undefined) continue;
          if (node.x < padding)         node.vx! += (padding - node.x) * 0.05;
          if (node.x > W - padding)     node.vx! -= (node.x - (W - padding)) * 0.05;
          if (node.y < padding)         node.vy! += (padding - node.y) * 0.05;
          if (node.y > H - padding)     node.vy! -= (node.y - (H - padding)) * 0.05;
        }
      })
      .alphaDecay(0.02); // slower cooling → more stable layout

    simRef.current = sim;

    function applyPositions() {
      link
        .attr('x1', (d) => (d.source as SimNode).x!)
        .attr('y1', (d) => (d.source as SimNode).y!)
        .attr('x2', (d) => (d.target as SimNode).x!)
        .attr('y2', (d) => (d.target as SimNode).y!);
      nodeG.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    }

    // For very large graphs run synchronously to avoid long RAF chain
    if (nodes.length > 400) {
      sim.stop();
      for (let i = 0; i < 300; i++) sim.tick();
      applyPositions();
    } else {
      sim.on('tick', applyPositions);
    }

    // ── zoom ───────────────────────────────────────────────────────────────
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 12])
      .on('zoom', (event) => root.attr('transform', event.transform));

    svg.call(zoom).on('dblclick.zoom', null);

    // Initial fit-to-view after a short settle
    const fitTimer = setTimeout(() => {
      const xs = nodes.map((n) => n.x!).filter(isFinite);
      const ys = nodes.map((n) => n.y!).filter(isFinite);
      if (!xs.length) return;
      const pad = 48;
      const x0 = Math.min(...xs) - pad;
      const y0 = Math.min(...ys) - pad;
      const x1 = Math.max(...xs) + pad;
      const y1 = Math.max(...ys) + pad;
      svg.transition().duration(400).call(
        zoom.transform,
        d3.zoomIdentity
          .translate(W / 2, H / 2)
          .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / W, (y1 - y0) / H)))
          .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
      );
    }, 600);

    return () => {
      sim.stop();
      clearTimeout(fitTimer);
    };
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // Highlight selected node
  useEffect(() => {
    if (!svgRef.current) return;
    d3.select(svgRef.current)
      .selectAll<SVGCircleElement, SimNode>('g.node circle')
      .attr('stroke', (d) => (d.id === selectedNode ? '#ffffff' : '#0a0a12'))
      .attr('stroke-width', (d) => (d.id === selectedNode ? 2.5 : 1.5))
      .attr('fill-opacity', (d) => {
        if (selectedNode === null) return 0.85;
        return d.id === selectedNode ? 1 : 0.2;
      });
  }, [selectedNode]);

  // ── render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="font-mono text-sm text-white/40 animate-pulse">LOADING_GRAPH...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="font-mono text-sm text-orange-400">ERROR: {(error as Error).message}</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-1">
          <div className="font-mono text-[11px] text-white/30">NO_GRAPH_DATA</div>
          <div className="font-mono text-[11px] text-white/20">upload a .zip archive to analyze</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <svg ref={svgRef} width="100%" height="100%" style={{ background: 'transparent' }}>
        {/* Hardcoded fill colors — Tailwind classes don't apply inside <defs> */}
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="18" refY="5"
            markerWidth="5" markerHeight="5" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#6b7280" />
          </marker>
          <marker id="arrow-dynamic" viewBox="0 0 10 10" refX="18" refY="5"
            markerWidth="5" markerHeight="5" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#f97316" />
          </marker>
        </defs>
      </svg>

      {/* Legend */}
      <div
        className="absolute bottom-4 left-4 rounded p-3 flex flex-col gap-1.5 pointer-events-none z-10"
        style={{ background: 'rgba(10,10,18,0.85)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(4px)' }}
      >
        {(Object.entries(NODE_COLORS) as [string, string][]).map(([label, color]) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="font-mono text-[10px] uppercase text-white/40">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 mt-1">
          <div className="w-4 h-px border-t border-dashed border-orange-500 opacity-60" />
          <span className="font-mono text-[10px] uppercase text-white/40">dynamic</span>
        </div>
      </div>

      {/* Zoom hint */}
      <div className="absolute bottom-4 right-4 font-mono text-[10px] text-right text-white/20 pointer-events-none z-10">
        scroll · zoom &nbsp;|&nbsp; drag · pan<br />click · inspect
      </div>
    </div>
  );
}
