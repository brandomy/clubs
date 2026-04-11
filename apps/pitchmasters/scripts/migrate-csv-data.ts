/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Default club ID (should match your club)
const CLUB_ID = '9cb0034c-12df-4c24-acc6-ea5659a7651b';

interface CSVRow {
  Name: string;
  Surname: string;
  'Full Name': string;
  'TM Member Number': string;
  Type: string;
  'Officer Role': string;
  Team: string;
  City: string;
  Country: string;
  Citizenship: string;
  mobile: string;
  email: string;
  LinkedIn: string;
  Introducer: string;
  Mentor: string;
  Rotarian: string;
  DTM: string;
  'Current Pathway': string;
  Level: string;
  'Completed Pathways': string;
  Founder: string;
  Organization: string;
  'Job Title': string;
  URL: string;
  'Joining Date': string;
  Status: string;
  Month: string;
  Day: string;
  'Age Bracket': string;
}

function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',');
    const row: any = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    // Only process rows with actual member data
    if (row['Full Name'] && row['Full Name'].trim()) {
      rows.push(row as CSVRow);
    }
  }

  return rows;
}

function parseBoolean(value: string): boolean {
  return value.toUpperCase() === 'TRUE';
}

function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  // Add proper date parsing logic if needed
  return null;
}

function parseLevel(levelStr: string): string {
  if (!levelStr || levelStr.trim() === '') return 'Level 1';
  return `Level ${levelStr}`;
}

function determineIndustryFromOrganization(org: string, jobTitle: string): string {
  if (!org && !jobTitle) return 'Technology';

  const combined = `${org} ${jobTitle}`.toLowerCase();

  if (combined.includes('tech') || combined.includes('software') || combined.includes('cloud')) {
    return 'Technology';
  } else if (combined.includes('consult')) {
    return 'Consulting';
  } else if (combined.includes('finance') || combined.includes('capital')) {
    return 'Finance';
  } else if (combined.includes('health') || combined.includes('medical')) {
    return 'Healthcare';
  } else if (combined.includes('education')) {
    return 'Education';
  } else {
    return 'Business Services';
  }
}

function extractExpertiseFromJobTitle(jobTitle: string): string[] {
  if (!jobTitle) return [];

  const expertise: string[] = [];
  const title = jobTitle.toLowerCase();

  if (title.includes('founder') || title.includes('ceo')) {
    expertise.push('Leadership', 'Strategy');
  }
  if (title.includes('manager') || title.includes('director')) {
    expertise.push('Management');
  }
  if (title.includes('tech') || title.includes('engineer')) {
    expertise.push('Technology');
  }
  if (title.includes('sales') || title.includes('business development')) {
    expertise.push('Sales', 'Business Development');
  }
  if (title.includes('marketing')) {
    expertise.push('Marketing');
  }
  if (title.includes('consult')) {
    expertise.push('Consulting');
  }

  return expertise.length > 0 ? expertise : ['Business Development'];
}

async function clearExistingData() {
  console.log('🗑️ Clearing existing member data...');

  // Delete in correct order due to foreign key constraints
  await supabase.from('member_profiles').delete().neq('id', '');
  await supabase.from('privacy_settings').delete().neq('id', '');
  await supabase.from('users').delete().neq('id', '');

  console.log('✅ Existing data cleared');
}

async function importMembers(csvRows: CSVRow[]) {
  console.log(`📝 Importing ${csvRows.length} members...`);

  for (const row of csvRows) {
    try {
      // Only import if Status is 'Member' (skip Prospects)
      if (row.Status !== 'Member') {
        console.log(`⏭️ Skipping ${row['Full Name']} (Status: ${row.Status})`);
        continue;
      }

      // Create user record
      const userData = {
        email: row.email || `${row.Name.toLowerCase()}.${row.Surname.toLowerCase()}@placeholder.com`,
        full_name: row['Full Name'],
        club_id: CLUB_ID,
        role: row['Officer Role'] ? 'officer' : 'member'
      };

      const { data: user, error: userError } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (userError) {
        console.error(`❌ Error creating user ${row['Full Name']}:`, userError);
        continue;
      }

      // Create member profile
      const profileData = {
        user_id: user.id,
        club_id: CLUB_ID,

        // Location data
        city: row.City?.trim() || null,
        country: row.Country?.trim() || null,
        citizenship: row.Citizenship?.trim() || null,

        // Toastmasters data
        tm_member_number: row['TM Member Number'] || null,
        member_type: row.Type || null,
        officer_role: row['Officer Role'] || null,
        team: row.Team || null,
        path_level: parseLevel(row.Level),
        current_path: row['Current Pathway'] || 'Dynamic Leadership',
        level: row.Level || null,
        completed_pathways: row['Completed Pathways'] ? [row['Completed Pathways']] : [],
        dtm: parseBoolean(row.DTM),

        // Professional data
        organization: row.Organization || null,
        job_title: row['Job Title'] || null,
        is_founder: parseBoolean(row.Founder),
        is_rotarian: parseBoolean(row.Rotarian),

        // Contact data
        phone: row.mobile || null,
        linkedin_url: row.LinkedIn || null,
        website_url: row.URL || null,

        // Business data
        industry: determineIndustryFromOrganization(row.Organization, row['Job Title']),
        expertise_areas: extractExpertiseFromJobTitle(row['Job Title']),
        venture_name: row.Organization || null,
        venture_description: row.Organization ? `${row['Job Title']} at ${row.Organization}` : null,
        venture_stage: parseBoolean(row.Founder) ? 'growth' : null,

        // Bio
        bio: `${row['Job Title']} ${row.Organization ? `at ${row.Organization}` : ''} based in ${row.City}, ${row.Country}`.trim(),

        // Administrative data
        joining_date: parseDate(row['Joining Date']),
        birthday_month: row.Month || null,
        birthday_day: row.Day ? parseInt(row.Day) : null,
        age_bracket: row['Age Bracket'] || null,
        introducer: row.Introducer || null,
        mentor: row.Mentor || null,

        // Toastmasters progress
        speech_count: Math.floor(Math.random() * 5), // Random for demo
        evaluation_count: Math.floor(Math.random() * 3),
        leadership_roles: row['Officer Role'] ? [row['Officer Role']] : [],

        // Networking data
        networking_interests: ['Public Speaking', 'Leadership', 'Networking'],
        looking_for: parseBoolean(row.Founder) ? ['Investors', 'Partnerships'] : ['Mentorship', 'Networking'],
        offering: parseBoolean(row.Founder) ? ['Mentorship', 'Business Advice'] : ['Technical Skills', 'Collaboration']
      };

      const { error: profileError } = await supabase
        .from('member_profiles')
        .insert(profileData);

      if (profileError) {
        console.error(`❌ Error creating profile for ${row['Full Name']}:`, profileError);
        continue;
      }

      // Create privacy settings with default values
      const privacyData = {
        user_id: user.id,
        club_id: CLUB_ID,
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
      };

      const { error: privacyError } = await supabase
        .from('privacy_settings')
        .insert(privacyData);

      if (privacyError) {
        console.error(`❌ Error creating privacy settings for ${row['Full Name']}:`, privacyError);
        continue;
      }

      console.log(`✅ Imported ${row['Full Name']} (${row.City}, ${row.Country})`);

    } catch (error) {
      console.error(`❌ Unexpected error importing ${row['Full Name']}:`, error);
    }
  }
}

async function validateImport() {
  console.log('🔍 Validating import...');

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .eq('club_id', CLUB_ID);

  if (usersError) {
    console.error('❌ Error validating users:', usersError);
    return;
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('member_profiles')
    .select('*')
    .eq('club_id', CLUB_ID);

  if (profilesError) {
    console.error('❌ Error validating profiles:', profilesError);
    return;
  }

  const { data: privacy, error: privacyError } = await supabase
    .from('privacy_settings')
    .select('*')
    .eq('club_id', CLUB_ID);

  if (privacyError) {
    console.error('❌ Error validating privacy settings:', privacyError);
    return;
  }

  console.log(`✅ Import validation successful:`);
  console.log(`   - Users: ${users?.length || 0}`);
  console.log(`   - Profiles: ${profiles?.length || 0}`);
  console.log(`   - Privacy Settings: ${privacy?.length || 0}`);
}

async function main() {
  try {
    console.log('🚀 Starting CSV data migration...\n');

    // Read CSV file
    const csvPath = join(__dirname, 'member-data.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');
    const csvRows = parseCSV(csvContent);

    console.log(`📊 Parsed ${csvRows.length} member records from CSV\n`);

    // Clear existing data
    await clearExistingData();

    // Import new data
    await importMembers(csvRows);

    // Validate import
    await validateImport();

    console.log('\n🎉 CSV data migration completed successfully!');

  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  }
}

main();