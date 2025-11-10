/**
 * Custom Error Classes and Error Handling Utilities
 *
 * Provides structured error types for different failure scenarios
 * and utilities for formatting user-friendly error messages.
 */

/**
 * Base error class for application errors
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Converts error to JSON-safe object for API responses
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

/**
 * API-related errors (network, external services)
 */
export class ApiError extends AppError {
  constructor(
    message: string,
    statusCode: number = 502,
    details?: Record<string, unknown>
  ) {
    super(message, 'API_ERROR', statusCode, details);
  }
}

/**
 * Input validation errors
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Authentication and authorization errors
 */
export class AuthError extends AppError {
  constructor(
    message: string,
    statusCode: number = 401,
    details?: Record<string, unknown>
  ) {
    super(message, 'AUTH_ERROR', statusCode, details);
  }
}

/**
 * Alignment workflow-specific errors
 */
export class AlignmentError extends AppError {
  constructor(
    message: string,
    code: string,
    statusCode: number = 400,
    details?: Record<string, unknown>
  ) {
    super(message, code, statusCode, details);
  }

  /**
   * Creates error for invalid alignment status transition
   */
  static invalidTransition(from: string, to: string): AlignmentError {
    return new AlignmentError(
      `Cannot transition alignment from '${from}' to '${to}'`,
      'INVALID_STATUS_TRANSITION',
      409,
      { currentStatus: from, attemptedStatus: to }
    );
  }

  /**
   * Creates error when participant hasn't submitted responses
   */
  static incompleteParticipation(alignmentId: string, userId: string): AlignmentError {
    return new AlignmentError(
      'All participants must submit responses before analysis',
      'INCOMPLETE_PARTICIPATION',
      409,
      { alignmentId, userId }
    );
  }

  /**
   * Creates error when user lacks permission for alignment
   */
  static unauthorized(alignmentId: string, userId: string): AlignmentError {
    return new AlignmentError(
      'You do not have permission to access this alignment',
      'ALIGNMENT_UNAUTHORIZED',
      403,
      { alignmentId, userId }
    );
  }

  /**
   * Creates error when alignment is not found
   */
  static notFound(alignmentId: string): AlignmentError {
    return new AlignmentError(
      'Alignment not found',
      'ALIGNMENT_NOT_FOUND',
      404,
      { alignmentId }
    );
  }
}

/**
 * Database operation errors
 */
export class DatabaseError extends AppError {
  constructor(
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message, 'DATABASE_ERROR', 500, details);
  }
}

/**
 * AI service errors
 */
export class AIError extends AppError {
  constructor(
    message: string,
    code: string = 'AI_SERVICE_ERROR',
    statusCode: number = 502,
    details?: Record<string, unknown>
  ) {
    super(message, code, statusCode, details);
  }

  /**
   * Creates error for AI generation failures
   */
  static generationFailed(operation: string, reason?: string): AIError {
    return new AIError(
      `AI ${operation} failed${reason ? `: ${reason}` : ''}`,
      'AI_GENERATION_FAILED',
      502,
      { operation, reason }
    );
  }

  /**
   * Creates error for rate limiting
   */
  static rateLimitExceeded(retryAfter?: number): AIError {
    return new AIError(
      'AI service rate limit exceeded. Please try again later.',
      'AI_RATE_LIMIT',
      429,
      { retryAfter }
    );
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Formats any error into user-friendly message
 */
export function formatErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Logs error with context for debugging
 */
export function logError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    message: formatErrorMessage(error),
    context,
  };

  if (isAppError(error)) {
    console.error('[AppError]', {
      ...errorInfo,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.stack,
    });
  } else if (error instanceof Error) {
    console.error('[Error]', {
      ...errorInfo,
      name: error.name,
      stack: error.stack,
    });
  } else {
    console.error('[UnknownError]', {
      ...errorInfo,
      raw: error,
    });
  }
}

/**
 * Safely extracts error details for API responses
 */
export function serializeError(error: unknown): {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
} {
  if (isAppError(error)) {
    return error.toJSON();
  }

  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: formatErrorMessage(error),
    },
  };
}

/**
 * Creates a standardized error response for API routes
 */
export function createErrorResponse(
  error: unknown,
  defaultStatusCode: number = 500
): Response {
  const statusCode = isAppError(error) ? error.statusCode : defaultStatusCode;
  const body = serializeError(error);

  return Response.json(body, { status: statusCode });
}

/**
 * Wraps async functions with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Record<string, unknown>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, { ...context, args });
      throw error;
    }
  }) as T;
}
