const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DOCS_DIR = path.join(__dirname, '..', '..', 'docs');
const ALLOWED_TOP_LEVEL_DIRS = new Set([
  'tutorials',
  'howto',
  'reference',
  'explanations',
  'adr',
  'cookbook',
  'archive',
  'runbooks'
]);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const res = path.resolve(dir, entry.name);
    return entry.isDirectory() ? walk(res) : [res];
  });
}

describe('Documentation structure', () => {
  test('all markdown files follow Diátaxis structure and include required front-matter', () => {
    const mdFiles = walk(DOCS_DIR).filter((p) => p.endsWith('.md'));
    const issues = [];
    const titles = new Set();

    mdFiles.forEach((filePath) => {
      const relativePath = path.relative(DOCS_DIR, filePath);
      // Skip root README.md indexing file
      if (relativePath === 'README.md') {
        return;
      }
      const topLevel = relativePath.split(path.sep)[0];

      // 1️⃣ Directory location validation
      if (!ALLOWED_TOP_LEVEL_DIRS.has(topLevel)) {
        issues.push(`${relativePath} is in an invalid directory (${topLevel})`);
      }

      // 2️⃣ YAML front-matter validation
      const content = fs.readFileSync(filePath, 'utf8');
      if (!content.startsWith('---')) {
        issues.push(`${relativePath} is missing YAML front-matter block`);
        return;
      }
      const endIndex = content.indexOf('\n---', 3);
      if (endIndex === -1) {
        issues.push(`${relativePath} is missing closing YAML front-matter delimiter`);
        return;
      }
      const yamlBlock = content.slice(3, endIndex);
      let meta;
      try {
        meta = yaml.load(yamlBlock);
      } catch (e) {
        issues.push(`${relativePath} has invalid YAML front-matter: ${e.message}`);
        return;
      }

      const requiredKeys = ['title', 'description', 'category', 'last_updated'];
      requiredKeys.forEach((key) => {
        if (!meta || !meta[key]) {
          issues.push(`${relativePath} front-matter missing required key: ${key}`);
        }
      });

      // 3️⃣ Duplicate title validation
      if (meta && meta.title) {
        if (titles.has(meta.title)) {
          issues.push(`Duplicate title detected: ${meta.title}`);
        } else {
          titles.add(meta.title);
        }
      }
    });

    // The test is expected to fail until docs are normalized (RED phase)
    expect(issues).toEqual([]);
  });
}); 