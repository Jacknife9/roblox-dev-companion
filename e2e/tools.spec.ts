import { test, expect, type Page } from '@playwright/test';
async function tools(page: Page, group: string) {
  await page.getByRole('tab', { name: 'Tools', exact: true }).click();
  await page.getByRole('button', { name: `Tool group: ${group}`, exact: true }).click();
}
test.beforeEach(async ({ page }) => { await page.goto('/'); await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible(); });
test('Robux estimate reads the service rate and ladder avoids existing prices', async ({ page }) => {
  let rate = .0042;
  await page.route('**/v1/public/devex', route => route.fulfill({ json: { standard: rate, eligibleUS18: null, legacy: null, fetchedAt: new Date().toISOString(), source: 'https://create.roblox.com/docs/production/monetization/developer-exchange', stale: false } }));
  await tools(page, 'Money'); await page.getByRole('textbox', { name: 'Sale price in Robux', exact: true }).fill('10000');
  await page.getByRole('button', { name: 'Calculate Robux kept', exact: true }).click();
  await expect(page.getByText('7,000 Robux kept', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Load Roblox DevEx rate', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Rough DevEx value: $29.40 USD', exact: true })).toBeVisible();
  rate = .0062; await page.getByRole('button', { name: 'Load Roblox DevEx rate', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Rough DevEx value: $43.40 USD', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Suggest price ladder', exact: true }).click();
  await expect(page.getByText('Pass tier 1: 25 Robux', { exact: true })).toBeVisible();
  await expect(page.getByText('Pass tier 2: 62 Robux', { exact: true })).toBeVisible();
});
test('progression graph and code tools calculate and flag practical issues', async ({ page }) => {
  await tools(page, 'Tycoon'); await page.getByRole('button', { name: 'Graph progression', exact: true }).click();
  await expect(page.getByText('Tier 5 · On target', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Graph view: Wait per tier', exact: true }).click();
  await expect(page.getByText('50.63 seconds', { exact: true })).toBeVisible();
  await tools(page, 'Code'); await page.getByRole('button', { name: 'Convert to Scale', exact: true }).click();
  await expect(page.getByText('UDim2.fromScale(0.25, 0.166667)', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Luau script to check', exact: true }).fill('wait(1)\nstore:SetAsync(key, value)\nremote.OnServerEvent:Connect(function(player, amount)\ncoins.Value = amount\nend)');
  await page.getByRole('button', { name: 'Check script', exact: true }).click();
  await expect(page.getByRole('heading', { name: '3 review prompts', exact: true })).toBeVisible();
  await expect(page.getByText('Line 4 · Client value used directly', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Line 3 · Client value used directly', { exact: true })).toBeVisible();
});
test('image previews, listing checks, update log and saved launch checklist work', async ({ page }, info) => {
  await tools(page, 'Publish');
  const picker = page.waitForEvent('filechooser'); await page.getByRole('button', { name: 'Choose preview image', exact: true }).click();
  await (await picker).setFiles('assets/icon.png');
  await expect(page.getByRole('img', { name: 'Discovery thumbnail preview', exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Tiny icon preview', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Check listing draft', exact: true }).click();
  await expect(page.getByText(/Phone approximation:/)).toBeVisible();
  await page.getByRole('button', { name: 'Generate update log', exact: true }).click();
  await expect(page.getByText(/UPDATE 3 🔥/)).toBeVisible();
  await page.getByRole('button', { name: 'Copy update log', exact: true }).click();
  await expect(page.getByText('Update log copied', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Switch to dark mode', exact: true }).click();
  await page.getByRole('button', { name: 'Save launch checklist to Projects', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'My game launch checklist', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('checkbox')).toHaveCount(14); await page.getByRole('checkbox').first().click();
  await page.reload(); await page.getByRole('tab', { name: 'Projects', exact: true }).click();
  await page.getByRole('button', { name: 'Open project: My game launch checklist', exact: true }).click(); await expect(page.getByRole('checkbox').first()).toBeChecked();
  await page.screenshot({ path: `test-results/${info.project.name}-dark-checklist.png`, fullPage: true });
});
test('public dashboard displays recorded snapshots and exports history', async ({ page }) => {
  const time = new Date().toISOString();
  const older = { universeId: 1, name: 'Test game', visits: 100, playing: 10, favorites: 20, upVotes: 9, downVotes: 1, likeRatio: .9, fetchedAt: new Date(Date.now() - 60_000).toISOString(), updatedAt: null };
  const current = { ...older, visits: 120, playing: 12, favorites: 22, fetchedAt: time };
  await page.route('**/v1/public/stats?*', route => route.fulfill({ json: { current, history: [older, current], historyNote: 'Observed on refresh; no historical backfill.' } }));
  await tools(page, 'Stats'); await page.getByRole('textbox', { name: 'Game link or ID', exact: true }).fill('1');
  await page.getByRole('button', { name: 'Fetch & record stats', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Test game', exact: true })).toBeVisible();
  await expect(page.getByText(/Since first recorded snapshot: 20 visits, 2 favorites/)).toBeVisible();
  await page.getByRole('button', { name: 'Stats graph: Like ratio', exact: true }).click();
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export stats history CSV', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('roblox-stats-1.csv');
});
test('tool layouts fit narrow screens in both themes', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  for (const dark of [false, true]) {
    if (dark) await page.getByRole('button', { name: 'Switch to dark mode', exact: true }).click();
    for (const group of ['Money', 'Tycoon', 'Code', 'Publish', 'Stats']) {
      await tools(page, group);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const card = await page.getByRole('heading').last().boundingBox(); expect(card!.x + card!.width).toBeLessThanOrEqual(320);
    }
  }
});
