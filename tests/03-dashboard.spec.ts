import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('auth_completed', 'true');
      localStorage.setItem('auth_email', 'test@example.com');
      localStorage.setItem('payment_completed', 'true');
      localStorage.setItem('payment_method', 'card');
      localStorage.setItem('login_company_name', 'Test Company');
    });
  });

  test('should display dashboard with all sections', async ({ page }) => {
    await page.goto('/dashboard');

    // Check core sections visible
    await expect(page.locator('text=Company Profile')).toBeVisible();
    await expect(page.locator('text=General Employee Benefits')).toBeVisible();
    await expect(page.locator('text=Current Support for Employees Managing Cancer')).toBeVisible();

    // Check 13 dimensions visible
    await expect(page.locator('text=Medical Leave & Flexibility')).toBeVisible();

    // Check dimensions are locked initially
    await expect(page.locator('text=Complete all 3 core sections first')).toBeVisible();
  });

  test('should show payment required if not paid', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('payment_completed');
      localStorage.removeItem('payment_method');
    });

    await page.goto('/dashboard');

    await expect(page.locator('text=Payment Required to Begin Assessment')).toBeVisible();
  });

  test('should navigate to core sections when clicked', async ({ page }) => {
    await page.goto('/dashboard');

    // Click on Company Profile
    await page.click('text=Company Profile');

    await expect(page).toHaveURL(/\/survey\/firmographics/);
  });

  test('should lock dimensions until core complete', async ({ page }) => {
    await page.goto('/dashboard');

    // Try to click a dimension
    const dimension = page.locator('text=Medical Leave & Flexibility').first();
    await dimension.click();

    // Should stay on dashboard (locked)
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
