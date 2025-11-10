/**
 * TypeScript types for Human Alignment application
 * Generated from database schema in supabase/migrations/20251110051815_init_human_alignment.sql
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * Alignment workflow status - enforces state machine transitions
 * Valid transitions: draft → active → analyzing → resolving → complete
 */
export type AlignmentStatus = 'draft' | 'active' | 'analyzing' | 'resolving' | 'complete';

/**
 * UI-specific status labels derived from alignment status and conditions
 * See supabase_cli.md lines 164-213 for mapping logic
 */
export type UIStatus =
  | 'waiting_partner'              // One participant submitted, waiting for other
  | 'in_conflict_resolution'       // In resolving phase with outstanding conflicts
  | 'aligned_awaiting_signatures'  // Conflicts resolved, awaiting digital signatures
  | 'complete'                     // All parties signed, alignment finalized
  | 'stalled';                     // No activity for 7+ days (non-complete status)

/**
 * Question types for alignment templates
 */
export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'multiple_choice'
  | 'checkbox'
  | 'number'
  | 'scale';

/**
 * Conflict severity levels for AI analysis
 */
export type ConflictSeverity = 'critical' | 'moderate' | 'minor';

/**
 * Participant roles in alignment workflow
 */
export type ParticipantRole = 'owner' | 'partner';

// ============================================================================
// Database Tables
// ============================================================================

/**
 * User profile linked to auth.users
 * 1:1 relationship with Supabase Auth
 */
export interface Profile {
  id: string;                    // UUID, references auth.users(id)
  display_name: string | null;
  created_at: string;            // ISO 8601 timestamptz
  updated_at: string;            // ISO 8601 timestamptz
}

/**
 * Partnership relationship between two users
 * Can be extended to support >2 participants if needed
 */
export interface Partner {
  id: string;                    // UUID
  created_by: string;            // UUID, references auth.users(id)
  created_at: string;            // ISO 8601 timestamptz
  updated_at: string;            // ISO 8601 timestamptz
}

/**
 * Alignment workflow instance
 * Tracks status, rounds, and references to partners/templates
 */
export interface Alignment {
  id: string;                    // UUID
  partner_id: string;            // UUID, references partners(id)
  template_id?: string | null;   // UUID, references templates(id)
  status: AlignmentStatus;
  current_round: number;         // Default: 1
  title: string | null;
  created_by: string;            // UUID, references auth.users(id)
  created_at: string;            // ISO 8601 timestamptz
  updated_at: string;            // ISO 8601 timestamptz
}

/**
 * Links users to alignment instances with roles
 * Unique constraint on (alignment_id, user_id)
 */
export interface AlignmentParticipant {
  id: string;                    // UUID
  alignment_id: string;          // UUID, references alignments(id)
  user_id: string;               // UUID, references auth.users(id)
  role: ParticipantRole;
  created_at: string;            // ISO 8601 timestamptz
}

/**
 * Reusable question sets with JSONB content
 * Supports versioning and optional JSON Schema validation
 */
export interface Template {
  id: string;                    // UUID
  name: string;
  version: number;               // Default: 1
  schema: TemplateSchema | null; // Optional JSON Schema validation
  content: TemplateContent;      // Question list and structure
  created_by: string;            // UUID, references auth.users(id)
  created_at: string;            // ISO 8601 timestamptz
  updated_at: string;            // ISO 8601 timestamptz
}

/**
 * Per-user responses for each alignment round
 * Unique constraint on (alignment_id, user_id, round)
 * JSONB structure documented in supabase_cli.md lines 126-138
 */
export interface AlignmentResponse {
  id: string;                    // UUID
  alignment_id: string;          // UUID, references alignments(id)
  user_id: string;               // UUID, references auth.users(id)
  round: number;
  response_version: number;      // Default: 1
  answers: ResponseAnswers;      // JSONB structure
  metadata: ResponseMetadata | null; // JSONB metadata
  submitted_at: string | null;   // ISO 8601 timestamptz - null until finalized
  created_at: string;            // ISO 8601 timestamptz
  updated_at: string;            // ISO 8601 timestamptz
}

/**
 * AI analysis results per alignment round
 * Unique constraint on (alignment_id, round)
 */
export interface AlignmentAnalysis {
  id: string;                    // UUID
  alignment_id: string;          // UUID, references alignments(id)
  round: number;
  summary: AnalysisSummary | null; // Compact UI summary
  details: AnalysisDetails | null; // Full model output
  created_by: string | null;     // UUID, references auth.users(id)
  created_at: string;            // ISO 8601 timestamptz
}

/**
 * Digital signatures for finalized agreements
 * Unique constraint on (alignment_id, user_id, round)
 */
export interface AlignmentSignature {
  id: string;                    // UUID
  alignment_id: string;          // UUID, references alignments(id)
  user_id: string;               // UUID, references auth.users(id)
  round: number;
  canonical_snapshot: CanonicalSnapshot; // Frozen copy of signed content
  signature: string;             // Hash or cryptographic signature
  created_at: string;            // ISO 8601 timestamptz
}

// ============================================================================
// JSONB Field Types
// ============================================================================

/**
 * Template JSON Schema validation structure (optional)
 */
export interface TemplateSchema {
  [key: string]: unknown;        // JSON Schema structure
}

/**
 * Template content structure
 * Contains questions, AI prompts, and configuration
 */
export interface TemplateContent {
  questions: TemplateQuestion[];
  ai_context?: string;           // Context for AI analysis
  metadata?: {
    category?: string;
    difficulty?: string;
    estimated_time?: number;     // Minutes
    [key: string]: unknown;
  };
}

/**
 * Individual question in a template
 */
export interface TemplateQuestion {
  id: string;                    // Question identifier (e.g., "q_1")
  type: QuestionType;
  text: string;                  // Question text
  required?: boolean;
  options?: string[];            // For multiple_choice/checkbox
  min?: number;                  // For scale/number
  max?: number;                  // For scale/number
  placeholder?: string;
  help_text?: string;
  ai_prompt?: string;            // AI guidance for this question
}

/**
 * Response answers structure (JSONB)
 * Documented in supabase_cli.md lines 126-138
 */
export interface ResponseAnswers {
  response_version: number;      // Version for schema evolution
  answers: {
    [questionId: string]: AnswerValue;
  };
  metadata?: {
    device?: string;
    latency_ms?: number;
    [key: string]: unknown;
  };
}

/**
 * Individual answer value
 * Structure varies by question type
 */
export interface AnswerValue {
  value: string | number | string[] | boolean;
  confidence?: number;           // 0-1 scale
  explanation?: string;          // User's explanation
  timestamp?: string;            // ISO 8601
}

/**
 * Response metadata
 */
export interface ResponseMetadata {
  device?: string;
  user_agent?: string;
  ip_address?: string;
  session_duration_ms?: number;
  [key: string]: unknown;
}

/**
 * Analysis summary for UI display
 */
export interface AnalysisSummary {
  alignment_score: number;       // 0-100
  conflicts: ConflictItem[];
  agreements: AgreementItem[];
  recommendations: string[];
}

/**
 * Conflict identified by AI
 */
export interface ConflictItem {
  question_id: string;
  severity: ConflictSeverity;
  description: string;
  user1_response: unknown;
  user2_response: unknown;
  suggested_resolution?: string;
}

/**
 * Agreement identified by AI
 */
export interface AgreementItem {
  question_id: string;
  description: string;
  shared_value: unknown;
}

/**
 * Full analysis details
 * Contains complete AI model output
 */
export interface AnalysisDetails {
  model: string;                 // e.g., "claude-sonnet-4-5-20250929"
  prompt_tokens: number;
  completion_tokens: number;
  raw_output: string;
  conflicts_detailed: ConflictDetailedItem[];
  processing_time_ms: number;
  [key: string]: unknown;
}

/**
 * Detailed conflict analysis
 */
export interface ConflictDetailedItem extends ConflictItem {
  resolution_strategies: string[];
  compromise_options: string[];
  impact_assessment: string;
}

/**
 * Canonical snapshot of signed content
 */
export interface CanonicalSnapshot {
  alignment_id: string;
  round: number;
  questions: TemplateQuestion[];
  responses: {
    [userId: string]: ResponseAnswers;
  };
  analysis: AnalysisSummary;
  timestamp: string;             // ISO 8601
  hash: string;                  // SHA-256 hash of content
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for AlignmentStatus
 */
export function isAlignmentStatus(value: unknown): value is AlignmentStatus {
  return typeof value === 'string' &&
    ['draft', 'active', 'analyzing', 'resolving', 'complete'].includes(value);
}

/**
 * Type guard for UIStatus
 */
export function isUIStatus(value: unknown): value is UIStatus {
  return typeof value === 'string' &&
    ['waiting_partner', 'in_conflict_resolution', 'aligned_awaiting_signatures', 'complete', 'stalled'].includes(value);
}

/**
 * Type guard for QuestionType
 */
export function isQuestionType(value: unknown): value is QuestionType {
  return typeof value === 'string' &&
    ['short_text', 'long_text', 'multiple_choice', 'checkbox', 'number', 'scale'].includes(value);
}

/**
 * Type guard for ConflictSeverity
 */
export function isConflictSeverity(value: unknown): value is ConflictSeverity {
  return typeof value === 'string' &&
    ['critical', 'moderate', 'minor'].includes(value);
}

/**
 * Type guard for ParticipantRole
 */
export function isParticipantRole(value: unknown): value is ParticipantRole {
  return typeof value === 'string' &&
    ['owner', 'partner'].includes(value);
}

/**
 * Type guard for Profile
 */
export function isProfile(value: unknown): value is Profile {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    (obj.display_name === null || typeof obj.display_name === 'string') &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  );
}

/**
 * Type guard for Alignment
 */
export function isAlignment(value: unknown): value is Alignment {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.partner_id === 'string' &&
    isAlignmentStatus(obj.status) &&
    typeof obj.current_round === 'number' &&
    (obj.title === null || typeof obj.title === 'string') &&
    typeof obj.created_by === 'string' &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  );
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Partial alignment for creation (excludes generated fields)
 */
export type AlignmentCreate = Omit<Alignment, 'id' | 'created_at' | 'updated_at' | 'current_round'> & {
  current_round?: number;
};

/**
 * Partial alignment for updates (only modifiable fields)
 */
export type AlignmentUpdate = Partial<Pick<Alignment, 'status' | 'current_round' | 'title'>>;

/**
 * Response creation payload
 */
export type AlignmentResponseCreate = Omit<AlignmentResponse, 'id' | 'created_at' | 'updated_at' | 'response_version'> & {
  response_version?: number;
};

/**
 * Response update payload
 */
export type AlignmentResponseUpdate = Partial<Pick<AlignmentResponse, 'answers' | 'metadata' | 'submitted_at'>>;

/**
 * Alignment with participant details (joined query)
 */
export interface AlignmentWithParticipants extends Alignment {
  participants: AlignmentParticipant[];
}

/**
 * Alignment with full context (for dashboard/details pages)
 */
export interface AlignmentDetail extends Alignment {
  participants: AlignmentParticipant[];
  latest_analysis?: AlignmentAnalysis;
  user_response?: AlignmentResponse;
  partner_response?: AlignmentResponse;
  signatures?: AlignmentSignature[];
}

/**
 * Database query result wrapper
 */
export interface QueryResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Paginated query result
 */
export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

/**
 * Realtime event payload
 */
export interface RealtimeEvent<T = unknown> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | null;
  old: T | null;
  table: string;
  schema: string;
  commit_timestamp: string;
}

// ============================================================================
// State Machine Validation
// ============================================================================

/**
 * Valid status transitions map
 */
export const VALID_STATUS_TRANSITIONS: Record<AlignmentStatus, AlignmentStatus[]> = {
  draft: ['active'],
  active: ['analyzing'],
  analyzing: ['resolving'],
  resolving: ['complete'],
  complete: [], // Terminal state
};

/**
 * Validates alignment status transition
 * @param fromStatus Current status
 * @param toStatus Target status
 * @returns true if transition is valid
 */
export function isValidStatusTransition(
  fromStatus: AlignmentStatus,
  toStatus: AlignmentStatus
): boolean {
  return VALID_STATUS_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false;
}

/**
 * Gets next valid statuses for current status
 * @param status Current status
 * @returns Array of valid next statuses
 */
export function getNextValidStatuses(status: AlignmentStatus): AlignmentStatus[] {
  return VALID_STATUS_TRANSITIONS[status] ?? [];
}

// ============================================================================
// AlignmentQuestion Types (for AI generation)
// ============================================================================

/**
 * Question structure for AI-generated alignment templates
 * Based on plan_a.md lines 792-806
 */
export interface AlignmentQuestion {
  id: string;                       // Question slug, e.g., "equity_split_ratio"
  prompt: string;                   // Question text
  description?: string;             // Optional description/help text
  type: QuestionType;               // Question input type
  required: boolean;                // Whether answer is required
  options?: Array<{                 // For choice/scale types
    id: string;
    label: string;
  }>;
  followUps?: AlignmentQuestion[];  // Optional nested questions
  aiHints?: {
    explainPrompt?: string;         // Seed text for "Explain this" AI prompt
    examplePrompt?: string;         // Seed text for "Show examples" AI prompt
    suggestionPrompt?: string;      // Seed text for "Get suggestions" AI prompt
  };
  metadata?: Record<string, unknown>; // Category tags, round, etc.
}

/**
 * Template seed types for AI generation
 */
export type TemplateSeed = 'operating_agreement' | 'custom';

/**
 * Clarity context for AI question generation
 */
export interface ClarityContext {
  topic: string;              // What the alignment is about
  participants: string[];     // Names/identifiers of participants
  desiredOutcome: string;     // What the users hope to achieve
}

/**
 * Question generation request payload
 */
export interface GenerateQuestionsRequest {
  alignmentId: string;
  templateSeed: TemplateSeed;
  clarity: ClarityContext;
  seedTemplateId?: string;
}

/**
 * Question generation response payload
 */
export interface GenerateQuestionsResponse {
  data: {
    templateId: string;
    version: number;
    source: {
      type: 'ai' | 'curated';
      model?: string;
    };
    questions: AlignmentQuestion[];
  };
}

// ============================================================================
// Alignment Invitation Types (Share Link System)
// ============================================================================

/**
 * Alignment invitation stored in database
 * Token is hashed (SHA-256) for security
 */
export interface AlignmentInvitation {
  id: string;
  alignment_id: string;
  token_hash: string;
  created_by: string;
  expires_at: string | null;
  max_uses: number;
  current_uses: number;
  invalidated_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Response when creating a new invite token
 * Raw token is only returned once - not stored in database
 */
export interface InviteTokenResponse {
  token: string;               // Raw token (only returned once)
  invite_url: string;           // Full URL with token
  expires_at: string;           // ISO 8601 expiration timestamp
}

/**
 * Request payload for joining alignment via invite link
 */
export interface JoinAlignmentRequest {
  token: string;                // Raw invite token from URL
}

/**
 * Response after successfully joining alignment
 */
export interface JoinAlignmentResponse {
  success: boolean;
  alignment_id: string;
  message: string;
}
