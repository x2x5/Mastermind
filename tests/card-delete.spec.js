const { test, expect } = require('@playwright/test');

// Helper: load page and init drawer with test data, wiring up real callbacks
async function initDrawer(page, { customStages = [], customCards = [], trashedStages = [], trashedCards = [] } = {}) {
  await page.goto('/');
  await page.waitForSelector('.canvas-nodes');
  await page.waitForTimeout(500);

  await page.evaluate(({ stages, cards, tStages, tCards }) => {
    // Mutable state stored on window
    window.__stages = stages.map(s => ({ ...s }));
    window.__cards = cards.map(c => ({ ...c }));
    window.__tStages = tStages.map(e => ({ stage: { ...e.stage }, cards: e.cards.map(c => ({ ...c })) }));
    window.__tCards = tCards.map(e => ({ card: { ...e.card } }));

    function rebuild() {
      const ordered = window.__stages.map((stage) => ({
        name: stage.name,
        cards: window.__cards.filter((c) => c.stageId === stage.id),
        stageId: stage.id,
      }));
      const trashData = [
        ...window.__tStages.map((entry, index) => ({
          type: "stage", name: entry.stage.name, cardCount: entry.cards.length, trashIndex: index,
        })),
        ...window.__tCards.map((entry, index) => ({
          type: "card", name: entry.card.title, trashIndex: index,
        })),
      ];
      CanvasApp.init(
        ordered,
        () => {},  // reorder
        () => {},  // addCard
        () => {},  // addStage
        () => {},  // deleteStage
        trashData,
        (type, idx) => {  // restore
          if (type === "card") {
            const entry = window.__tCards[idx];
            if (!entry) return;
            const card = entry.card;
            const stageExists = window.__stages.some(s => s.id === card.stageId);
            if (!stageExists) {
              let uncategorized = window.__stages.find(s => s.name === "未分类" || s.name === "Uncategorized");
              if (!uncategorized) {
                uncategorized = { id: "stage-uncat-" + Date.now(), name: "未分类", order: window.__stages.length };
                window.__stages.push(uncategorized);
              }
              card.stageId = uncategorized.id;
              card.category = uncategorized.name;
            }
            window.__cards.push({ ...card });
            window.__tCards.splice(idx, 1);
          } else {
            const entry = window.__tStages[idx];
            if (!entry) return;
            window.__stages.push({ ...entry.stage });
            window.__cards.push(...entry.cards.map(c => ({ ...c })));
            window.__tStages.splice(idx, 1);
          }
          rebuild();
        },
        () => {  // empty trash
          window.__tStages = [];
          window.__tCards = [];
          rebuild();
        },
        () => {},  // renameStage
        () => {},  // renameCard
        (cardId) => {  // deleteCard
          const card = window.__cards.find(c => c.id === cardId);
          if (card) {
            window.__tCards.push({ card: { ...card } });
            window.__cards = window.__cards.filter(c => c.id !== cardId);
          }
          rebuild();
        },
        () => {}   // moveCardToStage
      );
    }

    rebuild();
  }, { stages: customStages, cards: customCards, tStages: trashedStages, tCards: trashedCards });

  await page.waitForTimeout(300);
}

test.describe('Card delete and trash', () => {
  test('custom card has edit and delete buttons', async ({ page }) => {
    await initDrawer(page, {
      customStages: [{ id: 's1', name: 'Test Stage', order: 0 }],
      customCards: [{ id: 'c1', title: 'Test Card', category: 'Test Stage', prompt: 'Hello', stageId: 's1' }],
    });

    const stageSummary = page.locator('.cdrawer-custom > summary').first();
    await stageSummary.click();
    await page.waitForTimeout(200);

    const editBtn = page.locator('.cdrawer-item-edit').first();
    const delBtn = page.locator('.cdrawer-item-del').first();

    await expect(editBtn).toBeAttached();
    await expect(delBtn).toBeAttached();

    const editDisplay = await editBtn.evaluate(el => getComputedStyle(el).display);
    const delDisplay = await delBtn.evaluate(el => getComputedStyle(el).display);
    expect(editDisplay).toBe('flex');
    expect(delDisplay).toBe('flex');
  });

  test('deleting a card removes it from drawer', async ({ page }) => {
    await initDrawer(page, {
      customStages: [{ id: 's1', name: 'Test Stage', order: 0 }],
      customCards: [{ id: 'c1', title: 'Test Card', category: 'Test Stage', prompt: 'Hello', stageId: 's1' }],
    });

    const stageSummary = page.locator('.cdrawer-custom > summary').first();
    await stageSummary.click();
    await page.waitForTimeout(200);

    const cardItem = page.locator('.cdrawer-item[data-card-id="c1"]');
    await expect(cardItem).toBeAttached();

    await page.evaluate(() => {
      const btn = document.querySelector('.cdrawer-item[data-card-id="c1"] .cdrawer-item-del');
      if (btn) btn.click();
    });
    await page.waitForTimeout(500);

    await expect(cardItem).toHaveCount(0);

    const trashSummary = page.locator('.cdrawer-trash > summary');
    await expect(trashSummary).toBeAttached();
  });

  test('trash shows entries with icons', async ({ page }) => {
    await initDrawer(page, {
      customStages: [{ id: 's1', name: 'Active Stage', order: 0 }],
      customCards: [],
      trashedStages: [{ stage: { id: 's2', name: 'Deleted Stage', order: 1 }, cards: [] }],
      trashedCards: [{ card: { id: 'c1', title: 'Deleted Card', category: 'Test', prompt: 'Hi', stageId: 's1' } }],
    });

    const trashSummary = page.locator('.cdrawer-trash > summary');
    await expect(trashSummary).toBeAttached();
    await trashSummary.click();
    await page.waitForTimeout(200);

    const trashItems = page.locator('.cdrawer-trash-item');
    await expect(trashItems).toHaveCount(2);

    const icons = page.locator('.cdrawer-trash-icon');
    await expect(icons).toHaveCount(2);

    const texts = await trashItems.allTextContents();
    const allText = texts.join(' ');
    expect(allText).toContain('Deleted Stage');
    expect(allText).toContain('Deleted Card');
  });

  test('trash shows folder icon for stages and card icon for cards', async ({ page }) => {
    await initDrawer(page, {
      customStages: [],
      customCards: [],
      trashedStages: [{ stage: { id: 's2', name: 'Stage Trash', order: 1 }, cards: [] }],
      trashedCards: [{ card: { id: 'c1', title: 'Card Trash', category: 'Test', prompt: 'Hi', stageId: 's1' } }],
    });

    const trashSummary = page.locator('.cdrawer-trash > summary');
    await trashSummary.click();
    await page.waitForTimeout(200);

    const icons = page.locator('.cdrawer-trash-icon');
    const iconTexts = await icons.allTextContents();

    expect(iconTexts[0]).toContain('📁');
    expect(iconTexts[1]).toContain('🃏');
  });

  test('restoring card when stage is deleted creates uncategorized stage', async ({ page }) => {
    await initDrawer(page, {
      customStages: [],
      customCards: [],
      trashedStages: [{ stage: { id: 's1', name: 'Deleted Stage', order: 0 }, cards: [] }],
      trashedCards: [{ card: { id: 'c1', title: 'Orphan Card', category: 'Deleted Stage', prompt: 'Hello', stageId: 's1' } }],
    });

    // Open trash
    const trashSummary = page.locator('.cdrawer-trash > summary');
    await expect(trashSummary).toBeAttached();
    await trashSummary.click();
    await page.waitForTimeout(200);

    // Should have 2 items
    const trashItems = page.locator('.cdrawer-trash-item');
    await expect(trashItems).toHaveCount(2);

    // Restore the card (second item)
    const restoreBtns = page.locator('.cdrawer-trash-restore-btn');
    await restoreBtns.nth(1).click();
    await page.waitForTimeout(500);

    // Should have created an uncategorized stage
    const stageNames = await page.locator('.cdrawer-custom summary span').allTextContents();
    expect(stageNames.some(n => n.includes('未分类') || n.includes('Uncategorized'))).toBe(true);
  });
});
