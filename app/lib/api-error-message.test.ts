import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AI_OUTPUT_RETRY_MESSAGE, messageFromFailedResponse } from './api-error-message';

test('a failed AI response yields its message, and a bare body stays retryable', async () => {
  const withMessage = new Response(
    JSON.stringify({
      error: { code: 'AI_GENERATION_FAILED', message: AI_OUTPUT_RETRY_MESSAGE },
    }),
    { status: 502, headers: { 'Content-Type': 'application/json' } }
  );
  assert.equal(
    await messageFromFailedResponse(withMessage, 'Failed to fetch suggestions'),
    AI_OUTPUT_RETRY_MESSAGE
  );

  const bare = new Response('Bad Gateway', { status: 502 });
  assert.equal(
    await messageFromFailedResponse(bare, AI_OUTPUT_RETRY_MESSAGE),
    AI_OUTPUT_RETRY_MESSAGE
  );

  const emptyMessage = new Response(JSON.stringify({ error: { message: '  ' } }), { status: 502 });
  assert.equal(
    await messageFromFailedResponse(emptyMessage, AI_OUTPUT_RETRY_MESSAGE),
    AI_OUTPUT_RETRY_MESSAGE
  );
});
