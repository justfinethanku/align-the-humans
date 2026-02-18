/**
 * General Utility Functions
 *
 * Common helper functions used throughout the application.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with Tailwind CSS merge support
 * Used with shadcn/ui components for conditional styling
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Alignment status values from Supabase schema
 */
export type AlignmentStatus =
  | 'draft'
  | 'active'
  | 'analyzing'
  | 'resolving'
  | 'complete';

/**
 * UI-derived status values from alignment_status_view
 */
export type UIStatus =
  | 'draft'
  | 'active'
  | 'analyzing'
  | 'resolving'
  | 'complete'
  | 'waiting_partner'
  | 'in_conflict_resolution'
  | 'aligned_awaiting_signatures'
  | 'stalled';

/**
 * Status color mapping per plan_a.md lines 1282-1296
 * Returns Tailwind CSS classes for status badges
 */
export const statusColors: Record<UIStatus, string> = {
  draft: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  active: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  analyzing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  resolving: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  complete: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  waiting_partner: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  in_conflict_resolution: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  aligned_awaiting_signatures: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  stalled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

/**
 * Gets status color classes for a given status
 */
export function getStatusColor(status: UIStatus | AlignmentStatus): string {
  return statusColors[status as UIStatus] || statusColors.draft;
}

/**
 * Date formatting utilities
 */
export const dateUtils = {
  /**
   * Formats a date to relative time (e.g., "2 hours ago")
   */
  formatRelative(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
    if (diffDay < 30) {
      const weeks = Math.floor(diffDay / 7);
      return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    }
    if (diffDay < 365) {
      const months = Math.floor(diffDay / 30);
      return `${months} month${months !== 1 ? 's' : ''} ago`;
    }
    const years = Math.floor(diffDay / 365);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
  },
};

/**
 * String utilities
 */
export const stringUtils = {
  /**
   * Truncates a string to a maximum length with ellipsis
   */
  truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + '...';
  },
};
