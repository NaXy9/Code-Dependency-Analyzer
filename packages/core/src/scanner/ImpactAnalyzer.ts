import type { DependencyGraph } from './GraphBuilder';

export interface ImpactResult {
  direct: string[];
  transitive: string[];
}

export function analyzeImpact(filePath: string, graph: DependencyGraph): ImpactResult {
  const node = graph.get(filePath);
  if (!node) return { direct: [], transitive: [] };

  const direct = [...node.importedBy];
  const directSet = new Set(direct);
  const visited = new Set([filePath, ...direct]);
  const queue = [...direct];
  const transitive: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentNode = graph.get(current);
    if (!currentNode) continue;

    for (const dep of currentNode.importedBy) {
      if (!visited.has(dep)) {
        visited.add(dep);
        if (!directSet.has(dep)) transitive.push(dep);
        queue.push(dep);
      }
    }
  }

  return { direct, transitive };
}
