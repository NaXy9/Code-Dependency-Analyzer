import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { resolveImport, resolveImports } from './PathResolver';

describe('PathResolver', () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = join(tmpdir(), `dep-analyzer-${randomUUID()}`);
    await mkdir(tmp, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmp, { recursive: true, force: true }).catch(() => {});
  });

  it('marks bare specifiers as external', async () => {
    const result = await resolveImport(
      { source: 'react', isDynamic: false },
      join(tmp, 'index.ts')
    );

    expect(result.isExternal).toBe(true);
    expect(result.absolutePath).toBeNull();
  });

  it('marks scoped packages as external', async () => {
    const result = await resolveImport(
      { source: '@tanstack/react-query', isDynamic: false },
      join(tmp, 'index.ts')
    );

    expect(result.isExternal).toBe(true);
  });

  it('resolves import with explicit extension', async () => {
    await writeFile(join(tmp, 'Button.tsx'), '');

    const result = await resolveImport(
      { source: './Button.tsx', isDynamic: false },
      join(tmp, 'index.ts')
    );

    expect(result.absolutePath).toBe(join(tmp, 'Button.tsx'));
  });

  it('probes .ts extension', async () => {
    await writeFile(join(tmp, 'utils.ts'), '');

    const result = await resolveImport(
      { source: './utils', isDynamic: false },
      join(tmp, 'index.ts')
    );

    expect(result.absolutePath).toBe(join(tmp, 'utils.ts'));
  });

  it('probes .tsx extension', async () => {
    await writeFile(join(tmp, 'Button.tsx'), '');

    const result = await resolveImport(
      { source: './Button', isDynamic: false },
      join(tmp, 'index.ts')
    );

    expect(result.absolutePath).toBe(join(tmp, 'Button.tsx'));
  });

  it('resolves directory to index file', async () => {
    await mkdir(join(tmp, 'components'));
    await writeFile(join(tmp, 'components', 'index.ts'), '');

    const result = await resolveImport(
      { source: './components', isDynamic: false },
      join(tmp, 'App.tsx')
    );

    expect(result.absolutePath).toBe(join(tmp, 'components', 'index.ts'));
  });

  it('resolves parent directory traversal', async () => {
    await mkdir(join(tmp, 'src', 'components'), { recursive: true });
    await mkdir(join(tmp, 'src', 'utils'), { recursive: true });
    await writeFile(join(tmp, 'src', 'utils', 'api.ts'), '');

    const result = await resolveImport(
      { source: '../utils/api', isDynamic: false },
      join(tmp, 'src', 'components', 'Button.tsx')
    );

    expect(result.absolutePath).toBe(join(tmp, 'src', 'utils', 'api.ts'));
  });

  it('returns null for unresolvable import', async () => {
    const result = await resolveImport(
      { source: './missing', isDynamic: false },
      join(tmp, 'index.ts')
    );

    expect(result.absolutePath).toBeNull();
    expect(result.isExternal).toBe(false);
  });

  it('forwards isDynamic flag', async () => {
    const result = await resolveImport(
      { source: 'react', isDynamic: true },
      join(tmp, 'index.ts')
    );

    expect(result.isDynamic).toBe(true);
  });

  it('resolveImports handles a batch', async () => {
    await writeFile(join(tmp, 'utils.ts'), '');
    await writeFile(join(tmp, 'Button.tsx'), '');

    const results = await resolveImports(
      [
        { source: 'react', isDynamic: false },
        { source: './utils', isDynamic: false },
        { source: './Button', isDynamic: false },
      ],
      join(tmp, 'index.ts')
    );

    expect(results).toHaveLength(3);
    expect(results[0].isExternal).toBe(true);
    expect(results[1].absolutePath).toBe(join(tmp, 'utils.ts'));
    expect(results[2].absolutePath).toBe(join(tmp, 'Button.tsx'));
  });
});
