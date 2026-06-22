import { format } from 'date-fns';
import { Trash2, FileCode2, GitMerge, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';
import { useApp } from '../store/AppContext';
import type { Project } from '../store/projectsStore';

interface Props {
  project: Project;
}

export function ProjectCard({ project }: Props) {
  const { removeProject } = useApp();
  const { id, name, fileName, lastAnalyzed, summary } = project;

  return (
    <div
      className="relative overflow-hidden rounded-lg
                 border border-white/[0.08]
                 bg-white/[0.04]
                 backdrop-blur-sm
                 transition-all duration-200
                 hover:border-violet-500/40
                 hover:bg-white/[0.06]
                 group"
    >
      {/* Left accent bar */}
      <div className="absolute top-0 left-0 w-1 h-full bg-violet-500/20 group-hover:bg-violet-500 transition-colors duration-200" />

      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <Link href={`/project/${id}`}>
            <span className="font-mono text-lg font-semibold text-white/90 truncate block hover:text-violet-400 hover:underline underline-offset-4 transition-colors cursor-pointer">
              {name}
            </span>
          </Link>

          <div className="flex items-center gap-2 mt-2">
            <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-violet-500/30 bg-violet-500/10 text-violet-400">
              {fileName?.endsWith?.('.zip') ? 'zip' : 'ts'}
            </span>
            <span className="font-mono text-[10px] text-white/30">
              {format(new Date(lastAnalyzed), 'yyyy-MM-dd HH:mm')}
            </span>
          </div>
        </div>

        {/* Delete — hidden until hover */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeProject(id); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200
                     p-1.5 rounded text-white/30 hover:text-red-400 hover:bg-red-500/10
                     -mt-1 -mr-1 cursor-pointer"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Metric mini-cards */}
      <div className="px-5 pb-4 grid grid-cols-3 gap-2">

        <div className="flex flex-col p-2.5 rounded border border-white/[0.06] bg-black/20">
          <span className="font-mono text-[9px] text-white/40 mb-1.5 flex items-center gap-1">
            <FileCode2 size={10} /> FILES
          </span>
          <span className="font-mono text-base font-medium text-white/80">
            {summary.fileCount}
          </span>
        </div>

        <div className="flex flex-col p-2.5 rounded border border-white/[0.06] bg-black/20">
          <span className="font-mono text-[9px] text-white/40 mb-1.5 flex items-center gap-1">
            <GitMerge size={10} /> DEPS
          </span>
          <span className="font-mono text-base font-medium text-white/80">
            {summary.edgeCount}
          </span>
        </div>

        <div className="flex flex-col p-2.5 rounded border border-white/[0.06] bg-black/20">
          <span className="font-mono text-[9px] text-white/40 mb-1.5 flex items-center gap-1">
            <AlertTriangle size={10} /> CYCLES
          </span>
          <span className={`font-mono text-base font-medium ${
            summary.cycleCount > 0 ? 'text-orange-400' : 'text-green-400'
          }`}>
            {summary.cycleCount}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-5">
        <Link href={`/project/${id}`} className="block w-full">
          <button className="w-full font-mono text-xs py-2.5 rounded
                             border border-white/10 bg-white/5 text-white/60 tracking-widest
                             hover:bg-violet-500/15 hover:text-violet-400 hover:border-violet-500/30
                             transition-colors duration-200 cursor-pointer">
            OPEN_PROJECT
          </button>
        </Link>
      </div>
    </div>
  );
}
