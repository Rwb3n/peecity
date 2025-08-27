#!/usr/bin/env ts-node

/**
 * Automated Import Migration Tool
 * 
 * @epic architecture_optimization_epic
 * @task import_statement_migration_phase1
 * @tdd-phase IMPLEMENTATION
 * 
 * TypeScript-aware import transformation using ts-morph.
 * Migrates relative imports to @/lib barrel exports based on Phase 0 audit findings.
 */

import { Project, SourceFile, ImportDeclaration, SyntaxKind, Node } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

interface ImportStatement {
  file: string;
  line: number;
  importPath: string;
  importedNames: string[];
  importType: 'named' | 'namespace' | 'default' | 'type-only';
  pathComplexity: number; // number of ../
}

interface ImportCategories {
  framework: ImportStatement[];        // Next.js, React - always preserve
  utilities: ImportStatement[];        // src/utils/* - case-by-case
  library: ImportStatement[];          // src/lib/* - always migrate
  external: ImportStatement[];         // npm packages - always preserve
  circular_risk: ImportStatement[];    // Cannot migrate due to circular deps
  missing_barrel: ImportStatement[];   // Need barrel export additions first
  conflict_resolution: ImportStatement[]; // Require name changes
}

interface TransformResult {
  success: boolean;
  transformed: number;
  skipped: number;
  errors: string[];
  conflictsDetected: string[];
  dryRunResults?: string[];
}

interface ValidationResult {
  compilationSuccess: boolean;
  importErrors: string[];
  circularDependencies: string[];
  suggestions: string[];
}

class ImportMigration {
  private project: Project;
  private dryRun: boolean;
  private barrelExports: Set<string>;
  private srcDir: string;

  constructor(dryRun: boolean = true) {
    this.project = new Project({
      tsConfigFilePath: "tsconfig.json"
    });
    this.dryRun = dryRun;
    this.barrelExports = new Set();
    this.srcDir = path.join(process.cwd(), 'src');
    
    console.log(`🔧 Import Migration Tool initialized (${dryRun ? 'DRY RUN' : 'LIVE MODE'})`);
  }

  async initialize(): Promise<void> {
    await this.loadBarrelExports();
    console.log(`📦 Loaded ${this.barrelExports.size} barrel exports from @/lib`);
  }

  private async loadBarrelExports(): Promise<void> {
    try {
      const libIndexPath = path.join(this.srcDir, 'lib', 'index.ts');
      if (fs.existsSync(libIndexPath)) {
        const content = fs.readFileSync(libIndexPath, 'utf-8');
        
        // Extract named exports from export { ... } statements
        const namedExportMatches = content.match(/export\s+\{\s*([^}]+)\s*\}/g) || [];
        namedExportMatches.forEach(match => {
          const namesMatch = match.match(/\{\s*([^}]+)\s*\}/);
          if (namesMatch) {
            const names = namesMatch[1]
              .split(',')
              .map(name => name.trim().replace(/^type\s+/, ''))
              .filter(name => name && !name.includes('//'));
            names.forEach(name => this.barrelExports.add(name));
          }
        });

        // Extract type re-exports from export type { ... } statements
        const typeExportMatches = content.match(/export\s+type\s+\{\s*([^}]+)\s*\}/g) || [];
        typeExportMatches.forEach(match => {
          const namesMatch = match.match(/\{\s*([^}]+)\s*\}/);
          if (namesMatch) {
            const names = namesMatch[1]
              .split(',')
              .map(name => name.trim())
              .filter(name => name && !name.includes('//'));
            names.forEach(name => this.barrelExports.add(name));
          }
        });
      }
    } catch (error) {
      console.error('❌ Error loading barrel exports:', error);
    }
  }

  findImports(): ImportStatement[] {
    const imports: ImportStatement[] = [];
    const sourceFiles = this.project.getSourceFiles('src/**/*.{ts,tsx}');

    for (const sourceFile of sourceFiles) {
      const filePath = path.relative(process.cwd(), sourceFile.getFilePath());
      
      // Skip test files
      if (filePath.includes('.test.') || filePath.includes('.spec.')) {
        continue;
      }

      const importDeclarations = sourceFile.getImportDeclarations();
      
      for (const importDecl of importDeclarations) {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
        
        // Only process relative imports
        if (moduleSpecifier.startsWith('.')) {
          const importedNames = this.extractImportedNames(importDecl);
          const pathComplexity = (moduleSpecifier.match(/\.\.\//g) || []).length;
          
          imports.push({
            file: filePath,
            line: importDecl.getStartLineNumber(),
            importPath: moduleSpecifier,
            importedNames,
            importType: this.getImportType(importDecl),
            pathComplexity
          });
        }
      }
    }

    return imports;
  }

  private extractImportedNames(importDecl: ImportDeclaration): string[] {
    const names: string[] = [];
    
    // Named imports
    const namedImports = importDecl.getNamedImports();
    namedImports.forEach(namedImport => {
      names.push(namedImport.getName());
    });

    // Default import
    const defaultImport = importDecl.getDefaultImport();
    if (defaultImport) {
      names.push(defaultImport.getText());
    }

    // Namespace import
    const namespaceImport = importDecl.getNamespaceImport();
    if (namespaceImport) {
      names.push(`* as ${namespaceImport.getText()}`);
    }

    return names;
  }

  private getImportType(importDecl: ImportDeclaration): 'named' | 'namespace' | 'default' | 'type-only' {
    if (importDecl.isTypeOnly()) {
      return 'type-only';
    }
    if (importDecl.getNamespaceImport()) {
      return 'namespace';
    }
    if (importDecl.getDefaultImport()) {
      return 'default';
    }
    return 'named';
  }

  categorizeImports(imports: ImportStatement[]): ImportCategories {
    const categories: ImportCategories = {
      framework: [],
      utilities: [],
      library: [],
      external: [],
      circular_risk: [],
      missing_barrel: [],
      conflict_resolution: []
    };

    for (const imp of imports) {
      // Framework imports (Next.js, React) - always preserve
      if (this.isFrameworkImport(imp.importPath)) {
        categories.framework.push(imp);
        continue;
      }

      // External packages - always preserve  
      if (!imp.importPath.startsWith('.')) {
        categories.external.push(imp);
        continue;
      }

      // Circular dependency risks - preserve to avoid cycles
      if (this.hasCircularRisk(imp)) {
        categories.circular_risk.push(imp);
        continue;
      }

      // Utility imports - case-by-case evaluation
      if (this.isUtilityImport(imp.importPath)) {
        categories.utilities.push(imp);
        continue;
      }

      // Library imports - check barrel availability
      if (this.isLibraryImport(imp.importPath)) {
        const missingNames = imp.importedNames.filter(name => !this.barrelExports.has(name));
        if (missingNames.length > 0) {
          categories.missing_barrel.push(imp);
        } else {
          categories.library.push(imp);
        }
        continue;
      }

      // Check if available in barrel exports
      const availableNames = imp.importedNames.filter(name => this.barrelExports.has(name));
      if (availableNames.length > 0) {
        categories.library.push(imp);
      } else {
        categories.missing_barrel.push(imp);
      }
    }

    return categories;
  }

  private isFrameworkImport(importPath: string): boolean {
    return importPath.includes('next/') || 
           importPath.includes('react') ||
           importPath.includes('node_modules');
  }

  private isUtilityImport(importPath: string): boolean {
    return importPath.includes('../utils/') || 
           importPath.includes('./utils/') ||
           importPath.includes('utils/');
  }

  private isLibraryImport(importPath: string): boolean {
    return importPath.includes('../lib/') || 
           importPath.includes('./lib/') ||
           importPath.includes('lib/') ||
           importPath.includes('../types/') ||
           importPath.includes('./types/') ||
           importPath.includes('types/') ||
           importPath.includes('../interfaces/') ||
           importPath.includes('./interfaces/') ||
           importPath.includes('interfaces/');
  }

  private hasCircularRisk(imp: ImportStatement): boolean {
    // Files in lib/ importing from types/ create circular dependency risk
    if (imp.file.includes('src/lib/') && imp.importPath.includes('../../types/')) {
      return true;
    }
    
    // Other known circular patterns from audit
    return false;
  }

  checkBarrelAvailability(importName: string): boolean {
    return this.barrelExports.has(importName);
  }

  detectNamingConflicts(imports: ImportStatement[]): string[] {
    const conflicts: string[] = [];
    
    for (const imp of imports) {
      for (const name of imp.importedNames) {
        // Known conflicts from Phase 0 audit
        if (name === 'ValidationError' && imp.importPath.includes('types/suggestions')) {
          conflicts.push(`${imp.file}:${imp.line} - ValidationError should be SuggestionValidationError`);
        }
        if (name === 'CacheEntry' && !this.barrelExports.has('GenericCacheEntry')) {
          conflicts.push(`${imp.file}:${imp.line} - CacheEntry should be GenericCacheEntry`);
        }
      }
    }

    return conflicts;
  }

  transformToBarrelImports(imports: ImportStatement[]): TransformResult {
    const result: TransformResult = {
      success: true,
      transformed: 0,
      skipped: 0,
      errors: [],
      conflictsDetected: [],
      dryRunResults: this.dryRun ? [] : undefined
    };

    const categories = this.categorizeImports(imports);
    
    console.log('📊 Import Classification Results:');
    console.log(`   Framework: ${categories.framework.length} (preserved)`);
    console.log(`   Utilities: ${categories.utilities.length} (case-by-case)`);
    console.log(`   Library: ${categories.library.length} (migrate to @/lib)`);
    console.log(`   External: ${categories.external.length} (preserved)`);
    console.log(`   Circular Risk: ${categories.circular_risk.length} (preserved)`);
    console.log(`   Missing Barrel: ${categories.missing_barrel.length} (need additions)`);

    // Transform library imports to barrel exports
    for (const imp of categories.library) {
      try {
        if (this.dryRun) {
          const transformation = this.generateTransformation(imp);
          result.dryRunResults?.push(transformation);
          result.transformed++;
        } else {
          this.applyTransformation(imp);
          result.transformed++;
        }
      } catch (error) {
        result.errors.push(`${imp.file}:${imp.line} - ${error}`);
        result.success = false;
      }
    }

    // Report skipped imports
    result.skipped = categories.framework.length + 
                    categories.utilities.length + 
                    categories.external.length + 
                    categories.circular_risk.length + 
                    categories.missing_barrel.length;

    return result;
  }

  private generateTransformation(imp: ImportStatement): string {
    const availableNames = imp.importedNames.filter(name => this.barrelExports.has(name));
    const typePrefix = imp.importType === 'type-only' ? 'type ' : '';
    
    return `${imp.file}:${imp.line}
  FROM: import ${typePrefix}{ ${imp.importedNames.join(', ')} } from '${imp.importPath}';
  TO:   import ${typePrefix}{ ${availableNames.join(', ')} } from '@/lib';`;
  }

  private applyTransformation(imp: ImportStatement): void {
    const sourceFile = this.project.getSourceFile(imp.file);
    if (!sourceFile) {
      throw new Error(`Source file not found: ${imp.file}`);
    }

    const importDeclarations = sourceFile.getImportDeclarations();
    const targetImport = importDeclarations.find(decl => 
      decl.getModuleSpecifierValue() === imp.importPath &&
      decl.getStartLineNumber() === imp.line
    );

    if (!targetImport) {
      throw new Error(`Import declaration not found at line ${imp.line}`);
    }

    // Get available names that can be migrated
    const availableNames = imp.importedNames.filter(name => this.barrelExports.has(name));
    
    if (availableNames.length === 0) {
      throw new Error('No imports available in barrel exports');
    }

    // Create new import with barrel path
    const typePrefix = imp.importType === 'type-only' ? 'type ' : '';
    const newImportText = `import ${typePrefix}{ ${availableNames.join(', ')} } from '@/lib';`;
    
    // Replace the import
    targetImport.replaceWithText(newImportText);
  }

  validateTransformation(): ValidationResult {
    const result: ValidationResult = {
      compilationSuccess: false,
      importErrors: [],
      circularDependencies: [],
      suggestions: []
    };

    try {
      // Check for TypeScript diagnostics
      const diagnostics = this.project.getPreEmitDiagnostics();
      
      result.compilationSuccess = diagnostics.length === 0;
      
      diagnostics.forEach(diagnostic => {
        const message = diagnostic.getMessageText();
        if (typeof message === 'string') {
          if (message.includes('Cannot find module') || message.includes('Module not found')) {
            result.importErrors.push(message);
          } else if (message.includes('Circular dependency')) {
            result.circularDependencies.push(message);
          }
        }
      });

      if (result.compilationSuccess) {
        result.suggestions.push('✅ All transformations successful');
      } else {
        result.suggestions.push('⚠️ Review compilation errors before proceeding');
      }

    } catch (error) {
      result.importErrors.push(`Validation error: ${error}`);
    }

    return result;
  }

  generateReport(transformResult: TransformResult): string {
    const report = [];
    
    report.push('📋 IMPORT MIGRATION REPORT');
    report.push('========================');
    report.push('');
    report.push(`Mode: ${this.dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
    report.push(`Barrel exports available: ${this.barrelExports.size}`);
    report.push(`Imports transformed: ${transformResult.transformed}`);
    report.push(`Imports skipped: ${transformResult.skipped}`);
    report.push(`Errors encountered: ${transformResult.errors.length}`);
    report.push('');

    if (transformResult.dryRunResults && transformResult.dryRunResults.length > 0) {
      report.push('🔄 PLANNED TRANSFORMATIONS:');
      report.push('');
      transformResult.dryRunResults.forEach(transformation => {
        report.push(transformation);
        report.push('');
      });
    }

    if (transformResult.errors.length > 0) {
      report.push('❌ ERRORS:');
      transformResult.errors.forEach(error => {
        report.push(`   ${error}`);
      });
      report.push('');
    }

    if (transformResult.conflictsDetected.length > 0) {
      report.push('⚠️ CONFLICTS DETECTED:');
      transformResult.conflictsDetected.forEach(conflict => {
        report.push(`   ${conflict}`);
      });
      report.push('');
    }

    return report.join('\n');
  }

  async saveProject(): Promise<void> {
    if (!this.dryRun) {
      await this.project.save();
      console.log('💾 Project saved with transformations applied');
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');
  const verbose = args.includes('--verbose');

  console.log('🚀 Starting Import Migration Tool...\n');

  try {
    const migration = new ImportMigration(dryRun);
    await migration.initialize();

    console.log('🔍 Analyzing imports...');
    const imports = migration.findImports();
    console.log(`Found ${imports.length} relative imports to analyze\n`);

    if (verbose) {
      console.log('📄 Import Analysis:');
      imports.forEach(imp => {
        console.log(`   ${imp.file}:${imp.line} - ${imp.importPath} (${imp.importedNames.join(', ')})`);
      });
      console.log('');
    }

    console.log('🔄 Transforming imports...');
    const transformResult = migration.transformToBarrelImports(imports);

    console.log('\n' + migration.generateReport(transformResult));

    if (!dryRun) {
      console.log('🔧 Validating transformations...');
      const validationResult = migration.validateTransformation();
      
      console.log('📊 Validation Results:');
      console.log(`   Compilation: ${validationResult.compilationSuccess ? '✅ Success' : '❌ Failed'}`);
      console.log(`   Import errors: ${validationResult.importErrors.length}`);
      console.log(`   Circular dependencies: ${validationResult.circularDependencies.length}`);

      if (validationResult.importErrors.length > 0) {
        console.log('\n❌ Import Errors:');
        validationResult.importErrors.forEach(error => console.log(`   ${error}`));
      }

      await migration.saveProject();
    }

    console.log('\n✅ Migration tool completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration tool failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

export { ImportMigration };