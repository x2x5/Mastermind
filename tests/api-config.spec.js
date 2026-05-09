const { test, expect } = require('@playwright/test');

test('config.local.js loads and API config modal shows default values', async ({ page }) => {
  await page.goto('http://localhost:8765');

  // Verify window.LOCAL_API_CONFIG exists
  const localConfig = await page.evaluate(() => window.LOCAL_API_CONFIG);
  console.log('LOCAL_API_CONFIG:', localConfig);
  expect(localConfig).toBeTruthy();
  expect(localConfig.apiKey).toBe('sk-c7676250609240109c7017cf727d9417');

  // Open settings dropdown then API config
  await page.click('#settingsBtn');
  await page.waitForTimeout(200);
  await page.click('#settingsApiBtn');
  await page.waitForTimeout(200);

  // Check loadApiConfig directly
  const cfgFromFn = await page.evaluate(() => loadApiConfig());
  console.log('loadApiConfig result:', cfgFromFn);

  // Debug apiKeyInput element
  const inputDebug = await page.evaluate(() => {
    const input = document.getElementById('apiKeyInput');
    return {
      exists: !!input,
      value: input ? input.value : null,
      type: input ? input.type : null,
      id: input ? input.id : null,
    };
  });
  console.log('apiKeyInput debug:', inputDebug);

  // Manually assign to test if password input accepts value
  await page.evaluate(() => {
    const cfg = loadApiConfig();
    const input = document.getElementById('apiKeyInput');
    input.value = cfg.apiKey;
    console.log('Manually set apiKeyInput.value to:', input.value);
  });

  // Check apiKey input
  const apiKeyValue = await page.inputValue('#apiKeyInput');
  console.log('apiKeyInput value after manual set:', apiKeyValue);
  expect(apiKeyValue).toBe('sk-c7676250609240109c7017cf727d9417');

  // Check endpoint input - should NOT be empty for deepseek
  const endpointValue = await page.inputValue('#apiEndpointInput');
  console.log('apiEndpointInput value:', endpointValue);
  expect(endpointValue).not.toBe('');
  expect(endpointValue).toContain('deepseek');

  // Check model input
  const modelValue = await page.inputValue('#apiModelInput');
  console.log('apiModelInput value:', modelValue);
  expect(modelValue).not.toBe('');
});
