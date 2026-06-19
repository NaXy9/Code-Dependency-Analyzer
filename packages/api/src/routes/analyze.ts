import { Router } from 'express';
import { existsSync } from 'fs';
import { buildGraph, detectCycles } from '@dep-analyzer/core';
import { setAnalysis, getAnalysis } from '../store';

const router: ReturnType<typeof Router> = Router();

router.post('/', async (req, res) => {
  const { projectPath } = req.body as { projectPath?: string };

  if (!projectPath) {
    res.status(400).json({ error: 'projectPath is required' });
    return;
  }

  if (!existsSync(projectPath)) {
    res.status(400).json({ error: `Path does not exist: ${projectPath}` });
    return;
  }

  try {
    const graph = await buildGraph(projectPath);
    setAnalysis(projectPath, graph);

    const cycles = detectCycles(graph);

    let edgeCount = 0;
    for (const node of graph.values()) {
      edgeCount += node.imports.length + node.dynamicImports.length;
    }

    res.json({
      fileCount: graph.size,
      edgeCount,
      cycleCount: cycles.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

export { router as analyzeRouter };
