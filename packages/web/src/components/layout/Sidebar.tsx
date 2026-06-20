import { motion } from 'framer-motion';
import { FolderGit2, Network, Activity } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useApp } from '../../store/AppContext';

export function Sidebar() {
  const { sidebarExpanded, toggleSidebar, currentProjectId } = useApp();
  const [location] = useLocation();
  const inProject = location.startsWith('/project/');

  return (
    <motion.aside
      animate={{ width: sidebarExpanded ? 256 : 64 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="relative flex-shrink-0 flex flex-col overflow-hidden z-10"
      style={{
        background: '#0d0d14',
        borderRight: '1px solid rgba(99,102,241,0.1)',
      }}
    >
      {/* Logo / toggle */}
      <button
        onClick={toggleSidebar}
        className="h-12 flex items-center gap-3 px-4 w-full text-left flex-shrink-0 hover:bg-white/[0.02] transition-colors"
        style={{ borderBottom: '1px solid rgba(99,102,241,0.08)' }}
      >
        <div
          className="w-8 h-8 flex-shrink-0 rounded flex items-center justify-center"
          style={{
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.28)',
          }}
        >
          <span className="font-mono text-sm text-indigo-400 leading-none select-none">⌬</span>
        </div>
        {sidebarExpanded && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-mono text-[11px] uppercase tracking-[0.22em] whitespace-nowrap select-none"
            style={{ color: '#6b7280' }}
          >
            CDA
          </motion.span>
        )}
      </button>

      {/* Nav items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        <NavItem
          href="/"
          icon={<FolderGit2 size={15} />}
          label="PROJECTS"
          active={location === '/'}
          expanded={sidebarExpanded}
        />
        {inProject && currentProjectId && (
          <NavItem
            href={`/project/${currentProjectId}`}
            icon={<Network size={15} />}
            label="GRAPH"
            active={inProject}
            expanded={sidebarExpanded}
          />
        )}
      </nav>

      {/* System status */}
      <div
        className="px-2 py-3 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(99,102,241,0.08)' }}
      >
        <div
          className={`flex items-center gap-2.5 px-3 py-2 rounded ${
            !sidebarExpanded ? 'justify-center' : ''
          }`}
        >
          <Activity size={13} className="flex-shrink-0" style={{ color: '#22c55e' }} />
          {sidebarExpanded && (
            <span
              className="font-mono text-[11px] whitespace-nowrap"
              style={{ color: '#22c55e' }}
            >
              SYS_ONLINE
            </span>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
  expanded,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  expanded: boolean;
}) {
  return (
    <Link href={href}>
      <div
        className={`
          flex items-center gap-3 px-3 py-2 rounded cursor-pointer
          transition-colors duration-150
          ${!expanded ? 'justify-center' : ''}
        `}
        style={{
          background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
          color: active ? '#6366f1' : '#6b7280',
        }}
        title={!expanded ? label : undefined}
      >
        <span className="flex-shrink-0">{icon}</span>
        {expanded && (
          <span className="font-mono text-[11px] uppercase tracking-widest whitespace-nowrap">
            {label}
          </span>
        )}
        {active && (
          <div
            className="absolute left-0 w-0.5 h-6 rounded-r"
            style={{ background: '#6366f1' }}
          />
        )}
      </div>
    </Link>
  );
}
