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
    const { clientWidth: W, clientHeight: H } = svgRef.current;

    const nodes: SimNode[] = data.nodes.map((n) => ({
      ...n,
      x: W / 2 + (Math.random() - 0.5) * Math.min(W, H) * 0.4,
      y: H / 2 + (Math.random() - 0.5) * Math.min(W, H) * 0.4,
    }));

    const nodeById = new Map(nodes.map((n) => [n.id, n]));

    const links: SimLink[] = data.edges
      .filter((e) => nodeById.has(e.source) && nodeById.has(e.target))
      .map((e) => ({
        source: nodeById.get(e.source)!,
        target: nodeById.get(e.target)!,
        dynamic: e.dynamic,
      }));

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
      .attr('stroke', (d) => (d.dynamic ? '#f97316' : '#374151'))
      .attr('stroke-width', (d) => (d.dynamic ? 1.5 : 1))
      .attr('stroke-dasharray', (d) => (d.dynamic ? '4 2' : null))
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
      .attr('stroke', '#0a0a0f')
      .attr('stroke-width', 1.5);

    // Label uses d.label (basename from API)
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
    nodeG.call(
      d3
        .drag<SVGGElement, SimNode>()
        .on('start', (event, d) => {
          if (!event.active) simRef.current?.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
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
    const isLarge = nodes.length > 400;

    const sim = d3
      .forceSimulation<SimNode, SimLink>(nodes)
      .force(
        'link',
        d3.forceLink<SimNode, SimLink>(links).id((d) => d.id).distance(70).strength(0.4)
      )
      .force('charge', d3.forceManyBody<SimNode>().strength(isLarge ? -30 : -80))
      .force('center', d3.forceCenter(W / 2, H / 2).strength(0.05))
      .force('collision', d3.forceCollide<SimNode>().radius((d) => nodeRadius(d) + 14))
      .alphaDecay(isLarge ? 0.06 : 0.028);

    simRef.current = sim;

    function applyPositions() {
      link
        .attr('x1', (d) => (d.source as SimNode).x!)
        .attr('y1', (d) => (d.source as SimNode).y!)
        .attr('x2', (d) => (d.target as SimNode).x!)
        .attr('y2', (d) => (d.target as SimNode).y!);
      nodeG.attr('transform', (d) => `translate(${d.x},${d.y})`);
    }

    if (isLarge) {
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

    const padding = 40;
    const xs = nodes.map((n) => n.x!).filter(isFinite);
    const ys = nodes.map((n) => n.y!).filter(isFinite);
    if (xs.length && ys.length) {
      const x0 = Math.min(...xs) - padding;
      const y0 = Math.min(...ys) - padding;
      const x1 = Math.max(...xs) + padding;
      const y1 = Math.max(...ys) + padding;
      svg.call(
        zoom.transform,
        d3.zoomIdentity
          .translate(W / 2, H / 2)
          .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / W, (y1 - y0) / H)))
          .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
      );
    }

    return () => { sim.stop(); };
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!svgRef.current) return;
    d3.select(svgRef.current)
      .selectAll<SVGCircleElement, SimNode>('g.node circle')
      .attr('stroke', (d) => (d.id === selectedNode ? '#ffffff' : '#0a0a0f'))
      .attr('stroke-width', (d) => (d.id === selectedNode ? 2.5 : 1.5))
      .attr('fill-opacity', (d) => {
        if (selectedNode === null) return 0.85;
        return d.id === selectedNode ? 1 : 0.2;
      });
  }, [selectedNode]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="font-mono text-sm text-muted-foreground animate-pulse">LOADING_GRAPH...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="font-mono text-sm text-destructive">ERROR: {(error as Error).message}</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-1">
          <div className="font-mono text-[11px] text-muted-foreground">NO_GRAPH_DATA</div>
          <div className="font-mono text-[11px] text-muted-foreground/40">upload a .zip archive to analyze</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      <svg ref={svgRef} className="w-full h-full" style={{ background: 'transparent' }}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#4b5563" />
          </marker>
          <marker id="arrow-dynamic" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#f97316" />
          </marker>
        </defs>
      </svg>

      {/* Legend */}
      <div
        className="absolute bottom-4 left-4 rounded p-3 flex flex-col gap-1.5 pointer-events-none"
        style={{ background: 'rgba(15,15,26,0.85)', border: '1px solid rgba(99,102,241,0.1)', backdropFilter: 'blur(4px)' }}
      >
        {(Object.entries(NODE_COLORS) as [string, string][]).map(([label, color]) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="font-mono text-[10px] uppercase text-muted-foreground">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 mt-1">
          <div className="w-4 h-px border-t border-dashed border-orange-500 opacity-60" />
          <span className="font-mono text-[10px] uppercase text-muted-foreground">dynamic</span>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 font-mono text-[10px] text-right text-muted-foreground/40 pointer-events-none">
        scroll · zoom &nbsp;|&nbsp; drag · pan<br />click · inspect
      </div>
    </div>
  );
}
