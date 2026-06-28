import { Router } from 'express';
import { join, relative } from 'path';
import { analyzeImpact } from '@dep-analyzer/core';
import { getAnalysis } from '../store';

const router: ReturnType<typeof Router> = Router();

router.get('/', (req, res) => {
  const projectId = req.query.projectId as string | undefined;

  if (!projectId) {
    res.status(400).json({ error: 'Query param "projectId" is required' });
    return;
  }

  const analysis = getAnalysis(projectId);

  if (!analysis) {
    res.status(404).json({ error: 'No analysis available. Run POST /api/analyze first.' });
    return;
  }

  const { file } = req.query as { file?: string };

  if (!file) {
    res.status(400).json({ error: 'Query param "file" (relative path) is required' });
    return;
  }

  // The frontend sends the GraphNodeDTO.id which is a relative path.
  // Reconstruct the absolute path used as the graph key.
  const absFile = join(analysis.projectPath, file);

  if (!analysis.graph.has(absFile)) {
    res.status(404).json({ error: `File not found in graph: ${file}` });
    return;
  }

  const rel = (abs: string) => relative(analysis.projectPath, abs);
  const { direct, transitive } = analyzeImpact(absFile, analysis.graph);

  res.json({
    direct:     direct.map(rel),
    transitive: transitive.map(rel),
  });
});

export { router as impactRouter };
