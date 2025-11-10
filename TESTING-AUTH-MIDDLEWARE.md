# Authentication Middleware Testing Guide

## Overview
This guide provides step-by-step instructions to verify the authentication middleware is working correctly and sessions persist across navigation.

## Prerequisites
- Development server running (`npm run dev`)
- Test user account created in Supabase
- Browser with dev tools access

## Quick Automated Test

Run the automated test suite:
```bash
node test-middleware-auth.js
```

Expected output: All 6 tests should pass ✅

## Manual Testing Procedures

### Test 1: Protected Route Redirects When Unauthenticated

**Steps:**
1. Open browser in incognito/private mode
2. Navigate to `http://localhost:3002/dashboard`

**Expected Results:**
- ✅ Redirect to `/login?redirectTo=/dashboard`
- ✅ URL contains `redirectTo` parameter
- ✅ No dashboard content visible

**Actual Results:** ________________

---

### Test 2: Login Creates Session and Redirects

**Steps:**
1. From the login page (after Test 1)
2. Enter valid credentials:
   - Email: [your test user email]
   - Password: [your test user password]
3. Click "Log In"

**Expected Results:**
- ✅ Redirect to `/dashboard` (original destination)
- ✅ Dashboard content visible
- ✅ User is authenticated

**Actual Results:** ________________

---

### Test 3: Session Persists Across Navigation

**Steps:**
1. While logged in, navigate to different protected routes:
   - Click "New Alignment" or go to `/alignment/new`
   - Go back to `/dashboard`
   - Navigate to `/alignment/[id]/setup` (if available)
2. Refresh page multiple times (F5 or Cmd+R)

**Expected Results:**
- ✅ No redirect to login
- ✅ Content loads immediately
- ✅ User remains authenticated
- ✅ No session loss on refresh

**Actual Results:** ________________

---

### Test 4: Cookies Are Set Correctly

**Steps:**
1. While logged in, open browser dev tools
2. Go to Application (Chrome) or Storage (Firefox) tab
3. Look under Cookies → `http://localhost:3002`

**Expected Results:**
- ✅ `sb-[project-ref]-auth-token` cookie present
- ✅ `sb-[project-ref]-auth-token-code-verifier` cookie present (may be temporary)
- ✅ Cookies have appropriate expiration dates
- ✅ Cookies are marked as HttpOnly and Secure (in production)

**Actual Results:** ________________

**Screenshot:**
```
Cookie Name                              | Value                  | Expires
-----------------------------------------|------------------------|------------------
sb-xxxxx-auth-token                      | [base64 token]         | [date]
sb-xxxxx-auth-token-code-verifier        | [verifier]             | [date]
```

---

### Test 5: Authenticated Users Can't Access Auth Routes

**Steps:**
1. While logged in, try to navigate to `/login`

**Expected Results:**
- ✅ Redirect to `/dashboard`
- ✅ Login form not visible
- ✅ User already authenticated

**Actual Results:** ________________

---

### Test 6: Public Routes Work Without Auth

**Steps:**
1. Logout (or use incognito window)
2. Navigate to these routes:
   - `/` (homepage)
   - `/login`
   - `/signup`

**Expected Results:**
- ✅ All pages load without redirect
- ✅ No authentication required
- ✅ Content visible

**Actual Results:** ________________

---

### Test 7: Session Expires Gracefully

**Steps:**
1. Login to dashboard
2. Wait for session to expire (or manually delete auth cookies)
3. Try to navigate to a protected route

**Expected Results:**
- ✅ Redirect to `/login`
- ✅ No error messages in console
- ✅ Graceful handling of expired session

**Actual Results:** ________________

---

### Test 8: Redirect Preservation Works

**Steps:**
1. Logout or use incognito window
2. Try to access `/alignment/new` directly
3. Note the URL: `/login?redirectTo=/alignment/new`
4. Login with valid credentials

**Expected Results:**
- ✅ After login, redirect to `/alignment/new` (not `/dashboard`)
- ✅ Original destination preserved
- ✅ User taken to intended page

**Actual Results:** ________________

---

### Test 9: Multiple Browser Tabs

**Steps:**
1. Login in one browser tab
2. Open another tab in the same browser
3. Navigate to protected route in second tab
4. Logout in first tab
5. Try to navigate in second tab

**Expected Results:**
- ✅ Second tab can access protected routes (shared session)
- ✅ After logout in first tab, second tab redirects on next navigation
- ✅ Session synchronized across tabs

**Actual Results:** ________________

---

### Test 10: Browser Restart Persistence (Optional)

**Steps:**
1. Login to dashboard
2. Close ALL browser windows
3. Reopen browser
4. Navigate to `http://localhost:3002/dashboard`

**Expected Results:**
- ⚠️ Depends on "Remember Me" implementation
- Default: Redirect to login (session not persistent across browser restarts)
- With Remember Me: Session persists, dashboard loads

**Actual Results:** ________________

---

## API Route Testing

### Test 11: API Routes Not Redirected

**Steps:**
1. Logout or use incognito window
2. Try to access `/api/ai/clarify` (POST request)

**Expected Results:**
- ✅ Returns 401 Unauthorized or 405 Method Not Allowed
- ✅ Does NOT redirect (middleware doesn't intercept API routes)
- ✅ API error handling works correctly

**Test Command:**
```bash
curl -X POST http://localhost:3002/api/ai/clarify
```

**Expected Output:**
```json
{"error": "Unauthorized"} or {"error": "Method not allowed"}
```

**Actual Results:** ________________

---

## Performance Testing

### Test 12: Middleware Overhead

**Steps:**
1. Open browser dev tools → Network tab
2. Login to dashboard
3. Navigate between protected routes
4. Observe request timing

**Expected Results:**
- ✅ Minimal overhead from middleware (<50ms)
- ✅ No unnecessary session refresh calls
- ✅ Cookies updated only when needed

**Actual Results:** ________________

---

## Edge Cases

### Test 13: Invalid Session Token

**Steps:**
1. Login and get cookies
2. Open dev tools → Application → Cookies
3. Manually corrupt the `sb-*-auth-token` cookie value
4. Try to navigate to a protected route

**Expected Results:**
- ✅ Redirect to `/login`
- ✅ No JavaScript errors
- ✅ Invalid token handled gracefully

**Actual Results:** ________________

---

### Test 14: Concurrent Requests

**Steps:**
1. Login to dashboard
2. Quickly open multiple protected routes in new tabs (within 1 second)

**Expected Results:**
- ✅ All tabs load successfully
- ✅ No race conditions
- ✅ Session handled correctly across concurrent requests

**Actual Results:** ________________

---

## Troubleshooting

### Issue: Infinite Redirect Loop
**Symptoms:** Browser shows "too many redirects" error
**Possible Causes:**
- Middleware redirecting authenticated users from dashboard
- Cookie not being set correctly
- Session check failing

**Debug Steps:**
1. Check browser console for errors
2. Verify cookies are present in dev tools
3. Check middleware logs in terminal
4. Verify Supabase env variables are set

### Issue: Session Lost on Refresh
**Symptoms:** User must re-login after every page refresh
**Possible Causes:**
- Cookies not being set with correct domain/path
- Browser blocking third-party cookies
- Middleware not refreshing session

**Debug Steps:**
1. Check cookie settings in dev tools
2. Verify `SameSite` and `Secure` attributes
3. Check browser cookie settings
4. Review middleware cookie handling code

### Issue: Protected Route Accessible Without Auth
**Symptoms:** Can access dashboard without logging in
**Possible Causes:**
- Middleware not running on route
- Public route incorrectly configured
- Middleware matcher pattern issue

**Debug Steps:**
1. Check middleware matcher config
2. Verify route is not in PUBLIC_ROUTES array
3. Check terminal for middleware execution logs

---

## Success Criteria

For middleware to be considered **fully functional**, all of the following must pass:

- [ ] Automated tests pass (6/6)
- [ ] Protected routes redirect when unauthenticated
- [ ] Login creates session successfully
- [ ] Session persists across navigation
- [ ] Session persists on page refresh
- [ ] Cookies are set correctly
- [ ] Authenticated users can't access login/signup
- [ ] Public routes work without auth
- [ ] Redirect preservation works
- [ ] No infinite redirect loops
- [ ] No console errors
- [ ] API routes not affected by middleware

---

## Reporting Issues

If any test fails, please report with:
1. Test number and name
2. Steps taken
3. Expected vs actual results
4. Screenshots (especially for cookie issues)
5. Browser console errors
6. Network tab screenshots (if relevant)

---

## Additional Notes

- Middleware runs on EVERY request (except static files and API routes)
- Session refresh is automatic when token is close to expiration
- Cookie names include Supabase project reference ID
- Middleware uses Supabase SSR package for proper Next.js integration

---

**Last Updated:** 2025-11-10
**Version:** 1.0
**Agent:** Auth Fixer Alfie
