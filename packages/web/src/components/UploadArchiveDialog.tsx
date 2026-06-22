import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileArchive, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api } from '../api/client';
import { useApp } from '../store/AppContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If provided — reanalyze mode: update existing project instead of creating new one */
  projectId?: string;
  onDone: (projectId: string) => void;
}

export function UploadArchiveDialog({ open, onOpenChange, projectId, onDone }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { addProject, updateProject } = useApp();

  const mutation = useMutation({
    mutationFn: (f: File) => api.analyze(f),
    onSuccess: (summary, f) => {
      let id: string;
      if (projectId) {
        // Reanalyze mode — update existing
        updateProject(projectId, {
          summary,
          lastAnalyzed: new Date().toISOString(),
          fileName: f.name,
          name: f.name.replace(/\.zip$/i, ''),
        });
        id = projectId;
        queryClient.invalidateQueries({ queryKey: ['graph', id] });
        queryClient.invalidateQueries({ queryKey: ['cycles', id] });
        queryClient.invalidateQueries({ queryKey: ['metrics', id] });
      } else {
        // Create mode — add new project
        const project = addProject(f.name, summary);
        id = project.id;
        // No need to invalidate — cache for new UUID is empty
      }
      onDone(id);
      setFile(null);
      onOpenChange(false);
    },
  });

  function handleFile(f: File) {
    if (!f.name.toLowerCase().endsWith('.zip')) {
      setFileError('Only .zip archives are supported');
      return;
    }
    setFileError(null);
    setFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  const isReanalyze = !!projectId;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!mutation.isPending) { onOpenChange(v); setFile(null); setFileError(null); } }}>
      <DialogContent
        className="max-w-md"
        style={{ background: '#0f0f1a', border: '1px solid rgba(99,102,241,0.15)' }}
      >
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-widest" style={{ color: '#e2e8f0' }}>
            {isReanalyze ? 'REANALYZE_PROJECT' : 'UPLOAD_ARCHIVE'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          {/* Dropzone */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
            onDrop={handleDrop}
            className="relative flex flex-col items-center justify-center gap-3 rounded-lg cursor-pointer transition-all select-none"
            style={{
              minHeight: 140,
              border: `1px dashed ${dragging ? 'rgba(99,102,241,0.6)' : fileError ? 'rgba(249,115,22,0.4)' : 'rgba(99,102,241,0.2)'}`,
              background: dragging ? 'rgba(99,102,241,0.06)' : 'rgba(0,0,0,0.2)',
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
            />

            {file ? (
              <>
                <FileArchive size={28} style={{ color: '#6366f1' }} />
                <div className="text-center">
                  <div className="font-mono text-sm" style={{ color: '#e2e8f0' }}>
                    {file.name}
                  </div>
                  <div className="font-mono text-[11px] mt-0.5" style={{ color: '#6b7280' }}>
                    {(file.size / 1024).toFixed(0)} KB
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors"
                  style={{ color: '#6b7280' }}
                >
                  <X size={12} />
                </button>
              </>
            ) : (
              <>
                <Upload size={24} style={{ color: dragging ? '#6366f1' : '#6b7280' }} />
                <div className="text-center">
                  <div className="font-mono text-xs" style={{ color: '#6b7280' }}>
                    drop .zip archive here
                  </div>
                  <div className="font-mono text-[11px] mt-0.5" style={{ color: '#374151' }}>
                    or click to browse
                  </div>
                </div>
              </>
            )}
          </div>

          {fileError && (
            <p className="font-mono text-[11px]" style={{ color: '#f97316' }}>
              ✗&nbsp;{fileError}
            </p>
          )}

          {mutation.isError && (
            <div
              className="px-3 py-2 rounded font-mono text-[11px] break-all"
              style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)', color: '#f97316' }}
            >
              {(mutation.error as Error).message}
            </div>
          )}

          <Button
            onClick={() => file && mutation.mutate(file)}
            disabled={!file || mutation.isPending}
            className="w-full font-mono text-xs tracking-widest h-9"
            style={{
              background: file && !mutation.isPending ? 'rgba(99,102,241,0.12)' : 'transparent',
              color: file && !mutation.isPending ? '#6366f1' : '#6b7280',
              border: '1px solid rgba(99,102,241,0.3)',
            }}
          >
            {mutation.isPending ? 'ANALYZING\u2026' : '[ ANALYZE ]'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
