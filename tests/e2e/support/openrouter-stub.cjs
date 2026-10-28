// Test-only stand-in for OpenRouter, loaded with NODE_OPTIONS=--require.
// The app's real routes, database writes and status transitions all run.
// Only the model's reply is canned, so the journey is deterministic and
// costs nothing. Nothing here touches production code.

const OPENROUTER_PREFIX = 'https://openrouter.ai/api/v1/';

const QUESTIONS = [
  'How should we split decision-making authority between us?',
  'What is our plan if one of us wants to leave the business?',
  'How will we handle money we put in and take out?',
];

// Round 1 has one conflict. A later round includes the resolution text both
// partners submit, and that round is conflict-free so they can sign.
const RESOLUTION_MARK = 'EQUAL_OWNERSHIP_COMPROMISE';

const CONFLICT_ANALYSIS = {
  alignedItems: [
    {
      question_id: 'e2e_q2',
      description: 'Both partners want a written plan for someone leaving.',
      shared_value: 'A departure gets a written notice period and a buyout at the agreed value.',
    },
  ],
  conflicts: [
    {
      id: 'conflict_ownership',
      question_id: 'e2e_q1',
      severity: 'critical',
      topic: 'Ownership split',
      description: 'The two of you disagree on how to split ownership.',
      personA_position: 'Equal 50/50 ownership.',
      personB_position: 'An 80/20 split in one partner\'s favor.',
      suggested_resolution: 'Split ownership equally and revisit after the first year.',
      suggestions: [
        'Split ownership equally and revisit after the first year.',
        'Use a vesting schedule that starts equal and adjusts with contribution.',
      ],
    },
  ],
  hiddenAssumptions: [],
  gaps: [],
  imbalances: [],
  overall_alignment_score: 54,
};

function term(index) {
  return {
    question_id: `e2e_term_${index}`,
    description: `Shared operating rule ${index}`,
    shared_value: [
      `Term ${index}. Ownership, pay, client work, and decisions follow the written compromise both partners accepted.`,
      'They review this rule together once a year. Neither person changes it alone.',
      'A record of each review stays with this agreement. The rule covers ordinary studio work and new client engagements.',
      'Money that comes in is recorded before either person takes a draw. A draw that would break this rule waits until both agree.',
    ].join(' '),
  };
}

const CLEAN_ANALYSIS = {
  alignedItems: [1, 2, 3, 4, 5, 6, 7, 8].map(term),
  conflicts: [],
  hiddenAssumptions: [],
  gaps: [],
  imbalances: [],
  overall_alignment_score: 96,
};

function contentFor(body) {
  const text = JSON.stringify(body);
  if (text.includes('overall_alignment_score')) {
    return text.includes(RESOLUTION_MARK) ? CLEAN_ANALYSIS : CONFLICT_ANALYSIS;
  }
  return {
    questions: QUESTIONS.map((prompt, index) => ({
      id: `e2e_q${index + 1}`,
      prompt,
      type: 'long_text',
      required: true,
    })),
  };
}

function completion(body, payload) {
  const message = { role: 'assistant', content: JSON.stringify(payload) };
  // generateObject may send the schema as a forced tool call instead of JSON mode.
  const tool = Array.isArray(body.tools) && body.tools[0];
  if (tool && tool.function) {
    message.content = null;
    message.tool_calls = [
      {
        id: 'call_e2e',
        type: 'function',
        function: { name: tool.function.name, arguments: JSON.stringify(payload) },
      },
    ];
  }
  return {
    id: 'chatcmpl-e2e',
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: body.model,
    choices: [{ index: 0, message, finish_reason: message.tool_calls ? 'tool_calls' : 'stop' }],
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
  };
}

const realFetch = globalThis.fetch;

globalThis.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url;
  if (!url || !url.startsWith(OPENROUTER_PREFIX)) {
    return realFetch(input, init);
  }
  const body = JSON.parse(init.body);
  return new Response(JSON.stringify(completion(body, contentFor(body))), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
