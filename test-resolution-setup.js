/**
 * Script to check for existing alignments in resolving status
 * and create test data if needed for resolution testing
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qvzfcezbuzmvglgiolmh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2emZjZXpidXptdmdsZ2lvbG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODMzNzksImV4cCI6MjA3NzI1OTM3OX0.2TuHIRLHWnjHnADw5B8HkrvSb1o75Ui3XJAtIgKTLJU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Checking for alignments in resolving status...\n');

  // Check for alignments in resolving status
  const { data: alignments, error } = await supabase
    .from('alignments')
    .select(`
      id,
      title,
      status,
      current_round,
      created_at
    `)
    .eq('status', 'resolving')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching alignments:', error);
    return;
  }

  console.log(`Found ${alignments.length} alignment(s) in resolving status:\n`);

  if (alignments.length === 0) {
    console.log('No alignments found in resolving status.');
    console.log('You need to:');
    console.log('1. Create an alignment through the UI');
    console.log('2. Have both partners answer questions');
    console.log('3. Run analysis to detect conflicts');
    console.log('4. Then the alignment will be in "resolving" status');
    return;
  }

  for (const alignment of alignments) {
    console.log(`Alignment: ${alignment.title}`);
    console.log(`ID: ${alignment.id}`);
    console.log(`Status: ${alignment.status}`);
    console.log(`Current Round: ${alignment.current_round}`);

    // Fetch participants separately
    const { data: participants } = await supabase
      .from('alignment_participants')
      .select('user_id')
      .eq('alignment_id', alignment.id);

    if (participants) {
      console.log(`Participants:`);
      for (const participant of participants) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, email')
          .eq('id', participant.user_id)
          .single();
        if (profile) {
          console.log(`  - ${profile.display_name} (${profile.email}) [ID: ${participant.user_id}]`);
        }
      }
    }

    // Check for analysis with conflicts
    const { data: analysis, error: analysisError } = await supabase
      .from('alignment_analyses')
      .select('summary')
      .eq('alignment_id', alignment.id)
      .eq('round', alignment.current_round)
      .single();

    if (analysis && analysis.summary && analysis.summary.conflicts) {
      console.log(`Conflicts in Round ${alignment.current_round}: ${analysis.summary.conflicts.length}`);
      console.log(`Conflict Topics:`);
      for (const conflict of analysis.summary.conflicts.slice(0, 3)) {
        console.log(`  - ${conflict.topic} (${conflict.severity})`);
      }
    }

    // Check submission status
    const { data: responses, error: responsesError } = await supabase
      .from('alignment_responses')
      .select('user_id, submitted_at')
      .eq('alignment_id', alignment.id)
      .eq('round', alignment.current_round);

    if (responses) {
      console.log(`Round ${alignment.current_round} Submissions:`);
      for (const response of responses) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', response.user_id)
          .single();
        const submitted = response.submitted_at ? 'Submitted' : 'In Progress';
        console.log(`  - ${profile?.display_name || 'Unknown'}: ${submitted}`);
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }

  console.log(`\nTo test resolution, navigate to:`);
  console.log(`http://localhost:3000/alignment/${alignments[0].id}/resolution`);
}

main().catch(console.error);
