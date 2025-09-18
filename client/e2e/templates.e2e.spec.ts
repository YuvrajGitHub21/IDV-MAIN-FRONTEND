// client/e2e/templates.real.e2e.spec.ts
import { test, expect } from '@playwright/test';

// ====== Test config / fixtures ======
// Use real creds that can access the Templates page.
const E2E_EMAIL = "admin@idv.local";
const E2E_PASSWORD = "ChangeMe123!";

// Optional: names of *existing* templates for rename/delete/preview flows.
// Set these to safe, disposable fixtures in your env.
const E2E_TEMPLATE_EXISTING = "t";       // e.g. "Welcome Kit"
let newTemplateName: string;

// Skip whole file when creds are not provided.
test.skip(!E2E_EMAIL || !E2E_PASSWORD, 'Set E2E_EMAIL and E2E_PASSWORD to run these tests.');

// ====== Helpers ======
async function loginViaUi(page, email: string, password: string) {
  await page.goto('/login');

  // Your Login component uses name="email" / name="password"
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);

  await Promise.all([
    page.waitForURL(/\/dashboard$/),
    page.getByRole('button', { name: /log in/i }).click(),
  ]);
}

async function goToTemplates(page) {
  // If you have a /templates route, hit it directly:
  await page.goto('/dashboard');
  // If your router only exposes it via side-nav from dashboard, you can instead:
  // await page.goto('/dashboard');
  // await page.getByText(/^template$/i).first().click(); // side-nav “Template”
}

async function expectTemplatesLoaded(page) {
  // Desktop table or mobile empty state text
  const table = page.getByRole('table');
  const empty = page.getByText(/no templates found/i);
  await expect(table.or(empty)).toBeVisible({ timeout: 15_000 });
}

// Finds a row by template name in desktop table
function rowByName(page, name: string) {
  return page.locator('tbody tr', { hasText: name }).first();
}

// Opens the actions dropdown in the last cell of the row
async function openActionsForRow(page, templateName: string) {
  const row = rowByName(page, templateName);
  await expect(row, `Row with name "${templateName}" should be visible`).toBeVisible();
  await row.locator('td').last().locator('button').first().click();
}

// ====== Tests ======
test.describe('Templates e2e (real API)', () => {
  test('Route guard: unauthenticated visit to /templates redirects to /login', async ({ page }) => {
    // Clear any prior auth and try to open templates
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('Renders list from backend (or empty state)', async ({ page }) => {
    await loginViaUi(page, E2E_EMAIL, E2E_PASSWORD);
    await goToTemplates(page);
    await expectTemplatesLoaded(page);

    // Headers exist
    await expect(page.getByText('Name')).toBeVisible();
    await expect(page.getByText('Created By')).toBeVisible();
    await expect(page.getByText('Status')).toBeVisible();

    // Optionally assert a known template is present
    if (E2E_TEMPLATE_EXISTING) {
      await page.getByPlaceholder('Search').fill(E2E_TEMPLATE_EXISTING  );
      await expect(rowByName(page, E2E_TEMPLATE_EXISTING)).toBeVisible();
    }
  });

  test('Search filters list (UI updates, optionally request params contain search)', async ({ page }) => {
    await loginViaUi(page, E2E_EMAIL, E2E_PASSWORD);
    await goToTemplates(page);
    await expectTemplatesLoaded(page);

    const q = E2E_TEMPLATE_EXISTING || 'a'; // something likely to match
    // Watch next template fetch
    const reqPromise = page.waitForRequest((r) => r.url().includes('/api/Template'), { timeout: 10_000 }).catch(() => null);

    await page.getByPlaceholder(/search/i).fill(q);

    // UI filter should narrow to matches (or at least keep rows visible)
    await expectTemplatesLoaded(page);

    // Soft-assert that request carried the search param if your hook encodes it
    const req = await reqPromise;
    if (req) {
      expect.soft(req.url()).toMatch(/api\/Template/);
      // If your backend expects ?search=...:
      expect.soft(req.url().toLowerCase()).toContain('search=');
    }
  });

//   test('Pagination: change page size and move to next/prev when available', async ({ page }) => {
//     await loginViaUi(page, E2E_EMAIL, E2E_PASSWORD);
//     await goToTemplates(page);
//     await expectTemplatesLoaded(page);

//     // Change "Rows per page" to 24 then 50
//     const pageSizeSelect = page.getByRole('combobox', { name: /rows per page/i }).or(page.locator('select', { hasText: '' }));
//     await pageSizeSelect.selectOption('24');
//     // Range text like "1-24 of N" should update
//     const range = page.getByText(/\d+-\d+ of \d+/i);
//     await expect(range).toBeVisible();

//     await pageSizeSelect.selectOption('50');
//     await expect(range).toBeVisible();

//     // Try going next if enabled
//     const nextBtn = page.getByRole('button').filter({ has: page.locator('svg[path*="10 6L8.59"]') }).first().or(
//       page.getByRole('button', { name: /next/i }).first()
//     );
//     if (await nextBtn.isEnabled()) {
//       const before = await range.textContent();
//       await nextBtn.click();
//       await expect(range).not.toHaveText(before || '', { timeout: 10_000 });
//     }
//   });

//   test('Open filter dropdown', async ({ page }) => {
//     await loginViaUi(page, E2E_EMAIL, E2E_PASSWORD);
//     await goToTemplates(page);
//     await expectTemplatesLoaded(page);

//     await page.getByRole('button', { name: /filter/i }).click();
//     // Assert dropdown content (labels inside your TemplateFilterDropdown)
//     await expect(
//       page.getByText(/sort by|created|updated|status/i)
//     ).toBeVisible();
//     });
    
  test('Create new template then go back to Dashboard (via Previous/Back)', async ({ page }) => {
    // Reuse your helpers
    await loginViaUi(page, E2E_EMAIL, E2E_PASSWORD);
    await goToTemplates(page);
    await expectTemplatesLoaded(page);

    newTemplateName = `new${Date.now()}`;

    // Open "Add New" / "Create New" entry
    const addNewBtn = page.getByRole('button', { name: /add new|create new|new template/i }).first();
    await addNewBtn.click();

    // If a dropdown opens, click the "Create…" item
    const createMenuItem = page.getByRole('menuitem', { name: /create/i }).first();
    if (await createMenuItem.isVisible({ timeout: 1000 }).catch(() => false)) {
        await createMenuItem.click();
    }

    // Fill template name in naming dialog
    const nameInput =
        (await page.getByPlaceholder(/name/i).first().isVisible().catch(() => false))
        ? page.getByPlaceholder(/name/i).first()
        : page.getByRole('textbox').last();

    await nameInput.fill(newTemplateName);

    // Submit (buttons vary across apps – try a few common labels)
    const createBtn =
        page.getByRole('button', { name: /create|continue|next|save|ok/i }).first();

    // Wait for real POST /api/Template to succeed
    const postResp = page.waitForResponse(r =>
        r.request().method() === 'POST' &&
        /\/api\/Template\b/i.test(r.url()) &&
        r.status() >= 200 && r.status() < 300
    );

    await Promise.all([postResp, createBtn.click()]);

    // After creation, many apps navigate to a builder/preview page – allow either.
    await page.waitForURL(/(template|builder|preview|templates)/i, { timeout: 15_000 });

    // Try clicking a visible “Previous/Back” control on that page…
    const backControl =
        page.getByRole('button', { name: /(previous|back)/i }).first()
        .or(page.getByText(/^(previous|back)$/i).first());

    if (await backControl.isVisible({ timeout: 2000 }).catch(() => false)) {
        await backControl.click();
    } else {
        // …otherwise just go back in history as a fallback.
        await page.goBack();
    }

    // Land on Dashboard (if your UI routes to Templates first, hop to dashboard explicitly)
    await expect.soft(page).toHaveURL(/\/dashboard$/);
    if (!/\/dashboard$/.test(page.url())) {
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/dashboard$/);
    }

    // (Optional) sanity: navigate to /templates and confirm the new template exists
    // Comment out if you want purely the dashboard return check.
    await page.goto('/dashboard');
    await page.getByPlaceholder('Search').fill(newTemplateName);
    await expect(page.locator('body')).toContainText(newTemplateName);
    });

//   test('Rename flow: validation (>30 chars) and persistence', async ({ page }) => {

//     await loginViaUi(page, E2E_EMAIL, E2E_PASSWORD);
//     await goToTemplates(page);
//     await expectTemplatesLoaded(page);

//     // enen actions → Rename
//     await openActionsForRow(page, newTemplateName);
//     await page.getByText(/^rename$/i).click();

//     // Dialog validation ( > 30 chars )
//     const tooLong = 'x'.repeat(31);
//     const input = page.getByRole('textbox').first();
//     await input.fill(tooLong);

//     const renameBtn = page.getByRole('button', { name: /^rename$/i });
//     await expect(renameBtn).toBeDisabled();
//     await expect(page.getByText(/max length is 30/i)).toBeVisible();

//     // Enter valid unique name and submit
//     const newName = `renamed-${Date.now()}`;
//     await input.fill(newName);
//     await expect(renameBtn).toBeEnabled();
//     await renameBtn.click();

//     // Toast + row updated
//     await expect(page.getByText(/template renamed successfully/i)).toBeVisible();
//     await expect(rowByName(page, newName)).toBeVisible({ timeout: 15_000 });

//     // Reload still updated
//     await page.reload();
//     await expect(rowByName(page, newName)).toBeVisible();
//     newTemplateName = newName;
//   });
  test('Rename flow: validation (>30 chars) and persistence', async ({ page }) => {
    await loginViaUi(page, E2E_EMAIL, E2E_PASSWORD);
    await goToTemplates(page);
    await expectTemplatesLoaded(page);

    // Narrow list to the previously created template
    await page.getByPlaceholder('Search').fill(newTemplateName);
    await expect(rowByName(page, newTemplateName)).toBeVisible();

    // Open actions → Rename
    await openActionsForRow(page, newTemplateName);
    await page
        .getByRole('menuitem', { name: /^rename$/i })
        .or(page.getByText(/^rename$/i))
        .first()
        .click();

    const dialog = page.getByRole('dialog', { name: /rename template/i });
    const input  = dialog.getByPlaceholder(/enter new template name/i);


    // > 30 chars -> disabled button + inline error
    const tooLong = 'x'.repeat(31);
    await input.fill(tooLong);
    const renameBtn = dialog.getByRole('button', { name: /^rename$/i });
    await expect(renameBtn).toBeDisabled();
    await expect(dialog.getByText(/max length is 30/i)).toBeVisible();

    // Valid name -> enabled → click → toast + row updated
    const newName = `renamed-${Date.now()}`;
    await input.fill(newName);
    await expect(renameBtn).toBeEnabled();
    await renameBtn.click();

    await expect(page.getByText(/template renamed successfully/i)).toBeVisible();

    // Persist after reload
    await page.reload();
    await page.getByPlaceholder('Search').fill(newName);
    await expect(rowByName(page, newName)).toBeVisible();

    // Update shared for later tests
    newTemplateName = newName;
    });



  test('Preview action navigates and renders; refresh still works', async ({ page }) => {
    await loginViaUi(page, E2E_EMAIL, E2E_PASSWORD);
    await goToTemplates(page);
    await expectTemplatesLoaded(page);
    
    await page.getByPlaceholder('Search').fill(newTemplateName);
    await openActionsForRow(page, newTemplateName);
    await page.getByText(/^preview$/i).click();

    await expect(page).toHaveURL(/\/preview-backend\/\w+/);
    await expect(page.locator('body')).toContainText(newTemplateName);

    // Page should load some content; assert URL sticks on reload
    await page.reload();
    await expect(page).toHaveURL(/\/preview-backend\/\w+/);
  });

  test('Delete flow: confirm, row disappears, persists after reload', async ({ page }) => {
    await loginViaUi(page, E2E_EMAIL, E2E_PASSWORD);
    await goToTemplates(page);
    await expectTemplatesLoaded(page);

    // Ensure target row visible
    await page.getByPlaceholder('Search').fill(newTemplateName);
    await expect(rowByName(page, newTemplateName)).toBeVisible();

    // Open actions → Delete
    await openActionsForRow(page, newTemplateName);
    await page.getByText(/^delete$/i).click();

    // Confirm delete (button label may be "Delete" or "Confirm")
    const confirmBtn = page.getByRole('button', { name: /(delete|confirm)/i }).first();
    await confirmBtn.click();

    // Toast + row gone
    await expect(page.getByText(/deleted/i)).toBeVisible();
    await expect(rowByName(page, newTemplateName)).toHaveCount(0);

    // Reload → still gone
    await page.reload();
    await expect(rowByName(page, newTemplateName)).toHaveCount(0);
  });
});
