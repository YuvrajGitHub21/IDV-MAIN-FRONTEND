// client/e2e/login.real.e2e.spec.ts
import { test, expect } from '@playwright/test';

// Skip the whole file if creds are not provided
const E2E_EMAIL = "admin@idv.local";
const E2E_PASSWORD = "ChangeMe123!";
test.skip(!E2E_EMAIL || !E2E_PASSWORD, 'Set E2E_EMAIL and E2E_PASSWORD env vars to run these tests.');

/**
 * Logs in via the real /login page, using the actual backend.
 * Uses name selectors that match your component: name="email" / name="password"
 */
async function loginViaUi(page, email: string, password: string) {
  await page.goto('/login');

  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);

  // Submit and wait for navigation to dashboard
  await Promise.all([
    page.waitForURL(/\/dashboard$/),
    page.getByRole('button', { name: /log in/i }).click(),
  ]);

  // Wait for the initial protected calls to complete (profile/users)
//   await page.waitForResponse(res =>
//     res.url().includes('/api/User/profile') && res.ok()
//   );
}

/**
 * Some dashboards render a table; some render an empty state.
 * This helper accepts either a visible table or the "No users found" message.
 */
async function expectDashboardLoaded(page) {
  const table = page.getByRole('table');
  const empty = page.getByText(/No users found/i);
  await expect(table.or(empty)).toBeVisible({ timeout: 10_000 });
}

test.describe('Login e2e (real API)', () => {
  test('Successful login persists across reload', async ({ page }) => {
    await loginViaUi(page, E2E_EMAIL!, E2E_PASSWORD!);

    await expectDashboardLoaded(page);

    // Reload and still be authenticated
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expectDashboardLoaded(page);

    // (Optional) assert token is in localStorage (frontend-side persistence)
    const access = await page.evaluate(() => localStorage.getItem('access'));
    expect(access).toBeTruthy();
  });

  test('Invalid credentials show server message and no redirect', async ({ page }) => {
    await page.goto('/login');

    await page.locator('input[name="email"]').fill(E2E_EMAIL!);
    await page.locator('input[name="password"]').fill('definitely-wrong-password');

    await page.getByRole('button', { name: /log in/i }).click();

    // Stay on /login
    await expect(page).toHaveURL(/\/login$/);

    // Your app surfaces server message via errors.submit; match common strings
    await expect(
      page.getByText(/invalid credentials|login failed|unauthorized/i)
    ).toBeVisible();
  });

  test('Redirect when already authenticated', async ({ page }) => {
    // First, log in for real
    await loginViaUi(page, E2E_EMAIL!, E2E_PASSWORD!);
    await expectDashboardLoaded(page);

    // Now try visiting /login again – guard should bounce to /dashboard
    await page.goto('/login');
    await expect(page).toHaveURL(/\/dashboard$/);
    await expectDashboardLoaded(page);
  });

  test('Logout clears session and protects /dashboard', async ({ page }) => {
    await loginViaUi(page, E2E_EMAIL!, E2E_PASSWORD!);
    await expectDashboardLoaded(page);

    // Your app says logout is a <span>. Click by text (common variants).
    // Adjust the text if your UI uses a different label.
    await page.getByText(/^log ?out$/i).first().click();

    // Back to /login after logout
    await expect(page).toHaveURL(/\/login$/);

    // Trying to hit /dashboard should bounce back to /login (protected route)
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);

    // And token should be gone
    const access = await page.evaluate(() => localStorage.getItem('access'));
    expect(access).toBeFalsy();
  });
});
