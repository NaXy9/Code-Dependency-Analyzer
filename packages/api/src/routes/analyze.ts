import { Router } from 'express';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdtempSync, rmSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';
import multer from 'multer';
import AdmZip from 'adm-zip';
import { buildGraph, detectCycles } from '@dep-analyzer/core';
import { setAnalysis, getAnalysis } from '../store';

const router: ReturnType<typeof Router> = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('archive'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Field "archive" (.zip) is required' });
    return;
  }

  if (!req.file.originalname.endsWith('.zip')) {
    res.status(400).json({ error: 'Only .zip archives are supported' });
    return;
  }

  // Clean up previous temp dir if it exists
  const previous = getAnalysis();
  if (previous && previous.projectPath.startsWith(tmpdir())) {
    rmSync(previous.projectPath, { recursive: true, force: true });
  }

  const extractPath = mkdtempSync(join(tmpdir(), `dep-analyzer-${randomUUID()}-`));

  try {
    const zip = new AdmZip(req.file.buffer);
    zip.extractAllTo(extractPath, true);

    // If zip contains a single root folder, use that as projectPath
    const { readdirSync, statSync } = await import('fs');
    const entries = readdirSync(extractPath);
    const projectPath =
      entries.length === 1 && statSync(join(extractPath, entries[0])).isDirectory()
        ? join(extractPath, entries[0])
        : extractPath;

    const graph = await buildGraph(projectPath);
    setAnalysis(projectPath, graph);

    const cycles = detectCycles(graph);

    let edgeCount = 0;
    for (const node of graph.values()) {
      edgeCount += node.imports.length + node.dynamicImports.length;
    }

    res.json({ fileCount: graph.size, edgeCount, cycleCount: cycles.length });
  } catch (err) {
    rmSync(extractPath, { recursive: true, force: true });
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

export { router as analyzeRouter };
