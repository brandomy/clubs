# SSH Configuration Troubleshooting - HuaQiao Repository Push

**Date**: 2025-12-16
**Context**: Georgetown automated backup system complete, need to push changes to HuaQiao-Foundation/clubs repository
**Status**: Blocked by SSH authentication issue

---

## Problem Statement

Git push to `HuaQiao-Foundation/clubs` repository fails with permission denied:

```bash
git push origin main
# ERROR: Permission to HuaQiao-Foundation/clubs.git denied to brandomy
```

The `id_huaqiao` SSH key is authenticating as the brandomy GitHub account instead of an account with access to HuaQiao-Foundation organization.

---

## Current Configuration

### SSH Config (`~/.ssh/config`)

```ssh
# GitHub - brandomy account (default)
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519
    AddKeysToAgent yes
    UseKeychain yes

# HuaQiao
Host github-huaqiao
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_huaqiao
    AddKeysToAgent yes
    UseKeychain yes
```

### Git Remote Configuration

```bash
# apps/georgetown/.git/config
[remote "origin"]
    url = git@github-huaqiao:HuaQiao-Foundation/clubs.git
    fetch = +refs/heads/*:refs/remotes/origin/*
```

### SSH Key Files

```bash
$ ls -la ~/.ssh/id_huaqiao*
-rw-------  1 randaleastman  staff   411 Dec 16 10:00 /Users/randaleastman/.ssh/id_huaqiao
-rw-r--r--  1 randaleastman  staff    98 Dec 16 10:00 /Users/randaleastman/.ssh/id_huaqiao.pub

$ cat ~/.ssh/id_huaqiao.pub
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINBGlMCxYhWkxBqE+mlqIqpx6Tgvn7nJDqQ3DKfdyv randal@HuaQiao.asia
```

**Key Fingerprint**: `SHA256:Tw6Cv/AScsoxHLtb5YJRIxHHbAmAxh6Ul/dYZ/3IfDA`

---

## Diagnostic Test Results

### Test 1: SSH Connection
```bash
$ ssh -T git@github-huaqiao
Hi brandomy! You've successfully authenticated, but GitHub does not provide shell access.
```

**Result**: ❌ Authenticating as brandomy (INCORRECT)
**Expected**: Should authenticate as HuaQiao account or show HuaQiao-Foundation organization

### Test 2: Git Push
```bash
$ cd apps/georgetown
$ git push origin main
ERROR: Permission to HuaQiao-Foundation/clubs.git denied to brandomy.
fatal: Could not read from remote repository.
```

**Result**: ❌ Permission denied

### Test 3: Brandomy GitHub Account SSH Keys
**URL**: https://github.com/settings/keys
**Logged in as**: brandomy
**Keys visible**: Only one key "MacBook Pro (2025)" added Sep 14, 2025
**`id_huaqiao` key present**: ❌ NO (not visible in list)

---

## Root Cause Analysis

The `id_huaqiao` SSH key is somehow authenticating as brandomy, but:
1. The key is NOT visible in brandomy's GitHub SSH keys list (screenshot shows only "MacBook Pro (2025)")
2. When attempting to add `id_huaqiao.pub` to HuaQiao GitHub account, got error "Key is already in use"
3. SSH test shows "Hi brandomy!" instead of HuaQiao account

**Possible causes**:
1. Key WAS on brandomy account and screenshot doesn't show all keys (pagination/hidden)
2. Key is cached in SSH agent and using wrong key
3. GitHub API showing old cached authentication
4. Key is on brandomy but under a different name/label

---

## What Needs to Happen

1. **Verify key location**: Determine definitively if `id_huaqiao` key is still on brandomy account
2. **Remove from brandomy**: If key is on brandomy, delete it from brandomy's GitHub SSH settings
3. **Add to HuaQiao**: Add `id_huaqiao.pub` to the GitHub account that has access to HuaQiao-Foundation
4. **Clear SSH agent cache**: Remove cached keys and re-test
5. **Test authentication**: Verify `ssh -T git@github-huaqiao` shows HuaQiao (not brandomy)
6. **Push changes**: Complete `git push origin main`

---

## Pending Commit Details

**Commit hash**: `8db0001`
**Commit message**: "chore: automated backup system with documentation"
**Files changed**: 21 files, 3,584+ lines
**Branch**: main
**Status**: Committed locally, not pushed

**What the commit contains**:
- Automated backup system with 7/4/6 retention policy
- Four backup scripts (backup-with-rotation.sh, setup-automated-backups.sh, backup-database.sh, restore-database.sh)
- ADR structure and ADR-0001 (Singapore migration)
- Dev journal entries (Singapore migration, backup troubleshooting, system implementation)
- Operations documentation (automated-backups.md, troubleshooting-protocol.md)
- Technical briefing document for Brandmine CTO
- Updated .env.example with comprehensive documentation

---

## Troubleshooting Steps

### Step 1: Check SSH Agent
```bash
# List keys currently in SSH agent
ssh-add -l

# Expected output should show both keys:
# 256 SHA256:... id_ed25519 (ED25519)
# 256 SHA256:Tw6Cv/AScsoxHLtb5YJRIxHHbAmAxh6Ul/dYZ/3IfDA id_huaqiao (ED25519)
```

### Step 2: Clear SSH Agent Cache
```bash
# Remove all keys from agent
ssh-add -D

# Add HuaQiao key specifically
ssh-add ~/.ssh/id_huaqiao

# Verify
ssh-add -l
```

### Step 3: Test SSH Connection with Verbose Logging
```bash
ssh -vT git@github-huaqiao 2>&1 | grep -E "(identity|Offering|Authenticating)"
```

This will show which SSH key is being used for authentication.

### Step 4: Check GitHub API for SSH Keys
```bash
# Check brandomy account keys via API
curl -s https://api.github.com/users/brandomy/keys | jq '.[] | {id, key}'

# This will show ALL public SSH keys registered to brandomy account
# Look for a key ending in "randal@HuaQiao.asia"
```

### Step 5: Verify Key on HuaQiao Account
Navigate to the GitHub account that should have access to HuaQiao-Foundation:
- If personal account: https://github.com/settings/keys
- Check for `id_huaqiao` key (labeled "randal@HuaQiao.asia")

### Step 6: Nuclear Option - Regenerate SSH Key
If key is stuck between accounts:
```bash
# Backup old key
mv ~/.ssh/id_huaqiao ~/.ssh/id_huaqiao.old
mv ~/.ssh/id_huaqiao.pub ~/.ssh/id_huaqiao.pub.old

# Generate new key
ssh-keygen -t ed25519 -C "randal@HuaQiao.asia" -f ~/.ssh/id_huaqiao

# Add to HuaQiao GitHub account
cat ~/.ssh/id_huaqiao.pub
# Copy output and add at: https://github.com/settings/keys

# Test connection
ssh -T git@github-huaqiao
```

---

## Success Criteria

When resolved, you should see:

```bash
$ ssh -T git@github-huaqiao
Hi [HuaQiao-username]! You've successfully authenticated, but GitHub does not provide shell access.

$ cd apps/georgetown
$ git push origin main
Enumerating objects: 45, done.
Counting objects: 100% (45/45), done.
...
To github-huaqiao:HuaQiao-Foundation/clubs.git
   928f93d..8db0001  main -> main
```

---

## Related Documentation

- [Georgetown Automated Backups Operations Guide](../georgetown/docs/operations/automated-backups.md)
- [Backup System Implementation Dev Journal](../georgetown/docs/dev-journal/2025-12-16-automated-backup-system-implementation.md)
- [Technical Briefing Document for Brandmine](../technical-briefings/automated-backup-solution.md)
- [SSH Configuration Reference](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys)

---

## Questions for User

1. **Which GitHub account has access to HuaQiao-Foundation organization?**
   - Is it a personal account?
   - Is it a different organization account?
   - Username?

2. **Can you check brandomy's SSH keys page again?**
   - Scroll down to see if there are more keys below "MacBook Pro (2025)"
   - Check if there's pagination (e.g., "Show more")

3. **Do you want to regenerate the `id_huaqiao` key?**
   - Pros: Clean slate, guaranteed to work
   - Cons: Need to add to HuaQiao account, any other systems using this key will break

---

## Prompt for Fresh Session

```
I need help troubleshooting an SSH authentication issue for pushing to the HuaQiao-Foundation/clubs repository.

Background:
- I have commits ready to push (21 files, automated backup system)
- Git remote is configured to use `git@github-huaqiao:HuaQiao-Foundation/clubs.git`
- SSH config has `Host github-huaqiao` pointing to `~/.ssh/id_huaqiao` key
- Push fails with: "Permission to HuaQiao-Foundation/clubs.git denied to brandomy"

Current issue:
- `ssh -T git@github-huaqiao` authenticates as "brandomy" (WRONG)
- Should authenticate as HuaQiao account with access to HuaQiao-Foundation org
- The `id_huaqiao` key is not visible in brandomy's GitHub SSH keys list
- When trying to add key to HuaQiao account, got "Key is already in use" error

Files to review:
1. Read: /Users/randaleastman/dev/clubs/docs/prompts/2025-12-16-ssh-huaqiao-troubleshooting.md (this file)
2. Check: ~/.ssh/config
3. Check: /Users/randaleastman/dev/clubs/apps/georgetown/.git/config

Help me:
1. Diagnose why the key is authenticating as brandomy
2. Remove key from brandomy if needed
3. Add key to correct HuaQiao account
4. Successfully push the pending commit

Start by running the diagnostic commands in Step 1-3 of the troubleshooting guide.
```

---

**Created**: 2025-12-16
**Author**: Georgetown Development Team
**Status**: Active troubleshooting
**Priority**: High (blocking push of production-ready backup system)
