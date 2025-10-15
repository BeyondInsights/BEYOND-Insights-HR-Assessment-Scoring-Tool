import { test, expect } from '@playwright/test';

test.describe('Core Sections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('auth_completed', 'true');
      localStorage.setItem('auth_email', 'test@example.com');
      localStorage.setItem('payment_completed', 'true');
      localStorage.setItem('payment_method', 'card');
    });
  });

  test('should save Company Profile data', async ({ page }) => {
    await page.goto('/survey/firmographics');

    // Fill first field
    await page.fill('input[type="number"]', '1990');

    // Wait a bit for auto-save
    await page.waitForTimeout(1000);

    // Check localStorage
    const data = await page.evaluate(() => localStorage.getItem('firmographics_data'));
    expect(data).toContain('1990');
  });

  test('should navigate through Company Profile steps', async ({ page }) => {
    await page.goto('/survey/firmographics');

    // Answer first question
    await page.fill('input[type="number"]', '1990');
    
    // Click continue
    await page.click('button:has-text("Continue")');

    // Should go to next step
    await page.waitForTimeout(500);
    
    // Check if we progressed (presence of back button)
    await expect(page.locator('button:has-text("Back")')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/survey/firmographics');

    // Try to continue without answering
    await page.click('button:has-text("Continue")');

    // Should show error or stay on page
    await expect(page.locator('text=required')).toBeVisible();
  });

  test('should track progress as questions are answered', async ({ page }) => {
    await page.goto('/survey/firmographics');

    // Answer some questions and check progress updates
    await page.fill('input[type="number"]', '1990');
    await page.click('button:has-text("Continue")');
    
    await page.waitForTimeout(500);
    
    // Go back to dashboard
    await page.goto('/dashboard');
    
    // Progress should be > 0%
    const progressText = await page.locator('text=Company Profile').locator('..').textContent();
    expect(progressText).not.toContain('0%');
  });
});
