#!/usr/bin/env node

/**
 * scaffold-doc.js - Documentation scaffolding CLI
 * 
 * Generates new documentation files with schema-compliant front-matter
 * based on the docs_frontmatter_schema.json specification.
 * 
 * Usage:
 *   node scripts/scaffold-doc.js --category cookbook --title "My Recipe" --description "Implementation guide for..." --output docs/cookbook/recipe_my_recipe.md
 * 
 * Categories: cookbook, adr, reference, howto, explanation, feedback, archive, runbook, api
 */

const fs = require('fs');
const path = require('path');
const { program } = require('commander');

// Load the front-matter schema
const SCHEMA_PATH = path.join(__dirname, '..', 'docs_frontmatter_schema.json');
const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));

// Extract valid categories from schema
const validCategories = schema.properties.category.enum;

// CLI configuration
program
  .name('scaffold-doc')
  .description('Generate new documentation files with schema-compliant front-matter')
  .version('1.0.0')
  .requiredOption('-c, --category <category>', `Document category (${validCategories.join(', ')})`)
  .requiredOption('-t, --title <title>', 'Document title (1-100 characters)')
  .requiredOption('-d, --description <description>', 'Document description (10-500 characters)')
  .requiredOption('-o, --output <path>', 'Output file path')
  .option('--author <author>', 'Document author')
  .option('--doc-version <version>', 'Document version (semantic versioning)')
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--status <status>', 'Document status (draft, review, approved, published, deprecated, archived)')
  .option('--audience <audience>', 'Target audience (developers, ai-agents, maintainers, users, contributors, all)')
  .option('--complexity <complexity>', 'Complexity level (beginner, intermediate, advanced, expert)')
  .option('--force', 'Overwrite existing files')
  .option('--dry-run', 'Show what would be generated without creating files');

program.parse();

const options = program.opts();

/**
 * Validate input parameters against schema constraints
 */
function validateInput() {
  const errors = [];
  
  // Category validation
  if (!validCategories.includes(options.category)) {
    errors.push(`Invalid category '${options.category}'. Must be one of: ${validCategories.join(', ')}`);
  }
  
  // Title validation
  if (options.title.length < 1 || options.title.length > 100) {
    errors.push('Title must be between 1 and 100 characters');
  }
  
  // Description validation
  if (options.description.length < 10 || options.description.length > 500) {
    errors.push('Description must be between 10 and 500 characters');
  }
  
  // Optional field validation
  if (options.author && (options.author.length < 1 || options.author.length > 100)) {
    errors.push('Author must be between 1 and 100 characters');
  }
  
  if (options.docVersion && !/^(\d+\.\d+(\.\d+)?|\d+)$/.test(options.docVersion)) {
    errors.push('Version must follow semantic versioning (e.g., 1.0.0, 1.0, 1)');
  }
  
  if (options.status && !schema.properties.status.enum.includes(options.status)) {
    errors.push(`Invalid status '${options.status}'. Must be one of: ${schema.properties.status.enum.join(', ')}`);
  }
  
  if (options.audience && !schema.properties.audience.enum.includes(options.audience)) {
    errors.push(`Invalid audience '${options.audience}'. Must be one of: ${schema.properties.audience.enum.join(', ')}`);
  }
  
  if (options.complexity && !schema.properties.complexity.enum.includes(options.complexity)) {
    errors.push(`Invalid complexity '${options.complexity}'. Must be one of: ${schema.properties.complexity.enum.join(', ')}`);
  }
  
  // Output path validation
  if (!options.output.endsWith('.md')) {
    errors.push('Output file must have .md extension');
  }
  
  return errors;
}

/**
 * Generate current date in YYYY-MM-DD format
 */
function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Generate front-matter object
 */
function generateFrontMatter() {
  const frontMatter = {
    title: options.title,
    description: options.description,
    category: options.category,
    last_updated: getCurrentDate()
  };
  
  // Add optional fields if provided
  if (options.author) frontMatter.author = options.author;
  if (options.docVersion) frontMatter.version = options.docVersion;
  if (options.status) frontMatter.status = options.status;
  if (options.audience) frontMatter.audience = options.audience;
  if (options.complexity) frontMatter.complexity = options.complexity;
  
  // Process tags
  if (options.tags) {
    const tags = options.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    if (tags.length > 0 && tags.length <= 10) {
      frontMatter.tags = tags;
    }
  }
  
  return frontMatter;
}

/**
 * Generate document template based on category
 */
function generateTemplate(frontMatter) {
  const templates = {
    cookbook: `# ${frontMatter.title}

## Overview

${frontMatter.description}

## Prerequisites

- List any required dependencies
- Environment setup requirements
- Knowledge prerequisites

## Implementation

### Step 1: Setup

Describe the initial setup steps.

### Step 2: Core Implementation

Provide the main implementation details.

### Step 3: Testing

Explain how to test the implementation.

## Usage Examples

\`\`\`javascript
// Provide code examples
\`\`\`

## Best Practices

- List best practices
- Common pitfalls to avoid
- Performance considerations

## Troubleshooting

### Common Issues

1. **Issue**: Description of problem
   - **Solution**: How to resolve it

## Related Documentation

- [Related Doc 1](../path/to/doc1.md)
- [Related Doc 2](../path/to/doc2.md)

## References

- External references
- API documentation
- Additional resources`,

    adr: `# ${frontMatter.title}

**Status**: ${frontMatter.status || 'proposed'}  
**Date**: ${frontMatter.last_updated}  
**Deciders**: [List decision makers]

## Context

Describe the context and problem statement that led to this decision.

## Decision

Explain the decision that was made and the reasoning behind it.

## Consequences

### Positive Consequences

- List positive outcomes
- Benefits of this decision

### Negative Consequences  

- List potential downsides
- Risks and mitigation strategies

## Implementation

Describe how this decision will be implemented.

## Alternatives Considered

### Alternative 1: [Name]
- Description
- Pros and cons
- Why it was rejected

### Alternative 2: [Name]
- Description  
- Pros and cons
- Why it was rejected

## References

- Supporting documentation
- Related ADRs
- External references`,

    reference: `# ${frontMatter.title}

## Overview

${frontMatter.description}

## API Reference

### Endpoints

#### GET /api/example
- **Description**: Endpoint description
- **Parameters**: Parameter details
- **Response**: Response format
- **Example**: Usage example

### Data Structures

#### ExampleObject
\`\`\`typescript
interface ExampleObject {
  id: string;
  name: string;
  // Additional properties
}
\`\`\`

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| EXAMPLE_VAR | Variable description | \`default\` | Yes |

### Configuration Files

Describe configuration file formats and locations.

## Examples

### Basic Usage

\`\`\`javascript
// Provide usage examples
\`\`\`

### Advanced Usage

\`\`\`javascript
// More complex examples
\`\`\`

## Error Handling

### Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| 400 | Bad Request | Check request format |
| 500 | Server Error | Check server logs |

## Related Documentation

- [Related Doc 1](../path/to/doc1.md)
- [Related Doc 2](../path/to/doc2.md)`,

    howto: `# ${frontMatter.title}

## Problem

Describe the problem this guide solves.

## Solution Overview

Brief overview of the solution approach.

## Prerequisites

- List requirements
- Tools needed
- Knowledge assumed

## Step-by-Step Guide

### Step 1: [Action]

Detailed description of the first step.

\`\`\`bash
# Command examples
\`\`\`

### Step 2: [Action]

Detailed description of the second step.

\`\`\`javascript
// Code examples
\`\`\`

### Step 3: [Action]

Continue with additional steps as needed.

## Verification

How to verify the solution worked correctly.

## Troubleshooting

### Common Issues

1. **Problem**: Issue description
   - **Symptoms**: What you might see
   - **Solution**: How to fix it

2. **Problem**: Another issue
   - **Symptoms**: What you might see
   - **Solution**: How to fix it

## Alternative Approaches

Describe other ways to solve the same problem.

## Related Documentation

- [Related Guide 1](../path/to/guide1.md)
- [Related Guide 2](../path/to/guide2.md)`,

    explanation: `# ${frontMatter.title}

## Introduction

${frontMatter.description}

## Background

Provide context and background information.

## Core Concepts

### Concept 1

Explain the first key concept.

### Concept 2

Explain the second key concept.

## Architecture

Describe the architectural approach and design decisions.

## Implementation Details

### Component 1

Detailed explanation of the first component.

### Component 2

Detailed explanation of the second component.

## Trade-offs and Considerations

### Design Trade-offs

- Trade-off 1: Description and reasoning
- Trade-off 2: Description and reasoning

### Performance Considerations

- Performance aspect 1
- Performance aspect 2

## Future Considerations

- Potential improvements
- Scalability considerations
- Evolution path

## Related Documentation

- [Related Explanation 1](../path/to/explanation1.md)
- [Related Explanation 2](../path/to/explanation2.md)`,

    runbook: `# ${frontMatter.title}

**Alert Name**: [Alert Name]  
**Severity**: [High/Medium/Low]  
**Service**: [Service Name]  
**Team**: [Responsible Team]

## Alert Overview

**Description**: ${frontMatter.description}

**Trigger Conditions**: 
- Condition 1: Description
- Condition 2: Description

**Business Impact**:
- Impact description
- User-facing consequences
- SLA implications

## Symptoms

**Primary Symptoms**:
- Symptom 1
- Symptom 2

**Secondary Symptoms**:
- Related symptom 1
- Related symptom 2

## Troubleshooting Steps

### Step 1: Initial Assessment
1. Check alert details
2. Verify scope of impact
3. Check dependencies

### Step 2: Quick Fixes
1. Common causes and immediate actions
2. Escalation criteria

### Step 3: Deep Investigation
1. Log analysis procedures
2. Metric analysis
3. System checks

### Step 4: Root Cause Analysis
1. Data collection steps
2. Timeline reconstruction
3. Impact assessment

## Resolution

### Immediate Actions
- [ ] Action 1
- [ ] Action 2

### Long-term Solutions
- [ ] Solution 1
- [ ] Solution 2

### Verification Steps
1. Verification step 1
2. Verification step 2

## Prevention

### Monitoring Improvements
- Monitoring enhancement 1
- Monitoring enhancement 2

### System Improvements
- System improvement 1
- System improvement 2

## References

### Documentation
- [Related Doc 1](../path/to/doc1.md)
- [Related Doc 2](../path/to/doc2.md)

### Dashboards
- [Dashboard 1](../../templates/dashboard1.json)
- [Dashboard 2](../../templates/dashboard2.json)

### Related Runbooks
- [Related Runbook 1](./runbook1.md)
- [Related Runbook 2](./runbook2.md)

---

**Last Incident**: [Date] - [Brief description]  
**Next Review**: [Date]  
**Runbook Owner**: [Team/Person]`
  };

  // Default template for unknown categories
  const defaultTemplate = `# ${frontMatter.title}

## Overview

${frontMatter.description}

## Content

Add your content here.

## Related Documentation

- [Related Doc 1](../path/to/doc1.md)
- [Related Doc 2](../path/to/doc2.md)`;

  return templates[frontMatter.category] || defaultTemplate;
}

/**
 * Generate the complete document content
 */
function generateDocument() {
  const frontMatter = generateFrontMatter();
  const template = generateTemplate(frontMatter);
  
  // Generate YAML front-matter
  const yamlFrontMatter = Object.entries(frontMatter)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`;
      }
      return `${key}: "${value}"`;
    })
    .join('\n');
  
  return `---\n${yamlFrontMatter}\n---\n\n${template}`;
}

/**
 * Main execution
 */
function main() {
  console.log('🏗️  CityPee Documentation Scaffolding CLI');
  console.log('==========================================\n');
  
  // Validate input
  const validationErrors = validateInput();
  if (validationErrors.length > 0) {
    console.error('❌ Validation errors:');
    validationErrors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }
  
  // Generate document content
  const documentContent = generateDocument();
  
  // Dry run mode
  if (options.dryRun) {
    console.log('📋 Dry run mode - showing what would be generated:\n');
    console.log(`📁 Output path: ${options.output}`);
    console.log(`📄 Content preview:\n${'='.repeat(50)}`);
    console.log(documentContent);
    console.log('='.repeat(50));
    return;
  }
  
  // Check if file exists
  if (fs.existsSync(options.output) && !options.force) {
    console.error(`❌ File already exists: ${options.output}`);
    console.error('   Use --force to overwrite or choose a different output path.');
    process.exit(1);
  }
  
  // Ensure output directory exists
  const outputDir = path.dirname(options.output);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created directory: ${outputDir}`);
  }
  
  // Write file
  fs.writeFileSync(options.output, documentContent, 'utf8');
  
  console.log(`✅ Successfully created: ${options.output}`);
  console.log(`📋 Category: ${options.category}`);
  console.log(`📝 Title: ${options.title}`);
  console.log(`📄 Description: ${options.description}`);
  
  // Show next steps
  console.log('\n📚 Next steps:');
  console.log('   1. Review and customize the generated content');
  console.log('   2. Run documentation tests: npm test tests/docs/');
  console.log('   3. Run linting: npm run lint:docs');
  console.log('   4. Commit your changes');
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = {
  generateFrontMatter,
  generateTemplate,
  generateDocument,
  validateInput,
  validCategories
};