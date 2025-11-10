/**
 * Centralized exports for database types, clients, and helpers
 * Use this barrel export to import all library utilities
 *
 * @example
 * import { createServerClient, getProfile, isAlignmentStatus } from '@/app/lib';
 */

// Database types
export * from './database.types';

// Application types and type guards
export * from './types';

// Supabase clients
export * from './supabase-browser';
export * from './supabase-server';

// Database helper functions
export * from './db-helpers';
