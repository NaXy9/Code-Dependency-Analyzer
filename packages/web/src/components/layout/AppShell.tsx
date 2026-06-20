import { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0a0a0f' }}>
      <Sidebar />
      <div
        className="flex-1 flex flex-col overflow-hidden min-w-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #1e1e2e 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {children}
      </div>
    </div>
  );
}
