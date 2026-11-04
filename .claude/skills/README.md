# Skills de IA do tvOS

Skills no padrão aberto [Agent Skills](https://agentskills.io/specification): cada pasta tem um
`SKILL.md` (frontmatter `name` + `description`) e, quando precisa, `references/` com o detalhe
carregado sob demanda.

- **Regras gerais:** `CLAUDE.md` na raiz. Como escrever/manter skills: `tvos-skills`.
- **Lint:** `node scripts/check-skills.mjs`.

## Contexto

| Skill | Propósito | Quando utilizar |
|---|---|---|
| `tvos-context` | hub técnico: hardware, webOS 4.x/Chromium 53/Node 0.12, stack, mapa do repo, comandos, teclas, roteador | início de tarefa sem tema óbvio, "qual skill?", "o que a TV suporta?" |
| `tvos-produto` | visão, princípios, módulos (prateleira, destaques, painel do sistema, clima, entradas, ajustes), MVP | decidir o que construir e como a tela se comporta |

## Plataforma (TV)

| Skill | Propósito | Quando utilizar |
|---|---|---|
| `tvos-webos-api` | Luna (`src/platform/luna.ts`), catálogo de chamadas, `appinfo.json`, JS service, `/proc` | chamar API da TV, mexer em `service/` ou `appinfo.json` |
| `tvos-deploy` | Developer Mode, `npm run tv:*`, instalar/medir/inspecionar, problemas de instalação | levar o app para a TV |
| `tvos-apis-externas` | TMDB (imagens leves, token na TV), Open-Meteo, cache, CSP | filmes/séries, clima, domínio novo |

## Engenharia

| Skill | Propósito | Quando utilizar |
|---|---|---|
| `tvos-code-patterns` | boas práticas, padrões de projeto, escada do minimalismo, estrutura `src/` | escrever, refatorar ou revisar código; escolher lib/padrão |
| `tvos-performance` | orçamentos, medição na TV, técnicas (sem blur, só transform/opacity, lite) | tela/animação/imagem nova, "está lento" |
| `tvos-design-system` | dark only, tokens, layout da home, componentes, foco, a11y | qualquer UI |
| `tvos-debug` | depuração sistemática + hotspots de TV/webOS | bug sem causa óbvia |
| `tvos-verify` | gate com evidência antes de "pronto"/PR (manual: `/tvos-verify`) | fim de implementação |

## Segurança

| Skill | Propósito | Quando utilizar |
|---|---|---|
| `tvos-security` | modelo de ameaça, regras para código novo, revisão rápida de diff | rede, conteúdo externo, armazenamento, permissão, "isso é seguro?" |
| `tvos-security-audit` | auditoria profunda read-only (OWASP 2025/CWE), relatório em `.security/reports/` (manual: `/tvos-security-audit`) | antes de release, "auditoria de segurança" |

## Workflow de IA

| Skill | Propósito | Quando utilizar |
|---|---|---|
| `tvos-refine` | ideia crua → spec EARS em `context/specs/` | ideia solta, "refina essa ideia" |
| `tvos-plan-prompt` | formato Contexto/Atividade/… → plano explorar→planejar→implementar | pedido estruturado ou spec pronta |
| `tvos-adr` | decisões de arquitetura em `context/adr/` | decisão duradoura, "por que é assim?" |
| `tvos-gitflow` | branches, PR, release, tag, pipeline | antes de branch, commit, PR, merge, release |
| `tvos-toolbelt` | qual ferramenta/MCP/CLI usar | dúvida de ferramenta |
| `tvos-skills` | manter CLAUDE.md e skills; auditar skills/MCP de terceiros | editar skill, fim de feature, instalar skill |

## Contribuir

1. SKILL.md ≤ 500 linhas, frontmatter portável, roteador citando cada `references/*.md`.
2. Nova skill → linha nesta tabela + roteador de `tvos-context` + tabela de skills do `CLAUDE.md`.
3. `node scripts/check-skills.mjs` antes do commit.
