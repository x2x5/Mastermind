const { test, expect } = require('@playwright/test');

test.describe('Canvas fixes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.canvas-nodes');
    await page.waitForSelector('.canvas-arrows');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await page.waitForSelector('.canvas-nodes');
    await page.waitForTimeout(500);
  });

  test('start node is selectable with green border', async ({ page }) => {
    const startNode = page.locator('.cnode-start');
    await expect(startNode).toBeVisible();
    await startNode.click({ force: true });
    await page.waitForTimeout(200);
    await expect(startNode).toHaveClass(/selected/);
    const borderColor = await startNode.evaluate((el) => getComputedStyle(el).borderColor);
    expect(borderColor).toContain('31');
  });

  test('edge is clickable and selectable via real click', async ({ page }) => {
    await page.evaluate(() => {
      const items = [
        { id: 'c1', title: '卡片A', category: '阶段 1：调研选题' },
        { id: 'c2', title: '卡片B', category: '阶段 1：调研选题' },
      ];
      CanvasApp.setAllItems(items);
      CanvasApp.addPipeline([
        { title: '卡片A', label: '' },
        { title: '卡片B', label: '' },
      ]);
    });
    await page.waitForTimeout(500);

    const edgeHits = page.locator('.cedge-hit');
    const count = await edgeHits.count();
    expect(count).toBeGreaterThan(0);

    // Get a point that's actually on the path stroke
    const point = await edgeHits.first().evaluate((el) => {
      const len = el.getTotalLength();
      const pt = el.getPointAtLength(len / 2);
      // Convert SVG point to screen coordinates
      const svg = el.ownerSVGElement;
      const ctm = el.getScreenCTM();
      const screenPt = svg.createSVGPoint();
      screenPt.x = pt.x;
      screenPt.y = pt.y;
      const transformed = screenPt.matrixTransform(ctm);
      return { x: transformed.x, y: transformed.y };
    });

    // Click at the exact point on the path
    await page.mouse.click(point.x, point.y);
    await page.waitForTimeout(300);

    // Verify selected
    const selectedEdge = page.locator('.cedge.selected');
    const selectedCount = await selectedEdge.count();
    expect(selectedCount).toBeGreaterThan(0);
  });

  test('clicking node area selects the node', async ({ page }) => {
    await page.evaluate(() => {
      const items = [
        { id: 'c1', title: '卡片A', category: '阶段 1：调研选题' },
        { id: 'c2', title: '卡片B', category: '阶段 1：调研选题' },
      ];
      CanvasApp.setAllItems(items);
      CanvasApp.addPipeline([
        { title: '卡片A', label: '' },
        { title: '卡片B', label: '' },
      ]);
    });
    await page.waitForTimeout(500);

    const nodes = page.locator('.cnode:not(.cnode-start):not(.cnode-end)');
    const count = await nodes.count();
    expect(count).toBeGreaterThan(0);

    await nodes.first().click({ force: true });
    await page.waitForTimeout(200);
    await expect(nodes.first()).toHaveClass(/selected/);
  });

  test('format button arranges nodes in layers', async ({ page }) => {
    await page.evaluate(() => {
      const items = [
        { id: 'c1', title: '卡片A', category: '阶段 1：调研选题' },
        { id: 'c2', title: '卡片B', category: '阶段 1：调研选题' },
      ];
      CanvasApp.setAllItems(items);
      CanvasApp.addPipeline([
        { title: '卡片A', label: '' },
        { title: '卡片B', label: '' },
      ]);
    });
    await page.waitForTimeout(500);

    await page.locator('#layoutCanvasBtn').click();
    await page.waitForTimeout(500);

    const nodes = page.locator('.cnode:not(.cnode-start)');
    const count = await nodes.count();
    expect(count).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < count; i++) {
      const style = await nodes.nth(i).getAttribute('style');
      expect(style).toBeTruthy();
    }
  });

  test('stage name is editable by double-click', async ({ page }) => {
    const addStageBtn = page.locator('.cdrawer-add-stage-btn');
    await addStageBtn.click();
    await page.waitForTimeout(300);

    const stageName = page.locator('.cdrawer-stage-name').first();
    await expect(stageName).toBeVisible();

    await stageName.dblclick();
    await page.waitForTimeout(100);

    const isEditable = await stageName.getAttribute('contenteditable');
    expect(isEditable).toBe('true');

    await stageName.evaluate((el) => { el.textContent = ''; });
    await page.keyboard.type('测试阶段');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    const text = await stageName.textContent();
    expect(text).toBe('测试阶段');
  });
});
