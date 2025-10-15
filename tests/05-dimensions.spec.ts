import { test, expect } from '@playwright/test';

test.describe('Dimensions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('auth_completed', 'true');
      localStorage.setItem('payment_completed', 'true');
      localStorage.setItem('payment_method', 'card');
      
      // Mark core sections as complete
      localStorage.setItem('firmographics_complete', 'true');
      localStorage.setItem('general_benefits_complete', 'true');
      localStorage.setItem('current_support_complete', 'true');
      
      // Add minimal data
      localStorage.setItem('firmographics_data', JSON.stringify({ s1: '1990' }));
      localStorage.setItem('general-benefits_data', JSON.stringify({ cb1a: 'test' }));
      localStorage.setItem('current-support_data', JSON.stringify({ cb3a: 'test' }));
    });
  });

  test('should unlock dimensions when core complete', async ({ page }) => {
    await page.goto('/dashboard');

    // Dimensions should now say "Click to begin"
    await expect(page.locator('text=Click to begin').first()).toBeVisible();
  });

  test('should navigate to dimension page', async ({ page }) => {
    await page.goto('/dashboard');

    // Click first dimension
    await page.locator('text=Medical Leave & Flexibility').first().click();

    await expect(page).toHaveURL(/\/survey\/dimensions\/1/);
  });

  test('should save dimension answers', async ({ page }) => {
    await page.goto('/survey/dimensions/1');

    // Click a rating button (assuming grid layout)
    const firstButton = page.locator('button').first();
    await firstButton.click();

    await page.waitForTimeout(1000);

    // Check data saved
    const data = await page.evaluate(() => localStorage.getItem('dimension1_data'));
    expect(data).toBeTruthy();
  });
});
