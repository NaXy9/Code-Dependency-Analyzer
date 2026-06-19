export { scanFiles } from './scanner/FileScanner';
export type { ScanOptions } from './scanner/FileScanner';

export { parseImports, parseImportsFromContent } from './scanner/ImportParser';
export type { ParsedImport, ParseResult } from './scanner/ImportParser';

export { resolveImport, resolveImports } from './scanner/PathResolver';
export type { ResolvedImport } from './scanner/PathResolver';

export { buildGraph } from './scanner/GraphBuilder';
export type { GraphNode, DependencyGraph } from './scanner/GraphBuilder';

export { detectCycles } from './scanner/CycleDetector';

export { analyzeImpact } from './scanner/ImpactAnalyzer';
export type { ImpactResult } from './scanner/ImpactAnalyzer';

export { calculateMetrics } from './scanner/MetricsCalculator';
export type { FileMetrics, MetricsResult } from './scanner/MetricsCalculator';
