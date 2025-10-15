import { test, expect } from '@playwright/test';

test.describe('Completion Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('auth_completed', 'true');
      localStorage.setItem('payment_completed', 'true');
      localStorage.setItem('payment_method', 'card');
      
      // Mark everything complete
      localStorage.setItem('firmographics_complete', 'true');
      localStorage.setItem('general_benefits_complete', 'true');
      localStorage.setItem('current_support_complete', 'true');
      
      for (let i = 1; i <= 13; i++) {
        localStorage.setItem(`dimension${i}_complete`, 'true');
      }
      
      localStorage.setItem('cross_dimensional_complete', 'true');
      localStorage.setItem('employee-impact-assessment_complete', 'true');
    });
  });

  test('should show completion banner on dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.locator('text=Congratulations!')).toBeVisible();
    await expect(page.locator('button:has-text("View What\'s Next")')).toBeVisible();
  });

  test('should navigate to completion page', async ({ page }) => {
    await page.goto('/dashboard');

    await page.click('button:has-text("View What\'s Next")');

    await expect(page).toHaveURL(/\/completion/);
    await expect(page.locator('text=Assessment Complete')).toBeVisible();
  });

  test('should allow file upload on completion page', async ({ page }) => {
    await page.goto('/completion');

    // Check upload button exists
    await expect(page.locator('text=Upload Documents')).toBeVisible();
  });

  test('should return to dashboard from completion', async ({ page }) => {
    await page.goto('/completion');

    await page.click('button:has-text("Return to Dashboard")');

    await expect(page).toHaveURL(/\/dashboard/);
  });
});
