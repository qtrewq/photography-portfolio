import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQ FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:8788/admin');
  
  // Wait for the Enter Admin Panel button
  await page.waitForSelector('.btn-primary');
  
  console.log("Clicking Enter Admin Panel...");
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Enter Admin Panel'));
    if (btn) btn.click();
  });
  
  // Wait a bit to catch any crashes
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
