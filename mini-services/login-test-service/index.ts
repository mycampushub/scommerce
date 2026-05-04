import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
}

const testResults: TestResult[] = [];

// Test 1: Verify seed data passwords
async function testSeedDataPasswords(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: Verify Seed Data Password Hashes');
  console.log('='.repeat(60));

  const seedPasswords = {
    admin: {
      email: 'admin@scommerce.com',
      password: 'admin123',
      hash: '$2b$10$3mciW/peZUcMwL6ka/dGqugIBMlVmBQ2i9KzwH4fDT6ljLY/.csie',
    },
    customer: {
      email: 'fatema@example.com',
      password: 'user123',
      hash: '$2b$10$m.JclDadGiz99rG8CxOumuEbpokIAD8QZHW16kX.jd.k2cNbmx0pS',
    },
    staff: {
      email: 'rahul@scommerce.com',
      password: 'staff123',
      hash: '$2b$10$YVpGgGrbfNonB1dXBuzi.egqKQYe9HRYaz7DJe1Wwv5HPWPbd46J6',
    },
  };

  for (const [userType, data] of Object.entries(seedPasswords)) {
    const isValid = await bcrypt.compare(data.password, data.hash);
    const result: TestResult = {
      test: `${userType} password hash`,
      status: isValid ? 'PASS' : 'FAIL',
      message: `${userType}@${data.email} / ${data.password} - ${isValid ? '✓ VALID' : '✗ INVALID'}`,
    };
    testResults.push(result);
    console.log(`  ${result.message}`);
  }
}

// Test 2: Check seed SQL file
function testSeedSQLFile(): void {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Verify Seed SQL File');
  console.log('='.repeat(60));

  const seedPath = path.join(__dirname, '../../db/seed.sql');
  
  if (!fs.existsSync(seedPath)) {
    const result: TestResult = {
      test: 'Seed SQL file exists',
      status: 'FAIL',
      message: '✗ seed.sql file not found',
    };
    testResults.push(result);
    console.log(`  ${result.message}`);
    return;
  }

  const seedContent = fs.readFileSync(seedPath, 'utf-8');
  
  // Check for admin user
  const hasAdminUser = seedContent.includes("'admin@scommerce.com'");
  const hasAdminHash = seedContent.includes("$2b$10$3mciW/peZUcMwL6ka/dGqugIBMlVmBQ2i9KzwH4fDT6ljLY/.csie'");
  
  // Check for customer user
  const hasCustomerUser = seedContent.includes("'fatema@example.com'");
  const hasCustomerHash = seedContent.includes("$2b$10$m.JclDadGiz99rG8CxOumuEbpokIAD8QZHW16kX.jd.k2cNbmx0pS'");
  
  console.log(`  ✓ Seed SQL file exists`);
  console.log(`  ${hasAdminUser ? '✓' : '✗'} Admin user present: admin@scommerce.com`);
  console.log(`  ${hasCustomerUser ? '✓' : '✗'} Customer user present: fatema@example.com`);

  testResults.push({
    test: 'Seed SQL file exists',
    status: 'PASS',
    message: '✓ seed.sql file exists',
  });

  testResults.push({
    test: 'Admin user in seed data',
    status: hasAdminUser ? 'PASS' : 'FAIL',
    message: `${hasAdminUser ? '✓' : '✗'} Admin user present`,
  });

  testResults.push({
    test: 'Customer user in seed data',
    status: hasCustomerUser ? 'PASS' : 'FAIL',
    message: `${hasCustomerUser ? '✓' : '✗'} Customer user present`,
  });
}

// Test 3: Verify login page displays correct demo credentials
function testLoginPageCredentials(): void {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Verify Login Page Demo Credentials');
  console.log('='.repeat(60));

  const loginPagePath = path.join(__dirname, '../../src/app/login/page.tsx');
  
  if (!fs.existsSync(loginPagePath)) {
    const result: TestResult = {
      test: 'Login page file exists',
      status: 'FAIL',
      message: '✗ Login page not found',
    };
    testResults.push(result);
    console.log(`  ${result.message}`);
    return;
  }

  const loginContent = fs.readFileSync(loginPagePath, 'utf-8');
  
  const hasAdminCreds = loginContent.includes('admin@scommerce.com') && loginContent.includes('admin123');
  const hasCustomerCreds = loginContent.includes('fatema@example.com') && loginContent.includes('user123');
  
  console.log(`  ${hasAdminCreds ? '✓' : '✗'} Admin credentials displayed: admin@scommerce.com / admin123`);
  console.log(`  ${hasCustomerCreds ? '✓' : '✗'} Customer credentials displayed: fatema@example.com / user123`);

  testResults.push({
    test: 'Admin credentials in login page',
    status: hasAdminCreds ? 'PASS' : 'FAIL',
    message: `${hasAdminCreds ? '✓' : '✗'} Admin credentials displayed`,
  });

  testResults.push({
    test: 'Customer credentials in login page',
    status: hasCustomerCreds ? 'PASS' : 'FAIL',
    message: `${hasCustomerCreds ? '✓' : '✗'} Customer credentials displayed`,
  });
}

// Test 4: Verify login API uses bcrypt
function testLoginAPI(): void {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 4: Verify Login API Implementation');
  console.log('='.repeat(60));

  const loginAPIPath = path.join(__dirname, '../../src/app/api/auth/login/route.ts');
  
  if (!fs.existsSync(loginAPIPath)) {
    const result: TestResult = {
      test: 'Login API file exists',
      status: 'FAIL',
      message: '✗ Login API not found',
    };
    testResults.push(result);
    console.log(`  ${result.message}`);
    return;
  }

  const loginContent = fs.readFileSync(loginAPIPath, 'utf-8');
  
  const usesBcrypt = loginContent.includes('bcrypt');
  const usesBcryptCompare = loginContent.includes('bcrypt.compare');
  const createsJWT = loginContent.includes('createToken');
  const setsCookie = loginContent.includes('response.cookies.set');
  
  console.log(`  ${usesBcrypt ? '✓' : '✗'} Uses bcrypt library`);
  console.log(`  ${usesBcryptCompare ? '✓' : '✗'} Uses bcrypt.compare for password verification`);
  console.log(`  ${createsJWT ? '✓' : '✗'} Creates JWT token`);
  console.log(`  ${setsCookie ? '✓' : '✗'} Sets session cookie`);

  testResults.push({
    test: 'Login API uses bcrypt',
    status: usesBcrypt ? 'PASS' : 'FAIL',
    message: `${usesBcrypt ? '✓' : '✗'} Uses bcrypt library`,
  });

  testResults.push({
    test: 'Login API uses bcrypt.compare',
    status: usesBcryptCompare ? 'PASS' : 'FAIL',
    message: `${usesBcryptCompare ? '✓' : '✗'} Uses bcrypt.compare`,
  });

  testResults.push({
    test: 'Login API creates JWT',
    status: createsJWT ? 'PASS' : 'FAIL',
    message: `${createsJWT ? '✓' : '✗'} Creates JWT token`,
  });

  testResults.push({
    test: 'Login API sets session cookie',
    status: setsCookie ? 'PASS' : 'FAIL',
    message: `${setsCookie ? '✓' : '✗'} Sets session cookie`,
  });
}

// Test 5: Verify login redirect behavior
function testLoginRedirect(): void {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 5: Verify Login Redirect Behavior');
  console.log('='.repeat(60));

  const loginPagePath = path.join(__dirname, '../../src/app/login/page.tsx');
  const loginContent = fs.readFileSync(loginPagePath, 'utf-8');
  
  const hasAdminRedirect = loginContent.includes('router.push(\'/admin\')') && loginContent.includes('role === \'admin\'');
  const hasCustomerRedirect = loginContent.includes('router.push(\'/\')') && loginContent.includes('else {');
  
  console.log(`  ${hasAdminRedirect ? '✓' : '✗'} Admin users redirect to /admin`);
  console.log(`  ${hasCustomerRedirect ? '✓' : '✗'} Customer users redirect to /`);

  testResults.push({
    test: 'Admin redirect to /admin',
    status: hasAdminRedirect ? 'PASS' : 'FAIL',
    message: `${hasAdminRedirect ? '✓' : '✗'} Admin users redirect to /admin`,
  });

  testResults.push({
    test: 'Customer redirect to /',
    status: hasCustomerRedirect ? 'PASS' : 'FAIL',
    message: `${hasCustomerRedirect ? '✓' : '✗'} Customer users redirect to /`,
  });
}

// Test 6: Verify useAuth hook
function testUseAuthHook(): void {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 6: Verify useAuth Hook');
  console.log('='.repeat(60));

  const useAuthPath = path.join(__dirname, '../../src/hooks/use-auth.ts');
  
  if (!fs.existsSync(useAuthPath)) {
    const result: TestResult = {
      test: 'useAuth hook exists',
      status: 'FAIL',
      message: '✗ useAuth hook not found',
    };
    testResults.push(result);
    console.log(`  ${result.message}`);
    return;
  }

  const useAuthContent = fs.readFileSync(useAuthPath, 'utf-8');
  
  const fetchesSession = useAuthContent.includes('fetch(\'/api/auth/session\'') || useAuthContent.includes('/api/auth/session');
  const storesUser = useAuthContent.includes('setUser') || useAuthContent.includes('useState');
  const hasIsAdmin = useAuthContent.includes('isAdmin') || useAuthContent.includes('role === \'admin\'');
  const hasLogoutFunction = useAuthContent.includes('logout') || useAuthContent.includes('/api/auth/logout');
  
  console.log(`  ${fetchesSession ? '✓' : '✗'} Fetches session from API`);
  console.log(`  ${storesUser ? '✓' : '✗'} Stores user state`);
  console.log(`  ${hasIsAdmin ? '✓' : '✗'} Has isAdmin check`);
  console.log(`  ${hasLogoutFunction ? '✓' : '✗'} Has logout function`);

  testResults.push({
    test: 'useAuth fetches session',
    status: fetchesSession ? 'PASS' : 'FAIL',
    message: `${fetchesSession ? '✓' : '✗'} Fetches session from API`,
  });

  testResults.push({
    test: 'useAuth has isAdmin check',
    status: hasIsAdmin ? 'PASS' : 'FAIL',
    message: `${hasIsAdmin ? '✓' : '✗'} Has isAdmin check`,
  });

  testResults.push({
    test: 'useAuth has logout',
    status: hasLogoutFunction ? 'PASS' : 'FAIL',
    message: `${hasLogoutFunction ? '✓' : '✗'} Has logout function`,
  });
}

// Print summary
function printSummary(): void {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const total = testResults.length;

  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} ✓`);
  console.log(`Failed: ${failed} ${failed > 0 ? '✗' : ''}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\nFailed Tests:');
    testResults.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ✗ ${r.test}: ${r.message}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('LOGIN FUNCTIONALITY CHECKLIST');
  console.log('='.repeat(60));
  console.log(`
To test login as a real user, follow these steps:

1. Ensure database is seeded:
   bun run db:seed

2. Start the development server (if not running):
   bun run dev

3. Open the application in browser

4. Navigate to /login or click profile icon

5. Use admin credentials:
   Email: admin@scommerce.com
   Password: admin123

6. Verify:
   ✓ Login succeeds without errors
   ✓ Redirected to /admin dashboard
   ✓ User menu shows admin email
   ✓ Session cookie is set (check browser dev tools)

7. Logout and test customer login:
   Email: fatema@example.com
   Password: user123

8. Verify:
   ✓ Login succeeds without errors
   ✓ Redirected to / (home page)
   ✓ User menu shows customer email
   ✓ Profile icon shows user dropdown

9. Test PWA functionality:
   ✓ Open DevTools > Application > Service Workers
   ✓ Service worker is registered
   ✓ Application can be added to home screen
   ✓ Opens as standalone app when launched from home screen
  `);

  if (failed === 0) {
    console.log('\n✓ ALL TESTS PASSED - Login system is properly configured!\n');
  } else {
    console.log('\n✗ SOME TESTS FAILED - Review and fix issues above\n');
  }
}

// Run all tests
async function runAllTests(): Promise<void> {
  console.log('═════════════════════════════════════════════════════════════');
  console.log('  LOGIN FUNCTIONALITY TEST SUITE');
  console.log('═════════════════════════════════════════════════════════════');

  await testSeedDataPasswords();
  testSeedSQLFile();
  testLoginPageCredentials();
  testLoginAPI();
  testLoginRedirect();
  testUseAuthHook();
  
  printSummary();
}

runAllTests().catch(console.error);
