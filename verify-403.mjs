import { chromium } from 'playwright';

const BASE = 'https://new-emr-rho.vercel.app';
const USER = 'admin_emr';
const PASS = 'password123';
const log = (...a) => console.log('[403]', ...a);

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

const failed = [];
page.on('response', (resp) => {
  if (resp.status() >= 400) {
    failed.push({
      status: resp.status(),
      url: resp.url(),
      reqMethod: resp.request().method(),
      reqHeaders: resp.request().headers(),
      fromFrame: resp.frame()?.url?.() || '',
    });
  }
});
page.on('requestfailed', (req) => {
  failed.push({ status: 'FAILED', url: req.url(), err: req.failure()?.errorText });
});

await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
await page.locator('input[name="username"], input[placeholder="username"]').first().fill(USER);
await page.locator('input[type="password"], input[name="password"]').first().fill(PASS);
await page.getByRole('button', { name: /sign in/i }).click();
await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(3500); // let prefetch + me settle

log('total >=400 / failed responses:', failed.length);
for (const f of failed) {
  log('---');
  log('status :', f.status);
  log('method :', f.reqMethod);
  log('url    :', f.url);
  log('frame  :', f.fromFrame);
  if (f.reqHeaders) log('authHdr:', f.reqHeaders['authorization'] || '(none)', '| cookie len:', (f.reqHeaders['cookie'] || '').length);
  if (f.err) log('err    :', f.err);
}

await browser.close();
log('DONE');
