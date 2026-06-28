export interface GraphNodeDTO {
  id: string;     // relative path — used for edges and /api/impact
  label: string;  // basename — shown on the graph
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
  /** Primary framework detected from package.json / config files. */
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
