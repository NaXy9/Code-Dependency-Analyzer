import express from 'express';
import cors from 'cors';
import { analyzeRouter } from './routes/analyze';
import { graphRouter } from './routes/graph';
import { cyclesRouter } from './routes/cycles';
import { impactRouter } from './routes/impact';
import { metricsRouter } from './routes/metrics';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/analyze', analyzeRouter);
app.use('/api/graph', graphRouter);
app.use('/api/cycles', cyclesRouter);
app.use('/api/impact', impactRouter);
app.use('/api/metrics', metricsRouter);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
