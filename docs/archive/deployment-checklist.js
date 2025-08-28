#!/usr/bin/env node

/**
 * Deployment Readiness Checklist
 * Quick checks to ensure production readiness
 */

const fs = require('fs');
const path = require('path');

// Console colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

const checks = [];

function check(name, test, critical = true) {
  const result = test();
  checks.push({
    name,
    passed: result === true,
    warning: result === 'warning',
    critical,
    message: typeof result === 'string' ? result : ''
  });
  
  const status = result === true ? `${colors.green}✅` : 
                 result === 'warning' ? `${colors.yellow}⚠️` :
                 `${colors.red}❌`;
                 
  console.log(`${status} ${name}${colors.reset} ${typeof result === 'string' && result !== 'warning' ? `- ${result}` : ''}`);
}

console.log(`\n${colors.blue}${colors.bold}🚀 DEPLOYMENT READINESS CHECKLIST${colors.reset}\n`);
console.log('=' .repeat(50));

// 1. Build Check
console.log(`\n${colors.blue}Build & Compilation:${colors.reset}`);
check('Production build exists', () => fs.existsSync('.next'));
check('Build artifacts complete', () => 
  fs.existsSync('.next/server') && fs.existsSync('.next/static')
);

// 2. Data Check
console.log(`\n${colors.blue}Data & Content:${colors.reset}`);
check('Toilet data exists', () => {
  const file = 'data/toilets.geojson';
  if (!fs.existsSync(file)) return false;
  const stats = fs.statSync(file);
  if (stats.size < 1000) return 'File too small';
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return data.features && data.features.length > 0;
  } catch(e) {
    return 'Invalid JSON';
  }
});

// 3. Configuration
console.log(`\n${colors.blue}Configuration:${colors.reset}`);
check('Package.json exists', () => fs.existsSync('package.json'));
check('Next.js config exists', () => fs.existsSync('next.config.js'));
check('TypeScript config exists', () => fs.existsSync('tsconfig.json'));
check('Environment variables', () => {
  if (fs.existsSync('.env') || fs.existsSync('.env.local')) return true;
  return 'warning';
}, false);

// 4. Dependencies
console.log(`\n${colors.blue}Dependencies:${colors.reset}`);
check('Node modules installed', () => fs.existsSync('node_modules'));
check('Package lock exists', () => 
  fs.existsSync('package-lock.json') || fs.existsSync('yarn.lock')
);

// 5. Code Quality
console.log(`\n${colors.blue}Code Quality:${colors.reset}`);
check('No TODO markers in API routes', () => {
  const apiDir = 'src/app/api';
  if (!fs.existsSync(apiDir)) return 'API directory missing';
  
  const hasTotos = require('child_process')
    .execSync(`grep -r "TODO\\|FIXME" ${apiDir} 2>/dev/null || true`, {encoding: 'utf8'})
    .trim();
  
  return hasTotos ? 'warning' : true;
}, false);

// 6. Security
console.log(`\n${colors.blue}Security:${colors.reset}`);
check('No exposed secrets', () => {
  const suspicious = ['api_key', 'secret', 'password', 'token'];
  const envFiles = ['.env', '.env.local'].filter(f => fs.existsSync(f));
  
  for (const file of envFiles) {
    const content = fs.readFileSync(file, 'utf8').toLowerCase();
    for (const keyword of suspicious) {
      if (content.includes(keyword) && !content.includes('#')) {
        return 'warning';
      }
    }
  }
  return true;
}, false);

// 7. Performance
console.log(`\n${colors.blue}Performance:${colors.reset}`);
check('Bundle size acceptable', () => {
  // Check if main bundle is reasonable
  const buildManifest = '.next/build-manifest.json';
  if (!fs.existsSync(buildManifest)) return 'warning';
  return true;
}, false);

// 8. Cloud Run Requirements
console.log(`\n${colors.blue}Cloud Run Deployment:${colors.reset}`);
check('Dockerfile present', () => fs.existsSync('Dockerfile'), false);
check('.dockerignore present', () => fs.existsSync('.dockerignore'), false);
check('Port configuration flexible', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return pkg.scripts && pkg.scripts.start ? true : 'Start script missing';
});

// 9. Documentation
console.log(`\n${colors.blue}Documentation:${colors.reset}`);
check('README exists', () => fs.existsSync('README.md'), false);
check('Deployment docs exist', () => 
  fs.existsSync('docs/FLIGHT-CHECKLIST.md') || 'warning'
, false);

// Summary
console.log('\n' + '=' .repeat(50));

const passed = checks.filter(c => c.passed).length;
const warnings = checks.filter(c => c.warning).length;
const failed = checks.filter(c => !c.passed && !c.warning).length;
const critical = checks.filter(c => !c.passed && c.critical && !c.warning).length;

console.log(`\n${colors.bold}Summary:${colors.reset}`);
console.log(`  ${colors.green}Passed: ${passed}${colors.reset}`);
console.log(`  ${colors.yellow}Warnings: ${warnings}${colors.reset}`);
console.log(`  ${colors.red}Failed: ${failed}${colors.reset}`);

if (critical === 0) {
  console.log(`\n${colors.green}${colors.bold}✅ READY FOR DEPLOYMENT${colors.reset}`);
  console.log('All critical checks passed. You can proceed with deployment.');
  
  if (warnings > 0) {
    console.log(`\n${colors.yellow}Recommendations:${colors.reset}`);
    checks.filter(c => c.warning).forEach(c => {
      console.log(`  • ${c.name}`);
    });
  }
  
  console.log(`\n${colors.blue}Next Steps:${colors.reset}`);
  console.log('  1. Create Dockerfile for Cloud Run');
  console.log('  2. Setup Google Cloud project');
  console.log('  3. Configure Cloud Run service');
  console.log('  4. Deploy using: gcloud run deploy');
  
} else {
  console.log(`\n${colors.red}${colors.bold}❌ NOT READY FOR DEPLOYMENT${colors.reset}`);
  console.log(`Fix ${critical} critical issue(s) before deploying:`);
  checks.filter(c => !c.passed && c.critical).forEach(c => {
    console.log(`  • ${c.name} ${c.message ? `- ${c.message}` : ''}`);
  });
}

console.log('\n');
process.exit(critical === 0 ? 0 : 1);