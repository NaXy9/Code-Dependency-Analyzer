import type { DependencyGraph } from '@dep-analyzer/core';

interface AnalysisState {
  projectPath: string;
  graph: DependencyGraph;
  analyzedAt: Date;
}

let state: AnalysisState | null = null;

export function setAnalysis(projectPath: string, graph: DependencyGraph): void {
  state = { projectPath, graph, analyzedAt: new Date() };
}

export function getAnalysis(): AnalysisState | null {
  return state;
}

export function clearAnalysis(): void {
  state = null;
}
