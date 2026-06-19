import { describe, it, expect } from 'vitest';
import type { DependencyGraph, GraphNode } from './GraphBuilder';
import { analyzeImpact } from './ImpactAnalyzer';

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

describe('ImpactAnalyzer', () => {
  it('returns empty result for a file not in the graph', () => {
    const graph = makeGraph([['/a.ts', {}]]);

    const result = analyzeImpact('/unknown.ts', graph);

    expect(result.direct).toHaveLength(0);
    expect(result.transitive).toHaveLength(0);
  });

  it('returns empty result for a file with no importers', () => {
    const graph = makeGraph([['/a.ts', { imports: ['/b.ts'] }], ['/b.ts', {}]]);

    const result = analyzeImpact('/a.ts', graph);

    expect(result.direct).toHaveLength(0);
    expect(result.transitive).toHaveLength(0);
  });

  it('returns direct importers', () => {
    const graph = makeGraph([
      ['/util.ts', { importedBy: ['/a.ts', '/b.ts'] }],
      ['/a.ts', { imports: ['/util.ts'] }],
      ['/b.ts', { imports: ['/util.ts'] }],
    ]);

    const result = analyzeImpact('/util.ts', graph);

    expect(result.direct).toHaveLength(2);
    expect(result.direct).toContain('/a.ts');
    expect(result.direct).toContain('/b.ts');
    expect(result.transitive).toHaveLength(0);
  });

  it('returns transitive importers', () => {
    // /util.ts <- /a.ts <- /entry.ts
    const graph = makeGraph([
      ['/util.ts', { importedBy: ['/a.ts'] }],
      ['/a.ts', { imports: ['/util.ts'], importedBy: ['/entry.ts'] }],
      ['/entry.ts', { imports: ['/a.ts'] }],
    ]);

    const result = analyzeImpact('/util.ts', graph);

    expect(result.direct).toEqual(['/a.ts']);
    expect(result.transitive).toEqual(['/entry.ts']);
  });

  it('separates direct from transitive when the same file appears at multiple depths', () => {
    // /util.ts <- /a.ts (direct), /a.ts <- /root.ts, /util.ts not imported by /root.ts directly
    const graph = makeGraph([
      ['/util.ts', { importedBy: ['/a.ts'] }],
      ['/a.ts', { importedBy: ['/root.ts'] }],
      ['/root.ts', {}],
    ]);

    const result = analyzeImpact('/util.ts', graph);

    expect(result.direct).toContain('/a.ts');
    expect(result.direct).not.toContain('/root.ts');
    expect(result.transitive).toContain('/root.ts');
    expect(result.transitive).not.toContain('/a.ts');
  });

  it('handles diamond dependency without duplicates', () => {
    // /shared <- /a, /b; /a <- /root; /b <- /root
    const graph = makeGraph([
      ['/shared.ts', { importedBy: ['/a.ts', '/b.ts'] }],
      ['/a.ts', { importedBy: ['/root.ts'] }],
      ['/b.ts', { importedBy: ['/root.ts'] }],
      ['/root.ts', {}],
    ]);

    const result = analyzeImpact('/shared.ts', graph);

    expect(result.direct).toHaveLength(2);
    expect(result.transitive).toHaveLength(1);
    expect(result.transitive).toContain('/root.ts');
  });

  it('does not include the target file itself in results', () => {
    const graph = makeGraph([
      ['/a.ts', { importedBy: ['/b.ts'], imports: ['/b.ts'] }],
      ['/b.ts', { importedBy: ['/a.ts'] }],
    ]);

    const result = analyzeImpact('/a.ts', graph);

    expect(result.direct).not.toContain('/a.ts');
    expect(result.transitive).not.toContain('/a.ts');
  });
});
