import { STATUS_COLORS } from '../../data/constants';
import { cn } from '../../utils/format';

export function StatusChip({ status, className }: { status: string; className?: string }) {
  const key = status as keyof typeof STATUS_COLORS;
  const colors = STATUS_COLORS[key] || 'bg-steel-200 text-steel-700 dark:bg-steel-800 dark:text-steel-300';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase',
        colors,
        className,
      )}
    >
      {status}
    </span>
  );
}
