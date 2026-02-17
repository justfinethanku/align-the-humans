/**
 * Drizzle ORM Schema
 *
 * Mirrors the existing Supabase PostgreSQL schema for type-safe queries.
 * Tables defined here match the migrations in supabase/migrations/.
 *
 * Note: auth.users is managed by Supabase Auth and not defined here.
 * Foreign keys to auth.users use `uuid` columns without Drizzle relations.
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  uniqueIndex,
  index,
  varchar,
  numeric,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/** Helper: timestamptz column (timestamp with timezone, returned as string) */
const timestamptz = (name: string) =>
  timestamp(name, { withTimezone: true, mode: 'string' });

// ============================================================================
// Core Tables
// ============================================================================

/**
 * User profiles (1:1 with auth.users)
 */
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // references auth.users(id)
  displayName: text('display_name'),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
});

/**
 * Partners: represents a partnership between users
 */
export const partners = pgTable('partners', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdBy: uuid('created_by').notNull(), // references auth.users(id)
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
});

/**
 * Templates: reusable question sets
 */
export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  version: integer('version').notNull().default(1),
  schema: jsonb('schema'),
  content: jsonb('content').notNull(),
  createdBy: uuid('created_by').notNull(), // references auth.users(id)
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
});

/**
 * Alignment invitations: secure share links
 */
export const alignmentInvitations = pgTable('alignment_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  alignmentId: uuid('alignment_id').notNull(),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  tokenCiphertext: text('token_ciphertext'),
  createdBy: uuid('created_by').notNull(), // references profiles(id)
  expiresAt: timestamptz('expires_at'),
  maxUses: integer('max_uses').default(1),
  currentUses: integer('current_uses').default(0),
  invalidatedAt: timestamptz('invalidated_at'),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('idx_alignment_invitations_token_hash').on(table.tokenHash),
  index('idx_alignment_invitations_alignment_id').on(table.alignmentId),
  index('idx_alignment_invitations_created_by').on(table.createdBy),
]);

/**
 * Alignments: a workflow instance
 */
export const alignments = pgTable('alignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  partnerId: uuid('partner_id').references(() => partners.id, { onDelete: 'cascade' }),
  status: text('status').notNull(), // draft | active | analyzing | resolving | complete
  currentRound: integer('current_round').notNull().default(1),
  title: text('title'),
  createdBy: uuid('created_by').notNull(), // references auth.users(id)
  templateId: uuid('template_id').references(() => templates.id),
  currentInviteId: uuid('current_invite_id').references(() => alignmentInvitations.id, { onDelete: 'set null' }),
  allowSoloStart: boolean('allow_solo_start').default(true),
  clarityDraft: jsonb('clarity_draft').notNull().default({}),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
}, (table) => [
  index('idx_alignments_partner').on(table.partnerId),
  index('idx_alignments_status_round').on(table.status, table.currentRound),
]);

/**
 * Alignment participants: links users to alignments
 */
export const alignmentParticipants = pgTable('alignment_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  alignmentId: uuid('alignment_id').notNull().references(() => alignments.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(), // references auth.users(id)
  role: text('role').notNull(), // owner | partner
  createdAt: timestamptz('created_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('alignment_participants_alignment_id_user_id_key').on(table.alignmentId, table.userId),
  index('idx_alignment_participants_user_alignment').on(table.userId, table.alignmentId),
]);

/**
 * Alignment responses: per-user answers per round
 */
export const alignmentResponses = pgTable('alignment_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  alignmentId: uuid('alignment_id').notNull().references(() => alignments.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(), // references auth.users(id)
  round: integer('round').notNull(),
  responseVersion: integer('response_version').notNull().default(1),
  answers: jsonb('answers').notNull().default({}),
  metadata: jsonb('metadata'),
  submittedAt: timestamptz('submitted_at'),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('alignment_responses_alignment_id_user_id_round_key').on(table.alignmentId, table.userId, table.round),
  index('idx_alignment_responses_alignment_user_round').on(table.alignmentId, table.userId, table.round),
  index('idx_alignment_responses_submitted_at').on(table.submittedAt),
]);

/**
 * Alignment analyses: AI output per round
 */
export const alignmentAnalyses = pgTable('alignment_analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  alignmentId: uuid('alignment_id').notNull().references(() => alignments.id, { onDelete: 'cascade' }),
  round: integer('round').notNull(),
  summary: jsonb('summary'),
  details: jsonb('details'),
  createdBy: uuid('created_by'), // references auth.users(id)
  createdAt: timestamptz('created_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('alignment_analyses_alignment_id_round_key').on(table.alignmentId, table.round),
  index('idx_alignment_analyses_alignment_round').on(table.alignmentId, table.round),
]);

/**
 * Alignment signatures: cryptographic attestation of agreement
 */
export const alignmentSignatures = pgTable('alignment_signatures', {
  id: uuid('id').primaryKey().defaultRandom(),
  alignmentId: uuid('alignment_id').notNull().references(() => alignments.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(), // references auth.users(id)
  round: integer('round').notNull(),
  canonicalSnapshot: jsonb('canonical_snapshot').notNull(),
  signature: text('signature').notNull(),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('alignment_signatures_alignment_id_user_id_round_key').on(table.alignmentId, table.userId, table.round),
  index('idx_alignment_signatures_alignment_user').on(table.alignmentId, table.userId),
]);

// ============================================================================
// Phase 3 Tables: Prompt Management
// ============================================================================

/**
 * Prompt configurations: AI prompt templates stored in DB
 */
export const prompts = pgTable('prompts', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull().default('alignment'),
  model: text('model').notNull().default('claude-sonnet-4-6'),
  temperature: numeric('temperature', { precision: 3, scale: 2 }).notNull().default('0.3'),
  maxTokens: integer('max_tokens').notNull().default(4096),
  systemPrompt: text('system_prompt').notNull(),
  userPromptTemplate: text('user_prompt_template').notNull(),
  outputSchema: jsonb('output_schema'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamptz('created_at').defaultNow(),
  updatedAt: timestamptz('updated_at').defaultNow(),
});

/**
 * Prompt version history: tracks changes to prompts
 */
export const promptVersions = pgTable('prompt_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  promptId: uuid('prompt_id').notNull().references(() => prompts.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  model: text('model').notNull(),
  temperature: numeric('temperature', { precision: 3, scale: 2 }).notNull(),
  maxTokens: integer('max_tokens').notNull(),
  systemPrompt: text('system_prompt').notNull(),
  userPromptTemplate: text('user_prompt_template').notNull(),
  outputSchema: jsonb('output_schema'),
  changeNote: text('change_note'),
  createdBy: uuid('created_by').references(() => profiles.id),
  createdAt: timestamptz('created_at').defaultNow(),
}, (table) => [
  uniqueIndex('prompt_versions_prompt_id_version_key').on(table.promptId, table.version),
]);

// ============================================================================
// Phase 4 Table: Admin Audit Log
// ============================================================================

/**
 * Admin audit log: tracks admin actions
 */
export const adminAuditLog = pgTable('admin_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminId: uuid('admin_id').notNull().references(() => profiles.id),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(), // user | alignment | prompt | template
  targetId: uuid('target_id'),
  details: jsonb('details'),
  createdAt: timestamptz('created_at').defaultNow(),
});

// ============================================================================
// Relations
// ============================================================================

export const alignmentsRelations = relations(alignments, ({ one, many }) => ({
  partner: one(partners, {
    fields: [alignments.partnerId],
    references: [partners.id],
  }),
  template: one(templates, {
    fields: [alignments.templateId],
    references: [templates.id],
  }),
  currentInvite: one(alignmentInvitations, {
    fields: [alignments.currentInviteId],
    references: [alignmentInvitations.id],
  }),
  participants: many(alignmentParticipants),
  responses: many(alignmentResponses),
  analyses: many(alignmentAnalyses),
  signatures: many(alignmentSignatures),
}));

export const alignmentParticipantsRelations = relations(alignmentParticipants, ({ one }) => ({
  alignment: one(alignments, {
    fields: [alignmentParticipants.alignmentId],
    references: [alignments.id],
  }),
}));

export const alignmentResponsesRelations = relations(alignmentResponses, ({ one }) => ({
  alignment: one(alignments, {
    fields: [alignmentResponses.alignmentId],
    references: [alignments.id],
  }),
}));

export const alignmentAnalysesRelations = relations(alignmentAnalyses, ({ one }) => ({
  alignment: one(alignments, {
    fields: [alignmentAnalyses.alignmentId],
    references: [alignments.id],
  }),
}));

export const alignmentSignaturesRelations = relations(alignmentSignatures, ({ one }) => ({
  alignment: one(alignments, {
    fields: [alignmentSignatures.alignmentId],
    references: [alignments.id],
  }),
}));

export const promptsRelations = relations(prompts, ({ many }) => ({
  versions: many(promptVersions),
}));

export const promptVersionsRelations = relations(promptVersions, ({ one }) => ({
  prompt: one(prompts, {
    fields: [promptVersions.promptId],
    references: [prompts.id],
  }),
}));

export const alignmentInvitationsRelations = relations(alignmentInvitations, ({ one }) => ({
  alignment: one(alignments, {
    fields: [alignmentInvitations.alignmentId],
    references: [alignments.id],
  }),
}));
