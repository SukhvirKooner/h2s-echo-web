import {
  BarChart3,
  Clock3,
  Cpu,
  FileSpreadsheet,
  FileText,
  GitBranch,
  LayoutDashboard,
  Radio,
  RefreshCw,
  Settings,
  ShieldCheck,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../../data/constants';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/format';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  Clock3,
  Cpu,
  FileSpreadsheet,
  ShieldCheck,
  BarChart3,
  RefreshCw,
  FileText,
  Radio,
  GitBranch,
  Settings,
};

export function Sidebar() {
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const toggle = useStore((s) => s.toggleSidebar);
  const role = useStore((s) => s.user?.role);

  const items = NAV_ITEMS.filter((n) => role && (n.roles as readonly string[]).includes(role));

  return (
    <aside
      className={cn(
        'shrink-0 border-r border-steel-200 dark:border-steel-800 bg-white dark:bg-steel-900 flex flex-col transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      <div className={cn('flex items-center gap-3 px-4 h-16 border-b border-steel-200 dark:border-steel-800', collapsed && 'justify-center px-2')}>
        <div className="h-9 w-9 rounded-lg bg-brand-600 text-white flex items-center justify-center font-display font-bold text-sm shrink-0">
          H₂
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-display font-semibold text-steel-900 dark:text-white leading-tight">H2S-ECHO</div>
            <div className="text-[10px] uppercase tracking-wider text-steel-500">Exposure Evidence</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  collapsed && 'justify-center px-2',
                  isActive
                    ? 'bg-brand-50 text-brand-800 dark:bg-brand-950/50 dark:text-brand-200'
                    : 'text-steel-600 dark:text-steel-300 hover:bg-steel-50 dark:hover:bg-steel-800',
                )
              }
              title={item.label}
            >
              {Icon && <Icon className="h-5 w-5 shrink-0" />}
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={toggle}
        className="m-2 btn-ghost justify-center border border-steel-200 dark:border-steel-800"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        {!collapsed && <span>Collapse</span>}
      </button>
    </aside>
  );
}
