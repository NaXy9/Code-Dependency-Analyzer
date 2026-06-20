export interface GraphNodeDTO {
  id: string;
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
