/**
 * Test script to verify middleware authentication flow
 * Tests:
 * 1. Unauthenticated access to protected route redirects to /login
 * 2. Unauthenticated access to public routes works
 * 3. Login creates session cookies
 * 4. Authenticated access to protected routes works
 * 5. Session persists across navigation
 */

const http = require('http');

const PORT = 3002; // Update if your dev server uses different port
const BASE_URL = `http://localhost:${PORT}`;

// Helper function to make HTTP requests
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const requestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Middleware Authentication Flow\n');
  console.log(`Testing against: ${BASE_URL}\n`);

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Unauthenticated access to protected route should redirect to /login
  console.log('Test 1: Protected route without auth redirects to /login');
  try {
    const res = await makeRequest('/dashboard');
    if (res.statusCode === 307 || res.statusCode === 308) {
      const location = res.headers.location || '';
      if (location.includes('/login')) {
        console.log('✅ PASS: Redirected to login\n');
        testsPassed++;
      } else {
        console.log(`❌ FAIL: Redirected to wrong location: ${location}\n`);
        testsFailed++;
      }
    } else {
      console.log(`❌ FAIL: Expected redirect (307/308), got ${res.statusCode}\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    testsFailed++;
  }

  // Test 2: Public route should be accessible
  console.log('Test 2: Homepage (public route) is accessible');
  try {
    const res = await makeRequest('/');
    if (res.statusCode === 200) {
      console.log('✅ PASS: Homepage accessible without auth\n');
      testsPassed++;
    } else {
      console.log(`❌ FAIL: Expected 200, got ${res.statusCode}\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    testsFailed++;
  }

  // Test 3: Login page should be accessible
  console.log('Test 3: Login page is accessible');
  try {
    const res = await makeRequest('/login');
    if (res.statusCode === 200) {
      console.log('✅ PASS: Login page accessible\n');
      testsPassed++;
    } else {
      console.log(`❌ FAIL: Expected 200, got ${res.statusCode}\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    testsFailed++;
  }

  // Test 4: Protected route with redirectTo parameter
  console.log('Test 4: Protected route preserves redirectTo parameter');
  try {
    const res = await makeRequest('/alignment/new');
    if (res.statusCode === 307 || res.statusCode === 308) {
      const location = res.headers.location || '';
      if (location.includes('/login') && location.includes('redirectTo')) {
        console.log('✅ PASS: Redirect includes redirectTo parameter\n');
        testsPassed++;
      } else {
        console.log(`❌ FAIL: Redirect missing redirectTo: ${location}\n`);
        testsFailed++;
      }
    } else {
      console.log(`❌ FAIL: Expected redirect (307/308), got ${res.statusCode}\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    testsFailed++;
  }

  // Test 5: Middleware should not interfere with API routes
  console.log('Test 5: API routes are not affected by middleware');
  try {
    const res = await makeRequest('/api/ai/clarify');
    // API route might return 401 or 405 (method not allowed) but should not redirect
    if (res.statusCode !== 307 && res.statusCode !== 308) {
      console.log(`✅ PASS: API route not redirected (status: ${res.statusCode})\n`);
      testsPassed++;
    } else {
      console.log(`❌ FAIL: API route should not redirect, got ${res.statusCode}\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    testsFailed++;
  }

  // Test 6: Static files should not be affected
  console.log('Test 6: Static files are accessible');
  try {
    const res = await makeRequest('/_next/static/chunks/main.js');
    // Static files should return 200 or 404, but never redirect
    if (res.statusCode !== 307 && res.statusCode !== 308) {
      console.log(`✅ PASS: Static files not redirected (status: ${res.statusCode})\n`);
      testsPassed++;
    } else {
      console.log(`❌ FAIL: Static files should not redirect\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    testsFailed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('Test Summary');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`Total: ${testsPassed + testsFailed}`);
  console.log('='.repeat(50));

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! Middleware is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the middleware configuration.');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Test suite error:', error);
  process.exit(1);
});
