const { test, expect } = require('@playwright/test');

// Test that mimics the actual app's SVG structure more closely
test('SVG with curved paths and data-edge-id: pointer-events behavior', async ({ page }) => {
  await page.setContent(`
    <div id="canvasArea" style="position: relative; width: 800px; height: 600px; overflow: hidden;">
      <svg id="canvasArrows" style="position: absolute; inset: 0; width: 100%; height: 100%; z-index: 2; pointer-events: none;">
        <g data-edge-id="e1">
          <path d="M 200 50 C 200 100 400 100 400 150" fill="none" stroke="transparent" stroke-width="16"
                style="pointer-events: stroke; cursor: grab;" class="cedge-hit" data-edge-id="e1"/>
          <path d="M 200 50 C 200 100 400 100 400 150" fill="none" stroke="#6c757d" stroke-width="2"
                style="pointer-events: none;" class="cedge" data-edge-id="e1"/>
        </g>
      </svg>
      <div id="canvasNodes" style="position: relative; z-index: 1;">
        <div class="cnode" data-node-id="n1" style="position: absolute; left: 150px; top: 200px; width: 260px; height: 100px; background: #fff; border: 2px solid #ccc; border-radius: 8px;">
          Node 1
        </div>
      </div>
    </div>
    <div id="log"></div>
    <script>
      const log = document.getElementById('log');
      const arrowsEl = document.getElementById('canvasArrows');
      const canvasArea = document.getElementById('canvasArea');

      // Same handler as the app
      canvasArea.addEventListener('click', (e) => {
        if (e.target.closest('textarea') || e.target.closest('input') || e.target.closest('button')) return;

        const edgeEl = e.target.closest('[data-edge-id]');
        if (edgeEl && arrowsEl.contains(edgeEl)) {
          log.textContent += 'EDGE-SELECTED: ' + edgeEl.dataset.edgeId + ' (target=' + e.target.className + ')\\n';
          return;
        }

        const nodeEl = e.target.closest('.cnode');
        if (nodeEl) {
          log.textContent += 'NODE-SELECTED: ' + nodeEl.dataset.nodeId + '\\n';
          return;
        }

        log.textContent += 'CLEAR-SELECTION\\n';
      });
    </script>
  `);

  // Click on the curved edge path (midpoint of the bezier)
  // The bezier goes from (200,50) to (400,150) with control points at (200,100) and (400,100)
  // Midpoint should be around (300, 100)
  await page.mouse.click(300, 100);
  await page.waitForTimeout(100);
  const log1 = await page.locator('#log').textContent();
  console.log('=== Click on edge (300,100) ===');
  console.log(log1);

  // Clear log
  await page.evaluate(() => { document.getElementById('log').textContent = ''; });

  // Click on the node
  await page.mouse.click(280, 250);
  await page.waitForTimeout(100);
  const log2 = await page.locator('#log').textContent();
  console.log('=== Click on node (280,250) ===');
  console.log(log2);

  // Clear log
  await page.evaluate(() => { document.getElementById('log').textContent = ''; });

  // Click on empty canvas
  await page.mouse.click(600, 400);
  await page.waitForTimeout(100);
  const log3 = await page.locator('#log').textContent();
  console.log('=== Click on empty canvas (600,400) ===');
  console.log(log3);

  // Edge click should work
  expect(log1).toContain('EDGE-SELECTED');
});
