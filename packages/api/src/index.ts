import express from 'express';
import cors from 'cors';
import { join } from 'path';
import { analyzeRouter } from './routes/analyze';
import { graphRouter }   from './routes/graph';
import { cyclesRouter }  from './routes/cycles';
import { impactRouter }  from './routes/impact';
import { metricsRouter } from './routes/metrics';
import { loadAllProjects } from './persistence';

const app  = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json());

// Health check — useful for Docker healthchecks and uptime monitors
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/analyze', analyzeRouter);
app.use('/api/graph',   graphRouter);
app.use('/api/cycles',  cyclesRouter);
app.use('/api/impact',  impactRouter);
app.use('/api/metrics', metricsRouter);

if (process.env.NODE_ENV === 'production') {
  const webDist = join(__dirname, '..', 'web-dist');

  app.use(express.static(webDist));

  app.get('*', (_req, res) => {
    res.sendFile(join(webDist, 'index.html'));
  });
}
loadAllProjects();

app.listen(PORT, () => {
  console.log(`[api] Listening on http://localhost:${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    console.log('[api] Serving frontend from web-dist/');
  }
});
