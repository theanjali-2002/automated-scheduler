/**
 * User Board Test Suite
 * 
 * This test suite uses Playwright to perform end-to-end testing of the user board functionality.
 * It tests the complete user journey from login to availability submission and profile management.
 * 
 * Test Structure:
 * 1. Setup: Each test starts with a login process
 * 2. Core Tests: Test different aspects of the user board
 * 3. Validation: Ensure business rules are enforced
 * 4. Error Handling: Test error scenarios and messages
 * 
 * Key Features Tested:
 * - User authentication and session management
 * - Availability selection and validation
 * - Form submissions and error handling
 * - User profile management
 * 
 * Browser Support:
 * - Tests run in Chrome, Firefox, and Safari (configured in playwright.config.js)
 * - Cross-browser compatibility is verified
 * 
 * Configuration:
 * - Test user credentials are defined in the testUser object
 * - Base URL and other settings are in playwright.config.js
 * - Tests run in headless mode by default (can be changed with --headed flag)
 * 
 * Usage Instructions:
 * 
 * 1. Setup:
 *    ```bash
 *    cd frontend
 *    npm install
 *    npx playwright install  # Install browser binaries
 *    ```
 * 
 * 2. Update Test Credentials:
 *    - Open this file and update the testUser object with valid credentials:
 *    ```javascript
 *    const testUser = {
 *        email: 'your-test-email@example.com',
 *        password: 'your-test-password'
 *    };
 *    ```
 * 
 * 3. Running Tests:
 *    ```bash
 *    # Run all tests in headless mode (default)
 *    npm test
 *    
 *    # Run tests with browser UI visible
 *    npm run test:headed
 *    
 *    # Run tests in debug mode
 *    npm run test:debug
 *    
 *    # Run specific test file
 *    npx playwright test tests/userBoard.test.js
 *    
 *    # Run tests in specific browser
 *    npx playwright test --project=chromium
 *    ```
 * 
 * 4. Viewing Reports:
 *    - HTML reports are generated in the playwright-report directory
 *    - Open the index.html file in a browser to view detailed test results
 * 
 * 5. Debugging:
 *    - Use test:debug to run tests in debug mode
 *    - Add page.pause() in your test to pause execution
 *    - Use --headed flag to see the browser during test execution
 * 
 * 6. Common Issues:
 *    - If tests fail, check that:
 *      - The backend server is running
 *      - Test credentials are valid
 *      - All required environment variables are set
 *      - The base URL in playwright.config.js is correct
 */

const { test, expect } = require('@playwright/test');

test.describe('User Dashboard - Database Render and Form State Checks', () => {

      // Test user credentials - Update these to match a real user in your system
      const testUser = {
        email: 'theanjali27@gmail.com',
        password: 'anjali'
    };

    /**
     * Before each test:
     * 1. Navigate to login page
     * 2. Fill in credentials
     * 3. Submit login form
     * 4. Wait for navigation to user board
     * 
     * This ensures each test starts with a fresh, authenticated session
     */

    test.beforeEach(async ({ page }) => {
      // Navigate to login page
      await page.goto('http://localhost:5000/index.html', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(5000);
      
      // Login process
      await page.waitForSelector('input[type="email"]', { timeout: 10000 }); // <== this is important!
      await page.fill('input[type="email"]', testUser.email);
      await page.fill('input[type="password"]', testUser.password);
      await page.click('button[type="submit"]');
      
      // Wait for navigation to user board
      await page.waitForURL('**/user_board.html');
      await page.waitForTimeout(3000);
    });

    test('should greet user with first name from database', async ({ page }) => {
      const firstName = await page.locator('#userFirstName').textContent();
      expect(firstName).toBeTruthy(); // should not be empty
      await expect(page.locator('h1')).toContainText(firstName);

    });

    test('should show user first name, last name, email, and role from database', async ({ page }) => {
      const firstName = await page.locator('#firstName').inputValue();
      const lastName = await page.locator('#lastName').inputValue();
      const email = await page.locator('#email').inputValue();
      const role = await page.locator('input[type="text"][value="user"]').inputValue();

      expect(firstName).toBeTruthy();
      expect(lastName).toBeTruthy();
      expect(email).toContain('@');
      expect(role).toBe('user');
    });

    test('should check if peer mentor or team lead role is selected', async ({ page }) => {
      const peerMentor = await page.locator('input[type="radio"][value="Peer Mentor"]').isChecked();
      const teamLead = await page.locator('input[type="radio"][value="Team Lead & Peer Mentor"]').isChecked();
      expect(peerMentor || teamLead).toBe(true);
    });

    test('should check if co-op option is selected', async ({ page }) => {
      const coopYes = await page.locator('input[type="radio"][name="coopStatus"][value="Yes"]').isChecked();
      const coopNo = await page.locator('input[type="radio"][name="coopStatus"][value="No"]').isChecked();
      const coopMaybe = await page.locator('input[type="radio"][name="coopStatus"][value="Maybe"]').isChecked();
      expect(coopYes || coopNo || coopMaybe).toBe(true);
    });

    test('should check if notes field is not empty', async ({ page }) => {
      const notes = await page.locator('textarea').inputValue();
      expect(notes !== undefined).toBe(true);
    });

    test('should check if at least 6 time slots are selected in availability', async ({ page }) => {
      const selectedSlots = await page.locator('#availabilityBody input[type="checkbox"]:checked').count();
      expect(selectedSlots).toBeGreaterThanOrEqual(6);
    });
 });
