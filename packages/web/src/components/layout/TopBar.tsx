import { type ReactNode } from 'react';

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <div
      className="h-12 flex-shrink-0 flex items-center justify-between px-6 gap-4"
      style={{
        borderBottom: '1px solid rgba(99,102,241,0.1)',
        background: 'rgba(10,10,15,0.85)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-baseline gap-3 min-w-0">
        <span
          className="font-mono text-sm uppercase tracking-wider flex-shrink-0"
          style={{ color: '#e2e8f0' }}
        >
          {title}
        </span>
        {subtitle && (
          <span
            className="font-mono text-[11px] truncate"
            style={{ color: '#6b7280' }}
            title={subtitle}
          >
            {subtitle}
          </span>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
