# Reference Data for Pitchmasters

**Purpose**: Static reference data files for development, testing, and import operations
**Last Updated**: 2025-10-08

---

## Files in This Directory

### member-data.csv

**Purpose**: Sample member data for CSV import testing and development

**Source**: Pitchmasters Toastmasters Club member roster
**Date**: September 2025
**Format**: CSV with headers

**Fields**:
- Personal: Name, Surname, Full Name, Email, Mobile
- Club Data: TM Member Number, Type, Officer Role, Team, Status
- Location: City, Country, Citizenship
- Pathways: Current Pathway, Level, Completed Pathways, DTM
- Networking: LinkedIn, Organization, Job Title, URL
- Membership: Joining Date, Founder, Rotarian, Introducer, Mentor
- Demographics: Age Bracket, Month (birthday), Day (birthday)

**Usage**:
- CSV import script testing (`scripts/migrate-csv-data.ts`)
- Database schema validation
- Sample data for development
- Field mapping reference

**Privacy Note**:
- Contains real member data for internal club use only
- Do NOT commit to public repositories
- Ensure proper access controls
- Follow GDPR/privacy guidelines

---

## Adding New Reference Data

### When to Add Files Here

**✅ Add to reference-data/**:
- CSV/JSON data for import operations
- Sample/seed data for testing
- Official reference lists (countries, timezones, etc.)
- Configuration templates
- Lookup tables or mappings

**❌ Do NOT add**:
- Executable scripts (belongs in `/scripts/`)
- Temporary test data (use `/temp/` or local only)
- Sensitive production data (use secure storage)
- Binary files (use appropriate storage)

### File Naming Conventions

**Pattern**: `descriptive-name.ext`

**Examples**:
- ✅ `member-data.csv` (sample member roster)
- ✅ `countries-list.json` (country reference data)
- ✅ `toastmasters-paths.csv` (official Pathways list)
- ✅ `timezone-mappings.json` (timezone configurations)
- ❌ `data.csv` (non-descriptive)
- ❌ `temp_test.csv` (temporary data)

### Documentation Requirements

When adding a new file:
1. **Update this README** with file description
2. **Document fields** if CSV/structured data
3. **Note source** and last update date
4. **Explain usage** (what scripts/features use it)
5. **Privacy/security** considerations if applicable

---

## File Usage Reference

### member-data.csv

**Used by**:
- `scripts/migrate-csv-data.ts` - CSV import to Supabase
- `scripts/verify-imported-data.ts` - Data validation after import
- Database schema design (field mapping reference)

**Related Documentation**:
- [database/schema-design.md](../database/schema-design.md) - member_profiles table
- [workflows/image-asset-management-workflow.md](../workflows/image-asset-management-workflow.md) - CSV import procedures

**Update Frequency**: As needed when member roster changes

---

## Data Management Best Practices

### Privacy & Security

**DO**:
- ✅ Keep sensitive data in this directory (not public repos)
- ✅ Use `.gitignore` for files with PII if needed
- ✅ Document data source and purpose
- ✅ Follow GDPR/privacy compliance

**DON'T**:
- ❌ Commit production passwords or secrets
- ❌ Share member data outside authorized users
- ❌ Include credit card or financial data
- ❌ Store without proper access controls

### Data Quality

**Maintain**:
- Clean, validated data (no junk/test entries)
- Consistent formatting (date formats, phone numbers)
- Complete field documentation
- Source attribution and dates

**Avoid**:
- Mixing test and real data
- Outdated or stale datasets
- Undocumented field meanings
- Inconsistent data formats

---

## Future Reference Data Candidates

### Potential Files to Add

**Toastmasters Reference Data**:
- `toastmasters-paths.csv` - 11 official Pathways
- `toastmasters-projects.csv` - 55+ projects with objectives
- `meeting-roles.json` - Standard functional roles
- `speech-types.json` - Speech categories and timing

**Geographic Data**:
- `countries-list.json` - Country codes and names
- `timezones.json` - Timezone mappings for clubs
- `currencies.json` - For multi-club expansion

**Startup/Business Data**:
- `industries.json` - Standard industry categories
- `venture-stages.json` - Startup lifecycle stages
- `expertise-areas.json` - Common founder skill areas

---

## Migration Notes

### From scripts/ to reference-data/

**Moved**:
- ✅ `scripts/member-data.csv` → `docs/reference-data/member-data.csv` (2025-10-08)

**Reasoning**: Separates static data from executable scripts, following Georgetown documentation pattern

**Scripts Updated**: None yet (scripts still reference old location)
**TODO**: Update script import paths if needed

---

## Support

**For questions about reference data**:
- Check this README first
- Review related documentation (database schema, workflows)
- Contact technical administrator for access or updates

**For adding new reference data**:
- Follow naming conventions above
- Document in this README
- Consider privacy/security implications
- Test with relevant scripts

---

**Maintained by**: Claude Code (CTO)
**Pattern Source**: Georgetown reference-data best practices
**Next Review**: As new reference data is added
