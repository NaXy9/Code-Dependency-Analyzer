import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCycles } from '../../hooks';
import { useApp } from '../../store/AppContext';

function severity(length: number): { label: string; color: string } {
  if (length >= 5) return { label: 'HIGH', color: '#f97316' };
  if (length >= 3) return { label: 'MED', color: '#f59e0b' };
  return { label: 'LOW', color: '#22c55e' };
}

export function CyclesPanel() {
  const { currentProjectPath } = useApp();
  const { data: cycles, isLoading, error } = useCycles(currentProjectPath);

  if (isLoading) {
    return (
      <Shell>
        <span className="font-mono text-sm animate-pulse" style={{ color: '#6b7280' }}>
          RESOLVING_CYCLES...
        </span>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <span className="font-mono text-sm" style={{ color: '#f97316' }}>
          ERROR: {(error as Error).message}
        </span>
      </Shell>
    );
  }

  if (!cycles?.length) {
    return (
      <Shell>
        <div className="text-center space-y-2">
          <div className="font-mono text-3xl" style={{ color: '#22c55e' }}>✓</div>
          <div className="font-mono text-sm" style={{ color: '#e2e8f0' }}>
            NO_CYCLES_DETECTED
          </div>
          <div className="font-mono text-[11px]" style={{ color: '#374151' }}>
            dependency graph is acyclic
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <div className="p-6 space-y-3 max-w-3xl mx-auto">
      <div className="font-mono text-[11px] mb-4" style={{ color: '#6b7280' }}>
        {cycles.length} CYCLE{cycles.length !== 1 ? 'S' : ''} DETECTED
        <span style={{ color: '#374151' }}> — refactor to break circular dependencies</span>
      </div>

      {cycles.map((cycle, i) => {
        const sev = severity(cycle.length);
        return (
          <Card
            key={i}
            style={{
              background: 'rgba(249,115,22,0.04)',
              border: '1px solid rgba(249,115,22,0.2)',
            }}
          >
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#6b7280' }}>
                  CYCLE_{String(i + 1).padStart(3, '0')}
                </span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] h-5 px-1.5"
                  style={{ borderColor: `${sev.color}50`, color: sev.color }}
                >
                  {sev.label}
                </Badge>
                <span className="font-mono text-[10px]" style={{ color: '#374151' }}>
                  {cycle.length} nodes
                </span>
              </div>
            </CardHeader>

            <CardContent className="px-4 pb-4">
              <div className="space-y-1">
                {cycle.map((file, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <span
                      className="font-mono text-[11px] w-4 flex-shrink-0 mt-px select-none"
                      style={{ color: 'rgba(249,115,22,0.35)' }}
                    >
                      {j === 0 ? '┌' : j === cycle.length - 1 ? '└' : '│'}
                    </span>
                    <span
                      className="font-mono text-[11px] break-all leading-relaxed"
                      style={{ color: '#9ca3af' }}
                    >
                      {file}
                    </span>
                  </div>
                ))}
                {/* close arrow back to root */}
                <div className="flex items-center gap-2">
                  <span
                    className="font-mono text-[11px] w-4 select-none"
                    style={{ color: 'rgba(249,115,22,0.25)' }}
                  >
                    ↺
                  </span>
                  <span className="font-mono text-[11px] break-all" style={{ color: 'rgba(249,115,22,0.35)' }}>
                    {cycle[0]}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex items-center justify-center h-full">{children}</div>
  );
}
