const { test, expect } = require('@playwright/test');

async function initDrawer(page, { customStages = [], customCards = [], builtinStages = [] } = {}) {
  await page.goto('/');
  await page.waitForSelector('.canvas-nodes');
  await page.waitForTimeout(500);

  await page.evaluate(({ stages, cards, builtins }) => {
    window.__stages = stages.map(s => ({ ...s }));
    window.__cards = cards.map(c => ({ ...c }));
    window.__builtinNames = builtins;
    window.__movedCards = [];

    function rebuild() {
      const ordered = [
        ...window.__builtinNames.map(name => ({
          name,
          cards: window.__cards.filter((c) => c.category === name && !c.stageId),
        })),
        ...window.__stages.map((stage) => ({
          name: stage.name,
          cards: window.__cards.filter((c) => c.stageId === stage.id),
          stageId: stage.id,
        })),
      ];
      CanvasApp.init(
        ordered,
        () => {},
        () => {},
        () => {},
        () => {},
        [],   // trashData
        () => {},
        () => {},
        () => {},
        () => {},
        () => {},
        (cardId, newStageId) => {  // moveCardToStage
          const card = window.__cards.find(c => c.id === cardId);
          if (!card) return;
          if (newStageId.startsWith("builtin:")) {
            card.stageId = "";
            card.category = newStageId.slice(8);
          } else {
            card.stageId = newStageId;
            const st = window.__stages.find(s => s.id === newStageId);
            if (st) card.category = st.name;
          }
          window.__movedCards.push({ cardId, newStageId });
          rebuild();
        }
      );
    }
    rebuild();
  }, { stages: customStages, cards: customCards, builtins: builtinStages });

  await page.waitForTimeout(300);
}

test.describe('Card drag between stages', () => {
  test('dragging card to different stage moves it', async ({ page }) => {
    await initDrawer(page, {
      customStages: [
        { id: 's1', name: 'Stage A', order: 0 },
        { id: 's2', name: 'Stage B', order: 1 },
      ],
      customCards: [
        { id: 'c1', title: 'Card 1', category: 'Stage A', prompt: 'Hello', stageId: 's1' },
      ],
    });

    // Expand both stages
    const summaries = page.locator('.cdrawer-custom > summary');
    await summaries.nth(0).click();
    await page.waitForTimeout(200);
    await summaries.nth(1).click();
    await page.waitForTimeout(200);

    // Use JS to directly trigger the drag sequence
    const result = await page.evaluate(() => {
      const item = document.querySelector('.cdrawer-item[data-card-id="c1"]');
      if (!item) return { error: 'item not found' };

      const itemRect = item.getBoundingClientRect();

      // Dispatch mousedown on the item
      item.dispatchEvent(new MouseEvent('mousedown', {
        clientX: itemRect.left + itemRect.width / 2,
        clientY: itemRect.top + itemRect.height / 2,
        bubbles: true, cancelable: true, button: 0, buttons: 1,
      }));

      // Dispatch mousemove past threshold
      document.dispatchEvent(new MouseEvent('mousemove', {
        clientX: itemRect.left + itemRect.width / 2 + 10,
        clientY: itemRect.top + itemRect.height / 2,
        bubbles: true, button: 0, buttons: 1,
      }));

      // Get target stage rect AFTER mousedown (layout may have shifted)
      const targetStage = document.querySelector('.cdrawer-group[data-stage-id="s2"]');
      if (!targetStage) return { error: 'target stage not found after mousedown' };
      const stageRect = targetStage.getBoundingClientRect();

      // Dispatch mousemove to target stage center
      document.dispatchEvent(new MouseEvent('mousemove', {
        clientX: stageRect.left + stageRect.width / 2,
        clientY: stageRect.top + stageRect.height / 2,
        bubbles: true, button: 0, buttons: 1,
      }));

      // Dispatch mouseup
      document.dispatchEvent(new MouseEvent('mouseup', {
        clientX: stageRect.left + stageRect.width / 2,
        clientY: stageRect.top + stageRect.height / 2,
        bubbles: true, button: 0, buttons: 0,
      }));

      return { movedCards: window.__movedCards };
    });

    expect(result.movedCards).toBeDefined();
    expect(result.movedCards.length).toBe(1);
    expect(result.movedCards[0].cardId).toBe('c1');
    expect(result.movedCards[0].newStageId).toBe('s2');
  });

  test('dragging card to canvas creates node (not move)', async ({ page }) => {
    await initDrawer(page, {
      customStages: [
        { id: 's1', name: 'Stage A', order: 0 },
      ],
      customCards: [
        { id: 'c1', title: 'Card 1', category: 'Stage A', prompt: 'Hello', stageId: 's1' },
      ],
    });

    const stageSummary = page.locator('.cdrawer-custom > summary').first();
    await stageSummary.click();
    await page.waitForTimeout(200);

    const result = await page.evaluate(() => {
      const item = document.querySelector('.cdrawer-item[data-card-id="c1"]');
      if (!item) return { error: 'item not found' };

      const itemRect = item.getBoundingClientRect();

      // Dispatch mousedown on the item
      item.dispatchEvent(new MouseEvent('mousedown', {
        clientX: itemRect.left + itemRect.width / 2,
        clientY: itemRect.top + itemRect.height / 2,
        bubbles: true, cancelable: true, button: 0, buttons: 1,
      }));

      // Dispatch mousemove past threshold
      document.dispatchEvent(new MouseEvent('mousemove', {
        clientX: itemRect.left + itemRect.width / 2 + 10,
        clientY: itemRect.top + itemRect.height / 2,
        bubbles: true, button: 0, buttons: 1,
      }));

      // Get canvas rect AFTER mousedown (layout may have shifted)
      const canvas = document.querySelector('.canvas-nodes');
      if (!canvas) return { error: 'canvas not found' };
      const canvasRect = canvas.getBoundingClientRect();

      // Dispatch mousemove to canvas area
      document.dispatchEvent(new MouseEvent('mousemove', {
        clientX: canvasRect.left + canvasRect.width / 2,
        clientY: canvasRect.top + canvasRect.height / 2,
        bubbles: true, button: 0, buttons: 1,
      }));

      // Dispatch mouseup
      document.dispatchEvent(new MouseEvent('mouseup', {
        clientX: canvasRect.left + canvasRect.width / 2,
        clientY: canvasRect.top + canvasRect.height / 2,
        bubbles: true, button: 0, buttons: 0,
      }));

      return { movedCards: window.__movedCards };
    });

    expect(result.movedCards).toBeDefined();
    expect(result.movedCards.length).toBe(0);

    // Verify a node was created on the canvas
    await page.waitForTimeout(300);
    const nodes = page.locator('.cnode');
    const count = await nodes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('card is hidden during drag', async ({ page }) => {
    await initDrawer(page, {
      customStages: [
        { id: 's1', name: 'Stage A', order: 0 },
        { id: 's2', name: 'Stage B', order: 1 },
      ],
      customCards: [
        { id: 'c1', title: 'Card 1', category: 'Stage A', prompt: 'Hello', stageId: 's1' },
      ],
    });

    const summaries = page.locator('.cdrawer-custom > summary');
    await summaries.nth(0).click();
    await page.waitForTimeout(200);

    const cardItem = page.locator('.cdrawer-item[data-card-id="c1"]');
    const cardBox = await cardItem.boundingBox();

    // Start drag
    await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(cardBox.x + cardBox.width / 2 + 20, cardBox.y + cardBox.height / 2, { steps: 3 });

    // Card should be hidden during drag
    const display = await cardItem.evaluate(el => el.style.display);
    expect(display).toBe('none');

    // Ghost should be visible
    const ghost = page.locator('.cdrawer-ghost');
    await expect(ghost).toBeAttached();

    // Release
    await page.mouse.up();
    await page.waitForTimeout(500);

    // Card should be visible again after drag
    const displayAfter = await cardItem.evaluate(el => el.style.display);
    expect(displayAfter).toBe('');
  });

  test('dragging custom card to built-in stage moves it', async ({ page }) => {
    await initDrawer(page, {
      builtinStages: ['Built-in Stage'],
      customStages: [
        { id: 's1', name: 'My Stage', order: 0 },
      ],
      customCards: [
        { id: 'c1', title: 'My Card', category: 'My Stage', prompt: 'Hello', stageId: 's1' },
      ],
    });

    // Expand the custom stage to see the card
    const customSummary = page.locator('.cdrawer-custom > summary').first();
    await customSummary.click();
    await page.waitForTimeout(200);

    // Expand the built-in stage
    const builtinSummary = page.locator('.cdrawer-group:not(.cdrawer-custom) > summary').first();
    await builtinSummary.click();
    await page.waitForTimeout(200);

    const result = await page.evaluate(() => {
      const item = document.querySelector('.cdrawer-item[data-card-id="c1"]');
      if (!item) return { error: 'item not found' };

      const itemRect = item.getBoundingClientRect();

      item.dispatchEvent(new MouseEvent('mousedown', {
        clientX: itemRect.left + itemRect.width / 2,
        clientY: itemRect.top + itemRect.height / 2,
        bubbles: true, cancelable: true, button: 0, buttons: 1,
      }));

      document.dispatchEvent(new MouseEvent('mousemove', {
        clientX: itemRect.left + itemRect.width / 2 + 10,
        clientY: itemRect.top + itemRect.height / 2,
        bubbles: true, button: 0, buttons: 1,
      }));

      // Find the built-in stage element
      const builtinStage = document.querySelector('.cdrawer-group[data-stage-id^="builtin:"]');
      if (!builtinStage) return { error: 'builtin stage not found' };
      const stageRect = builtinStage.getBoundingClientRect();

      document.dispatchEvent(new MouseEvent('mousemove', {
        clientX: stageRect.left + stageRect.width / 2,
        clientY: stageRect.top + stageRect.height / 2,
        bubbles: true, button: 0, buttons: 1,
      }));

      document.dispatchEvent(new MouseEvent('mouseup', {
        clientX: stageRect.left + stageRect.width / 2,
        clientY: stageRect.top + stageRect.height / 2,
        bubbles: true, button: 0, buttons: 0,
      }));

      const card = window.__cards.find(c => c.id === 'c1');
      return { movedCards: window.__movedCards, card };
    });

    expect(result.movedCards.length).toBe(1);
    expect(result.movedCards[0].newStageId).toBe('builtin:Built-in Stage');
    expect(result.card.stageId).toBe('');
    expect(result.card.category).toBe('Built-in Stage');
  });
});
