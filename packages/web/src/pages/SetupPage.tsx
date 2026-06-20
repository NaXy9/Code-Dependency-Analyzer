import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { analyzeFormSchema, type AnalyzeFormValues } from '../lib/schemas';
import { api } from '../api/client';
import { useApp } from '../store/AppContext';

export function SetupPage() {
  const [, navigate] = useLocation();
  const { setSummary } = useApp();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AnalyzeFormValues>({
    resolver: zodResolver(analyzeFormSchema),
  });

  const mutation = useMutation({
    mutationFn: (values: AnalyzeFormValues) => api.analyze(values.projectPath),
    onSuccess: (data) => {
      // Invalidate stale graph / cycles / metrics from a previous run
      queryClient.clear();
      setSummary(data);
      navigate('/dashboard');
    },
  });

  const onSubmit = (values: AnalyzeFormValues) => mutation.mutate(values);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: '#0a0a0f',
        backgroundImage: `
          repeating-linear-gradient(0deg,  transparent, transparent 39px, rgba(99,102,241,0.045) 39px, rgba(99,102,241,0.045) 40px),
          repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(99,102,241,0.045) 39px, rgba(99,102,241,0.045) 40px)
        `,
      }}
    >
      <div className="w-full max-w-sm px-6">
        {/* wordmark */}
        <div className="mb-10">
          <p className="font-mono text-[10px] text-zinc-700 mb-2 tracking-widest">
            CODE_DEPENDENCY_ANALYZER / v0.1.0
          </p>
          <h1 className="font-mono text-xl text-zinc-200 leading-snug uppercase tracking-wider">
            SELECT
            <br />
            TARGET_PROJECT
          </h1>
          <div className="mt-4 h-px w-16 bg-indigo-500/50" />
        </div>

        {/* form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] text-zinc-600 uppercase tracking-widest mb-1.5">
              ABSOLUTE_PATH
            </label>
            <input
              {...register('projectPath')}
              placeholder="/home/user/my-project"
              spellCheck={false}
              autoComplete="off"
              className={`
                w-full bg-zinc-900/80 border rounded px-4 py-3
                font-mono text-sm text-zinc-200 placeholder-zinc-800
                focus:outline-none focus:ring-1 transition-colors
                ${
                  errors.projectPath
                    ? 'border-orange-500/50 focus:ring-orange-500/20'
                    : 'border-zinc-800 focus:border-indigo-500/50 focus:ring-indigo-500/20'
                }
              `}
            />
            {errors.projectPath && (
              <p className="mt-1.5 font-mono text-[11px] text-orange-400 leading-relaxed">
                ✗&nbsp;{errors.projectPath.message}
              </p>
            )}
          </div>

          {mutation.isError && (
            <div className="border border-orange-500/25 bg-orange-500/5 rounded px-4 py-3">
              <p className="font-mono text-[11px] text-orange-400 break-all">
                ERROR: {(mutation.error as Error).message}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className={`
              w-full py-3 rounded font-mono text-sm uppercase tracking-widest border
              transition-all active:scale-[0.99]
              ${
                mutation.isPending
                  ? 'border-zinc-800 text-zinc-700 cursor-not-allowed'
                  : 'border-indigo-500/40 text-indigo-400 bg-indigo-500/8 hover:bg-indigo-500/15 hover:border-indigo-500/60'
              }
            `}
          >
            {mutation.isPending ? 'ANALYZING\u2026' : '[ ANALYZE ]'}
          </button>
        </form>

        <p className="mt-8 font-mono text-[10px] text-zinc-800 leading-relaxed">
          API on :3001 · graph data not persisted across server restarts
        </p>
      </div>
    </div>
  );
}
