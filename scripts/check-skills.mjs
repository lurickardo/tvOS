// Trava as invariantes de arquitetura das skills (.claude/skills/) e do CLAUDE.md.
// A regra e o porquê de cada uma: skill `tvos-skills`.
// Sem isso nada quebra quando uma SKILL.md volta a crescer.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath, não `.pathname`: no Windows o pathname vira "/C:/…" e o join quebra.
const REPO = new URL('..', import.meta.url);
const ROOT = fileURLToPath(new URL('.claude/skills/', REPO));
const CATALOG = join(ROOT, 'README.md');
const CLAUDE_MD = fileURLToPath(new URL('CLAUDE.md', REPO));

const MAX_SKILL_LINES = 500;
const SUMMARY_LINES = 100;
const SUMMARY_HEADINGS = ['## Conteúdo', '## Contents'];
const MAX_DESCRIPTION = 1024; // agentskills.io; também o que claude.ai/API aceitam
const MAX_CLAUDE_MD_CHARS = 12000; // teto próprio — carregado em todo turno, não deixa inchar
// Únicas chaves aceitas por claude.ai/API além do Claude Code (agentskills.io).
const PORTABLE_KEYS = new Set(['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools']);
// Exceção local do Claude Code: tira a skill do acionamento automático (economia de tokens);
// ela continua disponível pelo /nome.
const LOCAL_KEYS = new Set(['disable-model-invocation']);
const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// A description é o único sinal de disparo: tem de dizer QUANDO usar.
const TRIGGER = /acione|consulte|use ao|use when/i;

// Skill de terceiro vendorizada (tem ATTRIBUTION.md): não se edita, então só valem as regras que
// o Claude Code precisa para carregá-la (frontmatter, nome, description) + catálogo e atribuição.
const ATTRIBUTION = 'ATTRIBUTION.md';

const fail = [];
const lines = (s) => s.split('\n').length;

/** Frontmatter YAML simples: chaves de topo + escalar dobrado (`>-`, `>`, `|`). */
function parseFrontmatter(body) {
  const match = body.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  const fields = {};
  let current = null;
  for (const line of match[1].split('\n')) {
    const key = line.match(/^([a-zA-Z][\w-]*):\s*(.*)$/);
    if (key) {
      current = key[1];
      const value = key[2].trim();
      fields[current] = /^[>|]-?$/.test(value) ? '' : value;
    } else if (current && /^\s+\S/.test(line)) {
      fields[current] = `${fields[current]} ${line.trim()}`.trim();
    }
  }
  return fields;
}

const catalog = (() => {
  try {
    return readFileSync(CATALOG, 'utf8');
  } catch {
    fail.push('.claude/skills/README.md: catálogo ausente');
    return '';
  }
})();

const skills = readdirSync(ROOT).filter((d) => statSync(join(ROOT, d)).isDirectory());

for (const skill of skills) {
  let body;
  try {
    body = readFileSync(join(ROOT, skill, 'SKILL.md'), 'utf8');
  } catch {
    fail.push(`${skill}: sem SKILL.md`);
    continue;
  }

  const fm = parseFrontmatter(body);
  if (!fm) {
    fail.push(`${skill}/SKILL.md: sem frontmatter YAML no topo`);
    continue;
  }
  const vendored = (() => {
    try {
      return statSync(join(ROOT, skill, ATTRIBUTION)).isFile();
    } catch {
      return false;
    }
  })();
  for (const key of Object.keys(fm))
    if (!PORTABLE_KEYS.has(key) && !LOCAL_KEYS.has(key))
      fail.push(`${skill}/SKILL.md: chave "${key}" não é portável (use só ${[...PORTABLE_KEYS].join(', ')})`);
  if (fm.name !== skill) fail.push(`${skill}/SKILL.md: name "${fm.name}" ≠ nome do diretório`);
  if (!NAME.test(skill)) fail.push(`${skill}: nome fora de kebab-case minúsculo`);
  const description = fm.description ?? '';
  if (!description) fail.push(`${skill}/SKILL.md: description vazia`);
  if (description.length > MAX_DESCRIPTION)
    fail.push(`${skill}/SKILL.md: description com ${description.length} chars (teto ${MAX_DESCRIPTION})`);
  if (!catalog.includes(`\`${skill}\``)) fail.push(`${skill}: ausente do catálogo .claude/skills/README.md`);
  if (vendored) {
    if (skill.startsWith('tvos-')) fail.push(`${skill}: prefixo tvos- é das skills do projeto, não de terceiro`);
    continue;
  }
  if (!skill.startsWith('tvos-'))
    fail.push(`${skill}: skill do projeto precisa do prefixo tvos- (terceiro vendorizado tem ${ATTRIBUTION})`);
  if (!TRIGGER.test(description))
    fail.push(`${skill}/SKILL.md: description não diz QUANDO usar ("Acione ao…"/"Consulte ao…")`);
  if (lines(body) > MAX_SKILL_LINES)
    fail.push(`${skill}/SKILL.md: ${lines(body)} linhas (teto ${MAX_SKILL_LINES}) — divida em references/`);

  let refs = [];
  try {
    refs = readdirSync(join(ROOT, skill, 'references')).filter((f) => f.endsWith('.md'));
  } catch {
    continue;
  }

  for (const ref of refs) {
    const text = readFileSync(join(ROOT, skill, 'references', ref), 'utf8');
    if (text.includes('references/'))
      fail.push(`${skill}/references/${ref}: cita outro references/ — um nível só; a ponte é o SKILL.md`);
    if (!body.includes(`references/${ref}`))
      fail.push(`${skill}/references/${ref}: órfão — SKILL.md não aponta para ele`);
    const hasSummary = SUMMARY_HEADINGS.some((h) => text.includes(`\n${h}\n`));
    if (lines(text) > SUMMARY_LINES && !hasSummary)
      fail.push(`${skill}/references/${ref}: ${lines(text)} linhas sem "## Conteúdo" no topo`);
  }
}

try {
  const chars = [...readFileSync(CLAUDE_MD, 'utf8')].length;
  if (chars > MAX_CLAUDE_MD_CHARS)
    fail.push(`CLAUDE.md: ${chars} chars (teto ${MAX_CLAUDE_MD_CHARS}) — mova detalhe para uma skill`);
} catch {
  fail.push('CLAUDE.md: ausente na raiz');
}

if (fail.length) {
  console.error(`Skills fora do padrão:\n${fail.map((f) => `  ✗ ${f}`).join('\n')}`);
  process.exit(1);
}
console.log(`skills ok — ${skills.length} skills, invariantes verificadas`);
