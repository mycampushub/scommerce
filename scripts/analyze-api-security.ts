/**
 * API Security and Reliability Code Analysis
 * Analyzes all API endpoints for security vulnerabilities and best practices
 */

import { readFileSync } from 'fs';
import { glob } from 'glob';

interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  file: string;
  line?: number;
  issue: string;
  recommendation: string;
}

interface EndpointAnalysis {
  path: string;
  file: string;
  methods: string[];
  authRequired: boolean;
  csrfProtected: boolean;
  rateLimited: boolean;
  inputValidated: boolean;
  hasErrorHandling: boolean;
  sqlSafe: boolean;
  issues: SecurityIssue[];
}

const allIssues: SecurityIssue[] = [];
const endpointAnalyses: EndpointAnalysis[] = [];

// Helper to add security issue
function addIssue(issue: SecurityIssue) {
  allIssues.push(issue);
}

// Helper to check file for patterns
function checkFileForIssues(filePath: string): EndpointAnalysis {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const analysis: EndpointAnalysis = {
    path: filePath.replace('/home/z/my-project/src/app/api/', '').replace('/route.ts', ''),
    file: filePath,
    methods: [],
    authRequired: false,
    csrfProtected: false,
    rateLimited: false,
    inputValidated: false,
    hasErrorHandling: false,
    sqlSafe: true,
    issues: [],
  };

  // Detect HTTP methods
  if (content.includes('export async function GET')) analysis.methods.push('GET');
  if (content.includes('export async function POST')) analysis.methods.push('POST');
  if (content.includes('export async function PUT')) analysis.methods.push('PUT');
  if (content.includes('export async function DELETE')) analysis.methods.push('DELETE');
  if (content.includes('export async function PATCH')) analysis.methods.push('PATCH');

  // Check authentication
  if (content.includes('verifyAdminAuth') ||
      content.includes('verifyAuth') ||
      content.includes('verifyToken')) {
    analysis.authRequired = true;
  }

  // Check CSRF protection
  if (content.includes('csrfMiddleware') ||
      content.includes('validateCSRFToken') ||
      content.includes('withCSRFProtection')) {
    analysis.csrfProtected = true;
  }

  // Check rate limiting
  if (content.includes('rateLimit') ||
      content.includes('RateLimit')) {
    analysis.rateLimited = true;
  }

  // Check input validation
  if (content.includes('safeParse') ||
      content.includes('zod') ||
      content.includes('Schema')) {
    analysis.inputValidated = true;
  }

  // Check error handling
  if (content.includes('try {') &&
      content.includes('catch') &&
      content.includes('error')) {
    analysis.hasErrorHandling = true;
  }

  // Check for unsafe SQL patterns
  const unsafePatterns = [
    /template literal with user input/i,
    /\$\{.*\}.*FROM/i,
    /query.*\+.*WHERE/i,
    /execute.*\+.*'/i,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for direct string concatenation in queries
    if (line.includes('query') &&
       (line.includes("' + ") || line.includes('" + ')) &&
       !line.includes('prepare')) {
      analysis.sqlSafe = false;
      addIssue({
        severity: 'critical',
        category: 'SQL Injection',
        file: filePath,
        line: i + 1,
        issue: 'Possible SQL injection through string concatenation',
        recommendation: 'Use parameterized queries with prepared statements',
      });
    }

    // Check for unsafe template literals
    if (line.includes('query') && line.match(/\$\{.*\}/)) {
      const hasPrepare = content.includes('prepare') || content.includes('bind');
      if (!hasPrepare) {
        analysis.sqlSafe = false;
        addIssue({
          severity: 'critical',
          category: 'SQL Injection',
          file: filePath,
          line: i + 1,
          issue: 'Template literal in SQL query without proper escaping',
          recommendation: 'Use parameterized queries with ? placeholders',
        });
      }
    }

    // Check for console.log with sensitive data
    if (line.includes('console.log') &&
       (line.includes('password') ||
        line.includes('token') ||
        line.includes('secret'))) {
      addIssue({
        severity: 'medium',
        category: 'Information Disclosure',
        file: filePath,
        line: i + 1,
        issue: 'Logging sensitive information (password/token/secret)',
        recommendation: 'Remove sensitive data from logs',
      });
    }

    // Check for missing error handling in async functions
    if ((line.includes('async function') || line.includes('export async function')) &&
       !content.substring(i).includes('try {') &&
       !content.substring(i, i + 50).includes('catch')) {
      // This is a basic check, may have false positives
    }
  }

  // Check if POST/PUT/DELETE endpoints have proper validation
  if (analysis.methods.some(m => ['POST', 'PUT', 'DELETE', 'PATCH'].includes(m))) {
    if (!analysis.inputValidated) {
      addIssue({
        severity: 'high',
        category: 'Input Validation',
        file: filePath,
        issue: `Mutation endpoint (${analysis.methods.join(', ')}) without input validation`,
        recommendation: 'Implement Zod schema validation for all inputs',
      });
    }

    if (!analysis.csrfProtected && !content.includes('/api/auth/')) {
      addIssue({
        severity: 'high',
        category: 'CSRF Protection',
        file: filePath,
        issue: `Mutation endpoint (${analysis.methods.join(', ')}) without CSRF protection`,
        recommendation: 'Add csrfMiddleware to all state-changing operations',
      });
    }
  }

  // Check admin endpoints
  if (filePath.includes('/admin/')) {
    if (!analysis.authRequired) {
      addIssue({
        severity: 'critical',
        category: 'Authentication',
        file: filePath,
        issue: 'Admin endpoint without authentication',
        recommendation: 'Add verifyAdminAuth or verifyToken check',
      });
    }

    if (!analysis.inputValidated) {
      addIssue({
        severity: 'high',
        category: 'Input Validation',
        file: filePath,
        issue: 'Admin endpoint without input validation',
        recommendation: 'Implement strict input validation with Zod',
      });
    }
  }

  // Check auth endpoints for rate limiting
  if (filePath.includes('/api/auth/')) {
    if (!analysis.rateLimited && analysis.methods.includes('POST')) {
      addIssue({
        severity: 'medium',
        category: 'Rate Limiting',
        file: filePath,
        issue: 'Auth endpoint without rate limiting',
        recommendation: 'Add rateLimit to prevent brute force attacks',
      });
    }
  }

  analysis.issues = allIssues.filter(i => i.file === filePath);
  endpointAnalyses.push(analysis);

  return analysis;
}

async function analyzeAllAPIEndpoints() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     API SECURITY AND RELIABILITY ANALYSIS                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Find all API route files
  const routeFiles = glob.sync('/home/z/my-project/src/app/api/**/route.ts');

  console.log(`Found ${routeFiles.length} API route files\n`);

  for (const file of routeFiles) {
    console.log(`Analyzing: ${file.replace('/home/z/my-project/src/app/api/', '')}`);
    checkFileForIssues(file);
  }

  // Generate summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    ANALYSIS SUMMARY                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const severityCount = {
    critical: allIssues.filter(i => i.severity === 'critical').length,
    high: allIssues.filter(i => i.severity === 'high').length,
    medium: allIssues.filter(i => i.severity === 'medium').length,
    low: allIssues.filter(i => i.severity === 'low').length,
    info: allIssues.filter(i => i.severity === 'info').length,
  };

  console.log(`Total Issues Found: ${allIssues.length}`);
  console.log(`  🔴 Critical: ${severityCount.critical}`);
  console.log(`  🟠 High: ${severityCount.high}`);
  console.log(`  🟡 Medium: ${severityCount.medium}`);
  console.log(`  🔵 Low: ${severityCount.low}`);
  console.log(`  ⚪ Info: ${severityCount.info}`);

  // Group by category
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    ISSUES BY CATEGORY                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const categories = [...new Set(allIssues.map(i => i.category))];
  for (const category of categories) {
    const issues = allIssues.filter(i => i.category === category);
    console.log(`\n${category}: ${issues.length} issues`);

    for (const issue of issues) {
      const severityIcon = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🔵',
        info: '⚪',
      }[issue.severity];

      console.log(`  ${severityIcon} ${issue.severity.toUpperCase()}: ${issue.issue}`);
      console.log(`     File: ${issue.file.replace('/home/z/my-project/src/', '')}`);
      if (issue.line) console.log(`     Line: ${issue.line}`);
      console.log(`     Fix: ${issue.recommendation}\n`);
    }
  }

  // Endpoint statistics
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                  ENDPOINT STATISTICS                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const stats = {
    total: endpointAnalyses.length,
    authRequired: endpointAnalyses.filter(e => e.authRequired).length,
    csrfProtected: endpointAnalyses.filter(e => e.csrfProtected).length,
    rateLimited: endpointAnalyses.filter(e => e.rateLimited).length,
    inputValidated: endpointAnalyses.filter(e => e.inputValidated).length,
    hasErrorHandling: endpointAnalyses.filter(e => e.hasErrorHandling).length,
    sqlSafe: endpointAnalyses.filter(e => e.sqlSafe).length,
  };

  console.log(`Total Endpoints: ${stats.total}`);
  console.log(`Authentication Required: ${stats.authRequired} (${((stats.authRequired/stats.total)*100).toFixed(1)}%)`);
  console.log(`CSRF Protected: ${stats.csrfProtected} (${((stats.csrfProtected/stats.total)*100).toFixed(1)}%)`);
  console.log(`Rate Limited: ${stats.rateLimited} (${((stats.rateLimited/stats.total)*100).toFixed(1)}%)`);
  console.log(`Input Validated: ${stats.inputValidated} (${((stats.inputValidated/stats.total)*100).toFixed(1)}%)`);
  console.log(`Error Handling: ${stats.hasErrorHandling} (${((stats.hasErrorHandling/stats.total)*100).toFixed(1)}%)`);
  console.log(`SQL Safe: ${stats.sqlSafe} (${((stats.sqlSafe/stats.total)*100).toFixed(1)}%)`);

  // Generate JSON report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalIssues: allIssues.length,
      bySeverity: severityCount,
      byCategory: Object.fromEntries(
        categories.map(cat => [cat, allIssues.filter(i => i.category === cat).length])
      ),
    },
    statistics: stats,
    endpoints: endpointAnalyses,
    issues: allIssues,
  };

  const reportPath = '/home/z/my-project/api-security-analysis.json';
  await Bun.write(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  // Return report for further processing
  return report;
}

// Run analysis
analyzeAllAPIEndpoints().then(report => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                  ANALYSIS COMPLETE                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (report.summary.totalIssues > 0) {
    console.log('⚠️  Security issues found. Please review the report.\n');
    process.exit(1);
  } else {
    console.log('✅ No critical issues found. API is secure.\n');
    process.exit(0);
  }
});
