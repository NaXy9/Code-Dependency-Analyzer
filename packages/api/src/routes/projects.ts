import { Router } from 'express';
import { loadAllMetadata } from '../persistence';

const router: ReturnType<typeof Router> = Router();
router.get('/', (_req, res) => {
  res.json(loadAllMetadata());
});

export { router as projectsRouter };
