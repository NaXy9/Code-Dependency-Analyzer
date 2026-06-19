import type { DependencyGraph } from './GraphBuilder';

export function detectCycles(graph: DependencyGraph): string[][] {
  const index = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const cycles: string[][] = [];
  let counter = 0;

  function strongconnect(v: string): void {
    index.set(v, counter);
    lowlink.set(v, counter);
    counter++;
    stack.push(v);
    onStack.add(v);

    const node = graph.get(v);
    if (node) {
      for (const w of [...node.imports, ...node.dynamicImports]) {
        if (!graph.has(w)) continue;

        if (!index.has(w)) {
          strongconnect(w);
          lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
        } else if (onStack.has(w)) {
          lowlink.set(v, Math.min(lowlink.get(v)!, index.get(w)!));
        }
      }
    }

    if (lowlink.get(v) === index.get(v)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);

      if (scc.length > 1) {
        cycles.push(scc);
      } else {
        const selfNode = graph.get(scc[0]);
        const edges = selfNode ? [...selfNode.imports, ...selfNode.dynamicImports] : [];
        if (edges.includes(scc[0])) {
          cycles.push(scc);
        }
      }
    }
  }

  for (const v of graph.keys()) {
    if (!index.has(v)) {
      strongconnect(v);
    }
  }

  return cycles;
}
