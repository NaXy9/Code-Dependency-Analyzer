import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'fs';
import { join, relative } from 'path';
import type { DependencyGraph, GraphNode } from '@dep-analyzer/core';
import { setAnalysis } from './store';

const DATA_DIR = process.env.DATA_DIR ?? join(process.cwd(), 'data');

function syntheticRoot(projectId: string): string {
  return join(DATA_DIR, 'snapshots', projectId);
}

interface PersistedNode {
  id: string;
  imports: string[];
  importedBy: string[];
  externalImports: string[];
  dynamicImports: string[];
}

interface PersistedProject {
  projectId: string;
  name: string;
  fileName: string;
  framework: string;
  analyzedAt: string;
  summary: {
    fileCount: number;
    edgeCount: number;
    cycleCount: number;
    framework: string;
  };
  nodes: PersistedNode[];
}

export interface ProjectMetadata {
  id: string;
  name: string;
  fileName: string;
  lastAnalyzed: string;
  summary: {
    fileCount: number;
    edgeCount: number;
    cycleCount: number;
    framework: string;
  };
}

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

export function persistProject(
  projectId: string,
  projectPath: string,
  framework: string,
  graph: DependencyGraph,
  meta: { name: string; fileName: string; fileCount: number; edgeCount: number; cycleCount: number }
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
    name: meta.name,
    fileName: meta.fileName,
    framework,
    analyzedAt: new Date().toISOString(),
    summary: {
      fileCount: meta.fileCount,
      edgeCount: meta.edgeCount,
      cycleCount: meta.cycleCount,
      framework,
    },
    nodes,
  };
  try {
    writeFileSync(join(DATA_DIR, `${projectId}.json`), JSON.stringify(data), 'utf-8');
  } catch (err) {
    console.error(`[persistence] Failed to save ${projectId}:`, err);
  }
}

export function deletePersistedProject(projectId: string): void {
  const file = join(DATA_DIR, `${projectId}.json`);
  if (existsSync(file)) {
    try { rmSync(file); } catch (err) {
      console.error(`[persistence] Failed to delete ${projectId}:`, err);
    }
  }
}

export function loadAllMetadata(): ProjectMetadata[] {
  if (!existsSync(DATA_DIR)) return [];
  const files = readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
  const results: ProjectMetadata[] = [];
  for (const file of files) {
    try {
      const raw = readFileSync(join(DATA_DIR, file), 'utf-8');
      const data = JSON.parse(raw) as PersistedProject;
      if (!data.name) continue;
      results.push({
        id: data.projectId,
        name: data.name,
        fileName: data.fileName,
        lastAnalyzed: data.analyzedAt,
        summary: data.summary,
      });
    } catch {  }
  }
  return results;
}

// Restore all graphs from disk into the in-memory store on server startup.
export function loadAllProjects(): void {
  if (!existsSync(DATA_DIR)) return;
  const files = readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    try {
      const raw = readFileSync(join(DATA_DIR, file), 'utf-8');
      const data = JSON.parse(raw) as PersistedProject;
      const root = syntheticRoot(data.projectId);
      const abs = (rel: string) => join(root, rel);
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
