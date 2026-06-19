import { readFile } from 'fs/promises';
import { extname } from 'path';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';

// @babel/traverse в CommonJS-окружении экспортирует функцию через .default
const traverse = typeof _traverse === 'function' ? _traverse : (_traverse as any).default;

export interface ParsedImport {
  source: string;      // './components/Button', 'react', '@/utils' и т.д.
  isDynamic: boolean;  // true для import('./heavy-chunk')
}

export interface ParseResult {
  filePath: string;
  imports: ParsedImport[];
  error?: string;
}

function getBabelPlugins(filePath: string) {
  const ext = extname(filePath).toLowerCase();
  const plugins: any[] = [];

  if (ext === '.ts' || ext === '.tsx') {
    plugins.push('typescript');
  }
  if (ext === '.jsx' || ext === '.tsx') {
    plugins.push('jsx');
  }

  return plugins;
}

// Парсит из строки — удобно для тестов и кэширования
export function parseImportsFromContent(
  content: string,
  filePath: string
): ParsedImport[] {
  const ast = parse(content, {
    sourceType: 'module',
    plugins: getBabelPlugins(filePath),
    errorRecovery: true, // не падаем на синтаксических ошибках в чужом коде
  });

  const imports: ParsedImport[] = [];

  traverse(ast, {
    // import x from './module'
    // import { x } from './module'
    // import './styles'
    ImportDeclaration({ node }: any) {
      imports.push({ source: node.source.value, isDynamic: false });
    },

    // export { x } from './module'
    ExportNamedDeclaration({ node }: any) {
      if (node.source) {
        imports.push({ source: node.source.value, isDynamic: false });
      }
    },

    // export * from './module'
    ExportAllDeclaration({ node }: any) {
      imports.push({ source: node.source.value, isDynamic: false });
    },

    // import('./heavy-module') — в Babel 8 это ImportExpression, не CallExpression
    ImportExpression({ node }: any) {
      if (node.source?.type === 'StringLiteral') {
        imports.push({ source: node.source.value, isDynamic: true });
      }
    },
  });

  return imports;
}

// Читает файл с диска и парсит
export async function parseImports(filePath: string): Promise<ParseResult> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const imports = parseImportsFromContent(content, filePath);
    return { filePath, imports };
  } catch (error) {
    return {
      filePath,
      imports: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
