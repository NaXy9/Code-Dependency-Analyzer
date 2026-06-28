import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'fs';
import { join, relative } from 'path';
import type { DependencyGraph, GraphNode } from '@dep-analyzer/core';
import { setAnalysis } from './store';

// Configurable via DATA_DIR env var — useful for Docker volume mounts
const DATA_DIR = process.env.DATA_DIR ?? join(process.cwd(), 'data');

// Stable synthetic root used to reconstruct absolute paths after reload.
// Avoids relying on the original temp dir (which is deleted on restart).
function syntheticRoot(projectId: string): string {
  return join(DATA_DIR, 'snapshots', projectId);
}

interface PersistedNode {
  id: string;              // relative path (relative to projectPath at analysis time)
  imports: string[];
  importedBy: string[];
  externalImports: string[];
  dynamicImports: string[];
}

interface PersistedProject {
  projectId: string;
  framework: string;
  analyzedAt: string;
  nodes: PersistedNode[];
}

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

/** Persist a project's graph as JSON to DATA_DIR/{projectId}.json */
export function persistProject(
  projectId: string,
  projectPath: string,
  framework: string,
  graph: DependencyGraph
): void {
  ensureDataDir();

  const rel = (abs: string) => relative(projectPath, abs);

  const nodes: PersistedNode[] = [];
  for (const [absId, node] of graph) {
    nodes.push({
      id: rel(absId),
      imports: node.imports.map(rel),
      importedBy: node.importedBy.map(rel),
      externalImports: node.externalImports,
      dynamicImports: node.dynamicImports.map(rel),
    });
  }

  const data: PersistedProject = {
    projectId,
    framework,
    analyzedAt: new Date().toISOString(),
    nodes,
  };

  try {
    writeFileSync(join(DATA_DIR, `${projectId}.json`), JSON.stringify(data), 'utf-8');
  } catch (err) {
    console.error(`[persistence] Failed to save ${projectId}:`, err);
  }
}

/** Remove a project's JSON file from disk */
export function deletePersistedProject(projectId: string): void {
  const file = join(DATA_DIR, `${projectId}.json`);
  if (existsSync(file)) {
    try {
      rmSync(file);
    } catch (err) {
      console.error(`[persistence] Failed to delete ${projectId}:`, err);
    }
  }
}

/**
 * Load all persisted projects into the in-memory store on server startup.
 * Paths are reconstructed relative to a stable synthetic root so that
 * relative() calls in routes produce the correct output.
 */
export function loadAllProjects(): void {
  if (!existsSync(DATA_DIR)) return;

  const files = readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    try {
      const raw = readFileSync(join(DATA_DIR, file), 'utf-8');
      const data = JSON.parse(raw) as PersistedProject;
      const root = syntheticRoot(data.projectId);
      const abs = (rel: string) => join(root, rel);

      // Reconstruct the DependencyGraph with absolute paths under the synthetic root
      const graph: DependencyGraph = new Map<string, GraphNode>();
      for (const node of data.nodes) {
        const absId = abs(node.id);
        graph.set(absId, {
          id: absId,
          imports: node.imports.map(abs),
          importedBy: node.importedBy.map(abs),
          externalImports: node.externalImports,
          dynamicImports: node.dynamicImports.map(abs),
        });
      }

      setAnalysis(data.projectId, root, graph);
      console.log(`[persistence] Restored project ${data.projectId} (${data.nodes.length} nodes)`);
    } catch (err) {
      console.error(`[persistence] Failed to load ${file}:`, err);
    }
  }
}
