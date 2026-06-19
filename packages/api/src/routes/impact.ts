import { Router } from 'express';
import { relative } from 'path';
import { analyzeImpact } from '@dep-analyzer/core';
import { getAnalysis } from '../store';

const router: ReturnType<typeof Router> = Router();

router.get('/', (req, res) => {
  const analysis = getAnalysis();

  if (!analysis) {
    res.status(404).json({ error: 'No analysis available. Run POST /api/analyze first.' });
    return;
  }

  const { file } = req.query as { file?: string };

  if (!file) {
    res.status(400).json({ error: 'Query param "file" (absolute path) is required' });
    return;
  }

  if (!analysis.graph.has(file)) {
    res.status(404).json({ error: `File not found in graph: ${file}` });
    return;
  }

  const rel = (abs: string) => relative(analysis.projectPath, abs);
  const { direct, transitive } = analyzeImpact(file, analysis.graph);

  res.json({
    direct: direct.map(rel),
    transitive: transitive.map(rel),
  });
});

export { router as impactRouter };
