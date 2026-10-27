/**
 * Email Service
 *
 * High-level functions for sending transactional emails.
 * All email sends go through Resend with React Email templates.
 */

import { reportOpsAlert } from './ops-alert';
import { getResendClient, FROM_EMAIL, getAppUrl } from './resend';
import { InvitePartnerEmail } from './emails/invite-partner';
import { AlignmentReadyEmail } from './emails/alignment-ready';
import { AnalysisCompleteEmail } from './emails/analysis-complete';
import { AlignmentCompleteEmail } from './emails/alignment-complete';
import { WelcomeEmail } from './emails/welcome';

interface SendResult {
  success: boolean;
  id?: string;
  error?: string;
}

function describeSendError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return 'Unknown error';
}

async function failSend(kind: string, error: unknown): Promise<SendResult> {
  const message = describeSendError(error);
  console.error(`[Email] ${kind} send failed:`, error);
  await reportOpsAlert({
    source: 'resend',
    status: 500,
    summary: `Resend rejected ${kind}`,
    detail: message,
  });
  return { success: false, error: message };
}

/**
 * Send partner invite email
 */
export async function sendInviteEmail(params: {
  to: string;
  inviterName: string;
  alignmentTitle: string;
  inviteUrl: string;
}): Promise<SendResult> {
  const resend = getResendClient();
  const appUrl = getAppUrl();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `${params.inviterName} invited you to align on "${params.alignmentTitle}"`,
      react: InvitePartnerEmail({
        inviterName: params.inviterName,
        alignmentTitle: params.alignmentTitle,
        inviteUrl: params.inviteUrl,
        appUrl,
      }),
    });

    if (error) return failSend('invite', error);

    return { success: true, id: data?.id };
  } catch (err) {
    return failSend('invite', err);
  }
}

/**
 * Send "both responses submitted" notification
 */
export async function sendAlignmentReadyEmail(params: {
  to: string;
  recipientName: string;
  partnerName: string;
  alignmentTitle: string;
  alignmentId: string;
}): Promise<SendResult> {
  const resend = getResendClient();
  const appUrl = getAppUrl();
  const alignmentUrl = `${appUrl}/alignment/${params.alignmentId}/analysis`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `Both responses are in for "${params.alignmentTitle}"`,
      react: AlignmentReadyEmail({
        recipientName: params.recipientName,
        partnerName: params.partnerName,
        alignmentTitle: params.alignmentTitle,
        alignmentUrl,
        appUrl,
      }),
    });

    if (error) return failSend('alignment-ready', error);

    return { success: true, id: data?.id };
  } catch (err) {
    return failSend('alignment-ready', err);
  }
}

/**
 * Send analysis complete notification
 */
export async function sendAnalysisCompleteEmail(params: {
  to: string;
  recipientName: string;
  alignmentTitle: string;
  alignmentId: string;
  alignmentScore: number;
  conflictCount: number;
  agreementCount: number;
}): Promise<SendResult> {
  const resend = getResendClient();
  const appUrl = getAppUrl();
  const alignmentUrl = `${appUrl}/alignment/${params.alignmentId}/analysis`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `Analysis ready: ${params.alignmentScore}% aligned on "${params.alignmentTitle}"`,
      react: AnalysisCompleteEmail({
        recipientName: params.recipientName,
        alignmentTitle: params.alignmentTitle,
        alignmentScore: params.alignmentScore,
        conflictCount: params.conflictCount,
        agreementCount: params.agreementCount,
        alignmentUrl,
        appUrl,
      }),
    });

    if (error) return failSend('analysis-complete', error);

    return { success: true, id: data?.id };
  } catch (err) {
    return failSend('analysis-complete', err);
  }
}

/**
 * Send alignment complete (both signed) notification
 */
export async function sendAlignmentCompleteEmail(params: {
  to: string;
  recipientName: string;
  partnerName: string;
  alignmentTitle: string;
  alignmentId: string;
}): Promise<SendResult> {
  const resend = getResendClient();
  const appUrl = getAppUrl();
  const documentUrl = `${appUrl}/alignment/${params.alignmentId}/document`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `Agreement signed: "${params.alignmentTitle}"`,
      react: AlignmentCompleteEmail({
        recipientName: params.recipientName,
        partnerName: params.partnerName,
        alignmentTitle: params.alignmentTitle,
        documentUrl,
        appUrl,
      }),
    });

    if (error) return failSend('alignment-complete', error);

    return { success: true, id: data?.id };
  } catch (err) {
    return failSend('alignment-complete', err);
  }
}

/**
 * Send welcome email after signup
 */
export async function sendWelcomeEmail(params: {
  to: string;
  userName: string;
}): Promise<SendResult> {
  const resend = getResendClient();
  const appUrl = getAppUrl();
  const dashboardUrl = `${appUrl}/dashboard`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: 'Welcome to Human Alignment',
      react: WelcomeEmail({
        userName: params.userName,
        dashboardUrl,
        appUrl,
      }),
    });

    if (error) return failSend('welcome', error);

    return { success: true, id: data?.id };
  } catch (err) {
    return failSend('welcome', err);
  }
}
