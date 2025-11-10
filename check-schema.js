const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qvzfcezbuzmvglgiolmh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2emZjZXpidXptdmdsZ2lvbG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODMzNzksImV4cCI6MjA3NzI1OTM3OX0.2TuHIRLHWnjHnADw5B8HkrvSb1o75Ui3XJAtIgKTLJU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Try to get any profiles
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Profiles schema (first row):', data);
  }

  // Check alignments
  const { data: alignments, error: alignError } = await supabase
    .from('alignments')
    .select('*')
    .limit(1);

  if (alignError) {
    console.error('Alignments Error:', alignError);
  } else {
    console.log('\nAlignments schema (first row):', alignments);
  }
}

main();
