// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5000',
    trace: 'on-first-retry',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm start', // run your Express server
    port: 5000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  outputDir: './test-results',
  logLevel: 'info',
  logger: {
    isEnabled: (name, severity) => true,
    log: (name, severity, message, args) => {
      const logDir = path.join(__dirname, 'test-logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
      }
      const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);
      const logMessage = `[${new Date().toISOString()}] [${severity}] ${name}: ${message}\n`;
      fs.appendFileSync(logFile, logMessage);
    }
  }
});
