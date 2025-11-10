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
 * Formats a status string for display
 */
export function formatStatus(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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

  /**
   * Formats a date to short format (e.g., "Jan 1, 2024")
   */
  formatShort(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  },

  /**
   * Formats a date to long format (e.g., "January 1, 2024 at 3:45 PM")
   */
  formatLong(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  },

  /**
   * Formats a date to ISO string for API payloads
   */
  formatISO(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString();
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

  /**
   * Converts a string to kebab-case
   */
  kebabCase(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  /**
   * Converts a string to title case
   */
  titleCase(str: string): string {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  },

  /**
   * Gets initials from a name
   */
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  },
};

/**
 * Array utilities
 */
export const arrayUtils = {
  /**
   * Groups array items by a key function
   */
  groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return array.reduce((result, item) => {
      const key = keyFn(item);
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(item);
      return result;
    }, {} as Record<string, T[]>);
  },

  /**
   * Removes duplicate items from array
   */
  unique<T>(array: T[]): T[] {
    return Array.from(new Set(array));
  },

  /**
   * Chunks array into smaller arrays of specified size
   */
  chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },
};

/**
 * Object utilities
 */
export const objectUtils = {
  /**
   * Picks specified keys from an object
   */
  pick<T extends object, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  },

  /**
   * Omits specified keys from an object
   */
  omit<T extends object, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Omit<T, K> {
    const result = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result;
  },

  /**
   * Checks if object is empty
   */
  isEmpty(obj: object): boolean {
    return Object.keys(obj).length === 0;
  },
};

/**
 * Validation utilities
 */
export const validation = {
  /**
   * Checks if string is valid email
   */
  isEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Checks if string is valid UUID
   */
  isUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  /**
   * Checks if string is valid URL
   */
  isURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * Sleep utility for async delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce utility for rate-limiting function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle utility for rate-limiting function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * Formats a number as currency
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Formats a number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Generates a random ID (not cryptographically secure)
 */
export function generateId(length: number = 8): string {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}
