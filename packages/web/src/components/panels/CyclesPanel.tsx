import { RefreshCw, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useCycles } from '../../hooks';
import { useApp } from '../../store/AppContext';

type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

function getSeverity(length: number): Severity {
  if (length >= 5) return 'HIGH';
  if (length >= 3) return 'MEDIUM';
  return 'LOW';
}

const SEVERITY_STYLES: Record<Severity, { card: React.CSSProperties; badge: string; icon: string }> = {
  LOW:    { card: { background: 'rgba(245,158,11,0.04)', borderColor: 'rgba(245,158,11,0.2)' },  badge: 'border-amber-500/30 text-amber-500',  icon: 'text-amber-500' },
  MEDIUM: { card: { background: 'rgba(249,115,22,0.04)', borderColor: 'rgba(249,115,22,0.2)' },  badge: 'border-orange-500/30 text-orange-500', icon: 'text-orange-500' },
  HIGH:   { card: { background: 'rgba(239,68,68,0.04)',  borderColor: 'rgba(239,68,68,0.2)' },   badge: 'border-red-500/30 text-red-500',       icon: 'text-red-500' },
};

export function CyclesPanel() {
  const { currentProjectKey } = useApp();
  const { data: cycles, isLoading, error } = useCycles(currentProjectKey);

  if (isLoading) return <Shell><span className="font-mono text-sm text-muted-foreground animate-pulse">RESOLVING_CYCLES...</span></Shell>;
  if (error)     return <Shell><span className="font-mono text-sm text-destructive">ERROR: {(error as Error).message}</span></Shell>;

  if (!cycles?.length) {
    return (
      <Shell>
        <div className="text-center space-y-3">
          <RefreshCw size={48} className="mx-auto text-green-500 opacity-50" />
          <div className="font-mono text-lg text-green-500">NO_CIRCULAR_DEPENDENCIES</div>
          <div className="font-mono text-xs text-muted-foreground">Architecture is clean.</div>
        </div>
      </Shell>
    );
  }

  return (
    <div className="p-6 space-y-3 max-w-4xl mx-auto">
      <div className="font-mono text-[11px] text-muted-foreground mb-4">
        {cycles.length} CYCLE{cycles.length !== 1 ? 'S' : ''} DETECTED
        <span className="text-muted-foreground/40"> — refactor to break circular dependencies</span>
      </div>
      {cycles.map((cycle, i) => {
        const sev = getSeverity(cycle.length);
        const styles = SEVERITY_STYLES[sev];
        return (
          <Card key={i} style={{ border: '1px solid', ...styles.card }}>
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw size={13} className={styles.icon} />
                  <span className="font-mono text-sm font-bold text-foreground">CYCLE_{String(i + 1).padStart(3, '0')}</span>
                </div>
                <Badge variant="outline" className={`font-mono text-[10px] ${styles.badge}`}>{sev}_SEVERITY</Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {cycle.map((file, j) => (
                  <div key={j} className="flex items-center gap-1.5">
                    <div className="bg-background/50 border border-border/50 rounded px-2 py-1 font-mono text-xs text-foreground max-w-[180px] truncate" title={file}>
                      {file}
                    </div>
                    {j < cycle.length - 1
                      ? <ArrowRight size={12} className="text-muted-foreground/40 flex-shrink-0" />
                      : <RefreshCw size={12} className={`flex-shrink-0 animate-spin-slow ${styles.icon} opacity-60`} />
                    }
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 flex items-center justify-center h-full">{children}</div>;
}
