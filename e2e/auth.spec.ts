import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('redirects to auth if not logged in', async ({ page }) => {
    await page.goto('/');
    // Should redirect to language selection or auth
    await expect(page).toHaveURL(/.*(language|auth)/);
  });

  test('owner login UI renders correctly', async ({ page }) => {
    await page.goto('/auth');
    
    // Check for owner tab
    const ownerTab = page.getByRole('button', { name: /Shop Owner|கடைக்காரர்/i });
    await expect(ownerTab).toBeVisible();
    
    // Check for email and password fields
    await expect(page.getByPlaceholder('shop@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
  });

  test('customer login UI renders correctly', async ({ page }) => {
    await page.goto('/auth');
    
    // Click customer tab
    await page.getByRole('button', { name: /Customer|வாடிக்கையாளர்/i }).click();
    
    // Check for phone and password fields
    await expect(page.getByPlaceholder(/10 digit number|10 இலக்க எண்/i)).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});
