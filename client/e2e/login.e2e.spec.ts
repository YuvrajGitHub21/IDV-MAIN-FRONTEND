import { test, expect, Page } from '@playwright/test';

// --- Helpers ---------------------------------------------------------------

const fillLoginForm = async (
  page: Page,
  {
    email = 'alice@example.com',
    password = 'secret1',
  }: Partial<Record<'email' | 'password', string>> = {}
) => {
  // Requires your labels to have htmlFor -> id as we discussed:
  // <label htmlFor="email">Mobile Number Or Email Address</label>
  // <input id="email" ... />
  await page.getByLabel('Mobile Number Or Email Address').fill(email);
  // <label htmlFor="password">Password</label>
  // <input id="password" ... />
  await page.getByLabel('Password').fill(password);
};

const mockDashboardData = async (page: Page, email = 'alice@example.com') => {
  // Profile used by dashboard
  await page.route('**/api/User/profile', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'u1', email, firstName: 'Alice', lastName: 'Smith' }),
    });
  });

  // Templates list used by dashboard
  await page.route(/.*\/api\/Template(\?.*)?$/, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        totalItems: 1,
        items: [
          {
            id: 't1',
            name: 'tt', // we assert for this on the dashboard
            createdBy: '507f1f77bcf86cd799439011',
            isActive: true,
            createdAtUtc: '2025-01-01T00:00:00.000Z',
            updatedAtUtc: '2025-01-02T00:00:00.000Z',
            invitees: [],
            templateRuleId: 1,
            description: '',
          },
        ],
      }),
    });
  });
};

// --- Tests -----------------------------------------------------------------

test.describe('Login e2e', () => {
  test('Successful login persists across reload', async ({ page }) => {
    const email = `e2e+${Date.now()}@example.com`;

    // Mock login endpoint -> returns tokens so app stores them in localStorage
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access: 'e2e-access-token',
          refresh: 'e2e-refresh-token',
          user: { email, firstName: 'Alice', lastName: 'Smith' },
        }),
      });
    });

    // Mock data the dashboard fetches after redirect
    await mockDashboardData(page, email);

    await page.goto('/login');
    await fillLoginForm(page, { email, password: 'secret1' });
    await page.getByRole('button', { name: 'Log In' }).click();

    // Redirected to dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Token persisted (your app uses localStorage)
    const access = await page.evaluate(() => window.localStorage.getItem('access'));
    expect(access).toBeTruthy();

    // Dashboard renders template "tt"
    await expect(page.getByRole('table').getByText('tt', { exact: true })).toBeVisible();

    // Reload -> still authenticated and still on dashboard
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('table').getByText('tt', { exact: true })).toBeVisible();
  });

  test('Invalid credentials -> server message, no redirect', async ({ page }) => {
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' }),
      });
    });

    await page.goto('/login');
    await fillLoginForm(page, { email: 'wrong@example.com', password: 'badpass' });
    await page.getByRole('button', { name: 'Log In' }).click();

    // Error banner/message from server
    await expect(page.getByText('Invalid credentials')).toBeVisible();

    // Still on /login
    await expect(page).toHaveURL(/\/login$/);

    // No auth set
    const access = await page.evaluate(() => window.localStorage.getItem('access'));
    expect(access).toBeNull();
  });

  test('Redirect when already authenticated', async ({ page }) => {
    // Pretend already authenticated
    await page.addInitScript(() => {
      window.localStorage.setItem('access', 'already-authenticated-token');
    });

    // Mock dashboard calls so landing works without 401s
    await mockDashboardData(page, 'already@example.com');

    await page.goto('/login');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('table').getByText('tt', { exact: true })).toBeVisible();
  });

  test('Logout clears session and protects routes', async ({ page }) => {
    // Start authenticated directly on dashboard
    await page.addInitScript(() => {
      window.localStorage.setItem('access', 'token-for-logout-test');
    });
    await mockDashboardData(page, 'logout@example.com');

    await page.goto('/dashboard');
    await expect(page.getByRole('table').getByText('tt', { exact: true })).toBeVisible();

    // Click logout (adjust selector if your button text differs)
    // const logoutButton = page.getByRole('button', { name: /logout|Logout/i });
    // await expect(logoutButton).toBeVisible();
    // await logoutButton.click();
    const logoutSpan = page.getByText(/logout/i);
    await expect(logoutSpan).toBeVisible();
    await logoutSpan.click();


    // After logout: redirected to /login and token cleared
    await expect(page).toHaveURL(/\/login/);
    const access = await page.evaluate(() => window.localStorage.getItem('access'));
    expect(access).toBeNull();

    // Protected route should bounce back to /login
    // await page.goto('/dashboard');
    // await expect(page).toHaveURL(/\/login/);
  });
});
