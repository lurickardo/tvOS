// Monta dist/app (app/ + bundle) e dist/service, prontos para o ares-package.
// Bundle único, minificado, com sintaxe rebaixada para o Chromium 53 do webOS TV 4.x (ADR 0003, 0006).
// Config pessoal do .env entra no bundle (ADR 0005): dist/ e o .ipk ficam só no seu PC e na TV.
// --serve: servidor local em http://127.0.0.1:8000 para testar no navegador do PC.
import { build, context } from 'esbuild';
import { cpSync, existsSync, rmSync } from 'node:fs';

const serve = process.argv.includes('--serve');
const debug = process.argv.includes('--debug');

if (existsSync('.env')) process.loadEnvFile('.env');
const env = (name, fallback = '') => (process.env[name] || '').trim() || fallback;
// Padrões valem se a variável faltar ou estiver vazia no .env; valor do .env sempre vence.
const config = {
  tmdbToken: env('TMDB_TOKEN'),
  city: env('CITY', 'São Vicente, São Paulo'),
  hdmi1Name: env('HDMI1_NAME', 'HDMI 1'),
  hdmi2Name: env('HDMI2_NAME', 'HDMI 2'),
};

rmSync('dist/app', { recursive: true, force: true });
rmSync('dist/service', { recursive: true, force: true });
cpSync('app', 'dist/app', { recursive: true });
cpSync('service', 'dist/service', { recursive: true });

const options = {
  entryPoints: ['src/main.ts'],
  outfile: 'dist/app/main.js',
  bundle: true,
  minify: !serve && !debug,
  sourcemap: serve, // ponytail: source map só em dev, nunca no .ipk
  format: 'iife',
  target: 'chrome53',
  define: { __TVOS_CONFIG__: JSON.stringify(config) },
  logLevel: 'info',
};

if (serve) {
  const ctx = await context(options);
  await ctx.watch();
  // Só 127.0.0.1: o bundle de dev carrega o token do .env, não pode ficar aberto na rede.
  await ctx.serve({ servedir: 'dist/app', host: '127.0.0.1', port: 8000 });
} else {
  await build(options);
}
