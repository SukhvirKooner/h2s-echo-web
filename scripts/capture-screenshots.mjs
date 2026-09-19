import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'presentation-screenshots');
const BASE = 'http://localhost:5173';

const screens = [
  { name: '01-login', path: '/login', beforeLogin: true },
  { name: '02-dashboard', path: '/' },
  { name: '03-workers', path: '/workers' },
  { name: '04-worker-detail', path: null, resolve: 'worker' },
  { name: '05-shifts', path: '/shifts' },
  { name: '06-shift-detail', path: null, resolve: 'shift' },
  { name: '07-cartridges', path: '/cartridges' },
  { name: '08-cartridge-detail', path: null, resolve: 'cartridge' },
  { name: '09-exposure-records', path: '/records' },
  { name: '10-result-verification', path: '/verification' },
  { name: '11-exposure-analytics', path: '/analytics' },
  { name: '12-cartridge-lifecycle', path: '/lifecycle' },
  { name: '13-reports', path: '/reports' },
  { name: '14-reports-preview', path: '/reports', action: 'generate-report' },
  { name: '15-monitoring', path: '/monitoring' },
  { name: '16-audit-traceability', path: '/audit' },
  { name: '17-system-management', path: '/system' },
  { name: '18-no-permission', path: '/system', asSafety: true },
];

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.waitForTimeout(600);
  await page.screenshot({ path: file, fullPage: false });
  console.log('✓', name);
}

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="password"], input.font-mono', ''); // clear
  const inputs = page.locator('input');
  // email then password
  const emailInput = page.locator('input').nth(0);
  const passInput = page.locator('input[type="password"]');
  await emailInput.fill(email);
  await passInput.fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.includes('login'), { timeout: 10000 });
  await page.waitForTimeout(800);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Clear any persisted state
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());

  // 1. Login screen
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await shot(page, '01-login');

  // Login as Admin
  await login(page, 'admin@h2secho.demo', 'admin123');
  await shot(page, '02-dashboard');

  await page.goto(`${BASE}/workers`, { waitUntil: 'networkidle' });
  await shot(page, '03-workers');

  // Click first worker row
  await page.locator('table tbody tr').first().click();
  await page.waitForURL(/\/workers\//);
  await page.waitForTimeout(700);
  await shot(page, '04-worker-detail');

  await page.goto(`${BASE}/shifts`, { waitUntil: 'networkidle' });
  await shot(page, '05-shifts');

  await page.locator('table tbody tr').first().click();
  await page.waitForURL(/\/shifts\//);
  await page.waitForTimeout(700);
  await shot(page, '06-shift-detail');

  await page.goto(`${BASE}/cartridges`, { waitUntil: 'networkidle' });
  await shot(page, '07-cartridges');

  // Open drawer then full page via first row
  await page.locator('table tbody tr').first().click();
  await page.waitForTimeout(500);
  await shot(page, '08-cartridge-drawer');
  const openFull = page.getByRole('button', { name: /lifecycle|full cartridge|view lifecycle/i });
  if (await openFull.count()) {
    // navigate to a cartridge detail via store IDs in link if drawer has navigate
  }
  // Get a cartridge id from the table
  const cartId = await page.locator('table tbody tr').first().locator('.mono-id').first().textContent();
  await page.goto(`${BASE}/cartridges/${cartId?.trim()}`, { waitUntil: 'networkidle' });
  await shot(page, '08b-cartridge-detail');

  await page.goto(`${BASE}/records`, { waitUntil: 'networkidle' });
  await shot(page, '09-exposure-records');
  await page.locator('table tbody tr').first().click();
  await page.waitForTimeout(600);
  await shot(page, '09b-record-drawer');

  await page.goto(`${BASE}/verification`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await shot(page, '10-result-verification');

  await page.goto(`${BASE}/analytics`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '11-exposure-analytics');

  await page.goto(`${BASE}/lifecycle`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await shot(page, '12-cartridge-lifecycle');

  await page.goto(`${BASE}/reports`, { waitUntil: 'networkidle' });
  await shot(page, '13-reports');
  await page.getByRole('button', { name: /generate report/i }).click();
  await page.waitForTimeout(2000);
  await shot(page, '14-reports-preview');

  await page.goto(`${BASE}/monitoring`, { waitUntil: 'networkidle' });
  await shot(page, '15-monitoring');

  await page.goto(`${BASE}/audit`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  // click a chain node
  await page.getByRole('button', { name: /WORKER/i }).first().click().catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, '16-audit-traceability');

  await page.goto(`${BASE}/system`, { waitUntil: 'networkidle' });
  await shot(page, '17-system-management');

  // Safety officer no-permission
  await page.evaluate(() => localStorage.clear());
  await login(page, 'safety@h2secho.demo', 'safety123');
  await page.goto(`${BASE}/system`, { waitUntil: 'networkidle' });
  await shot(page, '18-no-permission-safety-officer');

  // Dark mode dashboard for variety
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  // theme toggle - moon/sun button in topbar
  const themeBtn = page.locator('header button').filter({ has: page.locator('svg') }).first();
  // Find moon button via title
  await page.locator('button[title="Toggle theme"]').click();
  await page.waitForTimeout(500);
  await shot(page, '19-dashboard-dark');

  await browser.close();
  console.log('\nDone →', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
