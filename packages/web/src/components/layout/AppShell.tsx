import { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'hsl(240 10% 6%)' }}
    >
      <Sidebar />
      <div
        className="flex-1 flex flex-col overflow-hidden min-w-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), ' +
            'linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      >
        {children}
      </div>
    </div>
  );
}
