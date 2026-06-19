import type { DependencyGraph } from './GraphBuilder';

export interface FileMetrics {
  filePath: string;
  fanIn: number;
  fanOut: number;
}

export interface MetricsResult {
  files: FileMetrics[];
  topByFanIn: FileMetrics[];
  topByFanOut: FileMetrics[];
}

export function calculateMetrics(graph: DependencyGraph, topN = 10): MetricsResult {
  const files: FileMetrics[] = [];

  for (const [filePath, node] of graph) {
    files.push({
      filePath,
      fanIn: node.importedBy.length,
      fanOut: node.imports.length + node.dynamicImports.length,
    });
  }

  const topByFanIn = [...files].sort((a, b) => b.fanIn - a.fanIn).slice(0, topN);
  const topByFanOut = [...files].sort((a, b) => b.fanOut - a.fanOut).slice(0, topN);

  return { files, topByFanIn, topByFanOut };
}
