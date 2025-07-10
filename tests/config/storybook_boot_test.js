/**
 * @file tests/config/storybook_boot_test.js
 * @description Smoke test to verify Storybook dev server can boot successfully after v8 downgrade
 * 
 * Context:
 * - This test is part of plan_downgrade_storybook_0036
 * - It launches Storybook dev server and checks for successful startup
 * - Uses child_process to spawn the server and monitors stdout
 */

const { spawn } = require('child_process');
const path = require('path');

describe('Storybook Dev Server Boot Test', () => {
  test('storybook dev server should start successfully', (done) => {
    // Set test timeout to 60 seconds
    jest.setTimeout(60000);
    
    const projectRoot = path.join(__dirname, '..', '..');
    let storybookProcess;
    let stdout = '';
    let stderr = '';
    let serverStarted = false;
    
    try {
      // Spawn storybook dev process
      storybookProcess = spawn('npm', ['run', 'storybook'], {
        cwd: projectRoot,
        env: { ...process.env, CI: 'true' },
        shell: true
      });
      
      // Capture stdout
      storybookProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log('Storybook stdout:', data.toString());
        
        // Check for success messages
        if (stdout.includes('Storybook') && 
            (stdout.includes('started') || 
             stdout.includes('Server started') ||
             stdout.includes('Local:') ||
             stdout.includes('6006'))) {
          serverStarted = true;
          cleanup();
        }
      });
      
      // Capture stderr
      storybookProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error('Storybook stderr:', data.toString());
      });
      
      // Handle process exit
      storybookProcess.on('exit', (code) => {
        if (!serverStarted) {
          cleanup(`Storybook process exited with code ${code}. Stderr: ${stderr}`);
        }
      });
      
      // Handle process error
      storybookProcess.on('error', (err) => {
        cleanup(`Failed to start Storybook process: ${err.message}`);
      });
      
      // Set timeout to check if server started
      const timeout = setTimeout(() => {
        cleanup('Storybook server did not start within 45 seconds');
      }, 45000);
      
      // Cleanup function
      function cleanup(error) {
        clearTimeout(timeout);
        
        // Kill the process if it's still running
        if (storybookProcess && !storybookProcess.killed) {
          storybookProcess.kill('SIGTERM');
          // Force kill if necessary after 2 seconds
          setTimeout(() => {
            if (!storybookProcess.killed) {
              storybookProcess.kill('SIGKILL');
            }
          }, 2000);
        }
        
        if (error) {
          done(new Error(error));
        } else if (serverStarted) {
          done();
        }
      }
      
    } catch (error) {
      if (storybookProcess && !storybookProcess.killed) {
        storybookProcess.kill('SIGKILL');
      }
      done(error);
    }
  });
});