import { readFile } from 'fs/promises';
import { extname } from 'path';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';

const traverse = typeof _traverse === 'function' ? _traverse : (_traverse as any).default;

export interface ParsedImport {
  source: string;
  isDynamic: boolean;
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

export function parseImportsFromContent(
  content: string,
  filePath: string
): ParsedImport[] {
  const ast = parse(content, {
    sourceType: 'module',
    plugins: getBabelPlugins(filePath),
    errorRecovery: true,
  });

  const imports: ParsedImport[] = [];

  traverse(ast, {
    ImportDeclaration({ node }: any) {
      imports.push({ source: node.source.value, isDynamic: false });
    },

    ExportNamedDeclaration({ node }: any) {
      if (node.source) {
        imports.push({ source: node.source.value, isDynamic: false });
      }
    },

    ExportAllDeclaration({ node }: any) {
      imports.push({ source: node.source.value, isDynamic: false });
    },

    ImportExpression({ node }: any) {
      if (node.source?.type === 'StringLiteral') {
        imports.push({ source: node.source.value, isDynamic: true });
      }
    },
  });

  return imports;
}

// Чтение файла с диска и парсинг
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
