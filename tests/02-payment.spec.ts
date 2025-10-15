import { test, expect } from '@playwright/test';

test.describe('Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('auth_completed', 'true');
      localStorage.setItem('auth_email', 'test@example.com');
      localStorage.setItem('login_company_name', 'Test Company');
    });
  });

  test('should select credit card payment', async ({ page }) => {
    await page.goto('/payment');

    // Click credit card option
    await page.click('button:has-text("Continue with Credit Card")');

    // Should go to credit card page
    await expect(page).toHaveURL(/\/payment\/credit-card/);
  });

  test('should select ACH payment', async ({ page }) => {
    await page.goto('/payment');

    // Click ACH option
    await page.click('button:has-text("Continue with ACH")');

    // Should go to stripe page
    await expect(page).toHaveURL(/\/payment\/stripe/);
  });

  test('should select invoice payment', async ({ page }) => {
    await page.goto('/payment');

    await page.click('button:has-text("Request Invoice")');

    await expect(page).toHaveURL(/\/payment\/invoice/);
  });

  test('should complete invoice payment and access dashboard', async ({ page }) => {
    await page.goto('/payment/invoice');

    // Simulate invoice selection
    await page.evaluate(() => {
      localStorage.setItem('payment_completed', 'true');
      localStorage.setItem('payment_method', 'invoice');
    });

    await page.goto('/dashboard');

    // Should see payment banner
    await expect(page.locator('text=Invoice (Payment Pending)')).toBeVisible();
  });
});
