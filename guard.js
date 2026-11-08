#!/usr/bin/env node
/**
 * TAVARDT SEO Guard Action
 * Description: Automated CI/CD search regression prevention and HTML auditor
 * Website: https://ag.tavardt.com/
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';

function parseArgs() {
  const args = process.argv.slice(2);
  let targetDir = './out';
  let failOnError = true;
  let maxTitleLength = 70;
  let minTitleLength = 10;
  let maxDescLength = 165;
  let minDescLength = 40;
  let ignorePatterns = ['404.html', '404/index.html', 'google*.html'];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dir' || arg === '-d') {
      targetDir = args[++i];
    } else if (arg === '--no-fail') {
      failOnError = false;
    } else if (arg === '--fail-on-error') {
      failOnError = args[++i] !== 'false';
    } else if (arg === '--ignore') {
      ignorePatterns.push(...args[++i].split(','));
    } else if (!arg.startsWith('-') && i === 0) {
      targetDir = arg;
    }
  }

  // GitHub Actions input overrides
  if (process.env.INPUT_HTML_DIR) targetDir = process.env.INPUT_HTML_DIR;
  if (process.env.INPUT_FAIL_ON_ERROR) failOnError = process.env.INPUT_FAIL_ON_ERROR !== 'false';
  if (process.env.INPUT_IGNORE) ignorePatterns.push(...process.env.INPUT_IGNORE.split(','));

  return { targetDir, failOnError, minTitleLength, maxTitleLength, minDescLength, maxDescLength, ignorePatterns };
}

function shouldIgnore(relPath, patterns) {
  const normalized = relPath.replace(/\\/g, '/');
  for (const pat of patterns) {
    if (pat.includes('*')) {
      const regex = new RegExp('^' + pat.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$', 'i');
      if (regex.test(path.basename(normalized)) || regex.test(normalized)) return true;
    } else {
      if (normalized === pat || normalized.endsWith('/' + pat) || path.basename(normalized) === pat) return true;
    }
  }
  return false;
}

function findHtmlFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findHtmlFiles(fullPath, fileList);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function auditHtmlContent(filePath, content, config) {
  const issues = [];
  const warnings = [];

  // 1. Accidental Noindex Detection (Catastrophic Risk)
  const robotsMatch = content.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  if (robotsMatch) {
    const robotsVal = robotsMatch[1].toLowerCase();
    if (robotsVal.includes('noindex')) {
      issues.push({
        type: 'ACCIDENTAL_NOINDEX',
        message: `Catastrophic SEO Risk: Found meta robots 'noindex' in production build (${robotsVal})`,
        severity: 'CRITICAL'
      });
    }
  }

  // 2. Title Tag Inspection
  const titleMatch = content.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (!titleMatch) {
    issues.push({ type: 'MISSING_TITLE', message: 'Missing <title> tag', severity: 'CRITICAL' });
  } else {
    const titleText = titleMatch[1].trim();
    if (titleText.length === 0) {
      issues.push({ type: 'EMPTY_TITLE', message: '<title> tag is empty', severity: 'CRITICAL' });
    } else if (titleText.length < config.minTitleLength) {
      warnings.push({ type: 'SHORT_TITLE', message: `<title> is too short (${titleText.length} chars: "${titleText}")` });
    } else if (titleText.length > config.maxTitleLength) {
      warnings.push({ type: 'LONG_TITLE', message: `<title> exceeds recommended ${config.maxTitleLength} chars (${titleText.length} chars)` });
    }
  }

  // 3. Meta Description Inspection
  const descMatch = content.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)
    || content.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
  if (!descMatch) {
    issues.push({ type: 'MISSING_DESCRIPTION', message: 'Missing <meta name="description"> tag', severity: 'HIGH' });
  } else {
    const descText = descMatch[1].trim();
    if (descText.length === 0) {
      issues.push({ type: 'EMPTY_DESCRIPTION', message: 'Meta description is empty', severity: 'HIGH' });
    } else if (descText.length < config.minDescLength) {
      warnings.push({ type: 'SHORT_DESCRIPTION', message: `Meta description is short (${descText.length} chars)` });
    } else if (descText.length > config.maxDescLength) {
      warnings.push({ type: 'LONG_DESCRIPTION', message: `Meta description exceeds ${config.maxDescLength} chars (${descText.length} chars)` });
    }
  }

  // 4. Canonical Tag Inspection
  const canonicalMatch = content.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["'][^>]*>/i)
    || content.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["'][^>]*>/i);
  if (!canonicalMatch) {
    issues.push({ type: 'MISSING_CANONICAL', message: 'Missing <link rel="canonical"> tag', severity: 'HIGH' });
  } else {
    const canonicalHref = canonicalMatch[1].trim();
    if (!canonicalHref || canonicalHref === '#' || canonicalHref === '/') {
      issues.push({ type: 'INVALID_CANONICAL', message: `Invalid canonical URL: "${canonicalHref}"`, severity: 'HIGH' });
    }
  }

  // 5. OpenGraph Tags Inspection
  const ogTitleMatch = content.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const ogImageMatch = content.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  if (!ogTitleMatch) {
    warnings.push({ type: 'MISSING_OG_TITLE', message: 'Missing <meta property="og:title">' });
  }
  if (!ogImageMatch) {
    warnings.push({ type: 'MISSING_OG_IMAGE', message: 'Missing <meta property="og:image">' });
  }

  // 6. Image Alt Tags Inspection
  const imgRegex = /<img\b([^>]*)>/gi;
  let imgMatch;
  let imgIndex = 0;
  while ((imgMatch = imgRegex.exec(content)) !== null) {
    imgIndex++;
    const attrs = imgMatch[1];
    const hasAlt = /\balt\s*=\s*["'][^"']*["']/i.test(attrs);
    if (!hasAlt) {
      const srcMatch = attrs.match(/\bsrc\s*=\s*["']([^"']*)["']/i);
      const src = srcMatch ? srcMatch[1] : `image #${imgIndex}`;
      warnings.push({ type: 'MISSING_IMG_ALT', message: `Image missing alt attribute: ${src}` });
    }
  }

  // 7. Schema.org JSON-LD Syntax Check
  const jsonLdRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let jsonMatch;
  while ((jsonMatch = jsonLdRegex.exec(content)) !== null) {
    const jsonRaw = jsonMatch[1].trim();
    if (jsonRaw) {
      try {
        JSON.parse(jsonRaw);
      } catch (err) {
        issues.push({
          type: 'INVALID_JSON_LD',
          message: `Malformed Schema.org JSON-LD syntax: ${err.message}`,
          severity: 'HIGH'
        });
      }
    }
  }

  return { issues, warnings };
}

function run() {
  const config = parseArgs();
  console.log(`${BLUE}${BOLD}🛡️ [TAVARDT] SEO Guard Action v1.0.0${RESET}`);
  console.log(`${CYAN}Auditing build directory: ${BOLD}${config.targetDir}${RESET}\n`);

  if (!fs.existsSync(config.targetDir)) {
    console.error(`${RED}🚨 [ERROR] Target HTML directory not found: ${config.targetDir}${RESET}`);
    console.error(`Please ensure your build step ran successfully before invoking SEO Guard.`);
    process.exit(1);
  }

  const htmlFiles = findHtmlFiles(config.targetDir);
  if (htmlFiles.length === 0) {
    console.log(`${YELLOW}⚠️  [WARNING] No .html files found in ${config.targetDir}.${RESET}`);
    process.exit(0);
  }

  console.log(`Discovered ${BOLD}${htmlFiles.length}${RESET} HTML files for regression audit.\n`);

  let totalIssues = 0;
  let totalWarnings = 0;
  const failedFiles = [];

  for (const file of htmlFiles) {
    const relPath = path.relative(config.targetDir, file);
    if (shouldIgnore(relPath, config.ignorePatterns)) {
      continue;
    }
    const content = fs.readFileSync(file, 'utf-8');
    const { issues, warnings } = auditHtmlContent(file, content, config);

    totalIssues += issues.length;
    totalWarnings += warnings.length;

    if (issues.length > 0 || warnings.length > 0) {
      console.log(`${BOLD}📄 ${relPath}${RESET}`);

      for (const issue of issues) {
        console.log(`   ${RED}✖ [${issue.severity}] ${issue.message}${RESET}`);
        // GitHub Action Annotation format
        if (process.env.GITHUB_ACTIONS) {
          console.log(`::error file=${file}::[${issue.type}] ${issue.message}`);
        }
      }

      for (const warn of warnings) {
        console.log(`   ${YELLOW}▲ [WARNING] ${warn.message}${RESET}`);
        if (process.env.GITHUB_ACTIONS) {
          console.log(`::warning file=${file}::[${warn.type}] ${warn.message}`);
        }
      }

      if (issues.length > 0) {
        failedFiles.push(relPath);
      }
      console.log('');
    }
  }

  console.log(`${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
  console.log(`${BOLD}📊 TAVARDT SEO Guard Scorecard:${RESET}`);
  console.log(`   • Total Pages Audited: ${htmlFiles.length}`);
  console.log(`   • Critical Issues:     ${totalIssues > 0 ? RED + totalIssues + RESET : GREEN + '0' + RESET}`);
  console.log(`   • Warnings:            ${totalWarnings > 0 ? YELLOW + totalWarnings + RESET : GREEN + '0' + RESET}`);

  if (totalIssues > 0) {
    console.log(`\n${RED}${BOLD}🚨 [FAIL] SEO regressions detected in ${failedFiles.length} file(s).${RESET}`);
    if (config.failOnError) {
      console.log(`${RED}Halting CI/CD pipeline to protect production search rankings.${RESET}`);
      process.exit(1);
    }
  } else {
    console.log(`\n${GREEN}${BOLD}✅ [PASS] All pages passed TAVARDT enterprise SEO compliance standards.${RESET}`);
  }

  console.log(`\n${CYAN}🔗 Looking for technical SEO, organic growth or web design: https://ag.tavardt.com/${RESET}`);
}

if (require.main === module) {
  run();
}

module.exports = { auditHtmlContent, findHtmlFiles };
