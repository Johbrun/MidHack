// Chaque SPA doit se monter sans lever d'exception au rendu. On charge la page,
// on attend que React ait peuplé #root, et on vérifie qu'aucune erreur non
// gérée (pageerror) n'a été levée. Les erreurs réseau (backend absent) ne sont
// pas des pageerror : elles ne font pas échouer le smoke.
const { test, expect } = require('@playwright/test');

const TARGETS = [
  { name: 'BananaShop (client)', url: 'http://127.0.0.1:4321/' },
  { name: 'Dashboard', url: 'http://127.0.0.1:4322/' },
  { name: 'Hacking QG (exploit-server)', url: 'http://127.0.0.1:4323/' },
];

for (const target of TARGETS) {
  test(`${target.name} se monte sans crash au rendu`, async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await page.goto(target.url, { waitUntil: 'domcontentloaded' });

    // React a peuplé le nœud de montage : l'app s'est affichée.
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15000 });

    // Aucune exception non gérée au rendu (ce qui blanchirait la page).
    expect(
      pageErrors,
      `Exceptions non gérées sur ${target.name} :\n${pageErrors.map((e) => e.message).join('\n')}`,
    ).toHaveLength(0);
  });
}
