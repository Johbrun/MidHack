// Smoke front : les 3 SPA doivent se MONTER dans un vrai navigateur, pas
// seulement compiler. Le job `build` du CI attrape les erreurs de bundling ;
// il ne voit pas un crash au rendu (ex. le bug ScrollToTop sous le Chromium de
// Burp, commit 4ac4b9e). On sert ici chaque bundle produit et on vérifie qu'il
// s'affiche sans exception non gérée.
//
// Pas de backend : les appels /api échouent, c'est attendu. On n'assert que sur
// le montage de l'app et l'absence de `pageerror` (une erreur réseau n'en est
// pas une). Prérequis : `npx playwright install chromium` (fait par le CI).
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const preview = (dir, port) =>
  `npm --prefix ${dir} run build && npm --prefix ${dir} run preview -- --port ${port} --strictPort --host 127.0.0.1`;

module.exports = defineConfig({
  testDir: __dirname,
  timeout: 30000,
  // Le build des bundles peut être long au premier lancement.
  fullyParallel: false,
  reporter: 'list',
  use: { ...devices['Desktop Chrome'] },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    { command: preview('client', 4321), url: 'http://127.0.0.1:4321', cwd: ROOT, timeout: 240000, reuseExistingServer: !process.env.CI },
    { command: preview('dashboard/client', 4322), url: 'http://127.0.0.1:4322', cwd: ROOT, timeout: 240000, reuseExistingServer: !process.env.CI },
    { command: preview('exploit-server/client', 4323), url: 'http://127.0.0.1:4323', cwd: ROOT, timeout: 240000, reuseExistingServer: !process.env.CI },
  ],
});
