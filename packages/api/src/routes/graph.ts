import { Router } from 'express';
import { getAnalysis } from '../store';
import { serializeGraph } from '../serializer';

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

  res.json(serializeGraph(analysis.graph, analysis.projectPath));
});

export { router as graphRouter };
