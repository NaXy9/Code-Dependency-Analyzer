import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { scanFiles } from './FileScanner';

describe('FileScanner', () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = join(tmpdir(), `dep-analyzer-${randomUUID()}`);
    await mkdir(tmp, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmp, { recursive: true, force: true }).catch(() => {});
  });

  it('collects .ts, .tsx, .js, .jsx files', async () => {
    await writeFile(join(tmp, 'App.tsx'), '');
    await writeFile(join(tmp, 'utils.ts'), '');
    await writeFile(join(tmp, 'index.js'), '');
    await writeFile(join(tmp, 'style.css'), '');

    const files = await scanFiles(tmp);

    expect(files).toHaveLength(3);
    expect(files.some(f => f.endsWith('App.tsx'))).toBe(true);
    expect(files.some(f => f.endsWith('utils.ts'))).toBe(true);
    expect(files.some(f => f.endsWith('index.js'))).toBe(true);
  });

  it('ignores node_modules and dist', async () => {
    await mkdir(join(tmp, 'src'));
    await mkdir(join(tmp, 'node_modules', 'lodash'), { recursive: true });
    await mkdir(join(tmp, 'dist'));

    await writeFile(join(tmp, 'src', 'index.ts'), '');
    await writeFile(join(tmp, 'node_modules', 'lodash', 'index.js'), '');
    await writeFile(join(tmp, 'dist', 'index.js'), '');

    const files = await scanFiles(tmp);

    expect(files).toHaveLength(1);
    expect(files[0]).toContain('src');
  });

  it('scans subdirectories recursively', async () => {
    await mkdir(join(tmp, 'src', 'components'), { recursive: true });
    await mkdir(join(tmp, 'src', 'hooks'), { recursive: true });

    await writeFile(join(tmp, 'src', 'index.ts'), '');
    await writeFile(join(tmp, 'src', 'components', 'Button.tsx'), '');
    await writeFile(join(tmp, 'src', 'hooks', 'useData.ts'), '');

    const files = await scanFiles(tmp);

    expect(files).toHaveLength(3);
  });

  it('respects custom extensions filter', async () => {
    await writeFile(join(tmp, 'index.ts'), '');
    await writeFile(join(tmp, 'utils.js'), '');

    const files = await scanFiles(tmp, { extensions: ['.ts'] });

    expect(files).toHaveLength(1);
    expect(files[0]).toContain('index.ts');
  });

  it('respects custom ignored dirs', async () => {
    await mkdir(join(tmp, '__mocks__'));
    await writeFile(join(tmp, 'index.ts'), '');
    await writeFile(join(tmp, '__mocks__', 'api.ts'), '');

    const files = await scanFiles(tmp, { ignoreDirs: ['__mocks__'] });

    expect(files).toHaveLength(1);
  });
});
