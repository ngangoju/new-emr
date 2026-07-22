import { chromium } from 'playwright';
const BASE = 'https://new-emr-rho.vercel.app';
const USER = 'admin_emr', PASS = 'password123';
const log = (...a) => console.log('[verify]', ...a);

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
const wsAttempts = [];
page.on('response', (r) => {
  if (r.url().includes('/auth/ws-ticket')) {
    wsAttempts.push({ status: r.status(), cookieLen: (r.request().headers()['cookie']||'').length });
  }
});
const consoleErr = [];
page.on('console', (m) => { if (m.type()==='error') consoleErr.push(m.text()); });

await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 45000 });
await page.locator('input[name="username"], input[placeholder="username"]').first().fill(USER);
await page.locator('input[type="password"], input[name="password"]').first().fill(PASS);
await page.getByRole('button', { name: /sign in/i }).click();

// Wait up to 45s for redirect off /login (cold backend can be slow)
let redirected = false;
for (let i=0;i<45;i++){
  if (!page.url().includes('/login')) { redirected = true; break; }
  await page.waitForTimeout(1000);
}
await page.waitForTimeout(7000); // settle + let socket retries fire

log('redirected to dashboard:', redirected);
log('AFTER LOGIN URL:', page.url());
log('ws-ticket attempts:', JSON.stringify(wsAttempts));
log('console errors:', consoleErr.length, consoleErr.slice(0,5));
await browser.close();
log('DONE');
