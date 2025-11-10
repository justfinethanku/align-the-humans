# End-to-End Test Plan: Share Link & Join Flow

## Overview
This document outlines comprehensive manual testing procedures for the share link invitation system and solo alignment start features.

## Prerequisites

### 1. Development Environment
- [ ] Dev server running on http://localhost:3000
- [ ] Supabase local instance running
- [ ] Two different browsers or browser profiles (User A and User B)
- [ ] Database migrations applied

### 2. Verify Migrations
```sql
-- Check alignment_invitations table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'alignment_invitations'
);

-- Check alignments.partner_id is nullable
SELECT is_nullable
FROM information_schema.columns
WHERE table_name = 'alignments'
AND column_name = 'partner_id';

-- Check current_invite_id column exists
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'alignments'
AND column_name = 'current_invite_id';
```

### 3. Test User Accounts
You'll need two test accounts. Create them via signup page:

**User A (Alignment Creator)**
- Email: test-creator@example.com
- Password: TestPass123!
- Display Name: Creator Test User

**User B (Partner/Joiner)**
- Email: test-partner@example.com
- Password: TestPass123!
- Display Name: Partner Test User

---

## Test Scenarios

### Scenario 1: Solo Alignment Creation & Share Link Generation

**User:** User A (Creator)
**Browser:** Browser/Profile 1

#### Steps:

1. **Login**
   - [ ] Navigate to http://localhost:3000/login
   - [ ] Login as test-creator@example.com
   - [ ] Verify redirect to /dashboard

2. **Create New Alignment (Solo)**
   - [ ] Click "New Alignment" button
   - [ ] Fill in alignment details:
     - Topic: "Planning Summer Vacation"
     - Description: "Decide on destination and dates"
     - **Important:** DO NOT select a partner from picker
   - [ ] Click "Create Alignment"
   - [ ] Verify redirect to /alignment/[id]/clarity page
   - [ ] **Expected:** No errors, alignment created without partner_id

3. **Generate Share Link**
   - [ ] Locate ShareLinkButton component on page
   - [ ] Verify it shows "Share Link" button
   - [ ] **Expected:** Button auto-generates link on mount
   - [ ] Wait for link to appear (should happen automatically)
   - [ ] **Expected:** See full URL displayed: `http://localhost:3000/join/[token]`

4. **Copy Share Link**
   - [ ] Click "Copy Link" button
   - [ ] **Expected:** Toast notification "Link copied to clipboard!"
   - [ ] Paste clipboard contents into notepad/notes app
   - [ ] **Expected:** URL matches format `http://localhost:3000/join/[64-char-base64url-token]`

5. **Verify Expiration Display**
   - [ ] Check expiration date shown below link
   - [ ] **Expected:** Shows "Expires in 30 days" (or similar countdown)

6. **Verify Database State**
   ```sql
   -- Check alignment was created without partner
   SELECT id, title, partner_id, current_invite_id, allow_solo_start
   FROM alignments
   WHERE title = 'Planning Summer Vacation';
   -- Expected: partner_id = NULL, current_invite_id = [UUID], allow_solo_start = true

   -- Check invitation was created
   SELECT id, alignment_id, token_hash, expires_at, max_uses, use_count
   FROM alignment_invitations
   WHERE alignment_id = '[id-from-above]';
   -- Expected: 1 row, expires_at = ~30 days future, max_uses = 1, use_count = 0
   ```

---

### Scenario 2: Partner Joins via Share Link (Authenticated)

**User:** User B (Partner)
**Browser:** Browser/Profile 2 (different from User A)

#### Steps:

1. **Access Join Link (Logged Out)**
   - [ ] Open incognito/private window or different browser
   - [ ] Paste share link from Scenario 1
   - [ ] Navigate to `http://localhost:3000/join/[token]`
   - [ ] **Expected:** See join page with alignment preview
   - [ ] **Expected:** Shows alignment title, description, creator name
   - [ ] **Expected:** Shows "Login to Join" and "Sign Up to Join" buttons

2. **Login to Join**
   - [ ] Click "Login to Join" button
   - [ ] **Expected:** Redirect to /login with returnUrl parameter
   - [ ] Login as test-partner@example.com
   - [ ] **Expected:** After login, redirect back to /join/[token] page
   - [ ] **Expected:** Now shows "Join Alignment" button instead of login buttons

3. **Join Alignment**
   - [ ] Click "Join Alignment" button
   - [ ] **Expected:** Loading state appears
   - [ ] Wait for API call to complete
   - [ ] **Expected:** Success toast "Successfully joined alignment!"
   - [ ] **Expected:** Redirect to /alignment/[id]/clarity (or appropriate page)

4. **Verify Database State**
   ```sql
   -- Check partner was added
   SELECT user_id, role
   FROM alignment_participants
   WHERE alignment_id = '[alignment-id]'
   ORDER BY created_at;
   -- Expected: 2 rows (owner + partner)

   -- Check invitation use count incremented
   SELECT use_count, max_uses
   FROM alignment_invitations
   WHERE alignment_id = '[alignment-id]';
   -- Expected: use_count = 1, max_uses = 1

   -- Check alignment partner_id updated (if applicable)
   SELECT partner_id
   FROM alignments
   WHERE id = '[alignment-id]';
   -- Expected: partner_id = [User B's user_id]
   ```

---

### Scenario 3: Real-Time Partner Joined Notification

**User:** User A (Creator)
**Browser:** Browser/Profile 1 (still logged in from Scenario 1)

#### Steps:

1. **Watch for Real-Time Update**
   - [ ] Keep User A's browser tab open on /alignment/[id]/clarity
   - [ ] **Expected:** Within seconds of User B joining (Scenario 2, Step 3)
   - [ ] **Expected:** Toast notification appears: "Partner Test User joined the alignment"
   - [ ] **Expected:** InviteStatus component updates from "Waiting for Partner" to "Partner Joined"
   - [ ] **Expected:** Green checkmark icon appears next to partner name

2. **Verify UI Changes**
   - [ ] ShareLinkButton should now show "Partner Joined" status
   - [ ] Link regeneration option should still be available
   - [ ] **Expected:** No errors in console

---

### Scenario 4: Share Link Error States

#### 4A: Expired Token

1. **Setup: Manually Expire Token**
   ```sql
   UPDATE alignment_invitations
   SET expires_at = NOW() - INTERVAL '1 day'
   WHERE alignment_id = '[alignment-id]';
   ```

2. **Test Expired Link**
   - [ ] In User B's browser (logged out), navigate to original join link
   - [ ] **Expected:** Error message "This invitation link has expired"
   - [ ] **Expected:** No "Join" button available
   - [ ] **Expected:** Suggestion to contact alignment creator

#### 4B: Token Already Used (Max Uses Exceeded)

1. **Setup: Set Use Count to Max**
   ```sql
   UPDATE alignment_invitations
   SET use_count = 1, max_uses = 1
   WHERE alignment_id = '[alignment-id]';
   ```

2. **Attempt to Use Again**
   - [ ] Have a third test user try to access the link
   - [ ] **Expected:** Error message "This invitation link has already been used"
   - [ ] **Expected:** Cannot join alignment

#### 4C: Invalid Token

1. **Test Malformed Token**
   - [ ] Navigate to http://localhost:3000/join/invalid-token-123
   - [ ] **Expected:** Error message "Invalid or expired invitation link"
   - [ ] **Expected:** No alignment details shown

#### 4D: Revoked/Invalidated Token

1. **Revoke Token**
   - [ ] As User A, click "Regenerate Link" button on ShareLinkButton
   - [ ] Confirm regeneration in dialog
   - [ ] **Expected:** New link appears, old link saved for testing

2. **Test Revoked Link**
   - [ ] In User B's browser, try to access the OLD link
   - [ ] **Expected:** Error message "This invitation link has been revoked"

---

### Scenario 5: Link Regeneration

**User:** User A (Creator)
**Browser:** Browser/Profile 1

#### Steps:

1. **Regenerate Share Link**
   - [ ] On /alignment/[id]/clarity page, locate ShareLinkButton
   - [ ] Click "Regenerate Link" button
   - [ ] **Expected:** Confirmation dialog appears
   - [ ] **Expected:** Warning message about invalidating old link

2. **Confirm Regeneration**
   - [ ] Click "Confirm" in dialog
   - [ ] **Expected:** Loading state while generating new token
   - [ ] **Expected:** Success toast "New link generated"
   - [ ] **Expected:** New share link appears (different token)
   - [ ] **Expected:** Expiration reset to 30 days from now

3. **Verify Database State**
   ```sql
   -- Check old invitation was invalidated
   SELECT token_hash, invalidated_at
   FROM alignment_invitations
   WHERE alignment_id = '[alignment-id]'
   ORDER BY created_at;
   -- Expected: First row has invalidated_at timestamp

   -- Check new invitation was created
   SELECT id, token_hash, expires_at
   FROM alignment_invitations
   WHERE alignment_id = '[alignment-id]'
   AND invalidated_at IS NULL;
   -- Expected: 1 row with new token_hash, fresh expires_at

   -- Check alignment.current_invite_id updated
   SELECT current_invite_id
   FROM alignments
   WHERE id = '[alignment-id]';
   -- Expected: Points to new invitation ID
   ```

---

### Scenario 6: Rate Limiting

**User:** Malicious Actor
**Browser:** Any

#### Steps:

1. **Attempt Multiple Joins**
   - [ ] Copy a valid join link
   - [ ] Logout/use incognito mode
   - [ ] Attempt to POST to /api/alignment/join with invalid credentials 11 times rapidly
   - [ ] **Method:** Use browser DevTools or curl:
   ```bash
   for i in {1..11}; do
     curl -X POST http://localhost:3000/api/alignment/join \
       -H "Content-Type: application/json" \
       -d '{"token": "[valid-token]"}' \
       -v
   done
   ```
   - [ ] **Expected (first 10 attempts):** Return errors but allow attempts
   - [ ] **Expected (11th attempt):** 429 Too Many Requests
   - [ ] **Expected:** Error message "Too many join attempts. Please try again later."

2. **Wait for Rate Limit Reset**
   - [ ] Wait 1 hour (or restart server to reset in-memory rate limiter)
   - [ ] **Expected:** Able to attempt joins again

---

### Scenario 7: Duplicate Join Prevention

**User:** User B (already joined)
**Browser:** Browser/Profile 2

#### Steps:

1. **Attempt to Join Again**
   - [ ] As User B (already a participant), navigate to original join link
   - [ ] **Expected:** Automatically redirect to /alignment/[id] page
   - [ ] **Expected:** Message "You are already a participant in this alignment"
   - [ ] **Expected:** No duplicate participant record created

2. **Verify Database State**
   ```sql
   SELECT COUNT(*) as participant_count
   FROM alignment_participants
   WHERE alignment_id = '[alignment-id]'
   AND user_id = '[User B user_id]';
   -- Expected: COUNT = 1 (no duplicates)
   ```

---

### Scenario 8: Mobile Share API (Mobile Only)

**User:** User A (Creator)
**Device:** Mobile device or mobile browser emulation

#### Steps:

1. **Enable Mobile View**
   - [ ] Open DevTools, toggle device emulation (iPhone or Android)
   - [ ] Navigate to alignment with ShareLinkButton

2. **Use Native Share**
   - [ ] Click "Share" button (if device supports navigator.share)
   - [ ] **Expected:** Native share sheet appears (if supported)
   - [ ] **Expected:** Share link via Messages, Email, etc.
   - [ ] **Expected:** If not supported, falls back to clipboard copy

---

## Automated Checks (Optional)

### API Endpoint Tests

```bash
# Test 1: Generate invite (requires auth)
curl -X POST http://localhost:3000/api/alignment/[id]/generate-invite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [access-token]" \
  -v

# Expected: 200, returns { inviteUrl, expiresAt }

# Test 2: Regenerate invite (requires auth + ownership)
curl -X POST http://localhost:3000/api/alignment/[id]/regenerate-invite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [access-token]" \
  -v

# Expected: 200, returns new { inviteUrl, expiresAt }

# Test 3: Join via token (requires auth)
curl -X POST http://localhost:3000/api/alignment/join \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [access-token]" \
  -d '{"token": "[raw-token-from-url]"}' \
  -v

# Expected: 200, returns { alignmentId }
```

---

## Common Issues & Troubleshooting

### Issue 1: "Token not found" on join page
**Cause:** Token hash mismatch
**Check:** Ensure `hashToken()` function is consistent between generation and validation
**Fix:** Verify SHA-256 hashing is applied correctly in both places

### Issue 2: Real-time notifications not appearing
**Cause:** Supabase subscriptions not working
**Check:** Verify `useAlignmentUpdates` hook is mounted and listening
**Fix:** Check Supabase realtime settings, ensure INSERT policy exists on alignment_participants

### Issue 3: Rate limiting too strict or too lenient
**Cause:** In-memory Map resets on server restart
**Check:** Restart dev server and rate limit resets
**Fix:** Consider Redis-based rate limiting for production

### Issue 4: Partner_id still required
**Cause:** Database migration not applied
**Check:** Run `SELECT is_nullable FROM information_schema.columns WHERE table_name='alignments' AND column_name='partner_id'`
**Fix:** Apply migration 20251110185248_make_alignments_partner_id_nullable.sql

---

## Success Criteria

All tests pass if:
- [ ] User A can create alignment without selecting partner
- [ ] Share link auto-generates with 30-day expiration
- [ ] User B can join via link after authentication
- [ ] User A receives real-time notification when User B joins
- [ ] Expired, invalid, and revoked links show appropriate errors
- [ ] Link regeneration works and invalidates old links
- [ ] Rate limiting prevents abuse (11th attempt blocked)
- [ ] Duplicate joins are prevented with clear messaging
- [ ] No console errors or TypeScript compilation errors
- [ ] Database state is consistent after all operations

---

## Cleanup

After testing, clean up test data:

```sql
-- Delete test alignments and cascading data
DELETE FROM alignments WHERE created_by IN (
  SELECT id FROM auth.users WHERE email IN (
    'test-creator@example.com',
    'test-partner@example.com'
  )
);

-- Optional: Delete test user accounts
DELETE FROM auth.users WHERE email IN (
  'test-creator@example.com',
  'test-partner@example.com'
);
```

---

## Next Steps

After manual testing completes successfully:
1. Document any bugs found
2. Create automated integration tests with Playwright or Cypress
3. Set up CI/CD pipeline to run tests on every PR
4. Consider production rate limiting with Redis
5. Implement invite link analytics (views, clicks, conversions)
