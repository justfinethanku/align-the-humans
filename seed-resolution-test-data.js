/**
 * Seed script to create test alignment data in "resolving" status
 * for testing multi-round resolution workflow
 */

const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

const supabaseUrl = 'https://qvzfcezbuzmvglgiolmh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2emZjZXpidXptdmdsZ2lvbG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODMzNzksImV4cCI6MjA3NzI1OTM3OX0.2TuHIRLHWnjHnADw5B8HkrvSb1o75Ui3XJAtIgKTLJU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUsers() {
  console.log('Creating test users...');

  // Note: We cannot create auth users directly via anon key
  // Users must be created through the signup flow or admin API
  console.log('⚠️  Test users must exist already or be created through signup UI');
  console.log('Expected test users:');
  console.log('  - testuser1@example.com');
  console.log('  - testuser2@example.com');

  // Check if test users exist
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, display_name')
    .in('email', ['testuser1@example.com', 'testuser2@example.com']);

  if (error) {
    console.error('Error checking for test users:', error);
    return null;
  }

  if (!profiles || profiles.length < 2) {
    console.error('❌ Test users do not exist. Please create them through signup UI first.');
    return null;
  }

  console.log('✅ Found test users:');
  profiles.forEach(p => console.log(`   - ${p.display_name} (${p.email})`));

  return profiles;
}

async function createTestAlignment(user1Id, user2Id) {
  console.log('\nCreating test alignment...');

  const alignmentId = randomUUID();

  // Create alignment
  const { data: alignment, error: alignmentError } = await supabase
    .from('alignments')
    .insert({
      id: alignmentId,
      title: 'Test Resolution Workflow - Multi-Round',
      description: 'Test alignment for resolution testing with conflicts',
      status: 'resolving',
      current_round: 1,
      created_by: user1Id,
    })
    .select()
    .single();

  if (alignmentError) {
    console.error('Error creating alignment:', alignmentError);
    return null;
  }

  console.log(`✅ Created alignment: ${alignment.title} (${alignment.id})`);

  // Add participants
  const { error: participantsError } = await supabase
    .from('alignment_participants')
    .insert([
      {
        alignment_id: alignmentId,
        user_id: user1Id,
        role: 'creator',
      },
      {
        alignment_id: alignmentId,
        user_id: user2Id,
        role: 'participant',
      },
    ]);

  if (participantsError) {
    console.error('Error adding participants:', participantsError);
    return null;
  }

  console.log('✅ Added participants');

  return alignmentId;
}

async function createTestResponses(alignmentId, user1Id, user2Id, round) {
  console.log(`\nCreating test responses for round ${round}...`);

  const responses = [
    {
      alignment_id: alignmentId,
      user_id: user1Id,
      round: round,
      answers: {
        response_version: 1,
        answers: {
          'q1': { value: 'User 1 strongly prefers Option A', timestamp: new Date().toISOString() },
          'q2': { value: 'User 1 wants to allocate 70% to project X', timestamp: new Date().toISOString() },
          'q3': { value: 'User 1 thinks timeline should be 6 months', timestamp: new Date().toISOString() },
        },
      },
      submitted_at: new Date().toISOString(),
    },
    {
      alignment_id: alignmentId,
      user_id: user2Id,
      round: round,
      answers: {
        response_version: 1,
        answers: {
          'q1': { value: 'User 2 strongly prefers Option B', timestamp: new Date().toISOString() },
          'q2': { value: 'User 2 wants to allocate 30% to project X', timestamp: new Date().toISOString() },
          'q3': { value: 'User 2 thinks timeline should be 12 months', timestamp: new Date().toISOString() },
        },
      },
      submitted_at: new Date().toISOString(),
    },
  ];

  const { error } = await supabase
    .from('alignment_responses')
    .insert(responses);

  if (error) {
    console.error('Error creating responses:', error);
    return false;
  }

  console.log('✅ Created responses for both users');
  return true;
}

async function createTestAnalysis(alignmentId, round) {
  console.log(`\nCreating test analysis with conflicts for round ${round}...`);

  const analysis = {
    alignment_id: alignmentId,
    round: round,
    summary: {
      total_questions: 3,
      agreements: 0,
      disagreements: 3,
      alignment_score: 15,
      conflicts: [
        {
          id: 'conflict_1',
          topic: 'Option Preference (A vs B)',
          severity: 'critical',
          personA: {
            position: 'User 1 strongly prefers Option A',
            reasoning: 'Believes Option A aligns better with project goals',
          },
          personB: {
            position: 'User 2 strongly prefers Option B',
            reasoning: 'Believes Option B is more cost-effective',
          },
          aiSuggestions: [
            {
              id: 'suggestion_1',
              summary: 'Hybrid approach: Use Option A for Phase 1, Option B for Phase 2',
              pros: ['Addresses both concerns', 'Allows testing both approaches'],
              cons: ['More complex to manage', 'Higher initial cost'],
              nextSteps: ['Define phase boundaries', 'Create transition plan'],
            },
            {
              id: 'suggestion_2',
              summary: 'Conduct pilot study with both options before full commitment',
              pros: ['Data-driven decision', 'Reduces risk'],
              cons: ['Delays timeline', 'Additional upfront cost'],
              nextSteps: ['Design pilot parameters', 'Set evaluation criteria'],
            },
          ],
          explanation: 'This is a fundamental disagreement about strategic approach',
        },
        {
          id: 'conflict_2',
          topic: 'Budget Allocation (70% vs 30%)',
          severity: 'moderate',
          personA: {
            position: 'User 1 wants to allocate 70% to project X',
            reasoning: 'Project X has highest ROI potential',
          },
          personB: {
            position: 'User 2 wants to allocate 30% to project X',
            reasoning: 'Need to diversify risk across projects',
          },
          aiSuggestions: [
            {
              id: 'suggestion_3',
              summary: 'Start with 50% allocation and adjust based on Q1 performance',
              pros: ['Balanced approach', 'Allows course correction'],
              cons: ['May underinvest if project performs well'],
              nextSteps: ['Define Q1 success metrics', 'Set reallocation triggers'],
            },
          ],
          explanation: 'Risk tolerance and ROI optimization conflict',
        },
        {
          id: 'conflict_3',
          topic: 'Timeline (6 months vs 12 months)',
          severity: 'minor',
          personA: {
            position: 'User 1 thinks timeline should be 6 months',
            reasoning: 'Need to move fast to capture market opportunity',
          },
          personB: {
            position: 'User 2 thinks timeline should be 12 months',
            reasoning: 'Quality requires adequate time',
          },
          aiSuggestions: [
            {
              id: 'suggestion_4',
              summary: 'Phased delivery: MVP in 6 months, full product in 12 months',
              pros: ['Balances speed and quality', 'Early market feedback'],
              cons: ['More planning overhead'],
              nextSteps: ['Define MVP scope', 'Create phased roadmap'],
            },
          ],
          explanation: 'Speed vs quality trade-off',
        },
      ],
    },
    metadata: {
      analysis_type: 'test_seed',
      generated_at: new Date().toISOString(),
    },
  };

  const { error } = await supabase
    .from('alignment_analyses')
    .insert(analysis);

  if (error) {
    console.error('Error creating analysis:', error);
    return false;
  }

  console.log(`✅ Created analysis with ${analysis.summary.conflicts.length} conflicts`);
  return true;
}

async function main() {
  console.log('='.repeat(60));
  console.log('RESOLUTION TEST DATA SEEDER');
  console.log('='.repeat(60) + '\n');

  // Step 1: Check for test users
  const users = await createTestUsers();
  if (!users || users.length < 2) {
    console.log('\n❌ Cannot proceed without test users.');
    console.log('Please create test users through the signup UI first.');
    return;
  }

  const [user1, user2] = users;

  // Step 2: Create alignment
  const alignmentId = await createTestAlignment(user1.id, user2.id);
  if (!alignmentId) {
    console.log('\n❌ Failed to create alignment');
    return;
  }

  // Step 3: Create responses for Round 1
  const responsesCreated = await createTestResponses(alignmentId, user1.id, user2.id, 1);
  if (!responsesCreated) {
    console.log('\n❌ Failed to create responses');
    return;
  }

  // Step 4: Create analysis with conflicts
  const analysisCreated = await createTestAnalysis(alignmentId, 1);
  if (!analysisCreated) {
    console.log('\n❌ Failed to create analysis');
    return;
  }

  // Success!
  console.log('\n' + '='.repeat(60));
  console.log('✅ TEST DATA CREATED SUCCESSFULLY');
  console.log('='.repeat(60));
  console.log(`\nAlignment ID: ${alignmentId}`);
  console.log(`Status: resolving`);
  console.log(`Round: 1`);
  console.log(`Conflicts: 3 (1 critical, 1 moderate, 1 minor)`);
  console.log(`\nTest URLs:`);
  console.log(`User 1: http://localhost:3000/alignment/${alignmentId}/resolution`);
  console.log(`User 2: http://localhost:3000/alignment/${alignmentId}/resolution`);
  console.log(`\nNext Steps:`);
  console.log(`1. Login as testuser1@example.com`);
  console.log(`2. Navigate to resolution page`);
  console.log(`3. Submit resolutions for all conflicts`);
  console.log(`4. Login as testuser2@example.com (different browser/incognito)`);
  console.log(`5. Submit resolutions`);
  console.log(`6. Verify round 2 analysis triggers`);
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
