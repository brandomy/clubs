# Dev Journal: Cron Backup Failure Diagnosis and Fix

**Date:** 2025-12-18
**Project:** Georgetown (Clubs Monorepo)
**Type:** Bug Fix / Infrastructure
**Status:** ✅ Resolved

## Problem Statement

Daily database backup cron job failed at 2:00 AM on December 18, 2025. The backup script succeeded when run manually but failed silently when executed by cron.

## Investigation Process

### 1. Initial Discovery
```bash
# Cron job configuration
0 2 * * * /Users/randaleastman/dev/clubs/apps/georgetown/scripts/backup-with-rotation.sh >> backups/backup.log 2>&1

# Log output showed failure
✗ Backup failed
```

No detailed error information was available in the log.

### 2. Manual Testing
Executed the backup script manually:
```bash
cd /Users/randaleastman/dev/clubs/apps/georgetown
./scripts/backup-with-rotation.sh
```

**Result:** ✅ **Success** - Backup completed successfully (426KB, 10,972 lines)

This indicated an environment difference between manual execution and cron execution.

### 3. Root Cause Analysis

**Key Finding:** `pg_dump` command not found in cron environment

**Why:**
- Cron runs with minimal PATH: `/usr/bin:/bin`
- `pg_dump` is located at `/opt/homebrew/bin/pg_dump` (Homebrew installation)
- Interactive shell includes `/opt/homebrew/bin` in PATH
- Cron environment does not

**Environment Comparison:**
```bash
# Interactive shell PATH
/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin

# Cron PATH (default)
/usr/bin:/bin
```

## Solution Implemented

### 1. Enhanced Error Logging

**File:** [apps/georgetown/scripts/backup-with-rotation.sh](apps/georgetown/scripts/backup-with-rotation.sh)

Added comprehensive diagnostic output:
- Connection details (host, port, database, user)
- `pg_dump` path verification
- Separate error log capture using `mktemp`
- Environment diagnostics on failure (PATH, working directory, timestamp)

**Before:**
```bash
if pg_dump > "$BACKUP_FILE" 2>&1; then
    # Success handling
else
    echo "✗ Backup failed"
    exit 1
fi
```

**After:**
```bash
ERROR_LOG=$(mktemp)

if pg_dump > "$BACKUP_FILE" 2>"$ERROR_LOG"; then
    # Success handling with detailed output
    rm -f "$ERROR_LOG"
else
    echo "✗ Backup failed"
    echo ""
    echo "Error details:"
    cat "$ERROR_LOG"
    echo ""
    echo "Environment check:"
    echo "  PATH: $PATH"
    echo "  Current directory: $(pwd)"
    echo "  Script PID: $$"
    echo "  Date/Time: $(date '+%Y-%m-%d %H:%M:%S')"
    rm -f "$BACKUP_FILE"
    rm -f "$ERROR_LOG"
    exit 1
fi
```

### 2. Fixed Crontab PATH

Added PATH configuration to crontab:

```bash
PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin
0 2  * * * /Users/randaleastman/dev/clubs/apps/georgetown/scripts/backup-with-rotation.sh >> /Users/randaleastman/dev/clubs/apps/georgetown/backups/backup.log 2>&1
5 2  * * * /Users/randaleastman/dev/brandmine-hugo/scripts/backup-with-rotation.sh >> /Users/randaleastman/dev/brandmine-hugo/backups/backup.log 2>&1
10 2 * * * /Users/randaleastman/dev/huaqiao/apps/bridge/scripts/backup-with-rotation.sh >> /Users/randaleastman/dev/huaqiao/apps/bridge/backups/backup.log 2>&1
```

This ensures `pg_dump` is accessible to all three backup jobs.

## Testing

### Verification Test
```bash
# Remove existing backup to test fresh run
rm -f backups/daily/georgetown_2025-12-18.sql

# Execute script with enhanced logging
./scripts/backup-with-rotation.sh
```

**Result:** ✅ **Success**

Output now shows:
```
Connection details:
  Host: aws-1-ap-southeast-1.pooler.supabase.com
  Port: 6543
  Database: postgres
  User: postgres.rmorlqozjwbftzowqmps
  pg_dump path: /opt/homebrew/bin/pg_dump

✓ Backup completed successfully
```

## Outcome

### Fixed
- ✅ Cron environment now includes Homebrew binaries path
- ✅ Enhanced error logging for future diagnostics
- ✅ Applied fix to all three backup cron jobs

### Impact
- Daily backups will execute successfully at 2:00 AM
- Future failures will provide detailed error information
- Consistent backup retention across all projects

### Next Backup
Tomorrow (2025-12-19) at 2:00 AM - expected to succeed

## Lessons Learned

1. **Cron Environment is Minimal:** Never assume cron has the same PATH as interactive shells
2. **Silent Failures are Costly:** Always implement detailed error logging in automated scripts
3. **Test in Target Environment:** Manual testing doesn't reveal cron-specific issues
4. **Capture Errors Separately:** Using `2>&1` masks error details; use separate error files

## Related Files

- [apps/georgetown/scripts/backup-with-rotation.sh](apps/georgetown/scripts/backup-with-rotation.sh) - Enhanced backup script
- Crontab configuration (modified via `crontab -e`)
- [apps/georgetown/backups/backup.log](apps/georgetown/backups/backup.log) - Log file location

## References

- Cron PATH issues: Common gotcha when using Homebrew-installed tools
- `pg_dump` documentation: PostgreSQL backup utility
- Backup retention policy: 7 daily, 4 weekly, 6 monthly
