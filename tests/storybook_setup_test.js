/**
 * Storybook Setup Verification Tests
 * 
 * This test suite verifies that Storybook is properly configured and functional
 * with TailwindCSS integration. This is the RED phase test that should initially
 * fail because Storybook is not yet installed/configured.
 * 
 * @artifact-annotation
 * canonical-docs: docs/frontend-ui-spec.md
 * epic: frontend_ui
 * plan: plan_frontend_atoms.txt
 * task: storybook_test_create
 * tdd-phase: RED
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('Storybook Setup Verification', () => {
  const timeout = 30000; // 30 second timeout for Storybook startup

  beforeAll(() => {
    // Ensure we're in the correct directory
    expect(process.cwd()).toContain('peecity');
  });

  describe('Storybook Configuration', () => {
    test('should have Storybook configuration files', () => {
      const storybookMainPath = path.join(process.cwd(), '.storybook', 'main.ts');
      const storybookPreviewPath = path.join(process.cwd(), '.storybook', 'preview.js');
      
      expect(fs.existsSync(storybookMainPath)).toBe(true);
      expect(fs.existsSync(storybookPreviewPath)).toBe(true);
    });

    test('should have TailwindCSS tokens imported in Storybook preview', () => {
      const previewPath = path.join(process.cwd(), '.storybook', 'preview.js');
      
      if (fs.existsSync(previewPath)) {
        const previewContent = fs.readFileSync(previewPath, 'utf8');
        expect(previewContent).toMatch(/import.*globals\.css/);
        // Check that the file contains TailwindCSS related configuration
        expect(previewContent).toMatch(/className.*tailwind|TailwindCSS|tailwind/i);
      } else {
        throw new Error('.storybook/preview.js does not exist');
      }
    });

    test('should have package.json storybook script', () => {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      expect(packageJson.scripts).toHaveProperty('storybook');
      expect(packageJson.scripts.storybook).toMatch(/storybook/);
    });
  });

  describe('Storybook Process Execution', () => {
    test('should have Storybook CLI available', () => {
      const storybookCliPath = path.join(process.cwd(), 'node_modules', '@storybook', 'cli', 'bin', 'index.js');
      expect(fs.existsSync(storybookCliPath)).toBe(true);
    });

    test('should be able to validate Storybook configuration', () => {
      const mainPath = path.join(process.cwd(), '.storybook', 'main.ts');
      const previewPath = path.join(process.cwd(), '.storybook', 'preview.js');
      
      // Verify configuration files exist and have expected content
      expect(fs.existsSync(mainPath)).toBe(true);
      expect(fs.existsSync(previewPath)).toBe(true);
      
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      expect(mainContent).toMatch(/@storybook\/nextjs/);
      expect(mainContent).toMatch(/@storybook\/addon-a11y/);
      expect(mainContent).toMatch(/atoms[\s\S]*molecules[\s\S]*organisms/);
    });
  });

  describe('Storybook Dependencies', () => {
    test('should have required Storybook packages installed', () => {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      const devDependencies = packageJson.devDependencies || {};
      const dependencies = packageJson.dependencies || {};
      const allDeps = { ...dependencies, ...devDependencies };

      expect(allDeps).toHaveProperty('@storybook/nextjs');
      expect(allDeps).toHaveProperty('@storybook/addon-essentials');
      expect(allDeps).toHaveProperty('@storybook/addon-a11y');
      expect(allDeps).toHaveProperty('@storybook/addon-viewport');
    });

    test('should have Storybook version 7.x or higher', () => {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      const devDependencies = packageJson.devDependencies || {};
      const dependencies = packageJson.dependencies || {};
      const allDeps = { ...dependencies, ...devDependencies };

      if (allDeps['@storybook/nextjs']) {
        const version = allDeps['@storybook/nextjs'].replace(/[^0-9.]/g, '');
        const majorVersion = parseInt(version.split('.')[0]);
        expect(majorVersion).toBeGreaterThanOrEqual(7);
      }
    });
  });

  describe('TailwindCSS Integration', () => {
    test('should have TailwindCSS configuration', () => {
      const tailwindConfigPath = path.join(process.cwd(), 'tailwind.config.js');
      const tailwindConfigMjsPath = path.join(process.cwd(), 'tailwind.config.mjs');
      
      const hasConfig = fs.existsSync(tailwindConfigPath) || fs.existsSync(tailwindConfigMjsPath);
      expect(hasConfig).toBe(true);
    });

    test('should have globals.css with Tailwind imports', () => {
      const globalsPath = path.join(process.cwd(), 'src', 'app', 'globals.css');
      
      if (fs.existsSync(globalsPath)) {
        const globalsContent = fs.readFileSync(globalsPath, 'utf8');
        expect(globalsContent).toMatch(/@tailwind base/);
        expect(globalsContent).toMatch(/@tailwind components/);
        expect(globalsContent).toMatch(/@tailwind utilities/);
      } else {
        throw new Error('globals.css not found');
      }
    });
  });
});