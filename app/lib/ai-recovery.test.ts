import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AI_MODELS, fallbackModelFor } from './ai-config';
import { generateObjectRecovered, generateTextRecovered } from './ai-generate';
import { AI_OUTPUT_RETRY_MESSAGE } from './api-error-message';
import { AIError, ValidationError } from './errors';
import {
  asAIGenerationError,
  EmptyModelOutputError,
  ensureUsableModelText,
  errorLogMessage,
  hasUsableSuggestionLines,
  InvalidModelOutputError,
  usableSuggestionLines,
  withModelRecovery,
} from './ai-recovery';

const silent = { log: () => {} };

test('an empty reply is retried on the same model before the fallback is called', async () => {
  const calls: string[] = [];
  const recovered = await withModelRecovery({
    modelId: 'z-ai/glm-5.2',
    fallbackModelId: AI_MODELS.HAIKU,
    ...silent,
    run: async (modelId) => {
      calls.push(modelId);
      if (calls.length === 1) throw new EmptyModelOutputError();
      return 'Share the work and the money.';
    },
  });

  assert.deepEqual(calls, ['z-ai/glm-5.2', 'z-ai/glm-5.2']);
  assert.equal(recovered.modelId, 'z-ai/glm-5.2');
  assert.equal(recovered.value, 'Share the work and the money.');
  assert.equal(recovered.attempts[0]?.outcome, 'retry');
  assert.equal(recovered.attempts[1]?.outcome, 'success');
});

test('empty replies on the primary model fall back to the second configured model', async () => {
  const calls: string[] = [];
  const recovered = await withModelRecovery({
    modelId: 'z-ai/glm-5.2',
    fallbackModelId: AI_MODELS.HAIKU,
    ...silent,
    run: async (modelId) => {
      calls.push(modelId);
      if (modelId === 'z-ai/glm-5.2') throw new EmptyModelOutputError();
      return 'A fallback suggestion.';
    },
  });

  assert.deepEqual(calls, ['z-ai/glm-5.2', 'z-ai/glm-5.2', AI_MODELS.HAIKU]);
  assert.equal(recovered.modelId, AI_MODELS.HAIKU);
  assert.equal(recovered.value, 'A fallback suggestion.');
});

test('a schema-invalid reply is retried, and a non-output error is not', async () => {
  const schemaCalls: string[] = [];
  await withModelRecovery({
    modelId: 'primary',
    fallbackModelId: 'fallback',
    ...silent,
    run: async (modelId) => {
      schemaCalls.push(modelId);
      if (schemaCalls.length < 3) {
        const error = new Error('No object generated');
        error.name = 'AI_NoObjectGeneratedError';
        throw error;
      }
      return { ok: true };
    },
  });
  assert.deepEqual(schemaCalls, ['primary', 'primary', 'fallback']);

  const stopped: string[] = [];
  await assert.rejects(
    () => withModelRecovery({
      modelId: 'primary',
      fallbackModelId: 'fallback',
      ...silent,
      run: async (modelId) => {
        stopped.push(modelId);
        const error = new Error('bad request');
        error.name = 'AI_APICallError';
        (error as { statusCode?: number }).statusCode = 400;
        throw error;
      },
    }),
    (error: unknown) => error instanceof Error && error.message === 'bad request'
  );
  assert.deepEqual(stopped, ['primary']);
});

test('exhausted empty replies surface a retryable user message and keep the model reason', () => {
  const reported = asAIGenerationError('clarity suggestion', new EmptyModelOutputError());
  assert.ok(reported instanceof AIError);
  assert.equal(reported.message, AI_OUTPUT_RETRY_MESSAGE);
  assert.equal(reported.code, 'AI_GENERATION_FAILED');
  assert.equal(reported.statusCode, 502);
  assert.equal(reported.details?.reason, 'Empty response from AI model');
  assert.match(errorLogMessage(reported), /Please try again/);
  assert.match(errorLogMessage(reported), /Empty response from AI model/);
});

test('validation errors and rate limits are not rewritten as empty-output failures', () => {
  const validation = new ValidationError('Invalid request body');
  assert.equal(asAIGenerationError('clarity suggestion', validation), validation);

  const rateLimited = Object.assign(new Error('provider rate limit'), { statusCode: 429 });
  const reported = asAIGenerationError('conflict resolution', rateLimited);
  assert.equal(reported.code, 'AI_RATE_LIMIT');
  assert.equal(reported.statusCode, 429);
});

test('blank and bullet-only suggestion text is unusable', () => {
  assert.equal(hasUsableSuggestionLines('   \n'), false);
  assert.equal(hasUsableSuggestionLines('-\n•\n*'), false);
  assert.deepEqual(
    usableSuggestionLines('1. Share the work\n- Write the split down\n• Leave it vague\n4. Extra'),
    ['Share the work', 'Write the split down', 'Leave it vague']
  );
  assert.throws(() => ensureUsableModelText('  '), EmptyModelOutputError);
  assert.throws(
    () => ensureUsableModelText('-\n•', hasUsableSuggestionLines),
    EmptyModelOutputError
  );
  assert.equal(ensureUsableModelText('Keep the decision written down.'), 'Keep the decision written down.');
});

test('generateTextRecovered treats an empty string as a failed attempt', async () => {
  const calls: string[] = [];
  const result = await generateTextRecovered(
    {
      modelId: 'z-ai/glm-5.2',
      task: 'suggestion',
      prompt: 'suggest',
      accept: hasUsableSuggestionLines,
      ...silent,
    },
    async (modelId) => {
      calls.push(modelId);
      if (calls.length === 1) return { text: '   ' };
      if (calls.length === 2) return { text: '-\n•' };
      return { text: 'Write down who decides.', usage: { inputTokens: 3, outputTokens: 4 } };
    }
  );

  assert.deepEqual(calls, ['z-ai/glm-5.2', 'z-ai/glm-5.2', AI_MODELS.HAIKU]);
  assert.equal(result.modelId, AI_MODELS.HAIKU);
  assert.equal(result.text, 'Write down who decides.');
  assert.equal(result.usage?.outputTokens, 4);
});

test('generateObjectRecovered retries a schema-invalid object', async () => {
  let calls = 0;
  const result = await generateObjectRecovered(
    {
      modelId: 'z-ai/glm-5.2',
      task: 'structured',
      schema: { parse: (value: unknown) => value } as never,
      prompt: 'resolve',
      ...silent,
      validate: (object: { options: string[] }) => {
        if (object.options.length < 3) {
          throw new InvalidModelOutputError('AI failed to generate sufficient compromise options');
        }
      },
    },
    async () => {
      calls += 1;
      if (calls < 3) return { options: ['only one'] };
      return { options: ['a', 'b', 'c'] };
    }
  );

  assert.equal(calls, 3);
  assert.equal(result.modelId, AI_MODELS.SONNET);
  assert.deepEqual(result.object.options, ['a', 'b', 'c']);
});

test('fallback model follows the task and skips the model already in use', () => {
  assert.equal(fallbackModelFor('z-ai/glm-5.2', 'suggestion'), AI_MODELS.HAIKU);
  assert.equal(fallbackModelFor('z-ai/glm-5.2', 'structured'), AI_MODELS.SONNET);
  assert.equal(fallbackModelFor(AI_MODELS.SONNET, 'structured'), AI_MODELS.HAIKU);
  assert.equal(fallbackModelFor(AI_MODELS.HAIKU, 'suggestion'), AI_MODELS.SONNET);
  assert.equal(fallbackModelFor('claude-haiku-4-5-20251001', 'suggestion'), AI_MODELS.SONNET);
  assert.equal(fallbackModelFor('', 'structured'), AI_MODELS.HAIKU);
});
