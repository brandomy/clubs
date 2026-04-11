/* eslint-disable @typescript-eslint/no-unused-vars */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applySqlPolicies() {
  console.log('🔒 Applying Public Read Policies via Raw SQL\n');

  const policies = [
    {
      name: 'Drop existing privacy policy',
      sql: `DROP POLICY IF EXISTS "privacy_settings_public_read" ON privacy_settings;`
    },
    {
      name: 'Create privacy_settings public read policy',
      sql: `CREATE POLICY "privacy_settings_public_read" ON privacy_settings FOR SELECT USING (true);`
    },
    {
      name: 'Drop existing users policy',
      sql: `DROP POLICY IF EXISTS "users_public_with_visible_profiles" ON users;`
    },
    {
      name: 'Create users public visibility policy',
      sql: `CREATE POLICY "users_public_with_visible_profiles" ON users FOR SELECT USING (
        id IN (
          SELECT mp.user_id
          FROM member_profiles mp
          JOIN privacy_settings ps ON mp.user_id = ps.user_id
          WHERE ps.show_photo = true
             OR ps.show_venture_info = true
             OR ps.show_expertise = true
             OR ps.show_bio = true
        )
      );`
    },
    {
      name: 'Drop existing member_profiles policy',
      sql: `DROP POLICY IF EXISTS "member_profiles_public_visible" ON member_profiles;`
    },
    {
      name: 'Create member_profiles public visibility policy',
      sql: `CREATE POLICY "member_profiles_public_visible" ON member_profiles FOR SELECT USING (
        user_id IN (
          SELECT ps.user_id
          FROM privacy_settings ps
          WHERE ps.show_photo = true
             OR ps.show_venture_info = true
             OR ps.show_expertise = true
             OR ps.show_bio = true
        )
      );`
    }
  ];

  for (const policy of policies) {
    try {
      console.log(`Executing: ${policy.name}...`);
      const { error } = await supabase.from('_dummy_table_that_does_not_exist_for_raw_sql').select().single();

      // This will fail, but let's try a different approach
      console.log(`⚠️  Direct SQL execution not available through client library`);
      break;
    } catch (error) {
      console.log(`❌ SQL execution failed: ${error}`);
      break;
    }
  }

  console.log('\n📖 MANUAL EXECUTION REQUIRED');
  console.log('Please execute the following SQL in the Supabase SQL Editor:');
  console.log('=' * 80);

  for (const policy of policies) {
    console.log(`\n-- ${policy.name}`);
    console.log(policy.sql);
  }

  console.log('\n' + '='.repeat(80));

  // Test current state
  console.log('\n🧪 Testing current public access...');
  const anonClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY || '');

  const { data: testUsers, error: testError } = await anonClient
    .from('users')
    .select('id, full_name')
    .limit(3);

  if (testError) {
    console.log('❌ Test query failed (expected until policies are applied):', testError.message);
  } else {
    console.log(`✅ Found ${testUsers?.length || 0} publicly visible members`);
  }
}

async function main() {
  console.log('🔐 SQL POLICY APPLICATION\n');
  console.log('='.repeat(60));

  await applySqlPolicies();

  console.log('\n' + '='.repeat(60));
  console.log('⚡ EXECUTE SQL MANUALLY IN SUPABASE DASHBOARD\n');
}

main().catch(console.error);