// Monta dist/app (app/ + bundle) e dist/service, prontos para o ares-package.
// Bundle único, minificado, com sintaxe rebaixada para o Chromium 79 do webOS TV 6 (ADR 0003).
// Config pessoal do .env entra no bundle (ADR 0005): dist/ e o .ipk ficam só no seu PC e na TV.
// --serve: servidor local em http://127.0.0.1:8000 para testar no navegador do PC.
import { build, context } from 'esbuild';
import { cpSync, existsSync, rmSync } from 'node:fs';

const serve = process.argv.includes('--serve');

if (existsSync('.env')) process.loadEnvFile('.env');
const env = (name) => (process.env[name] || '').trim();
const config = {
  tmdbToken: env('TMDB_TOKEN'),
  city: env('CITY'),
  hdmi1Name: env('HDMI1_NAME'),
  hdmi2Name: env('HDMI2_NAME'),
};

rmSync('dist/app', { recursive: true, force: true });
rmSync('dist/service', { recursive: true, force: true });
cpSync('app', 'dist/app', { recursive: true });
cpSync('service', 'dist/service', { recursive: true });

const options = {
  entryPoints: ['src/main.ts'],
  outfile: 'dist/app/main.js',
  bundle: true,
  minify: !serve,
  sourcemap: serve, // ponytail: source map só em dev, nunca no .ipk
  format: 'iife',
  target: 'chrome79',
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
