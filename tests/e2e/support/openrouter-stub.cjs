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

const ANALYSIS = {
  alignedItems: [],
  conflicts: [],
  hiddenAssumptions: [],
  gaps: [],
  imbalances: [],
  overall_alignment_score: 92,
};

function contentFor(body) {
  const text = JSON.stringify(body);
  if (text.includes('overall_alignment_score')) return ANALYSIS;
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
