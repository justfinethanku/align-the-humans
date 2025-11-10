/**
 * Test script for question generation API
 *
 * Usage:
 * 1. Start dev server: npm run dev
 * 2. Run test: npx tsx test-generate-questions.ts
 *
 * This script tests the /api/alignment/generate-questions endpoint
 * with various scenarios including valid requests and error cases.
 */

import type {
  GenerateQuestionsRequest,
  GenerateQuestionsResponse,
} from './app/lib/types';

const API_BASE_URL = 'http://localhost:3000';

/**
 * Test case structure
 */
interface TestCase {
  name: string;
  request: Partial<GenerateQuestionsRequest>;
  expectedStatus: number;
  shouldValidate?: boolean;
}

/**
 * Test cases
 */
const testCases: TestCase[] = [
  {
    name: 'Valid operating agreement request',
    request: {
      alignmentId: '550e8400-e29b-41d4-a716-446655440000', // Mock UUID
      templateSeed: 'operating_agreement',
      clarity: {
        topic: 'Co-founder Operating Agreement',
        participants: ['Alice', 'Bob'],
        desiredOutcome: 'Create a fair and clear operating agreement for our startup',
      },
    },
    expectedStatus: 200,
    shouldValidate: true,
  },
  {
    name: 'Valid custom template request',
    request: {
      alignmentId: '550e8400-e29b-41d4-a716-446655440001',
      templateSeed: 'custom',
      clarity: {
        topic: 'Living Arrangements',
        participants: ['Sarah', 'Mike'],
        desiredOutcome: 'Agree on household responsibilities and financial contributions',
      },
    },
    expectedStatus: 200,
    shouldValidate: true,
  },
  {
    name: 'Invalid request - missing alignmentId',
    request: {
      templateSeed: 'custom',
      clarity: {
        topic: 'Test Topic',
        participants: ['A', 'B'],
        desiredOutcome: 'Test outcome',
      },
    },
    expectedStatus: 400,
  },
  {
    name: 'Invalid request - invalid alignmentId format',
    request: {
      alignmentId: 'not-a-uuid',
      templateSeed: 'custom',
      clarity: {
        topic: 'Test Topic',
        participants: ['A', 'B'],
        desiredOutcome: 'Test outcome',
      },
    },
    expectedStatus: 400,
  },
  {
    name: 'Invalid request - insufficient participants',
    request: {
      alignmentId: '550e8400-e29b-41d4-a716-446655440002',
      templateSeed: 'custom',
      clarity: {
        topic: 'Test Topic',
        participants: ['Only One Person'],
        desiredOutcome: 'Test outcome',
      },
    },
    expectedStatus: 400,
  },
  {
    name: 'Invalid request - topic too short',
    request: {
      alignmentId: '550e8400-e29b-41d4-a716-446655440003',
      templateSeed: 'custom',
      clarity: {
        topic: 'Test',
        participants: ['A', 'B'],
        desiredOutcome: 'Test outcome that is long enough',
      },
    },
    expectedStatus: 400,
  },
];

/**
 * Validates response structure
 */
function validateResponse(response: GenerateQuestionsResponse): void {
  if (!response.data) {
    throw new Error('Response missing data field');
  }

  const { data } = response;

  if (!data.templateId || typeof data.templateId !== 'string') {
    throw new Error('Invalid templateId');
  }

  if (typeof data.version !== 'number' || data.version < 1) {
    throw new Error('Invalid version');
  }

  if (!data.source || !['ai', 'curated'].includes(data.source.type)) {
    throw new Error('Invalid source');
  }

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error('Invalid questions array');
  }

  // Validate each question
  for (const question of data.questions) {
    if (!question.id || !question.prompt || !question.type) {
      throw new Error(`Invalid question structure: ${JSON.stringify(question)}`);
    }

    if (!['short_text', 'long_text', 'multiple_choice', 'checkbox', 'number', 'scale'].includes(question.type)) {
      throw new Error(`Invalid question type: ${question.type}`);
    }

    if (typeof question.required !== 'boolean') {
      throw new Error('Question missing required field');
    }

    // Validate options for choice types
    if (['multiple_choice', 'checkbox', 'scale'].includes(question.type)) {
      if (!question.options || !Array.isArray(question.options)) {
        throw new Error(`Question type ${question.type} missing options`);
      }
    }
  }

  console.log('  ✓ Response structure valid');
  console.log(`  ✓ Generated ${data.questions.length} questions`);
  console.log(`  ✓ Source: ${data.source.type}${data.source.model ? ` (${data.source.model})` : ''}`);
}

/**
 * Runs a single test case
 */
async function runTest(testCase: TestCase): Promise<boolean> {
  console.log(`\n${testCase.name}`);
  console.log('─'.repeat(60));

  try {
    const response = await fetch(`${API_BASE_URL}/api/alignment/generate-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCase.request),
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.status !== testCase.expectedStatus) {
      console.error(`❌ Expected status ${testCase.expectedStatus}, got ${response.status}`);
      const body = await response.text();
      console.error('Response body:', body);
      return false;
    }

    const body = await response.json();

    if (testCase.shouldValidate) {
      validateResponse(body as GenerateQuestionsResponse);
    } else if (response.status >= 400) {
      console.log('  ✓ Error response received as expected');
      if (body.error) {
        console.log(`  ✓ Error code: ${body.error.code}`);
        console.log(`  ✓ Error message: ${body.error.message}`);
      }
    }

    console.log('✅ Test passed');
    return true;
  } catch (error) {
    console.error(`❌ Test failed: ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('Question Generation API Test Suite');
  console.log('═'.repeat(60));
  console.log(`Testing endpoint: ${API_BASE_URL}/api/alignment/generate-questions`);
  console.log('\nNote: These tests require:');
  console.log('  1. Dev server running (npm run dev)');
  console.log('  2. Valid Supabase credentials in .env.local');
  console.log('  3. AI Gateway API key (optional - will use fallback templates)');
  console.log('  4. Authenticated user session (tests may fail on 401 if not authenticated)');

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const success = await runTest(testCase);
    if (success) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\n═'.repeat(60));
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log('═'.repeat(60));

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
main().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
