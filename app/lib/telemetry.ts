/**
 * Telemetry and Event Logging
 *
 * Provides structured logging for AI operations and application events.
 * Console-based implementation for now, can be enhanced with external
 * analytics services later (e.g., Vercel Analytics, PostHog, etc.).
 */

import { isDevelopment } from './env';

/**
 * Event types for telemetry tracking
 */
export type TelemetryEventType =
  | 'ai.generation.start'
  | 'ai.generation.complete'
  | 'ai.generation.error'
  | 'ai.analysis.start'
  | 'ai.analysis.complete'
  | 'ai.analysis.error'
  | 'ai.resolve.start'
  | 'ai.resolve.complete'
  | 'ai.resolve.error'
  | 'ai.document.start'
  | 'ai.document.complete'
  | 'ai.document.error'
  | 'ai.suggestion.start'
  | 'ai.suggestion.complete'
  | 'ai.suggestion.error'
  | 'alignment.created'
  | 'alignment.status.changed'
  | 'alignment.completed'
  | 'user.login'
  | 'user.signup'
  | 'error';

/**
 * Base telemetry event structure
 */
export interface TelemetryEvent {
  event: TelemetryEventType;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * AI operation event structure (per plan_a.md lines 1194)
 */
export interface AIOperationEvent extends TelemetryEvent {
  event: TelemetryEventType;
  alignmentId: string;
  latencyMs: number;
  model: string;
  success: boolean;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Alignment lifecycle event structure
 */
export interface AlignmentEvent extends TelemetryEvent {
  event: TelemetryEventType;
  alignmentId: string;
  status?: string;
  previousStatus?: string;
  round?: number;
  participantCount?: number;
}

/**
 * User event structure
 */
export interface UserEvent extends TelemetryEvent {
  event: TelemetryEventType;
  userId: string;
  email?: string;
  provider?: string;
}

/**
 * Error event structure
 */
export interface ErrorEvent extends TelemetryEvent {
  event: 'error';
  errorCode: string;
  errorMessage: string;
  errorStack?: string;
  context?: Record<string, unknown>;
}

/**
 * Logs a telemetry event to console with structured formatting
 */
function logEvent(event: TelemetryEvent): void {
  const { event: eventType, timestamp, ...rest } = event;

  const logLevel = eventType.includes('error') ? 'error' : 'info';
  const emoji = getEventEmoji(eventType);

  const output = {
    event: eventType,
    timestamp,
    ...rest,
  };

  if (logLevel === 'error') {
    console.error(`${emoji} [TELEMETRY]`, output);
  } else {
    console.log(`${emoji} [TELEMETRY]`, output);
  }
}

/**
 * Gets emoji for event type (visual aid in console)
 */
function getEventEmoji(eventType: TelemetryEventType): string {
  if (eventType.includes('error')) return '❌';
  if (eventType.includes('complete')) return '✅';
  if (eventType.includes('start')) return '🚀';
  if (eventType.includes('created')) return '✨';
  if (eventType.includes('login') || eventType.includes('signup')) return '👤';
  return '📊';
}

/**
 * Creates base telemetry event with common fields
 */
function createBaseEvent(
  event: TelemetryEventType,
  userId?: string,
  metadata?: Record<string, unknown>
): TelemetryEvent {
  return {
    event,
    timestamp: new Date().toISOString(),
    userId,
    metadata,
  };
}

/**
 * Telemetry client for logging application events
 */
export const telemetry = {
  /**
   * Logs AI operation event
   */
  logAIOperation(data: {
    event: TelemetryEventType;
    alignmentId: string;
    latencyMs: number;
    model: string;
    success: boolean;
    userId?: string;
    tokenUsage?: AIOperationEvent['tokenUsage'];
    errorCode?: string;
    errorMessage?: string;
  }): void {
    const event: AIOperationEvent = {
      ...createBaseEvent(data.event, data.userId),
      alignmentId: data.alignmentId,
      latencyMs: data.latencyMs,
      model: data.model,
      success: data.success,
      tokenUsage: data.tokenUsage,
      errorCode: data.errorCode,
      errorMessage: data.errorMessage,
    };

    logEvent(event);
  },

  /**
   * Logs alignment lifecycle event
   */
  logAlignment(data: {
    event: TelemetryEventType;
    alignmentId: string;
    userId?: string;
    status?: string;
    previousStatus?: string;
    round?: number;
    participantCount?: number;
  }): void {
    const event: AlignmentEvent = {
      ...createBaseEvent(data.event, data.userId),
      alignmentId: data.alignmentId,
      status: data.status,
      previousStatus: data.previousStatus,
      round: data.round,
      participantCount: data.participantCount,
    };

    logEvent(event);
  },

  /**
   * Logs user authentication event
   */
  logUser(data: {
    event: TelemetryEventType;
    userId: string;
    email?: string;
    provider?: string;
  }): void {
    const event: UserEvent = {
      ...createBaseEvent(data.event, data.userId),
      userId: data.userId,
      email: data.email,
      provider: data.provider,
    };

    logEvent(event);
  },

  /**
   * Logs error event
   */
  logError(data: {
    errorCode: string;
    errorMessage: string;
    errorStack?: string;
    userId?: string;
    context?: Record<string, unknown>;
  }): void {
    const event: ErrorEvent = {
      ...createBaseEvent('error', data.userId),
      event: 'error',
      errorCode: data.errorCode,
      errorMessage: data.errorMessage,
      errorStack: data.errorStack,
      context: data.context,
    };

    logEvent(event);
  },

  /**
   * Logs generic event with custom metadata
   */
  log(
    event: TelemetryEventType,
    userId?: string,
    metadata?: Record<string, unknown>
  ): void {
    logEvent(createBaseEvent(event, userId, metadata));
  },
};

/**
 * Performance timer for measuring operation latency
 */
export class PerformanceTimer {
  private startTime: number;
  private endTime?: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Stops timer and returns elapsed time in milliseconds
   */
  stop(): number {
    this.endTime = Date.now();
    return this.getLatency();
  }

  /**
   * Gets elapsed time without stopping timer
   */
  getLatency(): number {
    const end = this.endTime || Date.now();
    return end - this.startTime;
  }
}

/**
 * Wraps async function with AI operation telemetry
 */
export function withAITelemetry<T>(
  operation: string,
  model: string,
  alignmentId: string,
  userId?: string
) {
  return async (fn: () => Promise<T>): Promise<T> => {
    const timer = new PerformanceTimer();
    const startEvent = `ai.${operation}.start` as TelemetryEventType;
    const completeEvent = `ai.${operation}.complete` as TelemetryEventType;
    const errorEvent = `ai.${operation}.error` as TelemetryEventType;

    telemetry.logAIOperation({
      event: startEvent,
      alignmentId,
      latencyMs: 0,
      model,
      success: true,
      userId,
    });

    try {
      const result = await fn();
      const latencyMs = timer.stop();

      telemetry.logAIOperation({
        event: completeEvent,
        alignmentId,
        latencyMs,
        model,
        success: true,
        userId,
      });

      return result;
    } catch (error) {
      const latencyMs = timer.stop();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = (error as any).code || 'UNKNOWN';

      telemetry.logAIOperation({
        event: errorEvent,
        alignmentId,
        latencyMs,
        model,
        success: false,
        userId,
        errorCode,
        errorMessage,
      });

      throw error;
    }
  };
}

/**
 * Development-only telemetry logging
 */
export function devLog(message: string, data?: Record<string, unknown>): void {
  if (isDevelopment()) {
    console.log(`[DEV] ${message}`, data || '');
  }
}
