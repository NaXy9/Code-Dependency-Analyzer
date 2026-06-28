import express from 'express';
import cors from 'cors';
import { analyzeRouter } from './routes/analyze';
import { graphRouter } from './routes/graph';
import { cyclesRouter } from './routes/cycles';
import { impactRouter } from './routes/impact';
import { metricsRouter } from './routes/metrics';
import { loadAllProjects } from './persistence';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/analyze', analyzeRouter);
app.use('/api/graph',   graphRouter);
app.use('/api/cycles',  cyclesRouter);
app.use('/api/impact',  impactRouter);
app.use('/api/metrics', metricsRouter);

// Restore all previously analysed projects from disk before accepting requests
loadAllProjects();

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
