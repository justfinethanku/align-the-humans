/**
 * Drizzle-inferred types
 *
 * These types are derived directly from the Drizzle schema,
 * providing type-safe row types for all database tables.
 */

import type {
  profiles,
  partners,
  templates,
  alignments,
  alignmentParticipants,
  alignmentResponses,
  alignmentAnalyses,
  alignmentSignatures,
  alignmentInvitations,
  prompts,
  promptVersions,
  adminAuditLog,
} from './schema';

// ============================================================================
// Select types (what you get back from queries)
// ============================================================================

export type Profile = typeof profiles.$inferSelect;
export type Partner = typeof partners.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type DrizzleAlignment = typeof alignments.$inferSelect;
export type AlignmentParticipant = typeof alignmentParticipants.$inferSelect;
export type AlignmentResponse = typeof alignmentResponses.$inferSelect;
export type AlignmentAnalysis = typeof alignmentAnalyses.$inferSelect;
export type AlignmentSignature = typeof alignmentSignatures.$inferSelect;
export type AlignmentInvitation = typeof alignmentInvitations.$inferSelect;
export type Prompt = typeof prompts.$inferSelect;
export type PromptVersion = typeof promptVersions.$inferSelect;
export type AdminAuditLogEntry = typeof adminAuditLog.$inferSelect;

// ============================================================================
// Insert types (what you pass to insert queries)
// ============================================================================

export type NewProfile = typeof profiles.$inferInsert;
export type NewPartner = typeof partners.$inferInsert;
export type NewTemplate = typeof templates.$inferInsert;
export type NewAlignment = typeof alignments.$inferInsert;
export type NewAlignmentParticipant = typeof alignmentParticipants.$inferInsert;
export type NewAlignmentResponse = typeof alignmentResponses.$inferInsert;
export type NewAlignmentAnalysis = typeof alignmentAnalyses.$inferInsert;
export type NewAlignmentSignature = typeof alignmentSignatures.$inferInsert;
export type NewAlignmentInvitation = typeof alignmentInvitations.$inferInsert;
export type NewPrompt = typeof prompts.$inferInsert;
export type NewPromptVersion = typeof promptVersions.$inferInsert;
export type NewAdminAuditLogEntry = typeof adminAuditLog.$inferInsert;
