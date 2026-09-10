// Script de captura: login y screenshots de las vistas interiores de Upway
export default async function run(page, ui) {
  const shots = [];

  // --- Paso 1: login ---
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('form', { timeout: 60000 });
  await page.waitForTimeout(2500);

  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passInput = page.locator('input[type="password"]').first();
  const submit = page.locator('button[type="submit"], form button').first();

  await emailInput.fill('demo.auditoria@upway.business');
  await passInput.fill('DemoAudit2026!');
  await submit.click();
  await page.waitForTimeout(8000);

  // Verificar si la sesión abrió
  const url = page.url();
  shots.push({ step: 'post-login', url });

  // Navegar a /dashboard (usa archivo de sesión)
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(10000);
  await page.screenshot({ path: 'c:/Users/ANDRES/Upway/upway-app/.audit-assets/05-dashboard.png', fullPage: false });

  await page.goto('http://localhost:3000/dashboard/bots', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(10000);
  await page.screenshot({ path: 'C:/Users/ANDRES/Upway/upway-app/.audit-assets/06-bots-centro-mando.png', fullPage: false });

  return { done: true, url };
}