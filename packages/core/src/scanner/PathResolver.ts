import { access } from 'fs/promises';
import { dirname, resolve, extname, join } from 'path';
import type { ParsedImport } from './ImportParser';

const RESOLVE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

export interface ResolvedImport {
  source: string;
  absolutePath: string | null;
  isExternal: boolean;
  isDynamic: boolean;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function tryResolve(basePath: string): Promise<string | null> {
  if (extname(basePath) && (await fileExists(basePath))) {
    return basePath;
  }

  for (const ext of RESOLVE_EXTENSIONS) {
    const candidate = basePath + ext;
    if (await fileExists(candidate)) return candidate;
  }

  for (const ext of RESOLVE_EXTENSIONS) {
    const candidate = join(basePath, 'index' + ext);
    if (await fileExists(candidate)) return candidate;
  }

  return null;
}

export async function resolveImport(
  parsed: ParsedImport,
  fromFile: string
): Promise<ResolvedImport> {
  const { source, isDynamic } = parsed;

  if (!source.startsWith('.') && !source.startsWith('/')) {
    return { source, absolutePath: null, isExternal: true, isDynamic };
  }

  const baseDir = dirname(fromFile);
  const basePath = resolve(baseDir, source);
  const absolutePath = await tryResolve(basePath);

  return { source, absolutePath, isExternal: false, isDynamic };
}

export async function resolveImports(
  imports: ParsedImport[],
  fromFile: string
): Promise<ResolvedImport[]> {
  return Promise.all(imports.map((imp) => resolveImport(imp, fromFile)));
}
