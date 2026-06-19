import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { scanFiles } from './FileScanner';

describe('FileScanner', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `dep-analyzer-test-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('находит .ts, .tsx, .js, .jsx файлы', async () => {
    await writeFile(join(tmpDir, 'App.tsx'), '');
    await writeFile(join(tmpDir, 'utils.ts'), '');
    await writeFile(join(tmpDir, 'index.js'), '');
    await writeFile(join(tmpDir, 'style.css'), '');

    const files = await scanFiles(tmpDir);

    expect(files).toHaveLength(3);
    expect(files.some(f => f.endsWith('App.tsx'))).toBe(true);
    expect(files.some(f => f.endsWith('utils.ts'))).toBe(true);
    expect(files.some(f => f.endsWith('index.js'))).toBe(true);
  });

  it('игнорирует node_modules и dist', async () => {
    await mkdir(join(tmpDir, 'src'));
    await mkdir(join(tmpDir, 'node_modules', 'lodash'), { recursive: true });
    await mkdir(join(tmpDir, 'dist'));

    await writeFile(join(tmpDir, 'src', 'index.ts'), '');
    await writeFile(join(tmpDir, 'node_modules', 'lodash', 'index.js'), '');
    await writeFile(join(tmpDir, 'dist', 'index.js'), '');

    const files = await scanFiles(tmpDir);

    expect(files).toHaveLength(1);
    expect(files[0]).toContain('src');
  });

  it('рекурсивно обходит поддиректории', async () => {
    await mkdir(join(tmpDir, 'src', 'components'), { recursive: true });
    await mkdir(join(tmpDir, 'src', 'hooks'), { recursive: true });

    await writeFile(join(tmpDir, 'src', 'index.ts'), '');
    await writeFile(join(tmpDir, 'src', 'components', 'Button.tsx'), '');
    await writeFile(join(tmpDir, 'src', 'hooks', 'useData.ts'), '');

    const files = await scanFiles(tmpDir);

    expect(files).toHaveLength(3);
  });

  it('поддерживает кастомные расширения', async () => {
    await writeFile(join(tmpDir, 'index.ts'), '');
    await writeFile(join(tmpDir, 'utils.js'), '');

    const files = await scanFiles(tmpDir, { extensions: ['.ts'] });

    expect(files).toHaveLength(1);
    expect(files[0]).toContain('index.ts');
  });

  it('поддерживает кастомный список игнорируемых папок', async () => {
    await mkdir(join(tmpDir, '__mocks__'));
    await writeFile(join(tmpDir, 'index.ts'), '');
    await writeFile(join(tmpDir, '__mocks__', 'api.ts'), '');

    const files = await scanFiles(tmpDir, { ignoreDirs: ['__mocks__'] });

    expect(files).toHaveLength(1);
  });
});
