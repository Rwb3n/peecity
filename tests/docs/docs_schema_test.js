/**
 * Documentation Schema Validation Tests
 * 
 * @artifact: docs/engineering-spec.md#documentation-standards
 * @task: docs_schema_validation
 * @tdd-phase: GREEN
 * @pattern-type: Schema Validation Testing
 * @complexity: Intermediate
 * @audience: AI agents, developers
 * 
 * Tests all markdown files for front-matter schema compliance and markdownlint standards.
 * These tests are designed to FAIL initially to establish the "Red" phase of TDD.
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Load the front-matter schema
const schemaPath = path.join(__dirname, '../../docs_frontmatter_schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

// Initialize AJV validator
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

// Markdownlint configuration
const markdownlintConfig = {
  'default': true,
  'MD013': false, // Line length - disabled for flexibility
  'MD033': false, // HTML tags - allowed for documentation
  'MD041': false, // First line h1 - front-matter comes first
};

/**
 * Recursively find all markdown files in a directory
 */
function findMarkdownFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findMarkdownFiles(filePath, fileList);
    } else if (file.endsWith('.md')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

describe('Documentation Schema Validation', () => {
  let markdownFiles;
  
  beforeAll(() => {
    const docsDir = path.join(__dirname, '../../docs');
    markdownFiles = findMarkdownFiles(docsDir);
    
    console.log(`Found ${markdownFiles.length} markdown files for validation`);
    markdownFiles.forEach(file => {
      console.log(`  - ${path.relative(process.cwd(), file)}`);
    });
  });

  describe('Front-matter Schema Compliance', () => {
    test('should have valid front-matter schema file', () => {
      expect(fs.existsSync(schemaPath)).toBe(true);
      expect(schema).toHaveProperty('$schema');
      expect(schema).toHaveProperty('required');
      expect(schema.required).toContain('title');
      expect(schema.required).toContain('description');
      expect(schema.required).toContain('category');
      expect(schema.required).toContain('last_updated');
    });

    test('all markdown files should have valid front-matter', () => {
      const failures = [];
      
      markdownFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(process.cwd(), filePath);
        
        // Parse front-matter
        const parsed = matter(content);
        
        // Check if front-matter exists
        if (!parsed.data || Object.keys(parsed.data).length === 0) {
          failures.push({
            file: relativePath,
            error: 'No front-matter found'
          });
          return;
        }
        
        // Validate against schema
        const isValid = validate(parsed.data);
        if (!isValid) {
          failures.push({
            file: relativePath,
            error: 'Schema validation failed',
            details: validate.errors
          });
        }
      });
      
      if (failures.length > 0) {
        console.log('\nFront-matter validation failures:');
        failures.forEach(failure => {
          console.log(`\n❌ ${failure.file}`);
          console.log(`   Error: ${failure.error}`);
          if (failure.details) {
            failure.details.forEach(detail => {
              console.log(`   - ${detail.instancePath || 'root'}: ${detail.message}`);
            });
          }
        });
        
        // This test is DESIGNED TO FAIL initially (TDD Red phase)
        expect(failures).toHaveLength(0);
      }
    });

    test('all markdown files should have required fields', () => {
      const requiredFields = ['title', 'description', 'category', 'last_updated'];
      const missingFields = [];
      
      markdownFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(process.cwd(), filePath);
        const parsed = matter(content);
        
        requiredFields.forEach(field => {
          if (!parsed.data || !parsed.data[field]) {
            missingFields.push({
              file: relativePath,
              field: field
            });
          }
        });
      });
      
      if (missingFields.length > 0) {
        console.log('\nMissing required fields:');
        const groupedByFile = missingFields.reduce((acc, item) => {
          if (!acc[item.file]) acc[item.file] = [];
          acc[item.file].push(item.field);
          return acc;
        }, {});
        
        Object.entries(groupedByFile).forEach(([file, fields]) => {
          console.log(`❌ ${file}: missing ${fields.join(', ')}`);
        });
        
        // This test is DESIGNED TO FAIL initially (TDD Red phase)
        expect(missingFields).toHaveLength(0);
      }
    });

    test('all categories should be valid enum values', () => {
      const validCategories = [
        'cookbook', 'adr', 'reference', 'howto', 
        'explanation', 'feedback', 'archive', 'runbook', 'api'
      ];
      const invalidCategories = [];
      
      markdownFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(process.cwd(), filePath);
        const parsed = matter(content);
        
        if (parsed.data && parsed.data.category) {
          if (!validCategories.includes(parsed.data.category)) {
            invalidCategories.push({
              file: relativePath,
              category: parsed.data.category
            });
          }
        }
      });
      
      if (invalidCategories.length > 0) {
        console.log('\nInvalid categories found:');
        invalidCategories.forEach(item => {
          console.log(`❌ ${item.file}: category "${item.category}" not in valid list`);
        });
        console.log(`Valid categories: ${validCategories.join(', ')}`);
        
        // This test is DESIGNED TO FAIL initially (TDD Red phase)
        expect(invalidCategories).toHaveLength(0);
      }
    });
  });

  describe('Markdownlint Compliance', () => {
    test.skip('all markdown files should pass markdownlint rules', async () => {
      // Try using sync markdownlint to avoid ESM issues in Jest
      const markdownlint = require('markdownlint/sync');
      
      const lintPromises = markdownFiles.map(filePath => {
        try {
          const relativePath = path.relative(process.cwd(), filePath);
          
          const result = markdownlint.lintSync({
            files: [filePath],
            config: markdownlintConfig
          });
          
          const fileResult = result[filePath];
          if (fileResult && fileResult.length > 0) {
            return {
              file: relativePath,
              errors: fileResult
            };
          } else {
            return null;
          }
        } catch (err) {
          return {
            file: path.relative(process.cwd(), filePath),
            errors: [{ message: err.message }]
          };
        }
      });
      
      const results = await Promise.all(lintPromises);
      const failures = results.filter(result => result !== null);
      
      if (failures.length > 0) {
        console.log('\nMarkdownlint failures:');
        failures.forEach(failure => {
          console.log(`\n❌ ${failure.file}`);
          failure.errors.forEach(error => {
            console.log(`   Line ${error.lineNumber}: ${error.ruleNames?.join('/') || 'Error'} - ${error.ruleDescription || error.message}`);
          });
        });
        
        // This test may pass initially if markdownlint rules are already followed
        // but provides baseline for future validation
        expect(failures).toHaveLength(0);
      }
    });
  });

  describe('Documentation Structure Validation', () => {
    test('should have examples document with proper structure', () => {
      const examplesPath = path.join(__dirname, '../../docs/reference/frontmatter_examples.md');
      expect(fs.existsSync(examplesPath)).toBe(true);
      
      const content = fs.readFileSync(examplesPath, 'utf8');
      const parsed = matter(content);
      
      // Validate examples document has required front-matter
      expect(parsed.data).toHaveProperty('title');
      expect(parsed.data).toHaveProperty('category', 'reference');
      expect(parsed.data).toHaveProperty('description');
      expect(parsed.data).toHaveProperty('last_updated');
      
      // Validate content structure
      expect(content).toContain('Valid Front-matter Examples');
      expect(content).toContain('Invalid Front-matter Examples');
      expect(content).toContain('Schema Validation Notes');
    });

    test('should categorize files correctly by directory structure', () => {
      const categoryMappings = {
        '/docs/cookbook/': 'cookbook',
        '/docs/adr/': 'adr', 
        '/docs/reference/': 'reference',
        '/docs/howto/': 'howto',
        '/docs/explanations/': 'explanation',
        '/docs/feedback/': 'feedback',
        '/docs/archive/': 'archive'
      };
      
      const mismatches = [];
      
      markdownFiles.forEach(filePath => {
        const relativePath = path.relative(process.cwd(), filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = matter(content);
        
        if (parsed.data && parsed.data.category) {
          const expectedCategory = Object.entries(categoryMappings).find(([dir]) => 
            relativePath.includes(dir)
          )?.[1];
          
          if (expectedCategory && parsed.data.category !== expectedCategory) {
            mismatches.push({
              file: relativePath,
              expected: expectedCategory,
              actual: parsed.data.category
            });
          }
        }
      });
      
      if (mismatches.length > 0) {
        console.log('\nCategory/directory mismatches:');
        mismatches.forEach(mismatch => {
          console.log(`❌ ${mismatch.file}: expected "${mismatch.expected}", got "${mismatch.actual}"`);
        });
        
        // This test may fail initially if categories don't match directory structure
        expect(mismatches).toHaveLength(0);
      }
    });
  });

  describe('Schema Coverage and Quality', () => {
    test('should provide comprehensive validation coverage', () => {
      // Validate that our test suite covers all schema requirements
      const schemaProperties = Object.keys(schema.properties);
      const requiredProperties = schema.required;
      
      expect(requiredProperties).toContain('title');
      expect(requiredProperties).toContain('description');
      expect(requiredProperties).toContain('category');
      expect(requiredProperties).toContain('last_updated');
      
      // Ensure we have optional properties for extensibility
      const optionalProperties = schemaProperties.filter(prop => 
        !requiredProperties.includes(prop)
      );
      
      expect(optionalProperties.length).toBeGreaterThan(0);
      expect(optionalProperties).toContain('tags');
      expect(optionalProperties).toContain('version');
      expect(optionalProperties).toContain('author');
      expect(optionalProperties).toContain('status');
    });
  });
});