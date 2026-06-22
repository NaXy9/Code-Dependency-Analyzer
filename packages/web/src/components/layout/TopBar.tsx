import { type ReactNode } from 'react';

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <div className="h-12 flex-shrink-0 flex items-center justify-between px-6 gap-4 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur">
      <div className="flex items-baseline gap-3 min-w-0">
        <span className="font-mono text-sm uppercase tracking-wider text-white/90 flex-shrink-0">
          {title}
        </span>
        {subtitle && (
          <span
            className="font-mono text-[11px] truncate text-white/30"
            title={subtitle}
          >
            {subtitle}
          </span>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      )}
    </div>
  );
}
