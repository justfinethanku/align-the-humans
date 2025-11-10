/**
 * Environment Variable Validation and Type-Safe Access
 *
 * Validates required environment variables at runtime and provides
 * type-safe access to configuration values.
 */

interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  ai: {
    gatewayApiKey: string | undefined;
  };
  nodeEnv: 'development' | 'production' | 'test';
}

class EnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentError';
  }
}

/**
 * Validates that a required environment variable exists
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new EnvironmentError(
      `Missing required environment variable: ${key}. Please check your .env.local file.`
    );
  }
  return value;
}

/**
 * Gets an optional environment variable with a default value
 */
function getEnv(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

/**
 * Validates all required environment variables
 * Should be called at application startup
 */
export function validateEnvironment(): void {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new EnvironmentError(
      `Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}\n\nPlease check your .env.local file.`
    );
  }

  // Validate URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  try {
    new URL(supabaseUrl);
  } catch {
    throw new EnvironmentError(
      `Invalid NEXT_PUBLIC_SUPABASE_URL format: ${supabaseUrl}. Must be a valid URL.`
    );
  }
}

/**
 * Gets validated environment configuration
 * Throws if required variables are missing
 */
export function getEnvironment(): EnvironmentConfig {
  return {
    supabase: {
      url: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
      anonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    },
    ai: {
      // Optional for local dev - Vercel deployments use OIDC
      gatewayApiKey: getEnv('AI_GATEWAY_API_KEY'),
    },
    nodeEnv: (getEnv('NODE_ENV', 'development') as EnvironmentConfig['nodeEnv']),
  };
}

/**
 * Checks if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Checks if running in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Checks if running in test mode
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

/**
 * Type-safe environment access singleton
 */
let envCache: EnvironmentConfig | null = null;

export const env = {
  get config(): EnvironmentConfig {
    if (!envCache) {
      validateEnvironment();
      envCache = getEnvironment();
    }
    return envCache;
  },

  // Convenience accessors
  get supabaseUrl(): string {
    return this.config.supabase.url;
  },

  get supabaseAnonKey(): string {
    return this.config.supabase.anonKey;
  },

  get aiGatewayApiKey(): string | undefined {
    return this.config.ai.gatewayApiKey;
  },

  get isDev(): boolean {
    return isDevelopment();
  },

  get isProd(): boolean {
    return isProduction();
  },

  get isTest(): boolean {
    return isTest();
  },
};
