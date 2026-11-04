// Monta dist/app (app/ + bundle) e dist/service, prontos para o ares-package.
// Bundle único, minificado, com sintaxe rebaixada para o Chromium 79 do webOS TV 6 (ADR 0003).
// --serve: servidor local em http://localhost:8000 para testar no navegador do PC.
import { build, context } from 'esbuild';
import { cpSync, rmSync } from 'node:fs';

const serve = process.argv.includes('--serve');

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
  logLevel: 'info',
};

if (serve) {
  const ctx = await context(options);
  await ctx.watch();
  await ctx.serve({ servedir: 'dist/app', port: 8000 });
} else {
  await build(options);
}
