# 2026-10-28-1028 - ATH-50 question options

**Keywords:** [AI] [QUESTIONS] [VALIDATION] [OPENROUTER] [ATH-50]
**Session:** 2026-10-28 morning
**Commit:** this change

## What Changed

- Question generation keeps every generated question that passes `AlignmentQuestionSchema`. A multiple-choice, checkbox, or scale question with no options is dropped. The curated template is used only when nothing usable remains.
- The model schema still allows a missing `options` field, so one bad choice question does not fail the provider parse for the whole batch. Recovery retries only when the usable set is empty.
- The generate-questions prompt, in the seed and in a rule the route appends, says those three types require 3–5 options and that `long_text` is the alternative.
- `app/lib/generated-questions.test.ts` covers a model response that mixes valid questions with option-less choice questions.

## Why

On the ATH-2 real-model journey, `z-ai/glm-5.2` returned choice questions without options. `AlignmentQuestionsArraySchema` then failed the entire array, and the route served the curated questionnaire.

## How It Was Done

`selectUsableGeneratedQuestions` checks each question, repairs an id into snake case and string options into `{ id, label }`, drops an option-less choice question, and caps the kept list at 20. `isValidQuestion` now rejects those choice questions too.

## Issues Encountered

This environment has no Docker, so the local Supabase stack did not start. The real-model call used the same generator, schema, seed prompt, and selector the route uses when the prompts table is unavailable.

## Dependencies

None added.

## Testing Notes

`app/lib/generated-questions.test.ts`: an option-less multiple-choice, checkbox, and scale question are dropped; the long-text question and the choice question that has options are kept; that kept set passes `AlignmentQuestionsArraySchema`.

Real-model call, October 28, 2026, `OPEN_ROUTER_API_KEY`, model `z-ai/glm-5.2`. Received 10, kept 10, dropped 0. Five choice or scale questions, each with 4 options. The kept set passed validation. The curated fallback would not have been used. `npx supabase start` failed with `docker: command not found`.

## Next Steps

Existing `prompts` rows keep their previous text until reseeded. The route appends the options rule on every call, so a stored prompt does not have to be updated for the rule to apply.

## Impact Assessment

A pair gets the generated questions that are usable. They get the curated template only when the model returns nothing that passes validation.

## Lessons Learned

The provider schema and the stored-question schema were different. Options were optional on the way in and required on the way out, and the route treated any failure as a reason to discard the batch.
