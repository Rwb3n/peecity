#!/usr/bin/env ts-node

/**
 * Barrel Export Coverage Audit Script
 * 
 * @epic architecture_optimization_epic
 * @task import_statement_migration_phase0
 * @tdd-phase AUDIT
 * 
 * Analyzes @/lib barrel export coverage against current import usage.
 * Implements enhanced BarrelAudit interface from skeptic validation.
 */

import * as fs from 'fs';
import * as path from 'path';

interface BarrelAudit {
  currentImports: string[];           // All relative imports found
  availableExports: string[];         // @/lib barrel exports  
  missingExports: string[];           // Imports without barrel exports
  conflictingNames: string[];         // Naming conflicts to resolve
  migrationFeasibility: number;       // Percentage of imports that can migrate
  typeConflicts: string[];           // Types that exist in both src/types and lib/types
  missingCriticalTypes: string[];    // High-frequency imports not in barrel
  circularDependencyRisks: string[]; // Imports that could create cycles
}

interface ImportClassification {
  framework: string[];                // Next.js, React - always preserve
  utilities: string[];                // src/utils/* - case-by-case
  library: string[];                  // src/lib/* - always migrate
  external: string[];                 // npm packages - always preserve
  circular_risk: string[];            // Cannot migrate due to circular deps
  missing_barrel: string[];           // Need barrel export additions first
  conflict_resolution: string[];      // Require name changes
}

interface ImportInventory {
  totalImports: number;
  relativeImports: ImportStatement[];
  classification: ImportClassification;
  complexityMetrics: {
    averagePathLength: number;
    filesWithComplexImports: number;
    maxImportsPerFile: number;
  };
}

interface ImportStatement {
  file: string;
  line: number;
  importPath: string;
  importedNames: string[];
  importType: 'named' | 'namespace' | 'default' | 'type-only';
  pathComplexity: number; // number of ../
}

class BarrelCoverageAuditor {
  private srcDir = path.join(process.cwd(), 'src');
  private libIndexPath = path.join(this.srcDir, 'lib', 'index.ts');
  private typesIndexPath = path.join(this.srcDir, 'lib', 'types', 'index.ts');

  async auditBarrelCoverage(): Promise<BarrelAudit> {
    console.log('🔍 Starting barrel export coverage audit...\n');

    const availableExports = await this.getAvailableBarrelExports();
    const currentImports = await this.getCurrentImports();
    const typeConflicts = await this.detectTypeConflicts();
    const circularRisks = await this.detectCircularDependencyRisks();

    const missingExports = currentImports.filter(imp => !availableExports.includes(imp));
    const missingCriticalTypes = this.identifyCriticalMissingTypes(missingExports);
    const conflictingNames = this.identifyNamingConflicts(currentImports, availableExports);

    const migrationFeasibility = ((currentImports.length - missingExports.length - circularRisks.length) / currentImports.length) * 100;

    const audit: BarrelAudit = {
      currentImports,
      availableExports,
      missingExports,
      conflictingNames,
      migrationFeasibility: Math.round(migrationFeasibility * 100) / 100,
      typeConflicts,
      missingCriticalTypes,
      circularDependencyRisks: circularRisks
    };

    this.printAuditResults(audit);
    return audit;
  }

  private async getAvailableBarrelExports(): Promise<string[]> {
    const exports: string[] = [];

    // Parse lib/index.ts exports
    if (fs.existsSync(this.libIndexPath)) {
      const libContent = fs.readFileSync(this.libIndexPath, 'utf-8');
      const exportMatches = libContent.match(/export\s+(?:type\s+)?\{\s*([^}]+)\s*\}/g) || [];
      
      exportMatches.forEach(match => {
        const namesMatch = match.match(/\{\s*([^}]+)\s*\}/);
        if (namesMatch) {
          const names = namesMatch[1]
            .split(',')
            .map(name => name.trim().replace(/^type\s+/, ''))
            .filter(name => name && !name.includes('//'));
          exports.push(...names);
        }
      });

      // Also get type re-exports
      const typeExportMatches = libContent.match(/export type \{[^}]+\}/g) || [];
      typeExportMatches.forEach(match => {
        const namesMatch = match.match(/\{\s*([^}]+)\s*\}/);
        if (namesMatch) {
          const names = namesMatch[1]
            .split(',')
            .map(name => name.trim())
            .filter(name => name && !name.includes('//'));
          exports.push(...names);
        }
      });
    }

    return Array.from(new Set(exports));
  }

  private async getCurrentImports(): Promise<string[]> {
    const imports: string[] = [];
    const tsFiles = this.findTsFiles('src');

    for (const file of tsFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const importMatches = content.match(/import\s+(?:type\s+)?\{([^}]+)\}/g) || [];
      
      importMatches.forEach(match => {
        const namesMatch = match.match(/\{([^}]+)\}/);
        if (namesMatch) {
          const names = namesMatch[1]
            .split(',')
            .map(name => name.trim().split(' as ')[0].trim())
            .filter(name => name && !name.includes('//'));
          imports.push(...names);
        }
      });
    }

    return Array.from(new Set(imports));
  }

  private findTsFiles(dir: string): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...this.findTsFiles(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) && 
                 !entry.name.includes('.test.') && !entry.name.includes('.spec.')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private async detectTypeConflicts(): Promise<string[]> {
    const conflicts: string[] = [];
    
    // Check for types that exist in both src/types and lib/types
    const typesDir = path.join(this.srcDir, 'types');
    const libTypesDir = path.join(this.srcDir, 'lib', 'types');
    
    if (fs.existsSync(typesDir) && fs.existsSync(libTypesDir)) {
      const srcTypes = this.extractTypesFromDirectory(typesDir);
      const libTypes = this.extractTypesFromDirectory(libTypesDir);
      
      conflicts.push(...srcTypes.filter(type => libTypes.includes(type)));
    }

    return conflicts;
  }

  private async detectCircularDependencyRisks(): Promise<string[]> {
    const risks: string[] = [];
    const libFiles = this.findTsFiles('src/lib');

    for (const file of libFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const typeImports = content.match(/from ['"]\.\.\/\.\.\/types\/[^'"]+['"]/g) || [];
      
      if (typeImports.length > 0) {
        const relativePath = path.relative(this.srcDir, file);
        risks.push(`${relativePath}: ${typeImports.length} type imports`);
      }
    }

    return risks;
  }

  private extractTypesFromDirectory(dir: string): string[] {
    const types: string[] = [];
    
    if (!fs.existsSync(dir)) return types;

    const files = this.findTsFiles(dir);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const typeMatches = content.match(/(?:export\s+(?:interface|type|enum|class)\s+)(\w+)/g) || [];
      
      typeMatches.forEach(match => {
        const nameMatch = match.match(/(?:interface|type|enum|class)\s+(\w+)/);
        if (nameMatch) {
          types.push(nameMatch[1]);
        }
      });
    }

    return types;
  }

  private identifyCriticalMissingTypes(missingExports: string[]): string[] {
    // Types that are imported frequently but missing from barrel
    const criticalTypes = [
      'SuggestionValidation',
      'ValidationError', 
      'ValidationWarning',
      'CacheEntry',
      'ProcessedSuggestion'
    ];

    return missingExports.filter(exp => criticalTypes.includes(exp));
  }

  private identifyNamingConflicts(currentImports: string[], availableExports: string[]): string[] {
    const conflicts: string[] = [];
    
    // Known conflicts from skeptic analysis
    const knownConflicts = {
      'CacheEntry': 'GenericCacheEntry',
      'ValidationError': 'Multiple definitions detected'
    };

    for (const [oldName, newName] of Object.entries(knownConflicts)) {
      if (currentImports.includes(oldName)) {
        conflicts.push(`${oldName} → ${newName}`);
      }
    }

    return conflicts;
  }

  private printAuditResults(audit: BarrelAudit): void {
    console.log('📊 BARREL EXPORT COVERAGE AUDIT RESULTS');
    console.log('========================================\n');

    console.log(`📈 Migration Feasibility: ${audit.migrationFeasibility}%`);
    console.log(`📦 Available Barrel Exports: ${audit.availableExports.length}`);
    console.log(`🔗 Current Imports Found: ${audit.currentImports.length}`);
    console.log(`❌ Missing from Barrel: ${audit.missingExports.length}`);
    console.log(`⚠️  Naming Conflicts: ${audit.conflictingNames.length}`);
    console.log(`🔄 Circular Dependency Risks: ${audit.circularDependencyRisks.length}\n`);

    if (audit.missingCriticalTypes.length > 0) {
      console.log('🚨 CRITICAL MISSING TYPES:');
      audit.missingCriticalTypes.forEach(type => console.log(`   - ${type}`));
      console.log();
    }

    if (audit.conflictingNames.length > 0) {
      console.log('⚠️  NAMING CONFLICTS TO RESOLVE:');
      audit.conflictingNames.forEach(conflict => console.log(`   - ${conflict}`));
      console.log();
    }

    if (audit.circularDependencyRisks.length > 0) {
      console.log('🔄 CIRCULAR DEPENDENCY RISKS:');
      audit.circularDependencyRisks.forEach(risk => console.log(`   - ${risk}`));
      console.log();
    }

    if (audit.typeConflicts.length > 0) {
      console.log('🔗 TYPE CONFLICTS (src/types vs lib/types):');
      audit.typeConflicts.forEach(conflict => console.log(`   - ${conflict}`));
      console.log();
    }

    console.log('📋 RECOMMENDATION:');
    if (audit.migrationFeasibility >= 70) {
      console.log('✅ Migration is FEASIBLE - proceed with automated migration');
    } else if (audit.migrationFeasibility >= 50) {
      console.log('⚠️  Migration has MEDIUM risk - address missing exports first');  
    } else {
      console.log('❌ Migration has HIGH risk - extensive manual work required');
    }
  }
}

// Execute audit if run directly
if (require.main === module) {
  const auditor = new BarrelCoverageAuditor();
  auditor.auditBarrelCoverage()
    .then(() => {
      console.log('\n✅ Audit completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Audit failed:', error);
      process.exit(1);
    });
}

export { BarrelCoverageAuditor };