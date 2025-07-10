const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', '..', 'docs');
const ARCHIVE_DIR = path.join(DOCS_DIR, 'archive');

const PLACEHOLDER_PATTERNS = [
  /Content relocated/i,
  /Content migrated/i,
  /\*Content archived/i,
];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.resolve(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

describe('Docs placeholder scan', () => {
  test('no placeholder stubs remain and docs have minimum length', () => {
    const issues = [];
    const mdFiles = walk(DOCS_DIR).filter(p => p.endsWith('.md'));

    mdFiles.forEach(file => {
      if (file.startsWith(ARCHIVE_DIR)) return; // skip archive
      const rel = path.relative(DOCS_DIR, file);
      const content = fs.readFileSync(file, 'utf8');

      // length check (≥ 30 lines)
      const lines = content.split(/\r?\n/);
      if (lines.length < 30) {
        issues.push(`${rel} is too short (${lines.length} lines)`);
      }

      // placeholder patterns
      PLACEHOLDER_PATTERNS.forEach(rx => {
        if (rx.test(content)) {
          issues.push(`${rel} contains placeholder phrase: ${rx}`);
        }
      });
    });

    expect(issues).toEqual([]);
  });
}); 