/**
 * User-facing copy for a failed AI call, and a reader for API error JSON.
 * Safe to import from client components.
 */

export const AI_OUTPUT_RETRY_MESSAGE =
  "The AI didn't return a usable answer. Please try again.";

/**
 * Reads `{ error: { message } }` from a failed response.
 * Returns `fallback` when the body is missing or not that shape.
 */
export async function messageFromFailedResponse(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const body = await response.json();
    const message = body?.error?.message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  } catch {
    // Non-JSON bodies (HTML error pages, empty 502s) use the fallback.
  }
  return fallback;
}
