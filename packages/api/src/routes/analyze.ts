import { Router } from 'express';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdtempSync, rmSync, existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { randomUUID } from 'crypto';
import multer from 'multer';
import AdmZip from 'adm-zip';
import { buildGraph, detectCycles } from '@dep-analyzer/core';
import { setAnalysis, getAnalysis, deleteAnalysis } from '../store';
import { persistProject, deletePersistedProject } from '../persistence';

const router: ReturnType<typeof Router> = Router();

// Keep archives in memory — no temp files for the upload itself
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.MAX_UPLOAD_MB ?? 50) * 1024 * 1024 },
});

/**
 * Detects the primary framework/technology of a project by reading
 * package.json dependencies and well-known config files.
 * More specific frameworks are checked before their base (e.g. Next.js before React).
 */
function detectFramework(projectPath: string): string {
  // Config-file shortcuts (no package.json needed)
  const configChecks: [string, string][] = [
    ['next.config.js',   'Next.js'],
    ['next.config.ts',   'Next.js'],
    ['nuxt.config.ts',   'Nuxt'],
    ['nuxt.config.js',   'Nuxt'],
    ['angular.json',     'Angular'],
    ['svelte.config.js', 'Svelte'],
    ['svelte.config.ts', 'Svelte'],
    ['remix.config.js',  'Remix'],
    ['astro.config.mjs', 'Astro'],
    ['astro.config.ts',  'Astro'],
  ];

  for (const [file, name] of configChecks) {
    if (existsSync(join(projectPath, file))) return name;
  }

  // package.json dependency analysis
  const pkgPath = join(projectPath, 'package.json');
  if (!existsSync(pkgPath)) return 'JS/TS';

  let deps: Record<string, string> = {};
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    deps = { ...pkg.dependencies, ...pkg.devDependencies };
  } catch {
    return 'JS/TS';
  }

  // Order matters: more specific frameworks first
  if ('next'             in deps) return 'Next.js';
  if ('nuxt'             in deps) return 'Nuxt';
  if ('@angular/core'    in deps) return 'Angular';
  if ('gatsby'           in deps) return 'Gatsby';
  if ('@remix-run/react' in deps) return 'Remix';
  if ('astro'            in deps) return 'Astro';
  if ('vue'              in deps) return 'Vue';
  if ('svelte'           in deps) return 'Svelte';
  if ('solid-js'         in deps) return 'Solid';
  if ('react'            in deps) return 'React';
  if ('@nestjs/core'     in deps) return 'NestJS';
  if ('express'          in deps) return 'Express';
  if ('fastify'          in deps) return 'Fastify';
  if ('koa'              in deps) return 'Koa';
  if ('hono'             in deps) return 'Hono';

  return 'JS/TS';
}

// ── POST /api/analyze ─────────────────────────────────────────────────────────
router.post('/', upload.single('archive'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Field "archive" (.zip) is required' });
    return;
  }

  if (!req.file.originalname.toLowerCase().endsWith('.zip')) {
    res.status(400).json({ error: 'Only .zip archives are supported' });
    return;
  }

  // projectId must be provided by the client so that the frontend and backend
  // share the same identifier (used as React Query cache key and persistence key)
  const projectId = (req.body?.projectId as string | undefined)?.trim();
  if (!projectId) {
    res.status(400).json({ error: 'Field "projectId" is required' });
    return;
  }

  // Clean up the previous temp extraction dir for this project (if any)
  const previous = getAnalysis(projectId);
  if (previous?.projectPath.startsWith(tmpdir())) {
    rmSync(previous.projectPath, { recursive: true, force: true });
  }

  const extractPath = mkdtempSync(join(tmpdir(), `dep-analyzer-${randomUUID()}-`));

  try {
    const zip = new AdmZip(req.file.buffer);
    zip.extractAllTo(extractPath, true);

    // If zip contains a single root folder, descend into it
    const entries = readdirSync(extractPath);
    const projectPath =
      entries.length === 1 && statSync(join(extractPath, entries[0])).isDirectory()
        ? join(extractPath, entries[0])
        : extractPath;

    const graph = await buildGraph(projectPath);
    const cycles = detectCycles(graph);

    let edgeCount = 0;
    for (const node of graph.values()) {
      edgeCount += node.imports.length + node.dynamicImports.length;
    }

    const framework = detectFramework(projectPath);

    // Update in-memory store and persist to disk
    setAnalysis(projectId, projectPath, graph);
    persistProject(projectId, projectPath, framework, graph);

    res.json({ fileCount: graph.size, edgeCount, cycleCount: cycles.length, framework });
  } catch (err) {
    rmSync(extractPath, { recursive: true, force: true });
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// DELETE /api/analyze/:projectId
router.delete('/:projectId', (req, res) => {
  const { projectId } = req.params;

  // Clean up the temp dir if it's still around
  const analysis = getAnalysis(projectId);
  if (analysis?.projectPath.startsWith(tmpdir())) {
    rmSync(analysis.projectPath, { recursive: true, force: true });
  }

  deleteAnalysis(projectId);
  deletePersistedProject(projectId);

  res.json({ ok: true });
});

export { router as analyzeRouter };
