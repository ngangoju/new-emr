import { chromium } from 'playwright';

const BASE = 'https://new-emr-rho.vercel.app';
const USER = 'admin_emr';
const PASS = 'password123';
const log = (...a) => console.log('[verify]', ...a);

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
const consoleErrors = [], pageErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => pageErrors.push(e.message));

await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
await page.locator('input[name="username"], input[placeholder="username"]').first().fill(USER);
await page.locator('input[type="password"], input[name="password"]').first().fill(PASS);
await page.getByRole('button', { name: /sign in/i }).click();
await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(2000);
log('AFTER LOGIN URL:', page.url());

// LOGOUT: open the avatar dropdown (button with the initials avatar), then click Log out
const avatarBtn = page.locator('button:has(div:has-text(/^[A-Z]{1,2}$/))').filter({ has: page.locator('img,svg,.rounded-full') }).first();
// Fallback: the header avatar trigger is a Button containing a gradient rounded-full div with initials
const trigger = page.locator('header button').filter({ hasText: /./ }).last();
await trigger.click({ timeout: 8000 }).catch(async () => { await avatarBtn.click({ timeout: 8000 }); });
await page.waitForTimeout(800);
// Now the dropdown menu item "Log out"
await page.getByRole('menuitem', { name: /log out/i }).click({ timeout: 8000 }).catch(async () => {
  await page.locator('[role="menuitem"]:has-text("Log out")').click({ timeout: 8000 });
});
log('clicked logout');

await page.waitForURL((url) => url.pathname.startsWith('/login'), { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1500);
const afterLogoutUrl = page.url();
log('AFTER LOGOUT URL:', afterLogoutUrl);

// Confirm we are NOT on a forbidden/permission page
const forbidden = await page.getByText(/you don't have permission to access that page/i).first().isVisible().catch(() => false);
log('FORBIDDEN PAGE VISIBLE:', forbidden);
await page.screenshot({ path: '/tmp/logout-result.png', fullPage: false });

log('--- CONSOLE ERRORS (' + consoleErrors.length + ') ---');
consoleErrors.slice(0, 20).forEach((e) => log('  ERR:', e));
log('--- PAGE ERRORS (' + pageErrors.length + ') ---');
pageErrors.slice(0, 20).forEach((e) => log('  PERR:', e));
await browser.close();
log('DONE');
