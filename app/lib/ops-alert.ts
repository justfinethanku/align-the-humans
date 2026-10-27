/**
 * Operational alerts for failures a person has to see.
 *
 * Auth-hook 401/500s and rejected Resend sends call `reportOpsAlert`.
 * When `OPS_ALERT_EMAIL` is set (comma-separated), the first occurrence of
 * a failure in a 15-minute window is emailed from the existing Resend
 * account. Repeats in that window stay in the logs. When the variable is
 * unset or has no usable address, this logs and returns; it never throws
 * and never changes the caller's response.
 */

import { checkRateLimit, type RateLimitOptions, type RateLimitResult, type RateLimitStore } from './rate-limit';

export const OPS_ALERT_WINDOW_MS = 15 * 60 * 1000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type OpsAlertSource = 'auth-email' | 'resend';

export type OpsAlert = {
  source: OpsAlertSource;
  status: number;
  summary: string;
  detail?: string;
};

export type OpsAlertMessage = {
  to: string[];
  subject: string;
  text: string;
  /** Stable across a failure class. The rate limit uses this, not the time bucket. */
  dedupeKey: string;
  idempotencyKey: string;
};

export type OpsAlertSend = (
  message: OpsAlertMessage
) => Promise<{ id?: string; error?: string }>;

export type OpsAlertResult =
  | { delivered: true; id?: string }
  | { delivered: false; reason: 'unconfigured' | 'coalesced' | 'send-failed'; error?: string };

export type OpsAlertDeps = {
  recipients?: string[];
  now?: number;
  send?: OpsAlertSend;
  rateLimit?: (
    key: string,
    opts: RateLimitOptions,
    store?: RateLimitStore
  ) => Promise<RateLimitResult>;
};

export function isAuthEmailAlertStatus(status: number): boolean {
  return status === 401 || status === 500;
}

export function parseOpsAlertRecipients(raw: string | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const recipients: string[] = [];
  for (const part of raw.split(',')) {
    const email = part.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email) || seen.has(email)) continue;
    seen.add(email);
    recipients.push(email);
  }
  return recipients;
}

export function redactOpsAlertText(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/whsec_[A-Za-z0-9+/=_-]+/g, '[redacted-secret]')
    .replace(/\bre_[A-Za-z0-9]{6,}\b/g, '[redacted-secret]');
}

function compact(value: string, max: number): string {
  const cleaned = redactOpsAlertText(value).replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, Math.max(0, max - 3))}...`;
}

function slug(value: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return cleaned || 'unknown';
}

export function buildOpsAlert(
  input: OpsAlert,
  recipients: string[],
  now: number
): OpsAlertMessage {
  const summary = compact(input.summary, 180) || 'Unknown failure';
  const detail = input.detail ? compact(input.detail, 300) : '';
  const bucket = Math.floor(now / OPS_ALERT_WINDOW_MS);
  const windowStart = new Date(bucket * OPS_ALERT_WINDOW_MS).toISOString();
  const identity = slug(`${input.source}-${input.status}-${summary}-${detail}`);

  const lines = [
    'Align the Humans ops alert',
    '',
    `Source: ${input.source}`,
    `Status: ${input.status}`,
    `Summary: ${summary}`,
  ];
  if (detail) lines.push(`Detail: ${detail}`);
  lines.push(
    `Window start: ${windowStart}`,
    '',
    'The same failure is written to the logs on every request.',
    'It is emailed at most once per 15 minutes.',
    '',
    'Auth hook route: POST /api/auth/email'
  );

  return {
    to: recipients,
    subject: `[Align the Humans] ${input.source} ${input.status}: ${compact(summary, 80)}`,
    text: lines.join('\n'),
    dedupeKey: `ops-alert:${identity}`,
    idempotencyKey: `ops-alert/${identity}/${bucket}`.slice(0, 256),
  };
}

async function sendWithResend(message: OpsAlertMessage): Promise<{ id?: string; error?: string }> {
  const { getResendClient, FROM_EMAIL } = await import('./resend');
  const resend = getResendClient();
  const { data, error } = await resend.emails.send(
    {
      from: FROM_EMAIL,
      to: message.to,
      subject: message.subject,
      text: message.text,
    },
    { idempotencyKey: message.idempotencyKey }
  );
  if (error) return { error: error.message };
  return { id: data?.id };
}

function logResult(input: OpsAlert, result: OpsAlertResult): void {
  const record = {
    source: input.source,
    status: input.status,
    summary: compact(input.summary, 180),
    delivered: result.delivered,
    reason: result.delivered ? undefined : result.reason,
    error: result.delivered ? undefined : result.error,
  };
  if (result.delivered) {
    console.log('[ops-alert]', record);
    return;
  }
  console.error('[ops-alert]', record);
}

/**
 * Emails one operational alert, or records why it did not.
 * Never throws. A failure to alert must not change the request that reported it.
 */
export async function reportOpsAlert(
  input: OpsAlert,
  deps: OpsAlertDeps = {}
): Promise<OpsAlertResult> {
  try {
    const recipients =
      deps.recipients ?? parseOpsAlertRecipients(process.env.OPS_ALERT_EMAIL);
    if (recipients.length === 0) {
      const result: OpsAlertResult = { delivered: false, reason: 'unconfigured' };
      logResult(input, result);
      return result;
    }

    const now = deps.now ?? Date.now();
    const message = buildOpsAlert(input, recipients, now);
    const limit = deps.rateLimit ?? checkRateLimit;
    const gate = await limit(message.dedupeKey, {
      limit: 1,
      windowMs: OPS_ALERT_WINDOW_MS,
    });
    if (!gate.ok) {
      const result: OpsAlertResult = { delivered: false, reason: 'coalesced' };
      logResult(input, result);
      return result;
    }

    const send = deps.send ?? sendWithResend;
    const sent = await send(message);
    if (sent.error) {
      const result: OpsAlertResult = {
        delivered: false,
        reason: 'send-failed',
        error: compact(sent.error, 300),
      };
      logResult(input, result);
      return result;
    }

    const result: OpsAlertResult = { delivered: true, id: sent.id };
    logResult(input, result);
    return result;
  } catch (err) {
    const result: OpsAlertResult = {
      delivered: false,
      reason: 'send-failed',
      error: compact(err instanceof Error ? err.message : 'Unknown alert error', 300),
    };
    logResult(input, result);
    return result;
  }
}
