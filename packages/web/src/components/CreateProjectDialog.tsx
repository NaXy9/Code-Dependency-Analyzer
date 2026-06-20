import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { analyzeFormSchema, type AnalyzeFormValues } from '../lib/schemas';

interface Props {
  onAdd: (path: string) => void;
}

export function CreateProjectDialog({ onAdd }: Props) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AnalyzeFormValues>({
    resolver: zodResolver(analyzeFormSchema),
  });

  const onSubmit = (values: AnalyzeFormValues) => {
    onAdd(values.projectPath);
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="font-mono text-xs tracking-widest h-8 px-3 gap-1.5"
          style={{
            borderColor: 'rgba(99,102,241,0.3)',
            color: '#6366f1',
            background: 'rgba(99,102,241,0.06)',
          }}
        >
          <Plus size={13} />
          ADD_PROJECT
        </Button>
      </DialogTrigger>

      <DialogContent
        className="max-w-md"
        style={{
          background: '#0f0f1a',
          border: '1px solid rgba(99,102,241,0.15)',
        }}
      >
        <DialogHeader>
          <DialogTitle
            className="font-mono text-sm uppercase tracking-widest"
            style={{ color: '#e2e8f0' }}
          >
            INIT_PROJECT
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          <div>
            <label
              className="block font-mono text-[10px] uppercase tracking-widest mb-1.5"
              style={{ color: '#6b7280' }}
            >
              ABSOLUTE_PATH
            </label>
            <input
              {...register('projectPath')}
              placeholder="/home/user/my-project"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded px-3 py-2.5 font-mono text-sm transition-colors"
              style={{
                background: '#0a0a0f',
                border: `1px solid ${errors.projectPath ? '#f97316' : 'rgba(99,102,241,0.2)'}`,
                color: '#e2e8f0',
                outline: 'none',
              }}
            />
            {errors.projectPath && (
              <p className="mt-1.5 font-mono text-[11px]" style={{ color: '#f97316' }}>
                ✗&nbsp;{errors.projectPath.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full font-mono text-xs tracking-widest h-9"
            style={{
              background: 'rgba(99,102,241,0.12)',
              color: '#6366f1',
              border: '1px solid rgba(99,102,241,0.3)',
            }}
          >
            ADD
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
