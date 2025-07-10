/*
 * generate_status_skeletons.js
 * ------------------------------------------------------------
 * 📄 Description  : Utility to scan /plans directory and create
 *                   skeleton status markdown files for each task
 *                   using templates/template_status_.md.
 *
 * 📝 References   : docs/engineering-spec.md (scripts standards)
 *                   templates/template_status_.md (status template)
 *
 * 🧩 Artifact Annotation:
 *   @doc refs docs/engineering-spec.md#status-reports
 */

const fs = require('fs');
const path = require('path');

const PLANS_DIR = path.join(__dirname, '..', 'plans');
const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'template_status_.md');
const STATUS_DIR = path.join(__dirname, '..', 'status');

// Ensure status directory exists
fs.mkdirSync(STATUS_DIR, { recursive: true });

// Load template once
const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

/**
 * Map plan task type to TDD phase string.
 * @param {string} type
 */
function mapTypeToPhase(type) {
  switch (type) {
    case 'TEST_CREATION':
    case 'DIAGNOSTIC_TEST_CREATION':
      return 'Red';
    case 'IMPLEMENTATION':
      return 'Green';
    case 'REFACTORING':
      return 'Refactor';
    case 'EPIC':
      return 'Epic Orchestration';
    default:
      return '';
  }
}

/**
 * Generate markdown content by replacing placeholders in template.
 */
function populateTemplate(planId, task) {
  const now = new Date().toISOString();
  const hasPrefix = planId.startsWith('plan_');
  const statusBaseId = hasPrefix ? planId : `plan_${planId}`; // ensure exactly one prefix
  const fileBaseId = hasPrefix ? planId.slice(5) : planId; // suffix used inside template path

  let content = template;
  content = content.replace(/<PLAN_ID>/g, fileBaseId);
  content = content.replace(/<TASK_ID>/g, task.id);
  content = content.replace('<!-- TEST_CREATION | IMPLEMENTATION | REFACTORING | EPIC | DIAGNOSTIC_TEST_CREATION -->', task.type);
  content = content.replace('<!-- Red | Green | Refactor | Epic Orchestration -->', mapTypeToPhase(task.type));
  const status = task.status || 'PENDING';
  content = content.replace('<!-- PENDING | IN_PROGRESS | DONE | FAILED -->', status);
  content = content.replace('<!-- YYYY-MM-DDTHH:MM:SSZ -->', now);
  // Replace header
  const headerRegex = /^# Status Report:.*$/m;
  const newHeader = `# Status Report: ${statusBaseId}_task_${task.id}_status`;
  content = content.replace(headerRegex, newHeader);
  return { content, statusBaseId };
}

/**
 * Iterate over provided plan files and generate status skeletons.
 */
function generate(selected) {
  const planFiles = selected.map(arg => {
    // Accept either exact filename or plan id (e.g., ingest_agent or plan_ingest_agent.txt)
    const filename = arg.endsWith('.txt') ? arg : `plan_${arg}.txt`;
    return filename;
  });

  planFiles.forEach(file => {
    const planPath = path.join(PLANS_DIR, file);
    if (!fs.existsSync(planPath)) {
      console.warn(`Plan file not found: ${file}`);
      return;
    }
    const raw = fs.readFileSync(planPath, 'utf8');
    let plan;
    try {
      plan = JSON.parse(raw);
    } catch (err) {
      console.warn(`Skipping invalid JSON plan: ${file}`);
      return;
    }
    if (plan.archived) return; // skip archived plans

    const planId = plan.id || path.basename(file, '.txt');
    if (!Array.isArray(plan.tasks)) return;

    plan.tasks.forEach((task) => {
      const { content: skeleton, statusBaseId } = populateTemplate(planId, task);
      const statusFilename = `${statusBaseId}_task_${task.id}_status.md`;
      const statusPath = path.join(STATUS_DIR, statusFilename);
      if (fs.existsSync(statusPath)) return;
      fs.writeFileSync(statusPath, skeleton, 'utf8');
      console.log(`Created ${path.relative(process.cwd(), statusPath)}`);
    });
  });
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/generate_status_skeletons.js <plan_file_or_id> [additional plans...]');
  process.exit(1);
}

generate(args); 