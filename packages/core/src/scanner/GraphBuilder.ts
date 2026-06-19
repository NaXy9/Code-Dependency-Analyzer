import { scanFiles } from './FileScanner';
import { parseImports } from './ImportParser';
import { resolveImports } from './PathResolver';
import type { ScanOptions } from './FileScanner';

export interface GraphNode {
  id: string;
  imports: string[];         // outbound edges (local files only)
  importedBy: string[];      // inbound edges
  externalImports: string[]; // 'react', '@tanstack/query', etc.
  dynamicImports: string[];  // dynamic import() — local files
}

export type DependencyGraph = Map<string, GraphNode>;

function createNode(id: string): GraphNode {
  return { id, imports: [], importedBy: [], externalImports: [], dynamicImports: [] };
}

export async function buildGraph(
  rootPath: string,
  options?: ScanOptions
): Promise<DependencyGraph> {
  const files = await scanFiles(rootPath, options);
  const graph: DependencyGraph = new Map(files.map((f) => [f, createNode(f)]));

  await Promise.all(
    files.map(async (filePath) => {
      const { imports: parsed, error } = await parseImports(filePath);
      if (error) return;

      const resolved = await resolveImports(parsed, filePath);
      const node = graph.get(filePath)!;

      for (const imp of resolved) {
        if (imp.isExternal) {
          node.externalImports.push(imp.source);
          continue;
        }

        if (imp.absolutePath === null) continue;

        if (imp.isDynamic) {
          node.dynamicImports.push(imp.absolutePath);
        } else {
          node.imports.push(imp.absolutePath);
        }

        graph.get(imp.absolutePath)?.importedBy.push(filePath);
      }
    })
  );

  return graph;
}
