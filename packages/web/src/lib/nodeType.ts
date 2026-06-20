export type NodeType = 'component' | 'hook' | 'util' | 'store' | 'page';

/**
 * Detects node type by path heuristics.
 * Order matters: hook check before component since hooks often live in components/.
 */
export function detectNodeType(filePath: string): NodeType {
  const p = filePath.replace(/\\/g, '/').toLowerCase();

  if (/\/use[a-z]/.test(p) || /\/(hooks?)\//i.test(p)) return 'hook';
  if (/\/(store|stores|state|redux|zustand|slice|slices)\//.test(p)) return 'store';
  if (/\/(pages?|views?|screens?|routes?|app\/routes?)\//.test(p)) return 'page';
  if (/\/(components?|ui|widgets?|shared)\//.test(p)) return 'component';
  return 'util';
}

export const NODE_COLORS: Record<NodeType, string> = {
  component: '#3b82f6', // blue-500
  hook: '#a855f7',      // purple-500
  util: '#22c55e',      // green-500
  store: '#f59e0b',     // amber-500
  page: '#ec4899',      // pink-500
};

/** Dimmed versions for non-selected nodes when something is selected */
export const NODE_COLORS_DIM: Record<NodeType, string> = {
  component: '#1e3a5f',
  hook: '#3b1a5c',
  util: '#14432a',
  store: '#45320a',
  page: '#4a1030',
};
