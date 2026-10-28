import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  generatedQuestionsSchema,
  selectUsableGeneratedQuestions,
  takeUsableGeneratedQuestions,
} from './generated-questions';
import { AlignmentQuestionsArraySchema } from './schemas';
import { isValidQuestion } from './templates';

const longText = {
  id: 'ownership_split',
  prompt: 'How should ownership be split between the two partners?',
  type: 'long_text',
  required: true,
};

const choiceWithoutOptions = {
  id: 'decision_style',
  prompt: 'How should day-to-day decisions be made?',
  type: 'multiple_choice',
  required: true,
};

const checkboxWithoutOptions = {
  id: 'contribution_types',
  prompt: 'Which kinds of contribution count toward ownership?',
  type: 'checkbox',
  required: true,
  options: [],
};

const scaleWithoutOptions = {
  id: 'time_commitment',
  prompt: 'How many days a week will you spend on the business?',
  type: 'scale',
  required: true,
};

const choiceWithOptions = {
  id: 'exit_plan',
  prompt: 'What happens if one partner wants to leave?',
  type: 'multiple_choice',
  required: true,
  options: [
    { id: 'buyout', label: 'The other partner can buy them out' },
    { id: 'sale', label: 'The business is sold' },
    { id: 'wind_down', label: 'The business is wound down' },
  ],
};

test('a model response with an option-less choice question keeps the other questions', () => {
  const modelResponse = {
    questions: [
      longText,
      choiceWithoutOptions,
      checkboxWithoutOptions,
      scaleWithoutOptions,
      choiceWithOptions,
    ],
  };

  assert.equal(generatedQuestionsSchema.safeParse(modelResponse).success, true);
  assert.equal(AlignmentQuestionsArraySchema.safeParse(modelResponse.questions).success, false);

  const selected = takeUsableGeneratedQuestions(modelResponse.questions);

  assert.equal(selected.dropped, 3);
  assert.deepEqual(selected.questions.map((question) => question.id), [
    'ownership_split',
    'exit_plan',
  ]);
  assert.equal(AlignmentQuestionsArraySchema.safeParse(selected.questions).success, true);
  assert.ok(selected.questions.every((question) => {
    if (question.type === 'multiple_choice' || question.type === 'checkbox' || question.type === 'scale') {
      return Array.isArray(question.options) && question.options.length > 0;
    }
    return true;
  }));
});

test('option-less choice questions are not valid questions', () => {
  assert.equal(isValidQuestion(choiceWithoutOptions), false);
  assert.equal(isValidQuestion(checkboxWithoutOptions), false);
  assert.equal(isValidQuestion(scaleWithoutOptions), false);
  assert.equal(isValidQuestion(choiceWithOptions), true);
  assert.equal(isValidQuestion(longText), true);
});

test('a response with no usable questions is empty so the caller can use the curated template', () => {
  const selected = selectUsableGeneratedQuestions([
    choiceWithoutOptions,
    checkboxWithoutOptions,
    scaleWithoutOptions,
  ]);
  assert.deepEqual(selected, []);
});

test('a choice question whose options are plain strings is repaired and kept', () => {
  const selected = selectUsableGeneratedQuestions([
    {
      id: 'Exit plan',
      prompt: 'What happens if one partner wants to leave the company?',
      type: 'checkbox',
      required: true,
      options: ['Buyout', 'Sell the business', 'Wind down'],
    },
  ]);

  assert.equal(selected.length, 1);
  assert.equal(selected[0]?.id, 'exit_plan');
  assert.equal(selected[0]?.type, 'checkbox');
  assert.deepEqual(selected[0]?.options?.map((option) => option.label), [
    'Buyout',
    'Sell the business',
    'Wind down',
  ]);
  assert.equal(AlignmentQuestionsArraySchema.safeParse(selected).success, true);
});

test('an option-less follow-up is dropped and the parent question is kept', () => {
  const selected = selectUsableGeneratedQuestions([
    {
      ...longText,
      followUps: [choiceWithoutOptions, choiceWithOptions],
    },
  ]);

  assert.equal(selected.length, 1);
  assert.equal(selected[0]?.id, 'ownership_split');
  assert.deepEqual(selected[0]?.followUps?.map((question) => question.id), ['exit_plan']);
});
