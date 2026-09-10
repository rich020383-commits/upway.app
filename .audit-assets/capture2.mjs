// Login robusto + captura del dashboard interior
export default async function run(page, ui) {
  const out = { steps: [] };

  // 1. Cargar login y esperar formulario
  await page.goto('http://localhost:3000/login', { waitUntil: 'load', timeout: 90000 });
  await page.waitForSelector('form', { timeout: 90000 }).catch(() => null);
  await page.waitForTimeout(6000);

  const emailInput = page.locator('input[type="email"]').first();
  const passInput = page.locator('input[type="password"]').first();
  const submit = page.locator('button[type="submit"]').first();

  await emailInput.fill('demo.auditoria@upway.business').catch(() => out.steps.push('email fill failed'));
  await passInput.fill('DemoAudit2026!').catch(() => out.steps.push('pass fill failed'));
  await submit.click().catch(() => out.steps.push('submit failed'));

  await page.waitForTimeout(10000);

  out.urlAfterLogin = page.url();
  out.cookies = (await context.cookies()).map(c => c.name).join(',');

  // 2. Reintento de fallback: si seguimos en /login, probar signIn por fetch directo
  if (page.url().includes('/login')) {
    out.loginFailed = true;
    return out;
  }

  // 3. Capturar dashboard
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(12000);
  await page.screenshot({ path: 'c:/Users/ANDRES/Upway/upway-app/.audit-assets/05-dashboard.png' });
  out.dashboardUrl = page.url();

  // 4. Centro de mando (bots)
  await page.goto('http://localhost:3000/dashboard/bots', { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(12000);
  await page.screenshot({ path: 'c:/Users/ANDRES/Upway/upway-app/.audit-assets/06-bots.png' });

  return out;
}