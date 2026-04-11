/* eslint-disable @typescript-eslint/no-unused-vars */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql: string, description: string) {
  console.log(`\n🔧 Executing: ${description}...`);

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If RPC doesn't exist, we need to use REST API directly
      console.log('⚠️  RPC method not available, using direct SQL execution...');

      // For Supabase, we need to use the REST API to execute raw SQL
      // This requires the SQL Editor in Supabase or a custom approach
      throw new Error('Direct SQL execution requires Supabase SQL Editor or migration tool');
    }

    console.log(`✅ ${description} - Success`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} - Failed:`, error);
    return false;
  }
}

async function verifyTables() {
  console.log('\n📊 Verifying tables exist in Supabase...\n');

  const tablesToCheck = [
    'clubs',
    'users',
    'meetings',
    'speeches',
    'meeting_roles',
    'member_profiles',
    'privacy_settings',
    'speech_evaluations',
    'pathways_progress',
    'ecosystem_partners',
    'partner_reviews'
  ];

  const results: { table: string; exists: boolean; count: number }[] = [];

  for (const table of tablesToCheck) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ Table '${table}': Does not exist or no access`);
        results.push({ table, exists: false, count: 0 });
      } else {
        console.log(`✅ Table '${table}': Exists (${count || 0} rows)`);
        results.push({ table, exists: true, count: count || 0 });
      }
    } catch (err) {
      console.log(`❌ Table '${table}': Error checking - ${err}`);
      results.push({ table, exists: false, count: 0 });
    }
  }

  return results;
}

async function insertTestData() {
  console.log('\n🌱 Inserting test data...\n');

  try {
    // Insert test club
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .insert({
        name: 'Pitchmasters Toastmasters',
        charter_number: '12345',
        timezone: 'Asia/Singapore'
      })
      .select()
      .single();

    if (clubError) {
      console.error('❌ Failed to insert test club:', clubError);
      return false;
    }

    console.log('✅ Test club created:', club.name);

    // Insert test user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: 'founder@pitchmasters.club',
        full_name: 'Test Founder',
        club_id: club.id,
        role: 'admin'
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Failed to insert test user:', userError);
      return false;
    }

    console.log('✅ Test user created:', user.full_name);

    // Insert test member profile
    const { data: profile, error: profileError } = await supabase
      .from('member_profiles')
      .insert({
        user_id: user.id,
        club_id: club.id,
        path_level: 'Level 1',
        current_path: 'Dynamic Leadership',
        venture_name: 'Test Startup',
        industry: 'Technology',
        expertise_areas: ['Product Management', 'Marketing'],
        bio: 'Test founder profile'
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Failed to insert test profile:', profileError);
      return false;
    }

    console.log('✅ Test member profile created');

    // Insert privacy settings
    const { data: privacy, error: privacyError } = await supabase
      .from('privacy_settings')
      .insert({
        user_id: user.id,
        club_id: club.id,
        show_photo: true,
        show_venture_info: true,
        show_expertise: true,
        show_bio: true,
        show_contact_info: true,
        show_social_links: true,
        show_networking_interests: true,
        show_speech_progress: true,
        show_looking_for: true,
        show_offering: true,
        allow_officer_notes: true
      })
      .select()
      .single();

    if (privacyError) {
      console.error('❌ Failed to insert privacy settings:', privacyError);
      return false;
    }

    console.log('✅ Test privacy settings created');

    return true;
  } catch (error) {
    console.error('❌ Error inserting test data:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Pitchmasters Database Schema Validation\n');
  console.log('=' .repeat(60));

  // Verify Supabase connection
  console.log('\n🔌 Testing Supabase connection...');
  const { data: connectionTest, error: connectionError } = await supabase
    .from('clubs')
    .select('count')
    .limit(1);

  if (connectionError && !connectionError.message.includes('relation')) {
    console.error('❌ Failed to connect to Supabase:', connectionError);
    process.exit(1);
  }

  console.log('✅ Supabase connection successful');

  // Verify tables
  const tableResults = await verifyTables();

  const existingTables = tableResults.filter(r => r.exists);
  const missingTables = tableResults.filter(r => !r.exists);

  console.log('\n' + '='.repeat(60));
  console.log('📊 VALIDATION SUMMARY\n');
  console.log(`✅ Existing tables: ${existingTables.length}/${tableResults.length}`);
  console.log(`❌ Missing tables: ${missingTables.length}/${tableResults.length}`);

  if (missingTables.length > 0) {
    console.log('\n⚠️  Missing tables:');
    missingTables.forEach(t => console.log(`   - ${t.table}`));
    console.log('\n❌ DATABASE SCHEMA NOT COMPLETE');
    console.log('\n📝 TO FIX: Execute the SQL files in Supabase SQL Editor:');
    console.log('   1. docs/database/schema.sql');
    console.log('   2. docs/database/member-profiles-schema.sql');
    process.exit(1);
  }

  // If all tables exist, try to insert test data
  if (existingTables.length === tableResults.length) {
    console.log('\n✅ All tables exist!');

    const hasData = existingTables.some(t => t.count > 0);
    if (!hasData) {
      console.log('\n📊 Database is empty - inserting test data...');
      await insertTestData();
    } else {
      console.log('\n✅ Database has existing data');
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 DATABASE VALIDATION COMPLETE\n');
}

main().catch(console.error);