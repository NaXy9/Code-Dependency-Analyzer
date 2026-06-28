import { Router } from 'express';
import { relative } from 'path';
import { detectCycles } from '@dep-analyzer/core';
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

  const rel = (abs: string) => relative(analysis.projectPath, abs);
  const cycles = detectCycles(analysis.graph).map((cycle) => cycle.map(rel));

  res.json(cycles);
});

export { router as cyclesRouter };
