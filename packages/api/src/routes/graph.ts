import { Router } from 'express';
import { getAnalysis } from '../store';
import { serializeGraph } from '../serializer';

const router: ReturnType<typeof Router> = Router();

router.get('/', (req, res) => {
  const analysis = getAnalysis();

  if (!analysis) {
    res.status(404).json({ error: 'No analysis available. Run POST /api/analyze first.' });
    return;
  }

  res.json(serializeGraph(analysis.graph, analysis.projectPath));
});

export { router as graphRouter };
