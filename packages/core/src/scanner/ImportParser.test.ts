import { describe, it, expect } from 'vitest';
import { parseImportsFromContent } from './ImportParser';

describe('ImportParser', () => {
  it('parses named imports', () => {
    const imports = parseImportsFromContent(
      `import { useState, useEffect } from 'react';`,
      'test.ts'
    );

    expect(imports).toHaveLength(1);
    expect(imports[0]).toEqual({ source: 'react', isDynamic: false });
  });

  it('parses default import', () => {
    const imports = parseImportsFromContent(
      `import Button from './components/Button';`,
      'test.ts'
    );

    expect(imports[0]).toEqual({ source: './components/Button', isDynamic: false });
  });

  it('parses side-effect import', () => {
    const imports = parseImportsFromContent(
      `import './styles/globals.css';`,
      'test.ts'
    );

    expect(imports[0].source).toBe('./styles/globals.css');
  });

  it('parses multiple imports preserving order', () => {
    const code = `
      import React from 'react';
      import { api } from '../utils/api';
      import Button from './Button';
    `;

    const imports = parseImportsFromContent(code, 'test.tsx');

    expect(imports.map(i => i.source)).toEqual([
      'react',
      '../utils/api',
      './Button',
    ]);
  });

  it('parses named re-export', () => {
    const imports = parseImportsFromContent(
      `export { Button } from './Button';`,
      'index.ts'
    );

    expect(imports[0].source).toBe('./Button');
  });

  it('parses wildcard re-export', () => {
    const imports = parseImportsFromContent(
      `export * from './utils';`,
      'index.ts'
    );

    expect(imports[0].source).toBe('./utils');
  });

  it('parses dynamic import', () => {
    const imports = parseImportsFromContent(
      `const mod = import('./heavy-module');`,
      'test.ts'
    );

    expect(imports[0]).toEqual({ source: './heavy-module', isDynamic: true });
  });

  it('parses JSX files', () => {
    const code = `
      import React from 'react';
      export default function App() { return <div />; }
    `;

    const imports = parseImportsFromContent(code, 'App.tsx');

    expect(imports).toHaveLength(1);
    expect(imports[0].source).toBe('react');
  });

  it('parses type-only imports', () => {
    const code = `
      import type { FC } from 'react';
      import { useState } from 'react';
    `;

    const imports = parseImportsFromContent(code, 'test.ts');

    expect(imports).toHaveLength(2);
  });

  it('recovers from syntax errors', () => {
    const code = `
      import { good } from './good';
      this is not valid js !!!
    `;

    const imports = parseImportsFromContent(code, 'broken.ts');

    expect(imports.some(i => i.source === './good')).toBe(true);
  });
});
