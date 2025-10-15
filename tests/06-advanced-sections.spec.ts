import { test, expect } from '@playwright/test';

test.describe('Advanced Sections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('auth_completed', 'true');
      localStorage.setItem('payment_completed', 'true');
      localStorage.setItem('payment_method', 'card');
      
      // Mark everything as complete except advanced
      localStorage.setItem('firmographics_complete', 'true');
      localStorage.setItem('general_benefits_complete', 'true');
      localStorage.setItem('current_support_complete', 'true');
      
      // Mark all 13 dimensions complete
      for (let i = 1; i <= 13; i++) {
        localStorage.setItem(`dimension${i}_complete`, 'true');
        localStorage.setItem(`dimension${i}_data`, JSON.stringify({ test: 'data' }));
      }
    });
  });

  test('should unlock advanced sections when dimensions complete', async ({ page }) => {
    await page.goto('/dashboard');

    // Advanced sections should be unlocked
    await expect(page.locator('text=Cross-Dimensional Assessment')).toBeVisible();
    await expect(page.locator('text=Complete all 13 dimensions first')).not.toBeVisible();
  });

  test('should complete Cross-Dimensional assessment', async ({ page }) => {
    await page.goto('/survey/cross-dimensional-assessment');

    // Click begin
    await page.click('button:has-text("Begin Assessment")');

    // Select 3 dimensions for best outcomes
    const dimensions = page.locator('button').filter({ hasText: /Medical Leave|Insurance|Manager/ });
    for (let i = 0; i < 3; i++) {
      await dimensions.nth(i).click();
    }

    await page.click('button:has-text("Continue")');

    // Should proceed to next step
    await expect(page.locator('text=Lowest Priority Dimensions')).toBeVisible();
  });

  test('should complete Employee-Impact assessment', async ({ page }) => {
    await page.goto('/survey/employee-impact-assessment');

    // Click begin
    await page.click('button:has-text("Begin Assessment")');

    // Fill grid (click first option for each row)
    const buttons = page.locator('table button');
    const count = await buttons.count();
    
    // Click first radio in each row (every 5th button)
    for (let i = 0; i < Math.min(count, 50); i += 5) {
      await buttons.nth(i).click();
      await page.waitForTimeout(100);
    }

    await page.click('button:has-text("Continue")');

    // Should proceed to EI2
    await expect(page.locator('text=ROI Measurement')).toBeVisible();
  });
});
