import fs from 'node:fs';
import path from 'node:path';

/**
 * Varre o repositorio inteiro procurando texto corrompido por encoding:
 *  - mojibake  : UTF-8 lido como Latin-1 e regravado como UTF-8
 *                (acentos viram pares tipo C3+A3, emojis viram F0+9F...)
 *  - invalido  : bytes Latin-1 crus dentro de um arquivo UTF-8 (ex.: 0xE1 sozinho)
 * Com --fix, conserta os dois casos no lugar.
 */

const FIX = process.argv.includes('--fix');
const ROOT = process.argv.find(a => a.startsWith('--root='))?.slice(7) ?? '.';
const EXT = /\.(ts|tsx|js|jsx|mjs|cjs|css|scss|html|md|json|yml|yaml|env)$/i;
const SKIP = /^(node_modules|dist|build|\.git|\.next|coverage|\.turbo)$/;

const RUN = /[\u00c2-\u00f4][\u0080-\u00bf\u00c2-\u00f4]*/g;

function collect(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP.test(entry.name)) collect(full, out);
    } else if (EXT.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/** Reinterpreta bytes Latin-1 soltos como UTF-8, preservando o resto do arquivo. */
function repairInvalidBytes(buf) {
  const out = [];
  let fixed = 0;

  for (let i = 0; i < buf.length; i += 1) {
    const b = buf[i];
    if (b < 0x80) {
      out.push(b);
      continue;
    }
    const len = b >= 0xf0 ? 4 : b >= 0xe0 ? 3 : b >= 0xc2 ? 2 : 0;
    let valid = len > 0 && i + len <= buf.length;
    for (let k = 1; valid && k < len; k += 1) {
      if ((buf[i + k] & 0xc0) !== 0x80) valid = false;
    }
    if (valid) {
      for (let k = 0; k < len; k += 1) out.push(buf[i + k]);
      i += len - 1;
    } else {
      fixed += 1;
      for (const x of Buffer.from(String.fromCharCode(b), 'utf8')) out.push(x);
    }
  }

  return { buf: Buffer.from(out), fixed };
}

/** Desfaz mojibake trecho a trecho, para nao estragar texto que ja esta correto. */
function repairMojibake(text) {
  let fixed = 0;

  const pass = input =>
    input.replace(RUN, run => {
      if (Array.from(run).some(ch => ch.charCodeAt(0) > 0xff)) return run;
      const decoded = Buffer.from(Array.from(run, ch => ch.charCodeAt(0))).toString('utf8');
      if (decoded === run || decoded.includes('\uFFFD')) return run;
      fixed += 1;
      return decoded;
    });

  let result = pass(text);
  let guard = 0;
  while (guard < 4) {
    const next = pass(result);
    if (next === result) break;
    result = next;
    guard += 1;
  }

  return { text: result, fixed };
}

const files = collect(ROOT);
const report = [];

for (const file of files) {
  const originalBuf = fs.readFileSync(file);
  const { buf, fixed: byteFixes } = repairInvalidBytes(originalBuf);
  const { text, fixed: mojiFixes } = repairMojibake(buf.toString('utf8'));

  if (!byteFixes && !mojiFixes) continue;

  report.push({ file, byteFixes, mojiFixes });
  console.log(`\n=== ${path.relative(ROOT, file)}  (mojibake: ${mojiFixes}, bytes: ${byteFixes}) ===`);

  const before = originalBuf.toString('utf8').split('\n');
  const after = text.split('\n');
  let shown = 0;
  for (let i = 0; i < before.length && shown < 5; i += 1) {
    if (before[i] === after[i]) continue;
    console.log(`  L${i + 1}`);
    console.log(`    - ${before[i].trim().slice(0, 100)}`);
    console.log(`    + ${after[i].trim().slice(0, 100)}`);
    shown += 1;
  }

  if (FIX) fs.writeFileSync(file, text, 'utf8');
}

console.log(`\n${files.length} arquivos analisados | ${report.length} com problema${FIX ? ' (corrigidos)' : ''}`);
if (!FIX && report.length) console.log('Rode com --fix para gravar as correcoes.');
process.exit(!FIX && report.length ? 1 : 0);
