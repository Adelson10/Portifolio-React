import { execSync } from 'node:child_process';
import { existsSync, rmSync, mkdirSync, cpSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public-build');
const SITES_DIR = path.join(ROOT, 'sites');

// Vite/React sites that need a build step
const VITE_SITES = [
  { dir: 'beeverage-loja-de-bebidas', slug: 'loja' },
  { dir: 'colegio-einstein-colinas', slug: 'colegio' },
  { dir: 'salatir-minis', slug: 'mini' },
];

// Plain static sites, copied as-is
const STATIC_SITES = [
  { dir: 'jcl-transportes', slug: 'gerador' },
];

function run(cmd, cwd) {
  console.log(`\n> [${path.basename(cwd)}] ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// main portfolio -> output root
run('npm install', ROOT);
run(`npx vite build --outDir "${OUT}" --emptyOutDir`, ROOT);

for (const { dir, slug } of VITE_SITES) {
  const siteDir = path.join(SITES_DIR, dir);
  if (!existsSync(siteDir)) {
    throw new Error(`Site folder not found: ${siteDir}`);
  }
  const target = path.join(OUT, 'sites', slug);
  run('npm install', siteDir);
  run(`npx vite build --outDir "${target}" --emptyOutDir`, siteDir);
}

for (const { dir, slug } of STATIC_SITES) {
  const siteDir = path.join(SITES_DIR, dir);
  if (!existsSync(siteDir)) {
    throw new Error(`Site folder not found: ${siteDir}`);
  }
  const target = path.join(OUT, 'sites', slug);
  mkdirSync(target, { recursive: true });
  cpSync(siteDir, target, { recursive: true });
}

console.log('\nBuild complete ->', OUT);
