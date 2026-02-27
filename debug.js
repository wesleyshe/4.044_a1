const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('browser console:', msg.text()));
    page.on('pageerror', err => console.log('browser error:', err.message));
    await page.goto('http://localhost:8080');
    await page.waitForTimeout(2000);
    await browser.close();
})();
