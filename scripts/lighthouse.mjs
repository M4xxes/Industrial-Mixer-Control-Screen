#!/usr/bin/env node
// Audit Lighthouse reproductible : build de prod (pas `npm run build`, qui échoue sur des
// erreurs tsc préexistantes sans rapport avec la perf/SEO/a11y) -> vite preview -> lighthouse CLI.
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const port = 4173;
const url = `http://localhost:${port}/`;
const reportsDir = join(rootDir, 'lighthouse-reports');
const reportPath = join(reportsDir, 'report');
const viteBin = join(rootDir, 'node_modules', '.bin', 'vite');

function run(cmd, args) {
  execFileSync(cmd, args, { cwd: rootDir, stdio: 'inherit' });
}

async function waitForServer(target, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(target);
      if (res.ok) return;
    } catch {
      // pas encore prêt
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Le serveur ${target} n'a pas répondu dans les ${timeoutMs}ms`);
}

async function main() {
  if (!existsSync(reportsDir)) mkdirSync(reportsDir);

  console.log('1/3 Build de production (vite build)...');
  run(viteBin, ['build']);

  console.log(`2/3 Démarrage de vite preview sur le port ${port}...`);
  // Appel direct du binaire vite (pas via npx) : npx laisse parfois le process réel
  // orphelin (reparenté à init), ce qui empêche preview.kill() de vraiment l'arrêter.
  const preview = spawn(viteBin, ['preview', '--port', String(port), '--strictPort'], {
    cwd: rootDir,
    stdio: 'ignore',
  });

  try {
    await waitForServer(url);

    console.log('3/3 Audit Lighthouse...');
    run('npx', [
      'lighthouse',
      url,
      '--output=html',
      '--output=json',
      `--output-path=${reportPath}`,
      '--chrome-flags=--headless=new --no-sandbox',
      '--quiet',
    ]);
  } finally {
    preview.kill('SIGKILL');
  }

  const result = JSON.parse(readFileSync(`${reportPath}.report.json`, 'utf-8'));
  console.log('\n--- Scores Lighthouse ---');
  for (const cat of Object.values(result.categories)) {
    console.log(`${cat.title.padEnd(16)} ${Math.round(cat.score * 100)}`);
  }
  console.log(`\nRapport complet : lighthouse-reports/report.report.html`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
