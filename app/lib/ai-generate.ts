/**
 * generateText / generateObject calls that retry an empty or invalid reply
 * on the prompt's model, then on `fallbackModelFor`.
 */

import { generateObject, generateText, type LanguageModelUsage } from 'ai';
import type { ZodType } from 'zod';
import { fallbackModelFor, resolveModel, type ModelTask } from './ai-config';
import {
  ensureUsableModelText,
  withModelRecovery,
  type ModelAttempt,
} from './ai-recovery';

interface TextCall {
  system?: string;
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GeneratedText {
  text: string;
  usage?: Pick<LanguageModelUsage, 'inputTokens' | 'outputTokens'>;
}

type TextGenerator = (modelId: string, call: TextCall) => Promise<GeneratedText>;

async function defaultGenerateText(modelId: string, call: TextCall): Promise<GeneratedText> {
  const result = await generateText({
    model: resolveModel(modelId) as any,
    system: call.system,
    prompt: call.prompt,
    temperature: call.temperature,
    maxOutputTokens: call.maxOutputTokens,
  });
  return { text: result.text, usage: result.usage };
}

export async function generateTextRecovered(
  args: TextCall & {
    modelId: string;
    task?: ModelTask;
    accept?: (text: string) => boolean;
    onModel?: (modelId: string) => void;
    log?: (attempt: ModelAttempt) => void;
  },
  generate: TextGenerator = defaultGenerateText
): Promise<GeneratedText & { modelId: string }> {
  const task = args.task ?? 'suggestion';
  const recovered = await withModelRecovery({
    modelId: args.modelId,
    fallbackModelId: fallbackModelFor(args.modelId, task),
    onModel: args.onModel,
    log: args.log,
    run: async (modelId) => {
      const result = await generate(modelId, {
        system: args.system,
        prompt: args.prompt,
        temperature: args.temperature,
        maxOutputTokens: args.maxOutputTokens,
      });
      return {
        text: ensureUsableModelText(result.text, args.accept),
        usage: result.usage,
      };
    },
  });
  return { ...recovered.value, modelId: recovered.modelId };
}

type ObjectGenerator<T> = (modelId: string) => Promise<T>;

export async function generateObjectRecovered<T>(
  args: {
    modelId: string;
    task?: ModelTask;
    schema: ZodType<T>;
    system?: string;
    prompt: string;
    temperature?: number;
    maxOutputTokens?: number;
    validate?: (object: T) => void;
    onModel?: (modelId: string) => void;
    log?: (attempt: ModelAttempt) => void;
  },
  generate?: ObjectGenerator<T>
): Promise<{ object: T; modelId: string }> {
  const task = args.task ?? 'structured';
  const generateObjectForModel = generate ?? (async (modelId: string) => {
    const result = await generateObject({
      model: resolveModel(modelId) as any,
      schema: args.schema,
      system: args.system,
      prompt: args.prompt,
      temperature: args.temperature,
      maxOutputTokens: args.maxOutputTokens,
    });
    return result.object;
  });

  const recovered = await withModelRecovery({
    modelId: args.modelId,
    fallbackModelId: fallbackModelFor(args.modelId, task),
    onModel: args.onModel,
    log: args.log,
    run: async (modelId) => {
      const object = await generateObjectForModel(modelId);
      args.validate?.(object);
      return object;
    },
  });
  return { object: recovered.value, modelId: recovered.modelId };
}
