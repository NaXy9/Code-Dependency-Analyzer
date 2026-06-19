import { describe, it, expect } from 'vitest';
import type { DependencyGraph, GraphNode } from './GraphBuilder';
import { calculateMetrics } from './MetricsCalculator';

function makeGraph(entries: [string, Partial<GraphNode>][]): DependencyGraph {
  const graph: DependencyGraph = new Map();
  for (const [id, partial] of entries) {
    graph.set(id, {
      id,
      imports: [],
      importedBy: [],
      externalImports: [],
      dynamicImports: [],
      ...partial,
    });
  }
  return graph;
}

describe('MetricsCalculator', () => {
  it('returns a FileMetrics entry for every node', () => {
    const graph = makeGraph([
      ['/a.ts', {}],
      ['/b.ts', {}],
      ['/c.ts', {}],
    ]);

    const { files } = calculateMetrics(graph);

    expect(files).toHaveLength(3);
  });

  it('computes fan-in as importedBy.length', () => {
    const graph = makeGraph([
      ['/shared.ts', { importedBy: ['/a.ts', '/b.ts', '/c.ts'] }],
      ['/a.ts', {}],
      ['/b.ts', {}],
      ['/c.ts', {}],
    ]);

    const { files } = calculateMetrics(graph);
    const shared = files.find((f) => f.filePath === '/shared.ts')!;

    expect(shared.fanIn).toBe(3);
  });

  it('computes fan-out as imports.length + dynamicImports.length', () => {
    const graph = makeGraph([
      ['/entry.ts', { imports: ['/a.ts', '/b.ts'], dynamicImports: ['/c.ts'] }],
      ['/a.ts', {}],
      ['/b.ts', {}],
      ['/c.ts', {}],
    ]);

    const { files } = calculateMetrics(graph);
    const entry = files.find((f) => f.filePath === '/entry.ts')!;

    expect(entry.fanOut).toBe(3);
  });

  it('topByFanIn is sorted descending and capped at topN', () => {
    const graph = makeGraph([
      ['/a.ts', { importedBy: ['/x.ts'] }],
      ['/b.ts', { importedBy: ['/x.ts', '/y.ts', '/z.ts'] }],
      ['/c.ts', { importedBy: ['/x.ts', '/y.ts'] }],
      ['/x.ts', {}],
      ['/y.ts', {}],
      ['/z.ts', {}],
    ]);

    const { topByFanIn } = calculateMetrics(graph, 2);

    expect(topByFanIn).toHaveLength(2);
    expect(topByFanIn[0].filePath).toBe('/b.ts');
    expect(topByFanIn[1].filePath).toBe('/c.ts');
  });

  it('topByFanOut is sorted descending and capped at topN', () => {
    const graph = makeGraph([
      ['/a.ts', { imports: ['/x.ts'] }],
      ['/b.ts', { imports: ['/x.ts', '/y.ts'], dynamicImports: ['/z.ts'] }],
      ['/c.ts', { imports: ['/x.ts', '/y.ts'] }],
      ['/x.ts', {}],
      ['/y.ts', {}],
      ['/z.ts', {}],
    ]);

    const { topByFanOut } = calculateMetrics(graph, 2);

    expect(topByFanOut).toHaveLength(2);
    expect(topByFanOut[0].filePath).toBe('/b.ts');
    expect(topByFanOut[0].fanOut).toBe(3);
  });

  it('returns empty arrays for an empty graph', () => {
    const result = calculateMetrics(new Map());

    expect(result.files).toHaveLength(0);
    expect(result.topByFanIn).toHaveLength(0);
    expect(result.topByFanOut).toHaveLength(0);
  });

  it('topN defaults to 10 and does not exceed graph size', () => {
    const graph = makeGraph(
      Array.from({ length: 5 }, (_, i) => [`/file${i}.ts`, {}])
    );

    const { topByFanIn } = calculateMetrics(graph);

    expect(topByFanIn).toHaveLength(5);
  });
});
