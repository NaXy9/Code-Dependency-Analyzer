import { describe, it, expect } from 'vitest';
import { parseImportsFromContent } from './ImportParser';

describe('ImportParser', () => {
  it('парсит именованные импорты', () => {
    const code = `import { useState, useEffect } from 'react';`;
    const imports = parseImportsFromContent(code, 'test.ts');

    expect(imports).toHaveLength(1);
    expect(imports[0]).toEqual({ source: 'react', isDynamic: false });
  });

  it('парсит дефолтный импорт', () => {
    const code = `import Button from './components/Button';`;
    const imports = parseImportsFromContent(code, 'test.ts');

    expect(imports[0].source).toBe('./components/Button');
    expect(imports[0].isDynamic).toBe(false);
  });

  it('парсит side-effect импорт', () => {
    const code = `import './styles/globals.css';`;
    const imports = parseImportsFromContent(code, 'test.ts');

    expect(imports[0].source).toBe('./styles/globals.css');
  });

  it('парсит несколько импортов', () => {
    const code = `
      import React from 'react';
      import { api } from '../utils/api';
      import Button from './Button';
    `;
    const imports = parseImportsFromContent(code, 'test.tsx');

    expect(imports).toHaveLength(3);
    expect(imports.map(i => i.source)).toEqual([
      'react',
      '../utils/api',
      './Button',
    ]);
  });

  it('парсит re-export (named)', () => {
    const code = `export { Button } from './Button';`;
    const imports = parseImportsFromContent(code, 'index.ts');

    expect(imports[0].source).toBe('./Button');
  });

  it('парсит re-export (star)', () => {
    const code = `export * from './utils';`;
    const imports = parseImportsFromContent(code, 'index.ts');

    expect(imports[0].source).toBe('./utils');
  });

  it('парсит динамический import()', () => {
    const code = `const mod = import('./heavy-module');`;
    const imports = parseImportsFromContent(code, 'test.ts');

    expect(imports[0]).toEqual({ source: './heavy-module', isDynamic: true });
  });

  it('парсит JSX/TSX файлы', () => {
    const code = `
      import React from 'react';
      export default function App() { return <div />; }
    `;
    const imports = parseImportsFromContent(code, 'App.tsx');

    expect(imports).toHaveLength(1);
    expect(imports[0].source).toBe('react');
  });

  it('парсит TypeScript type imports', () => {
    const code = `
      import type { FC } from 'react';
      import { useState } from 'react';
    `;
    const imports = parseImportsFromContent(code, 'test.ts');

    expect(imports).toHaveLength(2);
    expect(imports.every(i => i.source === 'react')).toBe(true);
  });

  it('не падает на синтаксических ошибках', () => {
    const code = `
      import { good } from './good';
      this is not valid js !!!
    `;
    const imports = parseImportsFromContent(code, 'broken.ts');

    expect(imports.some(i => i.source === './good')).toBe(true);
  });
});
