import { describe, it, expect } from 'vitest';
import type { DependencyGraph, GraphNode } from './GraphBuilder';
import { detectCycles } from './CycleDetector';

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

describe('CycleDetector', () => {
  it('returns empty array for a graph with no cycles', () => {
    const graph = makeGraph([
      ['/a.ts', { imports: ['/b.ts'] }],
      ['/b.ts', { imports: ['/c.ts'], importedBy: ['/a.ts'] }],
      ['/c.ts', { importedBy: ['/b.ts'] }],
    ]);

    expect(detectCycles(graph)).toHaveLength(0);
  });

  it('detects a direct two-node cycle', () => {
    const graph = makeGraph([
      ['/a.ts', { imports: ['/b.ts'], importedBy: ['/b.ts'] }],
      ['/b.ts', { imports: ['/a.ts'], importedBy: ['/a.ts'] }],
    ]);

    const cycles = detectCycles(graph);

    expect(cycles).toHaveLength(1);
    expect(cycles[0]).toHaveLength(2);
    expect(cycles[0]).toContain('/a.ts');
    expect(cycles[0]).toContain('/b.ts');
  });

  it('detects a three-node cycle', () => {
    const graph = makeGraph([
      ['/a.ts', { imports: ['/b.ts'] }],
      ['/b.ts', { imports: ['/c.ts'] }],
      ['/c.ts', { imports: ['/a.ts'] }],
    ]);

    const cycles = detectCycles(graph);

    expect(cycles).toHaveLength(1);
    expect(cycles[0]).toHaveLength(3);
  });

  it('detects a self-loop', () => {
    const graph = makeGraph([
      ['/a.ts', { imports: ['/a.ts'] }],
    ]);

    const cycles = detectCycles(graph);

    expect(cycles).toHaveLength(1);
    expect(cycles[0]).toEqual(['/a.ts']);
  });

  it('detects a cycle through dynamic imports', () => {
    const graph = makeGraph([
      ['/a.ts', { dynamicImports: ['/b.ts'] }],
      ['/b.ts', { imports: ['/a.ts'] }],
    ]);

    const cycles = detectCycles(graph);

    expect(cycles).toHaveLength(1);
    expect(cycles[0]).toContain('/a.ts');
    expect(cycles[0]).toContain('/b.ts');
  });

  it('detects multiple independent cycles', () => {
    const graph = makeGraph([
      ['/a.ts', { imports: ['/b.ts'] }],
      ['/b.ts', { imports: ['/a.ts'] }],
      ['/c.ts', { imports: ['/d.ts'] }],
      ['/d.ts', { imports: ['/c.ts'] }],
    ]);

    const cycles = detectCycles(graph);

    expect(cycles).toHaveLength(2);
  });

  it('does not report non-cyclic nodes alongside cyclic ones', () => {
    const graph = makeGraph([
      ['/entry.ts', { imports: ['/a.ts'] }],
      ['/a.ts', { imports: ['/b.ts'] }],
      ['/b.ts', { imports: ['/a.ts'] }],
    ]);

    const cycles = detectCycles(graph);

    expect(cycles).toHaveLength(1);
    expect(cycles[0]).not.toContain('/entry.ts');
  });

  it('returns empty array for an empty graph', () => {
    expect(detectCycles(new Map())).toHaveLength(0);
  });
});
