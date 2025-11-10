/**
 * StatusBadge Component
 *
 * Displays alignment status with appropriate color coding
 * Supports both AlignmentStatus (database) and UIStatus (derived) types
 *
 * Color specifications from plan_a.md lines 1282-1296
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/app/lib/utils';
import type { AlignmentStatus, UIStatus } from '@/app/lib/types';

/**
 * Status color mapping with dark mode support
 * Maps both database statuses and UI-derived statuses
 */
const statusColors: Record<AlignmentStatus | UIStatus, string> = {
  // Database statuses
  draft: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  active: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  analyzing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  resolving: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  complete: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',

  // UI-derived statuses
  waiting_partner: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  in_conflict_resolution: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  aligned_awaiting_signatures: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  stalled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

/**
 * Formats status text from snake_case to readable format
 * Custom labels for certain statuses per philosophy doc
 */
function formatStatusText(status: string): string {
  const customLabels: Record<string, string> = {
    'in_conflict_resolution': 'Discovering Solutions',
    'aligned_awaiting_signatures': 'Ready to Finalize',
  };

  if (customLabels[status]) {
    return customLabels[status];
  }

  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export interface StatusBadgeProps {
  /**
   * The status to display - accepts both AlignmentStatus and UIStatus types
   */
  status: AlignmentStatus | UIStatus;

  /**
   * Optional additional CSS classes
   */
  className?: string;
}

/**
 * StatusBadge component
 *
 * Renders a colored badge for alignment status with proper dark mode support
 * Uses shadcn/ui Badge component as base with custom color overrides
 *
 * @example
 * ```tsx
 * <StatusBadge status="active" />
 * <StatusBadge status="waiting_partner" className="ml-2" />
 * ```
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  // Get color classes for this status, fallback to draft if unknown
  const colorClasses = statusColors[status] || statusColors.draft;

  return (
    <Badge
      className={cn(
        'border-transparent font-medium',
        colorClasses,
        className
      )}
    >
      {formatStatusText(status)}
    </Badge>
  );
}
