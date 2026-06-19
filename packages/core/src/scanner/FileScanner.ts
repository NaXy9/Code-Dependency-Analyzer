import { readdir } from 'fs/promises';
import { join, extname } from 'path';

const DEFAULT_EXTENSIONS = new Set(['.js', '.ts', '.jsx', '.tsx']);

const DEFAULT_IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage',
  '.next',
  'out',
  '.cache',
]);

export interface ScanOptions {
  extensions?: string[];
  ignoreDirs?: string[];
}

export async function scanFiles(
  rootPath: string,
  options: ScanOptions = {}
): Promise<string[]> {
  const extensions = new Set(options.extensions ?? [...DEFAULT_EXTENSIONS]);
  const ignoreDirs = new Set(options.ignoreDirs ?? [...DEFAULT_IGNORED_DIRS]);

  const results: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!ignoreDirs.has(entry.name)) {
          await walk(fullPath);
        }
      } else if (entry.isFile() && extensions.has(extname(entry.name))) {
        results.push(fullPath);
      }
    }
  }

  await walk(rootPath);
  return results;
}
