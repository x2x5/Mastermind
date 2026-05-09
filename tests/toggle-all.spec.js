const { test, expect } = require('@playwright/test');

test.describe('Toggle all stages button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.canvas-nodes');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await page.waitForSelector('.canvas-nodes');
    await page.waitForTimeout(800);
  });

  test('button is visible on page load with correct icon', async ({ page }) => {
    const btn = page.locator('.cdrawer-toggle-all');
    await expect(btn).toBeVisible();

    // Button should have an SVG icon (not empty)
    const innerHTML = await btn.innerHTML();
    expect(innerHTML).toContain('<svg');

    // Title should be set (collapseAll or expandAll)
    const title = await btn.getAttribute('title');
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('expand all then collapse all cycle', async ({ page }) => {
    const btn = page.locator('.cdrawer-toggle-all');
    await expect(btn).toBeVisible();

    const totalDetails = await page.evaluate(() => {
      return document.querySelectorAll('details.cdrawer-group').length;
    });
    expect(totalDetails).toBeGreaterThan(0);

    // Initially all stages should be closed
    const openInit = await page.evaluate(() => {
      return document.querySelectorAll('details.cdrawer-group[open]').length;
    });
    expect(openInit).toBe(0);

    // Button should say "expand all"
    const titleInit = await btn.getAttribute('title');
    expect(titleInit).toMatch(/展开|Expand/i);

    // Click expand all
    await btn.click();
    await page.waitForTimeout(300);

    // All stages should be open
    const openAfterExpand = await page.evaluate(() => {
      return document.querySelectorAll('details.cdrawer-group[open]').length;
    });
    expect(openAfterExpand).toBe(totalDetails);

    // Button should now say "collapse all"
    const titleAfterExpand = await btn.getAttribute('title');
    expect(titleAfterExpand).toMatch(/折叠|Collapse/i);

    // Click collapse all
    await btn.click();
    await page.waitForTimeout(300);

    // All stages should be closed
    const openAfterCollapse = await page.evaluate(() => {
      return document.querySelectorAll('details.cdrawer-group[open]').length;
    });
    expect(openAfterCollapse).toBe(0);

    // Button should say "expand all" again
    const titleAfterCollapse = await btn.getAttribute('title');
    expect(titleAfterCollapse).toMatch(/展开|Expand/i);
  });

  test('button icon changes after toggle', async ({ page }) => {
    const btn = page.locator('.cdrawer-toggle-all');
    await expect(btn).toBeVisible();

    const iconBefore = await btn.innerHTML();

    // Click to toggle
    await btn.click();
    await page.waitForTimeout(300);

    const iconAfter = await btn.innerHTML();

    // Icon should change (collapse vs expand have different path data)
    expect(iconBefore).not.toBe(iconAfter);
  });

  test('button stays in sync when individual stage is toggled via click', async ({ page }) => {
    const btn = page.locator('.cdrawer-toggle-all');
    await expect(btn).toBeVisible();

    // Expand all first
    await btn.click();
    await page.waitForTimeout(300);

    // Button should be in collapse state
    const title1 = await btn.getAttribute('title');
    expect(title1).toMatch(/折叠|Collapse/i);

    // Click the first stage summary to close it (fires toggle event)
    const firstSummary = page.locator('details.cdrawer-group > summary').first();
    await firstSummary.click();
    await page.waitForTimeout(300);

    // Button should still be in collapse state (some stages are still open)
    const title2 = await btn.getAttribute('title');
    expect(title2).toMatch(/折叠|Collapse/i);
  });
});
