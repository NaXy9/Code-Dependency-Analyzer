import { relative, basename } from 'path';
import type { DependencyGraph } from '@dep-analyzer/core';

export interface GraphNodeDTO {
  id: string;       // relative path — уникальный ключ, используй для edges и /api/impact
  label: string;    // basename — то что показывать на графе
  externalImports: string[];
  fanIn: number;
  fanOut: number;
}

export interface EdgeDTO {
  source: string;
  target: string;
  dynamic: boolean;
}

export function serializeGraph(
  graph: DependencyGraph,
  projectPath: string
): { nodes: GraphNodeDTO[]; edges: EdgeDTO[] } {
  const rel = (abs: string) => relative(projectPath, abs);

  const nodes: GraphNodeDTO[] = [];
  const edges: EdgeDTO[] = [];

  for (const [absPath, node] of graph) {
    nodes.push({
      id: rel(absPath),
      label: basename(absPath),
      externalImports: node.externalImports,
      fanIn: node.importedBy.length,
      fanOut: node.imports.length + node.dynamicImports.length,
    });

    for (const dep of node.imports) {
      edges.push({ source: rel(absPath), target: rel(dep), dynamic: false });
    }
    for (const dep of node.dynamicImports) {
      edges.push({ source: rel(absPath), target: rel(dep), dynamic: true });
    }
  }

  return { nodes, edges };
}
