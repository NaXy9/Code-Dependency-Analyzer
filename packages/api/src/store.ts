import type { DependencyGraph } from '@dep-analyzer/core';

interface AnalysisState {
  projectPath: string;
  graph: DependencyGraph;
  analyzedAt: Date;
}

const store = new Map<string, AnalysisState>();

export function setAnalysis(projectId: string, projectPath: string, graph: DependencyGraph): void {
  store.set(projectId, { projectPath, graph, analyzedAt: new Date() });
}

export function getAnalysis(projectId: string): AnalysisState | null {
  return store.get(projectId) ?? null;
}

export function deleteAnalysis(projectId: string): void {
  store.delete(projectId);
}
