import { chromium } from 'playwright';

const BASE = 'https://new-emr-rho.vercel.app';
const USER = 'admin_emr';
const PASS = 'password123';

const log = (...a) => console.log('[verify]', ...a);

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

const consoleErrors = [];
const pageErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => pageErrors.push(e.message));

// 1) Go to login
log('navigating to', BASE + '/login');
await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
log('arrived at', page.url());

// 2) Fill credentials
await page.locator('input[name="username"], input[placeholder="username"]').first().fill(USER);
await page.locator('input[type="password"], input[name="password"]').first().fill(PASS);
log('filled credentials');

// 3) Submit
await page.getByRole('button', { name: /sign in/i }).click();
log('clicked sign in, waiting for navigation...');

// 4) Wait for redirect away from /login (allow up to 30s for cold backend)
await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(2500); // let dashboard settle

const afterLoginUrl = page.url();
log('AFTER LOGIN URL:', afterLoginUrl);

// 5) Capture dashboard visibility / typeof content
const bodyText = (await page.locator('body').innerText().catch(() => ''))?.slice(0, 200);
log('DASHBOARD BODY SNIPPET:', JSON.stringify(bodyText));

await page.screenshot({ path: '/tmp/login-result.png', fullPage: false });
log('screenshot saved /tmp/login-result.png');

// 6) Now test LOGOUT (the recently fixed flow)
let afterLogoutUrl = 'n/a';
try {
  // open avatar menu then click Log out
  await page.getByRole('button').filter({ hasText: /log out/i }).first().click({ timeout: 5000 }).catch(async () => {
    // fallback: click avatar trigger then the menu item
    await page.locator('button[aria-haspopup="menu"]').first().click({ timeout: 5000 });
    await page.getByText(/log out/i).click({ timeout: 5000 });
  });
  log('clicked logout');
  await page.waitForURL((url) => url.pathname.startsWith('/login'), { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  afterLogoutUrl = page.url();
  log('AFTER LOGOUT URL:', afterLogoutUrl);
  await page.screenshot({ path: '/tmp/logout-result.png', fullPage: false });
} catch (e) {
  log('logout interaction error:', e.message);
}

log('--- CONSOLE ERRORS (' + consoleErrors.length + ') ---');
consoleErrors.slice(0, 20).forEach((e) => log('  ERR:', e));
log('--- PAGE ERRORS (' + pageErrors.length + ') ---');
pageErrors.slice(0, 20).forEach((e) => log('  PERR:', e));

await browser.close();
log('DONE');
