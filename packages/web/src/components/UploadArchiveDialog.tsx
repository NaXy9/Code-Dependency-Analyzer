import { useRef, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, FileArchive } from 'lucide-react';
import { api } from '../api/client';
import { useApp } from '../store/AppContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Pass when re-analysing an existing project. Omit for new uploads.
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

  /* Pre-generate an ID for new projects so the frontend and backend
     always share the same identifier from the moment of upload. */
  const pendingIdRef = useRef(crypto.randomUUID());

  // Reset state (and generate a fresh pending ID) each time the dialog opens
  useEffect(() => {
    if (open) {
      setFile(null);
      setFileError(null);
      if (!projectId) pendingIdRef.current = crypto.randomUUID();
    }
  }, [open, projectId]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const mutation = useMutation({
    mutationFn: (f: File) => {
      // Use the existing project ID for re-analysis, or the pre-generated one for new projects
      const id = projectId ?? pendingIdRef.current;
      return api.analyze(f, id);
    },
    onSuccess: (summary, f) => {
      if (projectId) {
        // Re-analysis of an existing project
        updateProject(projectId, {
          summary,
          lastAnalyzed: new Date().toISOString(),
          fileName: f.name,
          name: f.name.replace(/\.zip$/i, ''),
        });
        queryClient.invalidateQueries({ queryKey: ['graph',   projectId] });
        queryClient.invalidateQueries({ queryKey: ['cycles',  projectId] });
        queryClient.invalidateQueries({ queryKey: ['metrics', projectId] });
        onDone(projectId);
      } else {
        // New project
        const id = pendingIdRef.current;
        addProject(f.name, summary, id);
        onDone(id);
      }
      handleClose();
    },
  });

  function handleClose() {
    if (mutation.isPending) return;
    onOpenChange(false);
  }

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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="relative w-full max-w-md rounded-xl border border-white/[0.10] bg-[#0d0d18]/95 backdrop-blur-md shadow-2xl p-6 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-base font-bold text-white/90 tracking-wider">
            {projectId ? 'REANALYZE_PROJECT' : 'UPLOAD_ARCHIVE'}
          </h2>
          <button
            onClick={handleClose}
            className="text-white/30 hover:text-white/60 transition-colors cursor-pointer p-1 rounded hover:bg-white/[0.06]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drop zone */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-3 py-12 px-6 cursor-pointer transition-colors select-none ${
            dragging
              ? 'border-violet-500/60 bg-violet-500/10'
              : 'border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] hover:border-violet-500/40'
          }`}
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
              <FileArchive size={32} className="text-violet-400" />
              <span className="font-mono text-sm text-violet-400 font-medium text-center break-all">
                {file.name}
              </span>
              <span className="font-mono text-xs text-white/30">
                {(file.size / 1024).toFixed(0)} KB — click to change
              </span>
            </>
          ) : (
            <>
              <Upload size={32} className="text-white/25" />
              <span className="font-mono text-sm text-white/50">drop .zip archive here</span>
              <span className="font-mono text-xs text-white/30">or click to browse</span>
            </>
          )}
        </div>

        {fileError && (
          <p className="font-mono text-xs text-orange-400">✗ {fileError}</p>
        )}
        {mutation.isError && (
          <p className="font-mono text-xs text-orange-400 break-all">
            ERROR: {(mutation.error as Error).message}
          </p>
        )}

        <button
          onClick={() => file && mutation.mutate(file)}
          disabled={!file || mutation.isPending}
          className="w-full py-2.5 rounded font-mono text-xs font-bold tracking-widest bg-violet-600 hover:bg-violet-500 text-white border border-violet-500/50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? 'ANALYZING\u2026' : 'ANALYZE'}
        </button>
      </div>
    </div>
  );
}
