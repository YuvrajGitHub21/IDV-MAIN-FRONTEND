import { test, expect } from '@playwright/test';

const fillSignUpForm = async (page, {
  firstName = 'Alice',
  lastName = 'Smith',
  email = `e2sdfghjkl@example.com`,
  phone = '',
  password = 'secret1',
  confirmPassword = 'secret1',
} = {}) => {
  await page.getByLabel('First Name').fill(firstName);
  await page.getByLabel('Last Name').fill(lastName);
  await page.getByLabel('Email Address').fill(email);
  if (phone !== undefined) await page.getByLabel('Phone Number (Optional)').fill(phone);
  await page.locator('#password').fill(password);
  await page.locator('#confirmPassword').fill(confirmPassword);
};

// seed an access token before page scripts (for tests that must start authenticated)
async function setAccessToken(page, token = 'e2e-access-token') {
  await page.addInitScript(t => window.localStorage.setItem('access', t), token);
}

// stub the calls your dashboard makes so we don’t see 401s
async function stubDashboard(page, { email = 'alice@example.com', templateName = 'tt' } = {}) {
  await page.route('**/api/User/profile', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'u1', email, firstName: 'Alice', lastName: 'Smith' }),
    })
  );
  await page.route(/.*\/api\/Template(\?.*)?$/, route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        totalItems: 1,
        items: [{
          id: 't1',
          name: templateName,
          createdBy: '507f1f77bcf86cd799439011',
          isActive: true,
          createdAtUtc: '2025-01-01T00:00:00.000Z',
          updatedAtUtc: '2025-01-02T00:00:00.000Z',
          invitees: [],
          templateRuleId: 1,
          description: '',
        }],
      }),
    })
  );
}

test.describe('SignUp e2e', () => {
  test('New user can sign up (happy path, smoke)', async ({ page }) => {
    const email = `e2e+${Date.now()}@example.com`;
    const authResponse = {
      access: 'e2e-access-token',
      refresh: 'e2e-refresh-token',
      user: { email, firstName: 'Alice', lastName: 'Smith' },
    };

    // mock signup response (this causes your app to store the token)
    await page.route('**/api/auth/register', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(authResponse) })
    );

    // after redirect, the dashboard will load — stub it and assert a known template
    await stubDashboard(page, { email, templateName: 'tt' });

    await page.goto('/signup');
    await fillSignUpForm(page, { email });
    await page.getByRole('button', { name: 'Sign up' }).click();

    await expect(page).toHaveURL(/\/dashboard/);

    // token persisted by the app
    const access = await page.evaluate(() => window.localStorage.getItem('access'));
    expect(access).toBeTruthy();

    // dashboard shows the stubbed template
    await expect(page.getByRole('table').getByText('tt', { exact: true })).toBeVisible();
  });

  test('Duplicate email shows server message (4xx) and no redirect', async ({ page }) => {
    // DO NOT set token here — we must remain on /signup
    await page.route('**/api/auth/register', route =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Email already registered' }),
      })
    );

    await page.goto('/signup');
    await fillSignUpForm(page, { email: 'existing@example.com' });
    await page.getByRole('button', { name: 'Sign up' }).click();

    await expect(page.getByText('Email already registered')).toBeVisible();
    await expect(page).toHaveURL(/\/signup$/);
    const access = await page.evaluate(() => window.localStorage.getItem('access'));
    expect(access).toBeNull();
  });

  test('Redirect when already logged in', async ({ page }) => {
    // start authenticated + stub dashboard to avoid 401s
    await setAccessToken(page);
    await stubDashboard(page, { templateName: 'tt' });

    await page.goto('/signup'); // your effect redirects to /dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('table').getByText('tt', { exact: true })).toBeVisible();
  });

  test('Client-side validation smoke (required + mismatched passwords)', async ({ page }) => {
    // DO NOT set token here — we must stay on /signup to see validation errors
    await page.goto('/signup');

    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page.getByText('First name is required')).toBeVisible();
    await expect(page.getByText('Last name is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
    await expect(page.getByText('Please confirm your password')).toBeVisible();

    await fillSignUpForm(page, {
      firstName: 'Alice',
      lastName: 'Smith',
      email: `valid+${Date.now()}@example.com`,
      password: 'secret1',
      confirmPassword: 'secret2',
    });
    await page.getByRole('button', { name: 'Sign up' }).click();

    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });
});
