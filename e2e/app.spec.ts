import { test, expect, type Page } from '@playwright/test';
import { createProject } from '../src/core/projects';

async function projects(page: Page) { await page.getByRole('tab', { name: 'Projects', exact: true }).click(); }
async function create(page: Page, name = 'Cloud cafe') {
  await projects(page);
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByRole('textbox', { name: 'New project name', exact: true }).fill(name);
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Project name', exact: true })).toHaveValue(name);
}
test.beforeEach(async ({ page }) => { await page.goto('/'); await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible(); });

test('filtered idea becomes a project whose tasks and notes persist', async ({ page }) => {
  await page.getByRole('button', { name: 'Game genre: Obby', exact: true }).click();
  await page.getByRole('button', { name: 'Build window: Two weeks', exact: true }).click();
  await page.getByRole('button', { name: 'Generate idea', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Coral Runners', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start a project from this idea', exact: true }).click();
  await expect(page.getByText('0/4 tasks complete · 0%', { exact: true })).toBeVisible();
  await page.getByRole('checkbox').first().click();
  await expect(page.getByText('1/4 tasks complete · 25%', { exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox').first()).toBeChecked();
  await page.getByRole('textbox', { name: 'Project notes', exact: true }).fill('Playtest on Friday');
  await page.getByRole('button', { name: 'Save project details', exact: true }).click();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();
  await page.reload(); await projects(page);
  await page.getByRole('button', { name: 'Open project: Coral Runners', exact: true }).click();
  await expect(page.getByRole('checkbox').first()).toBeChecked();
  await expect(page.getByRole('textbox', { name: 'Project notes', exact: true })).toHaveValue('Playtest on Friday');
});

test('manual project and task CRUD validates titles and confirms project deletion', async ({ page }) => {
  await create(page);
  await page.getByRole('textbox', { name: 'New task', exact: true }).fill('Make a lobby');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await page.getByRole('button', { name: 'Edit task: Make a lobby', exact: true }).click();
  await page.getByRole('textbox', { name: 'Edit task title', exact: true }).fill('Playtest lobby');
  await page.getByRole('button', { name: 'Save task', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Complete task: Playtest lobby', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit task: Playtest lobby', exact: true }).click();
  await page.getByRole('button', { name: 'Delete task', exact: true }).click();
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Project name', exact: true }).fill('');
  await page.getByRole('button', { name: 'Save project details', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Project name is required');
  await page.getByRole('textbox', { name: 'Project name', exact: true }).fill('Cloud cafe 2');
  await page.getByRole('button', { name: 'Save project details', exact: true }).click();
  await page.getByRole('button', { name: 'Delete project', exact: true }).click();
  await page.getByRole('button', { name: 'Keep project', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open project: Cloud cafe 2', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Delete project', exact: true }).click();
  await page.getByRole('button', { name: 'Delete permanently', exact: true }).click();
  await expect(page.getByText('A clean slate.', { exact: true })).toBeVisible();
});

test('calculators show known results and invalid input errors', async ({ page }) => {
  await page.getByRole('tab', { name: 'Balance', exact: true }).click();
  await page.getByRole('textbox', { name: 'Growth multiplier', exact: true }).fill('1.5');
  await page.getByRole('textbox', { name: 'Target level', exact: true }).fill('4');
  await page.getByRole('button', { name: 'Calculate curve', exact: true }).click();
  await expect(page.getByText('475 XP', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Target level', exact: true }).fill('2.5');
  await page.getByRole('button', { name: 'Calculate curve', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('whole number');
  await page.getByRole('button', { name: 'Calculator: Upgrade costs', exact: true }).click();
  await page.getByRole('textbox', { name: 'Growth multiplier', exact: true }).fill('2');
  await page.getByRole('textbox', { name: 'Purchases', exact: true }).fill('3');
  await page.getByRole('button', { name: 'Calculate curve', exact: true }).click();
  await expect(page.getByText('350 coins', { exact: true })).toBeVisible();
  await expect(page.getByText(/14 minutes at your fixed earning rate/)).toBeVisible();
  await page.getByRole('button', { name: 'Calculator: Economy', exact: true }).click();
  await page.getByRole('button', { name: 'Calculate balance', exact: true }).click();
  await expect(page.getByText('+240', { exact: true })).toBeVisible();
});

test('script search, source display, and file download work', async ({ page }) => {
  await page.getByRole('tab', { name: 'Scripts', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search scripts', exact: true }).fill('zzzz');
  await expect(page.getByText('No scripts match yet.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search', exact: true }).click();
  await page.getByRole('button', { name: 'Open XP curve module', exact: true }).click();
  await expect(page.getByText('ReplicatedStorage → ModuleScript named Progression', { exact: true })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .luau', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('xp-module.luau');
  await page.getByRole('button', { name: 'Copy code', exact: true }).click();
  await expect(page.getByText('Script copied', { exact: true })).toBeVisible();
});

test('backup export, validation, cancel, and confirmed restore work', async ({ page }) => {
  await create(page, 'Keep me');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('dev-companion-backup.json');
  const { readFile } = await import('node:fs/promises');
  const downloaded = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(downloaded.projects[0].title).toBe('Keep me');
  await page.getByRole('button', { name: 'Restore from pasted text', exact: true }).click();
  await page.getByRole('textbox', { name: 'Backup JSON', exact: true }).fill('{bad');
  await page.getByRole('button', { name: 'Validate backup', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('not valid JSON');
  const backup = JSON.stringify({ version: 1, projects: [createProject('Restored build')] });
  await page.getByRole('textbox', { name: 'Backup JSON', exact: true }).fill(backup);
  await page.getByRole('button', { name: 'Validate backup', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel restore', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open project: Keep me', exact: true })).toBeVisible();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Import backup', exact: true }).click();
  await (await chooser).setFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(backup) });
  await page.getByRole('button', { name: 'Replace projects', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open project: Restored build', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open project: Keep me', exact: true })).toHaveCount(0);
});

test('screens have no runtime errors or horizontal document overflow', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', entry => { if (entry.type() === 'error' || entry.type() === 'warning') errors.push(entry.text()); });
  await page.reload();
  for (const tab of ['Ideas', 'Balance', 'Projects', 'Scripts', 'Tools']) {
    await page.getByRole('tab', { name: tab, exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  expect(errors).toEqual([]);
  await page.getByRole('tab', { name: 'Ideas', exact: true }).click();
  await page.screenshot({ path: `test-results/${info.project.name}-ideas.png`, fullPage: true });
});

test('layout fits narrow phones, tablets, and wide screens', async ({ page }) => {
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const tab of ['Ideas', 'Balance', 'Projects', 'Scripts', 'Tools']) {
      await page.getByRole('tab', { name: tab, exact: true }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    const about = await page.getByRole('button', { name: 'About this app', exact: true }).boundingBox();
    expect(about!.x + about!.width).toBeLessThanOrEqual(width);
  }
});
