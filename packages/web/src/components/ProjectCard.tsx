import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '../api/client';
import { useApp } from '../store/AppContext';
import type { Project } from '../store/projectsStore';

interface Props {
  project: Project;
  onOpen: () => void;
}

export function ProjectCard({ project, onOpen }: Props) {
  const { updateProject } = useApp();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => api.analyze(project.path),
    onSuccess: (data) => {
      updateProject(project.id, {
        summary: data,
        lastAnalyzed: new Date().toISOString(),
      });
      // Bust the cached graph/cycles/metrics for this project path
      queryClient.invalidateQueries({ queryKey: ['graph', project.path] });
      queryClient.invalidateQueries({ queryKey: ['cycles', project.path] });
      queryClient.invalidateQueries({ queryKey: ['metrics', project.path] });
      onOpen();
    },
  });

  const { summary, name, path, lastAnalyzed } = project;

  return (
    <Card
      className="flex flex-col"
      style={{
        background: '#0f0f1a',
        border: '1px solid rgba(99,102,241,0.12)',
      }}
    >
      <CardHeader className="pb-3 space-y-1">
        <div className="flex items-start justify-between gap-3">
          <span className="font-mono text-sm leading-tight" style={{ color: '#e2e8f0' }}>
            {name}
          </span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge
              variant="outline"
              className="font-mono text-[10px] h-5 px-1.5 rounded"
              style={{ borderColor: 'rgba(99,102,241,0.3)', color: '#6366f1' }}
            >
              ts
            </Badge>
            {lastAnalyzed && (
              <span className="font-mono text-[10px]" style={{ color: '#6b7280' }}>
                {format(new Date(lastAnalyzed), 'yyyy-MM-dd')}
              </span>
            )}
          </div>
        </div>
        <p
          className="font-mono text-[11px] truncate"
          style={{ color: '#374151' }}
          title={path}
        >
          {path}
        </p>
      </CardHeader>

      {/* ── separator ── */}
      <div style={{ borderTop: '1px solid rgba(99,102,241,0.08)', marginInline: 24 }} />

      <CardContent className="py-4">
        {summary ? (
          <div className="grid grid-cols-3 gap-3">
            <StatCell label="FILES" value={summary.fileCount} />
            <StatCell label="DEPS" value={summary.edgeCount} />
            <StatCell
              label="CYCLES"
              value={summary.cycleCount}
              error={summary.cycleCount > 0}
            />
          </div>
        ) : (
          <div
            className="text-center py-3 rounded font-mono text-[11px]"
            style={{
              border: '1px dashed rgba(99,102,241,0.1)',
              color: '#374151',
            }}
          >
            NOT_ANALYZED
          </div>
        )}

        {mutation.isError && (
          <div
            className="mt-3 px-3 py-2 rounded font-mono text-[11px] break-all"
            style={{
              background: 'rgba(249,115,22,0.06)',
              border: '1px solid rgba(249,115,22,0.2)',
              color: '#f97316',
            }}
          >
            {(mutation.error as Error).message}
          </div>
        )}
      </CardContent>

      {/* ── separator ── */}
      <div style={{ borderTop: '1px solid rgba(99,102,241,0.08)', marginInline: 24 }} />

      <CardFooter className="pt-3">
        <Button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          variant="outline"
          className="w-full font-mono text-xs tracking-widest h-9 transition-all"
          style={{
            borderColor: 'rgba(99,102,241,0.25)',
            color: mutation.isPending ? '#6b7280' : '#6366f1',
            background: mutation.isPending ? 'transparent' : 'rgba(99,102,241,0.06)',
          }}
        >
          {mutation.isPending ? 'ANALYZING\u2026' : 'ANALYZE_PROJECT'}
        </Button>
      </CardFooter>
    </Card>
  );
}

function StatCell({
  label,
  value,
  error,
}: {
  label: string;
  value: number;
  error?: boolean;
}) {
  return (
    <div className="text-center">
      <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#6b7280' }}>
        {label}
      </div>
      <div
        className="font-mono text-xl leading-tight mt-0.5 tabular-nums"
        style={{ color: error ? '#f97316' : '#6366f1' }}
      >
        {value.toLocaleString()}
      </div>
    </div>
  );
}
