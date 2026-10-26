import { test, expect, type Page } from '@playwright/test';
async function login(page: Page, email: string, signup = false) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign in or create account', exact: true }).click();
  if (signup) await page.getByRole('button', { name: 'Account action: Create account', exact: true }).click();
  await page.getByRole('textbox', { name: 'Email address', exact: true }).fill(email);
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill('test-only-long-password');
  await page.getByRole('button', { name: signup ? 'Create account' : 'Sign in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open account', exact: true })).toBeVisible();
  await expect(page.getByText('Projects synced', { exact: true })).toBeVisible();
}
test('theme follows the system, toggles, and persists through reload across screens', async ({ page }, info) => {
  await page.emulateMedia({ colorScheme: 'dark' }); await page.goto('/');
  await expect(page.getByRole('button', { name: 'Switch to light mode', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Switch to light mode', exact: true }).click();
  await page.reload(); await expect(page.getByRole('button', { name: 'Switch to dark mode', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Switch to dark mode', exact: true }).click();
  await page.reload(); await expect(page.getByRole('button', { name: 'Switch to light mode', exact: true })).toBeVisible();
  for (const tab of ['Ideas', 'Balance', 'Projects', 'Scripts']) {
    await page.getByRole('tab', { name: tab, exact: true }).click();
    const input = page.getByRole('textbox').first();
    if (await input.count()) await expect(input).toHaveCSS('color', 'rgb(232, 241, 233)');
  }
  await page.getByRole('button', { name: 'Sign in or create account', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Email address', exact: true })).toHaveCSS('background-color', 'rgb(25, 39, 34)');
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    const heading = await page.getByRole('heading', { name: 'Bring your builds with you.', exact: true }).boundingBox();
    expect(heading!.x + heading!.width).toBeLessThanOrEqual(width);
  }
  await page.setViewportSize(info.project.use.viewport!);
  await page.screenshot({ path: `test-results/${info.project.name}-dark-account.png`, fullPage: true });
});

test('offline edits persist and an explicit conflict choice protects the cloud copy', async ({ page, browser }, info) => {
  const email = `conflict-${info.project.name}-${Date.now()}@example.test`;
  await login(page, email, true);
  await page.getByRole('tab', { name: 'Projects', exact: true }).click();
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByRole('textbox', { name: 'New project name', exact: true }).fill('Conflict build');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(page.getByText('Projects synced', { exact: true })).toBeVisible();
  const context = await browser.newContext({ viewport: info.project.use.viewport }); const second = await context.newPage();
  try {
    await login(second, email); await second.getByRole('tab', { name: 'Projects', exact: true }).click();
    await second.getByRole('button', { name: 'Open project: Conflict build', exact: true }).click();
    await page.route('**:4174/v1/workspace', route => route.abort());
    await page.getByRole('textbox', { name: 'New task', exact: true }).fill('Device only task');
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await expect(page.getByText('Sync unavailable. Device copy kept; retry when connected.', { exact: true })).toBeVisible();
    await page.reload(); await page.getByRole('tab', { name: 'Projects', exact: true }).click();
    await page.getByRole('button', { name: 'Open project: Conflict build', exact: true }).click();
    await expect(page.getByRole('checkbox', { name: 'Complete task: Device only task', exact: true })).toBeVisible();
    await second.getByRole('textbox', { name: 'New task', exact: true }).fill('Cloud only task');
    await second.getByRole('button', { name: 'Add task', exact: true }).click();
    await expect(second.getByText('Projects synced', { exact: true })).toBeVisible();
    await page.unroute('**:4174/v1/workspace');
    await page.getByRole('button', { name: 'Sync projects', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Projects changed on another device', exact: true })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Complete task: Device only task', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Use cloud copy', exact: true }).click();
    await expect(page.getByRole('checkbox', { name: 'Complete task: Cloud only task', exact: true })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Complete task: Device only task', exact: true })).toHaveCount(0);
  } finally { await context.close(); }
});

test('signup and a second device sync tasks; logout restores isolated guest data', async ({ page, browser }, info) => {
  const email = `sync-${info.project.name}-${Date.now()}@example.test`;
  await page.goto('/'); await page.getByRole('tab', { name: 'Projects', exact: true }).click();
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByRole('textbox', { name: 'New project name', exact: true }).fill('Guest original');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();
  await login(page, email, true);
  await page.getByRole('tab', { name: 'Projects', exact: true }).click();
  await expect(page.getByText('A clean slate.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Open account', exact: true }).click();
  await page.getByRole('button', { name: 'Copy guest projects', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm copy guest projects', exact: true }).click();
  await expect(page.getByText('1 guest projects copied. The guest originals are kept.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close account', exact: true }).click();
  await page.getByRole('button', { name: 'Open project: Guest original', exact: true }).click();
  await page.getByRole('textbox', { name: 'New task', exact: true }).fill('Shared task');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await expect(page.getByText('Projects synced', { exact: true })).toBeVisible();
  const context = await browser.newContext({ viewport: info.project.use.viewport });
  const second = await context.newPage();
  try {
    await login(second, email); await second.getByRole('tab', { name: 'Projects', exact: true }).click();
    await second.getByRole('button', { name: 'Open project: Guest original', exact: true }).click();
    await second.getByRole('checkbox', { name: 'Complete task: Shared task', exact: true }).click();
    await expect(second.getByText('Projects synced', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Sync projects', exact: true }).click();
    await expect(page.getByRole('checkbox', { name: 'Complete task: Shared task', exact: true })).toBeChecked();
    await page.reload(); await expect(page.getByRole('button', { name: 'Open account', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Open account', exact: true }).click();
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Sign in or create account', exact: true })).toBeVisible();
    await page.getByRole('tab', { name: 'Projects', exact: true }).click();
    await page.getByRole('button', { name: 'Open project: Guest original', exact: true }).click();
    await expect(page.getByRole('checkbox')).toHaveCount(0);
    // Password confirmation deletes server data and revokes the second device's session.
    await login(page, email); await page.getByRole('button', { name: 'Open account', exact: true }).click();
    await page.getByRole('button', { name: 'Delete my account', exact: true }).click();
    await page.getByRole('textbox', { name: 'Confirm account password', exact: true }).fill('test-only-long-password');
    await page.getByRole('button', { name: 'Permanently delete account', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Sign in or create account', exact: true })).toBeVisible();
    await second.getByRole('button', { name: 'Sync projects', exact: true }).click();
    await expect(second.getByText(/Sign in again to sync/)).toBeVisible();
  } finally { await context.close(); }
});
