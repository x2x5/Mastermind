const { test, expect } = require('@playwright/test');

test('rejects cross-layer edges in AI-generated layout', async ({ page }) => {
  await page.goto('http://localhost:8765');

  // Capture page console logs
  const pageLogs = [];
  page.on('console', msg => pageLogs.push(msg.text()));

  // Wait for page to fully load
  await page.waitForTimeout(1000);

  // Verify LOCAL_API_CONFIG is loaded (API key from config.local.js)
  const localConfig = await page.evaluate(() => window.LOCAL_API_CONFIG);
  expect(localConfig).toBeTruthy();
  expect(localConfig.apiKey).toBeTruthy();

  // Intercept API calls to deepseek endpoint
  await page.route('https://api.deepseek.com/v1/chat/completions', async (route) => {
    const mockResponse = `测试跨层\n[\n  { "title": "检索文献", "label": "", "stage": "阶段 1：调研选题", "level": 0, "dependsOn": [] },\n  { "title": "精读论文", "label": "", "stage": "阶段 1：调研选题", "level": 1, "dependsOn": [0] },\n  { "title": "设计方法架构", "label": "", "stage": "阶段 3：设计方法", "level": 3, "dependsOn": [0] }\n]`;

    const json = JSON.stringify({ choices: [{ delta: { content: mockResponse } }] });
    const chunks = `data: ${json}\n\ndata: [DONE]\n\n`;

    route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      body: chunks,
    });
  });

  // Click AI wand button to open modal
  await page.click('#aiWandBtn');
  await page.waitForTimeout(300);

  // Type input
  await page.fill('#aiWandInput', '写一篇短文');
  await page.waitForTimeout(200);

  // Click generate button
  await page.click('#aiWandGenerateBtn');

  // Wait for generation and animation to complete
  await page.waitForTimeout(8000);

  // Print captured page console logs
  console.log('=== Page console logs ===');
  pageLogs.forEach(log => console.log(log));
  console.log('=== End page logs ===');

  // Get canvas state
  const state = await page.evaluate(() => CanvasApp.getState());
  console.log('Nodes:', state.nodes.map(n => ({ id: n.id, cardId: n.cardId, level: n.level })));
  console.log('Edges:', state.edges.map(e => ({ from: e.from, to: e.to })));

  // Get pipeline nodes (non-start nodes)
  const pipelineNodes = state.nodes.filter(n => n.cardId !== '__start__');
  expect(pipelineNodes.length).toBe(3);

  const node0 = pipelineNodes[0]; // 检索文献, level 0
  const node1 = pipelineNodes[1]; // 精读论文, level 1
  const node2 = pipelineNodes[2]; // 设计方法架构, level 3

  expect(node0.level).toBe(0);
  expect(node1.level).toBe(1);
  expect(node2.level).toBe(3);

  // Valid edge: node0 (level 0) → node1 (level 1): difference = 1, VALID
  const validEdge = state.edges.find(e => e.from === node0.id && e.to === node1.id);
  expect(validEdge).toBeTruthy();

  // Cross-layer edge should NOT exist:
  // node0 (level 0) → node2 (level 3): difference = 3, NOT 1, should be REJECTED
  const crossLayerEdge = state.edges.find(e => e.from === node0.id && e.to === node2.id);
  expect(crossLayerEdge).toBeFalsy();

  // Verify console log shows the cross-layer skip
  const hasSkipLog = pageLogs.some(log =>
    log.includes('Skip cross-layer edge') && log.includes('levels 0→3')
  );
  expect(hasSkipLog).toBe(true);
});
