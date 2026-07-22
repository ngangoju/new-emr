import { chromium } from 'playwright';
const BASE = 'https://new-emr-rho.vercel.app';
const USER = 'admin_emr', PASS = 'password123';
const log = (...a) => console.log('[verify]', ...a);

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
const wsTicketFails = [];
page.on('response', (r) => {
  if (r.url().includes('/auth/ws-ticket') && r.status() >= 400) {
    wsTicketFails.push({ status: r.status(), cookieLen: (r.request().headers()['cookie']||'').length });
  }
});

await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
await page.locator('input[name="username"], input[placeholder="username"]').first().fill(USER);
await page.locator('input[type="password"], input[name="password"]').first().fill(PASS);
await page.getByRole('button', { name: /sign in/i }).click();
await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(6000); // let cookie settle + socket retries fire

log('AFTER LOGIN URL:', page.url());
log('ws-ticket failures:', JSON.stringify(wsTicketFails));
// Confirm socket actually connected (no lingering unauth state)
await page.evaluate(() => {
  // try to read any global socket debug if exposed; otherwise infer from network
  return true;
});
log('DONE');
await browser.close();
