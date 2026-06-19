import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { buildGraph } from './GraphBuilder';

describe('GraphBuilder', () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = join(tmpdir(), `dep-analyzer-${randomUUID()}`);
    await mkdir(join(tmp, 'src', 'components'), { recursive: true });
    await mkdir(join(tmp, 'src', 'utils'), { recursive: true });
  });

  afterEach(async () => {
    await rm(tmp, { recursive: true, force: true }).catch(() => {});
  });

  // Fixture:
  //   src/App.tsx         -> react, ./components/Button
  //   src/components/Button.tsx -> react
  //   src/utils/api.ts    -> (no imports)
  async function writeFixture() {
    await writeFile(
      join(tmp, 'src', 'App.tsx'),
      `import React from 'react';\nimport Button from './components/Button';`
    );
    await writeFile(
      join(tmp, 'src', 'components', 'Button.tsx'),
      `import React from 'react';`
    );
    await writeFile(join(tmp, 'src', 'utils', 'api.ts'), '');
  }

  it('creates a node for every scanned file', async () => {
    await writeFixture();

    const graph = await buildGraph(tmp);

    expect(graph.size).toBe(3);
  });

  it('populates outbound imports', async () => {
    await writeFixture();

    const graph = await buildGraph(tmp);
    const app = graph.get(join(tmp, 'src', 'App.tsx'))!;

    expect(app.imports).toHaveLength(1);
    expect(app.imports[0]).toBe(join(tmp, 'src', 'components', 'Button.tsx'));
  });

  it('populates inbound importedBy', async () => {
    await writeFixture();

    const graph = await buildGraph(tmp);
    const button = graph.get(join(tmp, 'src', 'components', 'Button.tsx'))!;

    expect(button.importedBy).toHaveLength(1);
    expect(button.importedBy[0]).toBe(join(tmp, 'src', 'App.tsx'));
  });

  it('separates external imports', async () => {
    await writeFixture();

    const graph = await buildGraph(tmp);
    const app = graph.get(join(tmp, 'src', 'App.tsx'))!;

    expect(app.externalImports).toContain('react');
    expect(app.imports.some((p) => p.includes('react'))).toBe(false);
  });

  it('tracks dynamic imports separately', async () => {
    await writeFile(
      join(tmp, 'src', 'App.tsx'),
      `const mod = import('./utils/api');`
    );
    await writeFile(join(tmp, 'src', 'utils', 'api.ts'), '');

    const graph = await buildGraph(tmp);
    const app = graph.get(join(tmp, 'src', 'App.tsx'))!;

    expect(app.imports).toHaveLength(0);
    expect(app.dynamicImports).toHaveLength(1);
    expect(app.dynamicImports[0]).toBe(join(tmp, 'src', 'utils', 'api.ts'));
  });

  it('handles unresolvable imports without crashing', async () => {
    await writeFile(
      join(tmp, 'src', 'App.tsx'),
      `import { x } from './does-not-exist';`
    );

    const graph = await buildGraph(tmp);

    expect(graph.size).toBe(1);
    expect(graph.get(join(tmp, 'src', 'App.tsx'))!.imports).toHaveLength(0);
  });

  it('nodes with no imports have empty arrays', async () => {
    await writeFile(join(tmp, 'src', 'utils', 'api.ts'), '');

    const graph = await buildGraph(tmp);
    const api = graph.get(join(tmp, 'src', 'utils', 'api.ts'))!;

    expect(api.imports).toHaveLength(0);
    expect(api.importedBy).toHaveLength(0);
    expect(api.externalImports).toHaveLength(0);
  });
});
