const { test, expect } = require('@playwright/test');

// Minimal test to verify SVG pointer-events behavior
test('SVG child with pointer-events: stroke receives clicks when parent has pointer-events: none', async ({ page }) => {
  await page.setContent(`
    <div id="container" style="position: relative; width: 400px; height: 300px;">
      <div id="below" style="position: absolute; top: 50px; left: 50px; width: 200px; height: 20px; background: blue; z-index: 1; cursor: pointer;">
        click me (node)
      </div>
      <svg id="overlay" style="position: absolute; inset: 0; width: 400px; height: 300px; z-index: 2; pointer-events: none;">
        <path id="hit" d="M 20 150 L 380 150" fill="none" stroke="transparent" stroke-width="16" style="pointer-events: stroke; cursor: grab;" data-edge-id="e1"/>
        <path id="visible" d="M 20 150 L 380 150" fill="none" stroke="red" stroke-width="2" style="pointer-events: none;"/>
      </svg>
    </div>
    <div id="log"></div>
    <script>
      const log = document.getElementById('log');
      const hit = document.getElementById('hit');
      const below = document.getElementById('below');
      const overlay = document.getElementById('overlay');

      overlay.addEventListener('click', (e) => {
        const tag = e.target.tagName;
        const id = e.target.id;
        log.textContent += 'SVG-CLICK: target=' + tag + '#' + id + '\\n';
      });

      hit.addEventListener('click', (e) => {
        log.textContent += 'HIT-CLICK: target=' + e.target.id + '\\n';
      });

      below.addEventListener('click', (e) => {
        log.textContent += 'BELOW-CLICK: target=' + e.target.id + '\\n';
      });

      document.getElementById('container').addEventListener('click', (e) => {
        log.textContent += 'CONTAINER-CLICK: target=' + e.target.tagName + '#' + e.target.id + '\\n';
      });
    </script>
  `);

  // Click on the edge path (at y=150, which is on the horizontal line)
  await page.mouse.click(200, 150);
  await page.waitForTimeout(100);

  const log = await page.locator('#log').textContent();
  console.log('=== Edge click log ===');
  console.log(log);

  // Click on the blue node (at y=60, x=150, which is on the blue div)
  await page.evaluate(() => { document.getElementById('log').textContent = ''; });
  await page.mouse.click(150, 60);
  await page.waitForTimeout(100);

  const log2 = await page.locator('#log').textContent();
  console.log('=== Node click log ===');
  console.log(log2);

  // The edge click should register on the hit path, not pass through
  expect(log).toContain('HIT-CLICK');
});

test('SVG child with pointer-events: stroke receives clicks when parent has pointer-events: auto', async ({ page }) => {
  await page.setContent(`
    <div id="container" style="position: relative; width: 400px; height: 300px;">
      <div id="below" style="position: absolute; top: 50px; left: 50px; width: 200px; height: 20px; background: blue; z-index: 1; cursor: pointer;">
        click me (node)
      </div>
      <svg id="overlay" style="position: absolute; inset: 0; width: 400px; height: 300px; z-index: 2; pointer-events: auto;">
        <path id="hit" d="M 20 150 L 380 150" fill="none" stroke="transparent" stroke-width="16" style="pointer-events: stroke; cursor: grab;" data-edge-id="e1"/>
        <path id="visible" d="M 20 150 L 380 150" fill="none" stroke="red" stroke-width="2" style="pointer-events: none;"/>
      </svg>
    </div>
    <div id="log"></div>
    <script>
      const log = document.getElementById('log');
      const hit = document.getElementById('hit');
      const below = document.getElementById('below');
      const overlay = document.getElementById('overlay');

      overlay.addEventListener('click', (e) => {
        log.textContent += 'SVG-CLICK: target=' + e.target.tagName + '#' + e.target.id + '\\n';
      });

      hit.addEventListener('click', (e) => {
        log.textContent += 'HIT-CLICK: target=' + e.target.id + '\\n';
      });

      below.addEventListener('click', (e) => {
        log.textContent += 'BELOW-CLICK: target=' + e.target.id + '\\n';
      });

      document.getElementById('container').addEventListener('click', (e) => {
        log.textContent += 'CONTAINER-CLICK: target=' + e.target.tagName + '#' + e.target.id + '\\n';
      });
    </script>
  `);

  // Click on the edge path
  await page.mouse.click(200, 150);
  await page.waitForTimeout(100);

  const log = await page.locator('#log').textContent();
  console.log('=== Edge click (auto) log ===');
  console.log(log);

  // Click on empty SVG area (not on edge)
  await page.evaluate(() => { document.getElementById('log').textContent = ''; });
  await page.mouse.click(200, 250);
  await page.waitForTimeout(100);

  const log2 = await page.locator('#log').textContent();
  console.log('=== Empty SVG click (auto) log ===');
  console.log(log2);

  // Click on the blue node area
  await page.evaluate(() => { document.getElementById('log').textContent = ''; });
  await page.mouse.click(150, 60);
  await page.waitForTimeout(100);

  const log3 = await page.locator('#log').textContent();
  console.log('=== Node click (auto) log ===');
  console.log(log3);
});
