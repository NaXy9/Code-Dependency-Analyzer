export type NodeType = 'component' | 'hook' | 'util' | 'store' | 'page' | 'module';

export function detectNodeType(filePath: string): NodeType {
  const p = filePath.replace(/\\/g, '/').toLowerCase();
  if (/\/use[a-z]/.test(p) || /\/(hooks?)\//i.test(p)) return 'hook';
  if (/\/(store|stores|state|redux|zustand|slice|slices)\//.test(p)) return 'store';
  if (/\/(pages?|views?|screens?|routes?|app\/routes?)\//.test(p)) return 'page';
  if (/\/(components?|ui|widgets?|shared)\//.test(p)) return 'component';
  // Plain TS/JS without JSX → module (configs, helpers, barrel exports)
  if (/\.(ts|js|mjs|cjs)$/.test(p) && !/\.(tsx|jsx)$/.test(p)) return 'module';
  return 'util';
}

export const NODE_COLORS: Record<NodeType, string> = {
  component: '#6366f1',
  hook:      '#8b5cf6',
  util:      '#22c55e',
  store:     '#f59e0b',
  page:      '#ec4899',
  module:    '#06b6d4',
};
