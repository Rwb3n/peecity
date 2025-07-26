# Template System

Comprehensive template system for rapid project setup and operational procedures. This directory contains both scaffolding templates for new project initialization and operational templates for ongoing maintenance.

## Template Categories

### 🏗️ Scaffolding Templates
Templates for initializing new projects or components with standardized configurations.

| Template | Purpose | Variables | Usage |
|----------|---------|-----------|-------|
| `package.json.template` | Node.js project setup | `{{PROJECT_NAME}}`, `{{VERSION}}`, `{{PROJECT_DESCRIPTION}}`, `{{PRIVATE}}`, `{{NODE_VERSION}}`, `{{PACKAGE_MANAGER}}` | Copy and substitute variables for new Node.js projects |
| `tsconfig.json.template` | TypeScript configuration | `{{STRICT_MODE}}`, `{{SOURCE_MAPS}}`, `{{SOURCE_DIR}}` | Standard TypeScript setup with Next.js integration |
| `next.config.js.template` | Next.js configuration | `{{IMAGE_DOMAINS}}`, `{{REACT_STRICT_MODE}}` | Base Next.js configuration with common patterns |
| `.env.template` | Environment variables | Multiple environment-specific variables | Template for environment configuration |

### 📋 Operational Templates
Templates for ongoing operational procedures and documentation.

| Template | Purpose | Last Updated | Usage |
|----------|---------|--------------|-------|
| `template_status_.md` | Status report template | Active | Used for task completion reports (see CLAUDE.md) |
| `runbook-template.md` | Operational runbook template | 2025-07-09 | Standard format for alert response procedures |
| `grafana-citypee-validation.json` | Grafana dashboard template | Active | Production monitoring dashboard template |
| `template_safe_migration_plan.json` | Migration planning template | Active | Gold standard for safe system migrations |

## Usage Guide

### Using Scaffolding Templates

#### Basic Usage
1. Copy the template file to your target location
2. Remove the `.template` suffix
3. Replace all `{{VARIABLE}}` placeholders with actual values
4. Customize additional settings as needed

#### Example: Setting up a new Node.js project
```bash
# Copy and rename template
cp templates/package.json.template ./new-project/package.json

# Replace variables (example values)
sed -i 's/{{PROJECT_NAME}}/my-new-project/g' ./new-project/package.json
sed -i 's/{{VERSION}}/1.0.0/g' ./new-project/package.json
sed -i 's/{{PROJECT_DESCRIPTION}}/My awesome new project/g' ./new-project/package.json
sed -i 's/{{PRIVATE}}/true/g' ./new-project/package.json
sed -i 's/{{NODE_VERSION}}/>=18.0.0/g' ./new-project/package.json
sed -i 's/{{PACKAGE_MANAGER}}/npm@10.0.0/g' ./new-project/package.json
```

#### Variable Substitution Guide

**Package.json Template Variables:**
- `{{PROJECT_NAME}}` - Name of your project (lowercase, no spaces)
- `{{VERSION}}` - Initial version (e.g., "0.1.0", "1.0.0")  
- `{{PROJECT_DESCRIPTION}}` - Brief project description
- `{{PRIVATE}}` - Whether package is private (true/false)
- `{{NODE_VERSION}}` - Minimum Node.js version (e.g., ">=18.0.0")
- `{{PACKAGE_MANAGER}}` - Package manager with version (e.g., "npm@10.0.0")

**TypeScript Template Variables:**
- `{{STRICT_MODE}}` - Enable TypeScript strict mode (true/false)
- `{{SOURCE_MAPS}}` - Enable source maps (true/false)
- `{{SOURCE_DIR}}` - Source directory path (e.g., "src", "lib")

**Next.js Template Variables:**
- `{{IMAGE_DOMAINS}}` - Allowed image domains (e.g., "'localhost', 'example.com'")
- `{{REACT_STRICT_MODE}}` - Enable React strict mode (true/false)

**Environment Template Variables:**
- `{{NODE_ENV}}` - Environment type (development/production/test)
- `{{APP_NAME}}` - Application name for public use
- `{{APP_URL}}` - Base application URL
- Additional variables as documented in the template file

### Using Operational Templates

#### Status Reports
Use `template_status_.md` for task completion reports:
```bash
cp templates/template_status_.md status/plan_epic2_task4_status.md
# Edit file and replace placeholders with actual values
```

#### Runbooks
Use `runbook-template.md` for operational procedures:
```bash
cp templates/runbook-template.md docs/runbooks/new-alert-runbook.md
# Customize for specific alert and procedures
```

#### Grafana Dashboards
Use `grafana-citypee-validation.json` as baseline for monitoring:
1. Import template into Grafana
2. Customize panels and metrics for your use case
3. Export customized version for deployment

#### Migration Planning
Use `template_safe_migration_plan.json` for system migrations:
```bash
cp templates/template_safe_migration_plan.json migrations/migration-plan-v2.json
# Customize phases, rollback procedures, and validation steps
```

## Template Standards

### Naming Convention
- **Scaffolding templates**: `{filename}.template` (e.g., `package.json.template`)
- **Operational templates**: `template-{purpose}.{ext}` or `{purpose}-template.{ext}`
- **Legacy operational**: `template_{purpose}_.{ext}` (maintained for compatibility)

### Variable Format
- Use `{{VARIABLE_NAME}}` format for all substitutable values
- Use UPPER_CASE with underscores for variable names
- Include comments explaining variable purpose where helpful
- Provide example values in comments when possible

### Documentation Requirements
- Each template must include header comments explaining purpose
- Document all variables and their expected values
- Include usage examples where applicable
- Maintain "last updated" dates for operational templates

## Integration with Project Workflow

### New Project Setup
1. Copy relevant scaffolding templates
2. Substitute variables using provided guide
3. Customize configurations for specific needs
4. Validate setup with `npm run test` or equivalent

### Operational Procedures
1. Use operational templates for consistency
2. Follow established formats for documentation
3. Reference templates in runbooks and procedures
4. Update templates based on operational feedback

### Maintenance
- Review templates quarterly for relevance and accuracy
- Update dependency versions in scaffolding templates
- Gather feedback from operational teams
- Version control template changes with clear commit messages

## Troubleshooting

### Common Issues

**Variable substitution errors:**
- Ensure all `{{VARIABLE}}` placeholders are replaced
- Check for typos in variable names
- Verify boolean values are lowercase (true/false)

**Template not found:**
- Verify file exists in `templates/` directory
- Check spelling and case sensitivity
- Ensure you're using the correct template name

**Configuration errors:**
- Validate JSON syntax for .json templates
- Check file paths and directory structure
- Verify environment variable format

### Getting Help
- Check project documentation in `docs/`
- Review existing implementations for examples
- Consult team leads for operational template guidance
- Update this README if you discover new patterns

## References

### Related Documentation
- [CLAUDE.md](../CLAUDE.md) - Project instructions and status report usage
- [Architecture Documentation](../docs/explanations/architecture.md)
- [Engineering Specifications](../docs/explanations/engineering.md)

### Operational Integration
- Status reports: Referenced in CLAUDE.md for task completion
- Grafana dashboards: Used in monitoring runbooks
- Migration planning: Referenced in CHANGELOG.md as "gold standard"
- Runbook procedures: Integrated with operational documentation

### Template Usage Examples
See the following for real usage examples:
- `status/` directory for status report implementations
- `docs/runbooks/` for runbook implementations  
- Production Grafana for dashboard implementations
- Project history for migration plan usage

---

**Last Updated**: 2025-01-26  
**Template Count**: 8 (4 scaffolding + 4 operational)  
**Maintained By**: Development Team