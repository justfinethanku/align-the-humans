/**
 * React hooks for Human Alignment application
 * Client-side data fetching and real-time subscriptions
 */

export { useDashboardData } from './useDashboardData';
export type {
  AlignmentWithStatus,
  UseDashboardDataReturn,
} from './useDashboardData';

export { usePartners } from './usePartners';
export type {
  PartnerWithCount,
  UsePartnersReturn,
} from './usePartners';

export { useAlignmentUpdates } from './useAlignmentUpdates';
export type {
  UseAlignmentUpdatesOptions,
  UseAlignmentUpdatesReturn,
} from './useAlignmentUpdates';
