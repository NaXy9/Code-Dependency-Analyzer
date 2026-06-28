import { Router } from 'express';
import { relative } from 'path';
import { calculateMetrics } from '@dep-analyzer/core';
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

  const topN = req.query.topN ? parseInt(req.query.topN as string, 10) : 10;
  const rel = (abs: string) => relative(analysis.projectPath, abs);
  const { topByFanIn, topByFanOut } = calculateMetrics(analysis.graph, topN);

  res.json({
    topByFanIn:  topByFanIn.map((m) => ({ ...m, filePath: rel(m.filePath) })),
    topByFanOut: topByFanOut.map((m) => ({ ...m, filePath: rel(m.filePath) })),
  });
});

export { router as metricsRouter };
