/**
 * Resolution round configuration
 *
 * The analyze -> resolve -> analyze loop (see
 * app/api/alignment/[id]/submit-resolution/route.ts) has no natural
 * end condition: two partners who keep disagreeing on every round can
 * cycle indefinitely, incurring unbounded Claude API cost with no
 * circuit breaker. MAX_RESOLUTION_ROUNDS caps how many resolution
 * rounds a single alignment can go through before it must be resolved
 * manually (outside the app) instead of via another AI-mediated round.
 */
export const MAX_RESOLUTION_ROUNDS = 5;
