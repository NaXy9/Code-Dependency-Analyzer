export interface GraphNodeDTO {
  id: string;
  label: string;
  externalImports: string[];
  fanIn: number;
  fanOut: number;
}

export interface EdgeDTO {
  source: string;
  target: string;
  dynamic: boolean;
}

export interface MetricEntry {
  filePath: string;
  fanIn: number;
  fanOut: number;
}

export interface AnalyzeSummary {
  fileCount: number;
  edgeCount: number;
  cycleCount: number;
  framework: string;
}

export interface GraphResponse {
  nodes: GraphNodeDTO[];
  edges: EdgeDTO[];
}

export interface ImpactResponse {
  direct: string[];
  transitive: string[];
}

export interface MetricsResponse {
  topByFanIn: MetricEntry[];
  topByFanOut: MetricEntry[];
}

export interface ProjectMetadataDTO {
  id: string;
  name: string;
  fileName: string;
  lastAnalyzed: string;
  summary: AnalyzeSummary;
}
