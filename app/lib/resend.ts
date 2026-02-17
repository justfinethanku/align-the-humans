/**
 * Resend Email Client
 *
 * Centralized email sending via Resend API.
 * All transactional emails go through this module.
 */

import { Resend } from 'resend';

let resendClient: Resend | null = null;

/**
 * Gets the singleton Resend client instance
 */
export function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        'Missing RESEND_API_KEY environment variable. ' +
        'Get your API key from https://resend.com/api-keys'
      );
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/** Default sender address */
export const FROM_EMAIL = 'Human Alignment <noreply@alignthehumans.com>';

/** Support sender address */
export const SUPPORT_EMAIL = 'Human Alignment <support@alignthehumans.com>';

/**
 * Gets the app base URL for email links
 */
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://alignthehumans.com';
}
