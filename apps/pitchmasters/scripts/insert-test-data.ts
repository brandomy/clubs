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

async function insertTestData() {
  console.log('🌱 Inserting comprehensive test data...\n');

  try {
    // Get existing club or create new one
    const { data: existingClub } = await supabase
      .from('clubs')
      .select('*')
      .eq('name', 'Pitchmasters Toastmasters')
      .single();

    let clubId: string;

    if (!existingClub) {
      const { data: newClub, error: clubError } = await supabase
        .from('clubs')
        .insert({
          name: 'Pitchmasters Toastmasters',
          charter_number: '12345',
          timezone: 'Asia/Singapore'
        })
        .select()
        .single();

      if (clubError) throw clubError;
      clubId = newClub.id;
      console.log('✅ Club created:', newClub.name);
    } else {
      clubId = existingClub.id;
      console.log('✅ Using existing club:', existingClub.name);
    }

    // Insert test users
    const usersData = [
      { email: 'founder@pitchmasters.club', full_name: 'Sarah Chen', role: 'admin' },
      { email: 'member1@startup.com', full_name: 'James Kim', role: 'officer' },
      { email: 'member2@venture.io', full_name: 'Maria Garcia', role: 'member' },
      { email: 'member3@tech.com', full_name: 'Alex Johnson', role: 'member' }
    ];

    const insertedUsers = [];
    for (const userData of usersData) {
      const { data: user, error } = await supabase
        .from('users')
        .insert({ ...userData, club_id: clubId })
        .select()
        .single();

      if (error) {
        console.log(`⚠️  User ${userData.email} may already exist`);
        const { data: existing } = await supabase
          .from('users')
          .select('*')
          .eq('email', userData.email)
          .eq('club_id', clubId)
          .single();
        if (existing) insertedUsers.push(existing);
      } else {
        insertedUsers.push(user);
        console.log(`✅ User created: ${user.full_name} (${user.role})`);
      }
    }

    // Insert member profiles with privacy settings
    for (const user of insertedUsers) {
      // Member profile
      const { data: profile, error: profileError } = await supabase
        .from('member_profiles')
        .insert({
          user_id: user.id,
          club_id: clubId,
          path_level: 'Level 2',
          current_path: 'Dynamic Leadership',
          venture_name: `${user.full_name.split(' ')[0]}'s Startup`,
          venture_description: `Innovative ${user.role} venture in technology`,
          venture_stage: 'mvp',
          industry: 'Technology',
          expertise_areas: ['Product Management', 'Marketing'],
          bio: `${user.full_name} is building the future of startup communication`,
          phone: '+1-555-0100',
          linkedin_url: `https://linkedin.com/in/${user.full_name.toLowerCase().replace(' ', '')}`,
          networking_interests: ['Funding', 'Partnerships'],
          looking_for: ['Investors', 'Co-founders'],
          offering: ['Mentorship', 'Technical Expertise'],
          speech_count: 3,
          evaluation_count: 2,
          leadership_roles: ['VP Education']
        })
        .select()
        .single();

      if (!profileError) {
        console.log(`✅ Profile created for: ${user.full_name}`);
      }

      // Privacy settings
      const { data: privacy, error: privacyError } = await supabase
        .from('privacy_settings')
        .insert({
          user_id: user.id,
          club_id: clubId,
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

      if (!privacyError) {
        console.log(`✅ Privacy settings created for: ${user.full_name}`);
      }
    }

    // Insert test meeting
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        club_id: clubId,
        title: 'Weekly Club Meeting',
        date: new Date().toISOString().split('T')[0],
        start_time: '19:00:00',
        end_time: '21:00:00',
        meeting_type: 'regular',
        status: 'scheduled'
      })
      .select()
      .single();

    if (!meetingError) {
      console.log('✅ Test meeting created');

      // Insert test speech
      if (insertedUsers.length > 0) {
        const { data: speech, error: speechError } = await supabase
          .from('speeches')
          .insert({
            meeting_id: meeting.id,
            user_id: insertedUsers[0].id,
            title: 'The Power of Effective Communication',
            manual: 'Pathways',
            project_number: 1,
            objectives: ['Evaluate speech effectiveness', 'Practice vocal variety'],
            duration_minutes: 7
          })
          .select()
          .single();

        if (!speechError) {
          console.log('✅ Test speech created');
        }
      }
    }

    // Insert test ecosystem partner
    const { data: partner, error: partnerError } = await supabase
      .from('ecosystem_partners')
      .insert({
        company_name: 'Startup Accelerator Asia',
        company_description: 'Leading accelerator for Southeast Asian startups',
        industry: 'Venture Capital',
        company_size: 'medium',
        partnership_type: 'accelerator',
        services_offered: ['Funding', 'Mentorship', 'Networking'],
        location: 'Singapore',
        is_verified: true,
        status: 'active',
        added_by: insertedUsers[0]?.id
      })
      .select()
      .single();

    if (!partnerError) {
      console.log('✅ Test ecosystem partner created');
    }

    console.log('\n✅ Test data insertion complete!');
    return true;

  } catch (error) {
    console.error('❌ Error inserting test data:', error);
    return false;
  }
}

async function verifyData() {
  console.log('\n📊 Verifying data integrity...\n');

  const tables = [
    'clubs', 'users', 'member_profiles', 'privacy_settings',
    'meetings', 'speeches', 'ecosystem_partners'
  ];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (!error) {
      console.log(`✅ ${table}: ${count} rows`);
    }
  }
}

async function main() {
  console.log('🚀 Pitchmasters Test Data Insertion\n');
  console.log('='.repeat(60));

  await insertTestData();
  await verifyData();

  console.log('\n' + '='.repeat(60));
  console.log('🎉 DATABASE READY FOR TESTING\n');
}

main().catch(console.error);