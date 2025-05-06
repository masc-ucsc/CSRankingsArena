/**
 * Global setup for Jest tests
 * This file runs once before all test suites
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

module.exports = async () => {
  console.log('Starting global test setup...');

  // Create test env file if it doesn't exist
  const envTestPath = path.join(__dirname, '.env.test');
  if (!fs.existsSync(envTestPath)) {
    console.log('Creating .env.test file...');
    const testEnvContent = `
# Test environment variables
NODE_ENV=test
PORT=5001
MONGODB_URI_TEST=mongodb://localhost:27017/paper_evaluation_test
JWT_SECRET=test-secret-key
    `;
    fs.writeFileSync(envTestPath, testEnvContent);
  }

  // Create __mocks__ directory and files if they don't exist
  const mocksDir = path.join(__dirname, '__mocks__');
  if (!fs.existsSync(mocksDir)) {
    fs.mkdirSync(mocksDir);

    // Create file mock
    fs.writeFileSync(
      path.join(mocksDir, 'fileMock.js'),
      'module.exports = "test-file-stub";'
    );

    // Create style mock
    fs.writeFileSync(
      path.join(mocksDir, 'styleMock.js'),
      'module.exports = {};'
    );
  }

  // Install Python dependencies for agent tests if needed
  if (process.env.INSTALL_PYTHON_DEPS) {
    console.log('Installing Python dependencies for agent tests...');
    return new Promise((resolve, reject) => {
      const pip = spawn('pip', ['install', '-r', 'agents/requirements.txt']);
      
      pip.stdout.on('data', (data) => {
        console.log(`pip stdout: ${data}`);
      });
      
      pip.stderr.on('data', (data) => {
        console.error(`pip stderr: ${data}`);
      });
      
      pip.on('close', (code) => {
        if (code !== 0) {
          console.error(`pip process exited with code ${code}`);
          reject(new Error(`pip failed with code ${code}`));
        } else {
          console.log('Python dependencies installed successfully');
          resolve();
        }
      });
    });
  }

  // Initialize test directories if needed
  const dirs = [
    path.join(__dirname, 'coverage'),
    path.join(__dirname, 'backend/tests'),
    path.join(__dirname, 'frontend/src/tests'),
    path.join(__dirname, 'agents/tests'),
    path.join(__dirname, 'tests')
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  console.log('Global test setup completed.');
};