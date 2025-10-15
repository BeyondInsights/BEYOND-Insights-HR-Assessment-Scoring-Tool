import { test, expect } from '@playwright/test';

test.describe('Authorization Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should complete authorization successfully', async ({ page }) => {
    await page.goto('/authorization');

    // Fill out authorization form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[placeholder*="First"]', 'John');
    await page.fill('input[placeholder*="Last"]', 'Doe');
    await page.fill('input[placeholder*="Company"]', 'Test Company Inc');

    // Submit
    await page.click('button:has-text("Continue")');

    // Should redirect to payment
    await expect(page).toHaveURL(/\/payment/);

    // Verify localStorage
    const authCompleted = await page.evaluate(() => localStorage.getItem('auth_completed'));
    expect(authCompleted).toBe('true');

    const email = await page.evaluate(() => localStorage.getItem('auth_email'));
    expect(email).toBe('test@example.com');
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/authorization');

    // Try to submit without filling
    await page.click('button:has-text("Continue")');

    // Should show error or stay on page
    await expect(page).toHaveURL(/\/authorization/);
  });
});
